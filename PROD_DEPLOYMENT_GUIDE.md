# ZYRONOVA Enterprise Multi-Tenant SaaS - Üretim Dağıtım Kılavuzu (Production Deployment Guide)

Bu kılavuz; **Node.js (React + Express) Tur Takip Otomasyonu** ve **Python (Flask) Rent A Car SaaS** sistemlerinin sunucuya yüklendiğinde tüm bağımlılıklarının otomatik olarak kurulabilmesi için gereken teknolojileri, ortam gereksinimlerini ve tek adımlık kurulum komutlarını içerir.

---

## 🛠️ Gerekli Ana Teknolojiler (Sistem Gereksinimleri)

Projeyi üretim sunucusunda (Windows Server veya Linux VPS) sorunsuz çalıştırmak için aşağıdaki çalışma zamanlarının (runtimes) sunucuda kurulu olması gerekir:

1.  **Node.js (v18 veya üzeri):** React (Vite) istemcisi ve Express API sunucusu için gereklidir.
2.  **Python (v3.10 veya v3.11):** Rent A Car Flask SaaS paneli ve veri analiz motoru için gereklidir.
3.  **Microsoft SQL Server veya SQLite:**
    *   **Tur Takip:** İlişkisel MS SQL veritabanı (üretim ortamında yüksek erişilebilirlik için).
    *   **Rent A Car:** Çok kiracılı bağımsız SQLite havuz yapısı (şirket başına izole fiziksel DB).
4.  **C++ Build Tools (Windows için):** Node.js üzerindeki yerel `msnodesqlv8` veya Python üzerindeki `pyodbc` sürücülerinin MS SQL ile doğrudan haberleşebilmesi için gereklidir.

---

## 📦 Otomatik Bağımlılık Yükleme Komutları (requirements.txt & package.json)

Sistemi sunucuya yüklediğinizde, manuel olarak paket indirmek yerine aşağıdaki tek satırlık terminal komutlarıyla tüm kütüphanelerin sıfırdan otomatik inmesini sağlayabilirsiniz:

### 1. Python Rent A Car SaaS Bağımlılıkları (requirements.txt)
Rent A Car sunucu dizinine (`rent_a_car`) giderek terminalde şu komutu çalıştırın:
```bash
pip install -r requirements.txt
```
*Bu komut; Flask, Flask-SQLAlchemy, Flask-Login, pyodbc (MS SQL bağlantısı), pyotp (2FA), numpy, pandas (ciro analizleri) ve Waitress (Production Web Server) kütüphanelerinin tamamını sunucuya otomatik olarak indirir.*

### 2. Node.js React + Express Bağımlılıkları (package.json)
Tur Takip ana dizininde (`Tur_takip_sistemi`) terminalde şu komutu çalıştırın:
```bash
npm run install-all
```
*Bu özel script; kök dizindeki package.json içinden tetiklenerek hem `server` (Express API) hem de `client` (React + Vite) klasörlerindeki tüm bağımlılıkları (Express, JWT, bcryptjs, mssql, msnodesqlv8, React, Axios, Chart.js vb.) otomatik olarak sırayla indirir ve yapılandırır.*

---

## 🚀 Projeyi Canlıya Alma ve Çalıştırma (Production Run)

Tüm bağımlılıklar kurulduktan sonra sunucuda sistemleri üretim modunda başlatmak için aşağıdaki adımları takip edin:

### Adım 1: .env Ortam Değişkenleri
Her iki sunucunun kök dizinindeki `.env` dosyalarını sunucu IP ve DB şifrelerinizle güncelleyin.

### Adım 2: Express API ve React Arayüzünü Başlatma (Tur Takip)
Tur Takip kök dizininde şu komutla her iki Node.js uygulamasını eşzamanlı olarak başlatabilirsiniz:
```bash
npm run start
```

### Adım 3: Flask Uygulamasını Üretimde Başlatma (Rent A Car)
Python tarafında, Flask'ın yerel geliştirme sunucusu yerine üretim sunucusu olan **Waitress**'ı kullanıyoruz. Rent A Car dizininde şu komutla sunucuyu canlıya alabilirsiniz:
```bash
python serve.py
```
*(Waitress sunucusu varsayılan olarak `5001` portunda çalışmaya başlar ve gelen SSO isteklerini karşılar.)*

---

### 💡 Sunucu İpuçları (PM2 Entegrasyonu)
Node.js ve Python servislerinizin sunucu kapandığında otomatik olarak yeniden başlaması ve arka planda sürekli ayakta kalması için **PM2** proses yöneticisini kullanmanız önerilir:
```bash
# Node.js Servislerini Başlat
pm2 start server/index.js --name "zyronova-node-api"
pm2 start npm --name "zyronova-react-client" -- run dev

# Python Servisini Başlat
pm2 start serve.py --name "zyronova-python-rent" --interpreter python
```
