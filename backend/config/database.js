require('dotenv').config();
const { Pool } = require('pg');


// Determine if we should use PostgreSQL based on the presence of DATABASE_URL
const isPg = !!process.env.DATABASE_URL;

let db, pool;

if (isPg) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Supabase connecting from external environments
    });
    
    // Polyfill db.close for PG
    db = {
        close: (cb) => { 
            pool.end().then(() => { if (cb) cb(); }); 
        }
    };
} else {
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database('./database.sqlite', (err) => {
        if (err) {
            console.error('Error al conectar con SQLite:', err.message);
        }
    });
}

/**
 * Converts a SQLite query (with ?) to PostgreSQL format (with $1, $2, etc.)
 */
function convertToPg(query, params) {
    if (!params || params.length === 0) return query;
    let i = 1;
    // We only want to replace standalone ? marks, not inside quotes if possible.
    // For our simple queries, a global replace is usually fine.
    return query.replace(/\?/g, () => `$${i++}`);
}

/**
 * Executes a query that doesn't return rows (INSERT, UPDATE, DELETE).
 * Resolves with { id: lastInsertId, changes: affectedRows }
 */
const dbRun = (query, params = []) => {
    return new Promise(async (resolve, reject) => {
        if (isPg) {
            try {
                let q = convertToPg(query, params);
                // PostgreSQL doesn't return the inserted ID unless we specify RETURNING id
                const isInsert = q.trim().toUpperCase().startsWith('INSERT');
                if (isInsert && !q.toUpperCase().includes('RETURNING')) {
                    q += ' RETURNING id';
                }
                const res = await pool.query(q, params);
                resolve({ 
                    lastID: res.rows[0]?.id || 0, 
                    changes: res.rowCount 
                });
            } catch (err) {
                console.error("PG dbRun Error:", err, "Query:", query);
                reject(err);
            }
        } else {
            db.run(query, params, function (err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        }
    });
};

/**
 * Executes a query and returns a single row.
 */
const dbGet = (query, params = []) => {
    return new Promise(async (resolve, reject) => {
        if (isPg) {
            try {
                const res = await pool.query(convertToPg(query, params), params);
                resolve(res.rows[0]);
            } catch (err) {
                console.error("PG dbGet Error:", err, "Query:", query);
                reject(err);
            }
        } else {
            db.get(query, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        }
    });
};

/**
 * Executes a query and returns all matching rows.
 */
const dbAll = (query, params = []) => {
    return new Promise(async (resolve, reject) => {
        if (isPg) {
            try {
                const res = await pool.query(convertToPg(query, params), params);
                resolve(res.rows);
            } catch (err) {
                console.error("PG dbAll Error:", err, "Query:", query);
                reject(err);
            }
        } else {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }
    });
};

// INITIALIZATION
const initDB = async () => {
    if (isPg) {
        console.log('🔄 Conectado a PostgreSQL en la nube (Supabase). Inicializando tablas...');
        
        // Tablas traducidas a sintaxis PG (SERIAL PRIMARY KEY, TIMESTAMP)
        const queries = [
            `CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                rol VARCHAR(50) NOT NULL CHECK(rol IN ('proveedor', 'empresa', 'admin')),
                company VARCHAR(255),
                reset_token VARCHAR(255),
                reset_token_expiry TIMESTAMP,
                ultimo_login TIMESTAMP,
                activo INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS perfiles_empresa (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER UNIQUE NOT NULL,
                logo_url TEXT,
                rubro_industria VARCHAR(255),
                ciudad_operacion VARCHAR(255),
                telefono_contacto VARCHAR(50),
                tamano_empresa VARCHAR(100),
                sitio_web VARCHAR(255),
                descripcion TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS perfiles_proveedor (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER UNIQUE NOT NULL,
                logo_url TEXT,
                descripcion TEXT,
                ciudad VARCHAR(255),
                categoria VARCHAR(255),
                ruc VARCHAR(100),
                telefono VARCHAR(50),
                whatsapp VARCHAR(50),
                sitio_web VARCHAR(255),
                direccion TEXT,
                latitud REAL,
                longitud REAL,
                horario VARCHAR(255),
                certificados TEXT,
                cobertura VARCHAR(255),
                capacidad_mensual_toneladas VARCHAR(255),
                tiene_transporte INTEGER DEFAULT 0,
                verificado INTEGER DEFAULT 0,
                nivel_verificacion VARCHAR(100) DEFAULT 'Básico',
                tiempo_respuesta VARCHAR(100) DEFAULT '24 horas',
                estado VARCHAR(100) DEFAULT 'Disponible',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS materiales (
                id SERIAL PRIMARY KEY,
                proveedor_id INTEGER NOT NULL,
                nombre VARCHAR(255) NOT NULL,
                cantidad VARCHAR(100),
                unidad VARCHAR(50),
                descripcion TEXT,
                imagen_url TEXT,
                precio_estimado VARCHAR(100),
                frecuencia_disponibilidad VARCHAR(100),
                calidad_pureza VARCHAR(100),
                volumen_minimo VARCHAR(100),
                estado VARCHAR(50) DEFAULT 'Activo' CHECK(estado IN ('Activo', 'Inactivo', 'Agotado')),
                vistas INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS productos (
                id SERIAL PRIMARY KEY,
                proveedor_id INTEGER NOT NULL,
                nombre VARCHAR(255) NOT NULL,
                precio VARCHAR(100),
                categoria VARCHAR(100),
                descripcion TEXT,
                imagen_url TEXT,
                estado VARCHAR(50) DEFAULT 'Activo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS visitas (
                id SERIAL PRIMARY KEY,
                proveedor_id INTEGER NOT NULL,
                visitante_id INTEGER,
                ip_hash VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS favoritos (
                id SERIAL PRIMARY KEY,
                empresa_id INTEGER NOT NULL,
                proveedor_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(empresa_id, proveedor_id),
                FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS resenas (
                id SERIAL PRIMARY KEY,
                proveedor_id INTEGER NOT NULL,
                empresa_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
                comentario TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(proveedor_id, empresa_id),
                FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS notificaciones (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER NOT NULL,
                tipo VARCHAR(100) NOT NULL,
                mensaje TEXT NOT NULL,
                leida INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS requerimientos (
                id SERIAL PRIMARY KEY,
                empresa_id INTEGER NOT NULL,
                titulo VARCHAR(255) NOT NULL,
                cantidad VARCHAR(100),
                unidad VARCHAR(50),
                urgencia VARCHAR(50) DEFAULT 'Media' CHECK(urgencia IN ('Alta', 'Media', 'Baja')),
                descripcion TEXT,
                estado VARCHAR(50) DEFAULT 'Activo' CHECK(estado IN ('Activo', 'Cerrado', 'Pausado')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`,
            // Índices (la mayoría igual que SQLite)
            `CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)`,
            `CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol)`,
            `CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo)`,
            `CREATE INDEX IF NOT EXISTS idx_perfiles_categoria ON perfiles_proveedor(categoria)`,
            `CREATE INDEX IF NOT EXISTS idx_perfiles_ciudad ON perfiles_proveedor(ciudad)`,
            `CREATE INDEX IF NOT EXISTS idx_perfiles_verificado ON perfiles_proveedor(verificado)`,
            `CREATE INDEX IF NOT EXISTS idx_materiales_proveedor ON materiales(proveedor_id)`,
            `CREATE INDEX IF NOT EXISTS idx_materiales_estado ON materiales(estado)`,
            `CREATE INDEX IF NOT EXISTS idx_materiales_nombre ON materiales(nombre)`,
            `CREATE INDEX IF NOT EXISTS idx_favoritos_empresa ON favoritos(empresa_id)`,
            `CREATE INDEX IF NOT EXISTS idx_favoritos_proveedor ON favoritos(proveedor_id)`,
            `CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leida)`,
            `CREATE INDEX IF NOT EXISTS idx_visitas_proveedor ON visitas(proveedor_id)`,
            `CREATE INDEX IF NOT EXISTS idx_visitas_visitante ON visitas(visitante_id)`,
            `CREATE INDEX IF NOT EXISTS idx_requerimientos_estado ON requerimientos(estado)`,
            `CREATE INDEX IF NOT EXISTS idx_requerimientos_empresa ON requerimientos(empresa_id)`,
            `CREATE INDEX IF NOT EXISTS idx_resenas_proveedor ON resenas(proveedor_id)`,
            `CREATE TABLE IF NOT EXISTS smart_pooling_grupos (
                id SERIAL PRIMARY KEY,
                material_id INTEGER NOT NULL,
                creador_id INTEGER NOT NULL,
                cantidad_objetivo DECIMAL NOT NULL,
                unidad VARCHAR(50),
                fecha_limite TIMESTAMP,
                estado VARCHAR(50) DEFAULT 'Activo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(material_id) REFERENCES materiales(id) ON DELETE CASCADE,
                FOREIGN KEY(creador_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS smart_pooling_participantes (
                id SERIAL PRIMARY KEY,
                grupo_id INTEGER NOT NULL,
                empresa_id INTEGER NOT NULL,
                cantidad_aportada DECIMAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(grupo_id) REFERENCES smart_pooling_grupos(id) ON DELETE CASCADE,
                FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS pasaportes_digitales (
                id VARCHAR(100) PRIMARY KEY,
                proveedor_id INTEGER NOT NULL,
                empresa_id INTEGER NOT NULL,
                material_origen TEXT,
                producto_final TEXT,
                porcentaje_reciclado VARCHAR(50),
                co2_evitado VARCHAR(50),
                costo_reducido VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`
        ];

        try {
            for (let q of queries) {
                await pool.query(q);
            }
            console.log('✅ Base de datos PG inicializada correctamente.');
            
            // Recrear usuario admin si no existe
            const adminCheck = await pool.query(`SELECT id FROM usuarios WHERE email = 'admin@provend.com'`);
            if (adminCheck.rows.length === 0) {
                const bcrypt = require('bcrypt');
                const hash = await bcrypt.hash('admin123', 10);
                await pool.query(
                    `INSERT INTO usuarios (nombre, email, password, rol, activo, company) VALUES ($1, $2, $3, $4, $5, $6)`,
                    ['Administrador General', 'admin@provend.com', hash, 'admin', 1, 'ProVend Admin']
                );
                console.log('✅ Usuario admin (PG) creado automáticamente.');
            }

        } catch (err) {
            console.error('❌ Error al inicializar tablas PG:', err);
        }

    } else {
        // Inicialización de SQLite
        db.serialize(() => {
            console.log('✅ Conectado a SQLite local.');
            db.run(`PRAGMA foreign_keys = ON;`);
            db.run(`PRAGMA journal_mode = WAL;`);
            db.run(`PRAGMA synchronous = NORMAL;`);
            db.run(`PRAGMA cache_size = -64000;`);
            
            const queries = [
                `CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, rol TEXT NOT NULL CHECK(rol IN ('proveedor', 'empresa', 'admin')), company TEXT, reset_token TEXT, reset_token_expiry DATETIME, ultimo_login DATETIME, activo INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
                `CREATE TABLE IF NOT EXISTS perfiles_empresa (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER UNIQUE NOT NULL, logo_url TEXT, rubro_industria TEXT, ciudad_operacion TEXT, telefono_contacto TEXT, tamano_empresa TEXT, sitio_web TEXT, descripcion TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE)`,
                `CREATE TABLE IF NOT EXISTS perfiles_proveedor (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER UNIQUE NOT NULL, logo_url TEXT, descripcion TEXT, ciudad TEXT, categoria TEXT, ruc TEXT, telefono TEXT, whatsapp TEXT, sitio_web TEXT, direccion TEXT, latitud REAL, longitud REAL, horario TEXT, certificados TEXT, cobertura TEXT, capacidad_mensual_toneladas TEXT, tiene_transporte INTEGER DEFAULT 0, verificado INTEGER DEFAULT 0, nivel_verificacion TEXT DEFAULT 'Básico', tiempo_respuesta TEXT DEFAULT '24 horas', estado TEXT DEFAULT 'Disponible', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE)`,
                `CREATE TABLE IF NOT EXISTS materiales (id INTEGER PRIMARY KEY AUTOINCREMENT, proveedor_id INTEGER NOT NULL, nombre TEXT NOT NULL, cantidad TEXT, unidad TEXT, descripcion TEXT, imagen_url TEXT, precio_estimado TEXT, frecuencia_disponibilidad TEXT, calidad_pureza TEXT, volumen_minimo TEXT, estado TEXT DEFAULT 'Activo' CHECK(estado IN ('Activo', 'Inactivo', 'Agotado')), vistas INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE)`,
                `CREATE TABLE IF NOT EXISTS productos (id INTEGER PRIMARY KEY AUTOINCREMENT, proveedor_id INTEGER NOT NULL, nombre TEXT NOT NULL, precio TEXT, categoria TEXT, descripcion TEXT, imagen_url TEXT, estado TEXT DEFAULT 'Activo', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE)`,
                `CREATE TABLE IF NOT EXISTS visitas (id INTEGER PRIMARY KEY AUTOINCREMENT, proveedor_id INTEGER NOT NULL, visitante_id INTEGER, ip_hash TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE)`,
                `CREATE TABLE IF NOT EXISTS favoritos (id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, proveedor_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(empresa_id, proveedor_id), FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE, FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE)`,
                `CREATE TABLE IF NOT EXISTS resenas (id INTEGER PRIMARY KEY AUTOINCREMENT, proveedor_id INTEGER NOT NULL, empresa_id INTEGER NOT NULL, rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), comentario TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(proveedor_id, empresa_id), FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE, FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE)`,
                `CREATE TABLE IF NOT EXISTS notificaciones (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, tipo TEXT NOT NULL, mensaje TEXT NOT NULL, leida INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE)`,
                `CREATE TABLE IF NOT EXISTS requerimientos (id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, titulo TEXT NOT NULL, cantidad TEXT, unidad TEXT, urgencia TEXT DEFAULT 'Media' CHECK(urgencia IN ('Alta', 'Media', 'Baja')), descripcion TEXT, estado TEXT DEFAULT 'Activo' CHECK(estado IN ('Activo', 'Cerrado', 'Pausado')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE)`
            ];
            
            queries.forEach(q => db.run(q));
            console.log('✅ Tablas de SQLite inicializadas correctamente.');
        });
    }
};

initDB();

module.exports = { db, dbRun, dbGet, dbAll, isPg };
