const sqlite3 = require('sqlite3').verbose();
const process = require('process');


const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('❌ Error abriendo base de datos:', err.message);
        process.exit(1); // Si no hay DB, el servidor no tiene sentido correr
    }
    console.log('✅ Conectado a SQLite.');
    initDB();
});

// Helper: query con promesas (elimina callback hell)
function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

function initDB() {
    db.serialize(() => {
        // ========= PRAGMA DE RENDIMIENTO =========
        db.run(`PRAGMA foreign_keys = ON;`);
        db.run(`PRAGMA journal_mode = WAL;`);       // Write-Ahead Logging: escrituras más rápidas
        db.run(`PRAGMA synchronous = NORMAL;`);     // Balance seguridad/rendimiento
        db.run(`PRAGMA cache_size = -32000;`);      // 32MB de caché en RAM
        db.run(`PRAGMA temp_store = MEMORY;`);      // Tablas temporales en RAM
        db.run(`PRAGMA mmap_size = 268435456;`);    // 256MB de memory-mapped I/O

        // ========= TABLAS =========
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            rol TEXT NOT NULL CHECK(rol IN ('proveedor', 'empresa', 'admin')),
            company TEXT,
            reset_token TEXT,
            reset_token_expiry DATETIME,
            ultimo_login DATETIME,
            activo INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS perfiles_empresa (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER UNIQUE NOT NULL,
            logo_url TEXT,
            rubro_industria TEXT,
            ciudad_operacion TEXT,
            telefono_contacto TEXT,
            tamano_empresa TEXT,
            sitio_web TEXT,
            descripcion TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS perfiles_proveedor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER UNIQUE NOT NULL,
            logo_url TEXT,
            descripcion TEXT,
            ciudad TEXT,
            categoria TEXT,
            ruc TEXT,
            telefono TEXT,
            whatsapp TEXT,
            sitio_web TEXT,
            direccion TEXT,
            latitud REAL,
            longitud REAL,
            horario TEXT,
            certificados TEXT,
            cobertura TEXT,
            capacidad_mensual_toneladas TEXT,
            tiene_transporte INTEGER DEFAULT 0,
            verificado INTEGER DEFAULT 0,
            nivel_verificacion TEXT DEFAULT 'Básico',
            tiempo_respuesta TEXT DEFAULT '24 horas',
            estado TEXT DEFAULT 'Disponible',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS materiales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proveedor_id INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            cantidad TEXT,
            unidad TEXT,
            descripcion TEXT,
            imagen_url TEXT,
            precio_estimado TEXT,
            frecuencia_disponibilidad TEXT,
            calidad_pureza TEXT,
            volumen_minimo TEXT,
            estado TEXT DEFAULT 'Activo' CHECK(estado IN ('Activo', 'Inactivo', 'Agotado')),
            vistas INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS productos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proveedor_id INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            precio TEXT,
            categoria TEXT,
            descripcion TEXT,
            imagen_url TEXT,
            estado TEXT DEFAULT 'Activo',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS visitas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proveedor_id INTEGER NOT NULL,
            visitante_id INTEGER,
            ip_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS favoritos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa_id INTEGER NOT NULL,
            proveedor_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(empresa_id, proveedor_id),
            FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS resenas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proveedor_id INTEGER NOT NULL,
            empresa_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
            comentario TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(proveedor_id, empresa_id),
            FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS notificaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            mensaje TEXT NOT NULL,
            leida INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS requerimientos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa_id INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            cantidad TEXT,
            unidad TEXT,
            urgencia TEXT DEFAULT 'Media' CHECK(urgencia IN ('Alta', 'Media', 'Baja')),
            descripcion TEXT,
            estado TEXT DEFAULT 'Activo' CHECK(estado IN ('Activo', 'Cerrado', 'Pausado')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )`);

        // ========= ÍNDICES PARA RENDIMIENTO =========
        db.run(`CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_perfiles_categoria ON perfiles_proveedor(categoria);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_perfiles_ciudad ON perfiles_proveedor(ciudad);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_perfiles_verificado ON perfiles_proveedor(verificado);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_materiales_proveedor ON materiales(proveedor_id);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_materiales_estado ON materiales(estado);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_materiales_nombre ON materiales(nombre);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_favoritos_empresa ON favoritos(empresa_id);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_favoritos_proveedor ON favoritos(proveedor_id);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leida);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_visitas_proveedor ON visitas(proveedor_id);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_visitas_visitante ON visitas(visitante_id);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_requerimientos_estado ON requerimientos(estado);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_requerimientos_empresa ON requerimientos(empresa_id);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_resenas_proveedor ON resenas(proveedor_id);`);

        console.log('✅ Base de datos inicializada correctamente.');
    });
}



module.exports = { db, dbRun, dbGet, dbAll };
