// Inject navbar & footer
      document.getElementById('navbar-container').innerHTML = buildNavbar('categorias');
      document.getElementById('footer-container').innerHTML = buildFooter();

      // ---- Category data with full details ----
      const allCategories = [
        {
          name: 'Tecnología',
          slug: 'tecnologia',
          count: 85,
          cat: 'tech',
          tags: ['Software', 'Cloud', 'Consultoría IT', 'Redes'],
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>'
        },
        {
          name: 'Alimentos y Bebidas',
          slug: 'alimentos',
          count: 120,
          cat: 'food',
          tags: ['Café', 'Lácteos', 'Exportación', 'Orgánicos'],
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>'
        },
        {
          name: 'Construcción',
          slug: 'construccion',
          count: 64,
          cat: 'build',
          tags: ['Materiales', 'Ferretería', 'Arquitectura', 'Diseño'],
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"></path><path d="M10 15V7a2 2 0 0 1 4 0v8"></path><path d="M5 15V9a7 7 0 0 1 14 0v6"></path></svg>'
        },
        {
          name: 'Servicios Profesionales',
          slug: 'servicios',
          count: 92,
          cat: 'services',
          tags: ['Consultoría', 'Legal', 'Contabilidad', 'Publicidad'],
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>'
        },
        {
          name: 'Manufactura',
          slug: 'manufactura',
          count: 48,
          cat: 'factory',
          tags: ['Producción', 'Maquinaria', 'Empaques', 'Industrial'],
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M17 18h1"></path><path d="M12 18h1"></path><path d="M7 18h1"></path></svg>'
        },
        {
          name: 'Textil y Confección',
          slug: 'textil',
          count: 41,
          cat: 'textile',
          tags: ['Uniformes', 'Bordados', 'Serigrafía', 'Telas'],
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>'
        },
        {
          name: 'Transporte y Logística',
          slug: 'transporte',
          count: 38,
          cat: 'transport',
          tags: ['Carga', 'Distribución', 'Almacenaje', 'Envíos'],
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 3h15v13H1z"></path><path d="M16 8h4l3 3v5h-7V8z"></path><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>'
        },
        {
          name: 'Salud y Bienestar',
          slug: 'salud',
          count: 37,
          cat: 'health',
          tags: ['Equipos Médicos', 'Farmacia', 'Insumos', 'Laboratorio'],
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"></path></svg>'
        },
        {
          name: 'Agricultura',
          slug: 'agricultura',
          count: 95,
          cat: 'agro',
          tags: ['Agroinsumos', 'Fertilizantes', 'Semillas', 'Riego'],
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 20h10"></path><path d="M10 20c5.5-2.5.8-6.4 3-10"></path><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"></path><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"></path></svg>'
        },
        {
          name: 'Energía y Medio Ambiente',
          slug: 'energia',
          count: 27,
          cat: 'energy',
          tags: ['Solar', 'Eólica', 'Reciclaje', 'Consultoría Ambiental'],
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
        }
      ];

      // ---- Render main category grid ----
      const grid = document.getElementById('cat-grid');
      const arrowSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>';

      grid.innerHTML = allCategories.map((cat, i) => `
        <a href="explorar.html?category=${cat.slug}" class="cat-card fade-in" data-cat="${cat.cat}" style="animation-delay:${i * 0.05}s">
          <div class="cat-icon">${cat.icon}</div>
          <div class="cat-info">
            <div class="cat-name">${cat.name}</div>
            <div class="cat-tags">
              ${cat.tags.map(t => `<span class="cat-tag">${t}</span>`).join('')}
            </div>
          </div>
          <div class="cat-arrow">${arrowSVG}</div>
        </a>
      `).join('');

      // ---- Render featured categories (dark section) ----
      const featuredGrid = document.getElementById('featured-cats-grid');
      const topCats = [...allCategories].sort((a, b) => b.count - a.count).slice(0, 5);

      featuredGrid.innerHTML = topCats.map(cat => `
        <a href="explorar.html?category=${cat.slug}" class="featured-cat-item">
          ${cat.icon}
          <span>${cat.name}</span>
        </a>
      `).join('');

      
      // Inject real counts into allCategories dynamically
      fetch(API_BASE + '/api/stats/categorias')
        .then(res => res.json())
        .then(data => {
            const catMap = {};
            data.forEach(d => { catMap[d.name.toLowerCase()] = d.count; });
            
            allCategories.forEach(cat => {
                const realCount = catMap[cat.name.toLowerCase()] || 0;
                cat.count = realCount;
            });
            
            // Re-render
            grid.innerHTML = allCategories.map((cat, i) => `
              <a href="explorar.html?category=${cat.slug}" class="cat-card fade-in" data-cat="${cat.cat}" style="animation-delay:${i * 0.05}s">
                <div class="cat-icon">${cat.icon}</div>
                <div class="cat-info">
                  <div class="cat-name">${cat.name} <span style="font-size:0.8rem; color:var(--neutral-500); font-weight:normal">(${cat.count} proveedores)</span></div>
                  <div class="cat-tags">
                    ${cat.tags.map(t => `<span class="cat-tag">${t}</span>`).join('')}
                  </div>
                </div>
                <div class="cat-arrow">${arrowSVG}</div>
              </a>
            `).join('');
            
            const topCats = [...allCategories].sort((a, b) => b.count - a.count).slice(0, 5);
            featuredGrid.innerHTML = topCats.map(cat => `
              <a href="explorar.html?category=${cat.slug}" class="featured-cat-item">
                ${cat.icon}
                <span>${cat.name} (${cat.count})</span>
              </a>
            `).join('');
        }).catch(e => console.error('Error fetching categories stats', e));

      // Fetch real stats
      fetch(`${API_BASE}/api/stats`)
        .then(res => res.json())
        .then(stats => {
          if(stats.proveedores > 0 || stats.empresas > 0) {
            document.getElementById('real-stats').style.display = 'flex';
            document.getElementById('stat-categorias').textContent = '10'; // We currently have 10 hardcoded categories
            document.getElementById('stat-proveedores').textContent = stats.proveedores || 0;
            document.getElementById('stat-empresas').textContent = stats.empresas || 0;
          }
        })
        .catch(err => console.error('Error cargando stats:', err));
    