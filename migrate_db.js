const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    console.log('Iniciando migración de base de datos...');

    // 1. Agregar columnas a materiales
    const columnasMateriales = [
        "ALTER TABLE materiales ADD COLUMN precio_estimado TEXT",
        "ALTER TABLE materiales ADD COLUMN frecuencia_disponibilidad TEXT",
        "ALTER TABLE materiales ADD COLUMN calidad_pureza TEXT",
        "ALTER TABLE materiales ADD COLUMN volumen_minimo TEXT"
    ];

    columnasMateriales.forEach(query => {
        db.run(query, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error en materiales:', err.message);
            } else {
                console.log('OK (o ya existe) en materiales');
            }
        });
    });

    // 2. Agregar columnas a perfiles_proveedor
    const columnasProveedor = [
        "ALTER TABLE perfiles_proveedor ADD COLUMN capacidad_mensual_toneladas TEXT",
        "ALTER TABLE perfiles_proveedor ADD COLUMN tiene_transporte INTEGER DEFAULT 0"
    ];

    columnasProveedor.forEach(query => {
        db.run(query, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error en perfiles_proveedor:', err.message);
            } else {
                console.log('OK (o ya existe) en perfiles_proveedor');
            }
        });
    });

    // 3. Crear tabla perfiles_empresa
    db.run(`CREATE TABLE IF NOT EXISTS perfiles_empresa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER UNIQUE,
        logo_url TEXT,
        rubro_industria TEXT,
        ciudad_operacion TEXT,
        telefono_contacto TEXT,
        tamano_empresa TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) console.error('Error al crear perfiles_empresa:', err.message);
        else console.log('Tabla perfiles_empresa OK');
    });
    
    // Migrar usuarios empresa existentes a la tabla nueva si no existen
    db.run(`INSERT OR IGNORE INTO perfiles_empresa (usuario_id) 
            SELECT id FROM usuarios WHERE rol = 'empresa'`, 
        (err) => {
            if (err) console.error('Error migrando empresas existentes:', err.message);
            else console.log('Migración de empresas existentes OK');
    });
});

// Cerramos tras un par de segundos
setTimeout(() => {
    db.close();
    console.log('Migración finalizada.');
}, 2000);
