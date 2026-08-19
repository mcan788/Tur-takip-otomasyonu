const bcrypt = require('bcryptjs');
const { sql } = require('../config/db');

// Ofis yönetimi (Fiziksel Ofisler) sistemi basitleştirmek adına kaldırıldı. 
// Artık her şube "Sistem Şubesi" (Ayrı DB) olarak ekleniyor.

// Tur Ekleme (Gelişmiş)
const getOffices = async (req, res) => {
    const db = require('../config/db');
    const pool = db.masterPool;
    
    const agencyId = req.user?.agencyId;
    
    try {
        const result = await pool.request()
            .input('parentId', sql.Int, agencyId)
            .query('SELECT AgencyID, AgencyID as OfficeID, AgencyName as OfficeName, Username, 1 as isSystemBranch, IsActive FROM Agencies WHERE ParentAgencyID = @parentId');
            res.json(result.recordset);
    } catch (err) {
        console.error('Şubeler listelenirken kritik hata:', err);
        res.status(500).json({ error: 'Şube listesi yüklenemedi.' });
    }
};

const createTour = async (req, res) => {
    const { tourName, description, defaultPassFee, defaultPrice, passengerPrice, driverPrice, childPrice, babyPrice, currency, region, fields } = req.body;
    const pool = req.dbPool;

    // ZORUNLU ALAN KONTROLÜ
    if (!tourName || !region) {
        return res.status(400).json({ error: 'Tur Adı ve Bölge alanları zorunludur.' });
    }

    const hasSpecificPrice = (passengerPrice && parseFloat(passengerPrice) > 0) || (driverPrice && parseFloat(driverPrice) > 0) || (childPrice && parseFloat(childPrice) > 0) || (babyPrice && parseFloat(babyPrice) > 0);
    if (!hasSpecificPrice && (defaultPrice === undefined || defaultPrice === null || defaultPrice === '')) {
        return res.status(400).json({ error: 'En az bir fiyat alanı girmelisiniz.' });
    }

    try {
        // Otomatik Şema Onarımı: Eksik kolonları kontrol et ve ekle
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'Region')
                ALTER TABLE Tours ADD Region NVARCHAR(255);
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'DefaultPrice')
                ALTER TABLE Tours ADD DefaultPrice DECIMAL(18, 2);
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'Category')
                ALTER TABLE Tours ADD Category NVARCHAR(100);
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'Fields')
                ALTER TABLE Tours ADD Fields NVARCHAR(MAX) DEFAULT 'Yetişkin,Çocuk,Bebek';
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'PassengerPrice')
                ALTER TABLE Tours ADD PassengerPrice DECIMAL(18, 2);
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'DriverPrice')
                ALTER TABLE Tours ADD DriverPrice DECIMAL(18, 2);
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'ChildPrice')
                ALTER TABLE Tours ADD ChildPrice DECIMAL(18, 2);
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'BabyPrice')
                ALTER TABLE Tours ADD BabyPrice DECIMAL(18, 2);
        `);

        const assignedOfficeId = req.user.assignedOfficeId;
        const fieldsString = Array.isArray(fields) ? fields.join(',') : (fields || 'Yetişkin,Çocuk,Bebek');

        await pool.request()
            .input('officeId', sql.Int, assignedOfficeId || null)
            .input('tourName', sql.NVarChar, tourName)
            .input('description', sql.NVarChar, description || '')
            .input('defaultPassFee', sql.Decimal(18, 2), (defaultPassFee === undefined || defaultPassFee === '') ? null : defaultPassFee)
            .input('defaultPrice', sql.Decimal(18, 2), (defaultPrice === undefined || defaultPrice === '' || defaultPrice === null) ? 0 : parseFloat(defaultPrice))
            .input('passengerPrice', sql.Decimal(18, 2), (passengerPrice === undefined || passengerPrice === '' || passengerPrice === null) ? 0 : parseFloat(passengerPrice))
            .input('driverPrice', sql.Decimal(18, 2), (driverPrice === undefined || driverPrice === '' || driverPrice === null) ? 0 : parseFloat(driverPrice))
            .input('childPrice', sql.Decimal(18, 2), (childPrice === undefined || childPrice === '' || childPrice === null) ? 0 : parseFloat(childPrice))
            .input('babyPrice', sql.Decimal(18, 2), (babyPrice === undefined || babyPrice === '' || babyPrice === null) ? 0 : parseFloat(babyPrice))
            .input('currency', sql.NVarChar, currency || '€')
            .input('region', sql.NVarChar, region || '')
            .input('fields', sql.NVarChar, fieldsString)
            .query(`
                INSERT INTO Tours (OfficeID, TourName, Description, DefaultPassFee, DefaultPrice, PassengerPrice, DriverPrice, ChildPrice, BabyPrice, DefaultCurrency, Region, Fields) 
                VALUES (@officeId, @tourName, @description, @defaultPassFee, @defaultPrice, @passengerPrice, @driverPrice, @childPrice, @babyPrice, @currency, @region, @fields)
            `);

        res.status(201).json({ message: 'Tur başarıyla tanımlandı.' });
    } catch (err) {
        console.error('Tur tanımlama hatası:', err);
        res.status(500).json({ error: 'Tur tanımlanırken hata: ' + err.message });
    }
};

// Turları Listele (İstatistiklerle)
const getTours = async (req, res) => {
    const pool = req.dbPool;
    const isBranch = req.user?.isBranch;
    const assignedOfficeId = req.user?.assignedOfficeId;

    try {
        if (!pool) {
            return res.status(500).json({ error: 'Veritabanı bağlantısı kurulamadı.' });
        }

        let officeFilter = '';
        let tourFilter = '';
        const request = pool.request();
        
        if (isBranch && assignedOfficeId) {
            officeFilter = ' AND B.OfficeID = @officeId';
            // Şube ise: Kendi turlarını ve genel (NULL) turları görsün
            tourFilter = ' WHERE (T.OfficeID = @officeId OR T.OfficeID IS NULL)';
            request.input('officeId', sql.Int, assignedOfficeId);
        } else {
            // Ana ofis ise sadece genel turları (OfficeID is NULL) getir
            tourFilter = ' WHERE T.OfficeID IS NULL';
        }

        const query = `
            SELECT 
                T.*,
                (SELECT COUNT(*) FROM Bookings B WHERE B.TourID = T.TourID ${officeFilter}) as BookingCount,
                ISNULL((SELECT SUM(Earnings) FROM Bookings B WHERE B.TourID = T.TourID ${officeFilter}), 0) as TotalEarnings,
                ISNULL((SELECT SUM(ActualPassFee) FROM Bookings B WHERE B.TourID = T.TourID ${officeFilter}), 0) as TotalPassFee
            FROM Tours T 
            ${tourFilter}
            ORDER BY T.TourName ASC
        `;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('getTours DETAYLI HATA:', err);
        res.status(500).json({ error: 'Turlar listelenirken hata: ' + err.message });
    }
};

// Personel Ekleme
const createStaff = async (req, res) => {
    const { fullName, username, email, password, role, permissions } = req.body;
    const pool = req.dbPool;

    if (!username || !password || !fullName) {
        return res.status(400).json({ error: 'Ad Soyad, Kullanıcı Adı ve Şifre zorunludur.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Personel şifresi en az 8 karakter olmalıdır.' });
    }

    try {
        const forbiddenRoles = ['SUPERADMIN', 'ADMIN', 'SUPER_ADMIN', 'AGENCY'];
        const finalRole = (role && !forbiddenRoles.includes(role.toUpperCase())) ? role : 'PERSONEL';

        const passwordHash = await bcrypt.hash(password, 10);
        const permsString = permissions ? JSON.stringify(permissions) : null;
        
        await pool.request()
            .input('fullName', sql.NVarChar, fullName)
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('passwordHash', sql.NVarChar, passwordHash)
            .input('role', sql.NVarChar, finalRole)
            .input('permissions', sql.NVarChar, permsString)
            .query('INSERT INTO Staff (FullName, Username, Email, PasswordHash, Role, Permissions) VALUES (@fullName, @username, @email, @passwordHash, @role, @permissions)');

        res.status(201).json({ message: 'Personel başarıyla eklendi.' });
    } catch (err) {
        res.status(500).json({ error: 'Personel eklenirken hata: ' + err.message });
    }
};

// Personelleri Listele
const getStaff = async (req, res) => {
    const pool = req.dbPool;
    try {
        const result = await pool.request()
            .query('SELECT StaffID, FullName, Username, Email, Role, Permissions, IsActive FROM Staff');
            
        const staffList = result.recordset.map(staff => ({
            ...staff,
            Permissions: staff.Permissions ? JSON.parse(staff.Permissions) : null
        }));
        
        res.json(staffList);
    } catch (err) {
        res.status(500).json({ error: 'Personel listesi alınırken hata.' });
    }
};

// Personel Düzenle
const updateStaff = async (req, res) => {
    const { id } = req.params;
    const { fullName, username, email, role, isActive, permissions } = req.body;
    const pool = req.dbPool;

    if (!username || !fullName) {
        return res.status(400).json({ error: 'Ad Soyad ve Kullanıcı Adı zorunludur.' });
    }

    try {
        const forbiddenRoles = ['SUPERADMIN', 'ADMIN', 'SUPER_ADMIN', 'AGENCY'];
        const finalRole = (role && !forbiddenRoles.includes(role.toUpperCase())) ? role : 'PERSONEL';

        const permsString = permissions ? JSON.stringify(permissions) : null;
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('fullName', sql.NVarChar, fullName)
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('role', sql.NVarChar, finalRole)
            .input('permissions', sql.NVarChar, permsString)
            .input('isActive', sql.Bit, isActive === undefined ? 1 : isActive)
            .query(`
                UPDATE Staff SET 
                    FullName = @fullName, 
                    Username = @username, 
                    Email = @email, 
                    Role = @role, 
                    Permissions = @permissions,
                    IsActive = @isActive 
                WHERE StaffID = @id
            `);

        res.json({ message: 'Personel bilgileri güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: 'Personel güncellenirken hata: ' + err.message });
    }
};

// Personel Şifre Sıfırla
const resetStaffPassword = async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    const pool = req.dbPool;

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'Personel şifresi en az 8 karakter olmalıdır.' });
    }

    try {
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await pool.request()
            .input('id', sql.Int, id)
            .input('passwordHash', sql.NVarChar, passwordHash)
            .query('UPDATE Staff SET PasswordHash = @passwordHash WHERE StaffID = @id');

        res.json({ message: 'Şifre başarıyla sıfırlandı.' });
    } catch (err) {
        res.status(500).json({ error: 'Şifre sıfırlanırken hata: ' + err.message });
    }
};

// Gelir/Gider Raporu
const getFinancialReport = async (req, res) => {
    const pool = req.dbPool;
    const isBranch = req.user?.isBranch;
    const assignedOfficeId = req.user?.assignedOfficeId;

    try {
        let query = `
            SELECT 
                T.TourName, 
                O.OfficeName, 
                B.HotelName,
                B.Currency,
                SUM(B.ActualPassFee) as TotalPass,
                SUM(B.Earnings) as TotalEarnings,
                COUNT(B.BookingID) as BookingCount
            FROM Bookings B
            JOIN Tours T ON B.TourID = T.TourID
            JOIN Offices O ON B.OfficeID = O.OfficeID
        `;

        const request = pool.request();
        if (isBranch && assignedOfficeId) {
            query += ' WHERE B.OfficeID = @officeId';
            request.input('officeId', sql.Int, assignedOfficeId);
        }

        query += ' GROUP BY T.TourName, O.OfficeName, B.HotelName, B.Currency';
        const result = await request.query(query);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Rapor alınırken hata: ' + err.message });
    }
};

// Gelişmiş Dashboard İstatistikleri (Çoklu Şube Destekli)
const getDashboardStats = async (req, res) => {
    const pool = req.dbPool;
    const { startDate, endDate } = req.query;
    const isBranch = req.user?.isBranch;
    const assignedOfficeId = req.user?.assignedOfficeId;

    const getLocalToday = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const getLocalSevenDaysAgo = () => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const startStr = startDate || getLocalSevenDaysAgo();
    const endStr = (endDate || getLocalToday()) + ' 23:59:59';

    try {
        // Otomatik Şema Onarımı: Expenses tablosuna TourID ekle (varsa hata vermez)
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Expenses')
            BEGIN
                CREATE TABLE Expenses (
                    ExpenseID INT PRIMARY KEY IDENTITY(1,1),
                    OfficeID INT,
                    Description NVARCHAR(255),
                    Amount DECIMAL(18, 2) DEFAULT 0,
                    Category NVARCHAR(100),
                    Currency NVARCHAR(10) DEFAULT '€',
                    ExpenseDate DATETIME DEFAULT GETDATE(),
                    TourID INT NULL
                );
            END
            ELSE
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Expenses') AND name = 'TourID') 
                    ALTER TABLE Expenses ADD TourID INT NULL;
            END
        `);

        const request = pool.request()
            .input('start', sql.VarChar, startStr)
            .input('end', sql.VarChar, endStr);
        
        let bookingFilter = '';
        let aliasedBookingFilter = '';
        let expenseFilter = '';

        let effectiveOfficeId = assignedOfficeId;
        
        if (!isBranch && !effectiveOfficeId) {
            // Ana ofis ID'sini bul
            const mainOfficeRes = await pool.request().query("SELECT TOP 1 OfficeID FROM Offices WHERE OfficeName LIKE '%Ana Ofis%' OR OfficeName LIKE '%Merkez%' ORDER BY OfficeID ASC");
            if (mainOfficeRes.recordset.length > 0) {
                effectiveOfficeId = mainOfficeRes.recordset[0].OfficeID;
            } else {
                const firstOfficeRes = await pool.request().query("SELECT TOP 1 OfficeID FROM Offices ORDER BY OfficeID ASC");
                if (firstOfficeRes.recordset.length > 0) {
                    effectiveOfficeId = firstOfficeRes.recordset[0].OfficeID;
                }
            }
        }

        if (effectiveOfficeId) {
            bookingFilter = ' AND OfficeID = @officeId';
            aliasedBookingFilter = ' AND B.OfficeID = @officeId';
            expenseFilter = ' AND OfficeID = @officeId';
            request.input('officeId', sql.Int, effectiveOfficeId);
        }

        // 1. Döviz bazlı toplam kazançlar
        const earningsResult = await request.query(`
            SELECT Currency, ISNULL(SUM(Earnings + CASE WHEN IsApproved = 1 THEN ISNULL(ActualPassFee, 0) ELSE 0 END), 0) as Total 
            FROM Bookings 
            WHERE BookingDate BETWEEN @start AND @end ${bookingFilter}
            GROUP BY Currency
        `);

        // 2. Ofis bazlı kazanç dağılımı
        const officeEarningsResult = await request.query(`
            SELECT O.OfficeName, B.Currency, ISNULL(SUM(B.Earnings + CASE WHEN B.IsApproved = 1 THEN ISNULL(B.ActualPassFee, 0) ELSE 0 END), 0) as Total
            FROM Bookings B
            JOIN Offices O ON B.OfficeID = O.OfficeID
            WHERE B.BookingDate BETWEEN @start AND @end ${aliasedBookingFilter}
            GROUP BY O.OfficeName, B.Currency
        `);

        // 3. Popüler Oteller
        const popularHotelsResult = await request.query(`
            SELECT TOP 5 HotelName, COUNT(BookingID) as TourCount
            FROM Bookings
            WHERE HotelName IS NOT NULL 
              AND HotelName NOT IN ('tours', 'Dashboard', 'dashboard', 'offices', 'reports', 'profile', 'agency')
              AND LEN(HotelName) > 2
              ${bookingFilter}
            GROUP BY HotelName
            ORDER BY TourCount DESC
        `);

        // 4. Son Rezervasyonlar
        const recentBookingsResult = await request.query(`
            SELECT TOP 10 
                B.BookingID, B.TouristName, B.HotelName, B.Earnings, B.Currency, B.BookingDate,
                T.TourName, O.OfficeName
            FROM Bookings B
            LEFT JOIN Tours T ON B.TourID = T.TourID
            LEFT JOIN Offices O ON B.OfficeID = O.OfficeID
            WHERE 1=1 ${aliasedBookingFilter}
            ORDER BY B.BookingDate DESC
        `);

        // 5. Günlük Kazançlar ve Rezervasyon Sayısı
        const dailyRevenueResult = await request.query(`
            SELECT 
                FORMAT(BookingDate, 'dd.MM.yyyy') as Date,
                SUM(Earnings + CASE WHEN IsApproved = 1 THEN ISNULL(ActualPassFee, 0) ELSE 0 END) as Total,
                COUNT(BookingID) as BookingCount
            FROM Bookings
            WHERE BookingDate BETWEEN @start AND @end ${bookingFilter}
            GROUP BY FORMAT(BookingDate, 'dd.MM.yyyy')
            ORDER BY MIN(BookingDate) ASC
        `);

        // 6. Genel Sayılar
        const countsResult = await request.query(`
            SELECT 
                (SELECT COUNT(*) FROM Tours WHERE 1=1) as TourCount,
                (SELECT COUNT(*) FROM Offices WHERE 1=1) as OfficeCount,
                (SELECT COUNT(*) FROM Staff WHERE 1=1) as StaffCount,
                (SELECT COUNT(*) FROM Bookings WHERE BookingDate >= CAST(GETDATE() AS DATE) ${bookingFilter}) as TodayBookings,
                (SELECT COUNT(*) FROM Bookings WHERE BookingDate BETWEEN @start AND @end ${bookingFilter}) as RangeBookings
            FROM (SELECT 1 as dummy) as t
        `);

        // 7. Tur Bazlı Performans Detayları (Tour Performances)
        const tourPerformancesResult = await request.query(`
            SELECT 
                T.TourID, T.TourName,
                B.BookingID, B.TouristName, B.BookingDate, 
                (B.Earnings + CASE WHEN B.IsApproved = 1 THEN ISNULL(B.ActualPassFee, 0) ELSE 0 END) as Earnings, 
                B.Currency as BookingCurrency,
                B.AdultCount, B.ChildCount, B.ActualPassFee
            FROM Tours T
            JOIN Bookings B ON T.TourID = B.TourID
            WHERE B.BookingDate BETWEEN @start AND @end ${aliasedBookingFilter}
            ORDER BY T.TourName, B.BookingDate DESC
        `);

        const expensesResult = await request.query(`
            SELECT ExpenseID, Description, Amount, Currency as ExpenseCurrency, ExpenseDate, TourID
            FROM Expenses
            WHERE TourID IS NOT NULL AND ExpenseDate BETWEEN @start AND @end ${expenseFilter}
            ORDER BY ExpenseDate DESC
        `);

        const tourPerformancesMap = {};
        
        tourPerformancesResult.recordset.forEach(booking => {
            if (!tourPerformancesMap[booking.TourID]) {
                tourPerformancesMap[booking.TourID] = {
                    TourID: booking.TourID,
                    TourName: booking.TourName,
                    currency_stats: {
                        '₺': { gelir: 0, gider: 0, kar: 0 },
                        '$': { gelir: 0, gider: 0, kar: 0 },
                        '€': { gelir: 0, gider: 0, kar: 0 }
                    },
                    bookings: [],
                    expenses: []
                };
            }
            
            const currMap = tourPerformancesMap[booking.TourID];
            const bCurrency = booking.BookingCurrency || '€';
            
            if (currMap.currency_stats[bCurrency]) {
                currMap.currency_stats[bCurrency].gelir += Number(booking.Earnings || 0);
                currMap.currency_stats[bCurrency].kar += Number(booking.Earnings || 0);
            }
            
            currMap.bookings.push({
                TouristName: booking.TouristName,
                Date: booking.BookingDate,
                Count: (booking.AdultCount || 0) + (booking.ChildCount || 0),
                Earnings: booking.Earnings,
                Expense: booking.ActualPassFee || 0,
                Currency: bCurrency
            });
        });

        expensesResult.recordset.forEach(expense => {
            if (tourPerformancesMap[expense.TourID]) {
                const currMap = tourPerformancesMap[expense.TourID];
                const eCurrency = expense.ExpenseCurrency || '€';
                
                if (currMap.currency_stats[eCurrency]) {
                    currMap.currency_stats[eCurrency].gider += Number(expense.Amount || 0);
                    currMap.currency_stats[eCurrency].kar -= Number(expense.Amount || 0);
                }
                
                currMap.expenses.push({
                    Description: expense.Description,
                    Date: expense.ExpenseDate,
                    Amount: expense.Amount,
                    Currency: eCurrency
                });
            }
        });

        const tourPerformances = Object.values(tourPerformancesMap);

        res.json({
            earnings: earningsResult.recordset,
            officeEarnings: officeEarningsResult.recordset,
            popularHotels: popularHotelsResult.recordset,
            recentBookings: recentBookingsResult.recordset,
            dailyRevenue: dailyRevenueResult.recordset,
            counts: countsResult.recordset[0],
            tourPerformances: tourPerformances,
            licenseWarning: req.licenseWarning || null
        });
    } catch (err) {
        console.error('Dashboard hatası:', err);
        res.status(500).json({ error: 'İstatistikler alınamadı.' });
    }
};

