/* ============================================
   ProVend — app.js
   Main application initialization
   ============================================ */

// ---- Demo Data: Providers ----
const providers = [
  {
    id: 1,
    name: 'TechNica Solutions',
    initials: 'TS',
    category: 'Tecnología',
    tags: ['Software', 'Cloud', 'Consultoría'],
    location: 'Managua, Nicaragua',
    rating: 4.8,
    reviews: 127,
    verified: true,
    description: 'Empresa líder en desarrollo de software empresarial y soluciones cloud para empresas en crecimiento en Nicaragua y Centroamérica.',
    whatsapp: '+50588001234',
    email: 'info@technica.com.ni',
    website: 'https://technica.com.ni',
    certifications: ['ISO 9001', 'Microsoft Partner', 'AWS Partner'],
    products: ['ERP Empresarial', 'App Móvil Custom', 'Cloud Migration', 'Soporte IT']
  },
  {
    id: 2,
    name: 'Café Don Bosco',
    initials: 'CB',
    category: 'Alimentos y Bebidas',
    tags: ['Café', 'Exportación', 'Orgánico'],
    location: 'Matagalpa, Nicaragua',
    rating: 4.9,
    reviews: 89,
    verified: true,
    description: 'Producción y exportación de café de especialidad orgánico, cultivado en las montañas de Matagalpa con prácticas sostenibles.',
    whatsapp: '+50577002345',
    email: 'ventas@cafedonbosco.ni',
    website: 'https://cafedonbosco.ni',
    certifications: ['Orgánico Certificado', 'Fair Trade', 'Rainforest Alliance'],
    products: ['Café Orgánico Premium', 'Café Molido', 'Café en Grano', 'Cold Brew']
  },
  {
    id: 3,
    name: 'Construcciones del Norte',
    initials: 'CN',
    category: 'Construcción',
    tags: ['Construcción', 'Infraestructura', 'Diseño'],
    location: 'Estelí, Nicaragua',
    rating: 4.7,
    reviews: 64,
    verified: true,
    description: 'Constructora con más de 15 años de experiencia en proyectos residenciales, comerciales e industriales en el norte de Nicaragua.',
    whatsapp: '+50576003456',
    email: 'proyectos@construcnorte.ni',
    website: 'https://construcnorte.ni',
    certifications: ['Licencia INVUR', 'ISO 14001'],
    products: ['Construcción Residencial', 'Remodelación', 'Diseño Arquitectónico', 'Consultoría']
  },
  {
    id: 4,
    name: 'Textiles Centroamérica',
    initials: 'TC',
    category: 'Textil y Confección',
    tags: ['Textil', 'Uniformes', 'Confección'],
    location: 'Masaya, Nicaragua',
    rating: 4.6,
    reviews: 52,
    verified: false,
    description: 'Fabricación de uniformes corporativos, ropa de trabajo y textiles personalizados para empresas de toda Centroamérica.',
    whatsapp: '+50578004567',
    email: 'pedidos@textilesca.ni',
    website: '',
    certifications: [],
    products: ['Uniformes Corporativos', 'Ropa de Trabajo', 'Bordados', 'Serigrafía']
  },
  {
    id: 5,
    name: 'TransLogística NI',
    initials: 'TL',
    category: 'Transporte y Logística',
    tags: ['Transporte', 'Logística', 'Distribución'],
    location: 'Managua, Nicaragua',
    rating: 4.5,
    reviews: 73,
    verified: true,
    description: 'Servicios de transporte de carga, logística y distribución a nivel nacional e internacional con flota propia.',
    whatsapp: '+50589005678',
    email: 'operaciones@translogni.com',
    website: 'https://translogni.com',
    certifications: ['ISO 9001', 'BASC'],
    products: ['Transporte Nacional', 'Carga Internacional', 'Almacenamiento', 'Distribución Urbana']
  },
  {
    id: 6,
    name: 'AgroInsumos León',
    initials: 'AL',
    category: 'Agricultura',
    tags: ['Agroinsumos', 'Fertilizantes', 'Semillas'],
    location: 'León, Nicaragua',
    rating: 4.8,
    reviews: 95,
    verified: true,
    description: 'Distribuidora de insumos agrícolas, fertilizantes, semillas certificadas y equipos para el sector agropecuario nicaragüense.',
    whatsapp: '+50586006789',
    email: 'ventas@agroinsumos.ni',
    website: 'https://agroinsumos.ni',
    certifications: ['Distribuidor Autorizado', 'MAGFOR'],
    products: ['Fertilizantes', 'Semillas Certificadas', 'Herbicidas', 'Equipos de Riego']
  },
  {
    id: 7,
    name: 'Soluciones Gráficas',
    initials: 'SG',
    category: 'Servicios Profesionales',
    tags: ['Diseño', 'Publicidad', 'Imprenta'],
    location: 'Managua, Nicaragua',
    rating: 4.4,
    reviews: 38,
    verified: false,
    description: 'Agencia de diseño gráfico, publicidad y servicios de impresión de alta calidad para empresas y eventos.',
    whatsapp: '+50587007890',
    email: 'hola@solucionesgraficas.ni',
    website: '',
    certifications: [],
    products: ['Diseño de Marca', 'Material POP', 'Impresión Digital', 'Señalización']
  },
  {
    id: 8,
    name: 'Ferretería Nacional',
    initials: 'FN',
    category: 'Construcción',
    tags: ['Ferretería', 'Materiales', 'Herramientas'],
    location: 'Granada, Nicaragua',
    rating: 4.7,
    reviews: 112,
    verified: true,
    description: 'Distribuidora de materiales de construcción, herramientas y ferretería en general con entregas a todo el país.',
    whatsapp: '+50575008901',
    email: 'ventas@ferreterianacional.ni',
    website: 'https://ferreterianacional.ni',
    certifications: ['Distribuidor Oficial'],
    products: ['Cemento y Bloques', 'Herramientas Eléctricas', 'Pinturas', 'Plomería y Electricidad']
  },
  {
    id: 9,
    name: 'CliniSalud Integral',
    initials: 'CI',
    category: 'Salud y Bienestar',
    tags: ['Salud', 'Equipos Médicos', 'Insumos'],
    location: 'Managua, Nicaragua',
    rating: 4.9,
    reviews: 67,
    verified: true,
    description: 'Proveedor de equipos médicos, insumos hospitalarios y soluciones integrales para clínicas y hospitales en Nicaragua.',
    whatsapp: '+50588009012',
    email: 'ventas@clinisalud.ni',
    website: 'https://clinisalud.ni',
    certifications: ['FDA Approved', 'Registro Sanitario MINSA'],
    products: ['Equipos de Diagnóstico', 'Insumos Hospitalarios', 'Mobiliario Clínico', 'Esterilización']
  }
];

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
  const starsHTML = generateStars(provider.rating);
  const verifiedBadge = provider.verified 
    ? `<span class="badge-verified">${icons.shieldCheck} Verificado</span>` 
    : '';
  
  const tagsHTML = provider.tags.map(tag => 
    `<span class="tag tag-primary">${tag}</span>`
  ).join('');

  return `
  <a href="perfil-proveedor.html?id=${provider.id}" class="provider-card" id="provider-${provider.id}">
    <div class="provider-card-header">
      <div class="provider-card-logo">${provider.initials}</div>
      <div class="provider-card-info">
        <div class="provider-card-name">
          ${provider.name}
          ${verifiedBadge}
        </div>
        <div class="provider-card-category">${provider.category}</div>
        <div class="provider-card-location">
          ${icons.mapPin}
          ${provider.location}
        </div>
      </div>
    </div>
    <p class="provider-card-description line-clamp-2">${provider.description}</p>
    <div class="provider-card-tags">${tagsHTML}</div>
    <div class="provider-card-footer">
      <div class="rating-display">
        ${starsHTML}
        <span class="rating-value">${provider.rating}</span>
        <span class="rating-count">(${provider.reviews})</span>
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

// ---- Render Functions ----
function renderProviderCards(containerId, list = providers, limit = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const data = limit ? list.slice(0, limit) : list;
  container.innerHTML = data.map(p => generateProviderCard(p)).join('');
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
