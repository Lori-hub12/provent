/* ============================================
   ProVend — app.js
   Main application initialization
   ============================================ */

// ---- Demo Data: Providers ----
const providers = [];

// ---- Demo Data: Categories ----
const categories = [
  { name: 'Tecnología', icon: 'monitor', count: 45, slug: 'tecnologia' },
  { name: 'Alimentos y Bebidas', icon: 'utensils', count: 78, slug: 'alimentos' },
  { name: 'Construcción', icon: 'hardHat', count: 56, slug: 'construccion' },
  { name: 'Servicios Profesionales', icon: 'briefcase', count: 92, slug: 'servicios' },
  { name: 'Manufactura', icon: 'factory', count: 34, slug: 'manufactura' },
  { name: 'Textil y Confección', icon: 'scissors', count: 41, slug: 'textil' },
  { name: 'Transporte y Logística', icon: 'truck', count: 29, slug: 'transporte' },
  { name: 'Salud y Bienestar', icon: 'heartPulse', count: 37, slug: 'salud' },
];

// ---- Demo Data: Reviews ----
const reviews = [
  {
    author: 'María López',
    company: 'Distribuidora El Sol',
    rating: 5,
    date: 'Hace 2 semanas',
    text: 'Excelente servicio y calidad de productos. La entrega fue puntual y el equipo de atención al cliente fue muy profesional. Totalmente recomendado.'
  },
  {
    author: 'Carlos Mendoza',
    company: 'Importadora del Pacífico',
    rating: 5,
    date: 'Hace 1 mes',
    text: 'Llevamos 3 años trabajando juntos y siempre han cumplido con los estándares más altos. Su plataforma de pedidos en línea es muy fácil de usar.'
  },
  {
    author: 'Ana Gutiérrez',
    company: 'Restaurantes Don Julio',
    rating: 4,
    date: 'Hace 1 mes',
    text: 'Buenos productos y precios competitivos. La comunicación por WhatsApp es rápida y eficiente. Mejoraría la variedad del catálogo.'
  },
  {
    author: 'Roberto Vega',
    company: 'Hotel Las Brumas',
    rating: 5,
    date: 'Hace 2 meses',
    text: 'ProVend nos ayudó a encontrar exactamente el proveedor que necesitábamos. La verificación del perfil nos dio mucha confianza para hacer el primer contacto.'
  }
];

// ---- Demo Data: Testimonials ----
const testimonials = [
  {
    name: 'Laura Martínez',
    role: 'CEO, Distribuidora Nacional',
    text: 'ProVend transformó la forma en que encontramos proveedores. Antes pasábamos días buscando en redes sociales, ahora en minutos tenemos opciones verificadas.',
    rating: 5
  },
  {
    name: 'Fernando Ruiz',
    role: 'Gerente de Compras, Hotel Selva Negra',
    text: 'La plataforma nos permite comparar proveedores de forma rápida y confiable. El sistema de verificación es clave para tomar decisiones seguras.',
    rating: 5
  },
  {
    name: 'Patricia Gómez',
    role: 'Fundadora, Café Artesanal Nica',
    text: 'Como proveedora, ProVend me ha conectado con más de 50 nuevos clientes en solo 6 meses. Es la mejor inversión que he hecho para mi negocio.',
    rating: 5
  },
  {
    name: 'Diego Hernández',
    role: 'Director, Constructora HN',
    text: 'Encontrar materiales de calidad a buen precio era un desafío. Con ProVend comparamos proveedores verificados en minutos.',
    rating: 4
  },
  {
    name: 'Sofía Calderón',
    role: 'Gerente, Importadora del Valle',
    text: 'Excelente plataforma para MIPYMES. La interfaz es intuitiva y el directorio de proveedores es muy completo para Nicaragua.',
    rating: 5
  },
  {
    name: 'Marcos Rivera',
    role: 'Propietario, Ferretería Central',
    text: 'Desde que registré mi negocio en ProVend, mis consultas por WhatsApp se triplicaron. Es como tener una vitrina digital 24/7.',
    rating: 5
  }
];

// ---- Generate Provider Card HTML ----
function generateProviderCard(provider) {
  const pName = provider.company || provider.nombre || 'Proveedor';
  const pCat = provider.categoria || 'Variedad';
  const pLoc = provider.ciudad || 'Nicaragua';
  const pInitials = pName.substring(0, 2).toUpperCase();
  const starsHTML = generateStars(provider.rating || 0);
  
  const verifiedBadge = provider.verificado 
    ? `<span class="badge-verified">${icons.shieldCheck} Verificado</span>` 
    : '';
  
  return `
  <a href="perfil-proveedor.html?id=${provider.id}" class="provider-card" id="provider-${provider.id}">
    <div class="provider-card-header">
      <div class="provider-card-logo" style="background:var(--primary-100); color:var(--primary-700);">${pInitials}</div>
      <div class="provider-card-info">
        <div class="provider-card-name">
          ${pName}
          ${verifiedBadge}
        </div>
        <div class="provider-card-category">${pCat}</div>
        <div class="provider-card-location">
          ${icons.mapPin}
          ${pLoc}
        </div>
      </div>
    </div>
    <p class="provider-card-description line-clamp-2">${provider.descripcion || 'Sin descripción disponible.'}</p>
    <div class="provider-card-tags"></div>
    <div class="provider-card-footer">
      <div class="rating-display">
        ${starsHTML}
        <span class="rating-value">${Number(provider.rating || 0).toFixed(1)}</span>
        <span class="rating-count">(${provider.reviews || 0})</span>
      </div>
    </div>
  </a>`;
}

// ---- Generate Category Card HTML ----
function generateCategoryCard(category) {
  const iconSVG = icons[category.icon] || icons.package;
  return `
  <a href="explorar.html?category=${category.slug}" class="category-card fade-in" id="category-${category.slug}">
    <div class="category-card-icon">${iconSVG}</div>
    <span class="category-card-name">${category.name}</span>
  </a>`;
}

async function renderProviderCards(containerId, limit = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  try {
    const res = await fetch(`${API_BASE}/api/proveedores`);
    if (!res.ok) throw new Error('Error fetching providers');
    const list = await res.json();
    const data = limit ? list.slice(0, limit) : list;
    container.innerHTML = data.map(p => generateProviderCard(p)).join('');
  } catch (err) {
    console.error('Failed to load real providers:', err);
    container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 2rem;">No se pudieron cargar los proveedores.</div>';
  }
}

function renderCategoryCards(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = categories.map(c => generateCategoryCard(c)).join('');
}

// ---- URL Params Helper ----
function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// ---- Get Provider by ID ----
function getProviderById(id) {
  return providers.find(p => p.id === parseInt(id, 10));
}

// ---- Make data globally accessible ----
window.ProVend = {
  providers,
  categories,
  reviews,
  testimonials,
  generateProviderCard,
  generateCategoryCard,
  renderProviderCards,
  renderCategoryCards,
  getUrlParam,
  getProviderById,
  generateStars,
  showToast,
  icons,
  getLogoSVG,
  buildNavbar,
  buildFooter
};
