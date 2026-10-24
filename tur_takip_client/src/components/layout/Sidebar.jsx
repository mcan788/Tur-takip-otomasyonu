import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ user }) => {
  const rentACarUrl = `http://localhost:5001/sso-login?token=${user?.token || ''}&returnUrl=${encodeURIComponent(window.location.origin)}`;
  const isSuperAdmin = user?.role === 'SUPERADMIN' || user?.role === 'Admin';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="logo">
          ZYRONOVA<span className="logo-accent">MASTER</span>
        </h2>
      </div>
      
      <div className="sidebar-menu">
        <div className="menu-group">
          <span className="menu-title">ANA MENÜ</span>
          <NavLink to="/dashboard" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <i className="fa-solid fa-chart-pie"></i>
            <span>Dashboard</span>
          </NavLink>
        </div>
        
        {isSuperAdmin ? (
          <>
            <div className="menu-group">
              <span className="menu-title">SİSTEM YÖNETİMİ</span>
              <NavLink to="/agencies" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                <i className="fa-solid fa-building"></i>
                <span>Acenteler</span>
              </NavLink>
              <NavLink to="/licenses" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                <i className="fa-solid fa-key"></i>
                <span>Lisanslar</span>
              </NavLink>
            </div>
            
            <div className="menu-group">
              <span className="menu-title">AYARLAR</span>
              <NavLink to="/system-settings" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                <i className="fa-solid fa-server"></i>
                <span>Sistem Ayarları</span>
              </NavLink>
            </div>
          </>
        ) : (
          <>
            <div className="menu-group">
              <span className="menu-title">OPERASYON</span>
              <NavLink to="/tours" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                <i className="fa-solid fa-route"></i>
                <span>Turlar</span>
              </NavLink>
              <NavLink to="/reservations" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                <i className="fa-solid fa-ticket"></i>
                <span>Rezervasyonlar</span>
              </NavLink>
              <NavLink to="/vehicles" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                <i className="fa-solid fa-van-shuttle"></i>
                <span>Araçlar</span>
              </NavLink>
            </div>
            
            <div className="menu-group">
              <span className="menu-title">YÖNETİM</span>
              <NavLink to="/staff" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                <i className="fa-solid fa-users"></i>
                <span>Personeller</span>
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                <i className="fa-solid fa-gear"></i>
                <span>Ayarlar</span>
              </NavLink>
            </div>
          </>
        )}

        <div className="menu-group">
          <span className="menu-title">DİĞER MODÜLLER</span>
          <a href={rentACarUrl} className="menu-item" style={{ color: 'var(--blue)' }}>
            <i className="fa-solid fa-car" style={{ color: 'var(--blue)' }}></i>
            <span>Rent A Car Geçiş</span>
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
