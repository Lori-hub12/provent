const fs = require('fs');

// 1. Update js/components.js
let comp = fs.readFileSync('js/components.js', 'utf8');
comp = comp.replace(/const LOGO_PATH = '.*?';/, "const LOGO_PATH = 'img/logo.png';");
fs.writeFileSync('js/components.js', comp);

// 2. Update js/pages/dashboardEmpresa.js and dashboardProveedor.js (if they have hardcoded SVGs)
const files = ['js/pages/dashboardEmpresa.js', 'js/pages/dashboardProveedor.js'];
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace the old SVG triangle if it's there
    content = content.replace(
        /<svg.*?><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"><\/polygon><\/svg>/g,
        '${getLogoSVG(36)}'
    );
    // Replace the other SVG triangle variant if present
    content = content.replace(
        /<div class="navbar-logo-icon">.*?<\/div>/g,
        '${getLogoSVG(36)}'
    );
    fs.writeFileSync(file, content);
}
console.log('Logo paths updated');
