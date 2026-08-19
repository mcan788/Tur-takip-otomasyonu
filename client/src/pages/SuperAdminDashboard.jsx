import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Plus, Users, Key, Clock, Edit3, Trash2, Building, MapPin, Copy } from 'lucide-react';
import { Toast, ConfirmModal } from '../components/Notifications';
import api from '../services/api';

const SuperAdminDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }
  const [confirm, setConfirm] = useState(null); // { title, message, onConfirm }
  const [agencies, setAgencies] = useState([]); // Dinamik veriler için
  const [liveStats, setLiveStats] = useState({ officeCount: 0, tourCount: 0, staffCount: 0 }); // Canlı veriler için
  const [parentOffices, setParentOffices] = useState([]); // Yeni: Şube için ofis listesi
  const [formData, setFormData] = useState({
    agencyName: '',
    username: '',
    ownerName: '',
    ownerPhone: '',
    licenseMonths: '0.5',
    moduleType: 'TOUR',
    licensePrice: 0,
    isBranch: false,
    parentAgencyId: '',
    assignedOfficeId: ''
  });

  const fetchParentOffices = async (agencyId) => {
    if (!agencyId) {
      setParentOffices([]);
      return;
    }
    try {
      const res = await api.get(`/super-admin/agency-offices/${agencyId}`);
      setParentOffices(res.data);
    } catch (err) {
      console.error('Şubeler çekilemedi:', err);
      setParentOffices([]);
    }
  };
  
  const [formError, setFormError] = useState(null);

  const [renewData, setRenewData] = useState({
    licenseMonths: '1',
    licensePrice: 3000
  });

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const response = await api.get('/super-admin/agencies');
      const data = response.data;
      
      if (Array.isArray(data)) {
        setAgencies(data);
      } else {
        console.error('Beklenmeyen veri formatı:', data);
        setAgencies([]);
      }
    } catch (error) {
      console.error('Acenteler çekilemedi:', error);
      setAgencies([]);
    }
  };

  const fetchLiveStats = async (agency) => {
    if (!agency || !agency.AgencyID || agency.AgencyID === 'null') return;
    try {
      const statsRes = await api.get(`/agency/stats/${agency.AgencyID}`);
      if (statsRes.status === 200) {
        setLiveStats(statsRes.data.counts);
      }
    } catch (error) {
      console.error('Canlı veriler alınamadı:', error);
    }
  };

  const handleDurationChange = (months) => {
    const prices = {
      '0.5': 0,
      '1': 3000,
      '3': 7000,
      '6': 15000,
      '12': 30000
    };
    setFormData({
      ...formData, 
      licenseMonths: months, 
      licensePrice: prices[months] !== undefined ? prices[months] : ''
    });
  };

  const handleRenewDurationChange = (months) => {
    const prices = {
      '1': 3000,
      '3': 7000,
      '6': 15000,
      '12': 30000
    };
    setRenewData({
      licenseMonths: months,
      licensePrice: prices[months]
    });
  };

  const handleRenewLicense = async () => {
    try {
      const response = await api.post('/super-admin/renew-license', {
        agencyId: selectedAgency.AgencyID,
        months: renewData.licenseMonths,
        price: renewData.licensePrice
      });
      if (response.status === 200) {
        setToast({ message: 'Lisans başarıyla yenilendi. Yeni süre tanımlandı.', type: 'success' });
        setShowRenewModal(false);
        setShowDetailModal(false);
        fetchAgencies();
      }
    } catch (error) {
      setToast({ message: `Hata: ${error.response?.data?.error || 'Yenileme başarısız'}`, type: 'error' });
      console.error('Lisans yenilenemedi:', error);
    }
  };

  const handleCreateAgency = async (e) => {
    e.preventDefault();
    
    if (!formData.agencyName || !formData.username || !formData.ownerName || !formData.ownerPhone) {
      setFormError('Lütfen tüm zorunlu alanları (Acente Adı, Kullanıcı Adı, Yönetici, Telefon Numarası) doldurun.');
      return;
    }

    if (formData.isBranch && !formData.parentAgencyId) {
      setFormError('Lütfen şubenin bağlı olacağı ana acenteyi seçin.');
      return;
    }

    try {
      const url = isEditMode 
        ? '/super-admin/update-agency'
        : '/super-admin/create-agency';
      
      const body = isEditMode 
        ? { ...formData, agencyId: selectedAgency.AgencyID } 
        : formData;

      const response = isEditMode 
        ? await api.put(url, body)
        : await api.post(url, body);
      
      if (response.status === 200 || response.status === 201) {
        if (!isEditMode) {
          const data = response.data;
          setSuccessData({
            title: 'Acente Başarıyla Eklendi!',
            username: formData.username,
            password: data.generatedPassword,
            licenseKey: data.licenseKey
          });
        }
        setShowModal(false);
        setIsEditMode(false);
        setFormError(null);
        fetchAgencies();
        setFormData({
          agencyName: '', username: '', ownerName: '', ownerPhone: '', 
          licenseMonths: '0.5', moduleType: 'TOUR', licensePrice: 0,
          isBranch: false, parentAgencyId: '', assignedOfficeId: ''
        });
        setToast({ message: isEditMode ? 'Acente güncellendi.' : 'Acente başarıyla eklendi.', type: 'success' });
      }
    } catch (error) {
      setFormError(error.response?.data?.error || 'İşlem başarısız oldu. Lütfen bilgileri kontrol edin.');
    }
  };

  const handleDeleteAgency = async (id) => {
    setConfirm({
      title: 'Acenteyi Sil',
      message: 'Bu acenteyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      onConfirm: async () => {
        try {
          const response = await api.delete(`/super-admin/delete-agency/${id}`);
          if (response.status === 200) {
            fetchAgencies();
            setToast({ message: 'Acente silindi.', type: 'success' });
          }
        } catch (error) {
          setToast({ message: 'Silme hatası.', type: 'error' });
        }
        setConfirm(null);
      }
    });
  };

  const handleResetPassword = async (agency) => {
    setConfirm({
      title: 'Şifreyi Sıfırla',
      message: `${agency.AgencyName} acentesinin şifresini sıfırlamak istediğinize emin misiniz? Eski şifre geçersiz olacak ve acente ilk girişinde şifresini değiştirmeye zorlanacaktır.`,
      onConfirm: async () => {
        try {
          const response = await api.post('/super-admin/reset-password', { agencyId: agency.AgencyID });
          if (response.status === 200) {
            setSuccessData({
              title: 'Şifre Başarıyla Sıfırlandı!',
              username: agency.Username,
              password: response.data.newPassword,
              licenseKey: agency.LicenseKey || 'Mevcut Lisans'
            });
            setToast({ message: 'Şifre başarıyla sıfırlandı.', type: 'success' });
          }
        } catch (error) {
          setToast({ message: error.response?.data?.error || 'Şifre sıfırlanırken hata oluştu.', type: 'error' });
        }
        setConfirm(null);
      }
    });
  };

  const handleOpenAddModal = () => {
    setFormData({
      agencyName: '', username: '', ownerName: '', ownerPhone: '', 
      password: '', licenseMonths: '0.5', moduleType: 'TOUR', licensePrice: 0,
      isBranch: false, parentAgencyId: '', assignedOfficeId: ''
    });
    setIsEditMode(false);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (agency) => {
    setSelectedAgency(agency);
    setFormData({
      agencyName: agency.AgencyName,
      username: agency.Username,
      ownerName: agency.OwnerName,
      ownerPhone: agency.OwnerEmail || '',
      licenseMonths: '1',
      licensePrice: agency.LicensePrice,
      moduleType: agency.ModuleType,
      isBranch: agency.IsBranch || false,
      parentAgencyId: agency.ParentAgencyID || '',
      assignedOfficeId: agency.AssignedOfficeID || ''
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const stats = [
    { label: 'Toplam Acente', value: Array.isArray(agencies) ? agencies.length : 0, icon: <Users color="#38bdf8" />, color: '#38bdf8' },
    { label: 'Aktif Lisanslar', value: Array.isArray(agencies) ? agencies.filter(a => !a.isExpired).length : 0, icon: <Key color="#22c55e" />, color: '#22c55e' },
    { label: 'Yaklaşan Bitişler', value: Array.isArray(agencies) ? agencies.filter(a => a.isExpiringSoon).length : 0, icon: <Clock color="#facc15" />, color: '#facc15' },
  ];

  return (
    <div className="page-layout">
      <Sidebar type="super" />
      
      <main className="page-main">
        <header className="super-header responsive-flex-header">
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Acente Yönetimi</h1>
            <p style={{ color: 'var(--text-muted)' }}>Sistemdeki tüm acenteleri listeleyebilir, detaylarını inceleyebilir ve yeni lisanslar oluşturabilirsin.</p>
          </div>
          <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center' }}>
            <Plus size={20} style={{ marginRight: '8px' }} />
            Yeni Acente Ekle
          </button>
        </header>

        {/* Expiry Warning Alert */}
        {Array.isArray(agencies) && agencies.some(a => a.isExpiringSoon) && (
          <div className="glass" style={{ 
            padding: '15px 25px', 
            marginBottom: '30px', 
            borderLeft: '4px solid var(--error)',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(239, 68, 68, 0.05)'
          }}>
            <Clock size={20} color="var(--error)" style={{ marginRight: '15px' }} />
            <p style={{ color: 'var(--text-main)', fontSize: '14px' }}>
              <strong>Dikkat:</strong> Lisans süresi 2 haftadan az kalan acenteler bulunmaktadır.
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="responsive-grid-3 super-stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="glass card-hover" style={{ padding: '25px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: stat.color }}></div>
              <div className="responsive-flex-header">
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>{stat.label}</span>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>{stat.icon}</div>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800' }}>{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Agency Table */}
        <section className="glass" style={{ padding: '25px' }}>
          <div className="responsive-flex-header">
            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Aktif Acenteler</h2>
          </div>
          
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <th style={{ padding: '15px' }}>Acente / Yönetici</th>
                  <th style={{ padding: '15px' }}>Modül</th>
                  <th style={{ padding: '15px' }}>İstatistikler</th>
                  <th style={{ padding: '15px' }}>Katılma Tarihi</th>
                  <th style={{ padding: '15px' }}>Lisans Durumu</th>
                  <th style={{ padding: '15px' }}>Kalan Süre</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(agencies) && agencies.map((agency) => (
                  <tr key={agency.AgencyID} className="table-row-hover">
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{agency.AgencyName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{agency.OwnerName}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '8px', 
                        fontSize: '11px', 
                        fontWeight: '700',
                        background: agency.ModuleType === 'RENT' ? 'rgba(77, 121, 255, 0.12)' : 'rgba(255, 79, 216, 0.1)',
                        color: agency.ModuleType === 'RENT' ? '#4d79ff' : '#ff4fd8',
                        border: agency.ModuleType === 'RENT' ? '1px solid rgba(77, 121, 255, 0.2)' : '1px solid rgba(255, 79, 216, 0.2)'
                      }}>
                        {agency.ModuleType === 'RENT' ? 'Rent A Car' : 'Tur Takip'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '220px' }}>
                        <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 'bold', color: '#ff4fd8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           <span>Turlar:</span> <span>{agency.TourCount || 0}</span>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           <span>Personel:</span> <span>{agency.StaffCount || 0}</span>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 'bold', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           <span>Şube:</span> <span>{agency.BranchCount || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '15px', fontSize: '14px', color: 'var(--text-muted)' }}>
                      {new Date(agency.CreatedAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        color: agency.isExpired ? '#ef4444' : (agency.isExpiringSoon ? '#facc15' : '#10b981'),
                        fontSize: '13px',
                        fontWeight: '700'
                      }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: 'currentColor'
                        }}></div>
                        {agency.isExpired ? 'Süresi Doldu' : (agency.isExpiringSoon ? 'Yakında Bitiyor' : 'Aktif')}
                      </div>
                    </td>
                    <td style={{ padding: '15px', fontWeight: '700', fontSize: '14px' }}>
                      {agency.daysRemaining > 0 ? `${agency.daysRemaining} Gün` : 'Süre Bitti'}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button 
                          className="btn" 
                          onClick={() => { 
                            setSelectedAgency(agency); 
                            setShowDetailModal(true); 
                            fetchLiveStats(agency);
                          }}
                          style={{ 
                            padding: '8px 14px', 
                            fontSize: '12px', 
                            background: 'rgba(77, 121, 255, 0.1)', 
                            color: '#4d79ff', 
                            border: '1px solid rgba(77, 121, 255, 0.2)',
                            fontWeight: '700'
                          }}
                        >
                          Detaylar
                        </button>
                        <button 
                          className="btn" 
                          onClick={() => handleResetPassword(agency)}
                          style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', color: '#3b82f6' }}
                          title="Şifre Sıfırla"
                        >
                          <Key size={16} />
                        </button>
                        <button 
                          className="btn" 
                          onClick={() => openEditModal(agency)}
                          style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', color: '#facc15' }}
                          title="Düzenle"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          className="btn" 
                          onClick={() => handleDeleteAgency(agency.AgencyID)}
                          style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          </div>
        </section>

        {/* Add/Edit Agency Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '520px' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '25px', fontWeight: 'bold' }}>{isEditMode ? 'Acente Bilgilerini Güncelle' : 'Yeni Acente Tanımla'}</h2>
              
              {formError && <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>⚠️ {formError}</div>}

              <div style={{ display: 'grid', gap: '15px', marginBottom: '25px' }}>
                {!isEditMode && (
                  <div className="responsive-grid-2">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, isBranch: false})}
                      style={{ 
                        padding: '10px', borderRadius: '10px', border: 'none',
                        background: !formData.isBranch ? 'rgba(77, 121, 255, 0.15)' : 'transparent',
                        color: !formData.isBranch ? 'white' : 'var(--text-muted)',
                        fontWeight: '700', cursor: 'pointer', transition: '0.3s'
                      }}
                    >
                      Ana Ofis
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, isBranch: true})}
                      style={{ 
                        padding: '10px', borderRadius: '10px', border: 'none',
                        background: formData.isBranch ? 'rgba(77, 121, 255, 0.15)' : 'transparent',
                        color: formData.isBranch ? 'white' : 'var(--text-muted)',
                        fontWeight: '700', cursor: 'pointer', transition: '0.3s'
                      }}
                    >
                      Şube Girişi
                    </button>
                  </div>
                )}

                {formData.isBranch && !isEditMode && (
                  <div style={{ padding: '18px', background: 'rgba(77, 121, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(77, 121, 255, 0.15)', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '800', color: '#4d79ff', textTransform: 'uppercase' }}>Bağlı Olacağı Ana Acente</label>
                      <select 
                        value={formData.parentAgencyId} 
                        onChange={(e) => {
                          const id = e.target.value;
                          setFormData({...formData, parentAgencyId: id});
                        }}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--glass-border)', fontSize: '14px', marginBottom: 0 }}
                      >
                        <option value="">Seçiniz...</option>
                        {agencies.filter(a => !a.IsBranch).map(a => (
                          <option key={a.AgencyID} value={a.AgencyID}>{a.AgencyName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="responsive-grid-2">
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>{formData.isBranch ? 'Şube Açıklaması' : 'Acente Adı'} <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" placeholder="Melis TOUR" value={formData.agencyName} onChange={(e) => setFormData({...formData, agencyName: e.target.value})} required style={{ width: '100%', marginBottom: 0 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Kullanıcı Adı <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" placeholder="kullanici_adi" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} disabled={isEditMode} required style={{ width: '100%', marginBottom: 0, opacity: isEditMode ? 0.6 : 1 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Yönetici / Sorumlu <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" placeholder="Ad Soyad" value={formData.ownerName} onChange={(e) => setFormData({...formData, ownerName: e.target.value})} required style={{ width: '100%', marginBottom: 0 }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Telefon Numarası <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="tel" placeholder="05XX XXX XX XX" value={formData.ownerPhone} onChange={(e) => setFormData({...formData, ownerPhone: e.target.value})} required style={{ width: '100%', marginBottom: 0 }} />
                  </div>

                  {!formData.isBranch && (
                    <>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Hizmet Tipi</label>
                        <select value={formData.moduleType} onChange={(e) => setFormData({...formData, moduleType: e.target.value})} style={{ width: '100%', marginBottom: 0 }}>
                          <option value="TOUR">Tur Takip</option>
                          <option value="RENT">Rent A Car</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Süre</label>
                        <select value={formData.licenseMonths} onChange={(e) => handleDurationChange(e.target.value)} style={{ width: '100%', marginBottom: 0 }}>
                          <option value="0.5">15 Gün</option>
                          <option value="1">1 Ay - Standart Paket</option>
                          <option value="3">3 Ay - Avantajlı Paket</option>
                          <option value="6">6 Ay - Profesyonel Paket</option>
                          <option value="12">12 Ay - Yıllık Kurumsal</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="responsive-flex-row">
                <button className="btn btn-primary" onClick={handleCreateAgency} style={{ flex: 2 }}>{isEditMode ? 'Güncelle' : 'Kaydet'}</button>
                <button type="button" className="btn" onClick={() => { setShowModal(false); setIsEditMode(false); }} style={{ flex: 1, background: 'transparent' }}>İptal</button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {successData && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '460px', textAlign: 'center' }}>
              <div style={{ 
                width: '70px', height: '70px', background: 'rgba(16, 185, 129, 0.1)', 
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 20px', border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                <Key color="#10b981" size={32} />
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>{successData.title || 'İşlem Başarılı!'}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '30px' }}>Giriş bilgilerini kopyalayıp acente ile paylaşabilirsiniz.</p>
              
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', textAlign: 'left', marginBottom: '30px', border: '1px solid var(--border-color)' }}>
                <div style={{ marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Kullanıcı Adı</label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--text-main)' }}>{successData.username}</p>
                    <button onClick={() => { navigator.clipboard.writeText(successData.username); setToast({ message: 'Kullanıcı adı kopyalandı!', type: 'success' }); }} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Copy size={16} /></button>
                  </div>
                </div>
                
                <div style={{ marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Geçici Şifre</label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '22px', color: '#3b82f6', letterSpacing: '1px' }}>{successData.password}</p>
                    <button onClick={() => { navigator.clipboard.writeText(successData.password); setToast({ message: 'Şifre kopyalandı!', type: 'success' }); }} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer' }}><Copy size={16} /></button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Lisans Anahtarı</label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <code style={{ fontSize: '12px', color: 'var(--text-main)', fontFamily: 'monospace' }}>{successData.licenseKey}</code>
                    <button onClick={() => { navigator.clipboard.writeText(successData.licenseKey); setToast({ message: 'Lisans anahtarı kopyalandı!', type: 'success' }); }} style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Copy size={14} /></button>
                  </div>
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '16px' }} 
                onClick={() => setSuccessData(null)}
              >
                Tamam, Bilgileri Aldım
              </button>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedAgency && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '680px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedAgency.AgencyName} Detayları</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Acente ID: #{selectedAgency.AgencyID} | Kayıt: {new Date(selectedAgency.CreatedAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="btn">Kapat</button>
              </div>
              
              <div className="responsive-grid-2 super-detail-grid">
                <div style={{ padding: '18px', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Yönetici / Telefon</label>
                  <p style={{ fontWeight: 'bold', marginTop: '6px', fontSize: '15px' }}>{selectedAgency.OwnerName}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{selectedAgency.OwnerEmail}</p>
                </div>
                <div style={{ padding: '18px', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Lisans Durumu</label>
                  <p style={{ fontWeight: 'bold', marginTop: '6px', fontSize: '15px', color: '#10b981' }}>₺{selectedAgency.LicensePrice.toLocaleString('tr-TR')} / {new Date(selectedAgency.LicenseExpiryDate).toLocaleDateString('tr-TR')}</p>
                  <p style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold', marginTop: '2px' }}>Modül: {selectedAgency.ModuleType === 'RENT' ? 'Rent A Car' : 'Tur Takip'}</p>
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                 <label style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                    <div style={{ width: '12px', height: '2px', background: '#3b82f6' }}></div>
                    ACENTE CANLI VERİLERİ (ÖZET)
                 </label>
                 <div className="responsive-grid-3 super-live-grid">
                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                       <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 'bold' }}>Şube Sayısı</p>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                           {agencies.filter(a => a.ParentAgencyID === selectedAgency.AgencyID).length}
                        </p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                       <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 'bold' }}>Tanımlı Turlar</p>
                       <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4fd8' }}>{selectedAgency?.TourCount || 0}</p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                       <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 'bold' }}>Personel Sayısı</p>
                       <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{selectedAgency?.StaffCount || 0}</p>
                    </div>
                 </div>
              </div>

              {/* SİSTEM ŞUBE GİRİŞLERİ */}
              <div style={{ marginBottom: '30px' }}>
                 <label style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', fontWeight: 'bold' }}>
                    <Users size={14} color="#3b82f6" /> SİSTEM ŞUBE GİRİŞLERİ (ALT HESAPLAR)
                 </label>
                 <div style={{ display: 'grid', gap: '10px' }}>
                    {agencies.filter(a => a.ParentAgencyID === selectedAgency.AgencyID).length > 0 ? (
                      agencies.filter(a => a.ParentAgencyID === selectedAgency.AgencyID).map(branch => (
                        <div key={branch.AgencyID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                           <div>
                             <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '14px' }}>{branch.AgencyName}</span>
                             <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '12px' }}>Kullanıcı: @{branch.Username}</span>
                           </div>
                           <button 
                            onClick={() => handleDeleteAgency(branch.AgencyID)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', outline: 'none' }}
                            title="Hesabı Sil"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>Henüz sistem şube girişi tanımlanmamış.</div>
                    )}
                 </div>
              </div>

              <div style={{ marginTop: '35px', display: 'flex', gap: '15px' }} className="super-modal-actions">
                <button className="btn btn-primary" onClick={() => setShowRenewModal(true)} style={{ flex: 1 }}>Lisansı Yenile</button>
                <button className="btn" onClick={() => setShowDetailModal(false)} style={{ flex: 1, background: 'transparent' }}>Kapat</button>
              </div>
            </div>
          </div>
        )}

        {/* Renew License Modal */}
        {showRenewModal && selectedAgency && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '440px' }}>
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <div style={{ width: '60px', height: '60px', background: 'rgba(77, 121, 255, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', border: '1px solid rgba(77, 121, 255, 0.2)' }}>
                  <Clock color="#4d79ff" size={30} />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Lisans Yenileme</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  <strong>{selectedAgency.AgencyName}</strong> acentesi için yeni lisans periyodu belirleyin.
                </p>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Yeni Paket Seçimi</label>
                <select 
                  value={renewData.licenseMonths}
                  onChange={(e) => handleRenewDurationChange(e.target.value)}
                  style={{ width: '100%', marginBottom: 0 }}>
                  <option value="1">1 Ay - Standart Paket</option>
                  <option value="3">3 Ay - Avantajlı Paket</option>
                  <option value="6">6 Ay - Profesyonel Paket</option>
                  <option value="12">12 Ay - Yıllık Kurumsal</option>
                </select>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.15)', marginBottom: '30px', textAlign: 'center' }}>
                <label style={{ color: '#10b981', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Ödenecek Toplam Tutar</label>
                <p style={{ fontWeight: '900', fontSize: '28px', color: '#10b981' }}>₺{renewData.licensePrice.toLocaleString('tr-TR')}</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleRenewLicense(); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="btn btn-primary" style={{ padding: '16px' }}>Ödemeyi Onayla ve Lisansı Uzat</button>
                <button type="button" className="btn" onClick={() => setShowRenewModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none' }}>Vazgeç</button>
              </form>
            </div>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {confirm && (
          <ConfirmModal 
            title={confirm.title} 
            message={confirm.message} 
            onConfirm={confirm.onConfirm} 
            onCancel={() => setConfirm(null)} 
          />
        )}

        <style>{`
          @media (max-width: 1024px) {
            .super-stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 768px) {
            .super-stats-grid {
              grid-template-columns: 1fr !important;
            }
            .super-header {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 20px !important;
              text-align: center !important;
            }
            .super-header button {
              justify-content: center !important;
            }
            .super-detail-grid, .super-live-grid, .super-modal-actions {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
