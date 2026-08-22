const fs = require('fs');
let code = fs.readFileSync('js/pages/explorar.js', 'utf8');
code = code.replace(/const imgHtml = item\.imagen_url \? \`<img src="\$\{API_BASE\}\$\{item\.imagen_url\}"/g, 'const imgHtml = item.imagen_url ? `<img src="${item.imagen_url.startsWith(\\'http\\') ? item.imagen_url : API_BASE + item.imagen_url}"');
code = code.replace(/imgDiv\.innerHTML = \`<img src="\$\{API_BASE\}\$\{m\.imagen_url\}"/g, 'imgDiv.innerHTML = `<img src="${m.imagen_url.startsWith(\\'http\\') ? m.imagen_url : API_BASE + m.imagen_url}"');
fs.writeFileSync('js/pages/explorar.js', code);
