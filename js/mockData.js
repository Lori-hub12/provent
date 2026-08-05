/* ============================================
   ProVend — mockData.js
   Base de datos simulada en memoria para el MVP
   ============================================ */

const MOCK_DATA = {
    // ---- DATOS DE LA EMPRESA (Dashboard Empresa) ----
    proveedores: [
        {
            id: 1,
            nombre: "Recicladora Managua S.A.",
            logo: "https://ui-avatars.com/api/?name=Recicladora+Managua&background=0D8ABC&color=fff",
            ciudad: "Managua",
            categoria: "Reciclaje",
            rating: 4.8,
            reviews: 124,
            verificado: true,
            descripcion: "Especialistas en recolección y procesamiento de plásticos y cartón a nivel industrial.",
            materiales: ["PET", "Cartón", "HDPE"],
            estado: "Disponible",
            tiempoRespuesta: "Menos de 2 horas",
            ultimaActividad: "Hace 1 hora",
            horario: "Lunes a Viernes (8am - 5pm)",
            experiencia: "15 años",
            cobertura: "Nacional"
        },
        {
            id: 2,
            nombre: "EcoPlast Nicaragua",
            logo: "https://ui-avatars.com/api/?name=EcoPlast&background=27ae60&color=fff",
            ciudad: "Masaya",
            categoria: "Plásticos",
            rating: 4.5,
            reviews: 89,
            verificado: true,
            descripcion: "Producción de empaques sostenibles y compra de plásticos post-consumo.",
            materiales: ["HDPE", "PP", "PET"],
            estado: "Ocupado",
            tiempoRespuesta: "24 horas",
            ultimaActividad: "Hace 1 día",
            horario: "Lunes a Sábado (8am - 12pm)",
            experiencia: "8 años",
            cobertura: "Pacífico Sur"
        },
        {
            id: 3,
            nombre: "Metales y Derivados",
            logo: "https://ui-avatars.com/api/?name=Metales+y+Derivados&background=e67e22&color=fff",
            ciudad: "León",
            categoria: "Metales",
            rating: 4.9,
            reviews: 210,
            verificado: true,
            descripcion: "Compra y venta de chatarra, aluminio, cobre y bronce.",
            materiales: ["Aluminio", "Cobre", "Hierro"],
            estado: "Disponible",
            tiempoRespuesta: "Inmediato",
            ultimaActividad: "En línea ahora",
            horario: "Lunes a Viernes (7am - 4pm)",
            experiencia: "25 años",
            cobertura: "Occidente"
        }
    ],
    materialesPopulares: ["PET", "Cartón", "HDPE", "Vidrio", "Aluminio", "Cobre"],
    actividadReciente: [
        { tipo: 'visita', texto: 'Visitaste "Recicladora Managua"', tiempo: 'hace 2 horas' },
        { tipo: 'favorito', texto: 'Agregaste "PET Industrial" a favoritos', tiempo: 'hace 5 horas' },
        { tipo: 'busqueda', texto: 'Buscaste "Cartón"', tiempo: 'ayer' }
    ],

    // ---- DATOS DEL PROVEEDOR (Dashboard Proveedor) ----
    proveedorMetrics: {
        productos: 4,
        materiales: 12,
        visitas: 1234,
        contactos: 89,
        rating: 4.8,
        verificacion: "Proveedor Oro"
    },
    
    feedProveedor: [
        { icono: '👀', texto: 'Empresa Distribuidora El Sol visitó tu perfil.', tiempo: 'Hace 10 min' },
        { icono: '⭐', texto: 'Nueva reseña recibida de Importadora del Pacífico.', tiempo: 'Hace 2 horas' },
        { icono: '❤️', texto: 'EcoTech te agregó a sus favoritos.', tiempo: 'Hace 5 horas' },
        { icono: '✏️', texto: 'Perfil actualizado exitosamente.', tiempo: 'Ayer' },
        { icono: '📦', texto: 'Producto "Lámina PET" publicado.', tiempo: 'Hace 2 días' }
    ],

    inventarioMateriales: [
        { id: 1, imagen: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=64&h=64', nombre: 'PET Molido Transparente', cantidad: '500', unidad: 'kg', estado: 'Activo' },
        { id: 2, imagen: 'https://images.unsplash.com/photo-1587327903256-2265e7080ea0?auto=format&fit=crop&w=64&h=64', nombre: 'Cartón Corrugado Prensado', cantidad: '2.5', unidad: 'toneladas', estado: 'Activo' },
        { id: 3, imagen: 'https://images.unsplash.com/photo-1558611997-6cb5db74fb5b?auto=format&fit=crop&w=64&h=64', nombre: 'Aluminio de Lata', cantidad: '150', unidad: 'kg', estado: 'Inactivo' }
    ],

    inventarioProductos: [
        { id: 1, imagen: 'https://images.unsplash.com/photo-1528297506728-9533d2ac3fa4?auto=format&fit=crop&w=64&h=64', nombre: 'Lámina de Plástico Reciclado', precio: '$15.00', categoria: 'Construcción', estado: 'Activo' },
        { id: 2, imagen: 'https://images.unsplash.com/photo-1620645607629-923cb118a8b1?auto=format&fit=crop&w=64&h=64', nombre: 'Mueble Ecológico (Silla)', precio: '$45.00', categoria: 'Mobiliario', estado: 'Activo' }
    ]
};

// Funciones globales de acceso
window.ProVendData = {
    getProveedores: () => MOCK_DATA.proveedores,
    getMaterialesPopulares: () => MOCK_DATA.materialesPopulares,
    getActividadReciente: () => MOCK_DATA.actividadReciente,
    getProveedorById: (id) => MOCK_DATA.proveedores.find(p => p.id === parseInt(id)),
    
    // Métodos para Dashboard Proveedor
    getProveedorMetrics: () => MOCK_DATA.proveedorMetrics,
    getFeedProveedor: () => MOCK_DATA.feedProveedor,
    getInventarioMateriales: () => MOCK_DATA.inventarioMateriales,
    getInventarioProductos: () => MOCK_DATA.inventarioProductos
};
