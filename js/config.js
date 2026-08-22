// ============================================================
// ProVend — Configuración Global
// Cambia API_BASE según el entorno (local o producción)
// ============================================================
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'https://provent.onrender.com'
    : window.location.origin;
