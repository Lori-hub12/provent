const fs = require('fs');
let html = fs.readFileSync('explorar.html', 'utf8');

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
                    
                    <button id="btn-join-pool" onclick="joinSmartPool()" class="btn" style="width:100%; margin-top:1rem; border:2px solid #16A34A; color:#16A34A; background:white; font-weight:600; padding:0.5rem; border-radius:6px; cursor:pointer;">Unirme a esta compra conjunta</button>
                </div>
                <!-- END SMART POOLING UI -->
`;

const target = '<a id="material-modal-btn" href="#" class="btn btn-primary" style="width:100%; margin-top:1.5rem; text-align:center;">Ver Perfil del Proveedor</a>';

if (html.includes(target) && !html.includes('smart-pooling-container')) {
    html = html.replace(target, smartPoolingUI + '\n                ' + target);
    fs.writeFileSync('explorar.html', html);
    console.log('explorar.html patched with Smart Pooling UI.');
} else {
    console.log('Target not found or already patched.');
}
