const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

// ─── Token doğrulama ───
const authenticate = (req, res, next) => {
    let token = req.header('Authorization')?.replace('Bearer ', '').trim();

    if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ error: 'Erişim reddedildi. Geçerli bir anahtar bulunamadı.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.dbName = decoded.dbName || 'TurMasterDB';
        next();
    } catch (err) {
        res.status(401).json({ error: 'Oturum süresi dolmuş veya geçersiz anahtar. Lütfen tekrar giriş yapın.' });
    }
};

// ─── İstek bazlı DB havuzu + lisans/aktiflik kontrolü ───
const attachDB = async (req, res, next) => {
    try {
        let agencyId = req.params.agencyId || req.query.agencyId || req.body.agencyId;
        if (agencyId === 'undefined' || agencyId === 'null') agencyId = null;

        const masterPool = await getPool('TurMasterDB');

        // GÜVENLİK: Acente aktiflik ve lisans kontrolü (her istekte)
        if (req.user && req.user.role === 'AGENCY' && req.user.agencyId) {
            const agencyCheck = await masterPool.request()
                .input('agencyId', req.user.agencyId)
                .query('SELECT IsActive, LicenseExpiryDate FROM Agencies WHERE AgencyID = @agencyId');

            const agency = agencyCheck.recordset[0];
            if (!agency) {
                return res.status(403).json({ error: 'Acente kaydı bulunamadı. Erişim reddedildi.' });
            }

            const now = new Date();
            const expiry = new Date(agency.LicenseExpiryDate);

            // Lisans süresi dolmuşsa Auto-Suspend
            if (agency.IsActive && expiry < now) {
                await masterPool.request()
                    .input('agencyId', req.user.agencyId)
                    .query('UPDATE Agencies SET IsActive = 0 WHERE AgencyID = @agencyId');
                agency.IsActive = false;
            }

            if (!agency.IsActive) {
                return res.status(403).json({ error: 'Hesabınız askıya alınmıştır veya lisans süreniz dolmuştur. Lütfen destek ile iletişime geçin.' });
            }

            // Lisans bitiş uyarısı
            const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            req.licenseWarning = null;
            if (daysRemaining === 14) {
                req.licenseWarning = { level: 'warning', message: 'Lisans sürenizin bitmesine 14 gün kalmıştır. Lütfen yenileyin.' };
            } else if (daysRemaining >= 4 && daysRemaining <= 7) {
                req.licenseWarning = { level: 'warning', message: `Lisans sürenizin bitmesine ${daysRemaining} gün kaldı. Lütfen yenileyin.` };
            } else if (daysRemaining >= 1 && daysRemaining <= 3) {
                req.licenseWarning = { level: 'danger', message: `ACİL: Lisans sürenizin bitmesine ${daysRemaining} gün kaldı!` };
            }
        }

        // 1. Süper Admin herhangi bir acente DB'sine erişebilir
        if (req.user?.role === 'SUPERADMIN' && agencyId && agencyId !== 'null') {
            const result = await masterPool.request()
                .input('id', agencyId)
                .query('SELECT AgencyDBName FROM Agencies WHERE AgencyID = @id');
            if (result.recordset.length > 0) {
                req.dbName = result.recordset[0].AgencyDBName;
            }
        }
        // 2. Acente sadece kendi şubelerine erişebilir
        else if (req.user?.role === 'AGENCY' && agencyId && agencyId !== 'null' && String(agencyId) !== String(req.user.agencyId)) {
            const result = await masterPool.request()
                .input('childId', agencyId)
                .input('parentId', req.user.agencyId)
                .query('SELECT AgencyDBName FROM Agencies WHERE AgencyID = @childId AND ParentAgencyID = @parentId');
            if (result.recordset.length > 0) {
                req.dbName = result.recordset[0].AgencyDBName;
            }
            // Yetkisiz erişim: IDOR Tespiti
            else {
                console.warn(`[Security - IDOR Blocked] Agency ${req.user.agencyId} tried unauthorized access to agencyId: ${agencyId}`);
                return res.status(403).json({ error: 'Bu acentenin/şubenin verilerine erişim yetkiniz bulunmamaktadır.' });
            }
        }

        // 3. Fallback
        if (!req.dbName) {
            req.dbName = req.user?.dbName || 'TurMasterDB';
        }

        req.dbPool = await getPool(req.dbName);
        next();
    } catch (err) {
        console.error(`[attachDB Error] ${req.dbName}:`, err.message);
        res.status(500).json({ error: 'Veritabanı bağlantı hatası.' });
    }
};

// ─── Rol tabanlı yetkilendirme ───
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmamaktadır.' });
        }
        next();
    };
};

// ─── Rol ve Yetki tabanlı yetkilendirme ───
const authorizeWithPerm = (allowedRoles, requiredPerm) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmamaktadır.' });
        }
        if (allowedRoles.includes(req.user.role)) {
            return next();
        }
        if (req.user.role === 'PERSONEL' && req.user.permissions && req.user.permissions[requiredPerm] === true) {
            return next();
        }
        return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmamaktadır.' });
    };
};

module.exports = { authenticate, attachDB, authorize, authorizeWithPerm };
