const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

console.log('=== ENCODING CHECK ===');
let encodingOk = true;
for (const f of files) {
    const t = fs.readFileSync(f, 'utf8');
    // Box drawing characters that shouldn't appear in HTML
    const boxChars = t.match(/[\u2500-\u257F]+/g) || [];
    // Corrupted accents pattern: box char followed by normal text
    const brokenAccent = t.match(/[â├][┐║│▒¡®▓─┬┼]+/g) || [];
    if (boxChars.length || brokenAccent.length) {
        console.log('BROKEN:', f, '| boxchars:', boxChars.length, '| accents:', brokenAccent.slice(0,3));
        encodingOk = false;
    }
}
if (encodingOk) console.log('All files: encoding OK');

console.log('\n=== SYNTAX CHECK ===');
let syntaxOk = true;
for (const f of files) {
    const t = fs.readFileSync(f, 'utf8');
    const issues = [];
    
    // Single-quoted template literals (API_BASE in single quotes)
    if (t.includes("fetch('${API_BASE}") || t.includes("apiFetch('${API_BASE}")) 
        issues.push('single-quoted API_BASE');
    
    // Duplicate </head><body> (double file)
    const headCount = (t.match(/<\/head>/g) || []).length;
    if (headCount > 1) issues.push(`duplicate </head> x${headCount}`);
    
    // Inline CSS leaking into body as text
    if (t.match(/\<strong\>[^<]*\.star-rating/)) 
        issues.push('CSS leaking into body');

    if (issues.length) {
        console.log('SYNTAX:', f, '|', issues.join(', '));
        syntaxOk = false;
    }
}
if (syntaxOk) console.log('All files: syntax OK');

console.log('\n=== API_BASE FETCH CHECK ===');
let apiOk = true;
for (const f of files) {
    const t = fs.readFileSync(f, 'utf8');
    // Find all fetch calls and check they use backticks
    const fetches = t.match(/fetch\([^)]+\)/g) || [];
    const badFetches = fetches.filter(fc => fc.includes('API_BASE') && !fc.includes('`'));
    if (badFetches.length) {
        console.log('BAD FETCH:', f, badFetches.slice(0, 2));
        apiOk = false;
    }
}
if (apiOk) console.log('All files: fetch calls OK');

console.log('\n=== DUPLICATE ID CHECK ===');
for (const f of files) {
    const t = fs.readFileSync(f, 'utf8');
    const ids = t.match(/id="([^"]+)"/g) || [];
    const seen = {};
    const dupes = [];
    for (const id of ids) {
        const name = id.replace('id="', '').replace('"', '');
        if (seen[name]) dupes.push(name);
        seen[name] = true;
    }
    if (dupes.length) console.log('DUPE IDs:', f, dupes.slice(0, 5));
}
console.log('\nAudit complete.');
