const fs = require('fs');

function extractScript(file, outFile) {
    let html = fs.readFileSync(file, 'utf8');
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
        fs.writeFileSync(outFile, scriptMatch[1].trim());
        html = html.replace(scriptMatch[0], `<script src="${outFile}"></script>`);
        fs.writeFileSync(file, html);
        console.log(`Extracted to ${outFile}`);
    }
}

extractScript('login.html', 'js/pages/login.js');
extractScript('forgot-password.html', 'js/pages/forgotPassword.js');
