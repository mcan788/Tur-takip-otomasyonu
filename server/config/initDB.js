const sql = require('mssql/msnodesqlv8');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const config = {
    driver: 'msnodesqlv8',
    server: process.env.DB_SERVER,
    options: { trustedConnection: true },
    requestTimeout: 180000,   // 180 saniye
    connectionTimeout: 60000  // 60 saniye bağlantı zaman aşımı
};

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

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tours')
    BEGIN
        CREATE TABLE Tours (
            TourID INT PRIMARY KEY IDENTITY(1,1),
            OfficeID INT,
            TourName NVARCHAR(255) NOT NULL,
            Description NVARCHAR(MAX),
            Region NVARCHAR(255),
            Category NVARCHAR(100),
            DefaultPrice DECIMAL(18, 2),
            DefaultPassFee DECIMAL(18, 2),
            DefaultCurrency NVARCHAR(10) DEFAULT '€',
            Fields NVARCHAR(MAX) DEFAULT 'Yetişkin,Çocuk,Bebek',
            PassengerPrice DECIMAL(18, 2) DEFAULT 0,
            DriverPrice DECIMAL(18, 2) DEFAULT 0,
            CreatedAt DATETIME DEFAULT GETDATE()
        );
    END
    ELSE
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'OfficeID')
            ALTER TABLE Tours ADD OfficeID INT;
    END

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Expenses')
    BEGIN
        CREATE TABLE Expenses (
            ExpenseID INT PRIMARY KEY IDENTITY(1,1),
            OfficeID INT FOREIGN KEY REFERENCES Offices(OfficeID),
            Description NVARCHAR(255),
            Amount DECIMAL(18, 2) NOT NULL,
            Category NVARCHAR(100),
            Currency NVARCHAR(10) DEFAULT '€',
            ExpenseDate DATETIME DEFAULT GETDATE()
        );
    END

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Staff')
    BEGIN
        CREATE TABLE Staff (
            StaffID INT PRIMARY KEY IDENTITY(1,1),
            FullName NVARCHAR(255) NOT NULL,
            Username NVARCHAR(100) UNIQUE NOT NULL,
            Email NVARCHAR(255),
            PasswordHash NVARCHAR(MAX) NOT NULL,
            Role NVARCHAR(50) DEFAULT 'PERSONEL',
            Permissions NVARCHAR(MAX) NULL,
            IsActive BIT DEFAULT 1,
            MustChangePassword BIT DEFAULT 0,
            IsTwoFactorEnabled BIT DEFAULT 0,
            TwoFactorSecret NVARCHAR(100) NULL,
            TwoFactorRecoveryCodes NVARCHAR(MAX) NULL,
            CreatedAt DATETIME DEFAULT GETDATE()
        );
    END
    ELSE
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Staff') AND name = 'Permissions')
            ALTER TABLE Staff ADD Permissions NVARCHAR(MAX) NULL;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Staff') AND name = 'MustChangePassword')
            ALTER TABLE Staff ADD MustChangePassword BIT DEFAULT 0;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Staff') AND name = 'IsTwoFactorEnabled')
            ALTER TABLE Staff ADD IsTwoFactorEnabled BIT DEFAULT 0;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Staff') AND name = 'TwoFactorSecret')
            ALTER TABLE Staff ADD TwoFactorSecret NVARCHAR(100) NULL;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Staff') AND name = 'TwoFactorRecoveryCodes')
            ALTER TABLE Staff ADD TwoFactorRecoveryCodes NVARCHAR(MAX) NULL;
    END

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Bookings')
    BEGIN
        CREATE TABLE Bookings (
            BookingID INT PRIMARY KEY IDENTITY(1,1),
            TourID INT FOREIGN KEY REFERENCES Tours(TourID),
            OfficeID INT FOREIGN KEY REFERENCES Offices(OfficeID),
            TouristName NVARCHAR(255),
            HotelName NVARCHAR(255),
            AdultCount INT DEFAULT 0,
            ChildCount INT DEFAULT 0,
            BabyCount INT DEFAULT 0,
            PassengerCount INT DEFAULT 0,
            DriverCount INT DEFAULT 0,
            VehicleCount INT DEFAULT 0,
            ActualPassFee DECIMAL(18, 2) DEFAULT 0,
            Earnings DECIMAL(18, 2) DEFAULT 0,
            Currency NVARCHAR(10) DEFAULT '€',
            Notes NVARCHAR(MAX),
            IsApproved BIT NOT NULL DEFAULT 0,
            BookingDate DATETIME DEFAULT GETDATE()
        );
    END
    ELSE
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'AdultCount') ALTER TABLE Bookings ADD AdultCount INT DEFAULT 0;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'ChildCount') ALTER TABLE Bookings ADD ChildCount INT DEFAULT 0;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'BabyCount') ALTER TABLE Bookings ADD BabyCount INT DEFAULT 0;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'PassengerCount') ALTER TABLE Bookings ADD PassengerCount INT DEFAULT 0;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'DriverCount') ALTER TABLE Bookings ADD DriverCount INT DEFAULT 0;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'VehicleCount') ALTER TABLE Bookings ADD VehicleCount INT DEFAULT 0;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'ActualPassFee') ALTER TABLE Bookings ADD ActualPassFee DECIMAL(18, 2) DEFAULT 0;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'Earnings') ALTER TABLE Bookings ADD Earnings DECIMAL(18, 2) DEFAULT 0;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'IsApproved') ALTER TABLE Bookings ADD IsApproved BIT NOT NULL DEFAULT 0;
    END

    IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Tours')
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'Fields') ALTER TABLE Tours ADD Fields NVARCHAR(MAX) DEFAULT 'Yetişkin,Çocuk,Bebek';
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'PassengerPrice') ALTER TABLE Tours ADD PassengerPrice DECIMAL(18, 2) DEFAULT 0;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'DriverPrice') ALTER TABLE Tours ADD DriverPrice DECIMAL(18, 2) DEFAULT 0;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'DefaultPrice') ALTER TABLE Tours ADD DefaultPrice DECIMAL(18, 2) DEFAULT 0;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'DefaultPassFee') ALTER TABLE Tours ADD DefaultPassFee DECIMAL(18, 2) DEFAULT 0;
    END
