const fs = require('fs');

// 1. PATCH SERVER.JS
let serverContent = fs.readFileSync('server.js', 'utf8');

const oldEndpointRegex = /app\.put\('\/api\/dashboard\/proveedor\/:id\/perfil'[\s\S]*?res\.status\(500\)\.json\(\{ error: err\.message \}\);\s*\n\s*\}\s*\n\}\);/;

const newEndpoint = `app.put('/api/dashboard/proveedor/:id/perfil', authenticateToken, async (req, res) => {
    if (req.user.id !== parseInt(req.params.id) && req.user.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    const { logo_url, descripcion, ciudad, categoria, telefono, whatsapp, sitio_web, horario, cobertura, capacidad_mensual_toneladas, tiene_transporte } = req.body;
    try {
        await dbRun(\`
            INSERT INTO perfiles_proveedor (
                usuario_id, logo_url, descripcion, ciudad, categoria, telefono, whatsapp, sitio_web, horario, cobertura, capacidad_mensual_toneladas, tiene_transporte
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(usuario_id) DO UPDATE SET
                logo_url = COALESCE(EXCLUDED.logo_url, perfiles_proveedor.logo_url),
                descripcion = COALESCE(EXCLUDED.descripcion, perfiles_proveedor.descripcion),
                ciudad = COALESCE(EXCLUDED.ciudad, perfiles_proveedor.ciudad),
                categoria = COALESCE(EXCLUDED.categoria, perfiles_proveedor.categoria),
                telefono = COALESCE(EXCLUDED.telefono, perfiles_proveedor.telefono),
                whatsapp = COALESCE(EXCLUDED.whatsapp, perfiles_proveedor.whatsapp),
                sitio_web = COALESCE(EXCLUDED.sitio_web, perfiles_proveedor.sitio_web),
                horario = COALESCE(EXCLUDED.horario, perfiles_proveedor.horario),
                cobertura = COALESCE(EXCLUDED.cobertura, perfiles_proveedor.cobertura),
                capacidad_mensual_toneladas = COALESCE(EXCLUDED.capacidad_mensual_toneladas, perfiles_proveedor.capacidad_mensual_toneladas),
                tiene_transporte = COALESCE(EXCLUDED.tiene_transporte, perfiles_proveedor.tiene_transporte)
        \`, [req.params.id, logo_url, descripcion, ciudad, categoria, telefono, whatsapp, sitio_web, horario, cobertura, capacidad_mensual_toneladas, tiene_transporte]);
        res.json({ message: 'Perfil actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});`;

if (serverContent.match(oldEndpointRegex)) {
    serverContent = serverContent.replace(oldEndpointRegex, newEndpoint);
    fs.writeFileSync('server.js', serverContent, 'utf8');
    console.log('Patched server.js: updated PUT /api/dashboard/proveedor/:id/perfil to use ON CONFLICT DO UPDATE');
} else {
    console.log('Could not find old endpoint in server.js');
}

// 2. PATCH DASHBOARD-PROVEEDOR.HTML
let dashContent = fs.readFileSync('dashboard-proveedor.html', 'utf8');

// Add button
const headerButtons = `<button class="btn" style="background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.3)" onclick="openPerfilModal()">⚙️ Editar Perfil</button>\n          <button class="btn" style="background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.3)" onclick="openMaterialModal()">📦 Publicar material</button>`;
dashContent = dashContent.replace(/<button class="btn" style="background:rgba\(255,255,255,0\.1\); color:white; border:1px solid rgba\(255,255,255,0\.3\)" onclick="openMaterialModal\(\)">.*?<\/button>/, headerButtons);

