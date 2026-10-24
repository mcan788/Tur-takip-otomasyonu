import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle color="#22c55e" size={20} />,
    error: <XCircle color="#ef4444" size={20} />,
    warning: <AlertTriangle color="#facc15" size={20} />,
    info: <Info color="#38bdf8" size={20} />
  };

  const colors = {
    success: 'rgba(34, 197, 94, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
    warning: 'rgba(250, 204, 21, 0.1)',
    info: 'rgba(56, 189, 248, 0.1)'
  };

  return (
    <div style={{
      position: 'fixed', bottom: '30px', right: '30px', zIndex: 3000,
      background: 'var(--secondary-bg)', border: `1px solid var(--border-color)`,
      padding: '16px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)', animation: 'slideIn 0.3s ease-out',
      minWidth: '300px', borderLeft: `4px solid ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#facc15'}`
    }}>
      <div style={{ marginRight: '15px' }}>{icons[type]}</div>
      <div style={{ flex: 1, fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>{message}</div>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '15px' }}>
        <X size={18} />
      </button>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
      background: 'rgba(15, 23, 42, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2500 
    }}>
      <div className="modal-content" style={{ padding: '35px', width: '400px', background: 'var(--secondary-bg)', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <AlertTriangle color="#ef4444" size={30} />
        </div>
        <h2 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>{title}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '14px', lineHeight: '1.6' }}>{message}</p>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn btn-primary" style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none' }} onClick={onConfirm}>Evet, Sil</button>
          <button className="btn" style={{ flex: 1, background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} onClick={onCancel}>İptal</button>
        </div>
      </div>
    </div>
  );
};
