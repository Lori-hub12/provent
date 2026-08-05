const fs = require('fs');

let dp = fs.readFileSync('dashboard-proveedor.html', 'utf8');

const oldCardHTML = `                  <p style="color:var(--neutral-500); font-size:0.875rem; margin-bottom:1rem">\${m.descripcion || 'Sin descripcin'}</p>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto">`;
const newCardHTML = `                  <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                    \${m.precio_estimado ? \`<span style="background:var(--success-50); color:var(--success-700); padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600">\${m.precio_estimado}</span>\` : ''}
                    \${m.calidad_pureza ? \`<span style="background:var(--primary-50); color:var(--primary-700); padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600">\${m.calidad_pureza}</span>\` : ''}
                  </div>
                  <p style="color:var(--neutral-500); font-size:0.875rem; margin-bottom:1rem">\${m.descripcion || 'Sin descripción'}</p>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto">`;
// Wait, the encoding issue might break the string replace. I will use regex.
const cardRegex = /<p style="color:var\(--neutral-500\); font-size:0\.875rem; margin-bottom:1rem">\$\{m\.descripcion \|\| 'Sin descripci.n'\}<\/p>\s*<div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto">/g;

dp = dp.replace(cardRegex, `
                  <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                    \${m.precio_estimado ? \`<span style="background:var(--success-50); color:var(--success-700); padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600">\${m.precio_estimado}</span>\` : ''}
                    \${m.calidad_pureza ? \`<span style="background:var(--primary-50); color:var(--primary-700); padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600">\${m.calidad_pureza}</span>\` : ''}
                  </div>
                  <p style="color:var(--neutral-500); font-size:0.875rem; margin-bottom:1rem">\${m.descripcion || 'Sin descripcion'}</p>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto">`);

fs.writeFileSync('dashboard-proveedor.html', dp, 'utf8');

// Now explorar.html
let exp = fs.readFileSync('explorar.html', 'utf8');
exp = exp.replace(cardRegex, `
                  <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                    \${m.precio_estimado ? \`<span style="background:var(--success-50); color:var(--success-700); padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600">\${m.precio_estimado}</span>\` : ''}
                    \${m.calidad_pureza ? \`<span style="background:var(--primary-50); color:var(--primary-700); padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600">\${m.calidad_pureza}</span>\` : ''}
                  </div>
                  <p style="color:var(--neutral-500); font-size:0.875rem; margin-bottom:1rem">\${m.descripcion || 'Sin descripcion'}</p>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto">`);
fs.writeFileSync('explorar.html', exp, 'utf8');

// Now perfil-proveedor.html
let per = fs.readFileSync('perfil-proveedor.html', 'utf8');
per = per.replace(cardRegex, `
                  <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                    \${m.precio_estimado ? \`<span style="background:var(--success-50); color:var(--success-700); padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600">\${m.precio_estimado}</span>\` : ''}
                    \${m.calidad_pureza ? \`<span style="background:var(--primary-50); color:var(--primary-700); padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600">\${m.calidad_pureza}</span>\` : ''}
                  </div>
                  <p style="color:var(--neutral-500); font-size:0.875rem; margin-bottom:1rem">\${m.descripcion || 'Sin descripcion'}</p>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto">`);
fs.writeFileSync('perfil-proveedor.html', per, 'utf8');

console.log('Cards updated in all HTML files.');
