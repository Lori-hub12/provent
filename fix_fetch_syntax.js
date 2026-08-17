const fs = require('fs');

const files = [
    'login.html','registro.html','perfil-proveedor.html','oportunidades.html',
    'categorias.html','dashboard-proveedor.html','dashboard-empresa.html',
    'forgot-password.html','reset-password.html','index.html'
];

let totalFixed = 0;
for (const file of files) {
    let text = fs.readFileSync(file, 'utf8');
    let original = text;

    // Fix: fetch(`url`)) → fetch(`url`)  [extra closing paren]
    text = text.replace(/fetch\((`[^`]+`)\)\)/g, 'fetch($1)');

    // Fix: fetch(`url`), { → fetch(`url`, {  [comma outside parens]
    text = text.replace(/fetch\((`[^`]+`)\),\s*\{/g, 'fetch($1, {');

    // Same for apiFetch
    text = text.replace(/apiFetch\((`[^`]+`)\)\)/g, 'apiFetch($1)');
    text = text.replace(/apiFetch\((`[^`]+`)\),\s*\{/g, 'apiFetch($1, {');

    if (text !== original) {
        fs.writeFileSync(file, text, 'utf8');
        console.log('Fixed:', file);
        totalFixed++;
    }
}
console.log(`\nDone! Fixed ${totalFixed} files.`);
