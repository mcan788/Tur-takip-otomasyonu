import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Plus, UserPlus, Shield, Trash2, Key, Mail, User } from 'lucide-react';
import api from '../services/api';
import { Toast } from '../components/Notifications';

const PersonnelManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', username: '', password: '', role: 'PERSONEL', email: '', permissions: { view_tours: true, manage_tours: false, manage_bookings: false, view_reports: false, manage_personnel: false, manage_offices: false } });
  const [editingStaff, setEditingStaff] = useState(null);
  const [showResetModal, setShowResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const agencyId = localStorage.getItem('agencyId');
      const response = await api.get(`/agency/staff/${agencyId}`);
      if (response.status === 200) {
        setStaff(response.data);
      }
    } catch (error) {
      console.error('Personel listesi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!formData.fullName || !formData.username || !formData.password) {
      setToast({ message: 'Lütfen zorunlu alanları doldurun.', type: 'error' });
      return;
    }

    if (formData.password.length < 8) {
      setToast({ message: 'Lütfen en az 8 karakterli bir şifre girin.', type: 'error' });
      return;
    }

    try {
      const response = await api.post('/agency/staff', formData);
      if (response.status === 201 || response.status === 200) {
        setToast({ message: 'Personel başarıyla eklendi.', type: 'success' });
        setShowModal(false);
        setFormData({ fullName: '', username: '', password: '', role: 'PERSONEL', email: '', permissions: { view_tours: true, manage_tours: false, manage_bookings: false, view_reports: false, manage_personnel: false, manage_offices: false } });
        fetchStaff();
      }
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Personel eklenirken hata oluştu.', type: 'error' });
    }
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff.FullName || !editingStaff.Username) {
      setToast({ message: 'İsim ve kullanıcı adı zorunludur.', type: 'error' });
      return;
    }

    try {
      const response = await api.put(`/agency/staff/${editingStaff.StaffID}`, {
        fullName: editingStaff.FullName,
        username: editingStaff.Username,
        email: editingStaff.Email,
        role: editingStaff.Role,
        isActive: editingStaff.IsActive,
        permissions: editingStaff.Permissions
      });
      if (response.status === 200) {
        setToast({ message: 'Personel başarıyla güncellendi.', type: 'success' });
        setEditingStaff(null);
        fetchStaff();
      }
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Güncelleme hatası.', type: 'error' });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setToast({ message: 'Lütfen en az 8 karakterli bir şifre girin.', type: 'error' });
      return;
    }

    try {
      const response = await api.post(`/agency/staff/${showResetModal}/reset-password`, { newPassword });
      if (response.status === 200) {
        setToast({ message: 'Şifre başarıyla sıfırlandı.', type: 'success' });
        setShowResetModal(null);
        setNewPassword('');
      }
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Şifre sıfırlama hatası.', type: 'error' });
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/agency/staff/${id}`);
      if (response.status === 200) {
        setToast({ message: 'Personel başarıyla silindi.', type: 'success' });
        setShowDeleteConfirm(null);
        fetchStaff();
      }
    } catch (error) {
      setToast({ message: 'Silme işlemi başarısız.', type: 'error' });
    }
  };

  return (
    <div className="page-layout">
      <Sidebar type="agency" />
      <main className="page-main">
        <header className="personnel-header responsive-flex-header">
          <div>
            <h1 style={{ fontSize: '28px' }}>Personel Yönetimi</h1>
            <p style={{ color: 'var(--text-muted)' }}>Ekibinizi yönetin, roller atayın ve sisteme erişim izinlerini düzenleyin.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center' }}>
            <UserPlus size={20} style={{ marginRight: '8px' }} />
            Yeni Personel Ekle
          </button>
        </header>

        <div className="glass" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div className="table-responsive">
<table className="personnel-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '20px' }}>Personel Bilgisi</th>
                <th style={{ padding: '20px' }}>Kullanıcı Adı</th>
                <th style={{ padding: '20px' }}>Yetki Rolü</th>
                <th style={{ padding: '20px' }}>E-posta</th>
                <th style={{ padding: '20px', textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => (
                <tr key={person.StaffID} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td data-label="Personel Bilgisi" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px', fontWeight: 'bold' }}>
                        {person.FullName?.charAt(0) || '?'}
                      </div>
                      <span style={{ fontWeight: '600' }}>{person.FullName}</span>
                    </div>
                  </td>
                  <td data-label="Kullanıcı Adı" style={{ padding: '20px', color: 'var(--text-muted)' }}>@{person.Username}</td>
                  <td data-label="Yetki Rolü" style={{ padding: '20px' }}>
                    <span style={{ 
                      padding: '5px 12px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: '700',
                      background: person.Role === 'ADMIN' ? 'rgba(56, 189, 248, 0.1)' : person.Role === 'BRANCH_MANAGER' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                      color: person.Role === 'ADMIN' ? 'var(--accent-color)' : person.Role === 'BRANCH_MANAGER' ? '#f59e0b' : 'var(--text-muted)',
                      border: person.Role === 'ADMIN' ? '1px solid var(--accent-color)' : person.Role === 'BRANCH_MANAGER' ? '1px solid #f59e0b' : '1px solid var(--glass-border)'
                    }}>
                      {person.Role === 'BRANCH_MANAGER' ? 'Şube Yöneticisi' : person.Role === 'ADMIN' ? 'Acente Yöneticisi' : 'Personel'}
                    </span>
                  </td>
                  <td data-label="E-posta" style={{ padding: '20px', color: 'var(--text-muted)' }}>{person.Email}</td>
                  <td data-label="İşlemler" style={{ padding: '20px', textAlign: 'right' }}>
                    <button 
                      className="btn" 
                      onClick={() => {
                        setShowResetModal(person.StaffID);
                        setNewPassword('');
                      }}
                      style={{ padding: '8px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-color)', marginRight: '8px' }}
                      title="Şifre Sıfırla"
                    >
                      <Key size={16} />
                    </button>
                    <button 
                      className="btn" 
                      onClick={() => setEditingStaff(person)}
                      style={{ padding: '8px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', marginRight: '8px' }}
                      title="Düzenle"
                    >
                      <User size={16} />
                    </button>
                    <button 
                      className="btn" 
                      onClick={() => setShowDeleteConfirm(person.StaffID)} 
                      style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Henüz personel eklenmemiş.</td>
                </tr>
              )}
            </tbody>
          </table>
</div>
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {showModal && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div style={{ 
              padding: '40px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', borderRadius: '24px', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #f1f5f9'
            }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '25px', color: '#1e293b', fontWeight: '800' }}>Yeni Personel Kaydı</h2>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Ad Soyad</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                    <input 
                      type="text" 
                      style={{ padding: '12px 12px 12px 40px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '12px', width: '100%' }}
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="Ahmet Yılmaz" 
                    />
                  </div>
                </div>
 
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>E-posta</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                    <input 
                      type="email" 
                      style={{ padding: '12px 12px 12px 40px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '12px', width: '100%' }}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="ahmet@agency.com" 
                    />
                  </div>
                </div>
 
                <div className="responsive-grid-2">
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Kullanıcı Adı</label>
                    <input 
                      type="text" 
                      style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '12px', width: '100%' }}
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="ahmet_y" 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Yetki Rolü</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '12px' }}
                    >
                      <option value="PERSONEL">Personel</option>
                      <option value="BRANCH_MANAGER">Şube Yöneticisi</option>
                      <option value="ADMIN">Acente Yöneticisi</option>
                    </select>
                  </div>
                </div>

                {formData.role === 'PERSONEL' && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Yetki Matrisi</label>
                    <div className="responsive-grid-2">
                      {Object.entries({
                        view_tours: 'Turları Görebilir',
                        manage_tours: 'Turları Yönetebilir (Ekle/Sil)',
                        manage_bookings: 'Rezervasyonları Yönetebilir',
                        view_reports: 'Finansal Raporları Görebilir',
                        manage_personnel: 'Personel Yönetebilir',
                        manage_offices: 'Şubeleri Yönetebilir'
                      }).map(([key, label]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="checkbox" 
                            id={`add_perm_${key}`}
                            checked={formData.permissions[key] || false}
                            onChange={(e) => setFormData({...formData, permissions: {...formData.permissions, [key]: e.target.checked}})}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#38bdf8' }}
                          />
                          <label htmlFor={`add_perm_${key}`} style={{ fontSize: '13px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>{label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
 
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Şifre</label>
                  <div style={{ position: 'relative' }}>
                    <Shield size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                    <input 
                      type="password" 
                      style={{ padding: '12px 12px 12px 40px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '12px', width: '100%' }}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••" 
                    />
                  </div>
                </div>
 
                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <button className="btn btn-primary" onClick={handleAddStaff} style={{ flex: 1, padding: '15px', borderRadius: '12px', fontWeight: '700' }}>Personeli Kaydet</button>
                  <button className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', borderRadius: '12px', fontWeight: '700' }}>İptal</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Personel Düzenleme Modalı */}
        {editingStaff && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div style={{ 
              padding: '40px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', borderRadius: '24px', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #f1f5f9'
            }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '25px', color: '#1e293b', fontWeight: '800' }}>Personel Düzenle</h2>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Ad Soyad</label>
                  <input 
                    type="text" 
                    style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '12px', width: '100%' }}
                    value={editingStaff.FullName}
                    onChange={(e) => setEditingStaff({...editingStaff, FullName: e.target.value})}
                  />
                </div>
 
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>E-posta</label>
                  <input 
                    type="email" 
                    style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '12px', width: '100%' }}
                    value={editingStaff.Email}
                    onChange={(e) => setEditingStaff({...editingStaff, Email: e.target.value})}
                  />
                </div>
 
                <div className="responsive-grid-2">
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Kullanıcı Adı</label>
                    <input 
                      type="text" 
                      style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '12px', width: '100%' }}
                      value={editingStaff.Username}
                      onChange={(e) => setEditingStaff({...editingStaff, Username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Yetki Rolü</label>
                    <select 
                      value={editingStaff.Role}
                      onChange={(e) => setEditingStaff({...editingStaff, Role: e.target.value})}
                      style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '12px' }}
                    >
                      <option value="PERSONEL">Personel</option>
                      <option value="BRANCH_MANAGER">Şube Yöneticisi</option>
                      <option value="ADMIN">Acente Yöneticisi</option>
                    </select>
                  </div>
                </div>

                {editingStaff.Role === 'PERSONEL' && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Yetki Matrisi</label>
                    <div className="responsive-grid-2">
                      {Object.entries({
                        view_tours: 'Turları Görebilir',
                        manage_tours: 'Turları Yönetebilir (Ekle/Sil)',
                        manage_bookings: 'Rezervasyonları Yönetebilir',
                        view_reports: 'Finansal Raporları Görebilir',
                        manage_personnel: 'Personel Yönetebilir',
                        manage_offices: 'Şubeleri Yönetebilir'
                      }).map(([key, label]) => {
                        const isChecked = editingStaff.Permissions ? editingStaff.Permissions[key] : false;
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="checkbox" 
                              id={`edit_perm_${key}`}
                              checked={isChecked}
                              onChange={(e) => setEditingStaff({...editingStaff, Permissions: {...(editingStaff.Permissions || {}), [key]: e.target.checked}})}
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#38bdf8' }}
                            />
                            <label htmlFor={`edit_perm_${key}`} style={{ fontSize: '13px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>{label}</label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="isActive"
                    style={{ width: 'auto', marginBottom: 0 }}
                    checked={editingStaff.IsActive}
                    onChange={(e) => setEditingStaff({...editingStaff, IsActive: e.target.checked})}
                  />
                  <label htmlFor="isActive" style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>Hesap Aktif</label>
                </div>
 
                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <button className="btn btn-primary" onClick={handleUpdateStaff} style={{ flex: 1, padding: '15px', borderRadius: '12px', fontWeight: '700' }}>Güncelle</button>
                  <button className="btn" onClick={() => setEditingStaff(null)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', borderRadius: '12px', fontWeight: '700' }}>İptal</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Şifre Sıfırlama Modalı */}
        {showResetModal && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div style={{ 
              padding: '40px', width: '90%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', borderRadius: '24px', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #f1f5f9', textAlign: 'center'
            }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#1e293b', fontWeight: '800' }}>Şifre Sıfırla</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>Personel için yeni bir geçici şifre belirleyin.</p>
              
              <input 
                type="password" 
                placeholder="Yeni Şifre"
                style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '12px', width: '100%', marginBottom: '20px' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <div className="responsive-flex-row">
                <button className="btn btn-primary" onClick={handleResetPassword} style={{ flex: 1, padding: '15px', borderRadius: '12px', fontWeight: '700' }}>Sıfırla</button>
                <button className="btn" onClick={() => { setShowResetModal(null); setNewPassword(''); }} style={{ flex: 1, background: '#f1f5f9', color: '#475569', borderRadius: '12px', fontWeight: '700' }}>İptal</button>
              </div>
            </div>
          </div>
        )}

        {/* Silme Onay Modalı */}
        {showDeleteConfirm && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '20px'
          }}>
            <div className="glass" style={{ 
              padding: '40px', width: '90%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' 
              }}>
                <Trash2 size={30} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>Personeli Sil</h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '30px', lineHeight: '1.5' }}>
                Bu personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="responsive-flex-row">
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleDelete(showDeleteConfirm)}
                  style={{ flex: 1, background: '#ef4444', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: '700' }}
                >
                  Evet, Sil
                </button>
                <button 
                  className="btn" 
                  onClick={() => setShowDeleteConfirm(null)}
                  style={{ flex: 1, background: '#f1f5f9', color: '#475569', padding: '12px', borderRadius: '12px', fontWeight: '700' }}
                >
                  Hayır, Vazgeç
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .personnel-header {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 15px !important;
            }
            .personnel-header button {
              justify-content: center !important;
            }
            
            /* Responsive Table -> Card Layout */
            .personnel-table {
              min-width: 100% !important;
              display: block;
            }
            .personnel-table thead {
              display: none;
            }
            .personnel-table tbody {
              display: block;
              width: 100%;
            }
            .personnel-table tr {
              display: flex;
              flex-direction: column;
              background: #ffffff;
              margin-bottom: 15px;
              border-radius: 12px;
              border: 1px solid var(--glass-border);
              padding: 15px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.02);
            }
            .personnel-table td {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0 !important;
              border-bottom: 1px solid #f1f5f9;
              text-align: right;
            }
            .personnel-table td:last-child {
              border-bottom: none;
              justify-content: flex-end;
              gap: 10px;
            }
            /* Add labels before td content */
            .personnel-table td::before {
              content: attr(data-label);
              font-weight: 700;
              color: var(--text-muted);
              font-size: 12px;
              text-transform: uppercase;
              text-align: left;
            }
            .personnel-table td > div {
              text-align: right;
            }
          }
        `}</style>
      </main>
    </div>
  );
};

export default PersonnelManagement;
