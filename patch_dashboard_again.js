const fs = require('fs');
let html = fs.readFileSync('dashboard-empresa.html', 'utf8');

const sectionHook = '</main>';
const newSection = `
        <!-- PASAPORTES DIGITALES -->
        <section id="pasaportes" class="dashboard-section" style="display:block; margin-top:5rem; padding-top:3rem; border-top:1px solid #E2E8F0;">
            <div class="card fade-in" style="margin-bottom:2rem;">
                <h3 style="margin-bottom:1rem; font-size:1.25rem;">Generar Pasaporte Digital</h3>
                <p style="color:var(--neutral-500); margin-bottom:1.5rem;">Crea un pasaporte de origen sostenible para tus productos finales. Tus clientes podrán escanear el código QR para verificar la trazabilidad de los materiales reciclados.</p>
                <form id="form-pasaporte" onsubmit="generarPasaporte(event)" style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                    <div class="form-group" style="grid-column:1/-1">
                        <label>Proveedor / Industria de Origen</label>
                        <select id="pass_prov" required class="form-control">
                            <option value="">Selecciona el proveedor del material...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Material Original</label>
                        <input type="text" id="pass_mat" class="form-control" placeholder="Ej. Retazos textiles industriales" required>
                    </div>
                    <div class="form-group">
                        <label>Producto Final</label>
                        <input type="text" id="pass_prod" class="form-control" placeholder="Ej. Bolsa Tote - Ecodiseño Local" required>
                    </div>
                    <div class="form-group">
                        <label>% Reciclado</label>
                        <input type="text" id="pass_perc" class="form-control" placeholder="Ej. 85%" required>
                    </div>
                    <div class="form-group">
                        <label>CO2 Evitado (Estimado)</label>
                        <input type="text" id="pass_co2" class="form-control" placeholder="Ej. 2.1kg">
                    </div>
                    <div class="form-group">
                        <label>Reducción de Costo</label>
                        <input type="text" id="pass_cost" class="form-control" placeholder="Ej. 60%">
                    </div>
                    <button type="submit" class="btn btn-primary" style="grid-column:1/-1;">Generar Pasaporte QR</button>
                </form>
            </div>
            
            <h3 style="margin-bottom:1rem; font-size:1.25rem;">Mis Pasaportes</h3>
            <div id="lista-pasaportes" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1rem;">
                <!-- Se llena por JS -->
            </div>
            <!-- QRCode JS -->
            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        </section>`;
        
if (!html.includes('<section id="pasaportes"')) {
    html = html.replace(sectionHook, newSection + '\n        ' + sectionHook);
    fs.writeFileSync('dashboard-empresa.html', html);
    console.log('dashboard-empresa.html patched for Pasaportes.');
} else {
    console.log('Already patched');
}
