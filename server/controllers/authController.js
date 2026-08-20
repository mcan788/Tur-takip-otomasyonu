const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { sql, masterPool, getPool } = require('../config/db');
const { createTransporter, sendSecurityEmail } = require('../utils/emailService');

const notifySecurityEvent = async (userPayload, role, req, eventType, subject) => {
    try {
        let email = process.env.SMTP_USER || 'info@zyronova.com';
        const { getPool, sql } = require('../config/db');
        const masterPool = await getPool('TurMasterDB');
        
        if (role === 'AGENCY') {
            const res = await masterPool.request().input('u', sql.NVarChar, userPayload.username || userPayload.Username).query('SELECT OwnerEmail FROM Agencies WHERE Username = @u');
            if (res.recordset[0] && res.recordset[0].OwnerEmail) email = res.recordset[0].OwnerEmail;
        } else if (role === 'STAFF' || role === 'PERSONEL' || role === 'BRANCH_MANAGER') {
            if (userPayload.dbName || userPayload.AgencyDBName) {
                const agencyPool = await getPool(userPayload.dbName || userPayload.AgencyDBName);
                const res = await agencyPool.request().input('u', sql.NVarChar, userPayload.username || userPayload.Username).query('SELECT Email FROM Staff WHERE Username = @u');
                if (res.recordset[0] && res.recordset[0].Email) email = res.recordset[0].Email;
            }
        }
        
        sendSecurityEmail(email, subject, eventType, {
            time: new Date().toLocaleString('tr-TR'),
            ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'Bilinmiyor'
        });
    } catch (e) {
        logger.error('Notify Error:', e);
    }
};
// YARDIMCI: Werkzeug (Flask) ve Bcrypt (Node) Şifre Doğrulayıcı
async function verifyPassword(password, storedHash) {
    if (!storedHash) return false;
    if (storedHash.startsWith('pbkdf2:sha256:')) {
        const parts = storedHash.split('$');
        if (parts.length !== 3) return false;
        const iterations = parseInt(parts[0].split(':')[2]);
        const salt = parts[1];
        const hash = parts[2];
        const computedHash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
        return computedHash === hash;
    } else if (storedHash.startsWith('scrypt:')) {
        const parts = storedHash.split('$');
        if (parts.length !== 3) return false;
        const params = parts[0].split(':');
        const N = parseInt(params[1]);
        const r = parseInt(params[2]);
        const p = parseInt(params[3]);
        const salt = parts[1];
        const hash = parts[2];
        // Werkzeug hash uzunluğu 64 bytes (128 hex chars). maxmem limiti Node'un varsayılanından büyük olabileceği için artırıldı.
        const computedHash = crypto.scryptSync(password, salt, 64, { N, r, p, maxmem: 67108864 }).toString('hex');
        return computedHash === hash;
    } else {
        return await bcrypt.compare(password, storedHash);
    }
}

// ─── YARDIMCI: Güvenli geçici şifre üretici (Dünya standartlarında) ───
function generateSecurePassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%&*?';
    const allChars = uppercase + lowercase + digits + special;
    
    // En az 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter garanti et
    let password = '';
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += digits[crypto.randomInt(digits.length)];
    password += special[crypto.randomInt(special.length)];
    
    // Kalan 12 karakter rastgele ekle (toplam 16 karakter)
    for (let i = 0; i < 12; i++) {
        password += allChars[crypto.randomInt(allChars.length)];
    }
    
    // Şifreyi karıştır (Fisher-Yates shuffle)
    const arr = password.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    
    return arr.join('');
}

// ─── YARDIMCI: Lisans bitimine kalan güne göre uyarı üret ───
const buildLicenseWarning = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining === 14) {
        return { level: 'warning', message: 'Sistem Bilgilendirmesi: Lisans sürenizin bitmesine 14 gün kalmıştır. Sistemi kesintisiz kullanmaya devam etmek için lütfen en kısa sürede lisansınızı yenileyiniz.' };
    } else if (daysRemaining >= 4 && daysRemaining <= 7) {
        return { level: 'warning', message: `Dikkat: Lisans sürenizin bitmesine son ${daysRemaining} gün kalmıştır. Kesintisiz hizmet almaya devam edebilmek için lütfen lisansınızı yenileyiniz.` };
    } else if (daysRemaining >= 1 && daysRemaining <= 3) {
        return { level: 'danger', message: `ACİL UYARI: Lisans sürenizin bitmesine son ${daysRemaining} gün kaldı! Lisans yenilenmediği takdirde sisteminiz otomatik olarak askıya alınacaktır.` };
    }
    return null;
};

// Base32 Decoding for TOTP (Pure JS, Zero-dependency)
function base32Decode(base32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let cleanBase32 = base32.toUpperCase().replace(/=+$/, '');
    let length = cleanBase32.length;
    let bits = 0;
    let value = 0;
    let index = 0;
    const buffer = Buffer.alloc(Math.floor((length * 5) / 8));

    for (let i = 0; i < length; i++) {
        const val = alphabet.indexOf(cleanBase32[i]);
        if (val === -1) throw new Error('Invalid base32 character');
        value = (value << 5) | val;
        bits += 5;
        if (bits >= 8) {
            buffer[index++] = (value >>> (bits - 8)) & 255;
            bits -= 8;
        }
    }
    return buffer;
}

// Verify TOTP token against secret (Pure JS, Zero-dependency)
function verifyTOTP(token, secret, window = 1) {
    try {
        const key = base32Decode(secret);
        const timeStep = 30;
        const currentStep = Math.floor(Date.now() / 1000 / timeStep);
        
        for (let i = -window; i <= window; i++) {
            const step = currentStep + i;
            const buffer = Buffer.alloc(8);
            let temp = step;
            for (let j = 7; j >= 0; j--) {
                buffer[j] = temp & 255;
                temp = Math.floor(temp / 256);
            }
            
            const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
            const offset = hmac[hmac.length - 1] & 0xf;
            const code = ((hmac[offset] & 0x7f) << 24) |
                         ((hmac[offset + 1] & 0xff) << 16) |
                         ((hmac[offset + 2] & 0xff) << 8) |
                         (hmac[offset + 3] & 0xff);
                         
            const otp = (code % 1000000).toString().padStart(6, '0');
            if (otp === token) {
                return true;
            }
        }
    } catch (e) {
        logger.error('TOTP verification error:', e);
    }
    return false;
}

// Stateless Mathematical CAPTCHA Generator
const getCaptcha = async (req, res) => {
    try {
        const num1 = crypto.randomInt(1, 10);
        const num2 = crypto.randomInt(1, 10);
        const answer = num1 + num2;
        const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes
        
        const data = JSON.stringify({ answer, expiresAt });
        const algorithm = 'aes-256-cbc';
        const secretKey = crypto.createHash('sha256').update(process.env.JWT_SECRET).digest();
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const captchaToken = `${iv.toString('hex')}:${encrypted}`;
        res.json({
            question: `${num1} + ${num2} = ?`,
            captchaToken
        });
    } catch (err) {
        res.status(500).json({ error: 'CAPTCHA oluşturulurken teknik hata.' });
    }
};

