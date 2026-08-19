const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sql, masterPool, getPool } = require('../config/db');
const { createAgencyDatabase } = require('../config/initDB');

// GÜVENLİK: DB adı whitelist doğrulaması
const validateDBName = (dbName) => {
    if (!dbName || !/^[A-Za-z0-9_]+$/.test(dbName)) {
        throw new Error(`Geçersiz veritabanı adı: ${dbName}`);
    }
    return dbName;
};

const BLOCKED_DOMAINS = [
    'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'yopmail.com', 
    'temp-mail.org', 'trashmail.com', 'emailondeck.com', 'fakeinbox.com', 
    'maildrop.cc', 'tempemail.cc', 'throwaway.email', 'tempail.com', 
    'dispostable.com', 'sharklasers.com', 'grr.la', 'mailnesia.com', 
    'getnada.com', 'mohmal.com', 'tempinbox.com', 'mailtemp.com',
    'tempmail.net', 'temp-mail.io', 'dropmail.me', 'instaddr.com'
];

const isTempMail = (email) => {
    if (!email) return false;
    const domain = email.split('@')[1];
    return BLOCKED_DOMAINS.includes(domain?.toLowerCase());
};

const createAgency = async (req, res) => {
    let { 
        agencyName, username, ownerName, ownerPhone, password, 
        licenseMonths, moduleType, licensePrice,
        isBranch, parentAgencyId, assignedOfficeId 
    } = req.body;

    // KRİTİK ALAN DOĞRULAMA
    if (!agencyName || !username || !ownerName || !ownerPhone) {
        return res.status(400).json({ error: 'Lütfen tüm zorunlu alanları (Acente Adı, Kullanıcı Adı, Yönetici Adı ve Telefon Numarası) doldurun.' });
    }

    // Boş stringleri null yap (DB için)
    const parentId = (parentAgencyId && parentAgencyId !== '') ? parseInt(parentAgencyId) : null;
    const officeId = (assignedOfficeId && assignedOfficeId !== '') ? parseInt(assignedOfficeId) : null;

    if (isBranch && !parentId) {
        return res.status(400).json({ error: 'Şubeler için bağlı olunan ana acente seçilmelidir.' });
    }

    const pool = masterPool;

    // isTempMail validation removed since it's a phone number now

    if (!password) {
        password = crypto.randomBytes(4).toString('hex'); 
    }

    try {
        // 1. ŞEMA ONARIMI
        await pool.request().query(`
            -- Kolonları ekle
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Agencies') AND name = 'IsBranch')
                ALTER TABLE Agencies ADD IsBranch BIT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Agencies') AND name = 'ParentAgencyID')
                ALTER TABLE Agencies ADD ParentAgencyID INT;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Agencies') AND name = 'AssignedOfficeID')
                ALTER TABLE Agencies ADD AssignedOfficeID INT;

            -- AgencyDBName üzerindeki UNIQUE kısıtlamasını (Constraint veya Index) KALDIR
            DECLARE @ConstraintName nvarchar(200);
            
            -- Önce Constraint olarak ara
            SELECT @ConstraintName = name FROM sys.objects 
            WHERE type = 'UQ' AND parent_object_id = OBJECT_ID('Agencies') 
            AND (name = 'UQ_AgencyDBName' OR name LIKE '%AgencyDBName%');

            IF @ConstraintName IS NOT NULL
                EXEC('ALTER TABLE Agencies DROP CONSTRAINT [' + @ConstraintName + ']');

            -- Eğer Index olarak tanımlanmışsa onu da kaldır
            IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_AgencyDBName' AND object_id = OBJECT_ID('Agencies'))
                DROP INDEX UQ_AgencyDBName ON Agencies;
        `);

        // 2. DB İSMİ BELİRLE (Format: MELIS_TUR_ANAOFIS_DB veya MELIS_TUR_SUBE_3_DB)
        const cleanAgencyName = agencyName
            .replace(/[^a-zA-Z0-9]/g, '_')
            .toUpperCase()
            .replace(/__+/g, '_');
        
        let dbName = `${cleanAgencyName}_ANAOFIS_DB`;
        
        if (isBranch) {
             dbName = `${cleanAgencyName}_SUBE_${parentId}_DB`;
        }
        const dbNameSafe = `TurAgency_${username.replace(/[^a-zA-Z0-9]/g, '')}`;
        await createAgencyDatabase(dbName);

        const passwordHash = await bcrypt.hash(password, 12);
        const prefix = moduleType === 'RENT' ? 'RNT' : 'TUR';
        const licenseKey = `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        
        const expiryDate = new Date();
        const months = parseFloat(licenseMonths);
        if (months === 0.5) {
            expiryDate.setDate(expiryDate.getDate() + 15);
        } else {
            const m = [1, 3, 6, 12].includes(parseInt(months)) ? parseInt(months) : 1;
            expiryDate.setMonth(expiryDate.getMonth() + m);
        }

        // 3. MASTER DB'YE KAYDET
        const result = await pool.request()
            .input('agencyName', sql.NVarChar, agencyName)
            .input('username', sql.NVarChar, username)
            .input('ownerName', sql.NVarChar, ownerName)
            .input('ownerEmail', sql.NVarChar, ownerPhone)
            .input('passwordHash', sql.NVarChar, passwordHash)
            .input('agencyDbName', sql.NVarChar, dbName)
            .input('moduleType', sql.NVarChar, moduleType)
            .input('licenseKey', sql.NVarChar, licenseKey)
            .input('expiryDate', sql.DateTime, expiryDate)
            .input('licensePrice', sql.Decimal(18, 2), licensePrice || 0)
            .input('isBranch', sql.Bit, isBranch ? 1 : 0)
            .input('parentAgencyId', sql.Int, isBranch ? parentId : null)
            .input('assignedOfficeId', sql.Int, isBranch ? officeId : null)
            .query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Agencies') AND name = 'IsActive')
                    ALTER TABLE Agencies ADD IsActive BIT DEFAULT 1;

                INSERT INTO Agencies (
                    AgencyName, Username, OwnerName, OwnerEmail, PasswordHash, 
                    AgencyDBName, ModuleType, LicenseKey, LicenseExpiryDate, 
                    LicensePrice, MustChangePassword, IsActive, IsBranch, 
                    ParentAgencyID, AssignedOfficeID
                )
                OUTPUT INSERTED.AgencyID
                VALUES (
                    @agencyName, @username, @ownerName, @ownerEmail, @passwordHash, 
                    @agencyDbName, @moduleType, @licenseKey, @expiryDate, 
                    @licensePrice, 1, 1, @isBranch, @parentAgencyId, @assignedOfficeId
                )
            `);

        res.status(201).json({
            message: 'Acente başarıyla oluşturuldu.',
            agencyId: result.recordset[0].AgencyID,
            dbName,
            licenseKey,
            expiryDate,
            generatedPassword: password
        });
    } catch (err) {
        console.error('Acente Oluşturma Hatası:', err);
        res.status(500).json({ error: err.message });
    }
};

