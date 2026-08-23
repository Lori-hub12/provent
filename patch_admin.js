const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

// 1. Auth Guard
const authGuard = `
    <script src="js/config.js"></script>
    <script src="js/components.js"></script>
    <script src="js/auth.js"></script>
    <script>
        // AUTH GUARD: Solo Admin
        document.addEventListener('DOMContentLoaded', () => {
            if (window.ProVendAuth) {
                const user = window.ProVendAuth.getCurrentUser();
                if (!user || user.rol !== 'admin') {
                    window.location.href = 'index.html';
                }
            }
        });
    </script>
    <script src="js/pages/admin.js"></script>
`;

// Insert auth guard right before </head>
html = html.replace('</head>', authGuard + '\n</head>');

// 2. Cache Buster
const version = new Date().getTime();
html = html.replace(/<script src="(js\/[^"]+\.js)"><\/script>/g, `<script src="$1?v=${version}"></script>`);
html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+\.css)">/g, `<link rel="stylesheet" href="$1?v=${version}">`);

// 3. Fix the favicon (just replace the old one)
html = html.replace(/<link rel="icon" type="image\/jpeg" href="assets\/images\/logo.jpg">/, '<link rel="icon" type="image/png" href="img/logo.png">');

fs.writeFileSync('admin.html', html);
console.log('Fixed admin.html without destroying it!');
