import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { DollarSign, PieChart, Users } from 'lucide-react';
import api from '../services/api';

const SuperAdminReports = () => {
  const [reportData, setReportData] = useState([]);
  const [agencies, setAgencies] = useState([]); // Son ödemeler için
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const response = await api.get('/super-admin/agencies');
      const data = response.data;
      setAgencies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Acenteler çekilemedi:', error);
    }
  };

  const fetchReport = async () => {
    try {
      const response = await api.get('/super-admin/report');
      const data = response.data;
      if (data.error) {
        console.error('Sunucu hatası:', data.error);
        setReportData([]);
      } else {
        setReportData(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Rapor verileri çekilemedi:', error);
      setReportData([]);
      setLoading(false);
    }
  };

  return (
    <div className="page-layout">
      <Sidebar type="super" />
      <main className="page-main">
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px' }}>Finansal Raporlar (SüperAdmin)</h1>
          <p style={{ color: 'var(--text-muted)' }}>Acentelerden elde edilen toplam lisans ve abonelik gelirleri.</p>
        </header>

        <div className="super-reports-grid" style={{ marginBottom: '40px' }}>
          <div className="glass" style={{ padding: '25px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
              <DollarSign size={20} style={{ marginRight: '10px' }} color="var(--success)" />
              Modül Gelir Dağılımı
            </h3>
            {reportData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Henüz veri bulunmuyor.</p>
            ) : reportData.map((item, idx) => (
               <div key={idx} style={{ 
                 padding: '15px', 
                 background: 'rgba(255,255,255,0.02)', 
                 borderRadius: '10px',
                 marginBottom: '10px'
               }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                   <span>{item.ModuleType === 'TOUR' ? 'Tur Takip Sistemi' : 'Rent A Car'}</span>
                   <span style={{ fontWeight: '600', color: 'var(--success)' }}>+₺{item.TotalRevenue || 0}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                   <span>Altyapı Gideri</span>
                   <span style={{ color: '#ef4444' }}>-₺{(item.TotalRevenue * 0.1).toFixed(2)}</span>
                 </div>
               </div>
            ))}
          </div>

          <div className="glass" style={{ padding: '25px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
              <Users size={20} style={{ marginRight: '10px' }} color="var(--accent-color)" />
              Acente Sayıları
            </h3>
            {reportData.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>{item.ModuleType === 'TOUR' ? 'Tur Takip Sistemi' : 'Rent A Car'}</span>
                  <span>{item.AgencyCount} Acente</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                  <div style={{ width: `${(item.AgencyCount / 50) * 100}%`, height: '100%', background: 'var(--accent-color)', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass" style={{ padding: '25px' }}>
          <h3 style={{ marginBottom: '20px' }}>Son Ödemeler</h3>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '15px' }}>Acente</th>
                  <th style={{ padding: '15px' }}>Modül</th>
                  <th style={{ padding: '15px' }}>Süre</th>
                  <th style={{ padding: '15px' }}>Tutar</th>
                  <th style={{ padding: '15px' }}>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {agencies.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Henüz ödeme kaydı bulunmuyor.</td>
                  </tr>
                ) : agencies.slice(0, 5).map((agency) => (
                  <tr key={agency.AgencyID} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '15px' }}>{agency.AgencyName}</td>
                    <td style={{ padding: '15px' }}>{agency.ModuleType}</td>
                    <td style={{ padding: '15px' }}>{agency.LicenseExpiryDate ? 'Aktif' : '-'}</td>
                    <td style={{ padding: '15px', color: 'var(--success)' }}>₺{agency.LicensePrice}</td>
                    <td style={{ padding: '15px' }}>{new Date(agency.CreatedAt).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          </div>
        </div>

        <style>{`
          .super-reports-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
          }
          @media (max-width: 900px) {
            .super-reports-grid {
              grid-template-columns: 1fr !important;
              gap: 20px !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
};

export default SuperAdminReports;
