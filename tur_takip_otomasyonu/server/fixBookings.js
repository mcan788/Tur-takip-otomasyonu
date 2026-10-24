const db = require('./config/db');

async function fixBookings() {
    try {
        console.log("Bağlanıyor...");
        const pool = await db.getPool('TurMasterDB');
        console.log("TurMasterDB'ye bağlanıldı. Ajanslar alınıyor...");

        // Ajansların db isimlerini al
        const agencies = await pool.request().query('SELECT AgencyDBName FROM Agencies WHERE AgencyDBName IS NOT NULL');
        const dbNames = agencies.recordset.map(a => a.AgencyDBName);
        console.log(`Bulunan veritabanları: ${dbNames.join(', ')}`);

        for (const dbName of dbNames) {
            console.log(`\nVeritabanı kontrol ediliyor: ${dbName}`);
            try {
                const agencyPool = await db.getPool(dbName);
                const query = `
                    UPDATE Bookings 
                    SET ChildCount = 0, BabyCount = 0
                    WHERE (VehicleCount > 0 OR DriverCount > 0) 
                      AND (ChildCount > 0 OR BabyCount > 0)
                `;
                const result = await agencyPool.request().query(query);
                console.log(`[${dbName}] Kurala uymayan ${result.rowsAffected[0]} kayıt güncellendi (Bebek ve Çocuk sayıları sıfırlandı).`);
            } catch (err) {
                console.log(`[${dbName}] tablosunda işlem yapılamadı (belki tablo yok): ${err.message}`);
            }
        }

        console.log("\nTüm veritabanlarında işlem tamamlandı.");
        process.exit(0);
    } catch (err) {
        console.error("Hata:", err);
        process.exit(1);
    }
}

fixBookings();
