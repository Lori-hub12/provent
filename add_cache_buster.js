const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const version = new Date().getTime();

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace script src to include a cache buster
    content = content.replace(/<script src="js\/(.*?\.js)"><\/script>/g, `<script src="js/$1?v=${version}"></script>`);
    content = content.replace(/<link rel="stylesheet" href="css\/(.*?\.css)">/g, `<link rel="stylesheet" href="css/$1?v=${version}">`);
    fs.writeFileSync(file, content);
}
console.log('Cache busters added');
