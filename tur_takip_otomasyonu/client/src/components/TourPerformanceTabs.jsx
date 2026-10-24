import React, { useState } from 'react';

const TourPerformanceTabs = ({ data = [] }) => {
  const [currency, setCurrency] = useState('€');
  const [activeTab, setActiveTab] = useState(0);
  const [activeInnerTab, setActiveInnerTab] = useState('rentals');

  if (!data || data.length === 0) {
    return (
      <div className="glass" style={{ padding: '30px', textAlign: 'center', marginTop: '30px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Henüz tur performans verisi bulunmuyor.</p>
      </div>
    );
  }


  const activeTour = data[activeTab];
  const stats = activeTour?.currency_stats[currency] || { gelir: 0, gider: 0, kar: 0 };

  // filter bookings & expenses by currency
  const filteredBookings = activeTour?.bookings.filter(b => (b.Currency || '€') === currency) || [];
  const filteredExpenses = activeTour?.expenses.filter(e => (e.Currency || '€') === currency) || [];

  return (
    <div className="glass" style={{ padding: '30px', marginTop: '30px', gridColumn: 'span 2' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Tur Bazlı Performans</h2>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          aria-label="Para birimi seçimi"
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.5)', outline: 'none', cursor: 'pointer' }}
        >
          <option value="€">€ (EUR)</option>
          <option value="$">$ (USD)</option>
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' }}>
        {data.map((tour, idx) => (
          <button
            key={tour.TourID}
            onClick={() => setActiveTab(idx)}
            aria-label={`${tour.TourName} tur performansını göster`}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              whiteSpace: 'nowrap',
              background: activeTab === idx ? 'var(--accent-color)' : 'rgba(255,255,255,0.5)',
              color: activeTab === idx ? '#fff' : 'inherit',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              fontWeight: activeTab === idx ? '600' : 'normal',
              transition: '0.3s'
            }}
          >
            {tour.TourName}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTour && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>{activeTour.TourName}</h3>
          </div>

          {/* Inner Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => setActiveInnerTab('rentals')}
              aria-label="Rezervasyonları göster"
              style={{ padding: '6px 16px', borderRadius: '6px', background: activeInnerTab === 'rentals' ? 'rgba(0,0,0,0.08)' : 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }}
            >
              Rezervasyonlar
            </button>
            <button
              onClick={() => setActiveInnerTab('expenses')}
              aria-label="Ek giderleri göster"
              style={{ padding: '6px 16px', borderRadius: '6px', background: activeInnerTab === 'expenses' ? 'rgba(0,0,0,0.08)' : 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }}
            >
              Ek Giderler
            </button>
          </div>

          {/* Inner Content */}
          {activeInnerTab === 'rentals' && (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <th style={{ padding: '12px 15px' }}>Müşteri</th>
                    <th style={{ padding: '12px 15px' }}>Tarih</th>
                    <th style={{ padding: '12px 15px', textAlign: 'right' }}>Kişi Sayısı</th>
                    <th style={{ padding: '12px 15px', textAlign: 'right' }}>Gelir</th>
                    <th style={{ padding: '12px 15px', textAlign: 'right' }}>Gider</th>
                    <th style={{ padding: '12px 15px', textAlign: 'right' }}>Kâr</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length > 0 ? filteredBookings.map((b, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)', transition: '0.2s', ':hover': { background: 'rgba(0,0,0,0.02)' } }}>
                      <td style={{ padding: '15px', fontWeight: '500' }}>{b.TouristName}</td>
                      <td style={{ padding: '15px', fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(b.Date).toLocaleDateString('tr-TR')}</td>
                      <td style={{ padding: '15px', textAlign: 'right', fontSize: '14px' }}>{b.Count} Kişi</td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600', color: '#22c55e' }}>{b.Currency}{b.Earnings?.toLocaleString('tr-TR')}</td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600', color: '#ef4444' }}>{b.Currency}{b.Expense?.toLocaleString('tr-TR') || '0'}</td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600', color: '#22c55e' }}>{b.Currency}{(Number(b.Earnings || 0) - Number(b.Expense || 0))?.toLocaleString('tr-TR')}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Seçili para biriminde rezervasyon kaydı bulunamadı.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeInnerTab === 'expenses' && (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <th style={{ padding: '12px 15px' }}>Gider Tipi / Açıklama</th>
                    <th style={{ padding: '12px 15px' }}>Tarih</th>
                    <th style={{ padding: '12px 15px', textAlign: 'right' }}>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length > 0 ? filteredExpenses.map((e, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '15px', fontWeight: '500' }}>{e.Description}</td>
                      <td style={{ padding: '15px', fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(e.Date).toLocaleDateString('tr-TR')}</td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600', color: '#ef4444' }}>{e.Currency}{e.Amount?.toLocaleString('tr-TR')}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Seçili para biriminde ek gider kaydı bulunamadı.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TourPerformanceTabs;
