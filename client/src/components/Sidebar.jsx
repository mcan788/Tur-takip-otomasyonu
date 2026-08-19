import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Map, Hotel, FileText, Settings, LogOut, Shield, Car, Menu, X, Headphones } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../services/api';

const Sidebar = ({ type }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dynamicPerms, setDynamicPerms] = useState(null);
  const [agencyInfo, setAgencyInfo] = useState({
    name: 'Acente Paneli',
    isBranch: false
  });

  useEffect(() => {
    const name = localStorage.getItem('agencyName') || 'Acente Paneli';
    const isBranchRaw = localStorage.getItem('isBranch');
    const assignedOfficeId = localStorage.getItem('assignedOfficeId');
    const branchStatus = isBranchRaw === 'true' || isBranchRaw === '1' || isBranchRaw === true || (assignedOfficeId && assignedOfficeId !== '' && assignedOfficeId !== 'null');
    setAgencyInfo({ name, isBranch: branchStatus });

    // Dinamik yetki güncellemesi: Sayfa yenilendiğinde güncel yetkileri al
    if (localStorage.getItem('role') === 'PERSONEL') {
      api.get('/auth/me')
        .then(res => {
          if (res.data && res.data.permissions) {
            localStorage.setItem('permissions', JSON.stringify(res.data.permissions));
            setDynamicPerms(res.data.permissions);
          }
        })
        .catch(err => console.error("Could not fetch latest perms:", err));
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const agencyName = agencyInfo.name;
  const isBranch = agencyInfo.isBranch;
  const userRole = localStorage.getItem('role') || 'AGENCY';
  const username = localStorage.getItem('username') || '';
  const fullName = localStorage.getItem('fullName') || username;
  const adminToken = localStorage.getItem('token') || '';

  const adminLinks = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/super-admin' },
    { name: 'Acenteler', icon: <Users size={20} />, path: '/super-admin/agencies' },
    { name: 'Raporlar', icon: <FileText size={20} />, path: '/super-admin/reports' },
    { name: 'Destek Talepleri', icon: <Headphones size={20} />, path: '/super-admin/support' },
    { name: 'Rent A Car SaaS', icon: <Car size={20} />, path: '/sso-login' },
  ];

  let perms = null;
  try { 
    perms = JSON.parse(localStorage.getItem('permissions') || 'null'); 
    
    // Güvenlik / Fallback: Eğer localStorage'da permission yoksa ama token'da varsa oradan al.
    if (!perms) {
      const token = localStorage.getItem('token');
      if (token) {
        const base64Url = token.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const payload = JSON.parse(jsonPayload);
          
          if (payload && payload.permissions) {
            perms = payload.permissions;
            localStorage.setItem('permissions', JSON.stringify(perms));
          }
        }
      }
    }
  } catch (e) {
    console.error('Error parsing permissions:', e);
  }

  const hasPerm = (permName) => {
    if (userRole !== 'PERSONEL') return true;
    const activePerms = dynamicPerms || perms;
    if (!activePerms) return false;
    return !!activePerms[permName] || String(activePerms[permName]).toLowerCase() === 'true';
  };

  const agencyLinks = [
    { name: 'Genel Bakış', icon: <LayoutDashboard size={20} />, path: '/agency' },
    ...(hasPerm('manage_tours') || hasPerm('view_tours') ? [{ name: 'Tur Tanımları', icon: <Map size={20} />, path: '/agency/tour-management' }] : []),
    ...(hasPerm('manage_bookings') || hasPerm('view_tours') ? [{ name: 'Tur Kayıtları', icon: <FileText size={20} />, path: '/agency/tours' }] : []),
    ...(!isBranch && hasPerm('manage_offices') ? [{ name: 'Ofisler', icon: <Hotel size={20} />, path: '/agency/offices' }] : []),
    ...(hasPerm('manage_personnel') ? [{ name: 'Personeller', icon: <Users size={20} />, path: '/agency/personnel' }] : []),
    ...(hasPerm('view_reports') ? [{ name: 'Raporlar', icon: <FileText size={20} />, path: '/agency/reports' }] : []),
    { name: 'Destek Talepleri', icon: <Headphones size={20} />, path: '/agency/support' },
    { name: 'Profil & Ayarlar', icon: <Settings size={20} />, path: '/agency/profile' },
  ];

  const links = type === 'super' ? adminLinks : agencyLinks;

  return (
    <>
      <style>{`
        .mobile-header-bar {
          display: none;
        }
        .sidebar-container {
          width: 260px;
          min-width: 260px;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          padding: 20px;
          z-index: 100;
          background: var(--secondary-bg);
          border-right: 1px solid var(--border-color);
          flex-shrink: 0;
          overflow-y: auto;
          /* GPU compositor — left yerine transform kullan */
          will-change: transform;
          transform: translateX(0);
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mobile-close-btn { display: none; }

        @media (max-width: 768px) {
          .mobile-header-bar {
            display: flex !important;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 56px;
            background: var(--secondary-bg);
            border-bottom: 1px solid var(--border-color);
            padding: 0 16px;
            align-items: center;
            justify-content: space-between;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .sidebar-container {
            position: fixed !important;
            top: 0;
            left: 0 !important;
            height: 100vh;
            width: 260px !important;
            z-index: 1200;
            padding-top: 16px;
            overflow-y: auto;
            /* left yerine transform: daha hızlı, GPU'da */
            transform: translateX(-280px);
            will-change: transform;
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
                        box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: none;
          }
          .sidebar-container.mobile-open {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0,0,0,0.15);
          }
          .mobile-close-btn {
            display: flex !important;
            justify-content: flex-end;
            margin-bottom: 10px;
          }
          .main-content-area {
            padding-top: 56px !important;
          }
        }
      `}</style>

      {/* MOBİL TOP HEADER - Sadece mobilde görünür */}
      <div className="mobile-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px', height: '10px',
            border: '2px solid var(--accent-color)',
            transform: 'rotate(45deg)', borderRadius: '2px'
          }} />
          <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Zyronova <span style={{ color: 'var(--accent-color)' }}>SaaS</span>
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* BACKDROP - Menü açıkken arka plan karartma */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100 }}
        />
      )}

      {/* SİDEBAR */}
      <div className={`sidebar-container sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="mobile-close-btn">
          <button onClick={() => setMobileOpen(false)} aria-label="Menüyü kapat" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px' }}>
            Zyronova SaaS
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {type === 'super' ? 'Sistem Yönetim Merkezi' : 'Acente Yönetim Portalı'}
          </p>

          {type === 'agency' && (
            <div style={{ marginTop: '15px', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#f8fafc' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>{agencyName}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Users size={14} /> <span>{fullName}</span>
                </div>
                <span>@{username}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: isBranch ? '#e0e7ff' : '#dcfce7', color: isBranch ? '#4338ca' : '#166534', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>
                <Shield size={12} /> {isBranch ? 'ŞUBE PANELİ' : 'ANA OFİS'}
              </div>
            </div>
          )}

          {type === 'super' && (
            <div style={{ marginTop: '15px', padding: '15px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>
                <Shield size={16} /> SÜPER ADMİN
              </div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1 }}>
          {links.map((link, index) => {
            if (link.external) {
              return (
                <a key={index} href={link.path}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px 15px', 
                    color: 'var(--text-main)', 
                    textDecoration: 'none', 
                    borderRadius: '12px', 
                    marginBottom: '8px', 
                    background: 'transparent', 
                    transition: 'background-color 0.12s cubic-bezier(0.4,0,0.2,1), color 0.12s cubic-bezier(0.4,0,0.2,1)',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setMobileOpen(false)}
                >
                  <span style={{ marginRight: '12px', color: 'var(--accent-color)' }}>{link.icon}</span>
                  {link.name}
                </a>
              );
            }
            return (
              <NavLink key={index} to={link.path}
                end={link.path === '/super-admin' || link.path === '/agency'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', padding: '12px 15px',
                  color: isActive ? 'var(--accent-color)' : 'var(--text-main)',
                  textDecoration: 'none', borderRadius: '12px', marginBottom: '8px',
                  background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(59,130,246,0.15)' : '1px solid transparent',
                  transition: 'background-color 0.12s cubic-bezier(0.4,0,0.2,1), color 0.12s cubic-bezier(0.4,0,0.2,1)',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                })}
                onClick={() => setMobileOpen(false)}
              >
                <span style={{ marginRight: '12px' }}>{link.icon}</span>
                {link.name}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <button className="btn" onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', color: 'var(--error)', background: 'transparent', width: '100%', padding: '12px', border: 'none', cursor: 'pointer' }}
          >
            <LogOut size={20} style={{ marginRight: '12px' }} />
            Çıkış Yap
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
