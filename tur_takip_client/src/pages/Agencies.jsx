import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

function Agencies() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  const [formData, setFormData] = useState({});
  const [toastMessage, setToastMessage] = useState('');

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSuperAdminAgencies();
      setAgencies(data);
    } catch (err) {
      setError(err.message || 'Acenteler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleCreateAgency = async (e) => {
    e.preventDefault();
    try {
      await apiService.createAgency(formData);
      showToast('Acente başarıyla eklendi');
      setShowAddModal(false);
      fetchAgencies();
    } catch (err) {
      alert(err.message || 'Ekleme başarısız');
    }
  };

  const handleRenewLicense = async (e) => {
    e.preventDefault();
    try {
      await apiService.renewAgencyLicense({
        AgencyID: selectedAgency.AgencyID,
        ...formData
      });
      showToast('Lisans başarıyla yenilendi');
      setShowRenewModal(false);
      fetchAgencies();
    } catch (err) {
      alert(err.message || 'Yenileme başarısız');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await apiService.resetAgencyPassword({
        AgencyID: selectedAgency.AgencyID,
        ...formData
      });
      showToast('Şifre başarıyla sıfırlandı');
      setShowPasswordModal(false);
    } catch (err) {
      alert(err.message || 'Şifre sıfırlama başarısız');
    }
  };

  const handleDelete = async (agencyId) => {
    if (window.confirm('Bu acenteyi silmek istediğinize emin misiniz?')) {
      try {
        if (apiService.deleteAgency) {
          await apiService.deleteAgency(agencyId);
        }
        showToast('Acente başarıyla silindi');
        fetchAgencies();
      } catch (err) {
        alert(err.message || 'Silme başarısız');
      }
    }
  };

  const openStatsModal = async (agency) => {
    setSelectedAgency(agency);
    setShowStatsModal(true);
    setStatsLoading(true);
    try {
      const data = await apiService.getStats(agency.AgencyID);
      setStats(data);
    } catch (err) {
      alert('İstatistikler alınamadı: ' + err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const openRenewModal = (agency) => {
    setSelectedAgency(agency);
    setFormData({ ExpiryDate: '' });
    setShowRenewModal(true);
  };

  const openPasswordModal = (agency) => {
    setSelectedAgency(agency);
    setFormData({ NewPassword: '' });
    setShowPasswordModal(true);
  };

  const getLicenseStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'Bilinmiyor', color: '#6c757d' }; // Gray
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Süresi Doldu', color: '#ff4444' }; // Red
    if (diffDays <= 7) return { label: 'Yakında Bitiyor', color: '#ffbb33' }; // Yellow
    return { label: 'Aktif', color: '#00C851' }; // Green
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  return (
    <div className="agencies-page fade-in" style={{ padding: '20px' }}>
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', 
          backgroundColor: 'var(--blue, #0d6efd)', color: 'white', 
          padding: '10px 20px', borderRadius: '5px', zIndex: 9999
        }}>
          {toastMessage}
        </div>
      )}

      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="section-title" style={{ margin: 0, color: 'var(--text)' }}>Acenteler</h1>
        <button className="btn-primary" onClick={() => {
          setFormData({});
          setShowAddModal(true);
        }}>
          <i className="fa-solid fa-plus"></i> Yeni Acente
        </button>
      </div>

      <div className="glass-panel">
        <div className="panel-header" style={{ padding: '15px 20px', borderBottom: '1px solid var(--line)' }}>
          <h2 style={{ margin: 0, color: 'var(--text)' }}>Acente Listesi</h2>
        </div>
        <div className="panel-body" style={{ padding: '20px' }}>
          {loading ? (
            <p style={{ color: 'var(--text)' }}>Yükleniyor...</p>
          ) : error ? (
            <p style={{ color: '#ff4444' }}>{error}</p>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Acente Adı</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Yetkili</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Telefon</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Lisans Bitiş</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Modül</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Durum</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {agencies.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>Kayıtlı acente bulunamadı.</td>
                    </tr>
                  ) : (
                    agencies.map(agency => {
                      const status = getLicenseStatus(agency.LicenseExpiryDate || agency.ExpiryDate);
                      return (
                        <tr key={agency.AgencyID} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '10px' }}>{agency.AgencyName || agency.Name}</td>
                          <td style={{ padding: '10px' }}>{agency.ContactPerson || agency.ContactName}</td>
                          <td style={{ padding: '10px' }}>{agency.Phone}</td>
                          <td style={{ padding: '10px' }}>{formatDate(agency.LicenseExpiryDate || agency.ExpiryDate)}</td>
                          <td style={{ padding: '10px' }}>{agency.Module || 'Standart'}</td>
                          <td style={{ padding: '10px' }}>
                            <span className="badge" style={{ backgroundColor: status.color, color: 'white', padding: '5px 10px', borderRadius: '15px', fontSize: '0.85em' }}>
                              {status.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <div className="action-buttons" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn-icon" 
                                title="Canlı Durum"
                                onClick={() => openStatsModal(agency)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--blue)' }}
                              >
                                <i className="fa-solid fa-chart-line"></i>
                              </button>
                              <button 
                                className="btn-icon" 
                                title="Lisans Yenile"
                                onClick={() => openRenewModal(agency)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#00C851' }}
                              >
                                <i className="fa-solid fa-calendar-check"></i>
                              </button>
                              <button 
                                className="btn-icon" 
                                title="Şifre"
                                onClick={() => openPasswordModal(agency)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffbb33' }}
                              >
                                <i className="fa-solid fa-key"></i>
                              </button>
                              <button 
                                className="btn-icon" 
                                title="Sil"
                                onClick={() => handleDelete(agency.AgencyID)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff4444' }}
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content glass-panel" style={{ width: '400px', maxWidth: '90%', backgroundColor: 'var(--panel)' }}>
            <div className="modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text)' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Yeni Acente Ekle</h2>
              <button className="btn-icon" onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <form onSubmit={handleCreateAgency}>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text)' }}>Acente Adı</label>
                  <input 
                    type="text" 
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                    onChange={e => setFormData({...formData, AgencyName: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text)' }}>Yetkili</label>
                  <input 
                    type="text" 
                    className="form-control"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                    onChange={e => setFormData({...formData, ContactPerson: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text)' }}>Telefon</label>
                  <input 
                    type="text" 
                    className="form-control"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                    onChange={e => setFormData({...formData, Phone: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text)' }}>Kullanıcı Adı</label>
                  <input 
                    type="text" 
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                    onChange={e => setFormData({...formData, Username: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text)' }}>Şifre</label>
                  <input 
                    type="password" 
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                    onChange={e => setFormData({...formData, Password: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text)' }}>Lisans Bitiş Tarihi</label>
                  <input 
                    type="date" 
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                    onChange={e => setFormData({...formData, ExpiryDate: e.target.value})}
                  />
                </div>
                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn-secondary" style={{ padding: '8px 15px', borderRadius: '4px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>İptal</button>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', background: 'var(--blue)', color: 'white', cursor: 'pointer' }}>Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content glass-panel" style={{ width: '600px', maxWidth: '90%', backgroundColor: 'var(--panel)' }}>
            <div className="modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text)' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedAgency?.AgencyName || selectedAgency?.Name} - Canlı Durum</h2>
              <button className="btn-icon" onClick={() => setShowStatsModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              {statsLoading ? (
                <p style={{ color: 'var(--text)' }}>İstatistikler yükleniyor...</p>
              ) : stats ? (
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  <div className="stat-card glass-panel" style={{ padding: '15px', textAlign: 'center', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--text)' }}>Araç Sayısı</h3>
                    <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--blue)' }}>{stats.TotalVehicles || 0}</div>
                  </div>
                  <div className="stat-card glass-panel" style={{ padding: '15px', textAlign: 'center', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--text)' }}>Aktif Turlar</h3>
                    <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00C851' }}>{stats.ActiveTours || 0}</div>
                  </div>
                  <div className="stat-card glass-panel" style={{ padding: '15px', textAlign: 'center', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--text)' }}>Personel Sayısı</h3>
                    <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffbb33' }}>{stats.TotalStaff || 0}</div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text)' }}>Veri bulunamadı.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content glass-panel" style={{ width: '400px', maxWidth: '90%', backgroundColor: 'var(--panel)' }}>
            <div className="modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text)' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Lisans Yenile</h2>
              <button className="btn-icon" onClick={() => setShowRenewModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <form onSubmit={handleRenewLicense}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text)' }}>Yeni Bitiş Tarihi</label>
                  <input 
                    type="date" 
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                    onChange={e => setFormData({...formData, ExpiryDate: e.target.value})}
                  />
                </div>
                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn-secondary" style={{ padding: '8px 15px', borderRadius: '4px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }} onClick={() => setShowRenewModal(false)}>İptal</button>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', background: 'var(--blue)', color: 'white', cursor: 'pointer' }}>Yenile</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content glass-panel" style={{ width: '400px', maxWidth: '90%', backgroundColor: 'var(--panel)' }}>
            <div className="modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text)' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Şifre Sıfırla</h2>
              <button className="btn-icon" onClick={() => setShowPasswordModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <form onSubmit={handleResetPassword}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text)' }}>Yeni Şifre</label>
                  <input 
                    type="password" 
                    className="form-control"
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                    onChange={e => setFormData({...formData, NewPassword: e.target.value})}
                  />
                </div>
                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn-secondary" style={{ padding: '8px 15px', borderRadius: '4px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }} onClick={() => setShowPasswordModal(false)}>İptal</button>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', background: 'var(--blue)', color: 'white', cursor: 'pointer' }}>Sıfırla</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Agencies;
