import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

function Licenses() {
  const [data, setData] = useState({ reportData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getSuperAdminReport();
      setData(response || { reportData: [] });
    } catch (err) {
      setError(err.message || 'Rapor verileri alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Compute stats from reportData if top-level properties are missing
  const calculateTotal = (type) => {
    if (!data.reportData) return 0;
    return data.reportData
      .filter(item => item.TransactionType === type || type === 'ALL')
      .reduce((acc, curr) => acc + (parseFloat(curr.Amount) || 0), 0);
  };

  const totalRevenue = data.ToplamCiro !== undefined ? data.ToplamCiro : calculateTotal('ALL');
  const totalAgencies = data.ToplamAcente !== undefined ? data.ToplamAcente : new Set((data.reportData || []).map(item => item.AgencyName)).size;
  const transactionCount = (data.reportData || []).length;

  return (
    <div className="page-container">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title" style={{ margin: 0, textAlign: 'left', fontSize: '2rem' }}>Finansal Raporlar</h1>
      </div>

      {error && (
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--pink)', padding: '15px', marginBottom: '20px' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--pink)', marginRight: '10px' }}></i>
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--blue)' }}></i>
          <p style={{ marginTop: '10px', color: 'var(--muted)' }}>Veriler yükleniyor...</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ color: 'var(--blue)' }}>
                <i className="fa-solid fa-wallet"></i>
              </div>
              <div className="stat-details">
                <h3>Toplam Ciro</h3>
                <p className="stat-value">
                  {totalRevenue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </p>
              </div>
            </div>
            
            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ color: 'var(--pink)' }}>
                <i className="fa-solid fa-building"></i>
              </div>
              <div className="stat-details">
                <h3>Acente Sayısı</h3>
                <p className="stat-value">{totalAgencies}</p>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ color: 'var(--muted)' }}>
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <div className="stat-details">
                <h3>İşlem Sayısı</h3>
                <p className="stat-value">{transactionCount}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <div className="panel-header">
              <h2><i className="fa-solid fa-list"></i> İşlem Geçmişi</h2>
            </div>
            <div className="panel-body">
              {data.reportData && data.reportData.length > 0 ? (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Acente</th>
                        <th>İşlem Tipi</th>
                        <th>Miktar</th>
                        <th>Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.reportData.map((item, index) => (
                        <tr key={index}>
                          <td>{item.AgencyName || '-'}</td>
                          <td>
                            <span className="badge" style={{ 
                              background: item.TransactionType?.toLowerCase().includes('gider') || item.TransactionType === 'Expense' ? 'rgba(255, 0, 128, 0.1)' : 'rgba(0, 191, 255, 0.1)',
                              color: item.TransactionType?.toLowerCase().includes('gider') || item.TransactionType === 'Expense' ? 'var(--pink)' : 'var(--blue)',
                              border: item.TransactionType?.toLowerCase().includes('gider') || item.TransactionType === 'Expense' ? '1px solid rgba(255, 0, 128, 0.2)' : '1px solid rgba(0, 191, 255, 0.2)'
                            }}>
                              {item.TransactionType || '-'}
                            </span>
                          </td>
                          <td style={{ fontWeight: '500' }}>
                            {parseFloat(item.Amount || 0).toLocaleString('tr-TR', { style: 'currency', currency: item.Currency || 'TRY' })}
                          </td>
                          <td>
                            {item.Date ? new Date(item.Date).toLocaleDateString('tr-TR') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                  <i className="fa-regular fa-folder-open fa-3x" style={{ marginBottom: '15px', color: 'var(--line)' }}></i>
                  <p>Gösterilecek rapor verisi bulunamadı.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Licenses;
