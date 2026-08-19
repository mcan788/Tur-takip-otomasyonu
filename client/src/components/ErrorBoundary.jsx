import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Sonraki render'da fallback UI gösterecek şekilde state'i güncelle
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Hatayı loglama servisine gönderebilirsiniz
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#fff', padding: '20px', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '20px', fontSize: '2rem', fontWeight: 'bold' }}>Beklenmeyen Bir Hata Oluştu</h2>
          <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Uygulamada teknik bir sorun meydana geldi. Lütfen sayfayı yenilemeyi deneyin.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Sayfayı Yenile
          </button>
          
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '40px', background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '12px', textAlign: 'left', maxWidth: '800px', overflowX: 'auto', border: '1px solid #334155' }}>
              <summary style={{ cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' }}>Hata Detayı (Sadece Geliştirme Ortamı)</summary>
              <br />
              {this.state.error.toString()}
              <br />
              {this.state.errorInfo.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
