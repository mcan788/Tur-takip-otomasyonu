const jwt = require('jsonwebtoken');

/**
 * SSO (Single Sign-On) Mimarisi için Modül İzolasyon Middleware'i
 * Bu katman, biletin (token) sahte olup olmadığını doğrulamakla kalmaz,
 * müşterinin o spesifik klasöre/projeye girmeye hakkı olup olmadığını (Lisans) kontrol eder.
 * 
 * @param {string} requestedModule - Gidilmek istenen modül (Örn: 'TOUR_TRACKING' veya 'RENT_A_CAR')
 */
const authenticateSSO = (requestedModule) => {
    return (req, res, next) => {
        // Gelen isteğin başlığındaki (Header) bileti al
        let token = req.header('Authorization')?.replace('Bearer ', '');
        token = token?.trim();

        if (!token) {
            return res.status(401).json({ error: 'Sisteme giriş reddedildi: Bilet (Token) bulunamadı.' });
        }

        try {
            // 1. ADIM: Gizli Anahtar ile Biletin Orijinalliğini Doğrula
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // 2. ADIM: Müşterinin Lisansında (Biletinde) Bu Modül Var Mı?
            const allowedModules = decoded.allowedModules || [];
            
            // Eğer adam sadece Rent a Car almışsa ve Tour_Tracking'e (Node.js) girmeye çalışıyorsa, buradan içeri giremez!
            if (!allowedModules.includes(requestedModule)) {
                console.error(`[SSO Güvenlik İhlali] Firma ID (${decoded.agencyId}) '${requestedModule}' modülüne girmeye çalıştı ancak lisansı yok!`);
                return res.status(403).json({ 
                    error: `Yetkisiz Erişim: Firmanızın '${requestedModule}' modülü için aktif bir lisansı bulunmamaktadır.` 
                });
            }

            // 3. ADIM: Hedef Rota Kontrolü (Yanlışlıkla mı geldi?)
            // Biletin üstünde açıkça bu kapı için kesildiği yazıyor mu kontrol et.
            if (decoded.targetModule && decoded.targetModule !== requestedModule) {
                console.warn(`[SSO Rota Uyarısı] Bilet ${decoded.targetModule} için kesilmiş ama ${requestedModule} sunucusuna geldi.`);
                return res.status(403).json({ error: 'Sistem Uyuşmazlığı: Lütfen giriş ekranından doğru modülü seçin.' });
            }

            // MÜKEMMEL SONUÇ: Bilet orijinal, Lisans var, Rota doğru!
            // Kişiyi içeri alıp kendi kapalı veritabanına (dbName) yönlendiriyoruz.
            req.user = decoded;
            req.dbName = decoded.dbName || 'TurMasterDB';
            
            console.log(`[SSO ONAY] ${decoded.username} başarıyla '${requestedModule}' modülüne bağlandı. İzole DB: ${req.dbName}`);
            
            // Sonraki işleme geç (Veritabanı havuzuna bağlanma vs.)
            next();
            
        } catch (err) {
            console.error('[SSO Doğrulama Hatası]', err.message);
            return res.status(401).json({ error: 'Oturum süresi dolmuş veya geçersiz bilet.' });
        }
    };
};

module.exports = { authenticateSSO };
