const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// express-rate-limit: Kurulu değilse uyarı ver, fallback ile devam et
let rateLimit;
try {
    rateLimit = require('express-rate-limit');
} catch (e) {
    console.warn('[Security] express-rate-limit paketi bulunamadı. Rate limiting devre dışı. Kurmak için: npm install express-rate-limit');
    // Fallback: no-op middleware
    rateLimit = (opts) => (req, res, next) => next();
}

require('dotenv').config();
const { initDatabase } = require('./config/initDB');


const app = express();
app.set('trust proxy', 1);

const { createProxyMiddleware } = require('http-proxy-middleware');
app.use('/py-api', createProxyMiddleware({
    target: 'http://127.0.0.1:5001',
    changeOrigin: true
}));

const PORT = process.env.PORT || 5000;

// â”€â”€â”€ CORS: Sadece izin verilen origin'lere izin ver â”€â”€â”€
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5000,http://localhost:5001,http://127.0.0.1:5173,http://127.0.0.1:5000,http://127.0.0.1:5001')
    .split(',').map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Origin yoksa (server-to-server, Postman vb.)
        if (!origin) {
            // Sadece development ortamında origin'siz isteklere izin ver
            if (process.env.NODE_ENV !== 'production') return callback(null, true);
            return callback(new Error(`CORS politikası: Kaynak (Origin) belirtilmemiş isteklere izin verilmiyor.`));
        }

        // Whitelist kontrolü
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Production / SaaS subdomain kontrolü
        const allowedDomainRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)*zyronova\.(com|com\.tr)(:\d+)?$/;
        if (allowedDomainRegex.test(origin)) {
            return callback(null, true);
        }

        // Local network erişimi: Aynı WiFi'daki telefon/tablet için izin ver
        // 192.168.x.x, 10.x.x.x, 172.16-31.x.x aralıkları
        const localNetworkRegex = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
        if (localNetworkRegex.test(origin)) {
            if (process.env.NODE_ENV !== 'production') return callback(null, true);
            return callback(new Error('CORS politikası: Yerel ağ erişimine production ortamında izin verilmiyor.'));
        }

        callback(new Error(`CORS politikası: ${origin} adresine izin verilmiyor.`));
    },
    credentials: true
}));

// â”€â”€â”€ HELMET: Güvenlik başlıkları â”€â”€â”€
const isProduction = process.env.NODE_ENV === 'production';

app.use(helmet({
    contentSecurityPolicy: isProduction ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "*"],
            connectSrc: ["'self'", "ws:", "wss:", "https:"]
        }
    } : false,  // Local geliştirmede CSP kapalı — production'da açılır
    strictTransportSecurity: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
}));


const getCleanIP = (req) => {
    let ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || '127.0.0.1';
    if (ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }
    if (ip.includes(':') && ip.includes('.')) {
        // Contains port, e.g., 70.40.138.116:59999 or ::ffff:70.40.138.116:59999
        const parts = ip.split(':');
        ip = parts[parts.length - 2].includes('.') ? parts[parts.length - 2] : parts[parts.length - 1];
        if (ip.includes('.')) {
            // Keep only IPv4
        } else {
            ip = parts[0];
        }
    }
    // Clean brackets or other characters if any
    ip = ip.replace(/[\[\]]/g, '').trim();
    return ip;
};

// â”€â”€â”€ RATE LIMITING â”€â”€â”€
const loginLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '10'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getCleanIP,
    message: { error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' },
    skip: (req) => {
        // Development'ta sadece uyar, engelleme (opsiyonel)
        return false;
    }
});

const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 dakika
    max: 200,            // Genel API'ye dakikada 200 istek
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getCleanIP,
    message: { error: 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.' }
});


app.use(express.json({ limit: '2mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use('/api/', generalLimiter);

// â”€â”€â”€ ROTALAR â”€â”€â”€
const superAdminRoutes = require('./routes/superAdminRoutes');
const agencyRoutes = require('./routes/agencyRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const supportRoutes = require('./routes/supportRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Login endpoint'lerine özel rate limit
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

const path = require('path');
const { authenticate } = require('./middleware/auth');
app.use('/uploads', authenticate, express.static(path.join(__dirname, 'uploads')));

// Dist klasöründeki statik dosyaları (assets, js, css) servis et
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath, { index: false }));

// ANA SAYFA: Zyronova Landing Page (sadece '/' yolunda)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../zyronova_premium.html'));
});

// React Router için catch-all: API haricindeki tüm sayfa yönlendirmelerinde React index.html servis et
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
});


// â”€â”€â”€ HATA YAKALAMA â”€â”€â”€
app.use((err, req, res, next) => {
    // CORS hatasını gizle (güvenlik)
    if (err.message && err.message.startsWith('CORS politikası')) {
        return res.status(403).json({ error: 'Bu kaynağa erişim reddedildi.' });
    }
    console.error('[Server Error]', err.stack);
    
    // Production'da detaylı veritabanı veya kod hatalarını gizle
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
});

// Beklenmeyen Promise Reddedilmelerini (Unhandled Rejections) yakala
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection] Sebep:', reason);
    // Node.js varsayılan davranışında çöker; burada loglayıp devam etmesini sağlıyoruz.
});


