// ============================================================
// ProVend — Configuración Global
// Cambia API_BASE según el entorno (local o producción)
// ============================================================
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : window.location.origin;
