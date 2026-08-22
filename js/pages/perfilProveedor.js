const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('navbar-container').innerHTML = buildNavbar('');
    const user = window.ProVendAuth ? ProVendAuth.getCurrentUser() : null;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        alert('Proveedor no especificado');
        window.location.href = 'explorar.html';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/proveedores/${id}`);
        if (!res.ok) throw new Error('Error al cargar perfil');
        const p = await res.json();
        
        window.proveedorData = p; // Para usar en los clics de contacto

        // 1. Logo
        const logoDiv = document.getElementById('profile-logo-display');
        if (p.logo_url) {
            const imgUrl = p.logo_url.startsWith('http') ? p.logo_url : `${API_BASE}${p.logo_url}`;
            logoDiv.innerHTML = `<img src="${imgUrl}" alt="${p.nombre}">`;
        } else {
            const initials = p.nombre.substring(0, 2).toUpperCase();
            logoDiv.textContent = initials;
        }

        // 2. Nombre y Verificación
        document.getElementById('profile-name-display').textContent = p.nombre;
        if (p.verificado) {
            document.getElementById('profile-verified-badge').style.display = 'inline-flex';
        }

        // 3. Tags (Categoría)
        const tagsDiv = document.getElementById('profile-tags-display');
        if (p.categoria) {
            tagsDiv.innerHTML = `<span class="profile-tag" style="background:#eff6ff; color:#1d4ed8;">${p.categoria}</span>`;
        }

        // 4. Ubicación
        document.getElementById('profile-location-display').textContent = (p.ciudad || 'Nicaragua') + (p.direccion ? ', ' + p.direccion : '');
        document.getElementById('info-location').textContent = p.ciudad || 'No especificada';

        // 5. Rating
        const ratingVal = p.rating ? parseFloat(p.rating).toFixed(1) : '0.0';
        document.getElementById('profile-rating-display').textContent = `${ratingVal} (${p.reviews || 0} reseñas)`;

        // 6. Descripción
        const descText = p.descripcion || 'Este proveedor aún no ha agregado una descripción.';
        document.getElementById('profile-desc-display').textContent = descText;
        document.getElementById('about-desc').textContent = descText;

        // 7. Certificados
        const certsDiv = document.getElementById('profile-certs-display');
        if (p.certificados) {
            const certs = p.certificados.split(',').map(c => c.trim()).filter(c => c);
            certsDiv.innerHTML = certs.map(c => `<span class="profile-cert">${c}</span>`).join('');
        }

        // 8. Contact Info en el Tab
        document.getElementById('info-phone').textContent = p.telefono || p.whatsapp || 'No especificado';
        document.getElementById('info-email').textContent = p.email || p.usuario_email || 'No especificado';
        document.getElementById('info-web').textContent = p.sitio_web || 'No especificado';
        
        if (document.getElementById('info-horario')) {
            document.getElementById('info-horario').textContent = p.horario || 'No especificado';
        }
        if (document.getElementById('info-cert')) {
            document.getElementById('info-cert').textContent = p.certificados || 'Ninguna reportada';
        }

        // 9. Botones de Acción (Links)
        if (p.whatsapp) {
            document.getElementById('contact-btn-wsp').onclick = () => window.open(`https://wa.me/${p.whatsapp.replace(/\D/g,'')}`, '_blank');
        } else {
            document.getElementById('contact-btn-wsp').onclick = () => alert('El proveedor no tiene WhatsApp registrado.');
        }

        if (p.email || p.usuario_email) {
            document.getElementById('contact-email').href = `mailto:${p.email || p.usuario_email}`;
        } else {
            document.getElementById('contact-email').onclick = (e) => { e.preventDefault(); alert('Email no disponible'); };
        }

        if (p.telefono) {
            document.getElementById('contact-phone').href = `tel:${p.telefono.replace(/\D/g,'')}`;
        } else {
            document.getElementById('contact-phone').onclick = (e) => { e.preventDefault(); alert('Teléfono no disponible'); };
        }

        if (p.sitio_web) {
            let url = p.sitio_web.startsWith('http') ? p.sitio_web : 'https://' + p.sitio_web;
            document.getElementById('contact-web').href = url;
        } else {
            document.getElementById('contact-web').onclick = (e) => { e.preventDefault(); alert('Sitio web no disponible'); };
        }

        // 10. Materiales del proveedor
        const matRes = await fetch(`${API_BASE}/api/dashboard/proveedor/${id}/materiales`);
        const mats = await matRes.json();
        window.providerMaterials = mats;
        
        document.getElementById('count-mats').textContent = mats.length;
        
        const matDiv = document.getElementById('materiales-perfil');
        if (mats.length === 0) {
            matDiv.innerHTML = `<div style="grid-column:1/-1; padding:2rem; text-align:center; color:var(--neutral-500); background:white; border-radius:12px; border:1px solid var(--neutral-200);">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:1rem; opacity:0.5;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                <p>Este proveedor aún no ha publicado materiales o productos.</p>
            </div>`;
        } else {
            matDiv.innerHTML = mats.map(m => {
                const imgHtml = m.imagen_url
                    ? `<div class="mat-card-img"><img src="${API_BASE}${m.imagen_url}" alt="${m.nombre}" loading="lazy"></div>`
                    : `<div class="mat-card-img"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>`;
                
                return `
                <div class="mat-card" onclick="openMaterialModal('${m.id}')">
                    ${imgHtml}
                    <div class="mat-card-body">
                        <div class="mat-card-name">${m.nombre}</div>
                        <div class="mat-card-meta">
                            ${m.precio_estimado ? `<span style="background:var(--success-50); color:var(--success-700); padding:2px 8px; border-radius:12px; font-weight:600">C$ ${m.precio_estimado}</span>` : ''}
                            ${m.calidad_pureza ? `<span style="background:var(--primary-50); color:var(--primary-700); padding:2px 8px; border-radius:12px; font-weight:600">${m.calidad_pureza}</span>` : ''}
                        </div>
                        <div style="font-size:0.8rem; color:var(--neutral-500);">📦 ${m.cantidad || 'N/A'} ${m.unidad || ''}</div>
                    </div>
                </div>`;
            }).join('');
        }

        // Lógica de Reseñas
        if (user && user.rol === 'empresa') {
            document.getElementById('btn-show-review').style.display = 'inline-block';
        }

        loadReviews(id);

    } catch (err) {
        console.error(err);
        alert('Hubo un problema cargando el perfil.');
    }
    
    // Configurar estrellas
    let selectedRating = 0;
    const stars = document.querySelectorAll('.star-rating-form span');
    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const val = parseInt(star.getAttribute('data-val'));
            stars.forEach(s => {
                s.style.color = parseInt(s.getAttribute('data-val')) <= val ? '#f59e0b' : '#d1d5db';
            });
        });
        star.addEventListener('mouseout', () => {
            stars.forEach(s => {
                s.style.color = parseInt(s.getAttribute('data-val')) <= selectedRating ? '#f59e0b' : '#d1d5db';
            });
        });
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-val'));
            document.getElementById('review-rating').value = selectedRating;
        });
    });

    document.getElementById('btn-show-review').addEventListener('click', () => {
        document.getElementById('review-form-container').style.display = 'block';
        document.getElementById('btn-show-review').style.display = 'none';
    });
});

