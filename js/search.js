/* ============================================
   ProVend — search.js
   Search, filter and sort functionality
   ============================================ */

function initSearch() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  
  if (searchInput) {
    let debounceTimer;
    
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        performSearch(searchInput.value);
      }, 300);
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch(searchInput.value);
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const input = document.getElementById('search-input');
      if (input) performSearch(input.value);
    });
  }
}

function performSearch(query) {
  const resultsContainer = document.getElementById('search-results');
  if (!resultsContainer) {
    // If on home page, redirect to explore
    if (query.trim()) {
      window.location.href = `explorar.html?q=${encodeURIComponent(query.trim())}`;
    }
    return;
  }

  const filters = getActiveFilters();
  let results = window.ProVend.providers;

  // Text search
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.location.toLowerCase().includes(q)
    );
  }

  // Category filter
  if (filters.categories.length > 0) {
    results = results.filter(p =>
      filters.categories.some(c => p.category.toLowerCase().includes(c.toLowerCase()))
    );
  }

  // Location filter
  if (filters.locations.length > 0) {
    results = results.filter(p =>
      filters.locations.some(l => p.location.toLowerCase().includes(l.toLowerCase()))
    );
  }

  // Rating filter
  if (filters.minRating > 0) {
    results = results.filter(p => p.rating >= filters.minRating);
  }

  // Verified only
  if (filters.verifiedOnly) {
    results = results.filter(p => p.verified);
  }

  // Sort
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    const sortBy = sortSelect.value;
    switch (sortBy) {
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        results.sort((a, b) => b.reviews - a.reviews);
        break;
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // relevance — keep default order
        break;
    }
  }

  // Update count
  const countEl = document.getElementById('results-count');
  if (countEl) {
    countEl.innerHTML = `<strong>${results.length}</strong> proveedores encontrados`;
  }

  // Render results
  resultsContainer.innerHTML = results.length > 0
    ? results.map(p => window.ProVend.generateProviderCard(p)).join('')
    : `<div class="empty-state">
        <div class="empty-state-icon">${icons.search}</div>
        <h3 class="empty-state-title">No se encontraron resultados</h3>
        <p class="empty-state-text">Intenta con otros términos de búsqueda o ajusta los filtros.</p>
       </div>`;
}

function getActiveFilters() {
  const filters = {
    categories: [],
    locations: [],
    minRating: 0,
    verifiedOnly: false
  };

  // Category checkboxes
  document.querySelectorAll('.filter-category:checked').forEach(cb => {
    filters.categories.push(cb.value);
  });

  // Location checkboxes
  document.querySelectorAll('.filter-location:checked').forEach(cb => {
    filters.locations.push(cb.value);
  });

  // Rating
  const ratingSelect = document.getElementById('filter-rating');
  if (ratingSelect) {
    filters.minRating = parseFloat(ratingSelect.value) || 0;
  }

  // Verified
  const verifiedCb = document.getElementById('filter-verified');
  if (verifiedCb) {
    filters.verifiedOnly = verifiedCb.checked;
  }

  return filters;
}

function initFilters() {
  // Listen for filter changes
  document.querySelectorAll('.filter-category, .filter-location, #filter-verified').forEach(el => {
    el.addEventListener('change', () => {
      const input = document.getElementById('search-input');
      performSearch(input ? input.value : '');
    });
  });

  const ratingSelect = document.getElementById('filter-rating');
  if (ratingSelect) {
    ratingSelect.addEventListener('change', () => {
      const input = document.getElementById('search-input');
      performSearch(input ? input.value : '');
    });
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const input = document.getElementById('search-input');
      performSearch(input ? input.value : '');
    });
  }
}

// ---- Hero Search (Home Page) ----
function initHeroSearch() {
  const heroInput = document.getElementById('hero-search-input');
  const heroBtn = document.getElementById('hero-search-btn');

  if (heroInput && heroBtn) {
    heroBtn.addEventListener('click', () => {
      const q = heroInput.value.trim();
      if (q) {
        window.location.href = `explorar.html?q=${encodeURIComponent(q)}`;
      }
    });

    heroInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const q = heroInput.value.trim();
        if (q) {
          window.location.href = `explorar.html?q=${encodeURIComponent(q)}`;
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  initFilters();
  initHeroSearch();

  // Pre-fill search from URL
  const urlQuery = new URLSearchParams(window.location.search).get('q');
  if (urlQuery) {
    const input = document.getElementById('search-input');
    if (input) {
      input.value = urlQuery;
      performSearch(urlQuery);
    }
  }

  // Pre-select category from URL
  const urlCategory = new URLSearchParams(window.location.search).get('category');
  if (urlCategory) {
    const cb = document.querySelector(`.filter-category[value="${urlCategory}"]`);
    if (cb) {
      cb.checked = true;
      performSearch('');
    }
  }
});
