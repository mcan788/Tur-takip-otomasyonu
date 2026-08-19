import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Users, Key, Clock, TrendingUp, Bell } from 'lucide-react';
import api from '../services/api';

const SuperAdminHome = () => {
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const response = await api.get('/super-admin/agencies');
        const data = response.data;
        setAgencies(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Veri çekme hatası:', err);
        setAgencies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgencies();
  }, []);

  const stats = [
    { label: 'Toplam Acente', value: agencies.length, icon: <Users color="#4d79ff" />, color: '#4d79ff', link: '/super-admin/agencies' },
    { label: 'Aktif Lisanslar', value: agencies.filter(a => !a.isExpired).length, icon: <Key color="#10b981" />, color: '#10b981', link: '/super-admin/agencies' },
    { label: 'Yaklaşan Bitişler', value: agencies.filter(a => a.isExpiringSoon).length, icon: <Clock color="#facc15" />, color: '#facc15', link: '/super-admin/agencies' },
  ];

  // Dinamik Büyüme Grafiği (Son 7 gün kayıtları)
  const getGrowthData = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('tr-TR', { weekday: 'short' });
    });

    const counts = [...Array(7)].fill(0);
    agencies.forEach(a => {
      const regDate = new Date(a.CreatedAt);
      const diffDays = Math.floor((new Date() - regDate) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        counts[6 - diffDays]++;
      }
    });

    const maxCount = Math.max(...counts, 1);
    return { days: last7Days, values: counts, max: maxCount };
  };

  const growth = getGrowthData();

  if (loading) return (
    <div className="page-layout">
      <Sidebar type="super" />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '56px' }}>
        <div className="loader"></div>
        <span style={{ color: 'var(--text-muted)', marginLeft: '15px' }}>Yükleniyor...</span>
      </div>
    </div>
  );

  return (
    <div className="page-layout">
      <Sidebar type="super" />
      
      <main className="page-main">
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Genel Bakış</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sistem genelindeki tüm modüllerin ve acentelerin anlık özet durumu.</p>
        </header>

        <div className="super-stats-grid responsive-grid-3">
          {stats.map((stat, index) => (
            <div key={index} onClick={() => stat.link && navigate(stat.link)} className="glass card-hover" style={{ padding: '25px', display: 'flex', alignItems: 'center', position: 'relative', cursor: stat.link ? 'pointer' : 'default' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: stat.color }}></div>
              <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', marginRight: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '5px' }}>{stat.label}</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800' }}>{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="super-charts-grid responsive-grid-2">
          <div className="glass" style={{ padding: '30px' }}>
            <h3 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', fontSize: '20px', fontWeight: '700' }}>
              <TrendingUp size={22} style={{ marginRight: '12px' }} color="var(--accent-color)" />
              Yeni Acente Kayıtları (Haftalık)
            </h3>
            <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '0 10px' }}>
              {growth.values.map((count, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                   <div style={{ 
                     width: '100%', 
                     height: `${(count / (growth.max + 1)) * 100 + 5}%`, 
                     background: count > 0 ? 'linear-gradient(to top, var(--accent-color), #818cf8)' : 'rgba(255,255,255,0.02)', 
                     borderRadius: '8px 8px 0 0',
                     transition: 'all 0.5s ease',
                     position: 'relative',
                     boxShadow: count > 0 ? '0 4px 15px rgba(77, 121, 255, 0.2)' : 'none'
                   }} className="chart-bar">
                      {count > 0 && (
                        <span style={{ 
                          position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)',
                          fontSize: '12px', fontWeight: '800', color: 'var(--accent-color)'
                        }}>{count}</span>
                      )}
                   </div>
                   <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{growth.days[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{ padding: '30px' }}>
            <h3 style={{ marginBottom: '25px', fontSize: '20px', display: 'flex', alignItems: 'center', fontWeight: '700' }}>
              <Bell size={20} style={{ marginRight: '12px' }} color="#facc15" />
              Sistem Bildirimleri
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Lisans Bildirimleri */}
              {agencies.filter(a => a.isExpiringSoon).map(agency => (
                <div key={`exp-${agency.AgencyID}`} style={{ 
                  padding: '15px', 
                  background: 'rgba(239, 68, 68, 0.08)', 
                  borderRadius: '14px', 
                  borderLeft: '4px solid #ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.15)'
                }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>Lisans Süresi Azaldı</p>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{agency.AgencyName} acentesinin lisansı {agency.daysRemaining} gün sonra bitiyor.</p>
                </div>
              ))}

              {/* Yeni Katılım Bildirimleri */}
              {agencies.slice(0, 3).map(agency => (
                <div key={`new-${agency.AgencyID}`} style={{ 
                  padding: '15px', 
                  background: 'rgba(16, 185, 129, 0.06)', 
                  borderRadius: '14px', 
                  borderLeft: '4px solid #10b981',
                  border: '1px solid rgba(16, 185, 129, 0.15)'
                }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>Yeni Acente Katıldı</p>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{agency.AgencyName} ({agency.OwnerName}) sisteme başarıyla dahil oldu.</p>
                </div>
              ))}

              {agencies.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '14px' }}>Henüz aktif bir bildirim bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          .chart-bar:hover { filter: brightness(1.2); }
          .loader {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.05);
            border-bottom-color: var(--accent-color);
            border-radius: 50%;
            display: inline-block;
            box-sizing: border-box;
            animation: rotation 1s linear infinite;
          }
          @keyframes rotation {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media (max-width: 1024px) {
            .super-stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 768px) {
            .super-stats-grid {
              grid-template-columns: 1fr !important;
            }
            .super-charts-grid {
              grid-template-columns: 1fr !important;
              gap: 20px !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
};

export default SuperAdminHome;
