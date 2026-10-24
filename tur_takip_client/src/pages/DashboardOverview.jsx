import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const DashboardOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const role = apiService.getUserRole();
  const isSuperAdmin = role === 'SUPERADMIN' || role === 'Admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (isSuperAdmin) {
        const res = await apiService.getSuperAdminAgencies();
        setData(Array.isArray(res) ? res : []);
      } else {
        const res = await apiService.getStats();
        setData(res || {});
      }
    } catch (err) {
      setError(err.message || 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSuperAdmin]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-overview">
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
            {error}
          </span>
          <button className="btn-primary" onClick={fetchData} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            <i className="fa-solid fa-rotate-right"></i> Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // ==== SUPER ADMIN RENDER ====
  if (isSuperAdmin) {
    const agencies = data || [];
    const activeLicenses = agencies.filter(a => !a.isExpired).length;
    const expiringLicenses = agencies.filter(a => a.isExpiringSoon).length;

    // Growth Data (last 7 days)
    const getGrowthData = () => {
      const counts = [0, 0, 0, 0, 0, 0, 0];
      agencies.forEach(a => {
        const regDate = new Date(a.CreatedAt);
        const diffDays = Math.floor((new Date() - regDate) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          counts[6 - diffDays]++;
        }
      });
      return counts;
    };
    const growthData = getGrowthData();
    const maxGrowth = Math.max(...growthData, 5);

    return (
      <div className="dashboard-overview">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="section-title" style={{ margin: 0, textAlign: 'left', fontSize: '2rem' }}>Master Pano</h2>
          <div className="section-actions">
            <button className="btn-primary" onClick={fetchData}>
              <i className="fa-solid fa-rotate-right"></i> Yenile
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--blueGlow)', color: 'var(--blue)' }}>
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="stat-content">
              <div className="stat-label">Toplam Acente</div>
              <div className="stat-value">{agencies.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
              <i className="fa-solid fa-key"></i>
            </div>
            <div className="stat-content">
              <div className="stat-label">Aktif Lisanslar</div>
              <div className="stat-value">{activeLicenses}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#eab308' }}>
              <i className="fa-solid fa-clock"></i>
            </div>
            <div className="stat-content">
              <div className="stat-label">Yaklaşan Bitişler</div>
              <div className="stat-value">{expiringLicenses}</div>
            </div>
          </div>
        </div>

        <div className="dashboard-content" style={{ marginTop: '24px' }}>
          <div className="glass-panel">
            <div className="panel-header">
              <h3>Son 7 Günlük Büyüme (Yeni Acenteler)</h3>
            </div>
            <div className="panel-body">
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '20px', padding: '20px 0' }}>
                {growthData.map((val, idx) => {
                  const heightPct = (val / maxGrowth) * 100;
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted)' }}>{val}</span>
                      <div style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        background: 'linear-gradient(to top, var(--blue), var(--pink))',
                        borderRadius: '4px',
                        transition: 'height 0.3s ease'
                      }}></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==== AGENCY RENDER ====
  const counts = data?.counts || {};
  const earnings = Array.isArray(data?.earnings) ? data.earnings : [];
  const recentBookings = Array.isArray(data?.recentBookings) ? data.recentBookings : [];
  const popularHotels = Array.isArray(data?.popularHotels) ? data.popularHotels : [];

  const formatTotalRevenue = () => {
    if (earnings.length === 0) return '0 ₺';
    const first = earnings[0];
    if (!first || first.Total == null) return '0 ₺';
    const formattedVal = Number(first.Total).toLocaleString('tr-TR');
    const currency = first.Currency || '₺';
    return `${formattedVal} ${currency}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    if (typeof dateStr === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
      return dateStr;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('tr-TR');
  };

  const formatEarnings = (amount, currency) => {
    if (amount == null) return `0 ${currency || '₺'}`;
    const num = Number(amount);
    return `${isNaN(num) ? amount : num.toLocaleString('tr-TR')} ${currency || '₺'}`;
  };

  return (
    <div className="dashboard-overview">
      <div className="section-header">
        <h2 className="section-title">Genel Durum</h2>
        <div className="section-actions">
          <button className="btn-primary" onClick={fetchData}>
            <i className="fa-solid fa-rotate-right"></i> Yenile
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blueGlow)', color: 'var(--blue)' }}>
            <i className="fa-solid fa-route"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">Aktif Turlar</div>
            <div className="stat-value">{counts.TourCount ?? 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--pinkGlow)', color: 'var(--pink)' }}>
            <i className="fa-solid fa-ticket"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">Bugünkü Rezervasyonlar</div>
            <div className="stat-value">{counts.TodayBookings ?? 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">Personel Sayısı</div>
            <div className="stat-value">{counts.StaffCount ?? 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#eab308' }}>
            <i className="fa-solid fa-wallet"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">Toplam Gelir</div>
            <div className="stat-value">{formatTotalRevenue()}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="glass-panel">
          <div className="panel-header">
            <h3>Son Rezervasyonlar</h3>
          </div>
          <div className="panel-body">
            {recentBookings.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Turist Adı</th>
                    <th>Tur</th>
                    <th>Kazanç</th>
                    <th>Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking, idx) => (
                    <tr key={booking.BookingID || idx}>
                      <td>{booking.TouristName || '-'}</td>
                      <td>{booking.TourName || '-'}</td>
                      <td>{formatEarnings(booking.Earnings, booking.Currency)}</td>
                      <td>{formatDate(booking.BookingDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <i className="fa-solid fa-inbox"></i>
                <p>Henüz rezervasyon bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel">
          <div className="panel-header">
            <h3>Popüler Oteller</h3>
          </div>
          <div className="panel-body">
            {popularHotels.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: '16px 20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {popularHotels.map((hotel, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      border: '1px solid var(--line)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-hotel" style={{ color: 'var(--blue)' }}></i>
                      <span style={{ fontWeight: 500 }}>{hotel.HotelName || 'Bilinmeyen Otel'}</span>
                    </div>
                    <span className="badge badge-primary">{hotel.TourCount ?? 0} Tur</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <i className="fa-solid fa-hotel"></i>
                <p>Popüler otel verisi bulunamadı.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
