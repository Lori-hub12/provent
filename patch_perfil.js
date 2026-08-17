const fs = require('fs');
let content = fs.readFileSync('perfil-proveedor.html', 'utf8');

// 1. Fix single quotes API_BASE
content = content.replace(/fetch\('(\$\{API_BASE\}[^']*)'/g, 'fetch(`$1`)');
content = content.replace(/apiFetch\('(\$\{API_BASE\}[^']*)'/g, 'apiFetch(`$1`)');

// 2. Fix box char / encoding corruption (just in case)
content = content.replace(/Ã³/g, 'ó').replace(/Ã±/g, 'ñ').replace(/Ãº/g, 'ú').replace(/Ã©/g, 'é').replace(/Ã/g, 'í').replace(/Ã¡/g, 'á');

// 3. Upgrade materials section styles
const cssTargetStart = '.commercial-info-item strong { display: block; font-size: 0.875rem; color: var(--neutral-500); margin-bottom: 0.25rem; }';
const cssTargetEnd = '.empty-inline p { font-size: 0.875rem; }';

const newStyles = `.commercial-info-item strong { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--neutral-400); font-weight: 700; margin-bottom: 0.35rem; }
        .commercial-info-item p { color: var(--neutral-800); font-weight: 500; margin: 0; font-size: 0.95rem; }

        /* Avatar */
        .profile-avatar-fallback { width: 80px; height: 80px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; color: white; flex-shrink: 0; }

        /* Material Cards Grid */
        .mat-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
        .mat-card { background: white; border: 1px solid var(--neutral-200); border-radius: 14px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
        .mat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .mat-card-img { width: 100%; height: 140px; object-fit: cover; background: var(--neutral-100); display: flex; align-items: center; justify-content: center; color: var(--neutral-400); }
        .mat-card-img img { width: 100%; height: 140px; object-fit: cover; }
        .mat-card-body { padding: 1rem; }
        .mat-card-name { font-weight: 700; font-size: 0.95rem; color: var(--neutral-900); margin-bottom: 0.35rem; }
        .mat-card-meta { font-size: 0.8rem; color: var(--neutral-500); display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .mat-card-badge { background: var(--primary-50); color: var(--primary-700); font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; border: 1px solid var(--primary-100); }
        .mat-card-price { margin-top: 0.75rem; font-weight: 700; font-size: 1rem; color: var(--primary-700); }
        
        .mat-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .mat-tag { background: var(--primary-50); color: var(--primary-700); font-size: 0.8rem; font-weight: 600; padding: 0.3rem 0.75rem; border-radius: 99px; border: 1px solid var(--primary-100); }

        /* Rating */
        .rating-display-large { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; margin-bottom: 1.25rem; }
        .rating-number-lg { font-size: 2.75rem; font-weight: 800; color: var(--neutral-900); line-height: 1; }
        .rating-stars-lg { font-size: 1.3rem; letter-spacing: 0.1em; }
        .rating-count-sm { font-size: 0.8rem; color: var(--neutral-500); }

        /* Reviews */
        .reviews-section { margin-top: 2rem; }
        .review-card { background: var(--neutral-50); border: 1px solid var(--neutral-200); border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem; transition: box-shadow 0.2s; }
        .review-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
        .review-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
        .review-avatar { width: 38px; height: 38px; background: linear-gradient(135deg, var(--primary-400), var(--primary-600)); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0; }
        .review-empresa { font-weight: 700; color: var(--neutral-800); font-size: 0.9rem; }
        .review-date { font-size: 0.75rem; color: var(--neutral-400); margin-top: 1px; }
        .review-stars { color: #f59e0b; font-size: 1rem; letter-spacing: 2px; }
        .review-text { font-size: 0.875rem; color: var(--neutral-700); line-height: 1.6; margin-top: 0.5rem; }

        /* Star form */
        .star-rating-form { font-size: 2rem; cursor: pointer; color: #d1d5db; display: inline-flex; gap: 0.25rem; user-select: none; }
        .star-rating-form span { transition: color 0.15s; }

        /* Empty state inline */
        .empty-inline { text-align: center; padding: 3rem 2rem; color: var(--neutral-500); }
        .empty-inline-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .empty-inline h4 { color: var(--neutral-700); font-size: 1.05rem; font-weight: 600; margin-bottom: 0.4rem; }
        .empty-inline p { font-size: 0.875rem; }`;

const startIdx = content.indexOf(cssTargetStart);
const endIdx = content.indexOf(cssTargetEnd) + cssTargetEnd.length;
if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + newStyles + content.substring(endIdx);
} else {
    console.log("Could not find CSS block to replace");
}

// Ensure the old .trust-grid style is upgraded
content = content.replace(/\.trust-grid\s*\{[^}]+\}\s*@media[^{]+\{[^}]+\}\s*\}\s*\.trust-item\s*\{[^}]+\}\s*\.trust-label\s*\{[^}]+\}\s*\.trust-value\s*\{[^}]+\}\s*\.status-dot\s*\{[^}]+\}\s*/, 
    `.trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 1.5rem; padding: 1.25rem 1.5rem; background: #f8fafc; border-radius: 12px; border: 1px solid var(--neutral-200); }
        @media(max-width:600px) { .trust-grid { grid-template-columns: repeat(2,1fr); } }
        .trust-item { display: flex; flex-direction: column; gap: 0.25rem; }
        .trust-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--neutral-500); font-weight: 700; }
        .trust-value { font-size: 1rem; font-weight: 600; color: var(--neutral-900); display: flex; align-items: center; gap: 0.5rem; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }
        `);


// 4. Upgrade material rendering logic
const oldMatTarget = `<div class="mat-tags">\${`;
const newMatLogic = `<div class="mat-cards-grid">\${
                        mats.map(m => {
                            const imgHtml = m.imagen_url
                                ? \`<div class="mat-card-img"><img src="\${API_BASE}\${m.imagen_url}" alt="\${m.nombre}" loading="lazy"></div>\`
                                : \`<div class="mat-card-img"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>\`;
                            const precio = m.precio ? \`<div class="mat-card-price">C$ \${parseFloat(m.precio).toLocaleString('es-NI')}</div>\` : '';
                            return \`
                            <div class="mat-card">
                                \${imgHtml}
                                <div class="mat-card-body">
                                    <div class="mat-card-name">\${m.nombre}</div>
                                    <div class="mat-card-meta">
                                        <span class="mat-card-badge">&#128230; \${m.cantidad} \${m.unidad}</span>
                                        \${m.calidad ? \`<span class="mat-card-badge" style="background:var(--success-100);color:#059669;border-color:var(--success-200)">\${m.calidad}</span>\` : ''}
                                    </div>
                                    \${precio}
                                </div>
                            </div>\`;
                        }).join('')`;

if (content.includes(oldMatTarget)) {
    content = content.replace(/<div class="mat-tags">([^`]+)\.join\(''\)/, newMatLogic);
} else {
    console.log("Could not find Material logic to replace");
}

fs.writeFileSync('perfil-proveedor.html', content, 'utf8');
console.log('Fixed perfil-proveedor.html cleanly without duplication');