const getAgencyOfficesForAdmin = async (req, res) => {
    const { agencyId } = req.params;
    const pool = masterPool;
    try {
        const agencyRes = await masterPool.request()
            .input('id', sql.Int, agencyId)
            .query('SELECT AgencyDBName FROM Agencies WHERE AgencyID = @id');
        if (agencyRes.recordset.length === 0) return res.status(404).json({ error: 'Acente bulunamadı.' });
        const agencyDB = agencyRes.recordset[0].AgencyDBName;
        const { getPool } = require('../config/db');
        const agencyPool = await getPool(agencyDB);
        const officesRes = await agencyPool.request().query('SELECT OfficeID, OfficeName, Location FROM Offices');
        res.json(officesRes.recordset);
    } catch (err) {
        console.error('Şube listeleme hatası:', err);
        res.status(500).json({ error: 'Şubeler listelenirken hata oluştu.' });
    }
};

const getAgencies = async (req, res) => {
    const pool = masterPool;
    try {
        const result = await pool.request().query('SELECT AgencyID, AgencyName, Username, OwnerName, OwnerEmail, AgencyDBName, ModuleType, LicenseExpiryDate, LicensePrice, IsActive, IsBranch, ParentAgencyID, AssignedOfficeID, CreatedAt FROM Agencies ORDER BY CreatedAt DESC');
        
        // Mevcut fiziksel veritabanlarını al
        const dbListRes = await pool.request().query('SELECT name FROM sys.databases WHERE database_id > 4');
        const existingDBs = dbListRes.recordset.map(db => db.name);

        // N+1 Optimizasyonu: Şube sayılarını tek sorguda al
        const branchCountsRes = await pool.request().query('SELECT ParentAgencyID, COUNT(*) as c FROM Agencies WHERE ParentAgencyID IS NOT NULL GROUP BY ParentAgencyID');
        const branchCountsMap = {};
        branchCountsRes.recordset.forEach(row => {
            branchCountsMap[row.ParentAgencyID] = row.c;
        });

        const agencies = await Promise.all(result.recordset.map(async agency => {
            const now = new Date();
            const expiry = new Date(agency.LicenseExpiryDate);
            const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            
            // Veritabanı hala var mı kontrol et
            const dbExists = existingDBs.includes(agency.AgencyDBName);

            let tourCount = 0;
            let staffCount = 0;
            let branchCount = 0;

            if (dbExists) {
                try {
                    const { getPool } = require('../config/db');
                    const tenantPool = await getPool(agency.AgencyDBName);
                    
                    if (agency.ModuleType === 'TOUR' || agency.ModuleType === 'TOUR_TRACKING') {
                        // Check if Tours exists safely
                        const tRes = await tenantPool.request().query(`
                            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Tours')
                                SELECT COUNT(*) as c FROM Tours
                            ELSE SELECT 0 as c
                        `);
                        tourCount = tRes.recordset[0].c;
                    }
                    
                    // Check if Staff exists safely
                    const sRes = await tenantPool.request().query(`
                        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Staff')
                            SELECT COUNT(*) as c FROM Staff
                        ELSE SELECT 0 as c
                    `);
                    staffCount = sRes.recordset[0].c;

                } catch (e) {
                    console.log('Error fetching stats for', agency.AgencyDBName, e.message);
                }
            }

            // Calculate branch count (Optimized O(1) lookup)
            branchCount = branchCountsMap[agency.AgencyID] || 0;

            return {
                ...agency,
                isExpiringSoon: diffDays <= 14 && diffDays > 0,
                isExpired: diffDays <= 0,
                daysRemaining: diffDays,
                dbStatus: dbExists ? 'ONLINE' : 'DATABASE_MISSING',
                TourCount: tourCount,
                StaffCount: staffCount,
                BranchCount: branchCount
            };
        }));
        res.json(agencies);
    } catch (err) {
        res.status(500).json({ error: 'Acenteler listelenirken hata: ' + err.message });
    }
};