`;

// ─── DEMO: Simülasyon veritabanına örnek veri ekle ───
const seedDemoTenantDB = async (pool) => {
    // Eğer Bookings tablosu boşsa, önceki yarım kalmış kurulumu temizleyip sıfırdan kur
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
            -- Tekne Turu
            (${tekneTourId}, ${mainOfficeId}, 'Ahmet Yılmaz', 'Arycanda Hotel', 2, 1, 0, 3, 0, 0, 45.00, 150.00, '€', 'Nakit Ödeme', '${getPastDate(0)}'),
            (${tekneTourId}, ${mainOfficeId}, 'Sarah Smith', 'MERYAN Hotel', 4, 0, 0, 4, 0, 0, 60.00, 200.00, '€', 'Nakit Ödeme', '${getPastDate(1)}'),
            (${tekneTourId}, ${alanyaOfficeId}, 'Elif Kaya', 'Arycanda Hotel', 1, 0, 0, 1, 0, 0, 15.00, 50.00, '€', 'Nakit Ödeme', '${getPastDate(3)}'),
            -- Rafting Macerası
            (${raftingTourId}, ${mainOfficeId}, 'Ali Yıldız', 'Sueno Hotels', 3, 0, 0, 0, 0, 0, 30.00, 120.00, '€', 'Nakit Ödeme', '${getPastDate(1)}'),
            (${raftingTourId}, ${alanyaOfficeId}, 'Maria Schmidt', 'Regnum Carya', 2, 2, 0, 0, 0, 0, 20.00, 120.00, '€', 'Kart Ödemesi', '${getPastDate(3)}'),
            (${raftingTourId}, ${mainOfficeId}, 'James Wilson', 'Arycanda Hotel', 5, 1, 0, 0, 0, 0, 50.00, 220.00, '€', 'Nakit Ödeme', '${getPastDate(6)}'),
            (${raftingTourId}, ${alanyaOfficeId}, 'Zeynep Arslan', 'Titanic Deluxe', 2, 0, 0, 0, 0, 0, 20.00, 80.00, '€', 'Kart Ödemesi', '${getPastDate(9)}'),
            -- Jeep Safari
            (${jeepTourId}, ${mainOfficeId}, 'Emma Johnson', 'Rixos Premium', 2, 1, 0, 0, 0, 1, 16.00, 105.00, '€', 'Nakit Ödeme', '${getPastDate(2)}'),
            (${jeepTourId}, ${mainOfficeId}, 'Mehmet Aksoy', 'Titanic Deluxe', 4, 2, 1, 0, 0, 2, 24.00, 175.00, '€', 'Kart Ödemesi', '${getPastDate(4)}'),
            (${jeepTourId}, ${alanyaOfficeId}, 'Klaus Weber', 'Maxx Royal', 2, 0, 0, 0, 0, 1, 16.00, 70.00, '€', 'Nakit Ödeme', '${getPastDate(7)}'),
            -- Kapadokya Balon Turu
            (${balonTourId}, ${alanyaOfficeId}, 'Hans Müller', 'Konaklı Hotel', 2, 0, 0, 2, 0, 0, 60.00, 360.00, '$', 'Kart Ödemesi', '${getPastDate(2)}'),
            (${balonTourId}, ${mainOfficeId}, 'David Brown', 'MERYAN Hotel', 3, 1, 0, 4, 0, 0, 90.00, 540.00, '$', 'Kart Ödemesi', '${getPastDate(5)}'),
            -- Skydiving
            (${skydivingTourId}, ${mainOfficeId}, 'Can Özdemir', 'MERYAN Hotel', 1, 0, 0, 0, 0, 0, 0.00, 80.00, '€', 'Nakit Ödeme', '${getPastDate(1)}'),
            (${skydivingTourId}, ${mainOfficeId}, 'Sophie Martin', 'Rixos Premium', 2, 0, 0, 0, 0, 0, 0.00, 160.00, '€', 'Kart Ödemesi', '${getPastDate(5)}'),
            (${skydivingTourId}, ${alanyaOfficeId}, 'Thomas Bauer', 'Maxx Royal', 1, 0, 0, 0, 0, 0, 0.00, 80.00, '€', 'Nakit Ödeme', '${getPastDate(8)}')
        `);
    }
};

