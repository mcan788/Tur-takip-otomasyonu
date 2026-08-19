import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Plus, Save, Map as MapIcon } from 'lucide-react';
import api from '../services/api';

const Tours = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);
  const [tours, setTours] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [expandedTourId, setExpandedTourId] = useState(null);
  const [tourHistory, setTourHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);

  // Bölgeleri turlar yüklendikten sonra hesapla
  const regions = ['All', ...new Set((tours || []).map(t => t.Region).filter(Boolean))];

  const [bookingData, setBookingData] = useState({
    tourId: '',
    touristName: '',
    hotelName: '',
    passFee: '',
    salesPrice: '',
    currency: '€',
    adultCount: 1,
    childCount: 0,
    babyCount: 0,
    passengerCount: 0,
    driverCount: 0,
    vehicleCount: 0, // Yeni eklendi
    officeId: '',
    bookingDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTour) {
      const adult = parseInt(bookingData.adultCount) || 0;
      const child = parseInt(bookingData.childCount) || 0;
      const baby = parseInt(bookingData.babyCount) || 0;
      const passenger = parseInt(bookingData.passengerCount) || 0;
      const driver = parseInt(bookingData.driverCount) || 0;
      
      const defaultPrice = parseFloat(selectedTour.DefaultPrice) || 0;
      const passengerPrice = parseFloat(selectedTour.PassengerPrice) || defaultPrice;
      const driverPrice = parseFloat(selectedTour.DriverPrice) || 0;
      
      const childPrice = (selectedTour.ChildPrice !== undefined && selectedTour.ChildPrice !== null) ? parseFloat(selectedTour.ChildPrice) : (defaultPrice * 0.5);
      const babyPrice = (selectedTour.BabyPrice !== undefined && selectedTour.BabyPrice !== null) ? parseFloat(selectedTour.BabyPrice) : 0;
      
      // Asıl Tur Ücreti Hesaplama
      const calculatedTotalFee = (adult * defaultPrice) + (child * childPrice) + (baby * babyPrice) + (passenger * passengerPrice) + (driver * driverPrice);
      
      // Depozit
      const depozit = parseFloat(bookingData.salesPrice) || 0;
      
      // Kalan (Rest)
      const rest = calculatedTotalFee - depozit;
      
      setBookingData(prev => ({
        ...prev,
        passFee: rest.toFixed(2)
      }));
    }
  }, [bookingData.adultCount, bookingData.childCount, bookingData.passengerCount, bookingData.driverCount, bookingData.salesPrice, selectedTour]);


  const fetchInitialData = async () => {
    try {
      const agencyId = localStorage.getItem('agencyId');
      console.log('Fetching data for agency:', agencyId);
      
      const [toursRes, officesRes] = await Promise.all([
        api.get(`/agency/tours/${agencyId}`),
        api.get(`/agency/offices/${agencyId}`)
      ]);

      setTours(Array.isArray(toursRes.data) ? toursRes.data : []);
      setOffices(Array.isArray(officesRes.data) ? officesRes.data : []);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTourClick = (tour, e) => {
    // Eğer butona tıklandıysa modal aç, satıra tıklandıysa genişlet
    if (e) e.stopPropagation();
    
    const initialAdultCount = 1;
    const defaultPrice = parseFloat(tour.DefaultPrice) || 0;
    const initialSalesPrice = (initialAdultCount * defaultPrice).toFixed(2);

    setSelectedTour(tour);
    setBookingData({
      ...bookingData,
      tourId: tour.TourID,
      salesPrice: '0.00', // Başlangıçta depozit 0
      passFee: initialSalesPrice, // Başlangıçta rest tam ücret
      currency: tour.DefaultCurrency || '€',
      adultCount: initialAdultCount,
      childCount: 0,
      babyCount: 0,
      passengerCount: 0,
      driverCount: 0,
      vehicleCount: 0,
      officeId: offices.length > 0 ? offices[0].OfficeID : ''
    });
    setShowModal(true);
  };

  const handleQuickRecord = () => {
    setSelectedTour(null);
    setBookingData({
      tourId: '',
      touristName: '',
      hotelName: '',
      passFee: '0.00',
      salesPrice: '',
      currency: '€',
      adultCount: 1,
      childCount: 0,
      babyCount: 0,
      passengerCount: 0,
      driverCount: 0,
      vehicleCount: 0,
      officeId: offices.length > 0 ? offices[0].OfficeID : '',
      bookingDate: new Date().toISOString().split('T')[0]
    });
    setShowQuickModal(true);
  };

  const toggleExpand = async (tourId) => {
    if (expandedTourId === tourId) {
      setExpandedTourId(null);
      return;
    }

    setExpandedTourId(tourId);
    if (!tourHistory[tourId]) {
      setLoadingHistory(true);
      try {
        const res = await api.get(`/agency/tour/${tourId}/bookings`);
        setTourHistory(prev => ({ ...prev, [tourId]: res.data }));
      } catch (error) {
        console.error('Geçmiş yükleme hatası:', error);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  const handleSaveBooking = async () => {
    if (!bookingData.hotelName || !bookingData.touristName) {
      alert('Lütfen Otel ve Müşteri Adı alanlarını doldurunuz.');
      return;
    }

    try {
      const response = await api.post('/agency/booking', {
        ...bookingData,
        officeId: bookingData.officeId,
        actualPassFee: bookingData.passFee,
        earnings: bookingData.salesPrice,
        bookingDate: bookingData.bookingDate
      });

      if (response.status === 201 || response.status === 200) {
        setShowModal(false);
        setShowQuickModal(false);
        fetchInitialData();
        setToastMsg('Kayıt başarıyla oluşturuldu.');
        setTimeout(() => setToastMsg(''), 3000);
        setBookingData({ 
          tourId: '', touristName: '', hotelName: '', 
          passFee: '', salesPrice: '', currency: '€',
          adultCount: 1, childCount: 0, babyCount: 0, passengerCount: 0, driverCount: 0, vehicleCount: 0
        });
      }
    } catch (error) {
      console.error('Kayıt hatası:', error);
      alert('Kayıt sırasında bir hata oluştu: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="page-layout" style={{ position: 'relative' }}>
      
      {/* Özel Toast Bildirimi */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--success)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(34, 197, 94, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10000,
          fontWeight: '600',
          animation: 'modalIn 0.3s ease-out'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            ✓
          </div>
          {toastMsg}
        </div>
      )}

      <Sidebar type="agency" />
      
      <main className="page-main">
        <header className="tours-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Tur Operasyon Kayıtları</h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>İşlem yapmak istediğiniz tur tipini seçerek hızlıca kayıt oluşturun.</p>
          </div>
          <div className="responsive-flex-row">
             <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Tur adı ara..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    padding: '12px 15px', 
                    paddingLeft: '40px',
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    background: '#ffffff', 
                    width: '250px',
                    fontSize: '14px',
                    color: '#1e293b'
                  }} 
                />
                <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                   <Plus size={16} />
                </div>
             </div>
             <button 
               className="btn btn-primary" 
               onClick={handleQuickRecord}
               style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', borderRadius: '12px', fontWeight: '700', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}
             >
                <Plus size={20} />
                Genel Kayıt Ekle
             </button>
          </div>
        </header>

        {/* Bölge Filtreleri */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' }}>
           {regions.map(region => (
             <button
               key={region}
               onClick={() => setSelectedRegion(region)}
               style={{
                 padding: '10px 20px',
                 borderRadius: '10px',
                 background: selectedRegion === region ? '#3b82f6' : '#ffffff',
                 color: selectedRegion === region ? 'white' : '#64748b',
                 fontWeight: '700',
                 fontSize: '13px',
                 cursor: 'pointer',
                 boxShadow: selectedRegion === region ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                 transition: 'all 0.2s',
                 whiteSpace: 'nowrap',
                 border: selectedRegion === region ? 'none' : '1px solid #e2e8f0'
               }}
             >
               {region === 'All' ? 'Tüm Bölgeler' : region}
             </button>
           ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px', color: '#64748b' }}>
             <div className="spinner" style={{ marginBottom: '15px' }}></div>
             Veriler yükleniyor...
          </div>
        ) : (
          <div className="tours-list-wrapper" style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <div className="tours-list-inner">
                {/* Liste Başlıkları */}
                <div className="responsive-grid-2 tours-list-header" style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '700', fontSize: '13px' }}>
               <span>TUR ADI / BÖLGE</span>
               <span style={{ textAlign: 'right' }}>İŞLEMLER</span>
            </div>

            {/* Liste İçeriği */}
            <div style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
              {(tours || [])
                .filter(t => (selectedRegion === 'All' || t.Region === selectedRegion) && (t.TourName || '').toLowerCase().includes(searchTerm.toLowerCase()))
                .map((tour) => (
                <React.Fragment key={tour.TourID}>
                  <div 
                    className={`list-row-hover tours-list-row ${expandedTourId === tour.TourID ? 'active-row' : ''} responsive-grid-2`}
                    onClick={() => toggleExpand(tour.TourID)}
                    style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '8px', background: '#eff6ff', borderRadius: '10px', color: '#3b82f6', transform: expandedTourId === tour.TourID ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                        <Plus size={14} />
                      </div>
                      <div>
                        <span className="mobile-label" style={{ display: 'none', fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>TUR ADI / BÖLGE</span>
                        <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px', display: 'block' }}>{tour.TourName}</span>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{tour.Region}</span>
                      </div>
                    </div>

                    <div className="tour-cell" style={{ textAlign: 'right' }}>
                       <button 
                         className="btn btn-primary" 
                         onClick={(e) => handleTourClick(tour, e)}
                         style={{ padding: '8px 18px', fontSize: '12px', borderRadius: '10px', fontWeight: '700', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)' }}
                       >
                          Kayıt Aç
                       </button>
                    </div>
                  </div>

                  {/* Genişleyen Alt Liste (Anne-Çocuk Yapısı) */}
                  {expandedTourId === tour.TourID && (
                    <div style={{ background: '#f8fafc', padding: '15px 25px 25px 65px', borderBottom: '1px solid #e2e8f0', animation: 'slideDown 0.3s ease-out' }}>
                       <div style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '20px' }}>
                          <h4 style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '800', marginBottom: '15px', letterSpacing: '0.5px' }}>OPERASYON GEÇMİŞİ (DETAYLI)</h4>
                          
                          {loadingHistory ? (
                            <div style={{ fontSize: '13px', color: '#64748b' }}>Kayıtlar yükleniyor...</div>
                          ) : (
                            <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                               <thead>
                                  <tr style={{ textAlign: 'left', color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>
                                     <th style={{ padding: '10px 0' }}>Tarih</th>
                                     <th>Müşteri / Grup</th>
                                     <th>Otel</th>
                                     <th style={{ textAlign: 'right' }}>Depozit</th>
                                     <th style={{ textAlign: 'right' }}>Rest (Kalan)</th>
                                  </tr>
                               </thead>
                               <tbody>
                                  {(tourHistory[tour.TourID] || []).map((history) => (
                                    <tr key={history.BookingID} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                                       <td style={{ padding: '12px 0', fontWeight: '600' }}>{new Date(history.BookingDate).toLocaleDateString('tr-TR')}</td>
                                       <td style={{ fontWeight: '700', color: '#0f172a' }}>{history.TouristName}</td>
                                       <td>{history.HotelName}</td>
                                       <td style={{ textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>{history.Earnings} {history.Currency}</td>
                                       <td style={{ textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>{history.ActualPassFee} {history.Currency}</td>
                                    </tr>
                                  ))}
                                  {(tourHistory[tour.TourID] || []).length === 0 && (
                                    <tr>
                                       <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Bu tura ait henüz bir kayıt bulunmuyor.</td>
                                    </tr>
                                  )}
                               </tbody>
                            </table>
</div>
                          )}
                       </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div className="glass modal-content animate-in" style={{ width: '90%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="responsive-flex-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', color: '#0f172a', fontWeight: '800', margin: 0 }}>{selectedTour?.TourName} - Yeni Operasyon Kaydı</h2>
                <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                </button>
              </div>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>Konaklanan Otel <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" placeholder="Otel Adı" value={bookingData.hotelName} onChange={(e) => setBookingData({...bookingData, hotelName: e.target.value})} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Müşteri / Grup Adı <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="Müşteri Ad Soyad" value={bookingData.touristName} onChange={(e) => setBookingData({...bookingData, touristName: e.target.value})} required />
                </div>

                {(() => {
                  const rawFields = selectedTour?.Fields ? selectedTour.Fields.split(',') : ['Yetişkin', 'Çocuk', 'Bebek'];
                  const tourFields = rawFields.map(f => {
                    let val = f.trim();
                    if (val === 'Yetiskin') return 'Yetişkin';
                    if (val === 'Cocuk') return 'Çocuk';
                    if (val === 'Sofor' || val === 'Şöför') return 'Şoför';
                    return val;
                  });
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(tourFields.length, 3)}, 1fr)`, gap: '20px' }}>
                      {tourFields.includes('Yetişkin') && (
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginBottom: 0 }}>
                          <label>Yetişkin Sayısı (Tam)</label>
                          <input type="number" min="0" value={bookingData.adultCount} onChange={(e) => setBookingData({...bookingData, adultCount: e.target.value})} style={{ margin: 0 }} />
                        </div>
                      )}
                      {tourFields.includes('Çocuk') && (
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginBottom: 0 }}>
                          <label>Çocuk Sayısı (%50)</label>
                          <input type="number" min="0" value={bookingData.childCount} onChange={(e) => setBookingData({...bookingData, childCount: e.target.value})} style={{ margin: 0 }} />
                        </div>
                      )}
                      {tourFields.includes('Bebek') && (
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginBottom: 0 }}>
                          <label>Bebek (Ücretsiz)</label>
                          <input type="number" min="0" value={bookingData.babyCount} onChange={(e) => setBookingData({...bookingData, babyCount: e.target.value})} style={{ margin: 0 }} />
                        </div>
                      )}
                      {tourFields.includes('Yolcu') && (
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginBottom: 0 }}>
                          <label>Yolcu Sayısı</label>
                          <input type="number" min="0" value={bookingData.passengerCount} onChange={(e) => setBookingData({...bookingData, passengerCount: e.target.value})} style={{ margin: 0 }} />
                        </div>
                      )}
                      {tourFields.includes('Şoför') && (
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginBottom: 0 }}>
                          <label>Şoför (Araç) Sayısı</label>
                          <input type="number" min="0" value={bookingData.driverCount} onChange={(e) => setBookingData({...bookingData, driverCount: e.target.value})} style={{ margin: 0 }} />
                        </div>
                      )}

                    </div>
                  );
                })()}

                <div style={{ display: 'grid', gridTemplateColumns: '150px', gap: '20px' }}>
                  <div className="form-group">
                    <label>Para Birimi</label>
                    <select value={bookingData.currency} onChange={(e) => setBookingData({...bookingData, currency: e.target.value})}>
                      <option value="€">EUR (€)</option>
                      <option value="$">USD ($)</option>
                    </select>
                  </div>
                </div>

                <div className="responsive-grid-2">
                  <div className="form-group">
                    <label style={{ color: 'var(--success)' }}>Depozit <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={bookingData.salesPrice} 
                      onChange={(e) => setBookingData({...bookingData, salesPrice: e.target.value})} 
                      style={{ borderColor: 'var(--success)' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ color: 'var(--error)' }}>Rest (Kalan Para)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={bookingData.passFee} 
                      onChange={(e) => setBookingData({...bookingData, passFee: e.target.value})} 
                      style={{ borderColor: 'var(--error)', background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
                      readOnly
                    />
                  </div>
                </div>



                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ 
                      flex: '1',
                      padding: '16px', 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      background: '#f1f5f9', 
                      border: 'none', 
                      color: '#64748b', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Vazgeç
                  </button>
                  <button 
                    className="btn-save-booking" 
                    onClick={handleSaveBooking} 
                    style={{ 
                      flex: '2',
                      padding: '16px', 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      background: 'linear-gradient(90deg, #6366f1, #a855f7)', 
                      border: 'none', 
                      color: 'white', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Save size={20} style={{ marginRight: '10px' }} />
                    Kaydı Tamamla ve Sisteme İşle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Genel Kayıt Modalı */}
        {showQuickModal && (
          <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div className="glass modal-content animate-in" style={{ width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', background: 'white' }}>
              <div className="responsive-flex-header">
                <div>
                  <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '800' }}>Genel Operasyon Kaydı</h2>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Herhangi bir tur ve ofis için hızlıca satış girişi yapın.</p>
                </div>
                <button onClick={() => setShowQuickModal(false)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '10px' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                 <div className="responsive-grid-2">
                    <div className="form-group">
                      <label>Tur Seçimi <span style={{ color: '#ef4444' }}>*</span></label>
                      <select 
                        value={bookingData.tourId}
                        onChange={(e) => {
                          const tour = tours.find(t => t.TourID === parseInt(e.target.value));
                          setSelectedTour(tour);
                          setBookingData({...bookingData, tourId: e.target.value});
                        }}
                        style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', fontWeight: '600' }}
                        required
                      >
                        <option value="">Tur Seçiniz...</option>
                        {tours.map(t => (
                          <option key={t.TourID} value={t.TourID}>{t.TourName} ({t.Region})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>İşlem Tarihi</label>
                      <input 
                        type="date" 
                        value={bookingData.bookingDate}
                        onChange={(e) => setBookingData({...bookingData, bookingDate: e.target.value})}
                        style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', fontWeight: '600' }}
                      />
                    </div>
                 </div>

                 <div className="responsive-grid-2">
                    <div className="form-group">
                      <label>Müşteri / Grup Adı <span style={{ color: '#ef4444' }}>*</span></label>
                      <input 
                        type="text" 
                        placeholder="Örn: John Doe" 
                        value={bookingData.touristName}
                        onChange={(e) => setBookingData({...bookingData, touristName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Otel / Konum <span style={{ color: '#ef4444' }}>*</span></label>
                      <input 
                        type="text" 
                        placeholder="Örn: Hilton Hotel" 
                        value={bookingData.hotelName}
                        onChange={(e) => setBookingData({...bookingData, hotelName: e.target.value})}
                        required
                      />
                    </div>
                 </div>

                 <div className="responsive-grid-2">
                    <div className="form-group">
                      <label>Para Birimi</label>
                      <select value={bookingData.currency} onChange={(e) => setBookingData({...bookingData, currency: e.target.value})}>
                        <option value="€">EUR (€)</option>
                        <option value="$">USD ($)</option>
                      </select>
                    </div>
                 </div>

                 <div className="responsive-grid-4">
                    <div className="form-group">
                      <label>Yetişkin</label>
                      <input type="number" min="1" value={bookingData.adultCount} onChange={(e) => setBookingData({...bookingData, adultCount: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Çocuk</label>
                      <input type="number" min="0" value={bookingData.childCount} onChange={(e) => setBookingData({...bookingData, childCount: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Bebek</label>
                      <input type="number" min="0" value={bookingData.babyCount} onChange={(e) => setBookingData({...bookingData, babyCount: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Yolcu</label>
                      <input type="number" min="0" value={bookingData.passengerCount} onChange={(e) => setBookingData({...bookingData, passengerCount: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Şoför</label>
                      <input type="number" min="0" value={bookingData.driverCount} onChange={(e) => setBookingData({...bookingData, driverCount: e.target.value})} />
                    </div>

                 </div>

                 <div className="responsive-grid-2">
                    <div className="form-group">
                      <label style={{ color: '#16a34a' }}>Depozit <span style={{ color: '#ef4444' }}>*</span></label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={bookingData.salesPrice}
                        onChange={(e) => setBookingData({...bookingData, salesPrice: e.target.value})}
                        style={{ border: '2px solid #16a34a', fontWeight: '800', color: '#16a34a' }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ color: '#ef4444' }}>Rest (Kalan Para)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={bookingData.passFee}
                        onChange={(e) => setBookingData({...bookingData, passFee: e.target.value})}
                        style={{ border: '2px solid #ef4444', fontWeight: '800', color: '#ef4444', background: '#fee2e2', cursor: 'not-allowed' }}
                        readOnly
                      />
                    </div>
                 </div>

                  <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                    <button 
                      type="button"
                      onClick={() => setShowQuickModal(false)}
                      style={{ 
                        flex: '1',
                        padding: '18px', 
                        fontSize: '16px', 
                        fontWeight: '800', 
                        background: '#f1f5f9', 
                        border: 'none', 
                        color: '#64748b', 
                        borderRadius: '15px', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Vazgeç
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleSaveBooking} 
                      style={{ 
                        flex: '2',
                        padding: '18px', 
                        fontSize: '16px', 
                        borderRadius: '15px', 
                        fontWeight: '800',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                       <Save size={20} style={{ marginRight: '10px' }} />
                       Kaydı Sisteme İşle
                    </button>
                  </div>
              </div>
            </div>
          </div>
        )}
        <style>{`
          .tours-list-inner {
            min-width: 950px;
          }
          @media (max-width: 768px) {
            .tours-header {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 15px !important;
            }
            .tours-header > div:nth-child(2) {
              flex-direction: column !important;
              align-items: stretch !important;
              width: 100% !important;
            }
            .tours-header input {
              width: 100% !important;
            }
            .tours-header button {
              justify-content: center !important;
            }
            
            /* Responsive Tours List */
            .tours-list-wrapper {
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
            }
            .tours-list-inner {
              min-width: 100% !important;
            }
            .tours-list-header {
              display: none !important;
            }
            .tours-list-row {
              display: flex !important;
              flex-direction: column;
              background: #ffffff;
              margin-bottom: 15px;
              border-radius: 12px;
              border: 1px solid #e2e8f0 !important;
              padding: 20px !important;
              box-shadow: 0 4px 6px rgba(0,0,0,0.02);
              gap: 15px;
            }
            .tours-list-row > div.tour-cell {
              display: flex;
              flex-direction: column;
              align-items: flex-start !important;
              text-align: left !important;
              width: 100%;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 10px;
            }
            .tours-list-row > div.tour-cell:last-child {
              border-bottom: none;
              padding-bottom: 0;
              align-items: stretch !important;
            }
            .tours-list-row > div.tour-cell:last-child button {
              width: 100%;
            }
            .mobile-label {
              display: block !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
};

export default Tours;
