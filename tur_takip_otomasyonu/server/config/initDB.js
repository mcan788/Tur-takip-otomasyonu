const bcrypt = require('bcryptjs');
require('dotenv').config();
const { sql, getPool } = require('./db');

const masterDB = 'TurMasterDB';

// ─── GÜVENLİK: DB adı whitelist doğrulaması (SQL Injection koruması) ───
const validateDBName = (dbName) => {
    if (!dbName || !/^[A-Za-z0-9_]+$/.test(dbName)) {
        throw new Error(`Geçersiz veritabanı adı: ${dbName}`);
    }
    return dbName;
};

const TENANT_TABLES_SQL = `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Offices')
    BEGIN
        CREATE TABLE Offices (
            OfficeID INT PRIMARY KEY IDENTITY(1,1),
            OfficeName NVARCHAR(255) NOT NULL,
            Location NVARCHAR(MAX),
            CreatedAt DATETIME DEFAULT GETDATE()
        );
    END
`;

// ─── DEMO: Simülasyon veritabanına örnek veri ekle ───
const seedDemoTenantDB = async (pool) => {
    const checkBookingRes = await pool.request().query("SELECT COUNT(*) as count FROM Bookings");
    if (checkBookingRes.recordset[0].count === 0) {
        await pool.request().query("DELETE FROM Bookings");
        await pool.request().query("DELETE FROM Staff");
        await pool.request().query("DELETE FROM Tours");
        await pool.request().query("DELETE FROM Offices");
    }

    // 1. Offices
    const officeCountRes = await pool.request().query("SELECT COUNT(*) as count FROM Offices");
    if (officeCountRes.recordset[0].count === 0) {
        await pool.request().query(`
            INSERT INTO Offices (OfficeName, Location) VALUES 
            ('Antalya Ana Ofis', 'Antalya Merkez'),
            ('Alanya Şubesi', 'Alanya Marina'),
            ('Kemer Şubesi', 'Kemer Liman')
        `);
    }

    // 2. Tours
    const tourCountRes = await pool.request().query("SELECT COUNT(*) as count FROM Tours");
    if (tourCountRes.recordset[0].count === 0) {
        await pool.request().query(`
            INSERT INTO Tours (TourName, Description, Region, Category, DefaultPrice, DefaultPassFee, DefaultCurrency, PassengerPrice, DriverPrice) VALUES
            ('Tekne Turu', 'Harika bir Alanya koyları turu.', 'Alanya Marina', 'Deniz', 50.00, 15.00, '€', 0, 0),
            ('Rafting Macerası', 'Köprülü Kanyonda azgın sularda rafting.', 'Beşkonak', 'Doğa', 40.00, 10.00, '€', 0, 0),
            ('Jeep Safari', 'Toros Dağlarında macera dolu safari keyfi.', 'Toroslar', 'Macera', 35.00, 8.00, '€', 0, 0),
            ('Kapadokya Balon Turu', 'Gökyüzünde peri bacalarını izleme keyfi.', 'Göreme', 'Kültür', 180.00, 30.00, '$', 0, 0),
            ('Skydiving', 'Fethiye Ölüdeniz yamaç paraşütü heyecanı.', 'Fethiye', 'Macera', 120.00, 20.00, '€', 0, 0)
        `);
    }

    // 3. Staff (Demo)
    const staffCountRes = await pool.request().query("SELECT COUNT(*) as count FROM Staff");
    if (staffCountRes.recordset[0].count === 0) {
        const staffHash = await bcrypt.hash('demo123', 10);
        await pool.request()
            .input('hash', staffHash)
            .query(`
                INSERT INTO Staff (FullName, Username, Email, PasswordHash, Role, IsActive) VALUES
                ('Ahmet Demir', 'ahmetdemir', 'staff@zyronova.com', @hash, 'PERSONEL', 1),
                ('Mehmet Can', 'mehmetcan', 'manager@zyronova.com', @hash, 'ADMIN', 1)
            `);
    }

    // 4. Bookings
    const bookingCountRes = await pool.request().query("SELECT COUNT(*) as count FROM Bookings");
    if (bookingCountRes.recordset[0].count === 0) {
        const offices = await pool.request().query("SELECT OfficeID FROM Offices");
        const tours = await pool.request().query("SELECT TourID, TourName, DefaultPrice, DefaultCurrency FROM Tours");

        const mainOfficeId = offices.recordset[0]?.OfficeID || 1;
        const alanyaOfficeId = offices.recordset[1]?.OfficeID || 2;

        const findTour = (name) => tours.recordset.find(t => t.TourName.includes(name));
        const tekneTourId = findTour('Tekne')?.TourID || 1;
        const raftingTourId = findTour('Rafting')?.TourID || 2;
        const jeepTourId = findTour('Jeep')?.TourID || 3;
        const balonTourId = findTour('Balon')?.TourID || 4;
        const skydivingTourId = findTour('Skydiving')?.TourID || 5;

        const getPastDate = (daysAgo) => {
            const d = new Date();
            d.setDate(d.getDate() - daysAgo);
            return d.toISOString().slice(0, 19).replace('T', ' ');
        };

        await pool.request().query(`
            INSERT INTO Bookings (TourID, OfficeID, TouristName, HotelName, AdultCount, ChildCount, BabyCount, PassengerCount, DriverCount, VehicleCount, ActualPassFee, Earnings, Currency, Notes, BookingDate) VALUES
            (${tekneTourId}, ${mainOfficeId}, 'Ahmet Yılmaz', 'Arycanda Hotel', 2, 1, 0, 3, 0, 0, 45.00, 150.00, '€', 'Nakit Ödeme', '${getPastDate(0)}'),
            (${tekneTourId}, ${mainOfficeId}, 'Sarah Smith', 'MERYAN Hotel', 4, 0, 0, 4, 0, 0, 60.00, 200.00, '€', 'Nakit Ödeme', '${getPastDate(1)}'),
            (${tekneTourId}, ${alanyaOfficeId}, 'Elif Kaya', 'Arycanda Hotel', 1, 0, 0, 1, 0, 0, 15.00, 50.00, '€', 'Nakit Ödeme', '${getPastDate(3)}'),
            (${raftingTourId}, ${mainOfficeId}, 'Ali Yıldız', 'Sueno Hotels', 3, 0, 0, 0, 0, 0, 30.00, 120.00, '€', 'Nakit Ödeme', '${getPastDate(1)}'),
            (${raftingTourId}, ${alanyaOfficeId}, 'Maria Schmidt', 'Regnum Carya', 2, 2, 0, 0, 0, 0, 20.00, 120.00, '€', 'Kart Ödemesi', '${getPastDate(3)}'),
            (${raftingTourId}, ${mainOfficeId}, 'James Wilson', 'Arycanda Hotel', 5, 1, 0, 0, 0, 0, 50.00, 220.00, '€', 'Nakit Ödeme', '${getPastDate(6)}'),
            (${raftingTourId}, ${alanyaOfficeId}, 'Zeynep Arslan', 'Titanic Deluxe', 2, 0, 0, 0, 0, 0, 20.00, 80.00, '€', 'Kart Ödemesi', '${getPastDate(9)}'),
            (${jeepTourId}, ${mainOfficeId}, 'Emma Johnson', 'Rixos Premium', 2, 1, 0, 0, 0, 1, 16.00, 105.00, '€', 'Nakit Ödeme', '${getPastDate(2)}'),
            (${jeepTourId}, ${mainOfficeId}, 'Mehmet Aksoy', 'Titanic Deluxe', 4, 2, 1, 0, 0, 2, 24.00, 175.00, '€', 'Kart Ödemesi', '${getPastDate(4)}'),
            (${jeepTourId}, ${alanyaOfficeId}, 'Klaus Weber', 'Maxx Royal', 2, 0, 0, 0, 0, 1, 16.00, 70.00, '€', 'Nakit Ödeme', '${getPastDate(7)}'),
            (${balonTourId}, ${alanyaOfficeId}, 'Hans Müller', 'Konaklı Hotel', 2, 0, 0, 2, 0, 0, 60.00, 360.00, '$', 'Kart Ödemesi', '${getPastDate(2)}'),
            (${balonTourId}, ${mainOfficeId}, 'David Brown', 'MERYAN Hotel', 3, 1, 0, 4, 0, 0, 90.00, 540.00, '$', 'Kart Ödemesi', '${getPastDate(5)}'),
            (${skydivingTourId}, ${mainOfficeId}, 'Can Özdemir', 'MERYAN Hotel', 1, 0, 0, 0, 0, 0, 0.00, 80.00, '€', 'Nakit Ödeme', '${getPastDate(1)}'),
            (${skydivingTourId}, ${mainOfficeId}, 'Sophie Martin', 'Rixos Premium', 2, 0, 0, 0, 0, 0, 0.00, 160.00, '€', 'Kart Ödemesi', '${getPastDate(5)}'),
            (${skydivingTourId}, ${alanyaOfficeId}, 'Thomas Bauer', 'Maxx Royal', 1, 0, 0, 0, 0, 0, 0.00, 80.00, '€', 'Nakit Ödeme', '${getPastDate(8)}')
        `);
    }
};

