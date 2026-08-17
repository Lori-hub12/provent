const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
for (const file of files) {
    let buf = fs.readFileSync(file);
    // Remove BOM if present
    if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
        buf = buf.slice(3);
    }
    // Read the buffer as latin1 (windows-1252)
    let fixedBuf = Buffer.from(buf.toString('utf8'), 'latin1');
    fs.writeFileSync(file, fixedBuf);
    
    // Now read as utf8 to fix any remaining issues
    let text = fs.readFileSync(file, 'utf8');
    text = text.replace(/ï¿½/g, 'í'); // In case of FFFD replacement
    text = text.replace(//g, 'í'); // In case of FFFD replacement
    fs.writeFileSync(file, text);
}
