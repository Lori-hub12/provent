(function() {
    // 1. Route Guard
    const user = JSON.parse(localStorage.getItem('ProVend_user') || 'null');
    const token = localStorage.getItem('ProVend_token');
    if (!user || !token || user.rol !== 'admin') {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;flex-direction:column;gap:1rem"><h2 style="color:#dc2626">🚨 Acceso Restringido</h2><p style="color:#6b7280">Solo los administradores pueden ver esta página.</p><a href="login.html" style="background:#2B7DE9;color:white;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:600">Ir al Login</a></div>';
        throw new Error('Unauthorized');
    }

    // 2. Global State
    let currentTab = 'dashboard';
    
    // 3. Init Navigation
    const links = document.querySelectorAll('.admin-nav-link[data-target]');
    const mainContent = document.getElementById('admin-main-content');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentTab = link.getAttribute('data-target');
            renderCurrentTab();
        });
    });

    document.getElementById('btn-logout').addEventListener('click', (e) => {
        e.preventDefault();
        ProVendAuth.logout();
    });

    // 4. Render Logic
    async function renderCurrentTab() {
        mainContent.innerHTML = '<div class="empty-state">Cargando...</div>';
        
        switch(currentTab) {
            case 'dashboard': await renderDashboard(); break;
            case 'usuarios': await renderUsuarios(); break;
            case 'empresas': await renderEmpresas(); break;
            case 'proveedores': await renderProveedores(); break;
            case 'materiales': await renderMateriales(); break;
            case 'productos': await renderProductos(); break;
            case 'actividad': await renderActividad(); break;
            case 'resenas': await renderResenas(); break;
            case 'reportes': await renderReportes(); break;
            case 'verificaciones': await renderVerificaciones(); break;
            case 'categorias': await renderCategorias(); break;
            case 'configuracion': await renderConfiguracion(); break;
            default: renderDashboard(); break;
        }
    }

    // --- Formatters ---
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('es-NI', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
        });
    };

    // --- Tab Renderers ---

    async function renderDashboard() {
        try {
            const statsRes = await ProVendAuth.apiFetch(`${API_BASE}/api/admin/stats`);
            
            let reqAtencionHTML = '';
            if (statsRes.pendientes > 0) {
                reqAtencionHTML = `
                    <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 1rem; border-radius: 4px; margin-bottom: 2rem; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h3 style="color: #991B1B; margin:0 0 0.25rem 0; font-size:1rem;">Requiere tu atención</h3>
                            <p style="color: #B91C1C; margin:0; font-size:0.875rem;">Hay ${statsRes.pendientes} proveedor(es) esperando verificación.</p>
                        </div>
                        <button onclick="document.querySelector('[data-target=verificaciones]').click()" class="btn btn-primary btn-sm" style="background:#EF4444; border-color:#EF4444;">Revisar</button>
                    </div>
                `;
            }

            mainContent.innerHTML = `
                <div class="admin-header">
                    <div>
                        <h1>Panel de Administración</h1>
                        <p style="color:var(--neutral-500); margin-top:0.25rem;">Bienvenido, ${user.nombre}. Hoy es ${new Date().toLocaleDateString('es-NI')}</p>
                    </div>
                    <button class="btn btn-outline" onclick="document.querySelector('.admin-nav-link.active').click()">
                        🔄 Actualizar datos
                    </button>
                </div>

                ${reqAtencionHTML}

                <div class="kpi-grid">
                    <div class="kpi-card"><div class="kpi-label">Usuarios Totales</div><div class="kpi-value">${statsRes.totalUsuarios || 0}</div></div>
                    <div class="kpi-card"><div class="kpi-label">Empresas</div><div class="kpi-value">${statsRes.totalEmpresas || 0}</div></div>
                    <div class="kpi-card"><div class="kpi-label">Proveedores</div><div class="kpi-value">${statsRes.totalProveedores || 0}</div></div>
                    <div class="kpi-card"><div class="kpi-label">Verificados</div><div class="kpi-value">${statsRes.verificados || 0}</div></div>
                    <div class="kpi-card"><div class="kpi-label">Materiales</div><div class="kpi-value">${statsRes.totalMateriales || 0}</div></div>
                    <div class="kpi-card"><div class="kpi-label">Reseñas</div><div class="kpi-value">${statsRes.totalReseñas || 0}</div></div>
                </div>

                <div class="admin-section-title">Actividad Reciente</div>
                <div class="table-container" id="dash-actividad-container">
                    <div class="empty-state">Cargando actividad...</div>
                </div>
            `;

            // Load brief activity
            const actRes = await ProVendAuth.apiFetch(`${API_BASE}/api/admin/actividad`);
            const actContainer = document.getElementById('dash-actividad-container');
            
            if (!actRes || actRes.length === 0) {
                actContainer.innerHTML = '<div class="empty-state">Sin actividad reciente.</div>';
            } else {
                let rows = actRes.slice(0, 5).map(a => `
                    <tr>
                        <td><strong>${a.titulo}</strong></td>
                        <td>${a.detalle}</td>
                        <td><span class="badge ${a.tipo === 'registro' ? 'badge-primary' : 'badge-neutral'}">${a.tipo}</span></td>
                        <td>${formatDate(a.fecha)}</td>
                    </tr>
                `).join('');
                actContainer.innerHTML = `
                    <table class="admin-table">
                        <thead><tr><th>Usuario/Elemento</th><th>Detalle</th><th>Tipo</th><th>Fecha</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                `;
            }
        } catch (e) {
            mainContent.innerHTML = `<div class="empty-state" style="color:var(--danger-600)">Error al cargar dashboard: ${e.message}</div>`;
        }
    }

    async function renderUsuarios() {
        try {
            const res = await ProVendAuth.apiFetch(`${API_BASE}/api/admin/usuarios`);
            
            let content = `
                <div class="admin-header">
                    <h1>Usuarios Registrados</h1>
                </div>
            `;

            if (!res.usuarios || res.usuarios.length === 0) {
                content += `<div class="empty-state">Todavía no hay usuarios registrados.</div>`;
            } else {
                let rows = res.usuarios.map(u => `
                    <tr>
                        <td>${u.id}</td>
                        <td><strong>${u.nombre}</strong><br><small style="color:var(--neutral-500)">${u.email}</small></td>
                        <td><span class="badge badge-primary">${u.rol}</span></td>
                        <td>${u.empresa || '-'}</td>
                        <td>${u.activo ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-danger">Inactivo</span>'}</td>
                        <td>${formatDate(u.created_at)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline" onclick="alert('Funcionalidad de suspensión próxima')">Suspender</button>
                        </td>
                    </tr>
                `).join('');

                content += `
                    <div class="table-container">
                        <table class="admin-table">
                            <thead><tr><th>ID</th><th>Usuario</th><th>Rol</th><th>Compañía</th><th>Estado</th><th>Registro</th><th>Acciones</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                `;
            }
            mainContent.innerHTML = content;
        } catch(e) {
            mainContent.innerHTML = `<div class="empty-state">Error cargando usuarios: ${e.message}</div>`;
        }
    }

    async function renderEmpresas() {
        try {
            const res = await ProVendAuth.apiFetch(`${API_BASE}/api/admin/empresas`);
            let content = `<div class="admin-header"><h1>Empresas</h1></div>`;
            
            if (!res || res.length === 0) {
                content += `<div class="empty-state">Todavía no hay empresas registradas.</div>`;
            } else {
                let rows = res.map(e => `
                    <tr>
                        <td><strong>${e.company || e.nombre}</strong></td>
                        <td>${e.email}</td>
                        <td>${e.ciudad || 'No especificada'}</td>
                        <td>${formatDate(e.created_at)}</td>
                        <td><button class="btn btn-sm btn-outline" onclick="alert('Próximamente: Ver perfil')">Ver perfil</button></td>
                    </tr>
                `).join('');
                content += `
                    <div class="table-container">
                        <table class="admin-table">
                            <thead><tr><th>Empresa</th><th>Correo</th><th>Ciudad</th><th>Registro</th><th>Acciones</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                `;
            }
            mainContent.innerHTML = content;
        } catch(e) { mainContent.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`; }
    }

    async function renderProveedores() {
        try {
            const res = await ProVendAuth.apiFetch(`${API_BASE}/api/admin/proveedores`);
            let content = `<div class="admin-header"><h1>Proveedores</h1></div>`;
            
            if (!res || res.length === 0) {
                content += `<div class="empty-state">No existen proveedores todavía.</div>`;
            } else {
                let rows = res.map(p => `
                    <tr>
                        <td><strong>${p.company || p.nombre}</strong></td>
                        <td>${p.ciudad || 'N/A'}</td>
                        <td>${p.categoria || 'N/A'}</td>
                        <td>${p.verificado ? '<span class="badge badge-success">Verificado</span>' : '<span class="badge badge-neutral">Pendiente</span>'}</td>
                        <td>${p.total_materiales}</td>
                        <td><button class="btn btn-sm btn-outline" onclick="alert('Próximamente: Revisar productos')">Revisar</button></td>
                    </tr>
                `).join('');
                content += `
                    <div class="table-container">
                        <table class="admin-table">
                            <thead><tr><th>Proveedor</th><th>Ciudad</th><th>Categoría</th><th>Estado</th><th>Materiales</th><th>Acciones</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                `;
            }
            mainContent.innerHTML = content;
        } catch(e) { mainContent.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`; }
    }

    async function renderVerificaciones() {
        try {
            const res = await ProVendAuth.apiFetch(`${API_BASE}/api/admin/proveedores`);
            const pendientes = res.filter(p => !p.verificado);
            let content = `<div class="admin-header"><h1>Verificaciones Pendientes</h1></div>`;
            
            if (pendientes.length === 0) {
                content += `<div class="empty-state">No hay solicitudes de verificación pendientes.</div>`;
            } else {
                let rows = pendientes.map(p => `
                    <tr>
                        <td><strong>${p.company || p.nombre}</strong></td>
                        <td>${formatDate(p.created_at)}</td>
                        <td><span class="badge badge-neutral">Pendiente</span></td>
                        <td>
                            <div class="action-row">
                                <button class="btn btn-sm btn-primary" onclick="alert('Próximamente: Flujo de aprobación para ID ${p.id}')">Aprobar</button>
                                <button class="btn btn-sm btn-outline" style="color:var(--danger-600); border-color:var(--danger-200)" onclick="alert('Próximamente: Motivo de rechazo')">Rechazar</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
                content += `
                    <div class="table-container">
                        <table class="admin-table">
                            <thead><tr><th>Proveedor</th><th>Fecha Solicitud</th><th>Estado</th><th>Acciones</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                `;
            }
            mainContent.innerHTML = content;
        } catch(e) { mainContent.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`; }
    }

    async function renderMateriales() {
        try {
            const res = await ProVendAuth.apiFetch(`${API_BASE}/api/admin/materiales`);
            let content = `<div class="admin-header"><h1>Materiales Activos</h1></div>`;
            
            if (!res || res.length === 0) {
                content += `<div class="empty-state">0 materiales encontrados en el sistema.</div>`;
            } else {
                let rows = res.map(m => `
                    <tr>
                        <td><strong>${m.nombre}</strong></td>
                        <td>${m.proveedor_nombre || 'N/A'}</td>
                        <td>${m.categoria}</td>
                        <td>${m.cantidad} ${m.unidad}</td>
                        <td><span class="badge badge-success">Activo</span></td>
                        <td><button class="btn btn-sm btn-outline" onclick="if(confirm('¿Seguro que deseas eliminar este material?')) { alert('Próximamente: endpoint DELETE /api/admin/materiales') }">Eliminar</button></td>
                    </tr>
                `).join('');
                content += `
                    <div class="table-container">
                        <table class="admin-table">
                            <thead><tr><th>Material</th><th>Proveedor</th><th>Categoría</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                `;
            }
            mainContent.innerHTML = content;
        } catch(e) { mainContent.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`; }
    }

    async function renderProductos() {
        mainContent.innerHTML = `
            <div class="admin-header"><h1>Productos</h1></div>
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                <p>Módulo de productos próximamente.</p>
                <small>0 productos en el sistema actualmente.</small>
            </div>
        `;
    }

    async function renderResenas() {
        try {
            const res = await ProVendAuth.apiFetch(`${API_BASE}/api/admin/resenas`);
            let content = `<div class="admin-header"><h1>Reseñas Públicas</h1></div>`;
            
            if (!res || res.length === 0) {
                content += `<div class="empty-state">0 reseñas en el sistema.</div>`;
            } else {
                let rows = res.map(r => `
                    <tr>
                        <td>${r.empresa_nombre || 'Empresa'}</td>
                        <td>${r.proveedor_nombre || 'Proveedor'}</td>
                        <td>⭐ ${r.rating}</td>
                        <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.comentario}</td>
                        <td>${formatDate(r.fecha_creacion)}</td>
                        <td><button class="btn btn-sm btn-outline" onclick="confirm('¿Ocultar reseña?')">Ocultar</button></td>
                    </tr>
                `).join('');
                content += `
                    <div class="table-container">
                        <table class="admin-table">
                            <thead><tr><th>De (Empresa)</th><th>Para (Proveedor)</th><th>Calif.</th><th>Comentario</th><th>Fecha</th><th>Acciones</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                `;
            }
            mainContent.innerHTML = content;
        } catch(e) { mainContent.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`; }
    }

    async function renderActividad() {
        try {
            const res = await ProVendAuth.apiFetch(`${API_BASE}/api/admin/actividad`);
            let content = `<div class="admin-header"><h1>Registro de Actividad</h1></div>`;
            
            if (!res || res.length === 0) {
                content += `<div class="empty-state">Sin actividad registrada.</div>`;
            } else {
                let rows = res.map(a => `
                    <tr>
                        <td><strong>${a.titulo}</strong></td>
                        <td>${a.detalle}</td>
                        <td><span class="badge ${a.tipo === 'registro' ? 'badge-primary' : 'badge-neutral'}">${a.tipo}</span></td>
                        <td>${formatDate(a.fecha)}</td>
                    </tr>
                `).join('');
                content += `
                    <div class="table-container">
                        <table class="admin-table">
                            <thead><tr><th>Evento</th><th>Detalle</th><th>Tipo</th><th>Fecha</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                `;
            }
            mainContent.innerHTML = content;
        } catch(e) { mainContent.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`; }
    }

    async function renderReportes() {
        mainContent.innerHTML = `
            <div class="admin-header"><h1>Reportes de Moderación</h1></div>
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <p>No hay reportes pendientes.</p>
            </div>
        `;
    }

    async function renderCategorias() {
        mainContent.innerHTML = `
            <div class="admin-header">
                <h1>Categorías de Materiales</h1>
                <button class="btn btn-primary" onclick="alert('Próximamente: Añadir nueva categoría')">+ Nueva Categoría</button>
            </div>
            <div class="table-container">
                <table class="admin-table">
                    <thead><tr><th>Categoría</th><th>Estado</th><th>Acciones</th></tr></thead>
                    <tbody>
                        <tr><td>Construcción</td><td><span class="badge badge-success">Activo</span></td><td><button class="btn btn-sm btn-outline">Editar</button></td></tr>
                        <tr><td>Tecnología</td><td><span class="badge badge-success">Activo</span></td><td><button class="btn btn-sm btn-outline">Editar</button></td></tr>
                        <tr><td>Alimentos</td><td><span class="badge badge-success">Activo</span></td><td><button class="btn btn-sm btn-outline">Editar</button></td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    async function renderConfiguracion() {
        mainContent.innerHTML = `
            <div class="admin-header"><h1>Configuración Administrativa</h1></div>
            <div style="display:grid; gap:2rem; max-width:600px;">
                
                <div class="kpi-card" style="box-shadow:none;">
                    <h3>Mi Cuenta</h3>
                    <p style="color:var(--neutral-500); margin-bottom:1rem;">Información del administrador actual.</p>
                    <div style="margin-bottom:1rem;">
                        <label class="form-label">Nombre</label>
                        <input type="text" class="form-input" value="${user.nombre}" readonly>
                    </div>
                    <div style="margin-bottom:1rem;">
                        <label class="form-label">Correo (Solo lectura)</label>
                        <input type="email" class="form-input" value="${user.email}" readonly>
                    </div>
                    <button class="btn btn-outline" onclick="alert('Cambio de clave Próximamente')">Cambiar Contraseña</button>
                </div>

                <div class="kpi-card" style="box-shadow:none;">
                    <h3>Preferencias de la Plataforma</h3>
                    <div style="margin-bottom:1rem;">
                        <label class="form-label">Modo de registro</label>
                        <select class="form-input"><option>Abierto</option><option>Solo invitación</option></select>
                    </div>
                    <button class="btn btn-primary" onclick="alert('Configuraciones guardadas localmente')">Guardar Cambios</button>
                </div>
            </div>
        `;
    }

    // Initialize first load
    renderDashboard();

})();