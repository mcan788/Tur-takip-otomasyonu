import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Plus, Trash2, Edit2, Save, X, MapPin, Globe } from 'lucide-react';
import api from '../services/api';

const TourManagement = () => {
  const [tours, setTours] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    passengerPrice: '0', 
    driverPrice: '0', 
    childPrice: '0',
    babyPrice: '0',
    currency: '€', 
    region: '', 
    fields: ['Yetişkin', 'Çocuk', 'Bebek'] 
  });

  const toggleField = (field) => {
    setFormData(prev => {
      const fields = prev.fields.includes(field) 
        ? prev.fields.filter(f => f !== field)
        : [...prev.fields, field];
        
      let updates = {};
      // Yetişkin işaretlendiğinde fiyatları otomatik güncelle
      if (field === 'Yetişkin' && !prev.fields.includes('Yetişkin')) {
         updates.childPrice = prev.price ? (parseFloat(prev.price) / 2).toString() : '0';
         updates.babyPrice = '0';
      }
      
      return { ...prev, fields, ...updates };
    });
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const fetchTours = async () => {
    try {
      const agencyId = localStorage.getItem('agencyId');
      const response = await api.get(`/agency/tours/${agencyId}`);
      if (response.status === 200) {
        setTours(response.data);
      }
    } catch (error) {
      console.error('Turlar yüklenemedi:', error);
    }
  };

  const handleSave = async () => {
    try {
      const url = editingTour ? `/agency/tour/${editingTour.TourID || editingTour.id}` : '/agency/tour';
      const method = editingTour ? 'put' : 'post';

      const response = await api[method](url, {
        tourName: formData.name,
        region: formData.region,
        defaultPrice: formData.price || 0,
        passengerPrice: formData.passengerPrice || 0,
        driverPrice: formData.driverPrice || 0,
        childPrice: formData.childPrice || 0,
        babyPrice: formData.babyPrice || 0,
        defaultCurrency: formData.currency,
        currency: formData.currency,
        fields: formData.fields
      });

      if (response.status === 201 || response.status === 200) {
        setShowModal(false);
        setEditingTour(null);
        setFormData({ name: '', price: '', passengerPrice: '', driverPrice: '', childPrice: '', babyPrice: '', currency: '€', region: '', fields: ['Yetişkin', 'Çocuk', 'Bebek'] });
        fetchTours();
        setToast({ message: editingTour ? 'Tur güncellendi.' : 'Yeni tur tanımlandı.', type: 'success' });
      }
    } catch (error) {
      setToast({ message: 'Hata oluştu: ' + (error.response?.data?.error || 'İşlem başarısız.'), type: 'error' });
    }
  };

  const handleEdit = (tour) => {
    setEditingTour(tour);
    const defaultPrice = parseFloat(tour.DefaultPrice) || 0;
    setFormData({
      name: tour.TourName || '',
      price: tour.DefaultPrice || '0',
      passengerPrice: tour.PassengerPrice || '0',
      driverPrice: tour.DriverPrice || '0',
      childPrice: tour.ChildPrice !== null && tour.ChildPrice !== undefined ? tour.ChildPrice.toString() : (defaultPrice / 2).toString(),
      babyPrice: tour.BabyPrice !== null && tour.BabyPrice !== undefined ? tour.BabyPrice.toString() : '0',
      currency: tour.DefaultCurrency || tour.currency || '€',
      region: tour.Region || '',
      fields: tour.Fields ? tour.Fields.split(',').map(f => {
        if (f.trim() === 'Yetiskin') return 'Yetişkin';
        if (f.trim() === 'Cocuk') return 'Çocuk';
        if (f.trim() === 'Sofor' || f.trim() === 'Şöför') return 'Şoför';
        return f.trim();
      }) : ['Yetişkin', 'Çocuk', 'Bebek']
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setConfirm({
      title: 'Turu Sil',
      message: 'Bu tur tanımını silmek istediğinize emin misiniz? Bu işlem bu turla ilişkili geçmiş verileri etkileyebilir.',
      onConfirm: async () => {
        try {
          const response = await api.delete(`/agency/tour/${id}`);
          if (response.status === 200) {
            fetchTours();
            setToast({ message: 'Tur tanımı silindi.', type: 'success' });
          }
        } catch (error) {
          setToast({ message: 'Tur silinirken hata oluştu.', type: 'error' });
        }
        setConfirm(null);
      }
    });
  };

  return (
    <div className="page-layout">
      <Sidebar type="agency" />
      <main className="page-main">
        <header className="tour-header responsive-flex-header">
          <div>
            <h1 style={{ fontSize: '28px' }}>Tur Tanımları</h1>
            <p style={{ color: 'var(--text-muted)' }}>Müşterilerinize sunduğunuz standart turları buradan tanımlayabilirsiniz.</p>
          </div>
          <button className="btn btn-primary" onClick={() => { 
            setEditingTour(null); 
            setFormData({ name: '', price: '', passengerPrice: '0', driverPrice: '0', childPrice: '0', babyPrice: '0', currency: '€', region: '', fields: ['Yetişkin', 'Çocuk', 'Bebek'] }); 
            setShowModal(true); 
          }} style={{ display: 'flex', alignItems: 'center' }}>
            <Plus size={20} style={{ marginRight: '8px' }} />
            Yeni Tur Tanımla
          </button>
        </header>

        <div className="glass" style={{ overflow: 'hidden', borderRadius: '20px' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'rgba(56, 189, 248, 0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '20px 25px', fontWeight: '700', color: 'var(--text-muted)', fontSize: '14px' }}>TUR ADI</th>
                <th style={{ padding: '20px 25px', fontWeight: '700', color: 'var(--text-muted)', fontSize: '14px' }}>BÖLGE</th>
                <th style={{ padding: '20px 25px', fontWeight: '700', color: 'var(--text-muted)', fontSize: '14px' }}>SATIŞ FİYATI</th>
                <th style={{ padding: '20px 25px', fontWeight: '700', color: 'var(--text-muted)', fontSize: '14px' }}>ALANLAR</th>
                <th style={{ padding: '20px 25px', fontWeight: '700', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'right' }}>İŞLEMLER</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((tour) => (
                <tr key={tour.TourID || tour.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '20px 25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: '35px', height: '35px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                        <Globe color="var(--accent-color)" size={18} />
                      </div>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{tour.TourName || tour.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '20px 25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                      <MapPin size={14} style={{ marginRight: '6px' }} />
                      {tour.Region || tour.region}
                    </div>
                  </td>
                  <td style={{ padding: '20px 25px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '15px' }}>
                      {parseFloat(tour.DefaultPrice) > 0 ? (
                        <>
                          {tour.DefaultPrice} <span style={{ color: 'var(--accent-color)', fontSize: '13px' }}>{tour.DefaultCurrency || tour.currency}</span>
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '13px' }}>
                          {parseFloat(tour.PassengerPrice) > 0 && <div><span style={{color: 'var(--text-muted)'}}>Yolcu:</span> {tour.PassengerPrice} {tour.DefaultCurrency}</div>}
                          {parseFloat(tour.DriverPrice) > 0 && <div><span style={{color: 'var(--text-muted)'}}>Şoför:</span> {tour.DriverPrice} {tour.DefaultCurrency}</div>}
                          {parseFloat(tour.ChildPrice) > 0 && <div><span style={{color: 'var(--text-muted)'}}>Çocuk:</span> {tour.ChildPrice} {tour.DefaultCurrency}</div>}
                          {parseFloat(tour.BabyPrice) > 0 && <div><span style={{color: 'var(--text-muted)'}}>Bebek:</span> {tour.BabyPrice} {tour.DefaultCurrency}</div>}
                          {(!tour.DefaultPrice || parseFloat(tour.DefaultPrice) === 0) && !tour.PassengerPrice && !tour.DriverPrice && !tour.ChildPrice && !tour.BabyPrice && <span>0.00 {tour.DefaultCurrency}</span>}
                        </div>
                      )}
                    </span>
                  </td>
                  <td style={{ padding: '20px 25px' }}>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {(tour.Fields || 'Yetişkin,Çocuk,Bebek').split(',').map(field => {
                        let f = field.trim();
                        if (f === 'Yetiskin') f = 'Yetişkin';
                        if (f === 'Cocuk') f = 'Çocuk';
                        if (f === 'Sofor' || f === 'Şöför') f = 'Şoför';
                        return (
                          <span key={field} style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>
                            {f}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '20px 25px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn" onClick={() => handleEdit(tour)} style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-color)', fontSize: '13px' }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn" onClick={() => handleDelete(tour.TourID || tour.id)} style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px' }}>
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
        </div>

        {showModal && (
          <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div className="glass modal-content animate-in" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="responsive-flex-header">
                <h2 style={{ fontSize: '1.5rem' }}>{editingTour ? 'Turu Düzenle' : 'Yeni Tur Tanımla'}</h2>
                <button onClick={() => { setShowModal(false); setEditingTour(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div className="form-group">
                  <label>Tur Adı <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Örn: Kapadokya Klasik Turu" 
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Bölge / Şehir <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    placeholder="Örn: Nevşehir" 
                    required
                  />
                </div>

                {formData.fields.includes('Yetişkin') && (
                  <div className="form-group">
                    <label>Yetişkin Satış Fiyatı <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                      type="number" 
                      step="any"
                      value={formData.price}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData, 
                          price: val,
                          childPrice: val ? (parseFloat(val) / 2).toString() : '0',
                          babyPrice: '0'
                        });
                      }}
                      placeholder="0.00" 
                      required
                    />
                  </div>
                )}

                {formData.fields.includes('Çocuk') && (
                  <div className="form-group">
                    <label>Çocuk Satış Fiyatı</label>
                    <input 
                      type="number" 
                      step="any"
                      value={formData.childPrice}
                      onChange={(e) => setFormData({...formData, childPrice: e.target.value})}
                      placeholder="0.00" 
                    />
                  </div>
                )}

                {formData.fields.includes('Bebek') && (
                  <div className="form-group">
                    <label>Bebek Satış Fiyatı</label>
                    <input 
                      type="number" 
                      step="any"
                      value={formData.babyPrice}
                      onChange={(e) => setFormData({...formData, babyPrice: e.target.value})}
                      placeholder="0.00" 
                    />
                  </div>
                )}

                {formData.fields.includes('Yolcu') && (
                  <div className="form-group">
                    <label>Yolcu Satış Fiyatı</label>
                    <input 
                      type="number" 
                      step="any"
                      value={formData.passengerPrice}
                      onChange={(e) => setFormData({...formData, passengerPrice: e.target.value})}
                      placeholder="0.00" 
                    />
                  </div>
                )}

                {formData.fields.includes('Şoför') && (
                  <div className="form-group">
                    <label>Şoför Satış Fiyatı</label>
                    <input 
                      type="number" 
                      step="any"
                      value={formData.driverPrice}
                      onChange={(e) => setFormData({...formData, driverPrice: e.target.value})}
                      placeholder="0.00" 
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Para Birimi</label>
                  <select 
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    style={{ width: '100%', padding: '12px', background: 'var(--secondary-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px' }}
                  >
                    <option value="€">Euro (€)</option>
                    <option value="$">Dolar ($)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tur Kayıt Formu Alanları (Müşteri/Yolcu Tipleri)</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '5px' }}>
                    {['Yetişkin', 'Çocuk', 'Bebek', 'Yolcu', 'Şoför'].map(field => (
                      <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', background: 'var(--secondary-bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '13px' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.fields.includes(field)}
                          onChange={() => toggleField(field)}
                          style={{ accentColor: 'var(--accent-color)' }}
                        />
                        {field}
                      </label>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary" onClick={handleSave} style={{ width: '100%', padding: '15px', fontSize: '1rem', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Save size={18} style={{ marginRight: '8px' }} />
                  {editingTour ? 'Değişiklikleri Kaydet' : 'Turu Tanımla'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Özel Onay Modalı */}
        {confirm && (
          <div className="modal-overlay" style={{ zIndex: 11000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div className="animate-in" style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '15px', color: '#0f172a' }}>{confirm.title}</h3>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', marginBottom: '25px' }}>{confirm.message}</p>
              <div className="responsive-flex-row">
                <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '700', cursor: 'pointer' }}>İptal</button>
                <button onClick={confirm.onConfirm} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Evet, Sil</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Bildirimi */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: '30px', right: '30px', zIndex: 12000,
            padding: '16px 24px', borderRadius: '12px', color: 'white', fontWeight: '700',
            background: toast.type === 'success' ? '#22c55e' : '#ef4444',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', gap: '10px',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {toast.type === 'success' ? '✓' : '✕'} {toast.message}
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'white', marginLeft: '10px', cursor: 'pointer' }}>&times;</button>
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .tour-header {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 15px !important;
            }
            .tour-header button {
              justify-content: center !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
};

export default TourManagement;