const initDatabase = async () => {
    try {
        console.log('[DB Init] Master veritabanı kurulumu başlıyor...');

        let pool = await new sql.ConnectionPool({
            ...config,
            connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=master;Trusted_Connection=yes;`
        }).connect();

        await pool.request().query(`IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${masterDB}') CREATE DATABASE ${masterDB}`);
        await pool.close();

        const masterPool = await new sql.ConnectionPool({
            ...config,
            connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${masterDB};Trusted_Connection=yes;`
        }).connect();

        // SystemUsers tablosu
        await masterPool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemUsers')
            BEGIN
                CREATE TABLE SystemUsers (
                    UserID INT PRIMARY KEY IDENTITY(1,1),
                    Username NVARCHAR(100) UNIQUE NOT NULL,
                    PasswordHash NVARCHAR(MAX) NOT NULL,
                    FullName NVARCHAR(255),
                    Role NVARCHAR(50) DEFAULT 'SUPERADMIN',
                    IsTwoFactorEnabled BIT DEFAULT 0,
                    TwoFactorSecret NVARCHAR(100) NULL,
                    TwoFactorRecoveryCodes NVARCHAR(MAX) NULL,
                    CreatedAt DATETIME DEFAULT GETDATE()
                );
                DECLARE @adminHash NVARCHAR(MAX) = '$2a$10$7R6EclUUsUeU7J5JpP/rUuUuUuUuUuUuUuUuUuUuUuUuUuUuUuUuU';
                INSERT INTO SystemUsers (Username, PasswordHash, FullName, Role) VALUES ('admin', @adminHash, 'Sistem Yoneticisi', 'SUPERADMIN');
            END
        `);

        // 2FA kolon güncellemeleri
        await masterPool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SystemUsers') AND name = 'IsTwoFactorEnabled')
                ALTER TABLE SystemUsers ADD IsTwoFactorEnabled BIT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SystemUsers') AND name = 'TwoFactorSecret')
                ALTER TABLE SystemUsers ADD TwoFactorSecret NVARCHAR(100) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SystemUsers') AND name = 'TwoFactorRecoveryCodes')
                ALTER TABLE SystemUsers ADD TwoFactorRecoveryCodes NVARCHAR(MAX) NULL;
        `);

        // Agencies tablosu
        await masterPool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Agencies')
            BEGIN
                CREATE TABLE Agencies (
                    AgencyID INT PRIMARY KEY IDENTITY(1,1),
                    AgencyName NVARCHAR(255) NOT NULL,
                    Username NVARCHAR(100) NOT NULL,
                    OwnerName NVARCHAR(255) NOT NULL,
                    OwnerEmail NVARCHAR(255) NOT NULL,
                    PasswordHash NVARCHAR(MAX) NOT NULL,
                    AgencyDBName NVARCHAR(255) UNIQUE NOT NULL,
                    LicenseKey NVARCHAR(100) UNIQUE NOT NULL,
                    LicenseExpiryDate DATETIME NOT NULL,
                    LicensePrice DECIMAL(18,2) DEFAULT 0,
                    MustChangePassword BIT DEFAULT 1,
                    IsActive BIT DEFAULT 1,
                    ModuleType NVARCHAR(50) DEFAULT 'TOUR',
                    ParentAgencyID INT NULL,
                    IsBranch BIT DEFAULT 0,
                    AssignedOfficeID INT NULL,
                    IsTwoFactorEnabled BIT DEFAULT 0,
                    TwoFactorSecret NVARCHAR(100) NULL,
                    TwoFactorRecoveryCodes NVARCHAR(MAX) NULL,
                    CreatedAt DATETIME DEFAULT GETDATE()
                );
            END
        `);

        // 2FA kolonları
        await masterPool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Agencies') AND name = 'IsTwoFactorEnabled')
                ALTER TABLE Agencies ADD IsTwoFactorEnabled BIT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Agencies') AND name = 'TwoFactorSecret')
                ALTER TABLE Agencies ADD TwoFactorSecret NVARCHAR(100) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Agencies') AND name = 'TwoFactorRecoveryCodes')
                ALTER TABLE Agencies ADD TwoFactorRecoveryCodes NVARCHAR(MAX) NULL;
        `);

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
            tourDemoId = insertRes.recordset[0].AgencyID;
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
                const agencyPool = await new sql.ConnectionPool({
                    ...config,
                    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${db};Trusted_Connection=yes;`
                }).connect();

                await agencyPool.request().query(TENANT_TABLES_SQL);

                // Demo DB'lere örnek veri ekle
                if (db === 'TUR_TAKIP_DEMO_DB') {
                    await seedDemoTenantDB(agencyPool);
                }

                await agencyPool.close();
                console.log(`[DB Init] ${db} şeması güncellendi.`);
            } catch (e) {
                console.error(`[DB Init] ${db} şema hatası:`, e.message);
            }
        }

        console.log('[DB Init] Master veritabanı kurulumu tamamlandı.');
        await masterPool.close();
        return true;
    } catch (err) {
        console.error('[DB Init] KRİTİK HATA:', err.message);
        return false;
    }
};

const createAgencyDatabase = async (dbName) => {
    try {
        // GÜVENLİK: DB adı doğrulaması (SQL Injection koruması)
        validateDBName(dbName);

        let pool = await new sql.ConnectionPool({
            ...config,
            connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=master;Trusted_Connection=yes;`
        }).connect();

        await pool.request().query(`IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${dbName}') CREATE DATABASE [${dbName}]`);
        await pool.close();

        const agencyPool = await new sql.ConnectionPool({
            ...config,
            connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${dbName};Trusted_Connection=yes;`
        }).connect();

        await agencyPool.request().query(TENANT_TABLES_SQL);
        await agencyPool.close();
        return true;
    } catch (err) {
        console.error(`[createAgencyDatabase] ${dbName} hatası:`, err.message);
        throw err;
    }
};

module.exports = { initDatabase, createAgencyDatabase };
