document.getElementById('navbar-container').innerHTML = buildNavbar('');
        document.getElementById('footer-container').innerHTML = buildFooter();

        const user = window.ProVendAuth ? ProVendAuth.getCurrentUser() : null;
        const urlParams = new URLSearchParams(window.location.search);
        const providerId = urlParams.get('id');
        const COLORS = ['#2B7DE9','#27ae60','#e67e22','#9b59b6','#e74c3c','#1abc9c'];

        if (!providerId) {
            document.getElementById('profile-name').textContent = 'Proveedor no encontrado';
        }

        async function loadProfile() {
            try {
                const res = await fetch(`${API_BASE}/api/proveedores/${providerId}`);
                if (!res.ok) throw new Error('No encontrado');
                const p = await res.json();

                // Registrar visita
                if (user && user.id !== p.id) {
                    fetch(`${API_BASE}/api/visitas`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ proveedor_id: p.id, visitante_id: user.id })
                    });
                }

                // Title
                document.title = `${p.company || p.nombre} — ProVend`;

                // Avatar / Logo
                const logoWrapper = document.getElementById('profile-logo-wrapper');
                const initials = (p.company || p.nombre || 'PR').substring(0, 2).toUpperCase();
                const color = COLORS[p.id % COLORS.length];
                if (p.logo_url) {
                    logoWrapper.innerHTML = `<img class="profile-logo" src="${p.logo_url}" alt="${p.company}" onerror="this.outerHTML='<div class=\\'profile-avatar-fallback\\' style=\\'background:${color}\\'>${initials}</div>'">`;
                } else {
                    logoWrapper.innerHTML = `<div class="profile-avatar-fallback" style="background:${color}">${initials}</div>`;
                }

                // Name + verified
                document.getElementById('profile-name').textContent = p.company || p.nombre;
                if (p.verificado) {
                    document.getElementById('profile-verified').style.display = 'inline-flex';
                    document.getElementById('trust-verified-text').textContent = 'Sí ✅';
                    document.getElementById('info-verif').textContent = 'Verificado ✅';
                } else {
                    document.getElementById('trust-verified-text').textContent = 'No';
                    document.getElementById('info-verif').textContent = 'No verificado';
                }

                // Tags
                const tags = [];
                if (p.categoria) tags.push(`<span class="badge badge-primary">${p.categoria}</span>`);
                document.getElementById('profile-tags').innerHTML = tags.join('');

                // Descripción
                document.getElementById('profile-desc').textContent = p.descripcion || 'Este proveedor aún no ha agregado una descripción.';

                // Trust grid
                document.getElementById('trust-status').textContent = p.estado || 'Disponible';
                document.getElementById('trust-time').textContent = p.tiempo_respuesta || '24 horas';
                document.getElementById('trust-visits').textContent = p.visitas_total || 0;

                // Rating dinámico
                const ratingDiv = document.getElementById('rating-display');
                const rating = Number(p.rating) || 0;
                const reviews = Number(p.reviews) || 0;
                if (reviews === 0) {
                    ratingDiv.innerHTML = `
                        <div style="text-align:center; color:var(--neutral-400); font-size:0.875rem; padding:0.5rem 0">
                            <div style="font-size:1.5rem; margin-bottom:0.25rem">⭐</div>
                            Sin reseñas todavía
                        </div>`;
                } else {
                    const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
                    ratingDiv.innerHTML = `
                        <div class="rating-number-lg">${rating.toFixed(1)}</div>
                        <div class="rating-stars-lg" style="color:var(--warning-500)">${stars}</div>
                        <div class="rating-count-sm">${reviews} reseña${reviews !== 1 ? 's' : ''}</div>`;
                }

                // Contacto
                if (p.whatsapp) {
                    document.getElementById('whatsapp-btn').style.display = 'flex';
                    document.getElementById('whatsapp-btn').href = `https://wa.me/${p.whatsapp.replace(/\D/g,'')}?text=Hola,%20les%20encontramos%20en%20ProVend.`;
                } else {
                    document.getElementById('whatsapp-btn').style.display = 'flex';
                    document.getElementById('whatsapp-btn').style.opacity = '0.5';
                    document.getElementById('whatsapp-btn').style.cursor = 'default';
                    document.getElementById('whatsapp-btn').textContent = 'WhatsApp no disponible';
                    document.getElementById('whatsapp-btn').onclick = (e) => { e.preventDefault(); };
                }
                if (p.email) {
                    document.getElementById('email-btn').style.display = 'inline-flex';
                    document.getElementById('email-btn').href = `mailto:${p.email}`;
                } else {
                    document.getElementById('email-btn').style.display = 'inline-flex';
                    document.getElementById('email-btn').style.opacity = '0.5';
                    document.getElementById('email-btn').style.cursor = 'default';
                    document.getElementById('email-btn').innerHTML += ' (no disponible)';
                    document.getElementById('email-btn').onclick = (e) => e.preventDefault();
                }

                // Info Comercial
                document.getElementById('info-city').textContent = p.ciudad || 'No disponible';
                document.getElementById('info-cat').textContent = p.categoria || 'No disponible';
                document.getElementById('info-email').textContent = p.email || 'No disponible';
                document.getElementById('info-verif').textContent = p.verificado ? 'Verificado ✅' : 'Pendiente de verificación';

                // Materiales del proveedor
                const matRes = await fetch(`${API_BASE}/api/dashboard/proveedor/${p.id}/materiales`);
                const mats = await matRes.json();
                const matDiv = document.getElementById('materiales-perfil');
                if (mats.length === 0) {
                    matDiv.innerHTML = `
                        <div class="empty-inline">
                            <div class="empty-inline-icon">📦</div>
                            <h4>No hay materiales publicados</h4>
                            <p>Este proveedor aún no ha publicado materiales disponibles.</p>
                        </div>`;
                } else {
                    matDiv.innerHTML = `<div class="mat-cards-grid">${
                        mats.map(m => {
                            const imgHtml = m.imagen_url
                                ? `<div class="mat-card-img"><img src="${API_BASE}${m.imagen_url}" alt="${m.nombre}" loading="lazy"></div>`
                                : `<div class="mat-card-img"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>`;
                            const precio = m.precio ? `<div class="mat-card-price">C$ ${parseFloat(m.precio).toLocaleString('es-NI')}</div>` : '';
                            return `
                            <div class="mat-card">
                                ${imgHtml}
                                <div class="mat-card-body">
                                    <div class="mat-card-name">${m.nombre}</div>
                                    <div class="mat-card-meta">
                                        <span class="mat-card-badge">&#128230; ${m.cantidad} ${m.unidad}</span>
                                        ${m.calidad ? `<span class="mat-card-badge" style="background:var(--success-100);color:#059669;border-color:var(--success-200)">${m.calidad}</span>` : ''}
                                    </div>
                                    ${precio}
                                </div>
                            </div>`;
                        }).join('')
                    }</div>`;
                }

                // Reseñas
                const revRes = await fetch(`${API_BASE}/api/dashboard/proveedor/${p.id}/resenas`);
                const revs = await revRes.json();
                const revDiv = document.getElementById('resenas-container');
                if (revs.length === 0) {
                    revDiv.innerHTML = `
                        <div class="empty-inline">
                            <div class="empty-inline-icon">⭐</div>
                            <h4>Aún no tiene reseñas</h4>
                            <p>Las empresas podrán calificar a este proveedor después de realizar un contacto.</p>
                        </div>`;
                } else {
                    const stars = n => '★'.repeat(n) + '☆'.repeat(5-n);
                    revDiv.innerHTML = revs.map(r => `
                        <div class="review-card">
                            <div class="review-header">
                                <div class="review-avatar">${(r.empresa_nombre || 'E').substring(0,2).toUpperCase()}</div>
                                <div>
                                    <div class="review-empresa">${r.empresa_nombre || 'Empresa verificada'}</div>
                                    <div class="review-date">${new Date(r.created_at).toLocaleDateString('es-NI', {year:'numeric',month:'long',day:'numeric'})}</div>
                                </div>
                                <div class="review-stars" style="margin-left:auto">${stars(r.rating)}</div>
                            </div>
                            ${r.comentario ? `<p style="color:var(--neutral-700);font-size:0.9rem;margin:0">"${r.comentario}"</p>` : ''}
                        </div>
                    `).join('');
                }

            } catch(e) {
                document.getElementById('profile-name').textContent = 'Proveedor no encontrado';
                document.getElementById('profile-desc').textContent = 'No pudimos encontrar este perfil.';
            }
        }

        async function toggleFavorito() {
            if (!user || user.rol !== 'empresa') {
                alert('Debes iniciar sesión como Empresa para guardar favoritos.');
                return;
            }
            const res = await ProVendAuth.apiFetch(`${API_BASE}/api/favoritos`), {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ empresa_id: user.id, proveedor_id: parseInt(providerId) })
            });
            const data = await res.json();
            const icon = document.getElementById('fav-icon');
            if (data.added) {
                icon.setAttribute('fill', 'var(--danger-500)');
                icon.setAttribute('stroke', 'var(--danger-500)');
                document.getElementById('fav-btn').title = 'Quitar de favoritos';
                if (data.total === 1) {
                    showToast('⭐ Guardaste tu primer proveedor. Podrás encontrarlo fácilmente desde Favoritos.', 'success', 5000);
                } else {
                    showToast('Guardado en favoritos ❤️', 'success');
                }
            } else {
                showToast('Ya estaba en tus favoritos', 'info');
            }
        }

        function showToast(msg, type, duration = 3000) {
            const t = document.createElement('div');
            t.style.cssText = `position:fixed;bottom:2rem;right:2rem;background:${type==='success'?'var(--success-600)':'var(--neutral-700)'};color:white;padding:1rem 1.5rem;border-radius:12px;font-weight:500;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2)`;
            t.textContent = msg;
            document.body.appendChild(t);
            setTimeout(() => t.remove(), duration);
        }

        loadProfile();

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
                const res = await ProVendAuth.apiFetch(`${API_BASE}/api/resenas`, {
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