const getOfficeDetails = async (req, res) => {
    const { agencyId: id } = req.params; // Rota artik :agencyId kullaniyor
    const pool = req.dbPool;
    const { getPool } = require('../config/db');

    try {
        // 1. Bu bir "Sistem Şubesi" (Ayrı DB) mi kontrol edelim?
        // attachDB middleware'i zaten req.dbName'i şube DB'si yapmış olabilir.
        // Eğer req.dbName şubeye aitse, sorguları filtrelemeden (tüm DB bazlı) çekeriz.
        
        let isSystemBranchDrillDown = false;
        let branchInfo = null;

        const masterPool = await getPool('TurMasterDB');
        const masterRes = await masterPool.request()
            .input('id', id)
            .query('SELECT * FROM Agencies WHERE AgencyID = @id');
        
        if (masterRes.recordset.length > 0) {
            branchInfo = masterRes.recordset[0];
            // Eğer bağlandığımız DB, bu şubenin DB'si ile aynıysa, bu bir şube drill-down'ıdır.
            if (req.dbName === branchInfo.AgencyDBName) {
                isSystemBranchDrillDown = true;
            }
        }

        let statsQuery, tourStatsQuery, recentBookingsQuery;
        const request = pool.request();

        if (isSystemBranchDrillDown) {
            // ŞUBE DETAYI: Bu veritabanındaki TÜM veriler bu şubeye aittir
            statsQuery = `SELECT COUNT(BookingID) as TotalBookings, SUM(Earnings) as TotalEarnings, Currency FROM Bookings GROUP BY Currency`;
            tourStatsQuery = `SELECT t.TourName, COUNT(b.BookingID) as BookingCount, SUM(b.Earnings) as TotalRevenue, b.Currency FROM Tours t JOIN Bookings b ON t.TourID = b.TourID GROUP BY t.TourName, b.Currency`;
            recentBookingsQuery = `SELECT TOP 5 b.BookingID, t.TourName, b.TouristName, b.Earnings, b.Currency, b.BookingDate FROM Bookings b JOIN Tours t ON b.TourID = t.TourID ORDER BY b.BookingDate DESC`;
        } else {
            // YEREL OFİS DETAYI: Sadece bu OfficeID'ye ait veriler
            request.input('officeId', sql.Int, id);
            statsQuery = `SELECT COUNT(BookingID) as TotalBookings, SUM(Earnings) as TotalEarnings, Currency FROM Bookings WHERE OfficeID = @officeId GROUP BY Currency`;
            tourStatsQuery = `SELECT t.TourName, COUNT(b.BookingID) as BookingCount, SUM(b.Earnings) as TotalRevenue, b.Currency FROM Tours t JOIN Bookings b ON t.TourID = b.TourID WHERE b.OfficeID = @officeId GROUP BY t.TourName, b.Currency`;
            recentBookingsQuery = `SELECT TOP 5 b.BookingID, t.TourName, b.TouristName, b.Earnings, b.Currency, b.BookingDate FROM Bookings b JOIN Tours t ON b.TourID = t.TourID WHERE b.OfficeID = @officeId ORDER BY b.BookingDate DESC`;
        }

        const stats = await request.query(statsQuery);
        const tourStats = await request.query(tourStatsQuery);
        const recentBookings = await request.query(recentBookingsQuery);

        let officeData;
        if (isSystemBranchDrillDown) {
            officeData = { 
                OfficeName: branchInfo.AgencyName, 
                isSystemBranch: true,
                Username: branchInfo.Username,
                OwnerName: branchInfo.OwnerName
            };
        } else {
            const officeRes = await pool.request().input('officeId', sql.Int, id).query('SELECT * FROM Offices WHERE OfficeID = @officeId');
            officeData = officeRes.recordset[0];
        }

        res.json({
            office: officeData,
            stats: stats.recordset,
            tourStats: tourStats.recordset,
            recentBookings: recentBookings.recordset
        });
    } catch (err) {
        console.error('Şube detay hatası:', err);
        res.status(500).json({ error: 'Şube detayları alınamadı.' });
    }
};

