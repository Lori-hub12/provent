const fs = require('fs');
let js = fs.readFileSync('js/components.js', 'utf8');
// Fix encoding issues with the terms
js = js.replace(/<a href="#">T.*?rminos de servicio<\/a>/, '<a href="terminos.html">Términos de servicio</a>');
js = js.replace(/<a href="#">T.*?rminos<\/a>/, '<a href="terminos.html">Términos</a>');
fs.writeFileSync('js/components.js', js);
console.log('Footer links updated!');
