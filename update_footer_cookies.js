const fs = require('fs');
let js = fs.readFileSync('js/components.js', 'utf8');
js = js.replace('<a href="#">Uso de cookies</a>', '<a href="cookies.html">Uso de cookies</a>');
js = js.replace('<a href="#">Cookies</a>', '<a href="cookies.html">Cookies</a>');
fs.writeFileSync('js/components.js', js);
console.log('Footer links for cookies updated!');
