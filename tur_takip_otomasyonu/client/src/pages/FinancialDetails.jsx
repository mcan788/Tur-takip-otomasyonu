import React, { useState, useEffect } from 'react';
import { FileText, ArrowUpCircle, ArrowDownCircle, Briefcase, Tag, Calendar, Printer } from 'lucide-react';
import api from '../services/api';

const FinancialDetails = () => {
  const [data, setData] = useState({ categories: [], tours: [], expenses: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFullReport();
  }, []);

  const fetchFullReport = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const officeId = urlParams.get('officeId');
      const targetAgencyId = urlParams.get('agencyId');

      let endpoint = '/agency/full-report';
      if (officeId) {
        endpoint += `?officeId=${officeId}`;
        if (targetAgencyId) endpoint += `&agencyId=${targetAgencyId}`;
      }

      const response = await api.get(endpoint);
      if (response.status === 200) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Full rapor alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', color: '#64748b' }}>
       <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ marginBottom: '15px' }}></div>
          Rapor Hazırlanıyor...
       </div>
    </div>
  );

  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh', color: '#1e293b', fontFamily: "'Inter', sans-serif" }}>
      <header className="financial-header responsive-flex-header">
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', letterSpacing: '-0.5px' }}>Detaylı Mali Analiz ve Kar/Zarar Raporu</h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>İşletmenizin kategori ve tur bazlı finansal dökümü.</p>
        </div>
        <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 25px', borderRadius: '12px', fontWeight: '700', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2)' }}>
          <Printer size={18} />
          Raporu Yazdır
        </button>
      </header>

      {/* Bölge Bazlı Özet */}
      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: '#e0f2fe', borderRadius: '10px', color: '#0284c7' }}><Tag size={20} /></div> 
          Bölge Bazlı Performans ({data.officeName || 'Tüm Bölgeler'})
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
          {data.categories.map((item, idx) => (
            <div key={idx} style={{ padding: '25px', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ marginBottom: '20px', color: '#0284c7', fontWeight: '800', fontSize: '18px' }}>{item.Region || 'Bölge Belirtilmedi'}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Toplam Gelir</span>
                <span style={{ color: '#16a34a', fontWeight: '800' }}>+{(item.TotalIncome || 0).toLocaleString()} {item.Currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Toplam Gider</span>
                <span style={{ color: '#dc2626', fontWeight: '800' }}>-{(item.TotalExpense || 0).toLocaleString()} {item.Currency}</span>
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#334155' }}>Net Kar</span>
                <span style={{ 
                  color: (item.TotalIncome - item.TotalExpense) >= 0 ? '#16a34a' : '#dc2626', 
                  fontWeight: '900', fontSize: '22px' 
                }}>
                  {(item.TotalIncome - item.TotalExpense).toLocaleString()} {item.Currency}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tur Bazlı Detaylar Tablosu */}
      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '10px', color: '#16a34a' }}><Briefcase size={20} /></div>
          Tur Bazlı Mali Tablo
        </h2>
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '20px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>TUR ADI</th>
                  <th style={{ padding: '20px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>KATEGORİ</th>
                  <th style={{ padding: '20px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>TOPLAM GELİR</th>
                  <th style={{ padding: '20px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>TOPLAM GİDER</th>
                  <th style={{ padding: '20px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>DURUM</th>
                </tr>
              </thead>
              <tbody>
                {data.tours.map((tour, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '20px', fontWeight: '700', color: '#0f172a' }}>{tour.TourName}</td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ padding: '6px 12px', background: '#eff6ff', borderRadius: '20px', fontSize: '12px', color: '#1d4ed8', fontWeight: '700' }}>
                        {tour.Category || 'Genel'}
                      </span>
                    </td>
                    <td style={{ padding: '20px', color: '#16a34a', fontWeight: '800' }}>{tour.Income?.toLocaleString()} {tour.Currency}</td>
                    <td style={{ padding: '20px', color: '#dc2626', fontWeight: '800' }}>-{tour.Expense?.toLocaleString() || 0} {tour.Currency}</td>
                    <td style={{ padding: '20px' }}>
                      {((tour.Income || 0) - (tour.Expense || 0)) > 0 ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f0fdf4', color: '#16a34a', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                          <ArrowUpCircle size={14} /> Kar Pozisyonunda
                        </div>
                      ) : ((tour.Income || 0) - (tour.Expense || 0)) < 0 ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                          <ArrowDownCircle size={14} /> Zarar Pozisyonunda
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f1f5f9', color: '#64748b', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                          Nötr
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          </div>
        </div>
      </section>

      {/* Gider Dökümü */}
      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: '#fef2f2', borderRadius: '10px', color: '#dc2626' }}><ArrowDownCircle size={20} /></div>
          Detaylı Gider Hareketleri
        </h2>
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '20px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>TARİH</th>
                  <th style={{ padding: '20px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>AÇIKLAMA</th>
                  <th style={{ padding: '20px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>KATEGORİ</th>
                  <th style={{ padding: '20px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>ŞUBE</th>
                  <th style={{ padding: '20px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>TUTAR</th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((exp, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '20px', color: '#64748b', fontWeight: '600' }}>{new Date(exp.ExpenseDate).toLocaleDateString('tr-TR')}</td>
                    <td style={{ padding: '20px', fontWeight: '700', color: '#334155' }}>{exp.Description}</td>
                    <td style={{ padding: '20px' }}>
                       <span style={{ padding: '4px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12px', color: '#475569', fontWeight: '600' }}>{exp.Category}</span>
                    </td>
                    <td style={{ padding: '20px', color: '#64748b' }}>{exp.OfficeName}</td>
                    <td style={{ padding: '20px', color: '#dc2626', fontWeight: '900' }}>-{exp.Amount?.toLocaleString()} {exp.Currency}</td>
                  </tr>
                ))}
                {data.expenses.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>Kayıtlı gider bulunmuyor.</td>
                  </tr>
                )}
              </tbody>
            </table>
</div>
          </div>
        </div>
      </section>
      {/* Genel Toplam Özeti */}
      <section style={{ marginTop: '60px', padding: '40px', background: '#0f172a', borderRadius: '32px', color: 'white', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
           <div style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}><FileText size={24} /></div>
           Genel Finansal Özet ({data.officeName || 'Tüm Bölgeler'})
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
          {/* Benzersiz döviz birimlerini bul ve her biri için toplam hesapla */}
          {[...new Set([...data.categories.map(item => item.Currency), ...data.expenses.map(item => item.Currency)])].map(curr => {
            const income = data.categories.filter(item => item.Currency === curr).reduce((acc, val) => acc + val.TotalIncome, 0);
            const expense = data.expenses.filter(item => item.Currency === curr).reduce((acc, val) => acc + val.Amount, 0);
            return (
              <div key={curr} style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: '700', marginBottom: '15px', textTransform: 'uppercase' }}>TOPLAM ({curr})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px' }}>Brüt Gelir:</span>
                    <span style={{ color: '#4ade80', fontWeight: '800' }}>+{income.toLocaleString()} {curr}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px' }}>Toplam Gider:</span>
                    <span style={{ color: '#f87171', fontWeight: '800' }}>-{expense.toLocaleString()} {curr}</span>
                  </div>
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700' }}>Net Kar:</span>
                    <span style={{ color: (income - expense) >= 0 ? '#4ade80' : '#f87171', fontSize: '20px', fontWeight: '900' }}>
                      {(income - expense).toLocaleString()} {curr}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <style>{`
        @media (max-width: 768px) {
          .financial-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 15px !important;
            text-align: center !important;
          }
          .financial-header button {
            justify-content: center !important;
          }
        }
        @media print {
          body {
            background-color: white !important;
          }
          .table-responsive {
            overflow: visible !important;
          }
          table {
            width: 100% !important;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th, td {
            padding: 10px !important;
          }
          section {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            padding: 20px !important;
            page-break-inside: avoid;
            background: white !important;
            color: black !important;
          }
          .financial-header button {
            display: none !important;
          }
          h1, h2, h3, h4, p, span {
            color: black !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FinancialDetails;
