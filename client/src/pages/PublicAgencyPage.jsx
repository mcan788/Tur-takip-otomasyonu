import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Calendar, Users, Star, ArrowRight, ShieldCheck, Phone } from 'lucide-react';

const PublicAgencyPage = () => {
  const { agencyUsername } = useParams();
  const [agency, setAgency] = useState(null);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simüle edilen veri çekme (Gerçekte API'den gelecek)
    setTimeout(() => {
      setAgency({
        name: 'Mavi Tur Seyahat',
        logo: null,
        phone: '+90 555 123 4567',
        description: 'Ege ve Akdeniz\'in en seçkin turları ile hayallerinizdeki tatili yaşayın.'
      });
      setTours([
        { id: 1, title: 'Fethiye Ölüdeniz Tekne Turu', price: '750', region: 'Fethiye', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80', rating: 4.8 },
        { id: 2, title: 'Kapadokya Balon Turu', price: '4500', region: 'Nevşehir', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', rating: 4.9 },
        { id: 3, title: 'Antalya Düden Şelalesi Gezisi', price: '1200', region: 'Antalya', image: 'https://images.unsplash.com/photo-1540202404-a2f29016bb5d?auto=format&fit=crop&w=800&q=80', rating: 4.7 }
      ]);
      setLoading(false);
    }, 1000);
  }, [agencyUsername]);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: 'white' }}>
      Yükleniyor...
    </div>
  );

  return (
    <div style={{ background: '#0f172a', color: 'white', minHeight: '100vh', fontFamily: "'Outfit', sans-serif" }}>
      {/* Navbar */}
      <nav className="public-navbar" style={{ padding: '20px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {agency?.name}
        </h1>
        <div style={{ display: 'flex', gap: '30px', fontSize: '14px', fontWeight: '500' }}>
          <a href="#tours" style={{ color: 'white', textDecoration: 'none' }}>Turlar</a>
          <a href="#about" style={{ color: 'white', textDecoration: 'none' }}>Kurumsal</a>
          <a href="#contact" style={{ color: '#38bdf8', textDecoration: 'none', border: '1px solid #38bdf8', padding: '8px 20px', borderRadius: '25px' }}>İletişim</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="public-hero" style={{ height: '70vh', position: 'relative', display: 'flex', alignItems: 'center', padding: '0 5%', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
          <img src="https://images.unsplash.com/photo-1506929113614-b9b1095f3efb?auto=format&fit=crop&w=1600&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} alt="Hero" />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top, #0f172a, transparent)' }}></div>
        </div>

        <div style={{ maxWidth: '700px' }}>
          <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '5px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>DÜNYAYI KEŞFET</span>
          <h2 style={{ fontSize: '64px', fontWeight: '900', margin: '20px 0', lineHeight: '1.1' }}>Unutulmaz Bir <br /><span style={{ color: '#38bdf8' }}>Macera</span> Başlıyor</h2>
          <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '40px' }}>{agency?.description}</p>
          <button style={{ background: '#38bdf8', color: '#0f172a', padding: '15px 35px', borderRadius: '30px', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            Hemen Rezervasyon Yap <ArrowRight size={20} style={{ marginLeft: '10px' }} />
          </button>
        </div>
      </section>

      {/* Tours Grid */}
      <section id="tours" style={{ padding: '80px 5%' }}>
        <div className="tours-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '32px', fontWeight: '800' }}>Popüler Turlarımız</h3>
            <p style={{ color: '#94a3b8', marginTop: '10px' }}>Sizin için seçtiğimiz en iyi deneyimler.</p>
          </div>
          <div className="responsive-flex-row">
            {['Hepsi', 'Ege', 'Akdeniz', 'Kapadokya'].map(cat => (
              <button key={cat} style={{ padding: '8px 20px', borderRadius: '20px', border: '1px solid #1e293b', background: cat === 'Hepsi' ? '#1e293b' : 'transparent', color: 'white', fontSize: '14px' }}>{cat}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
          {tours.map(tour => (
            <div key={tour.id} className="tour-card" style={{ background: '#1e293b', borderRadius: '24px', overflow: 'hidden', transition: 'all 0.3s ease' }}>
              <div style={{ position: 'relative', height: '240px' }}>
                <img src={tour.image} alt={tour.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(15, 23, 42, 0.8)', padding: '5px 12px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Star size={14} color="#facc15" fill="#facc15" />
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{tour.rating}</span>
                </div>
              </div>
              <div style={{ padding: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>
                  <MapPin size={14} /> {tour.region}
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>{tour.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Kişi Başı</span>
                    <p style={{ fontSize: '24px', fontWeight: '800', color: '#22c55e' }}>₺{tour.price}</p>
                  </div>
                  <button style={{ background: '#38bdf8', color: '#0f172a', width: '45px', height: '45px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section style={{ padding: '60px 5%', background: '#1e293b' }}>
        <div className="trust-grid responsive-grid-4">
          <div style={{ textAlign: 'center' }}>
            <ShieldCheck size={32} color="#38bdf8" style={{ marginBottom: '15px' }} />
            <h5 style={{ fontWeight: '700' }}>Güvenli Ödeme</h5>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>256-bit SSL koruması</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Users size={32} color="#38bdf8" style={{ marginBottom: '15px' }} />
            <h5 style={{ fontWeight: '700' }}>Mutlu Müşteri</h5>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>10.000+ Başarılı rezervasyon</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Calendar size={32} color="#38bdf8" style={{ marginBottom: '15px' }} />
            <h5 style={{ fontWeight: '700' }}>Kolay İptal</h5>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>Son 24 saate kadar iade</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Phone size={32} color="#38bdf8" style={{ marginBottom: '15px' }} />
            <h5 style={{ fontWeight: '700' }}>7/24 Destek</h5>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>Uzman ekibimiz yanınızda</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 5% 30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="public-footer-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <h4 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>{agency?.name}</h4>
            <p style={{ color: '#94a3b8', maxWidth: '300px', fontSize: '14px' }}>Hayatınızın macerasına çıkmak için hazır mısınız?</p>
          </div>
          <div className="responsive-flex-row">
            <div>
              <h5 style={{ fontWeight: '700', marginBottom: '20px' }}>Hızlı Bağlantılar</h5>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px', color: '#94a3b8' }}>
                <li style={{ marginBottom: '10px' }}>Turlar</li>
                <li style={{ marginBottom: '10px' }}>Hakkımızda</li>
                <li>SSS</li>
              </ul>
            </div>
            <div>
              <h5 style={{ fontWeight: '700', marginBottom: '20px' }}>İletişim</h5>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>{agency?.phone}</p>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '10px' }}>info@zyronova.com</p>
            </div>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#475569', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          © 2026 Zyronova tarafından güçlendirilmiştir.
        </p>
      </footer>
      <style>{`
        @media (max-width: 991px) {
          .trust-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 30px 20px !important;
          }
        }
        @media (max-width: 768px) {
          .public-navbar {
            flex-direction: column !important;
            gap: 15px !important;
            text-align: center !important;
          }
          .public-navbar div {
            gap: 20px !important;
          }
          .public-hero {
            height: auto !important;
            padding: 80px 20px !important;
            text-align: center !important;
          }
          .public-hero h2 {
            font-size: 38px !important;
          }
          .public-hero button {
            margin: 0 auto !important;
          }
          .tours-title-row {
            flex-direction: column !important;
            align-items: center !important;
            gap: 20px !important;
            text-align: center !important;
          }
          .tours-title-row div {
            justify-content: center !important;
          }
          .public-footer-row {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 30px !important;
          }
          .public-footer-row > div:nth-child(2) {
            flex-direction: column !important;
            gap: 30px !important;
          }
        }
        @media (max-width: 576px) {
          .trust-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PublicAgencyPage;