const getSuperAdminReport = async (req, res) => {
    const pool = masterPool;
    try {
        const result = await pool.request().query(`
            SELECT ModuleType, COUNT(AgencyID) as AgencyCount, SUM(LicensePrice) as TotalRevenue
            FROM Agencies GROUP BY ModuleType
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Rapor alınırken hata: ' + err.message });
    }
};

const renewLicense = async (req, res) => {
    const { agencyId, months, price } = req.body;
    
    if (isNaN(months) || parseInt(months) < 1) {
        return res.status(400).json({ error: 'Geçersiz lisans süresi. Ay değeri 0\'dan büyük olmalıdır.' });
    }

    const pool = masterPool;
    try {
        const currentRes = await pool.request()
            .input('agencyId', sql.Int, agencyId)
            .query('SELECT LicenseExpiryDate, LicensePrice FROM Agencies WHERE AgencyID = @agencyId');
        
        if (currentRes.recordset.length === 0) return res.status(404).json({ error: 'Acente bulunamadı.' });

        let currentExpiry = new Date(currentRes.recordset[0].LicenseExpiryDate);
        const now = new Date();
        let baseDate = currentExpiry > now ? currentExpiry : now;
        
        // Ayları ekle
        baseDate.setMonth(baseDate.getMonth() + parseInt(months));

        await pool.request()
            .input('agencyId', sql.Int, agencyId)
            .input('expiryDate', sql.DateTime, baseDate)
            .input('licensePrice', sql.Decimal(18, 2), parseFloat(price) || 0)
            .query('UPDATE Agencies SET LicenseExpiryDate = @expiryDate, LicensePrice = ISNULL(LicensePrice, 0) + @licensePrice WHERE AgencyID = @agencyId');

        res.json({ message: 'Lisans başarıyla yenilendi.', expiryDate: baseDate });
    } catch (err) {
        console.error('Lisans Yenileme Hatası:', err);
        res.status(500).json({ error: 'Lisans yenilenirken hata oluştu: ' + err.message });
    }
};

const updateAgency = async (req, res) => {
    const { agencyId, agencyName, ownerName, ownerPhone, isActive } = req.body;
    const pool = masterPool;
    try {
        await pool.request().input('agencyId', sql.Int, agencyId).input('agencyName', sql.NVarChar, agencyName).input('ownerName', sql.NVarChar, ownerName).input('ownerEmail', sql.NVarChar, ownerPhone).input('isActive', sql.Bit, isActive)
            .query('UPDATE Agencies SET AgencyName = @agencyName, OwnerName = @ownerName, OwnerEmail = @ownerEmail, IsActive = @isActive WHERE AgencyID = @agencyId');
        res.json({ message: 'Acente başarıyla güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: 'Güncelleme yapılırken hata oluştu.' });
    }
};

const deleteAgency = async (req, res) => {
    const { id } = req.params;
    const pool = masterPool;
    try {
        const agencyRes = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT AgencyDBName FROM Agencies WHERE AgencyID = @id');
        
        if (agencyRes.recordset.length === 0) return res.status(404).json({ error: 'Acente bulunamadı.' });
        const dbName = agencyRes.recordset[0].AgencyDBName;

        // GÜVENLİK: dbName doğrulaması + master DB koruması
        if (!dbName || dbName === 'TurMasterDB' || !/^[A-Za-z0-9_]+$/.test(dbName)) {
            return res.status(400).json({ error: 'Geçersiz veritabanı adı. Silme işlemi iptal edildi.' });
        }

        // Fiziksel veritabanını sil
        try {
            await pool.request().query(`
                IF EXISTS (SELECT * FROM sys.databases WHERE name = '${dbName}')
                BEGIN
                    ALTER DATABASE [${dbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                    DROP DATABASE [${dbName}];
                END
            `);
            console.log(`[Database Deleted] ${dbName} fiziksel olarak silindi.`);
        } catch (dropErr) {
            console.error(`[Database Delete Error] ${dbName}:`, dropErr.message);
        }

        // 3. Master DB kaydını sil
        await pool.request().input('id', sql.Int, id).query('DELETE FROM Agencies WHERE AgencyID = @id');
        res.json({ message: 'Acente ve bağlı veritabanı tamamen silindi.' });
    } catch (err) {
        console.error('Silme Hatası:', err);
        res.status(500).json({ error: 'Acente silinirken hata oluştu: ' + err.message });
    }
};

const resetAgencyPassword = async (req, res) => {
    const { agencyId } = req.body;
    if (!agencyId) {
        return res.status(400).json({ error: 'Acente ID gereklidir.' });
    }

    const { masterPool: pool } = require('../config/db');
    try {
        // 1. Yeni rastgele şifre oluştur (8 karakter)
        const newPassword = crypto.randomBytes(4).toString('hex');
        
        // Şifreyi hashle ve DB'yi güncelle
        const passwordHash = await bcrypt.hash(newPassword, 12);
        
        // 3. Veritabanında güncelle (MustChangePassword'i 1 yap ki ilk girişte değişime zorlansın)
        const result = await pool.request()
            .input('agencyId', sql.Int, agencyId)
            .input('passwordHash', sql.NVarChar, passwordHash)
            .query('UPDATE Agencies SET PasswordHash = @passwordHash, MustChangePassword = 1 WHERE AgencyID = @agencyId');
            
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Acente bulunamadı.' });
        }

        res.json({ message: 'Şifre başarıyla sıfırlandı.', newPassword });
    } catch (err) {
        console.error('Şifre Sıfırlama Hatası:', err);
        res.status(500).json({ error: 'Şifre sıfırlanırken hata oluştu: ' + err.message });
    }
};

module.exports = { 
    createAgency, getAgencies, getSuperAdminReport, renewLicense, 
    updateAgency, deleteAgency, getAgencyOfficesForAdmin, resetAgencyPassword
};
