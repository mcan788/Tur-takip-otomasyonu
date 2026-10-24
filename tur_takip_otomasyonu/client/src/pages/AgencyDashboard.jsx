import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { TrendingUp, MapPin, Building, DollarSign, Calendar, Users, Activity } from 'lucide-react';
import api from '../services/api';
import TourPerformanceTabs from '../components/TourPerformanceTabs';

const AgencyDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Varsayılan tarih aralığı (Son 7 gün)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStats();
  }, [dateRange]); // Tarih değiştiğinde otomatik yenile

  const fetchStats = async () => {
    try {
      const agencyId = localStorage.getItem('agencyId');
      
      if (!agencyId || agencyId === 'null') {
        setLoading(false);
        return;
      }
      
      const response = await api.get(`/agency/stats/${agencyId}`, {
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      
      if (response.status === 200) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('İstatistikler alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  // Do not return early. We will render the dashboard structure with skeleton/empty values to instantly trigger Largest Contentful Paint (LCP).

  const displayStats = React.useMemo(() => [
    { 
      label: 'Toplam Kazanç (€)', 
      value: `€${stats?.earnings?.find(e => e.Currency === '€')?.Total || 0}`, 
      icon: <DollarSign color="#22c55e" />, 
      trend: 'Seçili Dönem',
      color: '#22c55e'
    },
    { 
      label: 'Toplam Kazanç ($)', 
      value: `$${stats?.earnings?.find(e => e.Currency === '$')?.Total || 0}`, 
      icon: <DollarSign color="#38bdf8" />, 
      trend: 'Seçili Dönem',
      color: '#38bdf8'
    },
    { 
      label: 'Dönem Rezervasyon', 
      value: stats?.counts?.RangeBookings || 0, 
      icon: <TrendingUp color="#818cf8" />, 
      trend: 'Filtreli',
      color: '#818cf8'
    },
    { 
      label: 'Bugünkü Rezervasyon', 
      value: stats?.counts?.TodayBookings || 0, 
      icon: <Calendar color="#facc15" />, 
      trend: 'Bugün',
      color: '#facc15'
    },
  ], [stats]);

  // Grafik verisi hazırlama (Son 7 gün)
  const chartData = stats?.dailyRevenue || [];
  const maxVal = Math.max(...chartData.map(d => Number(d.Total) || 0), 10);

  return (
    <div className="page-layout">
      <Sidebar type="agency" />
      
      <main className="page-main">
        <header className="agency-header" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Genel Bakış</h1>
            <p style={{ color: 'var(--text-muted)' }}>Acentenizin anlık performansı ve finansal durumu.</p>
          </div>
          
          <div className="agency-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Date Range Picker */}
            <div className="glass date-picker-container" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px', 
              padding: '10px 20px', 
              borderRadius: '15px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(255, 255, 255, 0.5)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label htmlFor="date-start" style={{ fontSize: '11px', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Başlangıç</label>
                <input 
                  type="date" 
                  id="date-start"
                  aria-label="Başlangıç tarihi"
                  value={dateRange.start} 
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  style={{ 
                    background: 'rgba(255,255,255,0.8)', 
                    border: '1px solid var(--glass-border)', 
                    color: '#0f172a', 
                    fontSize: '13px', 
                    outline: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label htmlFor="date-end" style={{ fontSize: '11px', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bitiş</label>
                <input 
                  type="date" 
                  id="date-end"
                  aria-label="Bitiş tarihi"
                  value={dateRange.end} 
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  style={{ 
                    background: 'rgba(255,255,255,0.8)', 
                    border: '1px solid var(--glass-border)', 
                    color: '#0f172a', 
                    fontSize: '13px', 
                    outline: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '12px 20px', 
              background: 'rgba(34, 197, 94, 0.1)', 
              borderRadius: '15px',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }}></div>
              <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: '700' }}>SİSTEM CANLI</span>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="agency-stats-grid">
          {displayStats.map((stat, index) => (
            <div key={index} className="glass card-hover" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: stat.color }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  {stat.icon}
                </div>
                <span style={{ fontSize: '11px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {stat.trend}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '5px' }}>{stat.label}</p>
              <h3 style={{ fontSize: '28px', fontWeight: '800' }}>{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="agency-charts-grid">
          {/* Revenue Chart */}
          <section className="glass" style={{ padding: '30px' }}>
            <div className="responsive-flex-header">
              <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={20} color="var(--accent-color)" />
                Günlük Operasyon Trendi
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Son 7 Günlük Kayıtlar</div>
            </div>
            
            <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '20px', paddingBottom: '20px', position: 'relative', paddingLeft: '40px' }}>
              {/* Y-Axis scale */}
              <div style={{ position: 'absolute', left: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '10px' }}>
                <span>{Math.round(maxVal)}</span>
                <span>{Math.round(maxVal/2)}</span>
                <span>0</span>
              </div>

              {chartData.length > 0 ? chartData.map((day, i) => (
                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                  <div style={{ 
                    width: '35px', 
                    height: `${(Number(day.Total) / Number(maxVal)) * 100}%`, 
                    minHeight: '4px',
                    background: 'linear-gradient(to top, var(--accent-color), #818cf8)', 
                    borderRadius: '8px 8px 0 0',
                    transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)'
                  }} className="chart-bar">
                    <div className="tooltip" style={{ 
                      position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
                      background: '#1e293b', padding: '10px', borderRadius: '8px', fontSize: '12px',
                      whiteSpace: 'nowrap', opacity: 0, transition: '0.3s', zIndex: 10,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', border: '1px solid var(--glass-border)'
                    }}>
                      <div style={{ color: 'var(--accent-color)', fontWeight: '700', marginBottom: '3px' }}>{day.Date} Detayı</div>
                      <div>Hacim: {day.Total.toLocaleString('tr-TR')}</div>
                      <div>Rezervasyon: {day.BookingCount} Adet</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{day.Date}</span>
                </div>
              )) : (
                <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Henüz veri bulunmuyor.
                </div>
              )}
            </div>
          </section>

          {/* Popular Content */}
          <section className="glass" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: 'rgba(250, 204, 21, 0.1)', borderRadius: '10px' }}>
                <Activity size={20} color="#facc15" />
              </div>
              Popüler Oteller / Konumlar
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {stats?.popularHotels?.length > 0 ? stats.popularHotels.map((hotel, idx) => {
                // Maksimum değeri 5 üzerinden oranla ki küçük sayılarda bar dengeli görünsün
                const maxRef = 5; 
                const percentage = Math.min((hotel.TourCount / maxRef) * 100, 100);
                
                return (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                      <span style={{ fontWeight: '600', color: '#1e293b', letterSpacing: '0.3px' }}>{hotel.HotelName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--accent-color)', fontWeight: '800', fontSize: '15px' }}>{hotel.TourCount}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Rez.</span>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <div style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #38bdf8, #818cf8)', 
                        borderRadius: '10px',
                        boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}></div>
                    </div>
                  </div>
                );
              }) : <p style={{ color: 'var(--text-muted)' }}>Veri bulunmuyor.</p>}
            </div>
          </section>

          {/* Recent Bookings Table-style */}
          <section className="glass" style={{ padding: '30px', gridColumn: 'span 2' }}>
            <div className="responsive-flex-header">
              <h2 style={{ fontSize: '20px' }}>Son Rezervasyonlar</h2>
              <button className="btn" style={{ fontSize: '13px', color: 'var(--accent-color)' }} aria-label="Tüm rezervasyonları görüntüle">Tümünü Gör</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)', fontSize: '13px' }}>
                    <th style={{ padding: '15px' }}>Tur</th>
                    <th style={{ padding: '15px' }}>Müşteri / Otel</th>
                    <th style={{ padding: '15px' }}>Şube</th>
                    <th style={{ padding: '15px' }}>Tarih</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Kazanç</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentBookings?.map((booking) => (
                    <tr key={booking.BookingID} style={{ borderBottom: '1px solid var(--glass-border)', transition: '0.3s' }}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '600' }}>{booking.TourName}</div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '500' }}>{booking.TouristName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{booking.HotelName}</div>
                      </td>
                      <td style={{ padding: '15px', fontSize: '14px' }}>{booking.OfficeName}</td>
                      <td style={{ padding: '15px', fontSize: '14px', color: 'var(--text-muted)' }}>
                        {new Date(booking.BookingDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        <span style={{ fontWeight: '700', color: '#22c55e' }}>+{booking.Currency}{booking.Earnings}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
</div>
            </div>
          </section>

          {/* Tour Performance Tabs */}
          {stats?.tourPerformances && (
            <TourPerformanceTabs data={stats.tourPerformances} />
          )}

        </div>
      </main>
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .chart-bar:hover .tooltip {
          opacity: 1;
        }
        .card-hover:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.08);
          border-color: var(--accent-color);
        }
        .loader {
          width: 48px;
          height: 48px;
          border: 5px solid #FFF;
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

        .agency-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .agency-charts-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 25px;
        }

        @media (max-width: 1200px) {
          .agency-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 900px) {
          .agency-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 20px !important;
          }
          .agency-header-actions {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 15px !important;
          }
          .agency-charts-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .agency-charts-grid > section {
            grid-column: span 1 !important;
          }
        }

        @media (max-width: 600px) {
          .agency-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 15px !important;
          }
          .date-picker-container {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .date-picker-container > div {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .date-picker-container > div input {
            flex: 1 !important;
            max-width: 150px !important;
          }
          .date-picker-container > div:nth-child(2) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AgencyDashboard;
