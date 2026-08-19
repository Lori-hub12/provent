(function() {
            const user = JSON.parse(localStorage.getItem('ProVend_user') || 'null');
            const token = localStorage.getItem('ProVend_token');
            if (!user || !token || user.rol !== 'admin') {
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;flex-direction:column;gap:1rem"><h2 style="color:#dc2626">🔒 Acceso Restringido</h2><p style="color:#6b7280">Solo los administradores pueden ver esta página.</p><a href="login.html" style="background:#2B7DE9;color:white;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:600">Ir al Login</a></div>';
                throw new Error('Unauthorized');
            }
        })();