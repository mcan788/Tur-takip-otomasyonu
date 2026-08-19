import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { 
  User, 
  Shield, 
  Lock, 
  Save, 
  AlertCircle, 
  QrCode, 
  CheckCircle2, 
  X, 
  Copy, 
  Check, 
  Smartphone, 
  ShieldCheck, 
  ShieldAlert,
  KeyRound,
  Key,
  Power
} from 'lucide-react';

const Profile = () => {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);

  // 2FA State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [setupData, setSetupData] = useState({ secret: '', qrUrl: '', otpauthUrl: '' });
  const [otpCode, setOtpCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFASuccess, setTwoFASuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    fetchUserData(abortController.signal);
    return () => {
      abortController.abort(); // Unmount durumunda istekleri iptal et (Memory Leak Koruması)
    };
  }, []);

  const fetchUserData = async (signal) => {
    try {
      const res = await api.get('/auth/me', { signal });
      if (res.data) {
        setIs2FAEnabled(!!res.data.isTwoFactorEnabled);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.message !== 'canceled') {
        console.error('Kullanıcı bilgileri alınamadı:', err);
      }
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwords.new !== passwords.confirm) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }
    if (passwords.new.length < 8) {
      setError('Yeni şifre en az 8 karakter olmalıdır.');
      return;
    }

    setLoadingPass(true);
    try {
      const res = await api.post('/auth/change-password', { 
        currentPassword: passwords.current, 
        newPassword: passwords.new 
      });
      setSuccess(res.data?.message || 'Şifreniz başarıyla güncellendi.');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Şifre güncellenirken bir hata oluştu.');
    } finally {
      setLoadingPass(false);
    }
  };

  // Google Authenticator 2FA Setup
  const handleStart2FASetup = async () => {
    setTwoFAError('');
    setTwoFASuccess('');
    setOtpCode('');
    setActionLoading(true);
    try {
      const res = await api.get('/auth/2fa/setup');
      setSetupData({
        secret: res.data.secret,
        qrUrl: res.data.qrUrl,
        otpauthUrl: res.data.otpauthUrl
      });
      setShowSetupModal(true);
    } catch (err) {
      setTwoFAError(err.response?.data?.error || '2FA kurulum verisi alınamadı.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate2FA = async (e) => {
    e.preventDefault();
    setTwoFAError('');
    if (!otpCode || otpCode.trim().length !== 6) {
      setTwoFAError('Lütfen Google Authenticator uygulamanızdaki 6 haneli doğrulama kodunu girin.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post('/auth/2fa/activate', {
        secret: setupData.secret,
        otpCode: otpCode.trim()
      });
      setTwoFASuccess(res.data?.message || 'Google Authenticator 2FA başarıyla aktifleştirildi.');
      setIs2FAEnabled(true);
      setShowSetupModal(false);
      if (res.data?.backupCodes) {
        setBackupCodes(res.data.backupCodes);
        setShowBackupCodes(true);
      }
    } catch (err) {
      setTwoFAError(err.response?.data?.error || 'Geçersiz 2FA doğrulama kodu!');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setTwoFAError('');
    if (!disablePassword) {
      setTwoFAError('Lütfen işlem onayı için şifrenizi girin.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post('/auth/2fa/disable', { password: disablePassword });
      setTwoFASuccess(res.data?.message || '2FA başarıyla devre dışı bırakıldı.');
      setIs2FAEnabled(false);
      setShowDisableModal(false);
      setDisablePassword('');
    } catch (err) {
      setTwoFAError(err.response?.data?.error || 'Hatalı şifre. 2FA kapatılamadı!');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleTitle = () => {
    const role = localStorage.getItem('role');
    const isBranch = localStorage.getItem('isBranch') === 'true';
    if (role === 'AGENCY') return isBranch ? 'Şube Yöneticisi' : 'Acente Sahibi';
    if (role === 'ADMIN') return 'Acente Yöneticisi';
    if (role === 'BRANCH_MANAGER') return 'Şube Yöneticisi';
    if (role === 'PERSONEL') return 'Personel';
    return 'Kullanıcı';
  };

  const displayUsername = localStorage.getItem('username') || 'kullanici';
  const displayFullName = localStorage.getItem('fullName') || localStorage.getItem('agencyName') || 'Kullanıcı Adı Belirtilmemiş';

  return (
    <div className="page-layout">
      <Sidebar type="agency" />
      <main className="page-main">
        <header className="profile-header" style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Profil & Güvenlik Ayarları</h1>
          <p style={{ color: 'var(--text-muted)' }}>Hesap bilgilerinizi yönetin ve Google Authenticator 2FA ile iki katlı güvenlik sağlayın.</p>
        </header>

        {/* Başarı / Hata Bildirimleri */}
        {twoFASuccess && (
          <div style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#16a34a', padding: '16px 20px', borderRadius: '16px', marginBottom: '24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={20} />
            <span style={{ fontWeight: '600' }}>{twoFASuccess}</span>
          </div>
        )}

        <div className="profile-grid responsive-grid-2">
          {/* Sol - Profil Kimlik Kartı */}
          <div className="glass" style={{ padding: '30px', height: 'fit-content' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '30px', 
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', 
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                color: 'white',
                boxShadow: '0 12px 24px -6px rgba(14, 165, 233, 0.4)'
              }}>
                <User size={48} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{getRoleTitle()}</h2>
              <p style={{ color: 'var(--accent-color)', fontWeight: '700', fontSize: '0.9rem', marginTop: '4px' }}>Zyronova Kurumsal Altyapı</p>
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
              <div style={{ padding: '15px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kullanıcı Adı</p>
                <p style={{ fontWeight: '700', fontSize: '1.05rem', marginTop: '2px' }}>@{displayUsername}</p>
              </div>
              <div style={{ padding: '15px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ad Soyad / Firma</p>
                <p style={{ fontWeight: '700', fontSize: '1.05rem', marginTop: '2px' }}>{displayFullName}</p>
              </div>
            </div>
          </div>

          {/* Sağ - Güvenlik & Google Authenticator 2FA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Google Authenticator 2FA Kartı */}
            <div className="glass" style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: is2FAEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: is2FAEnabled ? '#22c55e' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {is2FAEnabled ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Google Authenticator (2FA)</h2>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: '800', 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        background: is2FAEnabled ? '#22c55e' : '#e11d48',
                        color: 'white',
                        letterSpacing: '0.05em'
                      }}>
                        {is2FAEnabled ? 'AKTİF' : 'PASİF'}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
                      Giriş yaparken Google Authenticator uygulamasındaki 6 haneli zaman bazlı kod ile ekstra koruma sağlayın.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ padding: '18px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Smartphone size={22} style={{ color: 'var(--accent-color)' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    {is2FAEnabled 
                      ? 'Hesabınız Google Authenticator ile çift faktörlü koruma altında.' 
                      : 'Şu an hesabınız sadece şifre ile korunuyor.'}
                  </span>
                </div>

                {!is2FAEnabled ? (
                  <button 
                    onClick={handleStart2FASetup} 
                    disabled={actionLoading}
                    className="btn btn-primary"
                    style={{ padding: '12px 22px', borderRadius: '14px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    <QrCode size={18} />
                    Google Authenticator Başlat
                  </button>
                ) : (
                  <button 
                    onClick={() => { setTwoFAError(''); setShowDisableModal(true); }}
                    disabled={actionLoading}
                    className="btn btn-outline"
                    style={{ padding: '12px 22px', borderRadius: '14px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', borderColor: '#ef4444', color: '#ef4444', cursor: 'pointer' }}
                  >
                    <Power size={18} />
                    2FA Korumayı Kapat
                  </button>
                )}
              </div>
            </div>

            {/* Şifre Değiştirme Kartı */}
            <div className="glass" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', gap: '10px' }}>
                <KeyRound color="var(--accent-color)" size={24} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Şifre Değiştirme</h2>
              </div>

              {success && (
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', padding: '14px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} /> {success}
                </div>
              )}
              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '14px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: '20px', maxWidth: '500px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>Mevcut Şifreniz</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                    <input 
                      type="password" 
                      required 
                      style={{ paddingLeft: '44px', width: '100%', height: '46px', borderRadius: '12px' }}
                      value={passwords.current}
                      onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                      placeholder="Devam etmek için mevcut şifrenizi girin" 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>Yeni Şifre</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                    <input 
                      type="password" 
                      required 
                      style={{ paddingLeft: '44px', width: '100%', height: '46px', borderRadius: '12px' }}
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      placeholder="En az 8 karakter" 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>Yeni Şifre (Tekrar)</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                    <input 
                      type="password" 
                      required 
                      style={{ paddingLeft: '44px', width: '100%', height: '46px', borderRadius: '12px' }}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      placeholder="Şifreyi onaylayın" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loadingPass}
                  className="btn btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', marginTop: '10px', borderRadius: '14px', fontWeight: '700' }}
                >
                  <Save size={18} />
                  {loadingPass ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* ─── GOOGLE AUTHENTICATOR SETUP MODAL ─── */}
        {showSetupModal && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div className="glass" style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '28px',
              maxWidth: '520px',
              width: '100%',
              padding: '32px',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <button 
                onClick={() => setShowSetupModal(false)}
                style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <QrCode size={32} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', margin: 0 }}>Google Authenticator Kurulumu</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>2 Adımda İki Faktörlü Doğrulamayı Aktifleştirin</p>
              </div>

              {twoFAError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={16} /> {twoFAError}
                </div>
              )}

              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Adım 1 */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ background: 'var(--accent-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>1</span>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white' }}>QR Kodunu Uygulama ile Taratın</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 14px' }}>
                    Telefonunuzdaki <strong>Google Authenticator</strong> uygulamasını açın ve <strong>"+"</strong> ikonuna dokunarak bu QR kodunu taratın:
                  </p>
                  
                  {setupData.qrUrl && (
                    <div style={{ textAlign: 'center', margin: '14px 0' }}>
                      <img 
                        src={setupData.qrUrl} 
                        alt="Google Authenticator QR Code" 
                        style={{ width: '180px', height: '180px', borderRadius: '16px', border: '4px solid white', background: 'white' }}
                      />
                    </div>
                  )}

                  <div style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '14px', marginTop: '14px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>QR Kod Taranamıyorsa Manuel Gizli Anahtar:</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 0, 0, 0.3)', padding: '10px 14px', borderRadius: '10px' }}>
                      <code style={{ flex: 1, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '2px', color: '#38bdf8', fontSize: '0.95rem' }}>
                        {setupData.secret}
                      </code>
                      <button 
                        type="button"
                        onClick={handleCopySecret}
                        style={{ background: 'transparent', border: 'none', color: copied ? '#22c55e' : 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '700' }}
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Kopyalandı' : 'Kopyala'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Adım 2 */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ background: 'var(--accent-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>2</span>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white' }}>6 Haneli Doğrulama Kodunu Girin</span>
                  </div>
                  <form onSubmit={handleActivate2FA}>
                    <input 
                      type="text" 
                      maxLength="6"
                      required
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      style={{ 
                        width: '100%', 
                        textAlign: 'center', 
                        fontSize: '1.6rem', 
                        letterSpacing: '8px', 
                        fontFamily: 'monospace',
                        fontWeight: '800',
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid var(--accent-color)',
                        color: 'white',
                        marginBottom: '16px'
                      }}
                    />
                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '14px', borderRadius: '14px', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer' }}
                    >
                      {actionLoading ? 'Doğrulanıyor...' : 'Doğrula ve Aktifleştir'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── 2FA DISABLE MODAL ─── */}
        {showDisableModal && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div className="glass" style={{
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '28px',
              maxWidth: '440px',
              width: '100%',
              padding: '32px',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
              <button 
                onClick={() => setShowDisableModal(false)}
                style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <Power size={32} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'white', margin: 0 }}>2FA Korumayı Kapat</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>İki faktörlü kimlik doğrulamasını kapatmak için mevcut hesap şifrenizi girin.</p>
              </div>

              {twoFAError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={16} /> {twoFAError}
                </div>
              )}

              <form onSubmit={handleDisable2FA} style={{ display: 'grid', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    required 
                    placeholder="Mevcut Şifreniz"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    style={{ paddingLeft: '44px', width: '100%', height: '46px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowDisableModal(false)}
                    className="btn btn-outline"
                    style={{ padding: '12px', borderRadius: '12px', fontWeight: '700' }}
                  >
                    Vazgeç
                  </button>
                  <button 
                    type="submit" 
                    disabled={actionLoading}
                    className="btn"
                    style={{ padding: '12px', borderRadius: '12px', fontWeight: '800', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    {actionLoading ? 'Kapatılıyor...' : 'Kapat'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showBackupCodes && (
          <div style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(2, 6, 23, 0.92)', 
            backdropFilter: 'blur(20px)', 
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px'
          }}>
            <div style={{ 
              width: '100%', 
              maxWidth: '500px', 
              background: 'linear-gradient(165deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', 
              borderRadius: '28px', 
              padding: '36px', 
              position: 'relative',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              boxShadow: '0 0 80px -20px rgba(99, 102, 241, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.6)'
            }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ 
                  width: '72px', 
                  height: '72px', 
                  borderRadius: '22px', 
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                  color: 'white', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '18px',
                  boxShadow: '0 12px 28px -6px rgba(99, 102, 241, 0.5)'
                }}>
                  <ShieldCheck size={36} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', margin: '0 0 8px' }}>
                  🔐 Kurtarma Kodlarınız
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6', margin: 0, maxWidth: '380px', marginInline: 'auto' }}>
                  Cihazınıza erişiminizi kaybetmeniz durumunda bu kodları kullanarak giriş yapabilirsiniz. Her kod sadece <strong style={{ color: '#e2e8f0' }}>bir kez</strong> kullanılabilir.
                </p>
              </div>

              {/* Warning Banner */}
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.25)', 
                borderRadius: '14px', 
                padding: '14px 18px', 
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <AlertCircle size={20} style={{ color: '#f87171', flexShrink: 0 }} />
                <span style={{ color: '#fca5a5', fontSize: '0.82rem', fontWeight: '600', lineHeight: '1.5' }}>
                  Bu kodları güvenli bir yere kaydedin. Bu pencere kapatıldıktan sonra bir daha gösterilmeyecektir!
                </span>
              </div>

              {/* Codes Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {backupCodes.map((code, idx) => (
                  <div key={idx} style={{ 
                    background: 'rgba(255, 255, 255, 0.04)', 
                    padding: '14px 16px', 
                    borderRadius: '14px', 
                    textAlign: 'center', 
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace", 
                    fontSize: '1.05rem', 
                    letterSpacing: '2px', 
                    fontWeight: '700',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}>
                    <span style={{ 
                      width: '22px', 
                      height: '22px', 
                      borderRadius: '7px', 
                      background: 'rgba(99, 102, 241, 0.2)', 
                      color: '#818cf8', 
                      fontSize: '0.7rem', 
                      fontWeight: '800', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontFamily: 'sans-serif',
                      letterSpacing: '0'
                    }}>
                      {idx + 1}
                    </span>
                    {code}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gap: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join('\n'));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    borderRadius: '14px', 
                    fontWeight: '700', 
                    fontSize: '0.92rem',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: copied ? '#22c55e' : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Kodlar Panoya Kopyalandı!' : 'Tüm Kodları Kopyala'}
                </button>

                <button 
                  type="button" 
                  onClick={() => setShowBackupCodes(false)}
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    borderRadius: '14px', 
                    fontWeight: '800', 
                    fontSize: '0.95rem',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px -6px rgba(99, 102, 241, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <ShieldCheck size={18} />
                  Kaydettim, Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @media (max-width: 900px) {
            .profile-grid {
              grid-template-columns: 1fr !important;
              gap: 20px !important;
            }
          }
          @media (max-width: 768px) {
            .profile-header {
              text-align: center !important;
              margin-bottom: 25px !important;
            }
            .profile-header h1 {
              font-size: 24px !important;
            }
            .glass {
              padding: 20px !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
};

export default Profile;
