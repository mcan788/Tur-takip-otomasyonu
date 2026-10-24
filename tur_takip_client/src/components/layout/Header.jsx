import React, { useState, useEffect } from 'react';

const Header = ({ user, onLogout }) => {
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    // Check local storage or system preference on load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      setIsLightMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isLightMode) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
      setIsLightMode(false);
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
      setIsLightMode(true);
    }
  };

  return (
    <header className="top-nav">
      <div className="nav-left">
        <h1 className="page-title">Dashboard</h1>
      </div>
      
      <div className="nav-right">
        <button className="btn-icon" onClick={toggleTheme} title="Tema Değiştir" style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '1.2rem', marginRight: '1rem' }}>
          <i className={`fa-solid ${isLightMode ? 'fa-moon' : 'fa-sun'}`}></i>
        </button>

        <div className="nav-user">
          <div className="user-avatar">
            <i className="fa-solid fa-user"></i>
          </div>
          <div className="user-info">
            <span className="user-name">{user?.fullName || user?.username || 'Kullanıcı'}</span>
            <span className="user-role">{user?.role || 'Personel'}</span>
          </div>
        </div>
        
        <button className="btn-logout" onClick={onLogout} title="Çıkış Yap">
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;
