import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useToast } from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';

const Staff = () => {
  const toast = useToast();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Staff Modal state (Create / Edit)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null); // null = Create mode, object = Edit mode
  const [staffFormData, setStaffFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    role: 'PERSONEL',
    password: '',
    isActive: true,
  });
  const [staffFormError, setStaffFormError] = useState('');
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // Password Reset Modal state
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetStaffTarget, setResetStaffTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  // Delete Confirm Dialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getStaff();
      setStaffList(Array.isArray(data) ? data : []);
    } catch (err) {
      const errMsg = err.message || 'Personel listesi alınamadı.';
      setError(errMsg);
      if (toast?.error) toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    setEditingStaff(null);
    setStaffFormData({
      fullName: '',
      username: '',
      email: '',
      role: 'PERSONEL',
      password: '',
      isActive: true,
    });
    setStaffFormError('');
    setIsStaffModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (staff) => {
    setEditingStaff(staff);
    setStaffFormData({
      fullName: staff.FullName || '',
      username: staff.Username || '',
      email: staff.Email || '',
      role: staff.Role || 'PERSONEL',
      password: '',
      isActive: staff.IsActive !== false,
    });
    setStaffFormError('');
    setIsStaffModalOpen(true);
  };

  // Submit staff form (Create / Edit)
  const handleStaffFormSubmit = async (e) => {
    e.preventDefault();
    setStaffFormError('');

    if (!staffFormData.fullName.trim()) {
      setStaffFormError('Ad Soyad alanı zorunludur.');
      return;
    }
    if (!staffFormData.username.trim()) {
      setStaffFormError('Kullanıcı Adı alanı zorunludur.');
      return;
    }
    if (!editingStaff) {
      if (!staffFormData.password) {
        setStaffFormError('Şifre alanı zorunludur.');
        return;
      }
      if (staffFormData.password.length < 8) {
        setStaffFormError('Şifre en az 8 karakter olmalıdır.');
        return;
      }
    }

    try {
      setSubmittingStaff(true);
      if (editingStaff) {
        // Update
        const payload = {
          fullName: staffFormData.fullName.trim(),
          username: staffFormData.username.trim(),
          email: staffFormData.email.trim(),
          role: staffFormData.role,
          isActive: staffFormData.isActive,
        };
        await apiService.updateStaff(editingStaff.StaffID, payload);
        if (toast?.success) toast.success('Personel bilgileri güncellendi.');
      } else {
        // Create
        const payload = {
          fullName: staffFormData.fullName.trim(),
          username: staffFormData.username.trim(),
          email: staffFormData.email.trim(),
          role: staffFormData.role,
          password: staffFormData.password,
        };
        await apiService.createStaff(payload);
        if (toast?.success) toast.success('Yeni personel başarıyla eklendi.');
      }
      setIsStaffModalOpen(false);
      fetchStaff();
    } catch (err) {
      const msg = err.message || 'İşlem gerçekleştirilemedi.';
      setStaffFormError(msg);
      if (toast?.error) toast.error(msg);
    } finally {
      setSubmittingStaff(false);
    }
  };

  // Open reset password modal
  const handleOpenResetPasswordModal = (staff) => {
    setResetStaffTarget(staff);
    setNewPassword('');
    setResetPasswordError('');
    setIsResetPasswordModalOpen(true);
  };

  // Submit password reset
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetPasswordError('');

    if (!newPassword) {
      setResetPasswordError('Yeni şifre alanı zorunludur.');
      return;
    }
    if (newPassword.length < 8) {
      setResetPasswordError('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    try {
      setSubmittingReset(true);
      await apiService.resetStaffPassword(resetStaffTarget.StaffID, newPassword);
      if (toast?.success) toast.success(`${resetStaffTarget.FullName} kullanıcısının şifresi başarıyla sıfırlandı.`);
      setIsResetPasswordModalOpen(false);
    } catch (err) {
      const msg = err.message || 'Şifre sıfırlanamadı.';
      setResetPasswordError(msg);
      if (toast?.error) toast.error(msg);
    } finally {
      setSubmittingReset(false);
    }
  };

  // Delete flow
  const handleOpenDeleteConfirm = (staff) => {
    setDeletingStaff(staff);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingStaff) return;
    try {
      await apiService.deleteStaff(deletingStaff.StaffID);
      if (toast?.success) toast.success('Personel silindi.');
      setIsConfirmOpen(false);
      setDeletingStaff(null);
      fetchStaff();
    } catch (err) {
      const msg = err.message || 'Personel silinemedi.';
      if (toast?.error) toast.error(msg);
    }
  };

  // Filtered staff list
  const filteredStaff = staffList.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.FullName && item.FullName.toLowerCase().includes(term)) ||
      (item.Username && item.Username.toLowerCase().includes(term)) ||
      (item.Email && item.Email.toLowerCase().includes(term)) ||
      (item.Role && item.Role.toLowerCase().includes(term))
    );
  });

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-danger';
      case 'BRANCH_MANAGER':
        return 'badge-warning';
      case 'REHBER':
      case 'GUIDE':
        return 'badge-success';
      case 'ŞOFÖR':
      case 'DRIVER':
        return 'badge-info';
      case 'MUHASEBE':
        return 'badge-primary';
      default:
        return 'badge-primary';
    }
  };

  return (
    <div className="staff-page">
      {/* Section Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="section-title">Personel Yönetimi</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Sistem personelini, rollerini ve erişim durumlarını yönetin.
          </p>
        </div>
        <div className="section-actions">
          <button className="btn-primary" onClick={handleOpenCreateModal}>
            <i className="fa-solid fa-plus"></i> Yeni Personel
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444' }}>
          <span>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
            {error}
          </span>
          <button className="btn-primary" onClick={fetchStaff} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            <i className="fa-solid fa-rotate-right"></i> Tekrar Dene
          </button>
        </div>
      )}

      {/* Staff List Glass Panel */}
      <div className="glass-panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Personel Listesi</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '0.85rem' }}></i>
              <input
                type="text"
                placeholder="Personel ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        <div className="panel-body">
          {loading ? (
            <div className="loading-spinner" style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Personel listesi yükleniyor...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
              <i className="fa-solid fa-user-slash" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
              <p style={{ fontSize: '1rem', fontWeight: 500 }}>
                {searchTerm ? 'Arama kriterlerine uygun personel bulunamadı.' : 'Henüz personel kaydı bulunmuyor.'}
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>Kullanıcı Adı</th>
                  <th>E-posta</th>
                  <th>Rol</th>
                  <th>Durum</th>
                  <th style={{ textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr key={staff.StaffID}>
                    <td style={{ fontWeight: 600 }}>{staff.FullName}</td>
                    <td>@{staff.Username}</td>
                    <td>{staff.Email || '-'}</td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(staff.Role)}`}>
                        {staff.Role || 'PERSONEL'}
                      </span>
                    </td>
                    <td>
                      {staff.IsActive ? (
                        <span className="badge badge-success">Aktif</span>
                      ) : (
                        <span className="badge badge-danger">Pasif</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-icon"
                          title="Düzenle"
                          onClick={() => handleOpenEditModal(staff)}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          className="btn-icon"
                          title="Şifre Sıfırla"
                          onClick={() => handleOpenResetPasswordModal(staff)}
                          style={{ color: 'var(--blue)' }}
                        >
                          <i className="fa-solid fa-key"></i>
                        </button>
                        <button
                          className="btn-icon"
                          title="Sil"
                          onClick={() => handleOpenDeleteConfirm(staff)}
                          style={{ color: 'var(--pink)' }}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Staff Modal (Create / Edit) */}
      {isStaffModalOpen && (
        <div className="modal-overlay" onClick={() => setIsStaffModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingStaff ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
              </h3>
              <button className="modal-close" onClick={() => setIsStaffModalOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleStaffFormSubmit}>
              <div className="modal-body">
                {staffFormError && (
                  <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '6px' }}></i>
                    {staffFormError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Ad Soyad *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Örn: Ahmet Yılmaz"
                    value={staffFormData.fullName}
                    onChange={(e) => setStaffFormData({ ...staffFormData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kullanıcı Adı *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Örn: ahmetyilmaz"
                    value={staffFormData.username}
                    onChange={(e) => setStaffFormData({ ...staffFormData, username: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">E-posta</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Örn: ahmet@acente.com"
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select
                    className="form-select"
                    value={staffFormData.role}
                    onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })}
                  >
                    <option value="PERSONEL">PERSONEL</option>
                    <option value="REHBER">REHBER</option>
                    <option value="ŞOFÖR">ŞOFÖR</option>
                    <option value="MUHASEBE">MUHASEBE</option>
                    <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
                  </select>
                </div>

                {!editingStaff && (
                  <div className="form-group">
                    <label className="form-label">Şifre * (En az 8 karakter)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={staffFormData.password}
                      onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>
                )}

                {editingStaff && (
                  <div className="form-group">
                    <label className="form-label">Durum</label>
                    <select
                      className="form-select"
                      value={staffFormData.isActive ? 'true' : 'false'}
                      onChange={(e) => setStaffFormData({ ...staffFormData, isActive: e.target.value === 'true' })}
                    >
                      <option value="true">Aktif</option>
                      <option value="false">Pasif</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsStaffModalOpen(false)}
                  disabled={submittingStaff}
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary" disabled={submittingStaff}>
                  {submittingStaff ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...
                    </>
                  ) : editingStaff ? (
                    'Güncelle'
                  ) : (
                    'Ekle'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {isResetPasswordModalOpen && (
        <div className="modal-overlay" onClick={() => setIsResetPasswordModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Şifre Sıfırla</h3>
              <button className="modal-close" onClick={() => setIsResetPasswordModalOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="modal-body">
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  <strong style={{ color: 'var(--text)' }}>{resetStaffTarget?.FullName}</strong> personeli için yeni bir şifre belirleyin.
                </p>

                {resetPasswordError && (
                  <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '6px' }}></i>
                    {resetPasswordError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Yeni Şifre * (En az 8 karakter)</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  disabled={submittingReset}
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary" disabled={submittingReset}>
                  {submittingReset ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...
                    </>
                  ) : (
                    'Şifreyi Sıfırla'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Personel Sil"
        message={`"${deletingStaff?.FullName || 'Bu personel'}" adlı personeli silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setDeletingStaff(null);
        }}
      />
    </div>
  );
};

export default Staff;
