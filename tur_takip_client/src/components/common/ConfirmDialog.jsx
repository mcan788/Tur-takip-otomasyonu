import React from 'react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <div className="confirm-icon">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h3 className="confirm-title">{title || 'Emin misiniz?'}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            İptal
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            Onayla
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