const getAgencyReports = async (req, res) => {
    const pool = req.dbPool;
    try {
        // 1. Finansal Özet (Döviz Bazlı)
        const financialSummary = await pool.request().query(`
            SELECT Currency, SUM(Earnings + CASE WHEN IsApproved = 1 THEN ISNULL(ActualPassFee, 0) ELSE 0 END) as TotalEarnings, COUNT(BookingID) as TotalBookings
            FROM Bookings
            GROUP BY Currency
        `);

        // 2. Günlük Operasyonel Detay (Acente Sahibinin istediği liste)
        const dailyOperations = await pool.request().query(`
            SELECT 
                CONVERT(DATE, BookingDate) as OperationDate,
                T.TourName,
                SUM(AdultCount) as TotalAdults,
                SUM(ChildCount) as TotalChildren,
                SUM(VehicleCount) as TotalVehicles,
                SUM(AdultCount + ChildCount) as TotalPassengers,
                SUM(Earnings + CASE WHEN B.IsApproved = 1 THEN ISNULL(B.ActualPassFee, 0) ELSE 0 END) as TotalEarnings,
                Currency
            FROM Bookings B
            JOIN Tours T ON B.TourID = T.TourID
            GROUP BY CONVERT(DATE, BookingDate), T.TourName, Currency
            ORDER BY OperationDate DESC, T.TourName ASC
        `);

        // 2.1 Haftalık Operasyonel Detay
        const weeklyOperations = await pool.request().query(`
            SELECT 
                DATEPART(wk, BookingDate) as WeekNumber,
                MONTH(BookingDate) as Month,
                YEAR(BookingDate) as Year,
                T.TourName,
                SUM(AdultCount) as TotalAdults,
                SUM(ChildCount) as TotalChildren,
                SUM(VehicleCount) as TotalVehicles,
                SUM(AdultCount + ChildCount) as TotalPassengers,
                SUM(Earnings + CASE WHEN B.IsApproved = 1 THEN ISNULL(B.ActualPassFee, 0) ELSE 0 END) as TotalEarnings,
                SUM(ISNULL(B.ActualPassFee, 0)) as TotalPassFee,
                Currency
            FROM Bookings B
            JOIN Tours T ON B.TourID = T.TourID
            GROUP BY YEAR(BookingDate), MONTH(BookingDate), DATEPART(wk, BookingDate), T.TourName, Currency
            ORDER BY Year DESC, Month DESC, WeekNumber DESC, T.TourName ASC
        `);

        // 2.2 Aylık Operasyonel Detay
        const monthlyOperations = await pool.request().query(`
            SELECT 
                MONTH(BookingDate) as Month,
                YEAR(BookingDate) as Year,
                T.TourName,
                SUM(AdultCount) as TotalAdults,
                SUM(ChildCount) as TotalChildren,
                SUM(VehicleCount) as TotalVehicles,
                SUM(AdultCount + ChildCount) as TotalPassengers,
                SUM(Earnings + CASE WHEN B.IsApproved = 1 THEN ISNULL(B.ActualPassFee, 0) ELSE 0 END) as TotalEarnings,
                SUM(ISNULL(B.ActualPassFee, 0)) as TotalPassFee,
                Currency
            FROM Bookings B
            JOIN Tours T ON B.TourID = T.TourID
            GROUP BY YEAR(BookingDate), MONTH(BookingDate), T.TourName, Currency
            ORDER BY Year DESC, Month DESC, T.TourName ASC
        `);

        // 3. En Çok Satan Turlar
        const tourStats = await pool.request().query(`
            SELECT TOP 5 t.TourName, COUNT(b.BookingID) as BookingCount, SUM(b.Earnings + CASE WHEN b.IsApproved = 1 THEN ISNULL(b.ActualPassFee, 0) ELSE 0 END) as TotalRevenue, b.Currency
            FROM Tours t
            JOIN Bookings b ON t.TourID = b.TourID
            GROUP BY t.TourName, b.Currency
            ORDER BY BookingCount DESC
        `);

        // 4. Şube Performansı
        const officeStats = await pool.request().query(`
            SELECT 
                o.OfficeName, 
                COUNT(b.BookingID) as BookingCount, 
                ISNULL(SUM(b.Earnings + CASE WHEN b.IsApproved = 1 THEN ISNULL(b.ActualPassFee, 0) ELSE 0 END), 0) as TotalRevenue, 
                ISNULL(b.Currency, '€') as Currency
            FROM Offices o
            LEFT JOIN Bookings b ON o.OfficeID = b.OfficeID
            GROUP BY o.OfficeName, ISNULL(b.Currency, '€')
            ORDER BY TotalRevenue DESC
        `);

        const totalOffices = await pool.request().query('SELECT COUNT(*) as count FROM Offices');
        const totalTours = await pool.request().query('SELECT COUNT(*) as count FROM Tours');

        // 5. Yıllık Genel Özet (Daha detaylı: Tur ve Otel dökümü ile)
        const yearlySummary = await pool.request().query(`
            SELECT 
                YEAR(BookingDate) AS Yil,
                T.TourName,
                HotelName,
                COUNT(BookingID) AS ToplamRezervasyon,
                SUM(Earnings + CASE WHEN B.IsApproved = 1 THEN ISNULL(B.ActualPassFee, 0) ELSE 0 END) AS ToplamGelir,
                SUM(ISNULL(B.ActualPassFee, 0)) AS ToplamPassGideri,
                Currency
            FROM Bookings B
            JOIN Tours T ON B.TourID = T.TourID
            GROUP BY YEAR(BookingDate), T.TourName, HotelName, Currency
            ORDER BY Yil DESC, ToplamRezervasyon DESC
        `);

        // 6. Onay Bekleyen Tahsilatlar (Pending Collections)
        const pendingCollections = await pool.request().query(`
            SELECT 
                B.BookingID, B.TouristName, B.HotelName, B.ActualPassFee, B.Earnings, B.Currency, B.BookingDate,
                T.TourName, O.OfficeName
            FROM Bookings B
            JOIN Tours T ON B.TourID = T.TourID
            LEFT JOIN Offices O ON B.OfficeID = O.OfficeID
            WHERE B.IsApproved = 0 AND ISNULL(B.ActualPassFee, 0) > 0
            ORDER BY B.BookingDate ASC
        `);

        res.json({
            financial: financialSummary.recordset,
            daily: dailyOperations.recordset,
            weekly: weeklyOperations.recordset,
            monthly: monthlyOperations.recordset,
            tours: tourStats.recordset,
            offices: officeStats.recordset,
            yearly: yearlySummary.recordset,
            pending: pendingCollections.recordset,
            summary: {
                totalOffices: totalOffices.recordset[0].count,
                totalTours: totalTours.recordset[0].count
            }
        });
    } catch (err) {
        console.error('Rapor hatası:', err);
        res.status(500).json({ error: 'Rapor verileri alınamadı.' });
    }
};

