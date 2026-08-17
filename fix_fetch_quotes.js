const fs = require('fs');

const files = [
    'categorias.html', 'dashboard-proveedor.html', 'forgot-password.html',
    'index.html', 'login.html', 'oportunidades.html', 'perfil-proveedor.html',
    'registro.html', 'reset-password.html'
];

let totalFixed = 0;
for (const file of files) {
    let text = fs.readFileSync(file, 'utf8');
    // Fix single-quoted ${API_BASE} to use backticks
    const fixed = text.replace(/fetch\('(\$\{API_BASE\}[^']*)'/g, "fetch(`$1`)")
                      .replace(/apiFetch\('(\$\{API_BASE\}[^']*)'/g, "apiFetch(`$1`)");
    if (fixed !== text) {
        fs.writeFileSync(file, fixed, 'utf8');
        console.log(`Fixed: ${file}`);
        totalFixed++;
    }
}
console.log(`\nDone! Fixed ${totalFixed} files.`);
