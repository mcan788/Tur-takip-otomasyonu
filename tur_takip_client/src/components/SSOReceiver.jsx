import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SSOReceiver = ({ onLoginSuccess, targetRoute = '/dashboard' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = React.useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Geçersiz token formatı. (JWT 3 parçadan oluşmalı)');
        }
        
        const base64Url = parts[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        
        // Pad with '=' to make length a multiple of 4
        while (base64.length % 4 !== 0) {
          base64 += '=';
        }
        
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);
        
        const userData = {
          token,
          ...decoded,
          fullName: decoded.fullName || decoded.username || 'Admin'
        };
        
        onLoginSuccess(userData);
        
        setTimeout(() => {
          navigate(targetRoute, { replace: true });
        }, 100);
        
      } catch (e) {
        console.error("SSO Token parse error:", e);
        setErrorMsg(e.toString() + ' | Token: ' + token.substring(0, 20) + '...');
      }
    } else {
      setErrorMsg('URL içerisinde token bulunamadı.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (errorMsg) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        <div style={{ textAlign: 'center', background: 'var(--panel)', padding: '2rem', borderRadius: '12px' }}>
          <i className="fa-solid fa-triangle-exclamation fa-2x" style={{ color: 'var(--pink)', marginBottom: '1rem' }}></i>
          <h2 style={{ marginBottom: '1rem' }}>SSO Geçiş Hatası</h2>
          <p style={{ color: 'var(--pink)', marginBottom: '2rem' }}>{errorMsg}</p>
          <button className="btn-primary" onClick={() => navigate('/login', { replace: true })}>Giriş Sayfasına Dön</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: 'var(--bg)', 
      color: 'var(--text)',
      fontFamily: 'var(--font-inter)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--blue)', marginBottom: '1rem' }}></i>
        <h2>Güvenli Giriş Yapılıyor...</h2>
        <p style={{ color: 'var(--muted)' }}>Master hesaptan geçiş sağlanıyor, lütfen bekleyin.</p>
      </div>
    </div>
  );
};

export default SSOReceiver;
