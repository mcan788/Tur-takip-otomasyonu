(function() {
    // Cerez onayi var mi kontrol et
    if (localStorage.getItem('zyronova_kvkk_accepted') === 'true') {
        return;
    }
    
    // Modül seçim ekranında gösterme
    if (window.location.pathname === '/super-admin/module-selector') {
        return;
    }

    // Stil tanimlamasi
    const style = document.createElement('style');
    style.innerHTML = `
        .kvkk-banner-container {
            position: fixed;
            bottom: 24px;
            left: 24px;
            right: 24px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: #f8fafc;
            padding: 20px 28px;
            border-radius: 16px;
            box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            z-index: 9999999;
            font-family: 'Inter', 'Outfit', sans-serif;
            border: 1px solid rgba(255,255,255,0.1);
            transform: translateY(150%);
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .kvkk-banner-container.show {
            transform: translateY(0);
        }
        .kvkk-icon {
            font-size: 24px;
            margin-right: 12px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .kvkk-text-content {
            display: flex;
            align-items: center;
            flex: 1;
        }
        .kvkk-text {
            font-size: 0.9rem;
            line-height: 1.5;
            margin: 0;
            color: #cbd5e1;
        }
        .kvkk-text strong {
            color: #ffffff;
            font-weight: 700;
        }
        .kvkk-text a {
            color: #60a5fa;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.2s;
        }
        .kvkk-text a:hover {
            color: #93c5fd;
            text-decoration: underline;
        }
        .kvkk-buttons {
            display: flex;
            gap: 12px;
            flex-shrink: 0;
        }
        .kvkk-btn {
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.2s ease;
            white-space: nowrap;
        }
        .kvkk-btn-accept {
            background: #3b82f6;
            color: white;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .kvkk-btn-accept:hover {
            background: #2563eb;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }
        @media (max-width: 768px) {
            .kvkk-banner-container {
                flex-direction: column;
                align-items: stretch;
                text-align: left;
                bottom: 0;
                left: 0;
                right: 0;
                border-radius: 20px 20px 0 0;
                padding: 24px 20px;
                gap: 16px;
                border-bottom: none;
                border-left: none;
                border-right: none;
            }
            .kvkk-text-content {
                align-items: flex-start;
            }
            .kvkk-icon {
                margin-top: 2px;
            }
            .kvkk-buttons {
                flex-direction: column;
                width: 100%;
            }
            .kvkk-btn {
                width: 100%;
                text-align: center;
                padding: 14px;
            }
        }
    `;
    document.head.appendChild(style);

    // KVKK Modal CSS ve JS'i ekleyelim
    const kvkkStyle = document.createElement('style');
    kvkkStyle.innerHTML = `
        .kvkk-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(5px);
            z-index: 99999999;
            display: none;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .kvkk-modal-overlay.show {
            display: flex;
            opacity: 1;
        }
        .kvkk-modal-content {
            background: #ffffff;
            color: #334155;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            border-radius: 16px;
            padding: 32px;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            font-family: 'Inter', sans-serif;
            transform: scale(0.95);
            transition: transform 0.3s ease;
        }
        .kvkk-modal-overlay.show .kvkk-modal-content {
            transform: scale(1);
        }
        .kvkk-modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: #f1f5f9;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            transition: background 0.2s;
        }
        .kvkk-modal-close:hover {
            background: #e2e8f0;
            color: #0f172a;
        }
        .kvkk-modal-content h2 {
            margin-top: 0;
            font-size: 1.25rem;
            color: #0f172a;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .kvkk-modal-content p, .kvkk-modal-content li {
            font-size: 0.9rem;
            line-height: 1.6;
            margin-bottom: 12px;
        }
    `;
    document.head.appendChild(kvkkStyle);

    // Modal HTML'i oluştur
    const modal = document.createElement('div');
    modal.className = 'kvkk-modal-overlay';
    modal.id = 'kvkk-modal';
    modal.innerHTML = `
        <div class="kvkk-modal-content">
            <button class="kvkk-modal-close" id="kvkk-modal-close-btn">&times;</button>
            <h2>Kişisel Verilerin Korunması ve Çerez Politikası</h2>
            
            <p><strong>1. Veri Sorumlusu</strong><br>
            6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca, web sitemizi ziyaretleriniz sırasında elde edilen kişisel verileriniz, "Zyronova" ("Şirket") tarafından veri sorumlusu sıfatıyla işlenmektedir.</p>

            <p><strong>2. Çerezlerin (Cookies) Kullanımı ve Amacı</strong><br>
            Web sitemiz, ziyaretçilerimize daha iyi bir kullanıcı deneyimi sunmak, oturum güvenliğini (güvenli giriş) sağlamak ve sistem performansını analiz etmek amacıyla teknik çerezler kullanmaktadır. Kullanılan çerezler kimliğinizi tespit etmeye yönelik reklam veya takip çerezleri değildir.</p>

            <p><strong>3. İşlenen Veriler ve Hukuki Sebebi</strong><br>
            Sisteme giriş yaptığınızda (Log-in) log kayıtlarınız (IP adresi, giriş zamanı), KVKK Madde 5/2(f) uyarınca "ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması" ve "bir sözleşmenin kurulması veya ifası" hukuki sebeplerine dayalı olarak işlenmektedir.</p>

            <p><strong>4. Haklarınız</strong><br>
            KVKK Madde 11 uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenme amacına uygun kullanılıp kullanılmadığını bilme, düzeltilmesini, silinmesini veya anonim hale getirilmesini talep etme hakkına sahipsiniz.</p>

            <p><em>Sitemizi ve hizmetlerimizi kullanmaya devam ederek, bu aydınlatma metnini okumuş, anlamış ve teknik çerezlerin kullanımına onay vermiş sayılırsınız.</em></p>
        </div>
    `;
    document.body.appendChild(modal);

    const banner = document.createElement('div');
    banner.className = 'kvkk-banner-container';
    banner.innerHTML = `
        <div class="kvkk-text-content">
            <div class="kvkk-icon">🍪</div>
            <div class="kvkk-text">
                <strong>Çerez (Cookie) Kullanımı</strong><br>
                Size daha iyi hizmet sunabilmek, site kullanımınızı analiz etmek ve güvenliğinizi sağlamak amacıyla çerezler kullanıyoruz. 
                Detaylı bilgi için <a href="#" id="kvkk-link-trigger">KVKK Aydınlatma Metni</a>'ni inceleyebilirsiniz. Sitemizi kullanmaya devam ederek çerez kullanımını kabul etmiş olursunuz.
            </div>
        </div>
        <div class="kvkk-buttons">
            <button class="kvkk-btn kvkk-btn-accept" id="kvkk-accept-btn">Anladım, Kabul Ediyorum</button>
        </div>
    `;
    document.body.appendChild(banner);

    // SPA uyumlu KVKK Banner Gösterim Mantığı
    const checkAndShowBanner = () => {
        // Çerez kabul edildiyse bir daha gösterme
        if (localStorage.getItem('zyronova_kvkk_accepted') === 'true') return;
        
        const hiddenPaths = ['/module-selector', '/', '/sso-login'];
        if (hiddenPaths.includes(window.location.pathname)) {
            // Seçim ekranındayız, afişi gizle
            banner.classList.remove('show');
        } else {
            // İlgili modülün içindeyiz, afişi göster
            if (!banner.classList.contains('show')) {
                banner.classList.add('show');
            }
        }
    };

    // Sayfa yüklendikten 1 saniye sonra ilk kontrolü yap
    setTimeout(checkAndShowBanner, 1000);

    // React Router (SPA) sayfa geçişlerini dinlemek için pushState'i kancala (hook)
    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        setTimeout(checkAndShowBanner, 100);
    };
    
    // Tarayıcı geri/ileri butonları için popstate dinleyicisi
    window.addEventListener('popstate', () => {
        setTimeout(checkAndShowBanner, 100);
    });

    // Modal açma/kapama işlemleri
    document.getElementById('kvkk-link-trigger').addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('show');
    });

    document.getElementById('kvkk-modal-close-btn').addEventListener('click', () => {
        modal.classList.remove('show');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    // Kabul Et butonuna tiklandiginda
    document.getElementById('kvkk-accept-btn').addEventListener('click', () => {
        // Tarayiciya onayi kaydet
        localStorage.setItem('zyronova_kvkk_accepted', 'true');
        
        // Cikis animasyonu
        banner.classList.remove('show');
        
        // Animasyon bitiminde DOM'dan kaldir
        setTimeout(() => {
            banner.remove();
        }, 600);
    });
})();
