const fs = require('fs');

// PATCH perfil-proveedor.html
let html = fs.readFileSync('perfil-proveedor.html', 'utf8');
const smartPoolingUI = `                <!-- SMART POOLING UI -->
                <div id="smart-pooling-container" style="display:none; margin-top:1.5rem; padding:1.2rem; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                        <h4 style="color:#166534; margin:0; display:flex; align-items:center; gap:0.5rem;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            Smart Pooling
                        </h4>
                        <span style="background:#16A34A; color:white; font-size:0.7rem; padding:2px 6px; border-radius:4px; font-weight:bold;">Activo</span>
                    </div>
                    <p style="font-size:0.85rem; color:#15803D; margin-bottom:1rem;">Varias empresas se están uniendo para alcanzar el volumen mínimo de este material.</p>
                    
                    <div style="margin-bottom:0.5rem;">
                        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:600; color:#166534; margin-bottom:0.25rem;">
                            <span id="sp-progress-text">0 / 0</span>
                            <span id="sp-progress-percent">0%</span>
                        </div>
                        <div style="width:100%; height:8px; background:#BBF7D0; border-radius:4px; overflow:hidden;">
                            <div id="sp-progress-bar" style="height:100%; background:#16A34A; width:0%; transition:width 0.3s;"></div>
                        </div>
                    </div>
                    
                    <button id="btn-join-pool" class="btn" style="width:100%; margin-top:1rem; border:2px solid #16A34A; color:#16A34A; background:white; font-weight:600; padding:0.5rem; border-radius:6px; cursor:pointer;">Unirme a esta compra conjunta</button>
                </div>
                <!-- END SMART POOLING UI -->`;

const targetBtn = '<button class="btn btn-primary" style="width:100%; margin-top:1.5rem;" onclick="document.getElementById(\'material-modal\').style.display=\'none\'; document.getElementById(\'contact-btn-wsp\').click();">Contactar para Oferta</button>';

if (html.includes(targetBtn) && !html.includes('smart-pooling-container')) {
    html = html.replace(targetBtn, smartPoolingUI + '\n                ' + targetBtn);
    fs.writeFileSync('perfil-proveedor.html', html);
    console.log('perfil-proveedor.html patched.');
} else {
    console.log('Target not found in perfil-proveedor.html or already patched.');
}

// PATCH js/pages/perfilProveedor.js
let js = fs.readFileSync('js/pages/perfilProveedor.js', 'utf8');

const jsAppend = `
window.openMaterialModal = async function(id) {
    if(!window.providerMaterials) return;
    const m = window.providerMaterials.find(x => x.id == id);
    if(!m) return;
    
    document.getElementById('material-modal-name').textContent = m.nombre;
    document.getElementById('material-modal-price').textContent = m.precio_estimado ? 'C$ ' + m.precio_estimado : 'Precio a convenir';
    document.getElementById('material-modal-qty').textContent = m.cantidad ? (m.cantidad + ' ' + (m.unidad || '')) : 'N/A';
    document.getElementById('material-modal-freq').textContent = m.frecuencia_disponibilidad || 'Única vez';
    document.getElementById('material-modal-min').textContent = m.volumen_minimo || 'N/A';
    document.getElementById('material-modal-quality').textContent = m.calidad_pureza || 'No especificada';
    document.getElementById('material-modal-desc').textContent = m.descripcion || 'Sin descripción detallada.';
    
    const imgDiv = document.getElementById('material-modal-img');
    if(m.imagen_url) {
        imgDiv.innerHTML = \`<img src="\${m.imagen_url.startsWith('http') ? m.imagen_url : API_BASE + m.imagen_url}" style="width:100%; height:100%; object-fit:cover; border-radius: 12px 12px 0 0;" alt="\${m.nombre}">\`;
    } else {
        imgDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>';
    }
    
    // Smart Pooling check
    const spContainer = document.getElementById('smart-pooling-container');
    if (spContainer) {
        spContainer.style.display = 'none';
        try {
            const res = await fetch(\`\${API_BASE}/api/smart-pooling\`);
            if (res.ok) {
                const pools = await res.json();
                const pool = pools.find(p => p.material_id == m.id);
                if (pool) {
                    spContainer.style.display = 'block';
                    const prog = parseFloat(pool.progreso || 0);
                    const obj = parseFloat(pool.cantidad_objetivo || 1);
                    const percent = Math.min(100, Math.round((prog / obj) * 100));
                    
                    document.getElementById('sp-progress-text').textContent = \`\${prog}\${pool.unidad || 'kg'} / \${obj}\${pool.unidad || 'kg'}\`;
                    document.getElementById('sp-progress-percent').textContent = \`\${percent}%\`;
                    document.getElementById('sp-progress-bar').style.width = \`\${percent}%\`;
                    
                    document.getElementById('btn-join-pool').onclick = function() {
                        const amount = prompt(\`¿Cuántos \${pool.unidad || 'kg'} deseas aportar a esta compra conjunta?\`);
                        if (amount && !isNaN(amount)) {
                            fetch(\`\${API_BASE}/api/smart-pooling/\${pool.id}/join\`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                                },
                                body: JSON.stringify({ cantidad_aportada: amount })
                            })
                            .then(r => r.json())
                            .then(d => {
                                if(d.success) {
                                    alert('¡Te has unido exitosamente a la compra conjunta!');
                                    window.openMaterialModal(id); // refresh
                                } else {
                                    alert('Debes iniciar sesión como Empresa para unirte.');
                                }
                            });
                        }
                    };
                }
            }
        } catch (e) {
            console.error('Error fetching smart pooling:', e);
        }
    }

    document.getElementById('material-modal').style.display = 'flex';
};
`;

if (js.includes('window.openMaterialModal = function(id) {') && !js.includes('sp-progress-percent')) {
    const parts = js.split('window.openMaterialModal = function(id) {');
    const endIdx = parts[1].indexOf('};') + 2;
    js = parts[0] + jsAppend + parts[1].substring(endIdx);
    fs.writeFileSync('js/pages/perfilProveedor.js', js);
    console.log('perfilProveedor.js patched.');
} else {
    console.log('Target not found in perfilProveedor.js or already patched.');
}
