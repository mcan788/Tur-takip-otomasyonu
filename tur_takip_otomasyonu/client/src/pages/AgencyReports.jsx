import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { DollarSign, TrendingUp, Map, Building, PieChart, Calendar, AlertCircle } from 'lucide-react';
import api from '../services/api';

const AgencyReports = () => {
  const [reportData, setReportData] = useState({ financial: [], tours: [], offices: [], daily: [], weekly: [], monthly: [], yearly: [], pending: [] });
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState('general'); // general or pending
  const [activeTab, setActiveTab] = useState('daily');
  const [expandedYears, setExpandedYears] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [officeCurrency, setOfficeCurrency] = useState('€');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, bookingId: null });
  const itemsPerPage = 10;

  const toggleYearDetail = (year) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const groupedYearly = (reportData.yearly || []).reduce((acc, curr) => {
    if (!acc[curr.Yil]) {
      acc[curr.Yil] = {
        Yil: curr.Yil,
        ToplamRezervasyon: 0,
        AktifTurSet: new Set(),
        currencies: {}
      };
    }
    
    acc[curr.Yil].ToplamRezervasyon += curr.ToplamRezervasyon;
    acc[curr.Yil].AktifTurSet.add(curr.TourName);
    
    if (!acc[curr.Yil].currencies[curr.Currency]) {
      acc[curr.Yil].currencies[curr.Currency] = {
        Currency: curr.Currency,
        ToplamGelir: 0,
        ToplamPassGideri: 0,
        ToplamRezervasyon: 0,
        details: []
      };
    }
    
    acc[curr.Yil].currencies[curr.Currency].ToplamGelir += curr.ToplamGelir;
    acc[curr.Yil].currencies[curr.Currency].ToplamPassGideri += (curr.ToplamPassGideri || 0);
    acc[curr.Yil].currencies[curr.Currency].ToplamRezervasyon += curr.ToplamRezervasyon;
    acc[curr.Yil].currencies[curr.Currency].details.push(curr);
    
    return acc;
  }, {});

  const yearlyRows = Object.values(groupedYearly).map(yr => ({
    ...yr,
    AktifTurSayisi: yr.AktifTurSet.size,
    currencies: Object.values(yr.currencies)
  })).sort((a, b) => b.Yil - a.Yil);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/agency/reports');
      if (response.status === 200) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Raporlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = (id) => {
    setConfirmModal({ isOpen: true, bookingId: id });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, bookingId: null });
  };

  const handleConfirmApprove = async () => {
    if (!confirmModal.bookingId) return;
    try {
      const response = await api.put(`/agency/booking/${confirmModal.bookingId}/approve`);
      if (response.status === 200) {
        fetchReports(); // Yenile
        closeConfirmModal();
      }
    } catch (error) {
      console.error('Onaylama hatası:', error);
      alert('Onaylama sırasında bir hata oluştu.');
    }
  };

  return (
    <div className="page-layout">
      <Sidebar type="agency" />
      
      <main className="page-main">
        <header className="reports-header" style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '28px' }}>Operasyonel ve Finansal Analiz</h1>
          <p style={{ color: 'var(--text-muted)' }}>Günlük operasyon detayları ve işletme performansı.</p>
        </header>

        {/* Main Tab Switcher */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '2px solid var(--glass-border)', paddingBottom: '10px' }}>
          <button 
            onClick={() => setMainTab('general')}
            style={{ 
              padding: '10px 20px', background: 'none', border: 'none', 
              fontSize: '16px', fontWeight: '600', cursor: 'pointer',
              color: mainTab === 'general' ? 'var(--accent-color)' : 'var(--text-muted)',
              borderBottom: mainTab === 'general' ? '3px solid var(--accent-color)' : '3px solid transparent',
              marginBottom: '-12px'
            }}>
            Genel Finansal Rapor
          </button>
          <button 
            onClick={() => setMainTab('pending')}
            style={{ 
              padding: '10px 20px', background: 'none', border: 'none', 
              fontSize: '16px', fontWeight: '600', cursor: 'pointer',
              color: mainTab === 'pending' ? 'var(--accent-color)' : 'var(--text-muted)',
              borderBottom: mainTab === 'pending' ? '3px solid var(--accent-color)' : '3px solid transparent',
              marginBottom: '-12px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
            Onay Bekleyen Turlar
            {reportData.pending?.length > 0 && (
              <span style={{ background: 'var(--error)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                {reportData.pending.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
            <div className="loader"></div>
          </div>
        ) : mainTab === 'general' ? (
          <>
            {/* Operasyonel Rapor Sekmeli */}
            <div className="glass" style={{ padding: '25px', marginBottom: '40px' }}>
              <div className="op-reports-header responsive-flex-header">
                <h3 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
                  <Calendar size={20} style={{ marginRight: '10px' }} color="var(--accent-color)" />
                  Operasyonel Döküm (Harekat Raporu)
                </h3>
                <div style={{ display: 'flex', background: 'var(--secondary-bg)', borderRadius: '8px', padding: '4px', border: '1px solid var(--glass-border)' }}>
                  <button 
                    onClick={() => { setActiveTab('daily'); setCurrentPage(1); }} 
                    style={{ padding: '8px 16px', background: activeTab === 'daily' ? 'var(--accent-color)' : 'transparent', color: activeTab === 'daily' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>
                    Günlük
                  </button>
                  <button 
                    onClick={() => { setActiveTab('weekly'); setCurrentPage(1); }} 
                    style={{ padding: '8px 16px', background: activeTab === 'weekly' ? 'var(--accent-color)' : 'transparent', color: activeTab === 'weekly' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>
                    Haftalık
                  </button>
                  <button 
                    onClick={() => { setActiveTab('monthly'); setCurrentPage(1); }} 
                    style={{ padding: '8px 16px', background: activeTab === 'monthly' ? 'var(--accent-color)' : 'transparent', color: activeTab === 'monthly' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>
                    Aylık
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                {/* Year Selector for Weekly and Monthly */}
                {activeTab !== 'daily' && (
                  <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Yıl Seçiniz:</span>
                    {[...new Set([...(reportData.weekly || []).map(o => o.Year), ...(reportData.monthly || []).map(o => o.Year)])].sort((a,b) => b-a).map(year => (
                      <button 
                        key={year}
                        onClick={() => { setSelectedYear(year); setSelectedMonth(null); setSelectedWeek(null); }}
                        style={{ padding: '6px 16px', background: selectedYear === year ? 'var(--accent-color)' : '#f8fafc', color: selectedYear === year ? 'white' : 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}

                {/* Month Grid for Weekly and Monthly */}
                {activeTab !== 'daily' && selectedYear && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    {["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"].map((m, idx) => {
                      const monthNum = idx + 1;
                      const isSelected = selectedMonth === monthNum;
                      return (
                        <button 
                          key={idx}
                          onClick={() => { setSelectedMonth(monthNum); setSelectedWeek(null); }}
                          style={{ padding: '12px', background: isSelected ? 'var(--accent-color)' : '#f8fafc', color: isSelected ? 'white' : 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>
                          {m}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Week Selector for Weekly */}
                {activeTab === 'weekly' && selectedMonth && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginRight: '10px' }}>Hafta Seçiniz:</span>
                    {(() => {
                      const weeksInMonth = [...new Set((reportData.weekly || []).filter(o => o.Year === selectedYear && o.Month === selectedMonth).map(o => o.WeekNumber))].sort((a,b) => a-b);
                      if (weeksInMonth.length === 0) return <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Bu ayda veri yok.</span>;
                      return weeksInMonth.map((w, index) => (
                        <button 
                          key={w}
                          onClick={() => setSelectedWeek(w)}
                          style={{ padding: '8px 16px', background: selectedWeek === w ? 'var(--accent-color)' : 'white', color: selectedWeek === w ? 'white' : 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                          {index + 1}. Hafta
                        </button>
                      ));
                    })()}
                  </div>
                )}

                {/* Tables */}
                {((activeTab === 'daily') || 
                  (activeTab === 'weekly' && selectedWeek) || 
                  (activeTab === 'monthly' && selectedMonth)) && (
                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '14px' }}>
                        <th style={{ padding: '15px' }}>Dönem</th>
                        <th style={{ padding: '15px' }}>Tur Kapsamı</th>
                        <th style={{ padding: '15px' }}>Yetişkin</th>
                        <th style={{ padding: '15px' }}>Çocuk</th>
                        <th style={{ padding: '15px' }}>Toplam Yolcu</th>
                        <th style={{ padding: '15px' }}>Araç Sayısı</th>
                        <th style={{ padding: '15px' }}>Toplam Kazanç</th>
                        {activeTab !== 'daily' && <th style={{ padding: '15px' }}>Toplam Pass Ücreti</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {/* DAILY ROWS */}
                      {activeTab === 'daily' && (reportData.daily || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((op, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '14px' }}>
                          <td style={{ padding: '15px', fontWeight: '500' }}>{new Date(op.OperationDate).toLocaleDateString('tr-TR')}</td>
                          <td style={{ padding: '15px', fontWeight: '600' }}>{op.TourName}</td>
                          <td style={{ padding: '15px' }}>{op.TotalAdults}</td>
                          <td style={{ padding: '15px' }}>{op.TotalChildren}</td>
                          <td style={{ padding: '15px' }}>
                            <span style={{ padding: '4px 8px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-color)', borderRadius: '6px' }}>{op.TotalPassengers} Kişi</span>
                          </td>
                          <td style={{ padding: '15px' }}><span style={{ fontWeight: '700' }}>{op.TotalVehicles} Araç</span></td>
                          <td style={{ padding: '15px', color: 'var(--success)', fontWeight: '700' }}>{op.TotalEarnings?.toLocaleString()} {op.Currency}</td>
                        </tr>
                      ))}

                      {/* WEEKLY ROWS */}
                      {activeTab === 'weekly' && selectedWeek && (() => {
                        const filtered = (reportData.weekly || []).filter(o => o.Year === selectedYear && o.Month === selectedMonth && o.WeekNumber === selectedWeek);
                        if (filtered.length === 0) return <tr><td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Bu haftada kayıt yok.</td></tr>;
                        return filtered.map((op, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '14px' }}>
                            <td style={{ padding: '15px', fontWeight: '500' }}>{["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"][op.Month-1]} - {op.Year}</td>
                            <td style={{ padding: '15px', fontWeight: '600' }}>{op.TourName}</td>
                            <td style={{ padding: '15px' }}>{op.TotalAdults}</td>
                            <td style={{ padding: '15px' }}>{op.TotalChildren}</td>
                            <td style={{ padding: '15px' }}><span style={{ padding: '4px 8px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-color)', borderRadius: '6px' }}>{op.TotalPassengers} Kişi</span></td>
                            <td style={{ padding: '15px' }}><span style={{ fontWeight: '700' }}>{op.TotalVehicles} Araç</span></td>
                            <td style={{ padding: '15px', color: 'var(--success)', fontWeight: '700' }}>{op.TotalEarnings?.toLocaleString()} {op.Currency}</td>
                            <td style={{ padding: '15px', color: 'var(--error)', fontWeight: '700' }}>{op.TotalPassFee?.toLocaleString()} {op.Currency}</td>
                          </tr>
                        ));
                      })()}

                      {/* MONTHLY ROWS */}
                      {activeTab === 'monthly' && selectedMonth && (() => {
                        const filtered = (reportData.monthly || []).filter(o => o.Year === selectedYear && o.Month === selectedMonth);
                        if (filtered.length === 0) return <tr><td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Bu ayda kayıt yok.</td></tr>;
                        return filtered.map((op, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '14px' }}>
                            <td style={{ padding: '15px', fontWeight: '500' }}>{["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"][op.Month-1]} - {op.Year}</td>
                            <td style={{ padding: '15px', fontWeight: '600' }}>{op.TourName}</td>
                            <td style={{ padding: '15px' }}>{op.TotalAdults}</td>
                            <td style={{ padding: '15px' }}>{op.TotalChildren}</td>
                            <td style={{ padding: '15px' }}><span style={{ padding: '4px 8px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-color)', borderRadius: '6px' }}>{op.TotalPassengers} Kişi</span></td>
                            <td style={{ padding: '15px' }}><span style={{ fontWeight: '700' }}>{op.TotalVehicles} Araç</span></td>
                            <td style={{ padding: '15px', color: 'var(--success)', fontWeight: '700' }}>{op.TotalEarnings?.toLocaleString()} {op.Currency}</td>
                            <td style={{ padding: '15px', color: 'var(--error)', fontWeight: '700' }}>{op.TotalPassFee?.toLocaleString()} {op.Currency}</td>
                          </tr>
                        ));
                      })()}

                      {activeTab === 'daily' && reportData.daily?.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Bu dönemde henüz bir operasyon kaydı bulunmuyor.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {activeTab === 'daily' && Math.ceil((reportData.daily || []).length / itemsPerPage) > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', gap: '15px', borderTop: '1px solid var(--glass-border)' }}>
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--secondary-bg)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '600' }}
                      >Önceki</button>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Sayfa {currentPage} / {Math.ceil((reportData.daily || []).length / itemsPerPage)}</span>
                      <button 
                        disabled={currentPage === Math.ceil((reportData.daily || []).length / itemsPerPage)}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--secondary-bg)', color: currentPage === Math.ceil((reportData.daily || []).length / itemsPerPage) ? 'var(--text-muted)' : 'var(--text-main)', cursor: currentPage === Math.ceil((reportData.daily || []).length / itemsPerPage) ? 'not-allowed' : 'pointer', fontWeight: '600' }}
                      >Sonraki</button>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>

            {/* Yıllık Genel Özet */}
            <div className="glass" style={{ padding: '25px', marginBottom: '40px' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                <PieChart size={20} style={{ marginRight: '10px' }} color="var(--accent-color)" />
                Yıllık Finansal ve Operasyonel Özet
              </h3>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '14px' }}>
                      <th style={{ padding: '15px', width: '15%' }}>Yıl</th>
                      <th style={{ padding: '15px', width: '20%' }}>Toplam Rezervasyon</th>
                      <th style={{ padding: '15px', width: '20%' }}>Aktif Tur Sayısı</th>
                      <th style={{ padding: '15px', width: '20%' }}>Toplam Gelir</th>
                      <th style={{ padding: '15px', width: '20%' }}>Toplam Pass Gideri</th>
                      <th style={{ padding: '15px', width: '5%', textAlign: 'right' }}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyRows.map((yr, idx) => (
                      <React.Fragment key={idx}>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '14px', background: expandedYears[yr.Yil] ? 'rgba(56, 189, 248, 0.02)' : 'transparent' }}>
                          <td style={{ padding: '15px', fontWeight: '700' }}>{yr.Yil}</td>
                          <td style={{ padding: '15px' }}>{yr.ToplamRezervasyon} Adet</td>
                          <td style={{ padding: '15px' }}>{yr.AktifTurSayisi} Farklı Tur</td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {yr.currencies.map((c, i) => (
                                <span key={i} style={{ padding: '4px 8px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', borderRadius: '6px', fontWeight: '600', fontSize: '12px' }}>
                                  {c.ToplamGelir?.toLocaleString()} {c.Currency}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {yr.currencies.map((c, i) => (
                                <span key={i} style={{ padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '6px', fontWeight: '600', fontSize: '12px' }}>
                                  {c.ToplamPassGideri?.toLocaleString()} {c.Currency}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '15px', textAlign: 'right' }}>
                             <button 
                               onClick={() => toggleYearDetail(yr.Yil)}
                               style={{ padding: '6px 12px', background: 'var(--secondary-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s' }}
                             >
                               {expandedYears[yr.Yil] ? 'Gizle' : 'Detay Gör'}
                             </button>
                          </td>
                        </tr>
                        {expandedYears[yr.Yil] && (
                          <tr>
                            <td colSpan="5" style={{ padding: '0' }}>
                              <div style={{ padding: '25px 25px 25px 40px', background: 'rgba(56, 189, 248, 0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                                {yr.currencies.map((currGroup, cgIdx) => (
                                  <div key={cgIdx} style={{ marginBottom: '25px' }}>
                                    <div style={{ fontWeight: '800', color: 'var(--accent-color)', marginBottom: '15px', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                                      <div style={{ width: '4px', height: '14px', background: 'var(--accent-color)', marginRight: '10px', borderRadius: '2px' }}></div>
                                      {currGroup.Currency} Bazında Operasyon Detayları
                                    </div>
                                    <div style={{ overflowX: 'auto', width: '100%' }}>
                                      <div className="table-responsive">
<table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', minWidth: '700px' }}>
                                        <thead>
                                          <tr style={{ color: 'var(--text-muted)', borderBottom: '2px solid rgba(0,0,0,0.05)' }}>
                                            <th style={{ padding: '10px 0', textAlign: 'left', width: '35%' }}>Tur Kapsamı</th>
                                          <th style={{ padding: '10px 0', textAlign: 'left', width: '35%' }}>Otel / Konaklama</th>
                                          <th style={{ padding: '10px 0', textAlign: 'center', width: '15%' }}>Rezervasyon</th>
                                          <th style={{ padding: '10px 0', textAlign: 'right', width: '15%' }}>Net Kazanç</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {currGroup.details.map((detail, dIdx) => (
                                          <tr key={dIdx} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                                            <td style={{ padding: '12px 0', fontWeight: '600', color: 'var(--text-main)' }}>{detail.TourName}</td>
                                            <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>{detail.HotelName}</td>
                                            <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: '600' }}>{detail.ToplamRezervasyon}</td>
                                            <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: '800', color: 'var(--success)' }}>
                                              {detail.ToplamGelir?.toLocaleString()} {detail.Currency}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
</div>
                                  </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {yearlyRows.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Henüz yıllık veri bulunmuyor.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
</div>
              </div>
            </div>

            {/* Finansal Kartlar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {reportData.financial.map((fin, idx) => (
                <div key={idx} className="glass" style={{ padding: '25px', display: 'flex', alignItems: 'center' }}>
                  <div style={{ padding: '15px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '15px', marginRight: '20px' }}>
                    <DollarSign color="#22c55e" size={28} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Toplam Kazanç ({fin.Currency})</p>
                    <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{fin.TotalEarnings?.toLocaleString()} {fin.Currency}</h2>
                    <p style={{ fontSize: '12px', color: 'var(--success)' }}>{fin.TotalBookings} Kayıt</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="reports-grid responsive-grid-2">
              {/* En Çok Satan Turlar */}
              <div className="glass" style={{ padding: '25px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                  <Map size={20} style={{ marginRight: '10px' }} color="var(--accent-color)" />
                  En Çok Tercih Edilen Turlar
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {reportData.tours.map((tour, idx) => (
                    <div key={idx} style={{ 
                      padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ fontWeight: '600' }}>{tour.TourName}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tour.BookingCount} Kayıt</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'var(--success)', fontWeight: '600' }}>{tour.TotalRevenue?.toLocaleString()} {tour.Currency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Şube Performansları */}
              <div className="glass" style={{ padding: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
                    <Building size={20} style={{ marginRight: '10px' }} color="var(--accent-color)" />
                    Şube Performans Analizi
                  </h3>
                  <select 
                    value={officeCurrency} 
                    onChange={e => setOfficeCurrency(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--secondary-bg)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}
                  >
                    {[...new Set((reportData.offices || []).map(o => o.Currency))].map(c => (
                      <option key={c} value={c}>{c} ({c === '€' ? 'EUR' : c === '$' ? 'USD' : 'TRY'})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {(reportData.offices || []).filter(o => o.Currency === officeCurrency).map((office, idx) => (
                    <div key={idx} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                        <span>{office.OfficeName}</span>
                        <span>{office.TotalRevenue?.toLocaleString()} {office.Currency}</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                        <div style={{ 
                          width: `${Math.min((office.TotalRevenue / 50000) * 100, 100)}%`, 
                          height: '100%', 
                          background: 'var(--accent-color)', 
                          borderRadius: '4px',
                          boxShadow: '0 0 10px var(--accent-color)'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="glass" style={{ padding: '25px', marginBottom: '40px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
              <DollarSign size={20} style={{ marginRight: '10px' }} color="var(--error)" />
              Onay Bekleyen Turlar (Kalan Ücretler)
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
              Aşağıdaki rezervasyonlar için kalan ücret (Rest) tahsilatı henüz yapılmamıştır. Tahsilat tamamlandığında onaylayarak genel finansal rapora ekleyebilirsiniz.
            </p>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '14px' }}>
                      <th style={{ padding: '15px' }}>Tarih</th>
                      <th style={{ padding: '15px' }}>Müşteri</th>
                      <th style={{ padding: '15px' }}>Tur & Otel</th>
                      <th style={{ padding: '15px' }}>Alınan (Depozit)</th>
                      <th style={{ padding: '15px' }}>Kalan (Rest)</th>
                      <th style={{ padding: '15px', textAlign: 'right' }}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.pending || []).length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Tüm tahsilatlar onaylanmış, bekleyen işlem bulunmuyor.
                        </td>
                      </tr>
                    ) : (
                      (reportData.pending || []).map((b, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '14px' }}>
                          <td style={{ padding: '15px', fontWeight: '500' }}>{new Date(b.BookingDate).toLocaleDateString('tr-TR')}</td>
                          <td style={{ padding: '15px', fontWeight: '600' }}>{b.TouristName}</td>
                          <td style={{ padding: '15px' }}>
                            <div>{b.TourName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{b.HotelName}</div>
                          </td>
                          <td style={{ padding: '15px', color: 'var(--success)' }}>{b.Earnings?.toLocaleString()} {b.Currency}</td>
                          <td style={{ padding: '15px', color: 'var(--error)', fontWeight: '700' }}>{b.ActualPassFee?.toLocaleString()} {b.Currency}</td>
                          <td style={{ padding: '15px', textAlign: 'right' }}>
                            <button 
                              onClick={() => openConfirmModal(b.BookingID)}
                              style={{ 
                                padding: '8px 16px', background: 'var(--success)', color: 'white', 
                                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600',
                                display: 'inline-flex', alignItems: 'center', gap: '8px'
                              }}>
                              ✓ Onayla
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Custom Confirm Modal - Premium Style */}
        {confirmModal.isOpen && (
          <div className="modal-overlay" style={{ zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
            <div className="modal glass" style={{ 
              width: '90%', maxWidth: '450px', padding: '30px', 
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '24px', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05) inset' 
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '50%', 
                  background: 'rgba(34, 197, 94, 0.1)', border: '2px solid rgba(34, 197, 94, 0.2)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px',
                  boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)'
                }}>
                  <AlertCircle size={32} color="#22c55e" />
                </div>
                
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>Tahsilatı Onayla</h2>
                
                <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: '1.5', marginBottom: '15px' }}>
                  Bu rezervasyonun kalan ücretini (Rest) tahsil ettiğinizi onaylıyor musunuz?
                </p>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '25px', width: '100%' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                    <strong style={{ color: '#e2e8f0' }}>Bilgi:</strong> Onaylandığında bu tutar genel finansal raporlara ve toplam kazanca eklenecektir.
                  </p>
                </div>
                
                <div style={{ display: 'flex', width: '100%', gap: '15px' }}>
                  <button 
                    onClick={closeConfirmModal}
                    style={{ 
                      flex: 1, padding: '12px', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', 
                      cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s',
                      ':hover': { background: 'rgba(255,255,255,0.1)' }
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    Vazgeç
                  </button>
                  <button 
                    onClick={handleConfirmApprove}
                    style={{ 
                      flex: 1, padding: '12px', 
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', 
                      border: 'none', borderRadius: '12px', 
                      cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s',
                      boxShadow: '0 10px 20px -10px rgba(34, 197, 94, 0.5)'
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 25px -10px rgba(34, 197, 94, 0.6)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px -10px rgba(34, 197, 94, 0.5)'; }}
                  >
                    Evet, Onayla
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @media (max-width: 991px) {
            .reports-grid {
              grid-template-columns: 1fr !important;
              gap: 20px !important;
            }
          }
          @media (max-width: 768px) {
            .reports-header {
              text-align: center !important;
            }
            .op-reports-header {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 15px !important;
              text-align: center !important;
            }
            .op-reports-header h3 {
              justify-content: center !important;
            }
            .op-reports-header div {
              justify-content: center !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
};

export default AgencyReports;
