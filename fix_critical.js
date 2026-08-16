/**
 * ProVend — Patch crítico automático
 * Reemplaza localhost:3000 y arregla bugs críticos
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// ===== 1. PATCH: Reemplazar localhost:3000 con API_BASE en todos los HTML/JS =====
const filesToPatch = [
    'explorar.html',
    'dashboard-proveedor.html',
    'dashboard-empresa.html',
    'perfil-proveedor.html',
    'oportunidades.html',
    'categorias.html',
    'index.html',
    'forgot-password.html',
    'reset-password.html',
    'login.html',
    'registro.html',
    'js/auth.js',
];

let totalReplacements = 0;
filesToPatch.forEach(file => {
    const filePath = path.join(ROOT, file);
    if (!fs.existsSync(filePath)) { console.log(`SKIP (not found): ${file}`); return; }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Replace fetch/fetch URLs
    content = content.replace(/(['"`])http:\/\/localhost:3000\//g, '$1${API_BASE}/');
    // Handle template literals that don't have quotes
    content = content.replace(/fetch\(`http:\/\/localhost:3000\//g, 'fetch(`${API_BASE}/');
    content = content.replace(/fetch\("http:\/\/localhost:3000\//g, 'fetch(`${API_BASE}/');
    content = content.replace(/fetch\('http:\/\/localhost:3000\//g, 'fetch(`${API_BASE}/');
    // Handle img src
    content = content.replace(/src="http:\/\/localhost:3000\//g, 'src="${API_BASE}/');
    content = content.replace(/src=`http:\/\/localhost:3000\//g, 'src="${API_BASE}/');
    // Handle string concatenation
    content = content.replace(/'http:\/\/localhost:3000'\s*\+/g, 'API_BASE +');
    content = content.replace(/"http:\/\/localhost:3000"\s*\+/g, 'API_BASE +');
    // Handle template literals inline
    content = content.replace(/\$\{['"]http:\/\/localhost:3000['"]\}/g, '${API_BASE}');
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        const count = (original.match(/localhost:3000/g) || []).length;
        totalReplacements += count;
        console.log(`PATCHED: ${file} (${count} occurrences)`);
    } else {
        console.log(`CLEAN: ${file}`);
    }
});

console.log(`\nTotal localhost:3000 references replaced: ${totalReplacements}`);

// ===== 2. PATCH: package.json — Fix main + add start script =====
const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.main = 'server.js';
pkg.scripts = pkg.scripts || {};
pkg.scripts.start = 'node server.js';
pkg.scripts.dev = 'node server.js';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('\nPATCHED: package.json — main=server.js, scripts.start added');

// ===== 3. PATCH: .gitignore — Add sqlite files =====
const gitignorePath = path.join(ROOT, '.gitignore');
let gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
const toAdd = ['database.sqlite', 'database.sqlite-shm', 'database.sqlite-wal', 'uploads/', 'test.js'];
let gitignoreChanged = false;
toAdd.forEach(entry => {
    if (!gitignore.includes(entry)) {
        gitignore += `\n${entry}`;
        gitignoreChanged = true;
    }
});
if (gitignoreChanged) {
    fs.writeFileSync(gitignorePath, gitignore.trim() + '\n', 'utf8');
    console.log('PATCHED: .gitignore — added sqlite + uploads + test.js');
}

// ===== 4. PATCH: admin.html — createNavbar → buildNavbar + add auth guard =====
const adminPath = path.join(ROOT, 'admin.html');
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Fix createNavbar → buildNavbar
adminContent = adminContent.replace(
    `document.getElementById('navbar-container').innerHTML = createNavbar();`,
    `document.getElementById('navbar-container').innerHTML = buildNavbar('admin');`
);

// Add config.js script tag if missing
if (!adminContent.includes('js/config.js')) {
    adminContent = adminContent.replace(
        '<script src="js/components.js"></script>',
        '<script src="js/config.js"></script>\n    <script src="js/components.js"></script>'
    );
}

// Add auth guard before closing </body>
const adminAuthGuard = `
    <script>
        // Auth Guard: Solo admins
        (function() {
            const user = JSON.parse(localStorage.getItem('ProVend_user') || 'null');
            const token = localStorage.getItem('ProVend_token');
            if (!user || !token || user.rol !== 'admin') {
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;flex-direction:column;gap:1rem"><h2 style="color:#dc2626">🔒 Acceso Restringido</h2><p style="color:#6b7280">Solo los administradores pueden ver esta página.</p><a href="login.html" style="background:#2B7DE9;color:white;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:600">Ir al Login</a></div>';
            }
        })();
    </script>`;

if (!adminContent.includes('Auth Guard: Solo admins')) {
    adminContent = adminContent.replace('<script src="js/components.js"></script>', adminAuthGuard + '\n    <script src="js/config.js"></script>\n    <script src="js/components.js"></script>');
}

fs.writeFileSync(adminPath, adminContent, 'utf8');
console.log('PATCHED: admin.html — createNavbar fixed + auth guard added');

// ===== 5. PATCH: explorar.html — Fix setTab event + add category param + add config.js =====
let explorarContent = fs.readFileSync(path.join(ROOT, 'explorar.html'), 'utf8');

// Fix implicit global event
explorarContent = explorarContent.replace(
    'function setTab(tab) {',
    'function setTab(tab, evt) {'
);
explorarContent = explorarContent.replace(
    'event.target.classList.add(\'active\');',
    'if (evt && evt.target) evt.target.classList.add(\'active\');'
);

// Add category param handling in DOMContentLoaded
const oldDomLoaded = `if (qParam) {
                document.getElementById('searchInput').value = qParam;
            }`;
const newDomLoaded = `if (qParam) {
                document.getElementById('searchInput').value = qParam;
            }
            
            // Apply category filter from URL
            const categoryParam = urlParams.get('category');
            if (categoryParam) {
                document.getElementById('searchInput').value = categoryParam;
            }`;
explorarContent = explorarContent.replace(oldDomLoaded, newDomLoaded);

// Add config.js
if (!explorarContent.includes('js/config.js')) {
    explorarContent = explorarContent.replace(
        '<script src="js/components.js"></script>',
        '<script src="js/config.js"></script>\n    <script src="js/components.js"></script>'
    );
}

fs.writeFileSync(path.join(ROOT, 'explorar.html'), explorarContent, 'utf8');
console.log('PATCHED: explorar.html — setTab event fixed + category param + config.js');

// ===== 6. PATCH: Add config.js to all other HTML files that use API =====
const htmlsNeedingConfig = [
    'index.html', 'oportunidades.html', 'perfil-proveedor.html',
    'dashboard-proveedor.html', 'dashboard-empresa.html',
    'categorias.html', 'forgot-password.html', 'reset-password.html',
    'login.html', 'registro.html'
];

htmlsNeedingConfig.forEach(file => {
    const fp = path.join(ROOT, file);
    if (!fs.existsSync(fp)) return;
    let c = fs.readFileSync(fp, 'utf8');
    if (!c.includes('js/config.js')) {
        // Add before first script tag
        c = c.replace('<script src="js/components.js"></script>', '<script src="js/config.js"></script>\n    <script src="js/components.js"></script>');
        if (!c.includes('js/config.js')) {
            // Fallback: add before </head>
            c = c.replace('</head>', '<script src="js/config.js"></script>\n</head>');
        }
        fs.writeFileSync(fp, c, 'utf8');
        console.log(`  Added config.js to ${file}`);
    }
});

// ===== 7. PATCH: 404.html — Remove audio autoplay =====
const page404Path = path.join(ROOT, '404.html');
if (fs.existsSync(page404Path)) {
    let content404 = fs.readFileSync(page404Path, 'utf8');
    // Remove audio elements
    content404 = content404.replace(/<audio[^>]*>[\s\S]*?<\/audio>/gi, '');
    // Remove audio-related JS
    content404 = content404.replace(/document\.querySelector\('audio'\)[^;]+;/g, '');
    content404 = content404.replace(/const audio[^;]+;[\s\S]*?audio\.play\(\)[^;]*;/g, '');
    // Fix meme img — replace external src
    content404 = content404.replace(/src="https?:\/\/meme-arsenal\.com[^"]*"/g, 'src="assets/images/logo.jpg" style="max-width:200px;border-radius:1rem"');
    fs.writeFileSync(page404Path, content404, 'utf8');
    console.log('PATCHED: 404.html — audio autoplay removed, external meme img replaced');
}

// ===== 8. PATCH: sobre-nosotros.html — Fix broken placeholder image URLs =====
const sobrePath = path.join(ROOT, 'sobre-nosotros.html');
if (fs.existsSync(sobrePath)) {
    let sobreContent = fs.readFileSync(sobrePath, 'utf8');
    // Replace placeholder image URLs with a generated avatar
    sobreContent = sobreContent.replace(/src="URL_IMAGEN_[A-Z_]+AQUI\.png"/g, (match) => {
        // Extract name from placeholder
        const nameMatch = match.match(/URL_IMAGEN_([A-Z]+)_/);
        const name = nameMatch ? nameMatch[1] : 'U';
        const colors = ['4A9FF5', '27ae60', 'e67e22', '9b59b6', 'e74c3c'];
        const color = colors[name.charCodeAt(0) % colors.length];
        return `src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=200&bold=true"`;
    });
    fs.writeFileSync(sobrePath, sobreContent, 'utf8');
    console.log('PATCHED: sobre-nosotros.html — placeholder team images replaced with generated avatars');
}

console.log('\n✅ Todos los patches críticos aplicados.');
