const fs = require('fs');

let js = fs.readFileSync('js/pages/admin.js', 'utf8');

// I will overwrite loadEmpresas entirely with a new version that includes the button handlers
const newEmpresasJs = `
async function loadEmpresas() {
    const tbody = document.getElementById('empresas-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="empty-admin"><span class="spinner-sm"></span> Cargando empresas...</td></tr>';
    try {
        const res = await ProVendAuth.apiFetch(API_BASE + '/api/admin/empresas');
        if (res.ok) {
            const data = await res.json();
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="empty-admin">No hay empresas registradas</td></tr>';
                return;
            }
            
            window.empresasData = data; // store globally for filtering if needed
            
            tbody.innerHTML = data.map(e => \`
                <tr>
                    <td>
                        <div style="font-weight:600">\${e.company || e.nombre || 'Sin nombre'}</div>
                        <div style="color:var(--neutral-500);font-size:0.8rem">\${e.email}</div>
                    </td>
                    <td>
                        \${e.activo 
                            ? '<span class="verified-yes">Activo</span>'
                            : '<span class="verified-no">Suspendido</span>'}
                    </td>
                    <td><div style="font-size:0.8rem;color:var(--neutral-500)">\${new Date(e.created_at).toLocaleDateString()}</div></td>
                    <td>\${e.total_requerimientos || 0} publicaciones</td>
                    <td style="text-align:right">
                        \${e.activo
                            ? \`<button class="btn-xs btn-xs-danger" onclick="toggleEmpresaActivo('\${e.id}', false, this)">Suspender</button>\`
                            : \`<button class="btn-xs btn-xs-success" onclick="toggleEmpresaActivo('\${e.id}', true, this)">Reactivar</button>\`}
                        <button class="btn-xs btn-xs-danger" style="margin-left:8px" onclick="eliminarEmpresa('\${e.id}', '\${(e.company || e.nombre || '').replace(/'/g, "\\'")}', this)">Eliminar</button>
                    </td>
                </tr>
            \`).join('');
        }
    } catch(e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="empty-admin">Error al cargar empresas</td></tr>';
    }
}

async function toggleEmpresaActivo(id, newActivo, btn) {
    btn.disabled = true; btn.textContent = '...';
    try {
        const res = await ProVendAuth.apiFetch(\`\${API_BASE}/api/admin/usuarios/\${id}/activo\`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ activo: newActivo })
        });
        if (!res.ok) { 
            const d = await res.json(); 
            // Simple toast equivalent if toast isn't in scope (it is globally defined in admin.html though)
            if (typeof toast === 'function') toast(d.error || 'Error', 'error'); 
            else alert(d.error || 'Error');
            return; 
        }
        if (typeof toast === 'function') toast(newActivo ? 'Empresa reactivada.' : 'Empresa suspendida', 'success');
        await loadEmpresas();
    } catch (err) { 
        console.error(err);
        if (typeof toast === 'function') toast('Error de conexión', 'error'); 
        btn.disabled = false; 
    }
}

async function eliminarEmpresa(id, nombre, btn) {
    if (!confirm(\`¿Eliminar permanentemente a la empresa "\${nombre}"? Esta acción no se puede deshacer.\`)) return;
    btn.disabled = true; btn.textContent = '...';
    try {
        const res = await ProVendAuth.apiFetch(\`\${API_BASE}/api/admin/usuarios/\${id}\`, { method: 'DELETE' });
        if (!res.ok) { 
            const d = await res.json(); 
            if (typeof toast === 'function') toast(d.error || 'Error', 'error'); 
            return; 
        }
        if (typeof toast === 'function') toast(\`Empresa "\${nombre}" eliminada\`, 'success');
        await loadEmpresas();
    } catch (err) { 
        if (typeof toast === 'function') toast('Error de conexión', 'error'); 
        btn.disabled = false; 
    }
}
`;

// Replace the previous loadEmpresas definition
js = js.replace(/async function loadEmpresas\(\) \{[\s\S]*$/, newEmpresasJs);
fs.writeFileSync('js/pages/admin.js', js);

console.log('Fixed js logic!');
