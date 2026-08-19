import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AgencyLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [agencyId, setAgencyId] = useState(null);
  const [pendingData, setPendingData] = useState(null);
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
      
      alert("DEBUG: targetModule is " + data.targetModule);

      if (data.targetModule === 'MASTER' || data.targetModule === 'RENT_A_CAR') {
        alert("Redirecting to: " + `http://localhost:5001/sso-login?token=${data.token}`);
        window.location.href = `http://localhost:5001/sso-login?token=${data.token}`;
        return;
      }

      if (data.role === 'SUPERADMIN') {
        setError('Bu sayfa sadece Acente Girişi içindir. Merkez/Yönetici personeli iseniz lütfen ana giriş sayfasını kullanın.');
        return;
      }

      if (data.role !== 'AGENCY' && !data.isStaff) {
        setError('Bu panelden sadece yetkili kullanıcılar giriş yapabilir.');
        return;
      }

      if (data.mustChangePassword) {
        setAgencyId(data.agencyId);
        setPendingData(data);
        setMustChange(true);
      } else {
        saveLoginData(data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
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
      saveLoginData(data);
    } catch (err) {
      setError(err.response?.data?.error || '2FA doğrulama kodu hatalı veya süresi dolmuş.');
    }
  };

  const saveLoginData = (data) => {
    localStorage.clear();
    localStorage.setItem('agencyId', String(data.agencyId));
    localStorage.setItem('token', data.token);
    localStorage.setItem('agencyName', data.agencyName || '');
    localStorage.setItem('username', data.username || '');
    localStorage.setItem('fullName', data.fullName || '');
    localStorage.setItem('role', data.role);
    localStorage.setItem('isBranch', String(data.isBranch || 'false')); 
    localStorage.setItem('assignedOfficeId', String(data.assignedOfficeId || ''));
    if (data.isStaff) {
      localStorage.setItem('isStaff', 'true');
      localStorage.setItem('staffId', String(data.staffId));
      if (data.permissions) {
        localStorage.setItem('permissions', JSON.stringify(data.permissions));
      }
    }
    navigate('/agency');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    try {
      const response = await api.post('/auth/change-password', 
        { agencyId, newPassword },
        { headers: { Authorization: `Bearer ${pendingData.token}` } }
      );
      
      if (response.status === 200) {
        setMustChange(false);
        if (pendingData) {
          saveLoginData(pendingData);
        } else {
          navigate('/agency');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Şifre güncellenirken bir hata oluştu.');
    }
  };

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setForgotSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      if (response.status === 200) {
        setError(data.error || 'Bilinmeyen bir hata oluştu.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
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
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '8px' }}>Acente Girişi</h2>
          <p style={{ color: '#64748b' }}>Devam etmek için hesabınıza giriş yapın</p>
        </div>

        {error && !showForgot && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#ef4444', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '20px', 
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {!mustChange ? (
          <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Kullanıcı Adı</label>
              <input 
                type="text" 
                name="agency_username_field"
                id="agency_username_field"
                autoComplete="off"
                placeholder="Kullanıcı Adı" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Şifre</label>
              <input 
                type="password" 
                name="agency_password_field"
                id="agency_password_field"
                autoComplete="new-password"
                placeholder="Şifre" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={() => setShowForgot(true)}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '13px', cursor: 'pointer' }}
              >
                Şifremi Unuttum
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '10px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '15px' }}>
            <p style={{ color: '#3b82f6', fontSize: '14px', marginBottom: '10px', textAlign: 'center' }}>
              Güvenliğiniz için lütfen yeni bir şifre belirleyin.
            </p>
            <input 
              type="password" 
              placeholder="Yeni Şifre (En az 8 Karakter)" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required 
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Şifreyi Güncelle ve Giriş Yap
            </button>
          </form>
        )}

      </div>

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

      {showForgot && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Şifre Sıfırlama</h3>
            
            {forgotSuccess ? (
              <div>
                <p style={{ color: '#10b981', fontSize: '15px', marginBottom: '20px' }}>{forgotSuccess}</p>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowForgot(false)}>Giriş Ekranına Dön</button>
              </div>
            ) : (
              <form onSubmit={handleForgot}>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                  Hesabınıza bağlı e-posta adresini girin, size yeni bir şifre oluşturalım.
                </p>
                {error && (
                  <div style={{ background: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>
                    {error}
                  </div>
                )}
                <input 
                  type="email" 
                  placeholder="E-posta Adresiniz" 
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '10px' }}>Yeni Şifre Al</button>
                <button type="button" className="btn" onClick={() => setShowForgot(false)} style={{ width: '100%' }}>İptal</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyLogin;
