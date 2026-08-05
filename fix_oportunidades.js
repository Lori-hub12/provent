const fs = require('fs');

let content = fs.readFileSync('oportunidades.html', 'utf8');

const oldHeader = `<header class="header">
        <div class="nav-container">
            <a href="index.html" class="logo">ProVend<span class="logo-dot">.</span></a>
            <nav class="nav-links">
                <a href="explorar.html">Explorar</a>
                <a href="oportunidades.html" class="active">Oportunidades</a>
                <a href="dashboard-proveedor.html" id="nav-dashboard" style="display:none">Mi Panel</a>
                <a href="login.html" id="nav-login" class="btn btn-primary">Iniciar Sesión</a>
                <a href="#" id="nav-logout" class="btn btn-outline" style="display:none" onclick="logout()">Salir</a>
            </nav>
        </div>
    </header>`;

const newHeader = `<div id="navbar-container"></div>`;
content = content.replace(oldHeader, newHeader);

const oldFooter = `<footer class="footer">
        <div class="footer-container">
            <div>
                <a href="index.html" class="logo" style="color:var(--white)">ProVend<span class="logo-dot">.</span></a>
                <p style="color:var(--neutral-400); margin-top:1rem; font-size:0.875rem">
                    Digitalizando el sector de reciclaje y materias primas en Nicaragua.
                </p>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 ProVend. Todos los derechos reservados.</p>
        </div>
    </footer>`;

const newFooter = `<div id="footer-container"></div>`;
content = content.replace(oldFooter, newFooter);

const scripts = `<script src="js/components.js"></script>
    <script>
        document.getElementById('navbar-container').innerHTML = buildNavbar('oportunidades');
        document.getElementById('footer-container').innerHTML = buildFooter();
    </script>`;

content = content.replace('<script src="js/auth.js"></script>', `<script src="js/auth.js"></script>\n    ${scripts}`);
// also remove the old hardcoded auth adjustments in oportunidades.html
const oldAuthJS = `if (ProVendAuth.isLoggedIn()) {
            document.getElementById('nav-login').style.display = 'none';
            document.getElementById('nav-logout').style.display = 'inline-flex';
            document.getElementById('nav-dashboard').style.display = 'inline-flex';
            const user = ProVendAuth.getCurrentUser();
            if(user && user.rol === 'empresa') {
                document.getElementById('nav-dashboard').href = 'dashboard-empresa.html';
            }
        }`;

content = content.replace(oldAuthJS, '');

fs.writeFileSync('oportunidades.html', content, 'utf8');
console.log('oportunidades.html fixed');
