const fs = require('fs');

let content = fs.readFileSync('dashboard-empresa.html', 'utf8');

const misFavoritosHeader = `  <!-- MIS FAVORITOS -->`;

const requerimientosSection = `  <!-- MIS REQUERIMIENTOS -->
  <section class="dashboard-section" style="background:var(--white)">
    <div class="container">
      <div class="section-header" style="display:flex; justify-content:space-between; align-items:center; text-align:left; margin-bottom:2rem">
        <div>
            <span class="section-header-label" style="background:var(--secondary-100); color:var(--secondary-700)">OPORTUNIDADES INVERSAS</span>
            <h2 style="margin-bottom:0">Mis Requerimientos Activos</h2>
        </div>
        <button class="btn btn-primary" onclick="openReqModal()">+ Publicar Requerimiento</button>
      </div>
      <div id="requerimientos-container" class="providers-grid">
        <div class="empty-state" style="grid-column: 1/-1">
          <div class="empty-state-icon">📢</div>
          <h3>No tienes requerimientos activos</h3>
          <p>Publica lo que necesitas comprar y deja que los proveedores te contacten.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- MODAL NUEVO REQUERIMIENTO -->
  <div class="modal-overlay" id="reqModal">
    <div class="modal-content">
      <button class="modal-close" onclick="closeReqModal()">×</button>
      <h3 style="margin-bottom:1.5rem; font-size:1.5rem">Publicar Requerimiento</h3>
      <form id="form-req" onsubmit="submitReq(event)">
        <div class="form-group">
          <label>Título / Qué buscas *</label>
          <input type="text" id="req-titulo" class="input" style="width:100%" placeholder="Ej. 50 Toneladas de PET lavado" required>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem">
          <div class="form-group" style="margin-bottom:0">
            <label>Cantidad *</label>
            <input type="text" id="req-cantidad" class="input" style="width:100%" placeholder="Ej. 50" required>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label>Unidad *</label>
            <select id="req-unidad" class="input" style="width:100%">
              <option value="toneladas">Toneladas</option>
              <option value="kg">Kilogramos</option>
              <option value="unidades">Unidades</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Nivel de Urgencia *</label>
          <select id="req-urgencia" class="input" style="width:100%">
            <option value="Alta">Alta (Lo necesito YA)</option>
            <option value="Media">Media (Esta semana)</option>
            <option value="Baja">Baja (Para el mes)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Descripción / Detalles</label>
          <textarea id="req-descripcion" class="input" style="width:100%" rows="3" placeholder="Calidad esperada, forma de pago, etc."></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%">Publicar Oportunidad</button>
      </form>
    </div>
  </div>

  <!-- MIS FAVORITOS -->`;

content = content.replace(misFavoritosHeader, requerimientosSection);

// Now add the JS functions for requerimientos
const loadUserDataStr = `async function loadUserData() {`;
const reqJsFunctions = `  let currentReqs = [];
  
  function openReqModal() { document.getElementById('reqModal').classList.add('active'); }
  function closeReqModal() { document.getElementById('reqModal').classList.remove('active'); }

  async function loadRequerimientos() {
    try {
      const res = await ProVendAuth.apiFetch(\`http://localhost:3000/api/requerimientos/empresa/\${user.id}\`);
      currentReqs = await res.json();
      renderReqs();
    } catch(err) {
      console.error(err);
    }
  }

  function renderReqs() {
    const container = document.getElementById('requerimientos-container');
    if(!currentReqs || currentReqs.length === 0) {
      container.innerHTML = \`<div class="empty-state" style="grid-column: 1/-1"><div class="empty-state-icon">📢</div><h3>No tienes requerimientos activos</h3><p>Publica lo que necesitas comprar y deja que los proveedores te contacten.</p></div>\`;
      return;
    }

    container.innerHTML = '';
    currentReqs.forEach(req => {
      const urgenciaColor = req.urgencia === 'Alta' ? 'var(--danger-600)' : (req.urgencia === 'Media' ? 'var(--warning-600)' : 'var(--success-600)');
      const urgenciaBg = req.urgencia === 'Alta' ? 'var(--danger-50)' : (req.urgencia === 'Media' ? 'var(--warning-50)' : 'var(--success-50)');
      
      container.innerHTML += \`
        <div class="prov-card" style="display:flex; flex-direction:column">
          <div style="display:flex; justify-content:space-between; margin-bottom:1rem">
            <span style="background:\${urgenciaBg}; color:\${urgenciaColor}; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:700">\${req.urgencia}</span>
            <span style="color:var(--neutral-500); font-size:0.75rem">\${new Date(req.created_at).toLocaleDateString()}</span>
          </div>
          <h3 style="margin-bottom:0.5rem; font-size:1.1rem">\${req.titulo}</h3>
          <p style="color:var(--neutral-600); font-size:0.875rem; flex:1; margin-bottom:1rem">\${req.cantidad} \${req.unidad}</p>
          <button class="btn btn-outline" style="width:100%; border-color:var(--danger-500); color:var(--danger-600)" onclick="deleteReq(\${req.id})">Cerrar / Eliminar</button>
        </div>
      \`;
    });
  }

  async function submitReq(e) {
    e.preventDefault();
    const payload = {
      empresa_id: user.id,
      titulo: document.getElementById('req-titulo').value,
      cantidad: document.getElementById('req-cantidad').value,
      unidad: document.getElementById('req-unidad').value,
      urgencia: document.getElementById('req-urgencia').value,
      descripcion: document.getElementById('req-descripcion').value
    };

    try {
      const res = await ProVendAuth.apiFetch('http://localhost:3000/api/requerimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        closeReqModal();
        e.target.reset();
        loadRequerimientos();
      } else {
        alert('Error al publicar');
      }
    } catch(err) { alert('Error de red'); }
  }

  async function deleteReq(id) {
    if(!confirm('¿Seguro que deseas eliminar este requerimiento?')) return;
    try {
      const res = await ProVendAuth.apiFetch(\`http://localhost:3000/api/requerimientos/\${id}\`, { method: 'DELETE' });
      if(res.ok) loadRequerimientos();
    } catch(err) { console.error(err); }
  }

  async function loadUserData() {`;

content = content.replace(loadUserDataStr, reqJsFunctions);

// Add call to loadRequerimientos in DOMContentLoaded
const loadCallStr = `loadFavoritos();`;
content = content.replace(loadCallStr, `loadFavoritos();\n      loadRequerimientos();`);

fs.writeFileSync('dashboard-empresa.html', content, 'utf8');
console.log('dashboard-empresa.html updated for requerimientos');
