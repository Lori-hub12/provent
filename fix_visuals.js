const fs = require('fs');

// 1. Fix components.js logo cache
let comp = fs.readFileSync('js/components.js', 'utf8');
const ts = new Date().getTime();
comp = comp.replace(/const LOGO_PATH = 'img\/logo\.png';/, `const LOGO_PATH = 'img/logo.png?v=${ts}';`);
fs.writeFileSync('js/components.js', comp);

// 2. Fix categorias.html fade-in bug
let html = fs.readFileSync('categorias.html', 'utf8');
// For the injected code, change class="cat-card fade-in" to class="cat-card fade-in visible"
html = html.replace(/class="cat-card fade-in"/g, 'class="cat-card fade-in visible"');
html = html.replace(/class="featured-cat-item"/g, 'class="featured-cat-item fade-in visible"');
// Also fix the synchronous code just in case it doesn't run fast enough before observer
fs.writeFileSync('categorias.html', html);

console.log('Fixed fade-in and logo cache!');
