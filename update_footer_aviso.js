const fs = require('fs');
let js = fs.readFileSync('js/components.js', 'utf8');
js = js.replace('<a href="#">Aviso legal</a>', '<a href="aviso-legal.html">Aviso legal</a>');
fs.writeFileSync('js/components.js', js);
console.log('Footer links for aviso legal updated!');
