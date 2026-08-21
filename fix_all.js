const fs = require('fs');
let html = fs.readFileSync('dashboard-proveedor.html', 'utf8');

const regex = /async function deleteMaterial[\s\S]*?loadDashboard\(\);\s*<\/script>/;
const replacement = `async function deleteMaterial(id, btn) {
      if (!confirm('¿Eliminar este material?')) return;
      btn.textContent = '...'; btn.disabled = true;
      try {
        const res = await ProVendAuth.apiFetch(\`\${API_BASE}/api/materiales/\${id}\`, {method: 'DELETE'});
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
      if (s < 3600) return \`Hace \${Math.floor(s/60)} minutos\`;
      if (s < 86400) return \`Hace \${Math.floor(s/3600)} horas\`;
      return \`Hace \${Math.floor(s/86400)} días\`;
    }

    async function openPerfilModal() {
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

    loadDashboard();
  </script>`;

if(html.match(regex)) {
    html = html.replace(regex, replacement);
    fs.writeFileSync('dashboard-proveedor.html', html, 'utf8');
    console.log('Fixed js logic correctly!');
} else {
    console.log('Could not find regex to replace in dashboard-proveedor.html');
}

// ALso fix perfil-proveedor.html syntax error
let perfilHtml = fs.readFileSync('perfil-proveedor.html', 'utf8');
perfilHtml = perfilHtml.replace(/fetch\(\`\$\{API_BASE\}\/api\/visitas\`\), \{/g, "fetch(`\${API_BASE}/api/visitas`, {");
fs.writeFileSync('perfil-proveedor.html', perfilHtml, 'utf8');
console.log('Fixed perfil-proveedor.html');

