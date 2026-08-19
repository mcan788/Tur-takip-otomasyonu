const { sql } = require('../config/db');

// Yeni Tur Kaydı (Rezervasyon) Ekleme
const createBooking = async (req, res) => {
    let { tourId, officeId, touristName, hotelName, passFee, earnings, currency } = req.body;
    const pool = req.dbPool;

    // Güvenlik: Eğer kullanıcı bir şube personeli ise OfficeID'yi zorunlu kıl
    if (req.user?.isBranch && req.user?.assignedOfficeId) {
        officeId = req.user.assignedOfficeId;
    }

    try {
        // İsteğe bağlı: TourID'nin bu acenteye ait olup olmadığını kontrol edebilirsiniz.
        // Ancak zaten dbPool doğru DB'ye bağlı olduğu için veri sızıntısı riski düşüktür.
        
        await pool.request()
            .input('tourId', sql.Int, tourId)
            .input('officeId', sql.Int, officeId)
            .input('touristName', sql.NVarChar, touristName)
            .input('hotelName', sql.NVarChar, hotelName)
            .input('passFee', sql.Decimal(18, 2), passFee)
            .input('earnings', sql.Decimal(18, 2), earnings)
            .input('currency', sql.NVarChar, currency || '€')
            .query(`
                INSERT INTO Bookings (TourID, OfficeID, TouristName, HotelName, ActualPassFee, Earnings, Currency) 
                VALUES (@tourId, @officeId, @touristName, @hotelName, @passFee, @earnings, @currency)
            `);

        res.status(201).json({ message: 'Tur kaydı başarıyla oluşturuldu.' });
    } catch (err) {
        console.error('Rezervasyon hatası:', err);
        res.status(500).json({ error: 'Kayıt oluşturulurken hata oluştu.' });
    }
};

// Son Kayıtları Getir
const getRecentBookings = async (req, res) => {
    const pool = req.dbPool;
    const isBranch = req.user?.isBranch;
    const assignedOfficeId = req.user?.assignedOfficeId;

    try {
        let query = `
            SELECT TOP 10 
                B.*, T.TourName, O.OfficeName 
            FROM Bookings B
            JOIN Tours T ON B.TourID = T.TourID
            JOIN Offices O ON B.OfficeID = O.OfficeID
            WHERE 1=1
        `;

        const request = pool.request();

        if (isBranch && assignedOfficeId) {
            query += ' AND B.OfficeID = @officeId';
            request.input('officeId', sql.Int, assignedOfficeId);
        }

        query += ' ORDER BY B.BookingDate DESC';
        const result = await request.query(query);

        res.json(result.recordset);
    } catch (err) {
        console.error('Recent bookings hatası:', err);
        res.status(500).json({ error: 'Kayıtlar alınırken hata oluştu.' });
    }
};

module.exports = { createBooking, getRecentBookings };
