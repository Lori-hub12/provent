const fs = require('fs');

const metaTags = `    <meta name="description" content="ProVend es la plataforma B2B de Nicaragua que conecta empresas con proveedores verificados para optimizar la cadena de suministro.">
    <meta property="og:title" content="ProVend — Conectando Empresas y Proveedores">
    <meta property="og:description" content="Encuentra proveedores verificados y cotiza materiales para tu empresa en Nicaragua.">
    <meta property="og:image" content="https://provend.com.ni/assets/images/logo.svg">
    <meta property="og:url" content="https://provend.com.ni/">
    <meta property="og:type" content="website">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`;

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
for (const file of files) {
    let text = fs.readFileSync(file, 'utf8');
    if (!text.includes('og:title')) {
        text = text.replace(/<title>/, metaTags + '\n    <title>');
    }
    if (!text.includes('favicon') && !text.includes('logo.svg')) {
        text = text.replace(/<link rel=['"]icon['"].*?>/, '<link rel="icon" type="image/svg+xml" href="assets/images/logo.svg">');
    }
    fs.writeFileSync(file, text, 'utf8');
}
console.log("SEO Tags applied successfully!");
