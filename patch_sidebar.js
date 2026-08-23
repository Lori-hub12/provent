const fs = require('fs');

let html = fs.readFileSync('admin.html', 'utf8');

const sidebarEmpresas = `                <a class="sidebar-link" data-section="empresas" onclick="showSection('empresas',this)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                    <span>Empresas</span>
                </a>`;

// Find the Proveedores link and insert the Empresas link after it.
// The original is: <a class="sidebar-link" data-section="proveedores" onclick="showSection('proveedores',this)">
const target = `<a class="sidebar-link" data-section="proveedores" onclick="showSection('proveedores',this)">`;

if (html.includes(target)) {
    html = html.replace(target, target + '\n' + sidebarEmpresas);
} else {
    console.log("Could not find the exact target string!");
}

fs.writeFileSync('admin.html', html);
console.log('Sidebar patched!');