const getFullFinancialReport = async (req, res) => {
    const pool = req.dbPool;
    const isBranch = req.user?.isBranch;
    const officeIdFromQuery = req.query.officeId;
    
    // Güvenli parseInt: 'undefined' veya null durumlarını yönet
    const assignedOfficeId = (officeIdFromQuery && officeIdFromQuery !== 'undefined') ? parseInt(officeIdFromQuery) : req.user?.assignedOfficeId;

    // EĞER bu bir şube veritabanıysa (isBranch veya db isminden anlaşılır), 
    // içeride filtreleme yapmamalıyız çünkü o DB sadece o şubeye aittir.
    const isSystemBranchDB = (req.dbName !== req.user?.dbName) || (req.dbName && (req.dbName.includes('SUBE') || req.dbName.includes('Agency') || req.dbName.includes('KEMER') || req.dbName.includes('ALANYA')));

    try {
        // OTOMATİK ŞEMA ONARIMI
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Expenses')
            BEGIN
                CREATE TABLE Expenses (
                    ExpenseID INT PRIMARY KEY IDENTITY(1,1),
                    OfficeID INT,
                    Description NVARCHAR(255),
                    Amount DECIMAL(18, 2) DEFAULT 0,
                    Category NVARCHAR(100),
                    Currency NVARCHAR(10) DEFAULT '€',
                    ExpenseDate DATETIME DEFAULT GETDATE()
                );
            END
            ELSE
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Expenses') AND name = 'Amount') ALTER TABLE Expenses ADD Amount DECIMAL(18, 2) DEFAULT 0;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Expenses') AND name = 'Category') ALTER TABLE Expenses ADD Category NVARCHAR(100);
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Expenses') AND name = 'ExpenseDate') ALTER TABLE Expenses ADD ExpenseDate DATETIME DEFAULT GETDATE();
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Expenses') AND name = 'OfficeID') ALTER TABLE Expenses ADD OfficeID INT;
            END
        `);

        // 1. Bölge Bazlı Gelir-Gider (Kullanıcı Alanya/Manavgat bazlı görmek istiyor)
        let categoryQuery = `
            SELECT 
                ISNULL(t.Region, 'Belirtilmedi') as Region,
                ISNULL(SUM(b.Earnings + CASE WHEN b.IsApproved = 1 THEN ISNULL(b.ActualPassFee, 0) ELSE 0 END), 0) as TotalIncome,
                (SELECT ISNULL(SUM(e.Amount), 0) 
                 FROM Expenses e 
                 JOIN Tours t2 ON e.TourID = t2.TourID 
                 WHERE ISNULL(t2.Region, 'Belirtilmedi') = ISNULL(t.Region, 'Belirtilmedi')
                 ${!isSystemBranchDB && assignedOfficeId ? ' AND e.OfficeID = @officeId' : ''}
                ) as TotalExpense,
                ISNULL(t.DefaultCurrency, '€') as Currency
            FROM Tours t
            LEFT JOIN Bookings b ON t.TourID = b.TourID ${!isSystemBranchDB && assignedOfficeId ? ' AND b.OfficeID = @officeId' : ''}
            GROUP BY t.Region, t.DefaultCurrency
        `;

        // 2. Tur Bazlı Gelir-Gider
        let tourQuery = `
            SELECT 
                t.TourName,
                ISNULL(t.Category, 'Genel') as Category,
                ISNULL(SUM(b.Earnings + CASE WHEN b.IsApproved = 1 THEN ISNULL(b.ActualPassFee, 0) ELSE 0 END), 0) as Income,
                (SELECT ISNULL(SUM(e.Amount), 0) FROM Expenses e WHERE e.TourID = t.TourID ${!isSystemBranchDB && assignedOfficeId ? ' AND e.OfficeID = @officeId' : ''}) as Expense,
                ISNULL(t.DefaultCurrency, '€') as Currency
            FROM Tours t
            LEFT JOIN Bookings b ON t.TourID = b.TourID ${!isSystemBranchDB && assignedOfficeId ? ' AND b.OfficeID = @officeId' : ''}
            GROUP BY t.TourID, t.TourName, t.Category, t.DefaultCurrency
        `;

        // 3. Genel Gider Listesi
        let expenseQuery = `
            SELECT e.*, o.OfficeName 
            FROM Expenses e
            LEFT JOIN Offices o ON e.OfficeID = o.OfficeID
            WHERE 1=1
            ${!isSystemBranchDB && assignedOfficeId ? ' AND e.OfficeID = @officeId' : ''}
            ORDER BY e.ExpenseDate DESC
        `;

        const request = pool.request();
        if (!isSystemBranchDB && assignedOfficeId) {
            request.input('officeId', sql.Int, assignedOfficeId);
        }

        const [categoryStats, tourPerformance, allExpenses] = await Promise.all([
            request.query(categoryQuery),
            request.query(tourQuery),
            request.query(expenseQuery)
        ]);

        let officeName = null;
        if (isSystemBranchDB) {
            const officeRes = await pool.request().query('SELECT TOP 1 OfficeName FROM Offices');
            if (officeRes.recordset.length > 0) {
                officeName = officeRes.recordset[0].OfficeName;
            }
        } else if (assignedOfficeId) {
            const officeRes = await pool.request()
                .input('oId', sql.Int, assignedOfficeId)
                .query('SELECT OfficeName FROM Offices WHERE OfficeID = @oId');
            if (officeRes.recordset.length > 0) {
                officeName = officeRes.recordset[0].OfficeName;
            }
        }

        res.json({
            officeName: officeName,
            categories: categoryStats.recordset,
            tours: tourPerformance.recordset,
            expenses: allExpenses.recordset
        });
    } catch (err) {
        console.error('Full rapor hatası:', err);
        res.status(500).json({ error: 'Detaylı mali rapor hazırlanamadı.' });
    }
};

const createBooking = async (req, res) => {
    let { 
        tourId, officeId, touristName, hotelName, 
        actualPassFee, earnings, currency,
        adultCount, childCount, babyCount, passengerCount, driverCount, vehicleCount,
        driverName, notes, bookingDate 
    } = req.body;
    const pool = req.dbPool;

    // ZORUNLU ALAN KONTROLÜ
    if (!tourId) return res.status(400).json({ error: 'Lütfen bir Tur seçin.' });
    if (!touristName) return res.status(400).json({ error: 'Müşteri adı zorunludur.' });
    if (!hotelName) return res.status(400).json({ error: 'Otel/Konum bilgisi zorunludur.' });
    if (earnings === undefined || earnings === null || earnings === '') return res.status(400).json({ error: 'Satış fiyatı girmelisiniz.' });

    // Şube ise OfficeID'yi zorla kendi şubesi yap
    if (req.user?.isBranch && req.user?.assignedOfficeId) {
        officeId = req.user.assignedOfficeId;
    }

    // Ofis ID hala yoksa (Ana Ofis seçmemişse veya Şube DB'si boşsa) varsayılan bir tane bul/oluştur
    if (!officeId) {
        try {
            let officeResult = await pool.request().query('SELECT TOP 1 OfficeID FROM Offices');
            if (officeResult.recordset.length > 0) {
                officeId = officeResult.recordset[0].OfficeID;
            } else {
                // EĞER HİÇ OFİS YOKSA, BİR TANE OLUŞTUR (Özellikle yeni açılan şubeler için kritik)
                const createOfficeRes = await pool.request().query(`
                    INSERT INTO Offices (OfficeName, Location) 
                    OUTPUT INSERTED.OfficeID
                    VALUES ('Merkez Ofis', 'Sistem Tarafından Otomatik Oluşturuldu');
                `);
                officeId = createOfficeRes.recordset[0].OfficeID;
                console.log('Sistemde ofis bulunamadığı için otomatik Merkez Ofis oluşturuldu. ID:', officeId);
            }
        } catch (err) {
            console.error('Ofis otomatik oluşturma hatası:', err);
            return res.status(400).json({ error: 'Ofis bilgisi belirlenemedi. Lütfen yöneticiye başvurun.' });
        }
    }

    try {
        // Otomatik Şema Onarımı: Bookings tablosuna yeni operasyonel kolonları ekle
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'AdultCount')
                ALTER TABLE Bookings ADD AdultCount INT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'ChildCount')
                ALTER TABLE Bookings ADD ChildCount INT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'BabyCount')
                ALTER TABLE Bookings ADD BabyCount INT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'PassengerCount')
                ALTER TABLE Bookings ADD PassengerCount INT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'DriverCount')
                ALTER TABLE Bookings ADD DriverCount INT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'VehicleCount')
                ALTER TABLE Bookings ADD VehicleCount INT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'DriverName')
                ALTER TABLE Bookings ADD DriverName NVARCHAR(255);
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bookings') AND name = 'Notes')
                ALTER TABLE Bookings ADD Notes NVARCHAR(MAX);
        `);

        await pool.request()
            .input('tourId', sql.Int, tourId)
            .input('officeId', sql.Int, officeId)
            .input('touristName', sql.NVarChar, touristName)
            .input('hotelName', sql.NVarChar, hotelName)
            .input('actualPassFee', sql.Decimal(18, 2), actualPassFee)
            .input('earnings', sql.Decimal(18, 2), earnings)
            .input('currency', sql.NVarChar, currency)
            .input('adultCount', sql.Int, adultCount || 0)
            .input('childCount', sql.Int, childCount || 0)
            .input('babyCount', sql.Int, babyCount || 0)
            .input('passengerCount', sql.Int, passengerCount || 0)
            .input('driverCount', sql.Int, driverCount || 0)
            .input('vehicleCount', sql.Int, vehicleCount || 0)
            .input('driverName', sql.NVarChar, driverName || '')
            .input('notes', sql.NVarChar, notes || '')
            .input('bookingDate', sql.DateTime, bookingDate || new Date())
            .input('isApproved', sql.Bit, Number(actualPassFee) === 0 ? 1 : 0)
            .query(`
                INSERT INTO Bookings (
                    TourID, OfficeID, TouristName, HotelName, 
                    ActualPassFee, Earnings, Currency, 
                    AdultCount, ChildCount, BabyCount, PassengerCount, DriverCount, VehicleCount, DriverName, Notes,
                    BookingDate, IsApproved
                )
                VALUES (
                    @tourId, @officeId, @touristName, @hotelName, 
                    @actualPassFee, @earnings, @currency, 
                    @adultCount, @childCount, @babyCount, @passengerCount, @driverCount, @vehicleCount, @driverName, @notes,
                    @bookingDate, @isApproved
                )
            `);
        res.json({ message: 'Tur kaydı başarıyla oluşturuldu.' });
    } catch (err) {
        console.error('Rezervasyon hatası:', err);
        res.status(500).json({ error: 'Rezervasyon kaydedilemedi: ' + err.message });
    }
};

