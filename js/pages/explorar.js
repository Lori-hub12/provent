document.getElementById('navbar-container').innerHTML = buildNavbar('explorar');

        let currentTab = 'materiales';
        const COLORS = ['#2B7DE9','#27ae60','#e67e22','#9b59b6','#e74c3c','#1abc9c'];
        
        let debounceTimer;

        function setTab(tab, evt) {
            currentTab = tab;
            document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
            if (evt && evt.target) evt.target.classList.add('active');
            const input = document.getElementById('searchInput');
            input.placeholder = tab === 'materiales' ? 'Ej. Cartón, PET, Aluminio...' : 'Ej. Recicladora, EcoPlast...';
            triggerSearch();
        }

        function triggerSearch() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchResults();
            }, 300);
        }

        async function fetchResults() {
            const query = document.getElementById('searchInput').value.trim();
            const isVerified = document.getElementById('verifiedOnly').checked;
            const locationCheckboxes = document.querySelectorAll('input[type="checkbox"][value]:checked');
            const selectedLocations = Array.from(locationCheckboxes).map(cb => cb.value);

            const container = document.getElementById('resultsGrid');
            const resultsCount = document.getElementById('resultsCount');
            
            // Estado de carga
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--neutral-500);">Buscando resultados...</div>';

            const params = new URLSearchParams();
            if (query) params.append('q', query);
            params.append('type', currentTab);
            if (isVerified) params.append('verificados', 'true');
            if (selectedLocations.length > 0) params.append('ubicacion', selectedLocations.join(','));

            try {
                const res = await fetch(`${API_BASE}/api/search?${params.toString()}`);
                if (!res.ok) throw new Error('Error en búsqueda');
                const data = await res.json();
                
                resultsCount.textContent = data.length;
                renderResults(data, query);
            } catch (err) {
                console.error(err);
                container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--danger-500);">Hubo un error cargando los resultados.</div>';
            }
        }

        function renderResults(data, query) {
            const container = document.getElementById('resultsGrid');
            container.innerHTML = '';

            if (data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <h3 style="color:var(--neutral-800); font-size:1.5rem; margin-bottom:0.75rem; font-weight:700;">
                            ${query ? 'No encontramos resultados para "' + query + '"' : 'No hay resultados en esta categoría'}
                        </h3>
                        <p style="max-width:450px; margin:0 auto 2rem; color:var(--neutral-500); font-size:1.1rem; line-height:1.6;">
                            Intenta cambiar los filtros, probar otros términos, o cambiar de pestaña.
                        </p>
                        <button onclick="document.getElementById('searchInput').value=''; document.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false); fetchResults()" class="btn btn-outline btn-lg">Limpiar Búsqueda</button>
                    </div>`;
                return;
            }

            data.forEach(item => {
                if (currentTab === 'materiales') {
                    // Render Material Card
                    const color = COLORS[(item.proveedor_id || 0) % COLORS.length];
                    const defaultImg = `<div style="width: 100%; height: 180px; background: var(--neutral-100); display: flex; align-items: center; justify-content: center; color: var(--neutral-400); border-bottom: 1px solid var(--neutral-200);"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg></div>`;
                    const imgHtml = item.imagen_url ? `<img src="${API_BASE}${item.imagen_url}" alt="${item.nombre}" style="width: 100%; height: 180px; object-fit: cover; border-bottom: 1px solid var(--neutral-200);">` : defaultImg;
                    
                    container.innerHTML += `
                        <div class="provider-card" style="background:var(--white);border:1px solid var(--neutral-200);box-shadow:0 2px 4px rgba(0,0,0,0.02); overflow:hidden; display:flex; flex-direction:column;">
                            ${imgHtml}
                            <div style="padding: 1.5rem; flex:1; display:flex; flex-direction:column;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                                    <h3 style="font-size:1.2rem; font-weight:700; color:var(--neutral-900); margin:0;">${item.nombre}</h3>
                                    <span style="background:var(--primary-50); color:var(--primary-700); padding:0.2rem 0.6rem; border-radius:99px; font-size:0.75rem; font-weight:600;">${item.cantidad} ${item.unidad}</span>
                                </div>
                                <p style="color:var(--neutral-500); font-size:0.9rem; margin-bottom:1rem; flex:1;">${item.descripcion || 'Sin descripción detallada.'}</p>
                                
                                <div style="border-top:1px solid var(--neutral-100); padding-top:1rem; margin-top:auto;">
                                    <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
                                        <div style="width:32px; height:32px; border-radius:50%; background:${color}; color:white; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:bold;">${(item.empresa_nombre || item.proveedor_nombre || 'P').substring(0,2).toUpperCase()}</div>
                                        <div style="font-size:0.85rem; color:var(--neutral-700);">
                                            <strong>${item.empresa_nombre || item.proveedor_nombre}</strong> ${item.verificado ? '<span style="color:#27ae60">✅</span>' : ''}
                                            <div style="color:var(--neutral-500); font-size:0.75rem;">${item.ciudad || 'Nicaragua'}</div>
                                        </div>
                                    </div>
                                    <a href="perfil-proveedor.html?id=${item.proveedor_id}" class="btn btn-primary" style="width:100%; text-align:center;">Ver Oferta</a>
                                </div>
                            </div>
                        </div>`;
                } else {
                    // Render Provider Card
                    const name = item.company || item.proveedor_nombre || 'Empresa';
                    const initials = name.substring(0,2).toUpperCase();
                    const color = COLORS[item.id % COLORS.length];
                    const logoHtml = item.logo_url 
                        ? `<img src="${API_BASE}${item.logo_url}" style="width:48px;height:48px;border-radius:12px;object-fit:cover;">` 
                        : `<div style="background:${color};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.25rem;border-radius:12px;width:48px;height:48px;flex-shrink:0">${initials}</div>`;

                    container.innerHTML += `
                        <div class="provider-card" style="background:var(--white);border:1px solid var(--neutral-200);box-shadow:none">
                            <div class="provider-card-header">
                                ${logoHtml}
                                <div class="provider-card-info">
                                    <div class="provider-card-name">${name} ${item.verificado ? '✅' : ''}</div>
                                    <div class="provider-card-category">${item.categoria || 'Proveedor'} ${item.ciudad ? '· ' + item.ciudad : ''}</div>
                                </div>
                            </div>
                            <div style="margin-top:1rem; color:var(--neutral-600); font-size:0.9rem;">
                                ${item.descripcion ? (item.descripcion.substring(0, 80) + '...') : 'Proveedor de materias primas.'}
                            </div>
                            <div class="provider-actions" style="margin-top:1.5rem">
                                <a href="perfil-proveedor.html?id=${item.usuario_id}" class="btn btn-outline" style="flex:1;text-align:center">Ver Perfil</a>
                                <a href="perfil-proveedor.html?id=${item.usuario_id}" class="btn btn-primary">Contactar</a>
                            </div>
                        </div>`;
                }
            });
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get('tab');
            const qParam = urlParams.get('q');

            if (qParam) {
                document.getElementById('searchInput').value = qParam;
            }

            if (tabParam && (tabParam === 'materiales' || tabParam === 'empresas')) {
                currentTab = tabParam;
                document.querySelectorAll('.search-tab').forEach(t => {
                    if (t.textContent.toLowerCase().includes(tabParam)) t.classList.add('active');
                    else t.classList.remove('active');
                });
                document.getElementById('searchInput').placeholder = tabParam === 'materiales' ? 'Ej. Cartón, PET, Aluminio...' : 'Ej. Recicladora, EcoPlast...';
            }

            fetchResults();
        });

        document.getElementById('searchInput').addEventListener('input', triggerSearch);
        document.getElementById('verifiedOnly').addEventListener('change', triggerSearch);
        document.querySelectorAll('input[type=checkbox][value]').forEach(cb => cb.addEventListener('change', triggerSearch));