const login = async (req, res) => {
    const { username: rawUsername, password, captchaAnswer, captchaToken } = req.body;
    const username = rawUsername?.trim();

    const pool = req.dbPool;

    // CAPTCHA Verification
    if (!captchaToken || !captchaAnswer) {
        return res.status(400).json({ error: 'Lütfen güvenlik sorusunu (CAPTCHA) yanıtlayın.' });
    }
    
    try {
        // STATIC token bypass kaldırıldı (Güvenlik güncellemesi)
        
        // Normal şifreli token doğrulama
        const [ivHex, encryptedHex] = captchaToken.split(':');
        if (!ivHex || !encryptedHex) throw new Error('Invalid token');
            
            const algorithm = 'aes-256-cbc';
            const secretKey = crypto.createHash('sha256').update(process.env.JWT_SECRET).digest();
            const iv = Buffer.from(ivHex, 'hex');
            
            const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
            let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            const { answer, expiresAt } = JSON.parse(decrypted);
            
            if (Date.now() > expiresAt) {
                return res.status(400).json({ error: 'Güvenlik sorusunun süresi dolmuş. Lütfen yeni bir kod isteyin.' });
            }
            
        
        if (parseInt(captchaAnswer) !== answer) {
            return res.status(400).json({ error: 'Güvenlik sorusu cevabı yanlış!' });
        }
    } catch (err) {
        console.error('CAPTCHA DECRYPT ERROR:', err.message, err.stack, req.body);
        return res.status(400).json({ error: 'Geçersiz güvenlik sorusu doğrulama verisi.' });
    }


    try {
        const pool = req.dbPool;

        // 1. PYTHON (RENT A CAR / MASTER) FALLBACK
        // React portalından gelen login isteklerinde "requestedModule" her zaman gelmeyebilir.
        // Bu yüzden öncelikle Python'a soruyoruz. Python'da varsa (Master veya Rent A Car), oradan devam ediyoruz.
        try {
            const pyResponse = await fetch(`http://127.0.0.1:5001/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (pyResponse.ok) {
                const pyText = await pyResponse.text();
                let pyData;
                try {
                    pyData = JSON.parse(pyText);
                    // Sadece MASTER ve RENT_A_CAR için Python'a delege et.
                    // TOUR_TRACKING kullanıcıları Node.js (TurMasterDB) üzerinden authenticate olmalıdır,
                    // çünkü Node.js'in ürettiği token yapısı farklıdır.
                    if (pyData && !pyData.error && (pyData.targetModule === 'MASTER' || pyData.targetModule === 'RENT_A_CAR')) {
                        return res.json(pyData);
                    }
                } catch (e) {
                    logger.error("Python JSON parse error:", e);
                }
            }
            // Python'da bulunamadıysa (401 vb.) hatayı yoksay ve TurMasterDB'ye (aşağıya) devam et.
        } catch (pyErr) {
            logger.error('Python authentication fallback failed (Sunucuya ulaşılamıyor olabilir):', pyErr.message);
        }

        // 1. SüperAdmin Kontrolü (Master DB'deki SystemUsers tablosundan)
        const adminResult = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM SystemUsers WHERE Username = @username');

        const admin = adminResult.recordset[0];

        if (admin) {
            // Süper Admin sadece Yönetim Paneli (MASTER) kapısından girebilir, diğer iki kart (RENT_A_CAR veya TOUR_TRACKING) üzerinden giriş yapamaz
            const requestedModule = req.body.requestedModule;
            if (requestedModule && requestedModule !== 'MASTER') {
                return res.status(403).json({ error: 'Süper Admin bu panelden giriş yapamaz. Lütfen Yönetim Paneli butonunu kullanın.' });
            }

            const isMatch = await verifyPassword(password, admin.PasswordHash);
            if (isMatch) {
                // Check if 2FA is active
                if (admin.IsTwoFactorEnabled) {
                    const tempToken = jwt.sign(
                        { username: admin.Username, role: admin.Role, require2FA: true, type: 'SUPERADMIN' },
                        process.env.JWT_SECRET,
                        { expiresIn: '3m' }
                    );
                    return res.json({ require2FA: true, tempToken });
                }

                const token = jwt.sign(
                    { username: admin.Username, role: admin.Role, dbName: 'TurMasterDB' },
                    process.env.JWT_SECRET,
                    { expiresIn: '8h' }
                );
                notifySecurityEvent(admin, 'SUPERADMIN', req, 'NEW_LOGIN', 'Yeni Giriş İşlemi');

                const isTourTracking = admin.Role.includes('TOUR_TRACKING');
                return res.json({ 
                    role: admin.Role,
                    targetModule: isTourTracking ? 'TOUR_TRACKING' : 'MASTER',
                    token,
                    message: isTourTracking ? 'Tur Takip personeli girişi başarılı.' : 'SüperAdmin/Merkez Personeli girişi başarılı.'
                });
            } else {
                return res.status(401).json({ error: 'Geçersiz süper admin şifresi veya kullanıcı adı.' });
            }
        }

        // 2. Acente Kontrolü (Master DB'den)
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM Agencies WHERE Username = @username');

        const agency = result.recordset[0];

        if (agency) {
            // Aktiflik ve Lisans Kontrolü
            if (!agency.IsActive) {
                return res.status(403).json({ error: 'Hesabınız askıya alınmıştır. Lütfen destek ile iletişime geçin.' });
            }

            const now = new Date();
            const expiry = new Date(agency.LicenseExpiryDate);
            if (expiry < now) {
                return res.status(403).json({ error: 'Lisans süreniz dolmuştur. Lütfen yenileyiniz.' });
            }

            const licenseWarning = buildLicenseWarning(agency.LicenseExpiryDate);

            const isMatch = await verifyPassword(password, agency.PasswordHash);
            if (isMatch) {
                // Check if 2FA is active
                if (agency.IsTwoFactorEnabled) {
                    const tempToken = jwt.sign(
                        { 
                            agencyId: agency.AgencyID, 
                            username: agency.Username,
                            role: 'AGENCY', 
                            dbName: agency.AgencyDBName,
                            agencyName: agency.AgencyName,
                            isBranch: agency.IsBranch,
                            assignedOfficeId: agency.AssignedOfficeID,
                            require2FA: true,
                            type: 'AGENCY'
                        },
                        process.env.JWT_SECRET,
                        { expiresIn: '3m' }
                    );
                    return res.json({ require2FA: true, tempToken });
                }

                // ModuleType 'BOTH' ise iki sisteme de izin ver. Değilse sadece kendi modülü.
                const allowedModules = agency.ModuleType === 'BOTH' 
                    ? ['RENT_A_CAR', 'TOUR_TRACKING'] 
                    : [agency.ModuleType || 'TOUR_TRACKING'];

                // JWT Üret (Acente DB ismini, Şube kısıtlamasını ve SSO Lisans Rotalarını gömüyoruz)
                const token = jwt.sign(
                    { 
                        agencyId: agency.AgencyID, 
                        username: agency.Username,
                        subdomain: agency.Username,
                        role: 'AGENCY', 
                        dbName: agency.AgencyDBName,
                        agencyName: agency.AgencyName,
                        isBranch: agency.IsBranch,
                        assignedOfficeId: agency.AssignedOfficeID,
                        allowedModules: allowedModules,       // Güvenlik: Hangi modüllere yetkisi var?
                        targetModule: req.body.requestedModule || null // Hangi kapıdan girmek istedi?
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '8h' }
                );
                notifySecurityEvent(agency, 'AGENCY', req, 'NEW_LOGIN', 'Yeni Giriş İşlemi');
                return res.json({
                    role: 'AGENCY',
                    token,
                    agencyId: agency.AgencyID,
                    mustChangePassword: agency.MustChangePassword,
                    username: agency.Username,
                    fullName: agency.AgencyName,
                    agencyName: agency.AgencyName,
                    moduleType: agency.ModuleType,
                    isBranch: agency.IsBranch ? 'true' : 'false',
                    assignedOfficeId: agency.AssignedOfficeID || '',
                    licenseWarning
                });
            } else {
                return res.status(401).json({ error: 'Geçersiz acente şifresi veya kullanıcı adı.' });
            }
        }

    } catch (err) {
        logger.error('Login Hatası (Acente öncesi):', err);
    }

    // 3. Personel Kontrolü (Acente DB'lerinde ara)
    try {
        const { getPool } = require('../config/db');
        const masterPool = await getPool('TurMasterDB');
        const allAgencies = await masterPool.request().query('SELECT AgencyID, AgencyDBName, AgencyName, Username as AgencyUsername FROM Agencies WHERE IsActive = 1');

        for (const agency of allAgencies.recordset) {
            try {
                const agencyPool = await getPool(agency.AgencyDBName);
                const staffResult = await agencyPool.request()
                    .input('username', sql.NVarChar, username)
                    .query('SELECT * FROM Staff WHERE (Username = @username OR UPPER(Username) = UPPER(@username)) AND IsActive = 1');
                
                const staff = staffResult.recordset[0];
                if (staff) {
                    const isMatch = await verifyPassword(password, staff.PasswordHash);
                    if (isMatch) {
                        // Check if Staff 2FA is active
                        if (staff.IsTwoFactorEnabled) {
                            const tempToken = jwt.sign(
                                { 
                                    staffId: staff.StaffID,
                                    agencyId: agency.AgencyID, 
                                    username: staff.Username,
                                    subdomain: agency.AgencyUsername,
                                    role: staff.Role || 'PERSONEL',
                                    dbName: agency.AgencyDBName,
                                    agencyName: agency.AgencyName,
                                    isStaff: true,
                                    require2FA: true,
                                    type: 'STAFF'
                                },
                                process.env.JWT_SECRET,
                                { expiresIn: '3m' }
                            );
                            return res.json({ require2FA: true, tempToken });
                        }

                        // Personel için lisans kontrolü: Acentenin lisansına göre yetki ver.
                        const allowedModules = agency.ModuleType === 'BOTH' 
                            ? ['RENT_A_CAR', 'TOUR_TRACKING'] 
                            : [agency.ModuleType || 'TOUR_TRACKING'];

                        const token = jwt.sign(
                            { 
                                staffId: staff.StaffID,
                                agencyId: agency.AgencyID, 
                                username: staff.Username,
                                subdomain: agency.AgencyUsername,
                                role: staff.Role || 'PERSONEL', 
                                permissions: staff.Permissions ? JSON.parse(staff.Permissions) : null,
                                dbName: agency.AgencyDBName,
                                agencyName: agency.AgencyName,
                                isStaff: true,
                                allowedModules: allowedModules,       // Güvenlik: Acentenin yetkisine göre
                                targetModule: req.body.requestedModule || null // Nereye girmek istedi?
                            },
                            process.env.JWT_SECRET,
                            { expiresIn: '8h' }
                        );

                        notifySecurityEvent(staff, 'STAFF', req, 'NEW_LOGIN', 'Yeni Giriş İşlemi');
                        return res.json({
                            role: staff.Role || 'PERSONEL',
                            permissions: staff.Permissions ? JSON.parse(staff.Permissions) : null,
                            token,
                            agencyId: agency.AgencyID,
                            username: staff.Username,
                            fullName: staff.FullName,
                            agencyName: agency.AgencyName,
                            isStaff: true,
                            staffId: staff.StaffID,
                            mustChangePassword: staff.MustChangePassword
                        });
                    }
                }
            } catch (dbErr) {
                // Belirli bir DB'ye erişilemiyorsa atla
                logger.warn(`Staff check skipped for ${agency.AgencyDBName}:`, dbErr.message);
                continue;
            }
        }

        return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });

    } catch (err) {
        logger.error('Login Hatası (Personel tarama):', err);
        res.status(500).json({ error: 'Giriş işlemi sırasında teknik bir hata oluştu.' });
    }
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'Yeni şifre en az 8 karakter olmalıdır.' });
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[\W_]/.test(newPassword)) {
        return res.status(400).json({ error: 'Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter (!@#$&* vb.) içermelidir.' });
    }

    try {
        const passwordHash = await bcrypt.hash(newPassword, 12);
        const masterPool = await getPool('TurMasterDB');

        // 1. Durum: Eğer bu bir Acente/Şube ise
        if (req.user?.role === 'AGENCY' && req.user.agencyId) {
            // Mevcut şifreyi doğrula (eğer zorunlu değişim değilse bile her ihtimale karşı sorulmalı)
            if (currentPassword) {
                const userResult = await masterPool.request()
                    .input('agencyId', sql.Int, req.user.agencyId)
                    .query('SELECT PasswordHash FROM Agencies WHERE AgencyID = @agencyId');
                
                if (userResult.recordset[0]) {
                    const isMatch = await verifyPassword(currentPassword, userResult.recordset[0].PasswordHash);
                    if (!isMatch) return res.status(401).json({ error: 'Mevcut şifreniz hatalı.' });
                }
            }

            const result = await masterPool.request()
                .input('agencyId', sql.Int, req.user.agencyId)
                .input('passwordHash', sql.NVarChar, passwordHash)
                .query('UPDATE Agencies SET PasswordHash = @passwordHash, MustChangePassword = 0 WHERE AgencyID = @agencyId');
            
            logger.info(`[Password Change] Success for Agency ID: ${req.user.agencyId}. Rows affected: ${result.rowsAffected}`);
            await notifySecurityEvent(req.user, 'AGENCY', req, 'PASSWORD_CHANGED', 'Şifre Değişikliği Bildirimi');
            return res.json({ message: 'Acente şifresi başarıyla güncellendi.' });
        } 
        
        // 2. Durum: Eğer bu bir Süper Admin ise
        if (req.user?.role === 'SUPERADMIN' && req.user.username) {
            if (currentPassword) {
                const userResult = await masterPool.request()
                    .input('username', sql.NVarChar, req.user.username)
                    .query('SELECT PasswordHash FROM SystemUsers WHERE Username = @username');
                
                if (userResult.recordset[0]) {
                    const isMatch = await verifyPassword(currentPassword, userResult.recordset[0].PasswordHash);
                    if (!isMatch) return res.status(401).json({ error: 'Mevcut şifreniz hatalı.' });
                }
            }

            await masterPool.request()
                .input('username', sql.NVarChar, req.user.username)
                .input('passwordHash', sql.NVarChar, passwordHash)
                .query('UPDATE SystemUsers SET PasswordHash = @passwordHash WHERE Username = @username');
            
            await notifySecurityEvent(req.user, 'SUPERADMIN', req, 'PASSWORD_CHANGED', 'Şifre Değişikliği Bildirimi');
            return res.json({ message: 'SüperAdmin şifresi başarıyla güncellendi.' });
        }

        // 3. Durum: Eğer bu bir Rent-A-Car kullanıcısı ise (yonetici veya personel)
        if ((req.user?.role === 'yonetici' || req.user?.targetModule === 'RENT_A_CAR' || req.user?.targetModule === 'MASTER' || req.user?.role === 'admin' || req.user?.role === 'personel') && req.user.username && !req.user.isStaff) {
            const rentPool = await getPool('ZYRONOVA_MASTER');
            
            if (currentPassword) {
                const userResult = await rentPool.request()
                    .input('username', sql.NVarChar, req.user.username)
                    .query('SELECT password_hash FROM users WHERE username = @username');
                
                if (userResult.recordset[0]) {
                    const isMatch = await verifyPassword(currentPassword, userResult.recordset[0].password_hash);
                    if (!isMatch) return res.status(401).json({ error: 'Mevcut şifreniz hatalı.' });
                }
            }

            await rentPool.request()
                .input('username', sql.NVarChar, req.user.username)
                .input('passwordHash', sql.NVarChar, passwordHash)
                .query('UPDATE users SET password_hash = @passwordHash, needs_password_change = 0 WHERE username = @username');
            
            await notifySecurityEvent(req.user, 'STAFF', req, 'PASSWORD_CHANGED', 'Şifre Değişikliği Bildirimi');
            return res.json({ message: 'Rent-A-Car şifresi başarıyla güncellendi.' });
        }

        // 4. Durum: Eğer bu bir Personel (Staff) ise (Node.js Tur Takip veritabanı)
        if (req.user?.isStaff && req.user.staffId && req.user.dbName) {
            const agencyPool = await getPool(req.user.dbName);
            
            if (currentPassword) {
                const userResult = await agencyPool.request()
                    .input('staffId', sql.Int, req.user.staffId)
                    .query('SELECT PasswordHash FROM Staff WHERE StaffID = @staffId AND IsActive = 1');
                
                if (userResult.recordset[0]) {
                    const isMatch = await verifyPassword(currentPassword, userResult.recordset[0].PasswordHash);
                    if (!isMatch) return res.status(401).json({ error: 'Mevcut şifreniz hatalı.' });
                }
            }

            await agencyPool.request()
                .input('staffId', sql.Int, req.user.staffId)
                .input('passwordHash', sql.NVarChar, passwordHash)
                .query('UPDATE Staff SET PasswordHash = @passwordHash, MustChangePassword = 0 WHERE StaffID = @staffId');
            
            await notifySecurityEvent(req.user, 'STAFF', req, 'PASSWORD_CHANGED', 'Şifre Değişikliği Bildirimi');
            return res.json({ message: 'Personel şifresi başarıyla güncellendi.' });
        }

        res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmamaktadır.' });

    } catch (err) {
        logger.error('Şifre Güncelleme Hatası:', err);
        res.status(500).json({ error: 'Şifre güncellenirken teknik bir hata oluştu.' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin.' });
    }

    const searchKey = email.trim().toLowerCase();

    try {
        // ─── 1. ARAMA: TurMasterDB.Agencies (Tur Takip tarafı) ───
        const turPool = await getPool('TurMasterDB');
        const turResult = await turPool.request()
            .input('key', sql.NVarChar, searchKey)
            .query('SELECT * FROM Agencies WHERE LOWER(OwnerEmail) = @key OR LOWER(Username) = @key');

        const agency = turResult.recordset[0];

        if (agency) {
            // Tur Takip acentesi bulundu - şifreyi sıfırla
            const tempPassword = generateSecurePassword();
            const passwordHash = await bcrypt.hash(tempPassword, 12);

            await turPool.request()
                .input('agencyId', sql.Int, agency.AgencyID)
                .input('passwordHash', sql.NVarChar, passwordHash)
                .query('UPDATE Agencies SET PasswordHash = @passwordHash, MustChangePassword = 1 WHERE AgencyID = @agencyId');

            // E-posta gönder
            await sendResetEmail(agency.OwnerEmail || email, tempPassword);

            return res.json({ 
                message: 'Yeni geçici şifreniz başarıyla oluşturuldu. Lütfen e-postanızı kontrol edin.'
            });
        }

        // ─── 1.5. ARAMA: TurMasterDB.SystemUsers (Süper Admin) ───
        const superAdminResult = await turPool.request()
            .input('key', sql.NVarChar, searchKey)
            .query('SELECT * FROM SystemUsers WHERE LOWER(Username) = @key OR LOWER(Email) = @key');
            
        const superAdmin = superAdminResult.recordset[0];
        
        if (superAdmin) {
            const tempPassword = generateSecurePassword();
            const passwordHash = await bcrypt.hash(tempPassword, 12);

            await turPool.request()
                .input('userId', sql.Int, superAdmin.UserID)
                .input('passwordHash', sql.NVarChar, passwordHash)
                .query('UPDATE SystemUsers SET PasswordHash = @passwordHash WHERE UserID = @userId');

            // E-posta gönder
            const sendTo = superAdmin.Email || superAdmin.Username;
            await sendResetEmail(sendTo, tempPassword);

            return res.json({ 
                message: 'Süper Admin geçici şifresi oluşturuldu. Lütfen e-postanızı kontrol edin.'
            });
        }

        // ─── 2. ARAMA: ZYRONOVA_MASTER.companies + users (Rent-A-Car tarafı) ───
        const rentPool = await getPool('ZYRONOVA_MASTER');
        
        // Önce companies tablosundan ara (contact_email)
        const compResult = await rentPool.request()
            .input('key', sql.NVarChar, searchKey)
            .query('SELECT id, name, contact_email FROM companies WHERE LOWER(contact_email) = @key');
        
        let targetCompanyId = null;
        let targetEmail = null;

        if (compResult.recordset.length > 0) {
            targetCompanyId = compResult.recordset[0].id;
            targetEmail = compResult.recordset[0].contact_email;
        }

        // users tablosunda da ara (email veya username)
        const userResult = await rentPool.request()
            .input('key', sql.NVarChar, searchKey)
            .query('SELECT id, username, email, company_id, password_hash FROM users WHERE (LOWER(email) = @key OR LOWER(username) = @key) AND (is_deleted = 0 OR is_deleted IS NULL)');

        let user = userResult.recordset[0];

        // Eğer user doğrudan bulunamadıysa ama company bulunduysa, o şirketin yönetici kullanıcısını bul
        if (!user && targetCompanyId) {
            const compUserResult = await rentPool.request()
                .input('compId', sql.Int, targetCompanyId)
                .query("SELECT id, username, email, company_id, password_hash FROM users WHERE company_id = @compId AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY role ASC");
            user = compUserResult.recordset[0];
        }

        if (user) {
            // Rent-A-Car kullanıcısı bulundu - şifreyi sıfırla
            const tempPassword = generateSecurePassword();
            const passwordHash = await bcrypt.hash(tempPassword, 12);

            await rentPool.request()
                .input('userId', sql.NVarChar, user.id)
                .input('passwordHash', sql.NVarChar, passwordHash)
                .query('UPDATE users SET password_hash = @passwordHash, needs_password_change = 1 WHERE id = @userId');

            // E-posta gönder (şirket contact_email veya user email)
            const sendTo = targetEmail || user.email || email;
            await sendResetEmail(sendTo, tempPassword);

            return res.json({ 
                message: `Geçici şifreniz oluşturuldu ve ${sendTo} adresine gönderildi. Lütfen e-postanızı kontrol edin.`
            });
        }

        // ─── 3. ARAMA: Eğer Rent-A-Car'da da yoksa, tüm acentelerin Personel (Staff) tablolarında ara ───
        if (!user) {
            const masterPool = await getPool('TurMasterDB');
            const agenciesResult = await masterPool.request().query('SELECT AgencyID, AgencyDBName FROM Agencies WHERE IsActive = 1');
            
            for (const ag of agenciesResult.recordset) {
                if (!ag.AgencyDBName) continue;
                
                try {
                    const agencyPool = await getPool(ag.AgencyDBName);
                    const staffResult = await agencyPool.request()
                        .input('key', sql.NVarChar, searchKey)
                        .query('SELECT StaffID, Username, Email FROM Staff WHERE (LOWER(Email) = @key OR LOWER(Username) = @key) AND IsActive = 1');
                    
                    const staffUser = staffResult.recordset[0];
                    if (staffUser) {
                        // Personel bulundu - şifreyi sıfırla
                        const tempPassword = generateSecurePassword();
                        const passwordHash = await bcrypt.hash(tempPassword, 12);
                        
                        await agencyPool.request()
                            .input('staffId', sql.Int, staffUser.StaffID)
                            .input('passwordHash', sql.NVarChar, passwordHash)
                            .query('UPDATE Staff SET PasswordHash = @passwordHash WHERE StaffID = @staffId');
                            // Not: Staff tablosunda MustChangePassword sütunu var mı emin değiliz, bu yüzden sadece PasswordHash güncelliyoruz.
                        
                        const sendTo = staffUser.Email || email;
                        await sendResetEmail(sendTo, tempPassword);
                        
                        return res.json({ 
                            message: `Geçici şifreniz oluşturuldu ve ${sendTo} adresine gönderildi. Lütfen e-postanızı kontrol edin.`
                        });
                    }
                } catch (dbErr) {
                    logger.warn(`Forgot Password: DB araması atlandı (${ag.AgencyDBName}):`, dbErr.message);
                }
            }
        }

        // Hiçbir yerde bulunamadı
        return res.status(404).json({ error: 'Bu e-posta adresine veya kullanıcı adına kayıtlı bir hesap bulunamadı.' });

    } catch (err) {
        logger.error('Forgot Password Hatası:', err);
        res.status(500).json({ error: 'İşlem sırasında bir hata oluştu.' });
    }
};

// ─── Şifre sıfırlama e-postası gönderme yardımcı fonksiyonu ───
async function sendResetEmail(toEmail, tempPassword) {
    try {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.zyronova.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: false,
            auth: {
                user: process.env.SMTP_USER || 'info@zyronova.com',
                pass: process.env.SMTP_PASS || 'placeholder_pass',
            },
            tls: { rejectUnauthorized: true }
        });

        const mailOptions = {
            from: `"Zyronova Destek" <${process.env.SMTP_USER || 'info@zyronova.com'}>`,
            to: toEmail,
            subject: '🔑 Şifre Sıfırlama Talebi - Geçici Şifre',
            html: `
            <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0; color: #ffffff;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Şifre Sıfırlama Talebi</h2>
                </div>
                <div style="padding: 20px; color: #334155; line-height: 1.6;">
                    <p>Sayın Yetkili,</p>
                    <p>Hesabınız için şifre sıfırlama talebinde bulunulmuştur. Hesabınıza giriş yapmak için aşağıdaki geçici şifreyi kullanabilirsiniz:</p>
                    <div style="margin: 20px 0; padding: 15px; background-color: #f1f5f9; border-left: 4px solid #2563eb; font-size: 20px; font-weight: bold; letter-spacing: 2px; text-align: center; font-family: monospace;">
                        ${tempPassword}
                    </div>
                    <p style="color: #ef4444; font-weight: 500;">Önemli: Güvenliğiniz için sisteme ilk giriş yaptığınızda şifrenizi değiştirmeniz istenecektir.</p>
                    <p>Eğer bu talebi siz yapmadıysanız lütfen hemen sistem yöneticinizle iletişime geçin.</p>
                </div>
                <div style="padding: 15px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
                    © 2026 Zyronova. Tüm hakları saklıdır.
                </div>
            </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                logger.error('[NODEMAILER ERROR] Failed to send password reset email to:', toEmail, error);
            } else {
                logger.info('[NODEMAILER] Password reset email successfully sent to:', toEmail, info.messageId);
            }
        });
    } catch (mailErr) {
        logger.error('[NODEMAILER] Mail setup error:', mailErr);
    }
}
const verifyOtpOrBackupCode = async (otpCode, secret, recoveryCodesStr, pool, tableName, identifierColumn, identifierValue, recoveryColumnName = 'TwoFactorRecoveryCodes') => {
    if (verifyTOTP(otpCode, secret)) return true;

    const rawCode = (otpCode || '').replace(/-/g, '').toUpperCase();
    if (rawCode.length === 8 && recoveryCodesStr) {
        let codes = [];
        try { codes = JSON.parse(recoveryCodesStr); } catch (e) {}
        
        for (let i = 0; i < codes.length; i++) {
            const match = await verifyPassword(rawCode, codes[i]);
            if (match) {
                codes.splice(i, 1);
                await pool.request()
                    .input('id', identifierValue)
                    .input('rc', JSON.stringify(codes))
                    .query(`UPDATE ${tableName} SET ${recoveryColumnName} = @rc WHERE ${identifierColumn} = @id`);
                return true;
            }
        }
    }
    return false;
};