// Add Modal HTML
const modalHtml = `
  <!-- Modal Editar Perfil -->
  <div id="modal-perfil" class="modal">
    <div class="modal-content" style="max-width: 600px;">
      <span class="close" onclick="document.getElementById('modal-perfil').style.display='none'">&times;</span>
      <h3>⚙️ Editar Información Comercial</h3>
      <p style="color:var(--neutral-500); margin-bottom:1.5rem; font-size:0.9rem;">Completa tu perfil para ganar más confianza de las empresas compradoras.</p>
      
      <form id="form-perfil" onsubmit="submitPerfil(event)">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
            <div class="form-group" style="margin-bottom:0;">
            <label>Ciudad Base *</label>
            <input type="text" id="perfil-ciudad" placeholder="Ej. Managua, Masaya..." required>
            </div>
            <div class="form-group" style="margin-bottom:0;">
            <label>Categoría Principal *</label>
            <input type="text" id="perfil-categoria" placeholder="Ej. Reciclaje de Plásticos" required>
            </div>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
            <div class="form-group" style="margin-bottom:0;">
            <label>Teléfono de Contacto</label>
            <input type="tel" id="perfil-telefono" placeholder="+505 ...">
            </div>
            <div class="form-group" style="margin-bottom:0;">
            <label>WhatsApp (solo números)</label>
            <input type="tel" id="perfil-whatsapp" placeholder="Ej. 50588888888">
            </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
            <div class="form-group" style="margin-bottom:0;">
            <label>Capacidad Mensual (Ton)</label>
            <input type="text" id="perfil-capacidad" placeholder="Ej. 50">
            </div>
            <div class="form-group" style="margin-bottom:0;">
            <label>¿Ofreces Transporte?</label>
            <select id="perfil-transporte">
                <option value="0">No, el cliente retira</option>
                <option value="1">Sí, ofrezco transporte</option>
            </select>
            </div>
        </div>
        
        <div class="form-group">
          <label>Descripción de la Empresa</label>
          <textarea id="perfil-descripcion" rows="4" placeholder="Cuéntanos sobre tu operación, años de experiencia, calidad de materiales..."></textarea>
        </div>
        
        <button type="submit" class="btn btn-primary" id="btn-submit-perfil" style="width:100%; margin-top:1rem;">Guardar Cambios</button>
      </form>
    </div>
  </div>`;

if (!dashContent.includes('id="modal-perfil"')) {
    dashContent = dashContent.replace('<!-- Fin Dashboard -->', `<!-- Fin Dashboard -->\n${modalHtml}`);
}

// Add JS Logic
const jsLogic = `
    async function openPerfilModal() {
      const modal = document.getElementById('modal-perfil');
      
      // Load current profile data
      try {
        const res = await ProVendAuth.apiFetch(\`\${API_BASE}/api/dashboard/proveedor/\${ProVendAuth.getUser().id}\`);
        if (res.ok) {
            const data = await res.json();
            const perfil = data.perfil;
            if (perfil) {
                document.getElementById('perfil-ciudad').value = perfil.ciudad || '';
                document.getElementById('perfil-categoria').value = perfil.categoria || '';
                document.getElementById('perfil-telefono').value = perfil.telefono || '';
                document.getElementById('perfil-whatsapp').value = perfil.whatsapp || '';
                document.getElementById('perfil-capacidad').value = perfil.capacidad_mensual_toneladas || '';
                document.getElementById('perfil-transporte').value = perfil.tiene_transporte || '0';
                document.getElementById('perfil-descripcion').value = perfil.descripcion || '';
            }
        }
      } catch (err) {
          console.error('Error cargando perfil:', err);
      }
      
      modal.style.display = 'flex';
    }

    async function submitPerfil(e) {
      e.preventDefault();
      const btn = document.getElementById('btn-submit-perfil');
      btn.textContent = 'Guardando...';
      btn.disabled = true;

      const body = {
        ciudad: document.getElementById('perfil-ciudad').value,
        categoria: document.getElementById('perfil-categoria').value,
        telefono: document.getElementById('perfil-telefono').value,
        whatsapp: document.getElementById('perfil-whatsapp').value,
        capacidad_mensual_toneladas: document.getElementById('perfil-capacidad').value,
        tiene_transporte: parseInt(document.getElementById('perfil-transporte').value),
        descripcion: document.getElementById('perfil-descripcion').value
      };

      try {
        const res = await ProVendAuth.apiFetch(\`\${API_BASE}/api/dashboard/proveedor/\${ProVendAuth.getUser().id}/perfil\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const err = await res.json().catch(()=>({}));
          throw new Error(err.error || 'Error al guardar el perfil');
        }

        showToast('Perfil actualizado correctamente', 'success');
        document.getElementById('modal-perfil').style.display = 'none';
        
        // Reload dashboard stats to update completion checklist
        await loadDashboard();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.textContent = 'Guardar Cambios';
        btn.disabled = false;
      }
    }
`;

if (!dashContent.includes('function openPerfilModal')) {
    dashContent = dashContent.replace('// Modal functions', `// Modal functions\n${jsLogic}`);
}

fs.writeFileSync('dashboard-proveedor.html', dashContent, 'utf8');
console.log('Patched dashboard-proveedor.html: Added edit profile modal and JS');
