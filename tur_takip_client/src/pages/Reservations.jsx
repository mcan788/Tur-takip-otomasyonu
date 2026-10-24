import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useToast } from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';
import DataTable from '../components/common/DataTable';

const Reservations = () => {
  const toast = useToast();

  // Helper function to show toast messages safely
  const showToast = (type, message) => {
    if (toast && typeof toast[type] === 'function') {
      toast[type](message);
    } else {
      if (type === 'error') {
        console.error(message);
      } else {
        console.log(message);
      }
    }
  };

  // State
  const [tours, setTours] = useState([]);
  const [selectedTourId, setSelectedTourId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    TouristName: '',
    HotelName: '',
    AdultCount: 1,
    ChildCount: 0,
    VehicleCount: 1,
    Earnings: 0,
    ActualPassFee: 0,
    Currency: '₺'
  });

  // ConfirmDialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [bookingToApprove, setBookingToApprove] = useState(null);
  const [approving, setApproving] = useState(false);

  // Fetch all tours on mount
  useEffect(() => {
    fetchTours();
  }, []);

  // Fetch bookings when selected tour changes
  useEffect(() => {
    if (selectedTourId) {
      fetchBookings(selectedTourId);
    } else {
      setBookings([]);
    }
  }, [selectedTourId]);

  const fetchTours = async () => {
    try {
      setLoadingTours(true);
      setError(null);
      const data = await apiService.getTours();
      const tourList = Array.isArray(data) ? data : [];
      setTours(tourList);
      if (tourList.length > 0) {
        setSelectedTourId(tourList[0].TourID.toString());
      }
    } catch (err) {
      const errMsg = err.message || 'Turlar yüklenirken bir hata oluştu.';
      setError(errMsg);
      showToast('error', errMsg);
    } finally {
      setLoadingTours(false);
    }
  };

  const fetchBookings = async (tourId) => {
    try {
      setLoadingBookings(true);
      setError(null);
      const data = await apiService.getTourBookings(tourId);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      const errMsg = err.message || 'Rezervasyonlar yüklenirken bir hata oluştu.';
      setError(errMsg);
      showToast('error', errMsg);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Helper to extract assignedOfficeId from logged-in user
  const getUserOfficeId = () => {
    try {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) return null;
      const parsed = JSON.parse(savedUser);
      return parsed.assignedOfficeId || parsed.OfficeID || parsed.officeId || null;
    } catch (e) {
      return null;
    }
  };

  // Open modal for creating new booking
  const handleOpenAddModal = () => {
    if (!selectedTourId) {
      showToast('error', 'Lütfen önce bir tur seçiniz.');
      return;
    }
    setFormData({
      TouristName: '',
      HotelName: '',
      AdultCount: 1,
      ChildCount: 0,
      VehicleCount: 1,
      Earnings: 0,
      ActualPassFee: 0,
      Currency: '₺'
    });
    setIsModalOpen(true);
  };

  // Handle form submission for creating a booking
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!formData.TouristName.trim()) {
      showToast('error', 'Turist adı gereklidir.');
      return;
    }
    if (!selectedTourId) {
      showToast('error', 'Lütfen bir tur seçiniz.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        TourID: Number(selectedTourId),
        OfficeID: getUserOfficeId(),
        TouristName: formData.TouristName.trim(),
        HotelName: formData.HotelName ? formData.HotelName.trim() : '',
        AdultCount: Number(formData.AdultCount) || 0,
        ChildCount: Number(formData.ChildCount) || 0,
        VehicleCount: Number(formData.VehicleCount) || 0,
        Earnings: Number(formData.Earnings) || 0,
        ActualPassFee: Number(formData.ActualPassFee) || 0,
        Currency: formData.Currency || '₺'
      };

      await apiService.createBooking(payload);
      showToast('success', 'Rezervasyon başarıyla oluşturuldu.');
      setIsModalOpen(false);
      fetchBookings(selectedTourId);
    } catch (err) {
      showToast('error', err.message || 'Rezervasyon oluşturulurken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open confirm dialog for approving booking
  const handlePromptApprove = (booking) => {
    setBookingToApprove(booking);
    setIsConfirmOpen(true);
  };

  // Approve booking request
  const handleConfirmApprove = async () => {
    if (!bookingToApprove) return;
    try {
      setApproving(true);
      await apiService.approveBooking(bookingToApprove.BookingID);
      showToast('success', 'Rezervasyon başarıyla onaylandı.');
      setIsConfirmOpen(false);
      setBookingToApprove(null);
      fetchBookings(selectedTourId);
    } catch (err) {
      showToast('error', err.message || 'Rezervasyon onaylanırken bir hata oluştu.');
    } finally {
      setApproving(false);
    }
  };

  // Format currency helper
  const formatCurrency = (val, currencySymbol = '₺') => {
    if (val === null || val === undefined || val === '' || isNaN(val)) {
      return `0,00 ${currencySymbol}`;
    }
    return `${Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`;
  };

  // Columns definition for DataTable
  const columns = [
    {
      key: 'TouristName',
      label: 'Turist Adı',
      render: (val) => val || '-'
    },
    {
      key: 'HotelName',
      label: 'Otel',
      render: (val) => val || '-'
    },
    {
      key: 'AdultCount',
      label: 'Yetişkin',
      render: (val) => val ?? 0
    },
    {
      key: 'ChildCount',
      label: 'Çocuk',
      render: (val) => val ?? 0
    },
    {
      key: 'Earnings',
      label: 'Kazanç',
      render: (val, row) => formatCurrency(val, row.Currency || '₺')
    },
    {
      key: 'ActualPassFee',
      label: 'Tahsilat',
      render: (val, row) => formatCurrency(val, row.Currency || '₺')
    },
    {
      key: 'IsApproved',
      label: 'Durum',
      render: (val) => {
        const approved = Boolean(val);
        return (
          <span className={`badge ${approved ? 'badge-success' : 'badge-warning'}`}>
            {approved ? 'Onaylı' : 'Bekliyor'}
          </span>
        );
      }
    }
  ];

  // Actions column renderer
  const renderActions = (row) => {
    const isApproved = Boolean(row.IsApproved);
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {!isApproved && (
          <button
            className="btn-icon"
            title="Onayla"
            style={{ color: '#22c55e' }}
            onClick={() => handlePromptApprove(row)}
          >
            <i className="fa-solid fa-check"></i>
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

      {/* 1. Tour Selector Dropdown */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
              Tur Seçimi
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Rezervasyonlarını listelemek istediğiniz turu seçin.
            </p>
          </div>
          <div style={{ minWidth: '260px', flex: '0 1 320px' }}>
            <select
              className="form-select"
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(e.target.value)}
              disabled={loadingTours}
            >
              {loadingTours ? (
                <option value="">Turlar Yükleniyor...</option>
              ) : tours.length === 0 ? (
                <option value="">Kayıtlı Tur Bulunamadı</option>
              ) : (
                tours.map((t) => (
                  <option key={t.TourID} value={t.TourID}>
                    {t.TourName} {t.TourCode ? `(${t.TourCode})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Bookings Table */}
      <DataTable
        title="Rezervasyonlar"
        columns={columns}
        data={bookings}
        loading={loadingBookings}
        onAdd={handleOpenAddModal}
        addButtonLabel="Yeni Rezervasyon"
        renderActions={renderActions}
      />

      {/* 3. BookingModal (Inline) */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Yeni Rezervasyon</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreateBooking}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    Turist Adı <span style={{ color: 'var(--pink)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Turist ad soyad girin"
                    value={formData.TouristName}
                    onChange={(e) => setFormData({ ...formData, TouristName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Otel Adı</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Konaklanan otel adı"
                    value={formData.HotelName}
                    onChange={(e) => setFormData({ ...formData, HotelName: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Yetişkin Sayısı</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={formData.AdultCount}
                      onChange={(e) => setFormData({ ...formData, AdultCount: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Çocuk Sayısı</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={formData.ChildCount}
                      onChange={(e) => setFormData({ ...formData, ChildCount: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Araç Sayısı</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={formData.VehicleCount}
                      onChange={(e) => setFormData({ ...formData, VehicleCount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Kazanç</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      value={formData.Earnings}
                      onChange={(e) => setFormData({ ...formData, Earnings: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tahsilat Ücreti</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      value={formData.ActualPassFee}
                      onChange={(e) => setFormData({ ...formData, ActualPassFee: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Para Birimi</label>
                    <select
                      className="form-select"
                      value={formData.Currency}
                      onChange={(e) => setFormData({ ...formData, Currency: e.target.value })}
                    >
                      <option value="€">€</option>
                      <option value="$">$</option>
                      <option value="₺">₺</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ConfirmDialog for Approve Action */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Rezervasyon Onayı"
        message={`${bookingToApprove?.TouristName ? `"${bookingToApprove.TouristName}" isimli turistin ` : ''}rezervasyonunu onaylamak istediğinize emin misiniz?`}
        onConfirm={handleConfirmApprove}
        onCancel={() => {
          if (!approving) {
            setIsConfirmOpen(false);
            setBookingToApprove(null);
          }
        }}
      />
    </div>
  );
};

export default Reservations;
