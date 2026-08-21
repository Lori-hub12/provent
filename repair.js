const fs = require('fs');
let html = fs.readFileSync('dashboard-proveedor.html', 'utf8');

const jsStartMarker = 'async function openPerfilModal()';
const jsEndMarker = 'loadDashboard();\n  </script>';

const idx1 = html.indexOf(jsStartMarker);
const idx2 = html.indexOf(jsEndMarker);

if (idx1 !== -1 && idx2 !== -1) {
    const jsLogic = `async function openPerfilModal() {
      const modal = document.getElementById('modal-perfil');
      
      try {
        const res = await ProVendAuth.apiFetch(\`\${API_BASE}/api/perfiles_proveedor/\${ProVendAuth.getUser().id}\`);
        if (res.ok) {
            const perfil = await res.json();
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
      
      openModal('modal-perfil');
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
        const res = await ProVendAuth.apiFetch(\`\${API_BASE}/api/perfiles_proveedor/\${ProVendAuth.getUser().id}\`, {
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
      t.style.cssText = \`position:fixed;bottom:2rem;right:2rem;background:\${type==='success'?'#059669':type==='error'?'#dc2626':'#374151'};color:white;padding:1rem 1.5rem;border-radius:12px;font-weight:500;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);animation:slideUp 0.3s ease\`;
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3500);
    }

    `;

    html = html.substring(0, idx1) + jsLogic + html.substring(idx2);
    fs.writeFileSync('dashboard-proveedor.html', html, 'utf8');
    console.log('Fixed JS!');
} else {
    console.log('Markers not found', idx1, idx2);
}
