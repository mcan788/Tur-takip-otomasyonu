import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Car, ArrowRight } from 'lucide-react';

const ModuleSelector = () => {
  const navigate = useNavigate();
  const [hoveredSide, setHoveredSide] = useState(null); // 'left', 'right', or null

  const handleSelectTurTakip = () => {
    navigate('/super-admin');
  };

  const handleSelectRentACar = () => {
    navigate('/sso-login');
  };

  return (
    <div className="module-selector-container">
      <style>{`
        .module-selector-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: #0f172a;
          color: white;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .split-side {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          overflow: hidden;
        }

        .split-side::before {
          content: '';
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0.4;
          transition: all 0.7s ease;
          filter: grayscale(100%);
          z-index: 0;
        }

        .split-left {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        }
        
        .split-right {
          background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
        }

        .split-left::before {
          /* Tur Takip için modern harita/yol deseni veya soyut arka plan */
          background-image: url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><path d="M10 10l80 80M90 10L10 90" stroke="rgba(255,255,255,0.05)" stroke-width="2" fill="none"/></svg>');
          background-repeat: repeat;
        }

        .split-right::before {
          /* Rent a Car için soyut arka plan */
          background-image: url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" stroke-width="2" fill="none"/></svg>');
          background-repeat: repeat;
        }

        .split-side:hover {
          flex: 1.4;
        }

        .split-side:hover::before {
          opacity: 0.8;
          filter: grayscale(0%) blur(2px);
          transform: scale(1.05);
        }

        /* Gradient overlay for better text readability */
        .split-side::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.2) 100%);
          z-index: 1;
        }

        .content-wrapper {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 2rem;
          transition: transform 0.5s ease;
        }

        .split-side:hover .content-wrapper {
          transform: translateY(-20px);
        }

        .icon-container {
          width: 120px;
          height: 120px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .split-side:hover .icon-container {
          transform: scale(1.1) rotate(5deg);
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }
        
        .split-left:hover .icon-container {
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
        }

        .split-right:hover .icon-container {
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.6);
        }

        .title {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          background: linear-gradient(to right, #fff, #cbd5e1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .description {
          font-size: 1.25rem;
          color: #94a3b8;
          max-width: 400px;
          line-height: 1.6;
          margin-bottom: 3rem;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease;
          transition-delay: 0.1s;
        }

        .split-side:hover .description {
          opacity: 1;
          transform: translateY(0);
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          border-radius: 9999px;
          font-size: 1.125rem;
          font-weight: 600;
          color: white;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateY(20px);
        }

        .split-side:hover .action-button {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.2s;
        }

        .split-left:hover .action-button {
          background: #2563eb;
          border-color: #3b82f6;
          box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
        }

        .split-right:hover .action-button {
          background: #059669;
          border-color: #10b981;
          box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.5);
        }
        
        .arrow-icon {
          transition: transform 0.3s ease;
        }
        
        .action-button:hover .arrow-icon {
          transform: translateX(5px);
        }

        .divider {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-50%);
          z-index: 10;
          transition: opacity 0.5s ease;
        }

        .module-selector-container:hover .divider {
          opacity: 0;
        }
        
        .logo-center {
          position: absolute;
          top: 3rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: 2px;
          color: white;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .logo-center span {
          background: linear-gradient(to right, #60a5fa, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <div className="logo-center">
        ZYRONOVA <span>MERKEZ</span>
      </div>

      <div className="divider"></div>

      <div 
        className="split-side split-left" 
        onClick={handleSelectTurTakip}
        onMouseEnter={() => setHoveredSide('left')}
        onMouseLeave={() => setHoveredSide(null)}
      >
        <div className="content-wrapper">
          <div className="icon-container">
            <Map size={56} color={hoveredSide === 'left' ? '#ffffff' : '#94a3b8'} strokeWidth={1.5} style={{ transition: 'color 0.3s ease' }} />
          </div>
          <h2 className="title">Tur Takip</h2>
          <p className="description">
            Araç güzergahları, tur kayıtları, yolcu listeleri ve acente atamalarını yönetin. Tüm tur operasyonlarınız tek ekranda.
          </p>
          <button className="action-button">
            Giriş Yap <ArrowRight size={20} className="arrow-icon" />
          </button>
        </div>
      </div>

      <div 
        className="split-side split-right"
        onClick={handleSelectRentACar}
        onMouseEnter={() => setHoveredSide('right')}
        onMouseLeave={() => setHoveredSide(null)}
      >
        <div className="content-wrapper">
          <div className="icon-container">
            <Car size={56} color={hoveredSide === 'right' ? '#ffffff' : '#94a3b8'} strokeWidth={1.5} style={{ transition: 'color 0.3s ease' }} />
          </div>
          <h2 className="title">Rent A Car</h2>
          <p className="description">
            Araç filosu, kiralama sözleşmeleri, müşteri takibi ve finansal operasyonlarınızı kolayca yönetin.
          </p>
          <button className="action-button">
            Giriş Yap <ArrowRight size={20} className="arrow-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleSelector;
