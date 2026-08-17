const fs = require('fs');

// Exhaustive map of all box-drawing corruption patterns found in this project
// Pattern: e2 94 9c XX YY → correct UTF-8 char
// Discovered from hex inspection of actual files
const replacements = [
    // ú variants
    ['e2949ce29591', 'c3ba'],
    // ó variants  
    ['e2949ce295b3', 'c3b3'],
    // ñ variants
    ['e2949ce295b1', 'c3b1'],
    // í variants (two forms seen)
    ['e2949ce29580', 'c3ad'],  // ├┐ form
    ['e2949cc3ad',   'c3ad'],  // ├í form (C3 AD is already UTF-8 í, but preceded by box char)
    // á variants
    ['e2949cc2a1',   'c3a1'],  // ├¡ form
    ['e2949ce295a1', 'c3a1'],
    // é variants
    ['e2949ce295a9', 'c3a9'],
    ['e2949cc2a9',   'c3a9'],
    // ó more
    ['e2949cc2b3',   'c3b3'],
    // ú more  
    ['e2949cc2ba',   'c3ba'],
    // ñ more
    ['e2949cc2b1',   'c3b1'],
].map(([from, to]) => [Buffer.from(from, 'hex'), Buffer.from(to, 'hex')]);

function fixBuffer(input) {
    let buf = Buffer.from(input);
    let totalChanged = 0;
    
    for (const [from, to] of replacements) {
        let result = [];
        let i = 0;
        let changed = 0;
        while (i < buf.length) {
            if (i + from.length <= buf.length && buf.slice(i, i + from.length).equals(from)) {
                result.push(to);
                i += from.length;
                changed++;
            } else {
                result.push(buf.slice(i, i + 1));
                i++;
            }
        }
        if (changed) {
            buf = Buffer.concat(result);
            totalChanged += changed;
        }
    }
    return { buf, changed: totalChanged };
}

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
let total = 0;
for (const file of files) {
    const orig = fs.readFileSync(file);
    const { buf, changed } = fixBuffer(orig);
    if (changed) {
        fs.writeFileSync(file, buf);
        console.log(`Fixed ${changed} sequences in: ${file}`);
        total++;
    }
}
console.log(`\nDone! Fixed ${total} files.`);
