const user = window.ProVendAuth ? ProVendAuth.getCurrentUser() : null;
    if (!user || user.rol !== 'proveedor') window.location.href = 'login.html';

    // -- Navbar --
    function buildProvNavbar(u) {
      const name = u.company || u.nombre || 'Proveedor';
      const initials = name.substring(0, 2).toUpperCase();
      return `
        <nav class="navbar" id="navbar">
          <div class="navbar-inner">
            <a href="dashboard-proveedor.html" class="navbar-logo">
              ${getLogoSVG(36)}
              <span class="navbar-logo-text">Pro<span>Vend</span></span>
            </a>
            <div class="navbar-nav">
              <a href="dashboard-proveedor.html" class="navbar-link active">Mi Negocio</a>
              <a href="perfil-proveedor.html?id=${u.id}" target="_blank" class="navbar-link">Perfil Público</a>
            </div>
            <div class="navbar-actions" style="gap:0.75rem">
              <button id="notif-btn" style="background:none; border:none; cursor:pointer; color:var(--neutral-600); position:relative;" title="Notificaciones">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span id="notif-dot" style="display:none; position:absolute; top:-2px; right:-2px; width:8px; height:8px; background:var(--danger-500); border-radius:50%; border:2px solid white;"></span>
              </button>
              <div style="display:flex; align-items:center; gap:0.5rem; padding:0.3rem 0.75rem; border-radius:99px; border:1px solid var(--neutral-200); background: var(--white); box-shadow:0 1px 4px rgba(0,0,0,0.06)">
                <div style="width:28px; height:28px; background:var(--primary-100); color:var(--primary-700); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem;">${initials}</div>
                <span style="font-size:0.875rem; font-weight:500; color:var(--neutral-800); max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${name}</span>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="ProVendAuth.logout()" style="color:var(--danger-600)">Salir</button>
            </div>
          </div>
        </nav>`;
    }

    document.getElementById('navbar-container').innerHTML = buildProvNavbar(user);
    document.getElementById('footer-container').innerHTML = buildFooter();
    document.getElementById('btn-perfil-publico').href = `perfil-proveedor.html?id=${user.id}`;

    // Saludo
    const name = user.company || user.nombre || 'Proveedor';
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    document.getElementById('prov-title').textContent = `${greet}, ${name}`;

    // -- Modals --
    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }
    document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', e => { if(e.target === m) m.classList.remove('open'); }));

    // -- Animación KPI --
    function animateKPI(el, newVal) {
      el.classList.remove('kpi-updated');
      void el.offsetWidth;
      el.textContent = newVal;
      el.classList.add('kpi-updated');
    }

    // -- Confeti --
    function launchConfetti() {
      const container = document.getElementById('confetti');
      const colors = ['#2B7DE9','#4ade80','#f59e0b','#ec4899','#8b5cf6','#ef4444'];
      container.innerHTML = '';
      for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.cssText = `
          left: ${Math.random() * 100}%;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          width: ${6 + Math.random() * 8}px;
          height: ${6 + Math.random() * 8}px;
          border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
          animation-duration: ${1.5 + Math.random() * 2}s;
          animation-delay: ${Math.random() * 0.5}s;`;
        container.appendChild(piece);
      }
    }

    function showCelebration(emoji, title, sub) {
      document.getElementById('cel-emoji').textContent = emoji;
      document.getElementById('cel-title').textContent = title;
      document.getElementById('cel-sub').textContent = sub;
      launchConfetti();
      document.getElementById('celebration').classList.add('show');
    }

    function closeCelebration() {
      document.getElementById('celebration').classList.remove('show');
      document.getElementById('confetti').innerHTML = '';
    }

    // -- Dashboard --
    let prevKpi = null;
    let currentEditMaterialId = null;

    function openMaterialModal(mat = null) {
      const form = document.getElementById('form-material');
      const title = document.querySelector('#modal-material h3');
      const btn = document.getElementById('btn-submit-mat');
      
      if (mat) {
        currentEditMaterialId = mat.id;
        title.textContent = '✏️ Editar Material';
        btn.textContent = 'Guardar Cambios';
        document.getElementById('mat-nombre').value = mat.nombre || '';
        document.getElementById('mat-cantidad').value = mat.cantidad || '';
        document.getElementById('mat-unidad').value = mat.unidad || 'kg';
        document.getElementById('mat-precio').value = mat.precio_estimado || '';
        document.getElementById('mat-volumen').value = mat.volumen_minimo || '';
        document.getElementById('mat-frecuencia').value = mat.frecuencia_disponibilidad || 'Mensual';
        document.getElementById('mat-calidad').value = mat.calidad_pureza || '';
        document.getElementById('mat-descripcion').value = mat.descripcion || '';
      } else {
        currentEditMaterialId = null;
        form.reset();
        title.textContent = '📦 Publicar Material';
        btn.textContent = 'Publicar Material';
      }
      openModal('modal-material');
    }

    async function loadDashboard() {
      try {
        // KPIs
        const kpiRes = await ProVendAuth.apiFetch(`${API_BASE}/api/dashboard/proveedor/${user.id}`);
        const kpi = await kpiRes.json();

        animateKPI(document.getElementById('kpi-materiales'), kpi.materiales || 0);
        animateKPI(document.getElementById('kpi-productos'), kpi.productos || 0);
        animateKPI(document.getElementById('kpi-visitas'), kpi.visitas || 0);
        animateKPI(document.getElementById('kpi-resenas'), kpi.resenas || 0);
        animateKPI(document.getElementById('kpi-favoritos'), kpi.favoritos || 0);

        // Sub-labels KPI (punto 9)
        document.getElementById('kpi-materiales-sub').textContent = kpi.materiales > 0 ? `${kpi.materiales} publicado${kpi.materiales > 1 ? 's' : ''}` : 'Todavía sin publicar';
        document.getElementById('kpi-productos-sub').textContent = kpi.productos > 0 ? `${kpi.productos} publicado${kpi.productos > 1 ? 's' : ''}` : 'Todavía sin publicar';
        document.getElementById('kpi-visitas-sub').textContent = kpi.visitas > 0 ? 'Visitas a tu perfil' : 'Todavía sin visitas';
        document.getElementById('kpi-resenas-sub').textContent = kpi.resenas > 0 ? `${kpi.resenas} reseña${kpi.resenas > 1 ? 's' : ''} recibida${kpi.resenas > 1 ? 's' : ''}` : 'Todavía sin reseñas';
        document.getElementById('kpi-favoritos-sub').textContent = kpi.favoritos > 0 ? 'Empresas que te guardaron' : 'Todavía ninguno';

        const rating = Number(kpi.rating) || 0;
        if (kpi.resenas > 0) {
          animateKPI(document.getElementById('kpi-rating'), `? ${rating.toFixed(1)}`);
          document.getElementById('kpi-rating').style.color = 'var(--warning-500)';
          document.getElementById('kpi-rating-sub').textContent = `Sobre ${kpi.resenas} reseña${kpi.resenas > 1 ? 's' : ''}`;
        } else {
          document.getElementById('kpi-rating-sub').textContent = 'Sin calificaciones';
        }

        // -- Onboarding dinámico (punto 1) --
        const steps = [
          { done: true,              label: 'Crear tu cuenta', desc: 'Ya estás registrado en ProVend.' },
          { done: kpi.materiales > 0, label: 'Publicar tu primer material', desc: 'Para que las empresas puedan encontrarte.', action: "openMaterialModal()", actionLabel: 'Publicar ?' },
          { done: false,              label: 'Completar información comercial', desc: 'Dirección, teléfono, WhatsApp y categoría.' },
          { done: false,              label: 'Solicitar verificación', desc: 'Los verificados reciben 3× más contactos.' },
        ];

        const allDone = steps.every(s => s.done);
        const currentIdx = steps.findIndex(s => !s.done);

        // Health pill — modo onboarding vs. modo porcentaje (punto 10)
        const pillContent = document.getElementById('health-pill-content');
        const healthBar = document.getElementById('health-bar-wrap');

        // Calcular score para cuando ya completó onboarding
        let score = 0;
        if (user.company || user.nombre) score += 30;
        if (user.email) score += 20;
        if (kpi.materiales > 0) score += 30;
        if (kpi.resenas > 0) score += 20;

        if (!allDone && currentIdx <= 1) {
          // Modo onboarding: mostrar "Paso X de Y"
          document.getElementById('health-label').textContent = 'Primeros pasos';
          pillContent.innerHTML = `
            <div class="health-step-label">Paso ${currentIdx + 1} de ${steps.length}</div>
            <div class="health-step-sub">${steps[currentIdx].label}</div>`;
          healthBar.style.display = 'none';
          document.getElementById('health-hint').textContent = `${steps.filter(s=>s.done).length}/${steps.length} completados`;
        } else {
          // Modo porcentaje
          document.getElementById('health-label').textContent = 'Salud del perfil';
          pillContent.innerHTML = `<div class="health-pct">${score}%</div>`;
          healthBar.style.display = 'block';
          setTimeout(() => { document.getElementById('health-fill').style.width = score + '%'; }, 100);
          const pending = 4 - steps.filter(s => s.done).length;
          document.getElementById('health-hint').textContent = pending > 0 ? `? ${pending} acción${pending > 1 ? 'es' : ''} pendiente${pending > 1 ? 's' : ''}` : '? Perfil completo';
        }

        // Onboarding card (solo si hay pasos sin completar)
        const obContainer = document.getElementById('onboarding-container');
        if (!allDone) {
          let stepsHTML = steps.map((s, i) => {
            const state = s.done ? 'done' : (i === currentIdx ? 'current' : 'pending');
            return `
              <div class="ob-step ${state}">
                <div class="ob-step-num ${state}">${s.done ? '?' : i + 1}</div>
                <div class="ob-step-info">
                  <div class="ob-step-title">${s.label}</div>
                  <div class="ob-step-desc">${s.desc}</div>
                </div>
                ${s.action && !s.done && i === currentIdx ? `<button class="ob-step-action" onclick="${s.action}">${s.actionLabel}</button>` : ''}
              </div>`;
          }).join('');

          obContainer.innerHTML = `
            <div class="onboarding-card">
              <div class="onboarding-label">?? Primeros pasos</div>
              <div class="onboarding-title">Configura tu perfil en ${steps.length} pasos</div>
              <div class="onboarding-sub">Completa estos pasos para que las empresas puedan encontrarte.</div>
              <div class="onboarding-steps">${stepsHTML}</div>
            </div>`;
        } else {
          obContainer.innerHTML = '';
        }

        // Checklist detallado (punto 2)
        const checkData = [
          { ok: !!(user.company || user.nombre), main: 'Nombre de empresa registrado', sub: user.company || user.nombre || '—' },
          { ok: !!user.email, main: 'Correo de contacto', sub: user.email || 'No registrado' },
          { ok: kpi.materiales > 0, main: 'Materiales publicados', sub: kpi.materiales > 0 ? `${kpi.materiales} material${kpi.materiales > 1 ? 'es' : ''} activo${kpi.materiales > 1 ? 's' : ''}` : 'Publica al menos uno' },
          { ok: kpi.resenas > 0, main: 'Reseñas recibidas', sub: kpi.resenas > 0 ? `${kpi.resenas} reseña${kpi.resenas > 1 ? 's' : ''} de empresas` : 'Aún no tienes reseñas' },
        ];

        document.getElementById('checklist-container').innerHTML = checkData.map(c => `
          <div class="check-item ${c.ok ? 'ok' : 'warn'}">
            <div class="check-icon-dot ${c.ok ? 'ok' : 'warn'}">${c.ok ? '?' : '!'}</div>
            <div class="check-text">
              <div class="check-main">${c.main}</div>
              <div class="check-sub">${c.sub}</div>
            </div>
          </div>`).join('');

        // Materiales
        const matRes = await ProVendAuth.apiFetch(`${API_BASE}/api/dashboard/proveedor/${user.id}/materiales`);
        const mats = await matRes.json();
        const matContainer = document.getElementById('materiales-container');

        if (mats.length === 0) {
          matContainer.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">??</div>
              <h3>No has publicado materiales todavía</h3>
              <p>Publica tu primer material para que las empresas puedan encontrarte en la plataforma.</p>
              <button class="btn btn-primary" onclick="openMaterialModal()">Publicar mi primer material</button>
            </div>`;
        } else {
          const grid = document.createElement('div');
          grid.className = 'inv-grid';
          mats.forEach((m, idx) => {
            const card = document.createElement('div');
            card.className = 'inv-card';
            card.style.animationDelay = `${idx * 0.08}s`;
            card.innerHTML = `
              ${m.imagen_url ? `<img src="${API_BASE}${m.imagen_url}" alt="${m.nombre}" style="width: 100%; height: 150px; object-fit: cover; border-bottom: 1px solid var(--neutral-200);">` : `<div style="width: 100%; height: 150px; background: var(--neutral-100); display: flex; align-items: center; justify-content: center; color: var(--neutral-400); border-bottom: 1px solid var(--neutral-200);">Sin imagen</div>`}
              <div class="inv-card-body">
                <div class="inv-card-name">${m.nombre}</div>
                <div class="inv-card-meta">📦 ${m.cantidad} ${m.unidad}</div>
                ${m.descripcion ? `<div class="inv-card-meta">${m.descripcion}</div>` : ''}
                <span class="inv-card-status">Activo</span>
                <div class="inv-card-actions">
                  <button onclick='openMaterialModal(${JSON.stringify(m).replace(/"/g, "&quot;")})'>✏️ Editar</button>
                  <button class="danger" onclick="deleteMaterial(${m.id}, this)">🗑️ Eliminar</button>
                </div>
              </div>`;
            grid.appendChild(card);
          });
          matContainer.innerHTML = '';
          matContainer.appendChild(grid);
        }

        // Notificaciones (punto 6)
        const notifRes = await ProVendAuth.apiFetch(`${API_BASE}/api/notificaciones/${user.id}`);
        const notifs = await notifRes.json();
        const actContainer = document.getElementById('actividad-container');

        const unread = notifs.filter(n => !n.leida);
        if (unread.length > 0) document.getElementById('notif-dot').style.display = 'block';

        if (notifs.length === 0) {
          actContainer.innerHTML = `
            <div class="notif-empty">
              <div class="notif-empty-icon">?</div>
              <h4>Todo está al día</h4>
              <p>Aquí aparecerán nuevas actividades cuando alguien visite tu perfil o te contacte.</p>
            </div>`;
        } else {
          const list = document.createElement('div');
          list.style.cssText = 'display:flex;flex-direction:column;gap:0.75rem;max-width:640px;margin:0 auto';
          notifs.forEach(n => {
            const d = new Date(n.created_at);
            list.innerHTML += `
              <div style="display:flex;align-items:flex-start;gap:1rem;padding:1rem 1.25rem;background: var(--white);border:1px solid var(--neutral-200);border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.05);${!n.leida ? 'border-left:3px solid var(--primary-500)' : ''}">
                <div style="font-size:1.25rem">${n.tipo === 'visita' ? '??' : n.tipo === 'material' ? '??' : '??'}</div>
                <div style="flex:1">
                  <div style="font-weight:500;color:var(--neutral-800)">${n.mensaje}</div>
                  <div style="font-size:0.75rem;color:var(--neutral-400);margin-top:0.25rem">${timeAgo(d)}</div>
                </div>
              </div>`;
          });
          actContainer.innerHTML = '';
          actContainer.appendChild(list);
        }

        // Actualizar subtítulo del hero
        const acts = [];
        if (kpi.visitas > 0) acts.push(`${kpi.visitas} visitas al perfil`);
        if (kpi.resenas > 0) acts.push(`${kpi.resenas} reseñas`);
        if (kpi.favoritos > 0) acts.push(`${kpi.favoritos} en favoritos`);
        document.getElementById('prov-subtitle').textContent = acts.length > 0
          ? 'Tu actividad: ' + acts.join(' · ')
          : 'Completa tu perfil para ganar más visibilidad.';

        prevKpi = kpi;
      } catch(e) {
        console.warn('Error cargando dashboard:', e);
        document.getElementById('prov-subtitle').textContent = 'Error conectando con el servidor.';
      }
    }

    async function submitMaterial(e) {
      e.preventDefault();

      const nombre = document.getElementById('mat-nombre').value.trim();
      const cantidad = document.getElementById('mat-cantidad').value.trim();
      if (!nombre || !cantidad) {
          showToast('Nombre y cantidad son obligatorios', 'error');
          return;
      }

      const btn = document.getElementById('btn-submit-mat');
      btn.textContent = 'Publicando...'; btn.disabled = true;

      const isFirst = !prevKpi || prevKpi.materiales === 0;

      try {
        let imagenUrl = null;
        const fileInput = document.getElementById('mat-imagen');
        
        // 1. Subir imagen si se seleccionó una
        if (fileInput.files && fileInput.files[0]) {
          const formData = new FormData();
          formData.append('file', fileInput.files[0]);
          const uploadRes = await ProVendAuth.apiFetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            body: formData
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            imagenUrl = uploadData.url;
          }
        }

        // 2. Guardar material en DB (con todos los campos)
        const matPrecio = document.getElementById('mat-precio');
        const matVolumen = document.getElementById('mat-volumen');
        const matFrecuencia = document.getElementById('mat-frecuencia');
        const matCalidad = document.getElementById('mat-calidad');

        const method = currentEditMaterialId ? 'PUT' : 'POST';
        const url = currentEditMaterialId ? `${API_BASE}/api/materiales/${currentEditMaterialId}` : `${API_BASE}/api/materiales`;

        const res = await ProVendAuth.apiFetch(url, {
          method: method,
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            proveedor_id: user.id,
            nombre: document.getElementById('mat-nombre').value,
            cantidad: document.getElementById('mat-cantidad').value,
            unidad: document.getElementById('mat-unidad').value,
            descripcion: document.getElementById('mat-descripcion').value,
            imagen_url: imagenUrl,
            precio_estimado: matPrecio ? matPrecio.value : null,
            volumen_minimo: matVolumen ? matVolumen.value : null,
            frecuencia_disponibilidad: matFrecuencia ? matFrecuencia.value : null,
            calidad_pureza: matCalidad ? matCalidad.value : null
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Error al publicar');
        }
        closeModal('modal-material');
        document.getElementById('form-material').reset();

        // Punto 7 — Celebración primer material
        if (isFirst) {
          setTimeout(() => {
            showCelebration('??', '¡Excelente!', 'Has publicado tu primer material. Ya puedes comenzar a recibir visitas.');
          }, 400);
        }

        await loadDashboard();
      } catch (err) {
        showToast(err.message || 'Error al publicar material', 'error');
      } finally {
        btn.textContent = 'Publicar Material'; btn.disabled = false;
      }
    }

    async function deleteMaterial(id, btn) {
      if (!confirm('¿Eliminar este material?')) return;
      btn.textContent = '...'; btn.disabled = true;
      try {
        const res = await ProVendAuth.apiFetch(`${API_BASE}/api/materiales/${id}`, {method: 'DELETE'});
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(data.error || 'Error al eliminar', 'error');
          btn.textContent = 'Eliminar'; btn.disabled = false;
          return;
        }
        showToast('Material eliminado', 'info');
        await loadDashboard();
      } catch (err) {
        showToast('Error de conexión al eliminar', 'error');
        btn.textContent = 'Eliminar'; btn.disabled = false;
      }
    }

    function timeAgo(date) {
      const s = Math.floor((new Date() - date) / 1000);
      if (s < 60) return 'Hace un momento';
      if (s < 3600) return `Hace ${Math.floor(s/60)} minutos`;
      if (s < 86400) return `Hace ${Math.floor(s/3600)} horas`;
      return `Hace ${Math.floor(s/86400)} días`;
    }

    async function openPerfilModal() {
      const modal = document.getElementById('modal-perfil');
      
      try {
        const res = await ProVendAuth.apiFetch(`${API_BASE}/api/perfiles_proveedor/${ProVendAuth.getCurrentUser().id}`);
        if (res.ok) {
            const perfil = await res.json();
            if (perfil) {
                document.getElementById('perfil-ciudad').value = perfil.ciudad || '';
                document.getElementById('perfil-categoria').value = perfil.categoria || '';
                document.getElementById('perfil-telefono').value = perfil.telefono || '';
                document.getElementById('perfil-whatsapp').value = perfil.whatsapp || '';
                document.getElementById('perfil-web').value = perfil.sitio_web || '';
                document.getElementById('perfil-certificados').value = perfil.certificados || '';
                if(document.getElementById('perfil-logo')) document.getElementById('perfil-logo').value = perfil.logo_url || '';
                if(document.getElementById('perfil-horario')) document.getElementById('perfil-horario').value = perfil.horario || '';
                document.getElementById('perfil-capacidad').value = perfil.capacidad_mensual_toneladas || '';
                document.getElementById('perfil-transporte').value = perfil.tiene_transporte || '0';
                document.getElementById('perfil-descripcion').value = perfil.descripcion || '';
            }
        }
      } catch (err) {
          console.error('Error cargando perfil:', err);
      }
      
      openModal('modal-perfil');
    }

    async function submitPerfil(e) {
      e.preventDefault();

      const telefono = document.getElementById('perfil-telefono').value.trim();
      if (telefono && telefono.length < 8) {
          showToast('El teléfono debe tener al menos 8 dígitos', 'error');
          return;
      }

      const btn = document.getElementById('btn-submit-perfil');
      btn.textContent = 'Guardando...';
      btn.disabled = true;

      const body = {
        ciudad: document.getElementById('perfil-ciudad').value,
        categoria: document.getElementById('perfil-categoria').value,
        telefono: document.getElementById('perfil-telefono').value,
        whatsapp: document.getElementById('perfil-whatsapp').value,
        sitio_web: document.getElementById('perfil-web').value,
        certificados: document.getElementById('perfil-certificados').value,
        logo_url: document.getElementById('perfil-logo') ? document.getElementById('perfil-logo').value : '',
        horario: document.getElementById('perfil-horario') ? document.getElementById('perfil-horario').value : '',
        capacidad_mensual_toneladas: document.getElementById('perfil-capacidad').value,
        tiene_transporte: parseInt(document.getElementById('perfil-transporte').value),
        descripcion: document.getElementById('perfil-descripcion').value
      };

      try {
        const res = await ProVendAuth.apiFetch(`${API_BASE}/api/perfiles_proveedor/${ProVendAuth.getCurrentUser().id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const err = await res.json().catch(()=>({}));
          throw new Error(err.error || 'Error al guardar el perfil');
        }

        showToast('Perfil actualizado correctamente', 'success');
        closeModal('modal-perfil');
        
        await loadDashboard();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.textContent = 'Guardar Cambios';
        btn.disabled = false;
      }
    }

    function showToast(msg, type) {
      const t = document.createElement('div');
      t.style.cssText = `position:fixed;bottom:2rem;right:2rem;background:${type==='success'?'#059669':type==='error'?'#dc2626':'#374151'};color:white;padding:1rem 1.5rem;border-radius:12px;font-weight:500;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);animation:slideUp 0.3s ease`;
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3500);
    }

    loadDashboard();