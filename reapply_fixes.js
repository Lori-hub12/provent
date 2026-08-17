const fs = require('fs');

let content = fs.readFileSync('perfil-proveedor.html', 'utf8');

// 1. Fix single quotes API_BASE
content = content.replace(/fetch\('(\$\{API_BASE\}[^']*)'/g, 'fetch(`$1`)');
content = content.replace(/apiFetch\('(\$\{API_BASE\}[^']*)'/g, 'apiFetch(`$1`)');

// 2. Insert new CSS styles safely
const cssRegex = /\.commercial-info-item\s*strong\s*\{[\s\S]*?\.empty-inline\s*p\s*\{\s*font-size:\s*0\.875rem;\s*\}/;
const newStyles = `.trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 1.5rem; padding: 1.25rem 1.5rem; background: #f8fafc; border-radius: 12px; border: 1px solid var(--neutral-200); }
        @media(max-width:600px) { .trust-grid { grid-template-columns: repeat(2,1fr); } }
        .trust-item { display: flex; flex-direction: column; gap: 0.25rem; }
        .trust-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--neutral-500); font-weight: 700; }
        .trust-value { font-size: 1rem; font-weight: 600; color: var(--neutral-900); display: flex; align-items: center; gap: 0.5rem; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }

        .commercial-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-top: 1rem; }
        .commercial-info-item strong { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--neutral-400); font-weight: 700; margin-bottom: 0.35rem; }
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

content = content.replace(cssRegex, newStyles);
content = content.replace(/\.trust-grid\s*\{[^}]+\}\s*@media[^{]+\{[^}]+\}\s*\}\s*\.trust-item\s*\{[^}]+\}\s*\.trust-label\s*\{[^}]+\}\s*\.trust-value\s*\{[^}]+\}\s*\.status-dot\s*\{[^}]+\}\s*\.commercial-info\s*\{[^}]+\}\s*/, '');

// 3. Insert review form UI
const reviewHeaderRegex = /<h3 style="margin-bottom:1rem; border-bottom:1px solid var\(--neutral-100\); padding-bottom:1rem;">Reseñas<\/h3>/;
const newReviewForm = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--neutral-100); padding-bottom:1rem;">
                    <h3 style="margin:0;">Reseñas</h3>
                    <button id="btn-show-review" class="btn btn-primary btn-sm" style="display:none; font-size:0.875rem;">✏️ Escribir reseña</button>
                </div>

                <!-- Formulario de reseña (oculto por defecto) -->
                <div id="review-form-container" style="display:none; background:var(--neutral-50); border:1px solid var(--neutral-200); border-radius:12px; padding:1.5rem; margin-bottom:1.5rem;">
                    <h4 style="margin-bottom:1rem; color:var(--neutral-900);">Deja tu reseña</h4>
                    <div style="margin-bottom:1rem;">
                        <label class="form-label" style="display:block; margin-bottom:0.5rem; font-weight:600;">Calificación</label>
                        <div class="star-rating-form" id="star-rating-form">
                            <span data-val="1">★</span><span data-val="2">★</span><span data-val="3">★</span><span data-val="4">★</span><span data-val="5">★</span>
                        </div>
                        <input type="hidden" id="review-rating" value="0">
                    </div>
                    <div class="form-group" style="margin-bottom:1.25rem;">
                        <label class="form-label" style="display:block; margin-bottom:0.5rem; font-weight:600;">Comentario (opcional)</label>
                        <textarea id="review-comment" class="form-input" rows="3" placeholder="¿Cómo fue tu experiencia trabajando con este proveedor?" style="width:100%; padding:0.75rem; border:1px solid var(--neutral-300); border-radius:8px;"></textarea>
                    </div>
                    <div style="display:flex; gap:1rem; justify-content:flex-end;">
                        <button class="btn btn-outline" onclick="document.getElementById('review-form-container').style.display='none'">Cancelar</button>
                        <button class="btn btn-primary" id="btn-submit-review" onclick="submitReview()">Publicar Reseña</button>
                    </div>
                </div>`;
content = content.replace(reviewHeaderRegex, newReviewForm);


// 4. Upgrade material rendering logic
const oldMatLogic = /<div class="mat-tags">\$\{\s*mats\.map\([^`]+\`<span class="mat-tag">📦 \$\{m\.nombre\} · \$\{m\.cantidad\} \$\{m\.unidad\}<\/span>\`\)\.join\(''\)\s*\}<\/div>/;
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
                        }).join('')
                    }</div>`;
content = content.replace(oldMatLogic, newMatLogic);
content = content.replace('<div class="empty-inline-icon">📦</div>', '<div class="empty-inline-icon">&#128230;</div>');


// 5. Insert review JS logic
const loadProfileRegex = /loadProfile\(\);\s*<\/script>/;
const reviewJS = `loadProfile();

        // Lógica del formulario de reseña
        if (user && user.rol === 'empresa') {
            document.getElementById('btn-show-review').style.display = 'block';
        }

        let selectedRating = 0;
        document.querySelectorAll('.star-rating-form span').forEach(star => {
            star.addEventListener('mouseover', function() {
                let val = this.dataset.val;
                document.querySelectorAll('.star-rating-form span').forEach(s => {
                    s.style.color = s.dataset.val <= val ? '#f59e0b' : '#d1d5db';
                });
            });
            star.addEventListener('mouseout', function() {
                document.querySelectorAll('.star-rating-form span').forEach(s => {
                    s.style.color = s.dataset.val <= selectedRating ? '#f59e0b' : '#d1d5db';
                });
            });
            star.addEventListener('click', function() {
                selectedRating = this.dataset.val;
                document.getElementById('review-rating').value = selectedRating;
                document.querySelectorAll('.star-rating-form span').forEach(s => {
                    s.style.color = s.dataset.val <= selectedRating ? '#f59e0b' : '#d1d5db';
                });
            });
        });

        document.getElementById('btn-show-review').addEventListener('click', () => {
            document.getElementById('review-form-container').style.display = 'block';
        });

        async function submitReview() {
            if (selectedRating == 0) {
                showToast('Por favor selecciona una calificación', 'error');
                return;
            }
            const btn = document.getElementById('btn-submit-review');
            btn.disabled = true; btn.textContent = 'Publicando...';
            
            try {
                const res = await ProVendAuth.apiFetch(\`\${API_BASE}/api/resenas\`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        proveedor_id: providerId,
                        rating: selectedRating,
                        comentario: document.getElementById('review-comment').value
                    })
                });
                
                if (!res.ok) {
                    const data = await res.json().catch(()=>({}));
                    throw new Error(data.error || 'Error al publicar la reseña');
                }
                
                showToast('¡Reseña publicada con éxito!', 'success');
                
                // Reset form
                selectedRating = 0;
                document.getElementById('review-rating').value = 0;
                document.getElementById('review-comment').value = '';
                document.querySelectorAll('.star-rating-form span').forEach(s => s.style.color = '#d1d5db');
                document.getElementById('review-form-container').style.display = 'none';
                
                // Reload profile to show new review
                loadProfile();
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                btn.disabled = false; btn.textContent = 'Publicar Reseña';
            }
        }
    </script>`;

content = content.replace(loadProfileRegex, reviewJS);


fs.writeFileSync('perfil-proveedor.html', content, 'utf8');
console.log('Fixed perfil-proveedor.html applied fully!');