async function loadReviews(proveedorId) {
    try {
        const res = await fetch(`${API_BASE}/api/dashboard/proveedor/${proveedorId}/resenas`);
        const reviews = await res.json();
        
        document.getElementById('count-resenas').textContent = reviews.length;
        
        const container = document.getElementById('resenas-container');
        if (reviews.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--neutral-500);">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:1rem; opacity:0.5;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <p>Aún no hay reseñas. Las empresas podrán calificar a este proveedor después de contactarlo.</p>
            </div>`;
            return;
        }

        const currentUser = window.ProVendAuth ? ProVendAuth.getCurrentUser() : null;

        container.innerHTML = reviews.map(r => {
            const isOwner = currentUser && currentUser.id == r.empresa_id;
            const displayName = r.empresa_nombre || r.empresa_contacto || 'Empresa Anónima';
            const initials = displayName.substring(0, 2).toUpperCase();
            const date = new Date(r.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
            
            const actionButtons = isOwner ? `
                <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                    <button onclick="editReview(${r.id}, ${r.rating}, '${(r.comentario || '').replace(/'/g, "\\'")}')" class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;">Editar</button>
                    <button onclick="deleteReview(${r.id}, ${proveedorId})" class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 0.2rem 0.5rem; color: var(--danger-600); border-color: var(--danger-200);">Eliminar</button>
                </div>
            ` : '';

            return `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-author">
                        <div class="review-avatar">${initials}</div>
                        <div class="review-author-info">
                            <h4>${displayName}</h4>
                            <span>Empresa Compradora</span>
                        </div>
                    </div>
                    <div class="review-date">${date}</div>
                </div>
                <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
                <p class="review-body">${r.comentario || '<em>Sin comentario adicional.</em>'}</p>
                ${actionButtons}
            </div>`;
        }).join('');
    } catch (e) {
        console.error(e);
    }
}

async function submitReview() {
    const urlParams = new URLSearchParams(window.location.search);
    const proveedorId = urlParams.get('id');
    const token = localStorage.getItem('ProVend_token') || localStorage.getItem('token');
    const rating = document.getElementById('review-rating').value;
    const comentario = document.getElementById('review-comment').value;

    if (!rating || rating == 0) return alert('Por favor selecciona una calificación de 1 a 5 estrellas.');

    const btn = document.getElementById('btn-submit-review');
    btn.disabled = true; btn.textContent = 'Publicando...';

    try {
        const res = await fetch(`${API_BASE}/api/resenas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ proveedor_id: proveedorId, rating, comentario })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al publicar reseña');
        
        alert('Reseña publicada con éxito');
        
        document.getElementById('review-rating').value = 0;
        document.getElementById('review-comment').value = '';
        document.querySelectorAll('.star-rating-form span').forEach(s => s.style.color = '#d1d5db');
        document.getElementById('review-form-container').style.display = 'none';
        document.getElementById('btn-show-review').style.display = 'inline-block';
        
        loadReviews(proveedorId);
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false; btn.textContent = 'Publicar Reseña';
    }
}

