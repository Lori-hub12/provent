const user = window.ProVendAuth ? ProVendAuth.getCurrentUser() : null;
    if (!user || user.rol !== 'empresa') {
      window.location.href = 'login.html';
    }

    function buildAuthNavbar(u) {
      const name = u.company || u.nombre || 'Mi cuenta';
      const initials = name.substring(0, 2).toUpperCase();
      return `
        <nav class="navbar" id="navbar">
          <div class="navbar-inner">
            <a href="dashboard-empresa.html" class="navbar-logo">
              ${getLogoSVG(36)}
              <span class="navbar-logo-text">Pro<span>Vend</span></span>
            </a>
            <div class="navbar-nav">
              <a href="dashboard-empresa.html" class="navbar-link active">Inicio</a>
              <a href="explorar.html" class="navbar-link">Explorar</a>
              <a href="explorar.html?tab=materiales" class="navbar-link">Materiales</a>
              <a href="categorias.html" class="navbar-link">Categorías</a>
            </div>
            <div class="navbar-actions" style="gap:0.75rem">
              <button id="notif-btn" style="background:none; border:none; cursor:pointer; color:var(--neutral-600); position:relative;" title="Notificaciones">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span id="notif-dot" style="display:none; position:absolute; top:-2px; right:-2px; width:8px; height:8px; background:var(--danger-500); border-radius:50%; border:2px solid white;"></span>
              </button>
              <div style="display:flex; align-items:center; gap:0.5rem; padding: 0.3rem 0.75rem; border-radius:99px; border:1px solid var(--neutral-200); background: var(--white); box-shadow:var(--shadow-xs)">
                <div style="width:28px; height:28px; background:var(--primary-100); color:var(--primary-700); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem;">${initials}</div>
                <span style="font-size:0.875rem; font-weight:500; color:var(--neutral-800); max-width:100px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${name}</span>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="ProVendAuth.logout()" style="color:var(--danger-600)">Salir</button>
            </div>
          </div>
        </nav>
      `;
    }

    document.getElementById('navbar-container').innerHTML = buildAuthNavbar(user);
    document.getElementById('footer-container').innerHTML = buildFooter();
    renderCategoryCards('categories-grid');

    // Saludo personalizado
    const name = user.company || user.nombre || '';
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    document.getElementById('greeting-badge').textContent = `\uD83D\uDC4B ${greet}, ${name}`;

    // Cargar datos reales de la API
    async function loadDashboard() {
      try {
        // 1. Estadísticas de mi actividad
        const actRes = await ProVendAuth.apiFetch(`${API_BASE}/api/dashboard/empresa/${user.id}`);
        const act = await actRes.json();
        document.getElementById('stat-visitados').textContent = act.proveedores_visitados || 0;
        document.getElementById('stat-favoritos').textContent = act.favoritos || 0;

        // ¿Es el primer ingreso? (sin actividad)
        const isFirstTime = !act.proveedores_visitados && !act.favoritos;
        if (isFirstTime) {
          // Mostrar bienvenida especial encima de todo
          const welcomeBanner = document.createElement('div');
          welcomeBanner.style.cssText = 'background:linear-gradient(135deg,var(--primary-50),white);border:1px solid var(--primary-100);border-radius:16px;padding:2rem;text-align:center;margin-bottom:2rem;max-width:600px;margin-left:auto;margin-right:auto;';
          welcomeBanner.innerHTML = `
            <div style="font-size:2.5rem;margin-bottom:0.75rem">&#127881;</div>
            <h2 style="font-size:1.5rem;font-weight:700;color:var(--neutral-900);margin-bottom:0.5rem">
              Bienvenido a ProVend, ${name}
            </h2>
            <p style="color:var(--neutral-600);max-width:420px;margin:0 auto 1.5rem">
              Todavía no has realizado ninguna búsqueda. Empieza buscando un material o un proveedor para tu negocio.
            </p>
            <a href="explorar.html" class="btn btn-primary" style="font-size:1rem;padding:0.75rem 2rem">
              &#128269; Buscar ahora
            </a>`;
          const firstSection = document.querySelector('.dashboard-section');
          if (firstSection) firstSection.prepend(welcomeBanner);
        }

        // 2. Estadísticas globales del mercado
        const statsRes = await fetch(`${API_BASE}/api/stats`);
        const stats = await statsRes.json();
        document.getElementById('mkt-proveedores').textContent = stats.proveedores || 0;
        document.getElementById('mkt-empresas').textContent = stats.empresas || 0;
        document.getElementById('mkt-materiales').textContent = stats.materiales || 0;
        document.getElementById('mkt-verificados').textContent = stats.verificados || 0;
        document.getElementById('stat-nuevos').textContent = stats.proveedores || 0;


        // 3. Favoritos reales
        const favRes = await ProVendAuth.apiFetch(`${API_BASE}/api/dashboard/empresa/${user.id}/favoritos`);
        const favs = await favRes.json();
        const favContainer = document.getElementById('favoritos-container');

        if (favs.length === 0) {
          favContainer.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">??</div>
              <h3>Aún no tienes favoritos</h3>
              <p>Explora proveedores y guarda los que más te interesen haciendo clic en el corazón de su perfil.</p>
              <a href="explorar.html" class="btn btn-primary">Explorar proveedores</a>
            </div>`;
        } else {
          const grid = document.createElement('div');
          grid.className = 'providers-grid';
          favs.forEach(p => {
            const initials = (p.company || p.nombre || 'PR').substring(0, 2).toUpperCase();
            const colors = ['#2B7DE9','#27ae60','#e67e22','#9b59b6','#e74c3c'];
            const color = colors[p.id % colors.length];
            grid.innerHTML += `
              <div class="prov-card">
                <div class="prov-card-top">
                  <div class="prov-avatar" style="background:${color}">${initials}</div>
                  <div>
                    <div style="font-weight:600; color:var(--neutral-900)">${p.company || p.nombre} ${p.verificado ? '<span style="color:#059669;font-size:0.75rem;font-weight:700;background:#d1fae5;padding:1px 6px;border-radius:99px;margin-left:4px">✓ Verificado</span>' : ''}</div>
                    <div style="font-size:0.875rem; color:var(--neutral-500)">${p.categoria || 'Proveedor'}</div>
                  </div>
                </div>
                <div style="font-size:0.875rem; color:var(--neutral-500)">
                  &#11088; ${Number(p.rating).toFixed(1)} (${p.reviews} rese&ntilde;as)
                </div>
                <a href="perfil-proveedor.html?id=${p.id}" class="prov-card-action">Ver Perfil &rarr;</a>
              </div>`;
          });
          favContainer.innerHTML = '';
          favContainer.appendChild(grid);
        }

        // 4. Historial
        const histRes = await ProVendAuth.apiFetch(`${API_BASE}/api/dashboard/empresa/${user.id}/historial`);
        const historial = await histRes.json();
        const histContainer = document.getElementById('historial-container');

        if (historial.length === 0) {
          histContainer.innerHTML = `
            <div class="empty-state" style="padding: 2rem;">
              <p>No tienes historial de visitas recientes.</p>
            </div>`;
        } else {
          const grid = document.createElement('div');
          grid.className = 'providers-grid';
          historial.forEach(p => {
            const initials = (p.company || p.nombre || 'PR').substring(0, 2).toUpperCase();
            const colors = ['#2B7DE9','#27ae60','#e67e22','#9b59b6','#e74c3c'];
            const color = colors[p.id % colors.length];
            grid.innerHTML += `
              <div class="prov-card" style="padding: 1rem;">
                <div class="prov-card-top" style="margin-bottom: 0.5rem;">
                  <div class="prov-avatar" style="width: 36px; height: 36px; font-size: 0.9rem; background:${color}">${initials}</div>
                  <div>
                    <div style="font-weight:600; font-size:0.9rem; color:var(--neutral-900)">${p.company || p.nombre} ${p.verificado ? '✅' : ''}</div>
                    <div style="font-size:0.75rem; color:var(--neutral-500)">Última visita: ${new Date(p.last_visited).toLocaleDateString()}</div>
                  </div>
                </div>
                <a href="perfil-proveedor.html?id=${p.id}" class="prov-card-action" style="padding: 0.4rem; font-size: 0.8rem;">Volver a ver</a>
              </div>`;
          });
          histContainer.innerHTML = '';
          histContainer.appendChild(grid);
        }

        // 5. Notificaciones
        const notifRes = await fetch(`${API_BASE}/api/notificaciones/${user.id}`);
        const notifs = await notifRes.json();
        const unread = notifs.filter(n => !n.leida);
        if (unread.length > 0) {
          document.getElementById('notif-dot').style.display = 'block';
        }

      } catch (e) {
        console.warn('Error cargando dashboard:', e);
      }
    }

    loadDashboard();

    // Lógica del Modal de Perfil
    function openProfileModal() {
      document.getElementById('prof-company').value = user.company || '';
      document.getElementById('prof-nombre').value = user.nombre || '';
      document.getElementById('profile-modal').classList.add('active');
    }

    function closeProfileModal() {
      document.getElementById('profile-modal').classList.remove('active');
    }

    async function saveProfile(e) {
      e.preventDefault();
      const company = document.getElementById('prof-company').value.trim();
      const nombre = document.getElementById('prof-nombre').value.trim();
      try {
        const res = await ProVendAuth.apiFetch(`${API_BASE}/api/usuarios/empresa/${user.id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ company, nombre })
        });
        if(res.ok) {
          // Actualizar localStorage
          user.company = company;
          user.nombre = nombre;
          localStorage.setItem('provend_user', JSON.stringify(user));
          alert('¡Perfil actualizado correctamente!');
          window.location.reload();
        } else {
          alert('Hubo un error al actualizar el perfil.');
        }
      } catch (err) {
        console.error(err);
        alert('Error de conexión.');
      }
    }

    function goSearch() {
      const q = document.getElementById('hero-search-input')?.value.trim() || '';
      window.location.href = 'explorar.html?tab=empresas' + (q ? '&q=' + encodeURIComponent(q) : '');
    }
    const searchInput = document.getElementById('hero-search-input');
    if (searchInput) {
      searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') goSearch();
      });
    }

    // --- REQUERIMIENTOS LOGIC ---
    window.openReqModal = function() {
      document.getElementById('reqModal').classList.add('active');
    };
    window.closeReqModal = function() {
      document.getElementById('reqModal').classList.remove('active');
      document.getElementById('form-req').reset();
    };

    window.submitReq = async function(e) {
      e.preventDefault();
      const btn = document.querySelector('#form-req button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
      const data = {
        empresa_id: user.id,
        titulo: document.getElementById('req-titulo').value,
        cantidad: document.getElementById('req-cantidad').value,
        unidad: document.getElementById('req-unidad').value,
        urgencia: document.getElementById('req-urgencia').value,
        descripcion: document.getElementById('req-descripcion').value
      };
      
      try {
        const res = await ProVendAuth.apiFetch(API_BASE + '/api/requerimientos', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error al guardar');
        closeReqModal();
        alert('Requerimiento publicado exitosamente.');
        loadRequerimientos();
      } catch (err) {
        alert('Ocurrió un error. Intenta de nuevo.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Publicar Requerimiento'; }
      }
    };

    window.deleteReq = async function(id) {
      if(!confirm('¿Seguro que deseas eliminar este requerimiento?')) return;
      try {
        const res = await ProVendAuth.apiFetch(API_BASE + '/api/requerimientos/' + id, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Error');
        alert('Eliminado con éxito.');
        loadRequerimientos();
      } catch(err) {
        alert('No se pudo eliminar.');
      }
    };

    async function loadRequerimientos() {
      const container = document.getElementById('requerimientos-container');
      if(!container) return;
      try {
        const res = await fetch(API_BASE + '/api/requerimientos');
        const allReqs = await res.json();
        const myReqs = allReqs.filter(r => r.empresa_id === user.id);
        
        if (myReqs.length === 0) {
          container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1"><h3>No tienes requerimientos activos</h3><p>Publica uno nuevo para empezar.</p></div>';
          return;
        }
        
        let html = '';
        myReqs.forEach(r => {
          html += `
            <div class="prov-card" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; border: 1px solid var(--neutral-200); border-radius: 12px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <h3 style="font-size:1.125rem; font-weight:700; color:var(--neutral-900); margin-bottom:0.25rem">${r.titulo}</h3>
                  <span style="font-size:0.875rem; color:var(--neutral-500);">${r.cantidad} ${r.unidad} • Urgencia: ${r.urgencia}</span>
                </div>
                <span class="inv-card-status" style="font-size:0.75rem">${r.estado || 'Activo'}</span>
              </div>
              <p style="font-size:0.875rem; color:var(--neutral-600); margin:0;">${r.descripcion || 'Sin descripción'}</p>
              <div style="display:flex; justify-content:flex-end; border-top: 1px solid var(--neutral-100); padding-top: 1rem;">
                <button class="btn-xs btn-xs-danger" onclick="deleteReq(${r.id})">❌ Eliminar</button>
              </div>
            </div>
          `;
        });
        container.innerHTML = html;
      } catch(e) {
        container.innerHTML = '<p>Error cargando requerimientos.</p>';
      }
    }
    
    // Call loadRequerimientos inside DOMContentLoaded
    loadRequerimientos();

        // -- NOTIFICATIONS DROPDOWN LOGIC --
        setTimeout(() => {
            const btn = document.getElementById('notif-btn');
            const drop = document.getElementById('notif-dropdown');
            const list = document.getElementById('notif-list');
            if (btn && drop) {
                btn.onclick = async () => {
                    const isShowing = drop.style.display === 'block';
                    drop.style.display = isShowing ? 'none' : 'block';
                    if (!isShowing) {
                        try {
                            const res = await fetch(API_BASE + '/api/notificaciones/' + user.id);
                            const notifs = await res.json();
                            if (notifs.length === 0) {
                                list.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--neutral-500); font-size:0.875rem;">No tienes notificaciones</div>';
                            } else {
                                list.innerHTML = notifs.map(n => `
                                    <div style="padding:0.75rem; border-bottom:1px solid var(--neutral-100); background:${n.leida ? 'transparent' : '#f0f9ff'}">
                                        <div style="font-size:0.875rem; color:var(--neutral-900); margin-bottom:0.25rem">${n.mensaje}</div>
                                        <div style="font-size:0.75rem; color:var(--neutral-500)">Hace un momento</div>
                                    </div>
                                `).join('');
                            }
                        } catch(e) {
                            list.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--danger-500); font-size:0.875rem;">Error al cargar</div>';
                        }
                    }
                };
                document.addEventListener('click', (e) => {
                    if (!btn.contains(e.target) && !drop.contains(e.target)) {
                        drop.style.display = 'none';
                    }
                });
            }
        }, 1000);
        

// ==========================================
// PASAPORTES DIGITALES
// ==========================================
async function cargarDatosPasaporte() {
    try {
        const res = await fetch(`${API_BASE}/api/search?type=empresas`);
        if (res.ok) {
            const proveedores = await res.json();
            const select = document.getElementById('pass_prov');
            if(select) {
                select.innerHTML = '<option value="">Selecciona el proveedor...</option>';
                proveedores.forEach(p => {
                    select.innerHTML += `<option value="${p.usuario_id}">${p.company || p.nombre}</option>`;
                });
            }
        }
        
        cargarListaPasaportes();
    } catch(e) { console.error(e); }
}

async function cargarListaPasaportes() {
    try {
        const res = await fetch(`${API_BASE}/api/pasaportes`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (res.ok) {
            const data = await res.json();
            const container = document.getElementById('lista-pasaportes');
            if(!container) return;
            container.innerHTML = '';
            
            if(data.length === 0) {
                container.innerHTML = '<p style="grid-column:1/-1; color:#94A3B8;">Aún no has generado ningún pasaporte QR.</p>';
                return;
            }
            
            data.forEach(p => {
                const url = `${window.location.origin}/pasaporte.html?id=${p.id}`;
                container.innerHTML += `
                <div class="card" style="display:flex; flex-direction:column; gap:1rem;">
                    <div style="display:flex; justify-content:space-between;">
                        <strong style="color:var(--primary-700);">${p.id}</strong>
                        <span style="font-size:0.75rem; color:#64748B;">${new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <div style="font-size:1.1rem; font-weight:700;">${p.producto_final}</div>
                        <div style="font-size:0.85rem; color:#64748B;">Origen: ${p.proveedor_nombre}</div>
                    </div>
                    <div id="qr-${p.id}" style="margin:1rem auto; padding:10px; background:white; border-radius:8px;"></div>
                    <a href="${url}" target="_blank" class="btn btn-outline" style="text-align:center;">Ver Pasaporte Público</a>
                </div>`;
            });
            
            // Generar QRs
            setTimeout(() => {
                data.forEach(p => {
                    const url = `${window.location.origin}/pasaporte.html?id=${p.id}`;
                    if(document.getElementById(`qr-${p.id}`)) {
                        new QRCode(document.getElementById(`qr-${p.id}`), {
                            text: url,
                            width: 128,
                            height: 128,
                            colorDark: "#000000",
                            colorLight: "#ffffff"
                        });
                    }
                });
            }, 100);
        }
    } catch(e) { console.error(e); }
}

window.generarPasaporte = async function(e) {
    e.preventDefault();
    const data = {
        proveedor_id: document.getElementById('pass_prov').value,
        material_origen: document.getElementById('pass_mat').value,
        producto_final: document.getElementById('pass_prod').value,
        porcentaje_reciclado: document.getElementById('pass_perc').value,
        co2_evitado: document.getElementById('pass_co2').value,
        costo_reducido: document.getElementById('pass_cost').value
    };
    
    try {
        const res = await fetch(`${API_BASE}/api/pasaportes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            showToast('Pasaporte generado con éxito');
            document.getElementById('form-pasaporte').reset();
            cargarListaPasaportes();
        } else {
            showToast('Error al generar pasaporte', 'error');
        }
    } catch(e) { console.error(e); }
};

// Hook into initial load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(cargarDatosPasaporte, 500);
});
