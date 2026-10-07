/* ============================================
   ProVend - notifications.js
   Utilidades compartidas de la campana de notificaciones
   ============================================ */
window.ProVendNotif = {
    // Evita inyección de HTML en mensajes (contienen nombres de empresas)
    escape(str) {
        return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    },

    timeAgo(value) {
        const d = new Date(value);
        if (isNaN(d)) return '';
        const s = Math.floor((Date.now() - d.getTime()) / 1000);
        if (s < 60) return 'Hace un momento';
        if (s < 3600) return `Hace ${Math.floor(s / 60)} min`;
        if (s < 86400) return `Hace ${Math.floor(s / 3600)} h`;
        if (s < 604800) return `Hace ${Math.floor(s / 86400)} d`;
        return d.toLocaleDateString();
    },

    // Marca como leídas las no leídas y apaga el puntito rojo
    async markRead(notifs) {
        const unread = (notifs || []).filter(n => !n.leida);
        if (!unread.length) return;
        const dot = document.getElementById('notif-dot');
        if (dot) dot.style.display = 'none';
        await Promise.all(unread.map(n =>
            ProVendAuth.apiFetch(`${API_BASE}/api/notificaciones/${n.id}/leida`, { method: 'PATCH' }).catch(() => {})
        ));
    }
};
