import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Building, Plus, Trash2, MapPin, FileText, Tag, Calendar, Users, Shield } from 'lucide-react';
import { Toast } from '../components/Notifications';
import api from '../services/api';

const OfficeManagement = () => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ officeName: '', location: '' });

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    setLoading(true);
    try {
      const agencyId = localStorage.getItem('agencyId');
      console.log('Fetching offices for agency:', agencyId);
      const response = await api.get(`/agency/offices/${agencyId}`);
      console.log('API Response:', response.data);
      if (response.status === 200) {
        setOffices(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Ofisler yüklenemedi:', error);
      setToast({ message: 'Şubeler yüklenirken bir hata oluştu.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffice = async (e) => {
    e.preventDefault();
    if (!formData.officeName) return;

    try {
      const agencyId = localStorage.getItem('agencyId');
      const response = await api.post('/agency/office', { ...formData, agencyId });

      if (response.status === 200 || response.status === 201) {
        setToast({ message: 'Yeni şube başarıyla oluşturuldu ve acentenizle ilişkilendirildi.', type: 'success' });
        setShowModal(false);
        setFormData({ officeName: '', location: '' });
        fetchOffices(); // Listeyi anında tazele
      }
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Şube eklenirken bir hata oluştu.', type: 'error' });
    }
  };

  const handleDeleteOffice = async (id) => {
    if (!window.confirm('Bu şubeyi silmek istediğinize emin misiniz?')) return;
    try {
      const response = await api.delete(`/agency/office/${id}`);
      if (response.status === 200) {
        setToast({ message: 'Şube silindi.', type: 'success' });
        fetchOffices();
      }
    } catch (error) {
      setToast({ message: 'Silme hatası.', type: 'error' });
    }
  };

  const [selectedOffice, setSelectedOffice] = useState(null);
  const [officeDetails, setOfficeDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [showExtended, setShowExtended] = useState(false);

  const handleShowDetails = async (office) => {
    setSelectedOffice(office);
    setShowDetailsModal(true);
    setShowExtended(false); // Reset extended view
    setLoadingDetails(true);
    try {
      const response = await api.get(`/agency/office/${office.OfficeID}/details`);
      if (response.status === 200) {
        setOfficeDetails(response.data);
      }
    } catch (error) {
      console.error('Detaylar alınamadı:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="page-layout">
      <Sidebar type="agency" />
      
      <main className="page-main">

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: '600' }}>Veriler Hazırlanıyor...</p>
          </div>
        ) : (
          <div className="office-grid">
            {offices.length > 0 ? (
            offices.map((office) => (
              <div key={office.OfficeID} className="glass card-hover" style={{ 
                padding: '25px', 
                position: 'relative',
                border: office.isSystemBranch ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                background: office.isSystemBranch ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.03)'
              }}>
                {office.isSystemBranch && (
                  <div style={{ 
                    position: 'absolute', top: '15px', right: '15px', 
                    background: '#38bdf8', color: 'white', padding: '4px 10px', 
                    borderRadius: '20px', fontSize: '10px', fontWeight: '800',
                    letterSpacing: '0.5px'
                  }}>SİSTEM GİRİŞİ</div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ 
                    padding: '12px', 
                    background: office.isSystemBranch ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.1)', 
                    borderRadius: '12px' 
                  }}>
                    {office.isSystemBranch ? <Users color="#38bdf8" /> : <Building color="#38bdf8" />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{office.OfficeName}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {office.isSystemBranch ? <Shield size={12} /> : <MapPin size={12} />}
                      {office.isSystemBranch ? `Kullanıcı: ${office.Username}` : (office.Location || 'Konum Belirtilmedi')}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button 
                    className="btn" 
                    onClick={() => handleShowDetails(office)}
                    style={{ 
                      flex: 1, 
                      fontSize: '13px', 
                      fontWeight: '700',
                      background: office.isSystemBranch ? '#38bdf8' : 'rgba(56, 189, 248, 0.1)', 
                      color: office.isSystemBranch ? 'white' : 'var(--accent-color)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      padding: '12px'
                    }}
                  >
                    {office.isSystemBranch ? 'Hesap Detayları ve Performans' : 'Şube Performans Detayları'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.1)' }}>
               <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏢</div>
               <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Henüz Bir Şube Bulunmuyor</h3>
               <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
                 Adınıza tanımlanmış aktif bir şube kaydı bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.
               </p>
               <button onClick={fetchOffices} className="btn btn-primary" style={{ padding: '10px 30px' }}>Yenile</button>
            </div>
          )}
        </div>
        )}

        {/* Şube Detay Modal */}
        {showDetailsModal && selectedOffice && (
          <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div className="modal-content animate-in" style={{ width: '90%', maxWidth: '550px', background: 'white', padding: '35px', borderRadius: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)', position: 'relative' }}>
              <div className="responsive-flex-header">
                <div>
                  <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>{selectedOffice.OfficeName}</h2>
                  <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', fontWeight: '500' }}>Şube Performans ve İşlem Detayları</p>
                </div>
                <button 
                  onClick={() => setShowDetailsModal(false)} 
                  style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', transition: 'all 0.2s' }}
                >&times;</button>
              </div>

              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <div className="spinner" style={{ margin: '0 auto 15px' }}></div>
                  <p style={{ color: '#64748b', fontWeight: '700' }}>Veriler Hazırlanıyor...</p>
                </div>
              ) : (
                <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '5px' }} className="custom-scrollbar">
                  {/* İstatistik Özet Kartları */}
                  <div className="modal-stats-grid">
                    <div style={{ padding: '20px', background: '#eff6ff', borderRadius: '24px', border: '1px solid #dbeafe', textAlign: 'center' }}>
                      <p style={{ fontSize: '12px', color: '#1e40af', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Toplam Rezervasyon</p>
                      <h4 style={{ fontSize: '36px', fontWeight: '900', color: '#1d4ed8' }}>
                        {officeDetails?.stats?.reduce((acc, curr) => acc + (curr.TotalBookings || 0), 0) || 0}
                      </h4>
                    </div>
                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Konum</p>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#334155', lineHeight: '1.4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <MapPin size={16} color="#ef4444" />
                        {selectedOffice.Location || 'Konum Belirtilmedi'}
                      </h4>
                    </div>
                  </div>

                  {/* Finansal Kazanç */}
                  <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <div style={{ width: '4px', height: '20px', background: '#10b981', borderRadius: '2px' }}></div>
                     Finansal Kazanç Özeti
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                    {officeDetails?.stats?.length > 0 ? (
                      officeDetails.stats.map((stat, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', 
                          background: '#f0fdf4', borderRadius: '20px', border: '1px solid #dcfce7' 
                        }}>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#166534' }}>Toplam Ciro ({stat.Currency})</span>
                          <span style={{ color: '#15803d', fontWeight: '900', fontSize: '20px' }}>{stat.TotalEarnings?.toLocaleString()} {stat.Currency}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                        <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>Henüz bir kazanç kaydı bulunmuyor.</p>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setShowExtended(!showExtended)}
                    style={{ 
                      width: '100%', marginBottom: '20px', padding: '16px', borderRadius: '18px',
                      background: '#f1f5f9', color: '#475569', 
                      border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '14px', fontWeight: '800',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
                    }}
                  >
                    {showExtended ? 'Analiz Detaylarını Gizle' : 'Detaylı Analiz ve İşlemleri Gör'}
                    <span style={{ fontSize: '18px' }}>{showExtended ? '↑' : '↓'}</span>
                  </button>

                  {showExtended && (
                    <div className="animate-in" style={{ marginBottom: '25px', padding: '25px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '900', marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Tag size={18} color="#3b82f6" /> Tur Bazlı Performans
                      </h4>
                      <div style={{ display: 'grid', gap: '18px' }}>
                        {officeDetails?.tourStats?.map((ts, idx) => (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                              <span style={{ fontWeight: '700', color: '#334155' }}>{ts.TourName}</span>
                              <span style={{ fontWeight: '900', color: '#1d4ed8' }}>{ts.TotalRevenue?.toLocaleString()} {ts.Currency}</span>
                            </div>
                            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min((ts.TotalRevenue / 10000) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '4px' }}></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <h4 style={{ fontSize: '15px', fontWeight: '900', marginTop: '40px', marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calendar size={18} color="#3b82f6" /> Son İşlemler
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {officeDetails?.recentBookings?.map((rb, idx) => (
                          <div key={idx} style={{ padding: '15px', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div>
                              <p style={{ fontWeight: '800', color: '#334155', fontSize: '14px' }}>{rb.TourName}</p>
                              <p style={{ color: '#64748b', fontSize: '12px', marginTop: '2px', fontWeight: '500' }}>{rb.TouristName}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ color: '#16a34a', fontWeight: '900', fontSize: '15px' }}>{rb.Earnings} {rb.Currency}</p>
                              <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700' }}>{new Date(rb.BookingDate).toLocaleDateString('tr-TR')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gap: '12px' }}>
                    <button 
                      onClick={() => {
                        const officeId = selectedOffice.OfficeID;
                        const targetAgencyId = selectedOffice.isSystemBranch ? (selectedOffice.AgencyID || selectedOffice.OfficeID) : '';
                        window.open(`/agency/financial-details?officeId=${officeId}${targetAgencyId ? `&agencyId=${targetAgencyId}` : ''}`, '_blank');
                      }}
                      style={{ 
                        width: '100%', padding: '18px', borderRadius: '20px',
                        background: '#10b981', color: 'white', 
                        border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '800',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)', transition: 'all 0.2s'
                      }}
                    >
                      <FileText size={20} />
                      Mali Tabloyu Yeni Sekmede Aç
                    </button>

                    <button 
                      onClick={() => setShowDetailsModal(false)} 
                      style={{ 
                        width: '100%', padding: '16px', borderRadius: '20px',
                        background: 'white', color: '#64748b', 
                        border: '2px solid #f1f5f9', cursor: 'pointer', fontSize: '14px', fontWeight: '700', transition: 'all 0.2s'
                      }}
                    >
                      Kapat
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        <style>{`
          .office-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
          }
          .modal-stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }

          @media (max-width: 480px) {
            .office-grid {
              grid-template-columns: 1fr !important;
              gap: 15px !important;
            }
            .modal-stats-grid {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
            }
            .modal-content {
              padding: 20px !important;
              border-radius: 20px !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
};

export default OfficeManagement;
