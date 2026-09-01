const fs = require('fs');
let js = fs.readFileSync('js/components.js', 'utf8');
js = js.replace('<a href="#">Política de privacidad</a>', '<a href="privacidad.html">Política de privacidad</a>');
js = js.replace('<a href="#">Privacidad</a>', '<a href="privacidad.html">Privacidad</a>');
fs.writeFileSync('js/components.js', js);
console.log('Footer links for privacy policy updated!');