const deleteTour = async (req, res) => {
    const { id } = req.params;
    const pool = req.dbPool;
    try {
        await pool.request().input('id', sql.Int, id).query('DELETE FROM Tours WHERE TourID = @id');
        res.json({ message: 'Tur başarıyla silindi.' });
    } catch (err) {
        res.status(500).json({ error: 'Tur silinirken hata.' });
    }
};

const updateTour = async (req, res) => {
    const { id } = req.params;
    const { tourName, description, defaultPassFee, defaultPrice, passengerPrice, driverPrice, childPrice, babyPrice, currency, region, fields } = req.body;
    const pool = req.dbPool;

    try {
        // Otomatik Şema Onarımı: Eksik kolonları kontrol et ve ekle
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'Region')
                ALTER TABLE Tours ADD Region NVARCHAR(255);
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'DefaultPrice')
                ALTER TABLE Tours ADD DefaultPrice DECIMAL(18, 2);
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'Category')
                ALTER TABLE Tours ADD Category NVARCHAR(100);
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'Fields')
                ALTER TABLE Tours ADD Fields NVARCHAR(MAX) DEFAULT 'Yetişkin,Çocuk,Bebek';
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'PassengerPrice')
                ALTER TABLE Tours ADD PassengerPrice DECIMAL(18, 2);
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'DriverPrice')
                ALTER TABLE Tours ADD DriverPrice DECIMAL(18, 2);
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'ChildPrice')
                ALTER TABLE Tours ADD ChildPrice DECIMAL(18, 2);
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tours') AND name = 'BabyPrice')
                ALTER TABLE Tours ADD BabyPrice DECIMAL(18, 2);
        `);

        const fieldsString = Array.isArray(fields) ? fields.join(',') : (fields || 'Yetişkin,Çocuk,Bebek');

        await pool.request()
            .input('id', sql.Int, id)
            .input('tourName', sql.NVarChar, tourName)
            .input('description', sql.NVarChar, description || '')
            .input('defaultPassFee', sql.Decimal(18, 2), (defaultPassFee === undefined || defaultPassFee === '') ? null : defaultPassFee)
            .input('defaultPrice', sql.Decimal(18, 2), (defaultPrice === undefined || defaultPrice === '' || defaultPrice === null) ? 0 : parseFloat(defaultPrice))
            .input('passengerPrice', sql.Decimal(18, 2), (passengerPrice === undefined || passengerPrice === '' || passengerPrice === null) ? 0 : parseFloat(passengerPrice))
            .input('driverPrice', sql.Decimal(18, 2), (driverPrice === undefined || driverPrice === '' || driverPrice === null) ? 0 : parseFloat(driverPrice))
            .input('childPrice', sql.Decimal(18, 2), (childPrice === undefined || childPrice === '' || childPrice === null) ? 0 : parseFloat(childPrice))
            .input('babyPrice', sql.Decimal(18, 2), (babyPrice === undefined || babyPrice === '' || babyPrice === null) ? 0 : parseFloat(babyPrice))
            .input('currency', sql.NVarChar, currency || '€')
            .input('region', sql.NVarChar, region || '')
            .input('fields', sql.NVarChar, fieldsString)
            .query(`
                UPDATE Tours SET 
                    TourName = @tourName, 
                    Description = @description, 
                    DefaultPassFee = @defaultPassFee, 
                    DefaultPrice = @defaultPrice, 
                    PassengerPrice = @passengerPrice, 
                    DriverPrice = @driverPrice, 
                    ChildPrice = @childPrice,
                    BabyPrice = @babyPrice,
                    DefaultCurrency = @currency, 
                    Region = @region, 
                    Fields = @fields
                WHERE TourID = @id
            `);

        res.json({ message: 'Tur başarıyla güncellendi.' });
    } catch (err) {
        console.error('Tur güncelleme hatası:', err);
        res.status(500).json({ error: 'Tur güncellenirken hata: ' + err.message });
    }
};

const getTourBookings = async (req, res) => {
    const { id } = req.params;
    const pool = req.dbPool;
    const isBranch = req.user?.isBranch;
    const assignedOfficeId = req.user?.assignedOfficeId;

    try {
        let query = `
            SELECT 
                B.BookingID, B.TouristName, B.HotelName, B.ActualPassFee, B.Earnings, B.Currency, B.BookingDate,
                O.OfficeName
            FROM Bookings B
            LEFT JOIN Offices O ON B.OfficeID = O.OfficeID
            WHERE B.TourID = @tourId
        `;

        const request = pool.request().input('tourId', sql.Int, id);

        if (isBranch && assignedOfficeId) {
            query += ' AND B.OfficeID = @officeId';
            request.input('officeId', sql.Int, assignedOfficeId);
        }

        query += ' ORDER BY B.BookingDate DESC';
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Tur kayıtları hatası:', err);
        res.status(500).json({ error: 'Bu tura ait kayıtlar alınamadı.' });
    }
};

const deleteStaff = async (req, res) => {
    const { id } = req.params;
    const pool = req.dbPool;
    try {
        await pool.request().input('id', sql.Int, id).query('DELETE FROM Staff WHERE StaffID = @id');
        res.json({ message: 'Personel başarıyla silindi.' });
    } catch (err) {
        res.status(500).json({ error: 'Personel silinirken hata.' });
    }
};

const approveBooking = async (req, res) => {
    const { id } = req.params;
    const pool = req.dbPool;
    try {
        await pool.request().input('id', sql.Int, id).query('UPDATE Bookings SET IsApproved = 1 WHERE BookingID = @id');
        res.json({ message: 'Tahsilat başarıyla onaylandı.' });
    } catch (err) {
        res.status(500).json({ error: 'Tahsilat onaylanırken hata: ' + err.message });
    }
};

module.exports = { 
    createTour, getTours, updateTour, deleteTour,
    createStaff, getStaff, updateStaff, resetStaffPassword, deleteStaff, createBooking, getTourBookings, approveBooking,
    getFinancialReport, getDashboardStats, getOfficeDetails, getAgencyReports, getFullFinancialReport,
    getOffices
};
