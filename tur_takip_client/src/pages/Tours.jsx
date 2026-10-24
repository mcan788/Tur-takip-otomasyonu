import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';

const TourModal = ({ isOpen, onClose, onSave, editingTour }) => {
  const [formData, setFormData] = useState({
    TourName: '',
    Region: '',
    Description: '',
    DefaultPrice: '',
    PassengerPrice: '',
    DriverPrice: '',
    ChildPrice: '',
    BabyPrice: '',
    DefaultCurrency: '₺'
  });

  useEffect(() => {
    if (editingTour) {
      setFormData({
        TourName: editingTour.TourName || '',
        Region: editingTour.Region || '',
        Description: editingTour.Description || '',
        DefaultPrice: editingTour.DefaultPrice ?? '',
        PassengerPrice: editingTour.PassengerPrice ?? '',
        DriverPrice: editingTour.DriverPrice ?? '',
        ChildPrice: editingTour.ChildPrice ?? '',
        BabyPrice: editingTour.BabyPrice ?? '',
        DefaultCurrency: editingTour.DefaultCurrency || '₺'
      });
    } else {
      setFormData({
        TourName: '',
        Region: '',
        Description: '',
        DefaultPrice: '',
        PassengerPrice: '',
        DriverPrice: '',
        ChildPrice: '',
        BabyPrice: '',
        DefaultCurrency: '₺'
      });
    }
  }, [editingTour, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      DefaultPrice: formData.DefaultPrice !== '' ? Number(formData.DefaultPrice) : 0,
      PassengerPrice: formData.PassengerPrice !== '' ? Number(formData.PassengerPrice) : 0,
      DriverPrice: formData.DriverPrice !== '' ? Number(formData.DriverPrice) : 0,
      ChildPrice: formData.ChildPrice !== '' ? Number(formData.ChildPrice) : 0,
      BabyPrice: formData.BabyPrice !== '' ? Number(formData.BabyPrice) : 0
    };
    onSave(dataToSave);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">
            {editingTour ? 'Turu Düzenle' : 'Yeni Tur Ekle'}
          </h3>
          <button type="button" className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Tur Adı *</label>
              <input
                type="text"
                name="TourName"
                className="form-input"
                placeholder="Örn: Pamukkale Günübirlik Tur"
                value={formData.TourName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bölge *</label>
              <input
                type="text"
                name="Region"
                className="form-input"
                placeholder="Örn: Antalya"
                value={formData.Region}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Açıklama</label>
              <input
                type="text"
                name="Description"
                className="form-input"
                placeholder="Tur detayları ve açıklamaları..."
                value={formData.Description}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Varsayılan Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="DefaultPrice"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.DefaultPrice}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Yetişkin Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="PassengerPrice"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.PassengerPrice}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Şoför Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="DriverPrice"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.DriverPrice}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Çocuk Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="ChildPrice"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.ChildPrice}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bebek Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="BabyPrice"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.BabyPrice}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Para Birimi</label>
              <select
                name="DefaultCurrency"
                className="form-select"
                value={formData.DefaultCurrency}
                onChange={handleChange}
              >
                <option value="€">€</option>
                <option value="$">$</option>
                <option value="₺">₺</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              İptal
            </button>
            <button type="submit" className="btn-primary">
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Tours = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState(null);

  const toast = useToast();

  const fetchTours = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getTours();
      setTours(data || []);
    } catch (err) {
      const errMsg = err.message || 'Turlar yüklenirken bir hata oluştu.';
      setError(errMsg);
      toast?.error?.(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const handleOpenAddModal = () => {
    setEditingTour(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tour) => {
    setEditingTour(tour);
    setIsModalOpen(true);
  };

  const handleSaveTour = async (tourData) => {
    try {
      if (editingTour) {
        await apiService.updateTour(editingTour.TourID, tourData);
        toast?.success?.('Tur başarıyla güncellendi.');
      } else {
        await apiService.createTour(tourData);
        toast?.success?.('Yeni tur başarıyla eklendi.');
      }
      setIsModalOpen(false);
      setEditingTour(null);
      fetchTours();
    } catch (err) {
      toast?.error?.(err.message || 'İşlem başarısız oldu.');
    }
  };

  const handleOpenDeleteConfirm = (tour) => {
    setTourToDelete(tour);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tourToDelete) return;
    try {
      await apiService.deleteTour(tourToDelete.TourID);
      toast?.success?.('Tur başarıyla silindi.');
      setDeleteConfirmOpen(false);
      setTourToDelete(null);
      fetchTours();
    } catch (err) {
      toast?.error?.(err.message || 'Silme işlemi başarısız oldu.');
    }
  };

  return (
    <div className="tours-page">
      <div className="glass-panel">
        <div className="panel-header section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="section-title">Tur Yönetimi</h2>
          <button className="btn-primary" onClick={handleOpenAddModal}>
            <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i>
            Yeni Tur Ekle
          </button>
        </div>

        <div className="panel-body">
          {error && (
            <div className="alert alert-error">
              <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '8px' }}></i>
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : tours.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-route"></i>
              <p>Henüz eklenmiş bir tur bulunmamaktadır.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tur Adı</th>
                  <th>Bölge</th>
                  <th>Fiyat</th>
                  <th>Rezervasyon</th>
                  <th>Kazanç</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {tours.map((tour) => (
                  <tr key={tour.TourID}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{tour.TourName}</div>
                      {tour.Description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                          {tour.Description}
                        </div>
                      )}
                    </td>
                    <td>{tour.Region || '-'}</td>
                    <td>
                      {tour.DefaultPrice !== undefined && tour.DefaultPrice !== null
                        ? `${tour.DefaultPrice} ${tour.DefaultCurrency || '₺'}`
                        : '-'}
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {tour.BookingCount || 0}
                      </span>
                    </td>
                    <td>
                      {tour.TotalEarnings !== undefined && tour.TotalEarnings !== null
                        ? `${tour.TotalEarnings} ${tour.DefaultCurrency || '₺'}`
                        : `0 ${tour.DefaultCurrency || '₺'}`}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-icon"
                          title="Düzenle"
                          onClick={() => handleOpenEditModal(tour)}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          className="btn-icon"
                          title="Sil"
                          style={{ color: 'var(--pink)' }}
                          onClick={() => handleOpenDeleteConfirm(tour)}
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

      <TourModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTour(null);
        }}
        onSave={handleSaveTour}
        editingTour={editingTour}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Turu Sil"
        message={tourToDelete ? `"${tourToDelete.TourName}" turunu silmek istediğinizden emin misiniz?` : 'Turu silmek istediğinizden emin misiniz?'}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setTourToDelete(null);
        }}
      />
    </div>
  );
};

export default Tours;
