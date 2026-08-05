const fs = require('fs');

let content = fs.readFileSync('js/components.js', 'utf8');

const oldDesktopNav = `<a href="explorar.html" class="navbar-link \${activePage === 'explorar' ? 'active' : ''}">Explorar</a>
        <a href="categorias.html" class="navbar-link \${activePage === 'categorias' ? 'active' : ''}">Categor`;
const newDesktopNav = `<a href="explorar.html" class="navbar-link \${activePage === 'explorar' ? 'active' : ''}">Explorar</a>
        <a href="oportunidades.html" class="navbar-link \${activePage === 'oportunidades' ? 'active' : ''}">Oportunidades</a>
        <a href="categorias.html" class="navbar-link \${activePage === 'categorias' ? 'active' : ''}">Categor`;

content = content.replace(oldDesktopNav, newDesktopNav);

const oldMobileNav = `<a href="index.html" class="mobile-menu-link">\${icons.home} Inicio</a>
      <a href="explorar.html" class="mobile-menu-link">\${icons.search} Explorar</a>`;
const newMobileNav = `<a href="index.html" class="mobile-menu-link">\${icons.home} Inicio</a>
      <a href="explorar.html" class="mobile-menu-link">\${icons.search} Explorar</a>
      <a href="oportunidades.html" class="mobile-menu-link">\${icons.grid} Oportunidades</a>`;

content = content.replace(oldMobileNav, newMobileNav);

fs.writeFileSync('js/components.js', content, 'utf8');
console.log('Nav updated');
