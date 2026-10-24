import React, { useState } from 'react';
import { authService } from '../services/authService';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [agencyId, setAgencyId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pendingToken, setPendingToken] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await authService.login(agencyId, username, password);
      
      if (data.mustChangePassword) {
        setRequiresPasswordChange(true);
        setPendingToken(data.token);
      } else {
        onLoginSuccess(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await authService.changePassword(agencyId, pendingToken, newPassword);
      // After successful password change, proceed with login using the token
      onLoginSuccess({ token: pendingToken });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (requiresPasswordChange) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Zorunlu Şifre Değişikliği</h2>
          <p>Güvenliğiniz için ilk girişte şifrenizi değiştirmeniz gerekmektedir.</p>
          
          {error && <div className="alert alert-error">{error}</div>}
          
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Yeni Şifre</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 8 karakter"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo">
          <span>ZYRONOVA MASTER</span>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Acente/Şirket ID</label>
            <input 
              type="text" 
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
              placeholder="Örn: 1001 veya yonetim"
              required
            />
          </div>
          <div className="form-group">
            <label>Kullanıcı Adı</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adınız"
              required
            />
          </div>
          <div className="form-group">
            <label>Şifre</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