const verify2FALogin = async (req, res) => {
    const { tempToken, otpCode } = req.body;
    if (!tempToken || !otpCode) {
        return res.status(400).json({ error: 'Eksik doğrulama bilgileri.' });
    }
    
    try {
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        if (!decoded.require2FA) {
            return res.status(400).json({ error: 'Geçersiz 2FA akışı.' });
        }
        const { getPool } = require('../config/db');
        const pool = await getPool('TurMasterDB');

        if (decoded.type === 'SUPERADMIN') {
            const adminResult = await pool.request()
                .input('username', sql.NVarChar, decoded.username)
                .query('SELECT * FROM SystemUsers WHERE Username = @username');
            const admin = adminResult.recordset[0];
            if (!admin || !admin.IsTwoFactorEnabled) {
                return res.status(400).json({ error: 'SüperAdmin bulunamadı veya 2FA aktif değil.' });
            }
            
            const isValid = await verifyOtpOrBackupCode(otpCode, admin.TwoFactorSecret, admin.TwoFactorRecoveryCodes, pool, 'SystemUsers', 'Username', admin.Username);
            if (!isValid) {
                return res.status(400).json({ error: 'Geçersiz kod! Google Authenticator kodunuzu veya 8 haneli kurtarma kodunuzu kontrol edin.' });
            }
            
            const token = jwt.sign(
                { username: admin.Username, role: admin.Role, dbName: 'TurMasterDB' },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );
            notifySecurityEvent(admin, 'SUPERADMIN', req, 'NEW_LOGIN', 'Yeni Giriş İşlemi');
            return res.json({ 
                role: admin.Role,
                token,
                message: '2FA doğrulaması başarılı. SüperAdmin girişi yapıldı.'
            });
        } else if (decoded.type === 'AGENCY') {
            const result = await pool.request()
                .input('agencyId', sql.Int, decoded.agencyId)
                .query('SELECT * FROM Agencies WHERE AgencyID = @agencyId');
            const agency = result.recordset[0];
            if (!agency || !agency.IsTwoFactorEnabled) {
                return res.status(400).json({ error: 'Acente bulunamadı veya 2FA aktif değil.' });
            }
            
            const isValid = await verifyOtpOrBackupCode(otpCode, agency.TwoFactorSecret, agency.TwoFactorRecoveryCodes, pool, 'Agencies', 'AgencyID', agency.AgencyID);
            if (!isValid) {
                return res.status(400).json({ error: 'Geçersiz kod! Google Authenticator kodunuzu veya 8 haneli kurtarma kodunuzu kontrol edin.' });
            }

            const licenseWarning = buildLicenseWarning(agency.LicenseExpiryDate);
            
            const allowedModules = agency.ModuleType === 'BOTH' 
                ? ['RENT_A_CAR', 'TOUR_TRACKING'] 
                : [agency.ModuleType || 'TOUR_TRACKING'];
            
            const token = jwt.sign(
                { 
                    agencyId: agency.AgencyID, 
                    username: agency.Username,
                    subdomain: agency.Username,
                    role: 'AGENCY', 
                    dbName: agency.AgencyDBName,
                    agencyName: agency.AgencyName,
                    isBranch: agency.IsBranch,
                    assignedOfficeId: agency.AssignedOfficeID,
                    allowedModules: allowedModules
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );
            
            notifySecurityEvent(agency, 'AGENCY', req, 'NEW_LOGIN', 'Yeni Giriş İşlemi');
            return res.json({
                role: 'AGENCY',
                token,
                agencyId: agency.AgencyID,
                mustChangePassword: agency.MustChangePassword,
                username: agency.Username,
                fullName: agency.AgencyName,
                agencyName: agency.AgencyName,
                moduleType: agency.ModuleType,
                isBranch: agency.IsBranch ? 'true' : 'false',
                assignedOfficeId: agency.AssignedOfficeID || '',
                licenseWarning
            });
        } else if (decoded.type === 'STAFF') {
            const agencyPool = await getPool(decoded.dbName);
            const staffResult = await agencyPool.request()
                .input('staffId', sql.Int, decoded.staffId)
                .query('SELECT * FROM Staff WHERE StaffID = @staffId AND IsActive = 1');
            const staff = staffResult.recordset[0];
            if (!staff || !staff.IsTwoFactorEnabled) {
                return res.status(400).json({ error: 'Personel bulunamadı veya 2FA aktif değil.' });
            }

            const isValid = await verifyOtpOrBackupCode(otpCode, staff.TwoFactorSecret, staff.TwoFactorRecoveryCodes, agencyPool, 'Staff', 'StaffID', staff.StaffID);
            if (!isValid) {
                return res.status(400).json({ error: 'Geçersiz kod! Google Authenticator kodunuzu veya 8 haneli kurtarma kodunuzu kontrol edin.' });
            }

            const allowedModules = ['TOUR_TRACKING'];
            const token = jwt.sign(
                { 
                    staffId: staff.StaffID,
                    agencyId: decoded.agencyId, 
                    username: staff.Username,
                    subdomain: decoded.subdomain,
                    role: staff.Role || 'PERSONEL', 
                    permissions: staff.Permissions ? JSON.parse(staff.Permissions) : null,
                    dbName: decoded.dbName,
                    agencyName: decoded.agencyName,
                    isStaff: true,
                    allowedModules: allowedModules
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            notifySecurityEvent(staff, 'STAFF', req, 'NEW_LOGIN', 'Yeni Giriş İşlemi');
            return res.json({
                role: staff.Role || 'PERSONEL',
                permissions: staff.Permissions ? JSON.parse(staff.Permissions) : null,
                token,
                agencyId: decoded.agencyId,
                username: staff.Username,
                fullName: staff.FullName,
                agencyName: decoded.agencyName,
                isStaff: true,
                isStaff: true,
                staffId: staff.StaffID
            });
        } else if (decoded.type === 'RENT_A_CAR') {
            const rentPool = await getPool('ZYRONOVA_MASTER');
            const result = await rentPool.request()
                .input('userId', sql.NVarChar, decoded.userId)
                .query('SELECT * FROM users WHERE id = @userId');
            const user = result.recordset[0];
            
            if (!user || !user.is_2fa_enabled) {
                return res.status(400).json({ error: 'Kullanıcı bulunamadı veya 2FA aktif değil.' });
            }

            const isValid = await verifyOtpOrBackupCode(otpCode, user.two_factor_secret, user.two_factor_recovery_codes, rentPool, 'users', 'id', user.id, 'two_factor_recovery_codes');
            if (!isValid) {
                return res.status(400).json({ error: 'Geçersiz kod! Google Authenticator kodunuzu veya 9 haneli kurtarma kodunuzu kontrol edin.' });
            }

            const token = jwt.sign(
                { 
                    agencyId: user.company_id,
                    username: user.username,
                    subdomain: decoded.subdomain,
                    role: user.role || 'yonetici',
                    role_id: user.role_id,
                    allowedModules: ['RENT_A_CAR'],
                    targetModule: 'RENT_A_CAR'
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            notifySecurityEvent(user, 'RENT_A_CAR', req, 'NEW_LOGIN', 'Yeni Giriş İşlemi');
            return res.json({
                success: true,
                role: user.role || 'yonetici',
                token,
                subdomain: decoded.subdomain,
                username: user.username,
                fullName: user.company_name || user.username,
                agencyName: user.company_name || user.username,
                mustChangePassword: user.needs_password_change
            });
        }
        
        res.status(400).json({ error: 'Bilinmeyen kullanıcı tipi.' });
    } catch (err) {
        res.status(401).json({ error: 'Doğrulama süresi dolmuş veya geçersiz token.' });
    }
};

const setup2FA = async (req, res) => {
    try {
        const username = req.user.username;
        const role = req.user.role || 'USER';
        
        // High-entropy 16 character Base32 Secret (Google Authenticator compatible)
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        const randomBytes = crypto.randomBytes(16);
        for (let i = 0; i < 16; i++) {
            secret += base32Chars[randomBytes[i] % 32];
        }
        
        const issuerName = 'Zyronova Tur Takip';
        const label = encodeURIComponent(`${username}`);
        const issuer = encodeURIComponent(issuerName);
        const otpauthUrl = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauthUrl)}`;
        
        res.json({
            secret,
            qrUrl,
            otpauthUrl,
            appName: issuerName
        });
    } catch (err) {
        logger.error('setup2FA error:', err);
        res.status(500).json({ error: '2FA kurulumu başlatılamadı.' });
    }
};

const activate2FA = async (req, res) => {
    const { secret, otpCode } = req.body;
    const username = req.user.username;
    const role = req.user.role;
    
    if (!secret || !otpCode) {
        return res.status(400).json({ error: 'Lütfen 6 haneli kodu ve gizli anahtarı sağlayın.' });
    }
    
    const isValid = verifyTOTP(otpCode, secret);
    if (!isValid) {
        return res.status(400).json({ error: 'Geçersiz Google Authenticator doğrulama kodu. 2FA aktif edilemedi!' });
    }
    
    // 5 Adet Kurtarma Kodu Üretimi
    const backupCodesRaw = [];
    const backupCodesHashed = [];
    for (let i = 0; i < 5; i++) {
        const rawCode = crypto.randomBytes(4).toString('hex').toUpperCase(); // Örn: 8A3F9B2C
        const formattedCode = `${rawCode.slice(0, 4)}-${rawCode.slice(4)}`;
        backupCodesRaw.push(formattedCode);
        backupCodesHashed.push(await bcrypt.hash(rawCode, 12));
    }
    const recoveryCodesStr = JSON.stringify(backupCodesHashed);

    const { getPool } = require('../config/db');
    const pool = await getPool('TurMasterDB');
    
    try {
        if (role === 'SUPERADMIN') {
            await pool.request()
                .input('username', sql.NVarChar, username)
                .input('secret', sql.NVarChar, secret)
                .input('recoveryCodes', sql.NVarChar, recoveryCodesStr)
                .query('UPDATE SystemUsers SET IsTwoFactorEnabled = 1, TwoFactorSecret = @secret, TwoFactorRecoveryCodes = @recoveryCodes WHERE Username = @username');
        } else if (role === 'AGENCY') {
            await pool.request()
                .input('username', sql.NVarChar, username)
                .input('secret', sql.NVarChar, secret)
                .input('recoveryCodes', sql.NVarChar, recoveryCodesStr)
                .query('UPDATE Agencies SET IsTwoFactorEnabled = 1, TwoFactorSecret = @secret, TwoFactorRecoveryCodes = @recoveryCodes WHERE Username = @username');
        } else if (req.user.isStaff || req.user.staffId) {
            const agencyPool = await getPool(req.user.dbName);
            await agencyPool.request()
                .input('staffId', sql.Int, req.user.staffId)
                .input('secret', sql.NVarChar, secret)
                .input('recoveryCodes', sql.NVarChar, recoveryCodesStr)
                .query('UPDATE Staff SET IsTwoFactorEnabled = 1, TwoFactorSecret = @secret, TwoFactorRecoveryCodes = @recoveryCodes WHERE StaffID = @staffId');
        } else if (role === 'yonetici') {
            const rentPool = await getPool('ZYRONOVA_MASTER');
            await rentPool.request()
                .input('username', sql.NVarChar, username)
                .input('secret', sql.NVarChar, secret)
                .query('UPDATE users SET is_2fa_enabled = 1, two_factor_secret = @secret WHERE username = @username');
        } else {
            return res.status(403).json({ error: 'Bilinmeyen kullanıcı tipi.' });
        }
        
        await notifySecurityEvent(req.user, role, req, '2FA_ENABLED', '2FA Aktifleştirildi');
        res.json({ 
            message: 'Google Authenticator (2FA) başarıyla aktifleştirildi.',
            backupCodes: backupCodesRaw
        });
    } catch (err) {
        logger.error('activate2FA error:', err);
        res.status(500).json({ error: '2FA veritabanına kaydedilirken hata oluştu.' });
    }
};

const disable2FA = async (req, res) => {
    const { password } = req.body;
    const username = req.user.username;
    const role = req.user.role;
    
    if (!password) {
        return res.status(400).json({ error: 'Lütfen şifrenizi girin.' });
    }
    const { getPool } = require('../config/db');
    const pool = await getPool('TurMasterDB');
    
    try {
        let user;
        let isStaff = req.user.isStaff || req.user.staffId;

        if (role === 'SUPERADMIN') {
            const adminResult = await pool.request()
                .input('username', sql.NVarChar, username)
                .query('SELECT * FROM SystemUsers WHERE Username = @username');
            user = adminResult.recordset[0];
        } else if (role === 'AGENCY') {
            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .query('SELECT * FROM Agencies WHERE Username = @username');
            user = result.recordset[0];
        } else if (isStaff) {
            const agencyPool = await getPool(req.user.dbName);
            const staffRes = await agencyPool.request()
                .input('staffId', sql.Int, req.user.staffId)
                .query('SELECT * FROM Staff WHERE StaffID = @staffId');
            user = staffRes.recordset[0];
        } else if (role === 'yonetici') {
            const rentPool = await getPool('ZYRONOVA_MASTER');
            const result = await rentPool.request()
                .input('username', sql.NVarChar, username)
                .query('SELECT * FROM users WHERE username = @username');
            user = result.recordset[0];
        }
        
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }
        
        const isMatch = await verifyPassword(password, user.PasswordHash || user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Hatalı şifre. 2FA devredışı bırakılamadı!' });
        }
        
        if (role === 'SUPERADMIN') {
            await pool.request()
                .input('username', sql.NVarChar, username)
                .query('UPDATE SystemUsers SET IsTwoFactorEnabled = 0, TwoFactorSecret = NULL WHERE Username = @username');
        } else if (role === 'AGENCY') {
            await pool.request()
                .input('username', sql.NVarChar, username)
                .query('UPDATE Agencies SET IsTwoFactorEnabled = 0, TwoFactorSecret = NULL WHERE Username = @username');
        } else if (isStaff) {
            const agencyPool = await getPool(req.user.dbName);
            await agencyPool.request()
                .input('staffId', sql.Int, req.user.staffId)
                .query('UPDATE Staff SET IsTwoFactorEnabled = 0, TwoFactorSecret = NULL WHERE StaffID = @staffId');
        } else if (role === 'yonetici') {
            const rentPool = await getPool('ZYRONOVA_MASTER');
            await rentPool.request()
                .input('username', sql.NVarChar, username)
                .query('UPDATE users SET is_2fa_enabled = 0, two_factor_secret = NULL WHERE username = @username');
        }
        
        await notifySecurityEvent(req.user, role, req, '2FA_DISABLED', '2FA Devre Dışı Bırakıldı');
        res.json({ message: 'İki faktörlü doğrulama (2FA) başarıyla devredışı bırakıldı.' });
    } catch (err) {
        logger.error('disable2FA error:', err);
        res.status(500).json({ error: 'İşlem sırasında teknik hata oluştu.' });
    }
};

const signLicense = async (req, res) => {
    const { rentLimit, tourLimit, isAnnual } = req.body;
    
    if (rentLimit === undefined || tourLimit === undefined) {
        return res.status(400).json({ error: 'Eksik limit degerleri.' });
    }

    try {
        const { generateLicenseKey } = require('../utils/licenseHelper');
        const expDays = isAnnual ? '365D' : '30D';
        
        const licenseKey = generateLicenseKey(parseInt(rentLimit), parseInt(tourLimit), expDays);
        
        res.json({
            success: true,
            licenseKey
        });
    } catch (err) {
        logger.error('License signing error:', err);
        res.status(500).json({ error: 'Lisans imzasi olusturulurken hata olustu.' });
    }
};

const demoLogin = async (req, res) => {
    const { requestedModule } = req.body;
    
    if (!requestedModule) {
        return res.status(400).json({ error: 'Lutfen talep edilen SaaS modulunu belirtin.' });
    }
    
    try {
        const pool = req.dbPool;
        let targetUsername = '';
        if (requestedModule === 'RENT_A_CAR') {
            targetUsername = 'RentACarDemo';
        } else if (requestedModule === 'TOUR_TRACKING') {
            targetUsername = 'TurTakipDemo';
        } else {
            return res.status(400).json({ error: 'Gecersiz modul secimi.' });
        }

        // Query master DB for the demo agency
        const result = await pool.request()
            .input('username', sql.NVarChar, targetUsername)
            .query('SELECT * FROM Agencies WHERE Username = @username');
        
        let agency = result.recordset[0];
        
        // Emniyet: Eğer veritabanında demo acente kaydı bulunamazsa fallback bilgileriyle oluştur
        if (!agency) {
            logger.warn(`[Demo Login Warning] Demo agency '${targetUsername}' not found in master DB. Using fallback details.`);
            if (requestedModule === 'RENT_A_CAR') {
                agency = {
                    AgencyID: 3,
                    Username: 'RentACarDemo',
                    AgencyName: 'Rent A Car Demo',
                    AgencyDBName: 'RENT_A_CAR_DEMO_DB',
                    IsBranch: false
                };
            } else {
                agency = {
                    AgencyID: 4,
                    Username: 'TurTakipDemo',
                    AgencyName: 'Tur Takip Demo',
                    AgencyDBName: 'TUR_TAKIP_DEMO_DB',
                    IsBranch: false
                };
            }
        }

        if (requestedModule === 'RENT_A_CAR') {
            const token = jwt.sign(
                { 
                    agencyId: agency.AgencyID,
                    username: agency.Username,
                    role: 'yonetici',
                    role_id: 2,
                    allowedModules: ['RENT_A_CAR'],
                    targetModule: 'RENT_A_CAR'
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );
            
            return res.json({
                success: true,
                role: 'yonetici',
                token,
                subdomain: agency.Username,
                username: agency.Username,
                fullName: agency.AgencyName + ' Yetkilisi',
                agencyName: agency.AgencyName
            });
        } else {
            const token = jwt.sign(
                { 
                    agencyId: agency.AgencyID, 
                    username: agency.Username,
                    role: 'AGENCY', 
                    dbName: agency.AgencyDBName,
                    agencyName: agency.AgencyName,
                    isBranch: agency.IsBranch ? true : false,
                    allowedModules: ['TOUR_TRACKING'],
                    targetModule: 'TOUR_TRACKING'
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );
            
            return res.json({
                success: true,
                role: 'AGENCY',
                token,
                agencyId: agency.AgencyID,
                username: agency.Username,
                fullName: agency.AgencyName + ' Yetkilisi',
                agencyName: agency.AgencyName,
                isBranch: agency.IsBranch ? 'true' : 'false'
            });
        }
    } catch (err) {
        logger.error('Demo Login Hatasi:', err);
        return res.status(500).json({ error: 'Demo simulasyonu baslatilirken bir hata olustu.' });
    }
};

const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Oturum bulunamadı' });
        }

        const { getPool } = require('../config/db');
        let isTwoFactorEnabled = false;

        if (req.user.role === 'SUPERADMIN') {
            const masterPool = await getPool('TurMasterDB');
            const resAdmin = await masterPool.request()
                .input('username', sql.NVarChar, req.user.username)
                .query('SELECT IsTwoFactorEnabled FROM SystemUsers WHERE Username = @username');
            isTwoFactorEnabled = !!resAdmin.recordset[0]?.IsTwoFactorEnabled;
        } else if (req.user.role === 'AGENCY' && req.user.agencyId) {
            const masterPool = await getPool('TurMasterDB');
            const resAgency = await masterPool.request()
                .input('agencyId', sql.Int, req.user.agencyId)
                .query('SELECT IsTwoFactorEnabled FROM Agencies WHERE AgencyID = @agencyId');
            isTwoFactorEnabled = !!resAgency.recordset[0]?.IsTwoFactorEnabled;
        } else if (req.user.isStaff && req.user.staffId && req.dbPool) {
            const resStaff = await req.dbPool.request()
                .input('staffId', sql.Int, req.user.staffId)
                .query('SELECT IsTwoFactorEnabled, Permissions FROM Staff WHERE StaffID = @staffId AND IsActive = 1');
            if (resStaff.recordset.length > 0) {
                const staff = resStaff.recordset[0];
                isTwoFactorEnabled = !!staff.IsTwoFactorEnabled;
                const permissions = staff.Permissions ? JSON.parse(staff.Permissions) : null;
                return res.json({
                    ...req.user,
                    permissions,
                    isTwoFactorEnabled
                });
            }
        }

        return res.json({
            ...req.user,
            isTwoFactorEnabled
        });
    } catch (err) {
        logger.error('getMe error:', err);
        return res.status(500).json({ error: 'Kullanıcı bilgileri alınamadı' });
    }
};

module.exports = { 
    login, 
    changePassword, 
    forgotPassword,
    getCaptcha,
    verify2FALogin,
    setup2FA,
    activate2FA,
    disable2FA,
    signLicense,
    demoLogin,
    getMe
};


