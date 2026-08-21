import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [agencyId, setAgencyId] = useState(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', { username, password });
      const data = response.data;
      
      if (data.require2FA) {
        setTempToken(data.tempToken);
        setShow2FA(true);
        return;
      }
      
      

      const roleUpper = (data.role || '').toUpperCase();
      const isMasterAdmin = roleUpper === 'SUPERADMIN' || roleUpper === 'ADMIN' || data.targetModule === 'MASTER';
      
      if (isMasterAdmin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        navigate('/super-admin/module-selector');
      } else if (data.targetModule === 'RENT_A_CAR') {
        const isLocal = window.location.port === '3000' || window.location.port === '5173' || window.location.port === '5174';
        const baseUrl = isLocal ? `http://${window.location.hostname}:5001` : '';
        window.location.href = `${baseUrl}/sso-login?token=${data.token}`;
      } else {
        setError('Bu panel sadece Yönetim/Merkez personeli içindir. Acente sahibiyseniz lütfen /acente-giris sayfasını kullanın.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/2fa/login', { tempToken, otpCode });
      const data = response.data;
      setShow2FA(false);
      localStorage.setItem('token', data.token);
      navigate('/super-admin/module-selector');
    } catch (err) {
      setError(err.response?.data?.error || '2FA doğrulama kodu hatalı veya süresi dolmuş.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    try {
      const response = await api.post('/auth/change-password', { agencyId, newPassword });
      
      if (response.status === 200) {
        setMustChange(false);
        navigate('/super-admin/module-selector');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Şifre değiştirilemedi.');
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      if (response.status === 200) {
        setForgotSuccess(response.data.message || 'Geçici şifreniz e-posta adresinize gönderildi.');
      }
    } catch (err) {
      setForgotError(err.response?.data?.error || 'Sıfırlama işlemi başarısız.');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{ 
        padding: '40px', 
        width: '100%', 
        maxWidth: '400px', 
        textAlign: 'center',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '8px' }}>Süper Admin Girişi</h2>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>Yönetim Merkezine Hoş Geldiniz</p>
        
        {error && (
          <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '14px', background: '#fee2e2', padding: '10px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {!mustChange ? (
          <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'grid', gap: '15px' }}>
            <input 
              type="text" 
              name="super_username_field"
              id="super_username_field"
              autoComplete="off"
              placeholder="Kullanıcı Adı" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
            <input 
              type="password" 
              name="super_password_field"
              id="super_password_field"
              autoComplete="new-password"
              placeholder="Şifre" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '10px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '15px' }}>
            <p style={{ color: '#3b82f6', fontSize: '14px', marginBottom: '5px' }}>
              Lütfen yeni bir şifre belirleyin.
            </p>
            <input 
              type="password" 
              placeholder="Yeni Şifre" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required 
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Şifreyi Güncelle
            </button>
          </form>
        )}

        <button 
          onClick={() => { setShowForgot(true); setForgotError(''); setForgotSuccess(''); setForgotEmail(''); }}
          style={{ background: 'transparent', border: 'none', color: '#64748b', marginTop: '20px', cursor: 'pointer', fontSize: '13px' }}
        >
          Şifremi Unuttum?
        </button>
        
        {showForgot && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Şifre Sıfırlama</h3>
              
              {forgotSuccess ? (
                <div>
                  <p style={{ color: '#10b981', fontSize: '14px', margin: '15px 0' }}>{forgotSuccess}</p>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setShowForgot(false); setForgotSuccess(''); setForgotEmail(''); }}>Kapat</button>
                </div>
              ) : (
                <form onSubmit={handleForgot}>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '15px 0' }}>Hesabınıza bağlı e-posta adresini girin.</p>
                  {forgotError && (
                    <div style={{ color: '#ef4444', marginBottom: '10px', fontSize: '12px', background: '#fee2e2', padding: '8px', borderRadius: '6px' }}>
                      {forgotError}
                    </div>
                  )}
                  <input 
                    type="email" 
                    placeholder="E-posta Adresiniz" 
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required 
                  />
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Şifre Sıfırlama Bağlantısı Gönder</button>
                  <button type="button" className="btn" style={{ width: '100%', marginTop: '5px', background: '#e2e8f0', color: '#475569' }} onClick={() => { setShowForgot(false); setForgotSuccess(''); setForgotEmail(''); }}>İptal</button>
                </form>
              )}
            </div>
          </div>
        )}

        {show2FA && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
          }}>
            <div className="modal-content" style={{
              background: '#ffffff', padding: '30px', borderRadius: '16px',
              maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '2.5rem', color: '#2563eb', marginBottom: '10px' }}>🛡️</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '8px', color: '#0f172a' }}>2FA Doğrulama Kodu</h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                Authenticator uygulamanızdaki 6 haneli kodu veya 8 haneli kurtarma kodunuzu girin.
              </p>
              {error && (
                <div style={{ background: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleVerify2FA}>
                <input 
                  type="text" 
                  maxLength="9"
                  placeholder="000000 veya A1B2-C3D4" 
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase())}
                  style={{ 
                    textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.2em', 
                    padding: '10px', marginBottom: '20px', width: '100%', fontWeight: 'bold' 
                  }}
                  autoFocus
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontWeight: 'bold', fontSize: '15px' }}>
                  Doğrula ve Giriş Yap
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShow2FA(false); setError(''); setOtpCode(''); }} 
                  style={{ background: 'none', border: 'none', color: '#64748b', marginTop: '15px', cursor: 'pointer', fontSize: '14px' }}
                >
                  İptal
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

