const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// express-rate-limit: Kurulu değilse uyarı ver, fallback ile devam et
let rateLimit;
try {
    rateLimit = require('express-rate-limit');
} catch (e) {
    console.warn('[Security] express-rate-limit paketi bulunamadı. Rate limiting devre dışı.');
    rateLimit = () => (req, res, next) => next();
}

require('dotenv').config();

if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'zyronova_jwt_secret_key_7a9d8c6b2e1f4a';
}

const { initDatabase } = require('./config/initDB');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const PYTHON_PORT = process.env.PYTHON_PORT || '8080';
const PYTHON_TARGET = `http://127.0.0.1:${PYTHON_PORT}`;

// ─── AUTO-START PYTHON RENT A CAR BACKEND (WAITRESS) ───
let pythonProcess = null;
function startPythonBackend() {
    if (process.env.SKIP_PYTHON_SPAWN === 'true') return;

    const rentACarDir = path.resolve(__dirname, '../../rent_a_car');
    const serveScript = path.join(rentACarDir, 'serve.py');
    if (!fs.existsSync(serveScript)) {
        console.warn('[Python Gateway] rent_a_car/serve.py bulunamadı, Python servisi başlatılmadı.');
        return;
    }

    // Venv varsa onu kullan, yoksa sistem python/python3 kullan
    const winVenvPython = path.resolve(__dirname, '../../.venv/Scripts/python.exe');
    const linuxVenvPython = path.resolve(__dirname, '../../.venv/bin/python');
    let pythonCmd = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
    if (fs.existsSync(winVenvPython)) pythonCmd = winVenvPython;
    else if (fs.existsSync(linuxVenvPython)) pythonCmd = linuxVenvPython;

    console.log(`[Python Gateway] Rent A Car servisi başlatılıyor (${pythonCmd} serve.py -> 127.0.0.1:${PYTHON_PORT})...`);
    pythonProcess = spawn(pythonCmd, ['serve.py'], {
        cwd: rentACarDir,
        env: {
            ...process.env,
            PYTHON_PORT: String(PYTHON_PORT),
            JWT_SECRET: process.env.JWT_SECRET,
            PYTHONIOENCODING: 'utf-8'
        },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    pythonProcess.stdout.on('data', (data) => {
        process.stdout.write(`[RentACar-Py] ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        process.stderr.write(`[RentACar-Py] ${data}`);
    });

    pythonProcess.on('exit', (code) => {
        console.warn(`[Python Gateway] Rent A Car servisi kapandı (kod: ${code}). 3 sn içinde yeniden başlatılıyor...`);
        setTimeout(startPythonBackend, 3000);
    });
}

process.on('exit', () => {
    if (pythonProcess) {
        try { pythonProcess.kill(); } catch (e) {}
    }
});

// ─── REVERSE PROXY: RENT A CAR (FLASK) ROTALARI ───
const { createProxyMiddleware } = require('http-proxy-middleware');

const PYTHON_PATH_PREFIXES = [
    '/py-api',
    '/api/diagnostics',
    '/login',
    '/logout',
    '/2fa',
    '/sifre-degistir',
    '/dashboard',
    '/ajax',
    '/profil',
    '/personel',
    '/ciro_analiz',
    '/logs',
    '/ayarlar',
    '/dismiss_alert',
    '/clear_all_alerts',
    '/kvkk-aydinlatma-metni',
    '/araclar',
    '/kiralamalar',
    '/servis',
    '/kiralama_arac_km',
    '/master',
    '/ai-settings',
    '/geciken-araclar',
    '/rapor',
    '/excel',
    '/destek',
    '/static',
    '/sw.js',
    '/manifest.json'
];

const shouldProxyToPython = (pathname, req) => {
    if (pathname === '/sso-login') {
        const fullUrl = req.originalUrl || req.url || '';
        return req.method === 'POST' || fullUrl.includes('token=');
    }
    return PYTHON_PATH_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
    );
};

app.use(
    createProxyMiddleware({
        target: PYTHON_TARGET,
        changeOrigin: false,
        xfwd: true,
        pathFilter: shouldProxyToPython,
        on: {
            error: (err, req, res) => {
                console.error(`[Proxy Error] ${req.method} ${req.url} -> ${err.message}`);
                if (!res.headersSent) {
                    res.status(502).send('Rent A Car servisi şu anda hazırlanıyor, lütfen birkaç saniye sonra sayfayı yenileyin.');
                }
            }
        }
    })
);

// ─── CORS ───
const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ||
    'http://localhost:3000,http://localhost:5173,http://localhost:5000,http://localhost:5001,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5000,http://127.0.0.1:5001'
)
    .split(',')
    .map((o) => o.trim());

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);

            const allowedDomainRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)*(zyronova\.(com|com\.tr)|onrender\.com)(:\d+)?$/;
            if (allowedDomainRegex.test(origin)) return callback(null, true);

            const localNetworkRegex = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
            if (localNetworkRegex.test(origin)) return callback(null, true);

            callback(null, true);
        },
        credentials: true
    })
);

// ─── HELMET: Güvenlik başlıkları ───
const isProduction = process.env.NODE_ENV === 'production';

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    })
);

const getCleanIP = (req) => {
    let ip = req.headers['x-forwarded-for'] || req.ip || (req.connection && req.connection.remoteAddress) || '127.0.0.1';
    if (ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }
    if (ip.includes(':') && ip.includes('.')) {
        const parts = ip.split(':');
        ip = parts[parts.length - 2].includes('.') ? parts[parts.length - 2] : parts[parts.length - 1];
    }
    return ip.replace(/[\[\]]/g, '').trim();
};

// ─── RATE LIMITING ───
const loginLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '30'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getCleanIP,
    message: { error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' }
});

const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getCleanIP,
    message: { error: 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.' }
});

app.use(express.json({ limit: '2mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use('/api/', generalLimiter);

// ─── ROTALAR ───
const superAdminRoutes = require('./routes/superAdminRoutes');
const agencyRoutes = require('./routes/agencyRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const supportRoutes = require('./routes/supportRoutes');
const aiRoutes = require('./routes/aiRoutes');

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/demo-login', loginLimiter);
app.use('/api/auth/2fa/login', loginLimiter);
app.use('/api/auth/forgot-password', loginLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/ai', aiRoutes);

const { authenticate } = require('./middleware/auth');
app.use('/uploads', authenticate, express.static(path.join(__dirname, 'uploads')));

// Dist klasöründeki statik dosyaları (assets, js, css) servis et
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath, { index: false }));

// ANA SAYFA: Zyronova Landing Page (sadece '/' yolunda)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../zyronova_premium.html'));
});

// React Router için catch-all
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
});

// ─── HATA YAKALAMA ───
app.use((err, req, res, next) => {
    if (err.message && err.message.startsWith('CORS politikası')) {
        return res.status(403).json({ error: 'Bu kaynağa erişim reddedildi.' });
    }
    console.error('[Server Error]', err.stack);
    if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'Sunucu hatası oluştu.' });
    }
    res.status(500).json({ error: err.message || 'Sunucu hatası oluştu.' });
});

app.listen(PORT, async () => {
    console.log(`[Server] ${PORT} portunda çalışıyor. Ortam: ${process.env.NODE_ENV || 'development'}`);

    // Python Rent A Car sunucusunu başlat
    startPythonBackend();

    try {
        await initDatabase();
        const { initMaster } = require('./config/db');
        await initMaster();
    } catch (err) {
        console.error('[Server Start Error]:', err.message);
    }
});

process.on('unhandledRejection', (reason) => {
    console.error('[Unhandled Rejection] Sebep:', reason);
});