window.deleteReview = async function(id, proveedorId) {
    if (!confirm('¿Estás seguro de eliminar esta reseña?')) return;
    const token = localStorage.getItem('ProVend_token') || localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE}/api/resenas/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error al eliminar');
        alert('Reseña eliminada');
        loadReviews(proveedorId);
    } catch (e) {
        alert(e.message);
    }
};

window.editReview = function(id, rating, comentario) {
    document.getElementById('review-form-container').style.display = 'block';
    document.getElementById('btn-show-review').style.display = 'none';
    
    document.getElementById('review-rating').value = rating;
    document.getElementById('review-comment').value = comentario;
    
    const stars = document.querySelectorAll('.star-rating-form span');
    stars.forEach(s => {
        s.style.color = parseInt(s.getAttribute('data-val')) <= rating ? '#f59e0b' : '#d1d5db';
    });

    const btnSubmit = document.getElementById('btn-submit-review');
    btnSubmit.textContent = 'Actualizar Reseña';
    btnSubmit.onclick = () => submitEditedReview(id);
};

async function submitEditedReview(id) {
    const urlParams = new URLSearchParams(window.location.search);
    const proveedorId = urlParams.get('id');
    const token = localStorage.getItem('ProVend_token') || localStorage.getItem('token');
    const rating = document.getElementById('review-rating').value;
    const comentario = document.getElementById('review-comment').value;

    if (rating == 0) return alert('Por favor, selecciona una calificación');

    const btn = document.getElementById('btn-submit-review');
    btn.disabled = true; btn.textContent = 'Actualizando...';

    try {
        const res = await fetch(`${API_BASE}/api/resenas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ rating, comentario })
        });
        if (!res.ok) throw new Error('Error al actualizar');
        
        alert('Reseña actualizada con éxito');
        
        document.getElementById('review-rating').value = 0;
        document.getElementById('review-comment').value = '';
        document.querySelectorAll('.star-rating-form span').forEach(s => s.style.color = '#d1d5db');
        document.getElementById('review-form-container').style.display = 'none';
        document.getElementById('btn-show-review').style.display = 'inline-block';
        
        const btnSubmit = document.getElementById('btn-submit-review');
        btnSubmit.textContent = 'Publicar Reseña';
        btnSubmit.onclick = submitReview;
        
        loadReviews(proveedorId);
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false; btn.textContent = 'Actualizar Reseña';
    }
}

window.openMaterialModal = function(id) {
    if(!window.providerMaterials) return;
    const m = window.providerMaterials.find(x => x.id == id);
    if(!m) return;
    
    document.getElementById('material-modal-name').textContent = m.nombre;
    document.getElementById('material-modal-price').textContent = m.precio_estimado ? 'C$ ' + m.precio_estimado : 'Precio a convenir';
    document.getElementById('material-modal-qty').textContent = m.cantidad ? (m.cantidad + ' ' + (m.unidad || '')) : 'N/A';
    document.getElementById('material-modal-freq').textContent = m.frecuencia_disponibilidad || 'Única vez';
    document.getElementById('material-modal-min').textContent = m.volumen_minimo || 'N/A';
    document.getElementById('material-modal-quality').textContent = m.calidad_pureza || 'No especificada';
    document.getElementById('material-modal-desc').textContent = m.descripcion || 'Sin descripción detallada.';
    
    const imgDiv = document.getElementById('material-modal-img');
    if(m.imagen_url) {
        imgDiv.innerHTML = `<img src="${API_BASE}${m.imagen_url}" style="width:100%; height:100%; object-fit:cover; border-radius: 12px 12px 0 0;" alt="${m.nombre}">`;
    } else {
        imgDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>';
    }
    
    document.getElementById('material-modal').style.display = 'flex';
};
window.contactarWsp = function() { if(!window.proveedorData || !window.proveedorData.whatsapp) return alert('El proveedor no tiene WhatsApp registrado.'); window.open('https://wa.me/' + window.proveedorData.whatsapp.replace(/\\D/g, ''), '_blank'); };
