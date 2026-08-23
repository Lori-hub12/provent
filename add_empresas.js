const fs = require('fs');

// 1. Backend: adminController.js
let adminController = fs.readFileSync('backend/controllers/adminController.js', 'utf8');
const empresasEndpoint = `
exports.get_admin_empresas = async (req, res) => {
    try {
        const empresas = await dbAll(
            \`SELECT u.id, u.nombre, u.email, u.activo, u.created_at, u.company,
                    (SELECT COUNT(*) FROM requerimientos req WHERE req.empresa_id = u.id) as total_requerimientos
             FROM usuarios u
             WHERE u.rol = 'empresa'
             ORDER BY u.created_at DESC LIMIT 50\`
        );
        res.json(empresas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
`;
adminController += '\n' + empresasEndpoint;
fs.writeFileSync('backend/controllers/adminController.js', adminController);

// 2. Backend: adminRoutes.js
let adminRoutes = fs.readFileSync('backend/routes/adminRoutes.js', 'utf8');
adminRoutes = adminRoutes.replace("module.exports = router;", "router.get('/admin/empresas', requireAdmin, adminController.get_admin_empresas);\n\nmodule.exports = router;");
fs.writeFileSync('backend/routes/adminRoutes.js', adminRoutes);

// 3. Frontend: admin.html
let html = fs.readFileSync('admin.html', 'utf8');
const sidebarEmpresas = `
        <a href="#empresas" class="sidebar-link" onclick="showSection('empresas', this)">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>
            Empresas
        </a>
`;
html = html.replace('<a href="#proveedores" class="sidebar-link" onclick="showSection(\'proveedores\', this)">', sidebarEmpresas + '\n        <a href="#proveedores" class="sidebar-link" onclick="showSection(\'proveedores\', this)">');

const sectionEmpresas = `
        <!-- EMPRESAS SECTION -->
        <div id="section-empresas" class="admin-section" style="display:none">
            <div class="section-header">
                <h2>Empresas (Emprendedores)</h2>
                <div id="admin-search">
                    <button class="btn btn-outline btn-sm" onclick="loadEmpresas()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg> Actualizar</button>
                </div>
            </div>
            
            <div class="card">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Empresa / Emprendedor</th>
                            <th>Estado</th>
                            <th>Registro</th>
                            <th>Requerimientos</th>
                            <th style="text-align:right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="empresas-table-body">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div>
        </div>
`;
html = html.replace('<!-- PROVEEDORES SECTION -->', sectionEmpresas + '\n\n        <!-- PROVEEDORES SECTION -->');

// Also inject the "lazy load" call in showSection
html = html.replace("if (name === 'proveedores') loadProveedores();", "if (name === 'proveedores') loadProveedores();\n            if (name === 'empresas') loadEmpresas();");

fs.writeFileSync('admin.html', html);

// 4. Frontend: js/pages/admin.js
let js = fs.readFileSync('js/pages/admin.js', 'utf8');
const empresasJs = `
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
                            ? \`<button class="btn-xs btn-xs-danger" onclick="toggleUsuarioActivo('\${e.id}', false, 'empresas')">Suspender</button>\`
                            : \`<button class="btn-xs btn-xs-success" onclick="toggleUsuarioActivo('\${e.id}', true, 'empresas')">Reactivar</button>\`}
                        <button class="btn-xs btn-xs-danger" style="margin-left:8px" onclick="deleteUsuario('\${e.id}', 'empresas')">Eliminar</button>
                    </td>
                </tr>
            \`).join('');
        }
    } catch(e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="empty-admin">Error al cargar empresas</td></tr>';
    }
}
`;
// Note: toggleUsuarioActivo and deleteUsuario currently only reload the 'usuarios' table because of `loadUsuarios()`.
// I need to modify them to accept a source parameter or just reload both.
js = js.replace('async function toggleUsuarioActivo(id, newActivo) {', 'async function toggleUsuarioActivo(id, newActivo, source = "usuarios") {');
js = js.replace('loadUsuarios();', 'if (source === "empresas") loadEmpresas(); else loadUsuarios();');
js = js.replace('async function deleteUsuario(id) {', 'async function deleteUsuario(id, source = "usuarios") {');
js = js.replace('loadUsuarios();', 'if (source === "empresas") loadEmpresas(); else loadUsuarios();');

js += '\n' + empresasJs;
fs.writeFileSync('js/pages/admin.js', js);

console.log('Empresas (Emprendedores) section added completely!');
