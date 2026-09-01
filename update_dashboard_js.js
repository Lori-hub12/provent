const fs = require('fs');
let js = fs.readFileSync('js/pages/dashboardEmpresa.js', 'utf8');

const jsAppend = `

// ==========================================
// PASAPORTES DIGITALES
// ==========================================
async function cargarDatosPasaporte() {
    try {
        const res = await fetch(\`\${API_BASE}/api/search?type=empresas\`);
        if (res.ok) {
            const proveedores = await res.json();
            const select = document.getElementById('pass_prov');
            if(select) {
                select.innerHTML = '<option value="">Selecciona el proveedor...</option>';
                proveedores.forEach(p => {
                    select.innerHTML += \`<option value="\${p.usuario_id}">\${p.company || p.nombre}</option>\`;
                });
            }
        }
        
        cargarListaPasaportes();
    } catch(e) { console.error(e); }
}

async function cargarListaPasaportes() {
    try {
        const res = await fetch(\`\${API_BASE}/api/pasaportes\`, {
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
                const url = \`\${window.location.origin}/pasaporte.html?id=\${p.id}\`;
                container.innerHTML += \`
                <div class="card" style="display:flex; flex-direction:column; gap:1rem;">
                    <div style="display:flex; justify-content:space-between;">
                        <strong style="color:var(--primary-700);">\${p.id}</strong>
                        <span style="font-size:0.75rem; color:#64748B;">\${new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <div style="font-size:1.1rem; font-weight:700;">\${p.producto_final}</div>
                        <div style="font-size:0.85rem; color:#64748B;">Origen: \${p.proveedor_nombre}</div>
                    </div>
                    <div id="qr-\${p.id}" style="margin:1rem auto; padding:10px; background:white; border-radius:8px;"></div>
                    <a href="\${url}" target="_blank" class="btn btn-outline" style="text-align:center;">Ver Pasaporte Público</a>
                </div>\`;
            });
            
            // Generar QRs
            setTimeout(() => {
                data.forEach(p => {
                    const url = \`\${window.location.origin}/pasaporte.html?id=\${p.id}\`;
                    if(document.getElementById(\`qr-\${p.id}\`)) {
                        new QRCode(document.getElementById(\`qr-\${p.id}\`), {
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
        const res = await fetch(\`\${API_BASE}/api/pasaportes\`, {
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
`;

if(!js.includes('cargarDatosPasaporte')) {
    fs.writeFileSync('js/pages/dashboardEmpresa.js', js + jsAppend);
    console.log('dashboardEmpresa.js patched with passport logic');
}
