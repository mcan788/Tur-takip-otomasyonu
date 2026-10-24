import React, { useState } from 'react';

const DataTable = ({ title, columns, data, loading, onAdd, renderActions, addButtonLabel }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter((row) =>
    columns.some((col) => {
      const val = row[col.key];
      return val && val.toString().toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  return (
    <div className="glass-panel" style={{ marginTop: '2rem' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>{title}</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--text)'
            }}
          />
          {onAdd && (
            <button className="btn-primary" onClick={onAdd}>
              <i className="fa-solid fa-plus"></i> {addButtonLabel || 'Ekle'}
            </button>
          )}
        </div>
      </div>
      
      <div className="panel-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Yükleniyor...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, index) => (
                  <th key={index}>{col.label}</th>
                ))}
                {(renderActions || false) && <th>İşlemler</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((col, colIndex) => (
                      <td key={colIndex}>
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                    {(renderActions || false) && (
                      <td>{renderActions(row)}</td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + (renderActions ? 1 : 0)} style={{ textAlign: 'center' }}>
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DataTable;
