const fs = require('fs');
const css = `
/* ─── YENİ RESPONSIVE SINIFLAR ─── */
.responsive-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.responsive-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.responsive-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.responsive-grid-6 { display: grid; grid-template-columns: repeat(6, 1fr); gap: 20px; }
.responsive-flex-header { display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap; }
.responsive-flex-row { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }

@media (max-width: 768px) {
  .responsive-grid-2, .responsive-grid-3, .responsive-grid-4, .responsive-grid-6 { grid-template-columns: 1fr !important; }
  .responsive-flex-header { flex-direction: column !important; align-items: stretch !important; }
  .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; display: block; width: 100%; }
}
`;
fs.appendFileSync('C:/SUNUCU_PAKETI/TurTakip_Arayuz/client/src/index.css', css);