const initDatabase = async () => {
    try {
        console.log('[DB Init] Master veritabanı kurulumu başlıyor...');

        const masterPool = await getPool(masterDB);

        // ─── SÜPER ADMİN KONTROLÜ (admin / admin123) ───
        const adminCheck = await masterPool.request().query("SELECT UserID FROM SystemUsers WHERE Username = 'admin'");
        if (adminCheck.recordset.length === 0) {
            const adminHash = await bcrypt.hash('admin123', 10);
            await masterPool.request()
                .input('hash', adminHash)
                .query("INSERT INTO SystemUsers (Username, PasswordHash, FullName, Role) VALUES ('admin', @hash, 'Sistem Yöneticisi', 'SUPERADMIN')");
            console.log('[DB Init] Varsayılan Süper Admin (admin / admin123) oluşturuldu.');
        }

        // ─── DEMO ACENTELERİ (Simülasyon için gerekli) ───
        // TurTakipDemo
        const tourDemoCheck = await masterPool.request().query("SELECT AgencyID FROM Agencies WHERE Username = 'TurTakipDemo'");
        let tourDemoId;
        if (tourDemoCheck.recordset.length === 0) {
            const demoHash = await bcrypt.hash('demo123', 10);
            const insertRes = await masterPool.request()
                .input('hash', demoHash)
                .query(`INSERT INTO Agencies (AgencyName, Username, OwnerName, OwnerEmail, PasswordHash, AgencyDBName, LicenseKey, LicenseExpiryDate, IsActive, IsBranch, MustChangePassword, ParentAgencyID, ModuleType) 
                        OUTPUT INSERTED.AgencyID
                        VALUES ('Tur Takip Operasyon', 'TurTakipDemo', 'Mehmet Can Yılmaz', 'tour@zyronova.com', @hash, 'TUR_TAKIP_DEMO_DB', 'LISC-TOUR-DEMO', '2035-01-01', 1, 0, 0, NULL, 'TOUR_TRACKING')`);
            tourDemoId = insertRes.recordset[0]?.AgencyID || 1;
            console.log(`[Demo Setup] TurTakipDemo oluşturuldu (ID: ${tourDemoId})`);
        } else {
            tourDemoId = tourDemoCheck.recordset[0].AgencyID;
        }

        // TurTakipDemo alt şubeleri
        const branchCheck = await masterPool.request()
            .input('parentId', tourDemoId)
            .query("SELECT COUNT(*) as count FROM Agencies WHERE ParentAgencyID = @parentId");

        if (branchCheck.recordset[0].count === 0) {
            const demoHash = await bcrypt.hash('demo123', 10);
            await masterPool.request()
                .input('hash', demoHash)
                .input('parentId', tourDemoId)
                .query(`INSERT INTO Agencies (AgencyName, Username, OwnerName, OwnerEmail, PasswordHash, AgencyDBName, LicenseKey, LicenseExpiryDate, IsActive, IsBranch, MustChangePassword, ParentAgencyID, ModuleType) 
                        VALUES ('Alanya Şubesi', 'TurTakipDemoAlanya', 'Mehmet Can Alanya', 'alanya-tour@zyronova.com', @hash, 'TUR_TAKIP_DEMO_ALANYA_DB', 'LISC-TOUR-DEMO-ALANYA', '2035-01-01', 1, 1, 0, @parentId, 'TOUR_TRACKING'),
                               ('Kemer Şubesi', 'TurTakipDemoKemer', 'Mehmet Can Kemer', 'kemer-tour@zyronova.com', @hash, 'TUR_TAKIP_DEMO_KEMER_DB', 'LISC-TOUR-DEMO-KEMER', '2035-01-01', 1, 1, 0, @parentId, 'TOUR_TRACKING')`);
            console.log('[Demo Setup] Şube kayıtları oluşturuldu.');
            await createAgencyDatabase('TUR_TAKIP_DEMO_ALANYA_DB');
            await createAgencyDatabase('TUR_TAKIP_DEMO_KEMER_DB');
        }

        // RentACarDemo
        const rentDemoCheck = await masterPool.request().query("SELECT COUNT(*) as count FROM Agencies WHERE Username = 'RentACarDemo'");
        if (rentDemoCheck.recordset[0].count === 0) {
            const demoHash = await bcrypt.hash('demo123', 10);
            await masterPool.request()
                .input('hash', demoHash)
                .query(`INSERT INTO Agencies (AgencyName, Username, OwnerName, OwnerEmail, PasswordHash, AgencyDBName, LicenseKey, LicenseExpiryDate, IsActive, IsBranch, MustChangePassword, ParentAgencyID, ModuleType) 
                        VALUES ('Zyronova Rent A Car', 'RentACarDemo', 'Mehmet Can Yılmaz', 'rent@zyronova.com', @hash, 'RENT_A_CAR_DEMO_DB', 'LISC-RENT-DEMO', '2035-01-01', 1, 0, 0, NULL, 'RENT')`);
            console.log('[Demo Setup] RentACarDemo oluşturuldu.');
        } else {
            await masterPool.request().query("UPDATE Agencies SET ModuleType = 'RENT' WHERE Username = 'RentACarDemo'");
        }

        // Demo veritabanlarını oluştur
        await createAgencyDatabase('TUR_TAKIP_DEMO_DB');
        await createAgencyDatabase('RENT_A_CAR_DEMO_DB');

        // Tüm acente DB şemalarını güncelle
        const agenciesRes = await masterPool.request().query('SELECT AgencyID, Username, AgencyDBName FROM Agencies');

        for (const agency of agenciesRes.recordset) {
            const db = agency.AgencyDBName;
            if (!db) continue;
            try {
                const agencyPool = await getPool(db);
                await agencyPool.request().query(TENANT_TABLES_SQL);

                if (db === 'TUR_TAKIP_DEMO_DB' || db === 'TUR_TAKIP_DEMO_ALANYA_DB' || db === 'TUR_TAKIP_DEMO_KEMER_DB') {
                    await seedDemoTenantDB(agencyPool);
                }

                console.log(`[DB Init] ${db} şeması güncellendi.`);
            } catch (e) {
                console.error(`[DB Init] ${db} şema hatası:`, e.message);
            }
        }

        console.log('[DB Init] Master veritabanı kurulumu tamamlandı.');
        return true;
    } catch (err) {
        console.error('[DB Init] KRİTİK HATA:', err.message);
        return false;
    }
};

const createAgencyDatabase = async (dbName) => {
    try {
        validateDBName(dbName);
        const agencyPool = await getPool(dbName);
        await agencyPool.request().query(TENANT_TABLES_SQL);
        return true;
    } catch (err) {
        console.error(`[createAgencyDatabase] ${dbName} hatası:`, err.message);
        throw err;
    }
};

module.exports = { initDatabase, createAgencyDatabase };
