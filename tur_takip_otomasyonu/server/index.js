const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn, execSync } = require('child_process');

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
const PYTHON_PORT = parseInt(process.env.PYTHON_PORT || '8080', 10);

// ─── AUTO-START PYTHON RENT A CAR BACKEND (WAITRESS) ───
let pythonProcess = null;
let isInstallingPythonDeps = false;

function resolvePythonCommand(rentACarDir) {
    const winVenvPython = path.resolve(__dirname, '../../.venv/Scripts/python.exe');
    const linuxVenvPython = path.resolve(__dirname, '../../.venv/bin/python');
    if (fs.existsSync(winVenvPython)) return winVenvPython;
    if (fs.existsSync(linuxVenvPython)) return linuxVenvPython;
    return process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
}

function ensurePythonEnvironment(rentACarDir) {
    let pyCmd = resolvePythonCommand(rentACarDir);
    try {
        execSync(`"${pyCmd}" -c "import flask, flask_sqlalchemy, flask_login, flask_wtf, jwt, cryptography, pyotp, bcrypt"`, {
            stdio: 'ignore'
        });
        return pyCmd;
    } catch (_) {
        if (isInstallingPythonDeps) return pyCmd;
        isInstallingPythonDeps = true;
        console.log('[Python Gateway] Python paketleri eksik, otomatik kuruluyor...');
        const rootDir = path.resolve(__dirname, '../..');
        const reqFile = path.join(rentACarDir, 'requirements.txt');
        try {
            if (process.platform !== 'win32') {
                const venvDir = path.join(rootDir, '.venv');
                if (!fs.existsSync(path.join(venvDir, 'bin/python'))) {
                    try {
                        execSync(`python3 -m venv "${venvDir}"`, { stdio: 'inherit' });
                    } catch (ve) {
                        console.warn('[Python Gateway] venv oluşturulamadı, --user ile devam edilecek:', ve.message);
                    }
                }
                if (fs.existsSync(path.join(venvDir, 'bin/pip'))) {
                    execSync(`"${path.join(venvDir, 'bin/pip')}" install --no-cache-dir -r "${reqFile}"`, { stdio: 'inherit' });
                    isInstallingPythonDeps = false;
                    return path.join(venvDir, 'bin/python');
                }
                try {
                    execSync(`pip3 install --no-cache-dir --break-system-packages -r "${reqFile}"`, { stdio: 'inherit' });
                } catch (_) {
                    execSync(`pip3 install --no-cache-dir --user -r "${reqFile}"`, { stdio: 'inherit' });
                }
            } else {
                execSync(`pip install -r "${reqFile}"`, { stdio: 'inherit' });
            }
        } catch (installErr) {
            console.error('[Python Gateway] Otomatik pip kurulum uyarısı:', installErr.message);
        }
        isInstallingPythonDeps = false;
        return resolvePythonCommand(rentACarDir);
    }
}

function startPythonBackend() {
    if (process.env.SKIP_PYTHON_SPAWN === 'true') return;

    const rentACarDir = path.resolve(__dirname, '../../rent_a_car');
    const serveScript = path.join(rentACarDir, 'serve.py');
    if (!fs.existsSync(serveScript)) {
        console.warn('[Python Gateway] rent_a_car/serve.py bulunamadı, Python servisi başlatılmadı.');
        return;
    }

    const pythonCmd = ensurePythonEnvironment(rentACarDir);

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

// ─── NATIVE REVERSE PROXY: RENT A CAR (FLASK) ROTALARI ───
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
    if (!pathname || pathname === '/') return false;
    if (pathname === '/sso-login') {
        const fullUrl = req.originalUrl || req.url || '';
        return req.method === 'POST' || fullUrl.includes('token=');
    }
    return PYTHON_PATH_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
    );
};

function forwardToPython(req, res, bodyBuffer, attempt = 1) {
    const forwardHeaders = {
        ...req.headers,
        'x-forwarded-host': req.headers['x-forwarded-host'] || req.headers.host || '',
        'x-forwarded-proto': req.headers['x-forwarded-proto'] || req.protocol || 'http',
        'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip || '127.0.0.1'
    };

    const options = {
        hostname: '127.0.0.1',
        port: PYTHON_PORT,
        path: req.originalUrl || req.url,
        method: req.method,
        headers: forwardHeaders
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode || 200);
        Object.entries(proxyRes.headers).forEach(([key, val]) => {
            if (val !== undefined) {
                res.setHeader(key, val);
            }
        });
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        if (attempt < 10) {
            setTimeout(() => forwardToPython(req, res, bodyBuffer, attempt + 1), 1000);
        } else {
            console.error(`[Proxy Error] ${req.method} ${req.originalUrl} -> ${err.message}`);
            if (!res.headersSent) {
                res.status(502).send('Rent A Car servisi şu anda hazırlanıyor, lütfen birkaç saniye sonra sayfayı yenileyin.');
            }
        }
    });

    if (bodyBuffer && bodyBuffer.length > 0) {
        proxyReq.write(bodyBuffer);
    }
    proxyReq.end();
}

app.use((req, res, next) => {
    if (!shouldProxyToPython(req.path, req)) {
        return next();
    }
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
        const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : null;
        forwardToPython(req, res, bodyBuffer, 1);
    });
    req.on('error', (err) => next(err));
});

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

    try {
        await initDatabase();
        const { initMaster } = require('./config/db');
        await initMaster();
    } catch (err) {
        console.error('[Server Start Error]:', err.message);
    }

    // Python Rent A Car sunucusunu başlat
    startPythonBackend();
});

process.on('unhandledRejection', (reason) => {
    console.error('[Unhandled Rejection] Sebep:', reason);
});
