const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    console.log('Aplicando migraciones...');

    // Nuevas columnas en usuarios
    const queries = [
        "ALTER TABLE usuarios ADD COLUMN activo INTEGER DEFAULT 1",
        "ALTER TABLE usuarios ADD COLUMN ultimo_login DATETIME",
        // resenas: agregar restriccion UNIQUE no se puede en SQLite con ALTER, pero sí agregar columnas faltantes
        // perfiles_empresa nuevas columnas
        "ALTER TABLE perfiles_empresa ADD COLUMN sitio_web TEXT",
        "ALTER TABLE perfiles_empresa ADD COLUMN descripcion TEXT",
        "ALTER TABLE perfiles_empresa ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP",
        // materiales nueva columna
        "ALTER TABLE materiales ADD COLUMN vistas INTEGER DEFAULT 0",
        // visitas nueva columna
        "ALTER TABLE visitas ADD COLUMN ip_hash TEXT",
        // requerimientos columna updated_at
        "ALTER TABLE requerimientos ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP",
    ];

    queries.forEach(q => {
        db.run(q, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error:', q, '->', err.message);
            } else {
                console.log('OK:', q.substring(0, 60));
            }
        });
    });

    // Nuevos índices
    const indexes = [
        "CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)",
        "CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo)",
        "CREATE INDEX IF NOT EXISTS idx_materiales_nombre ON materiales(nombre)",
        "CREATE INDEX IF NOT EXISTS idx_materiales_estado ON materiales(estado)",
        "CREATE INDEX IF NOT EXISTS idx_favoritos_proveedor ON favoritos(proveedor_id)",
        "CREATE INDEX IF NOT EXISTS idx_visitas_proveedor ON visitas(proveedor_id)",
        "CREATE INDEX IF NOT EXISTS idx_visitas_visitante ON visitas(visitante_id)",
        "CREATE INDEX IF NOT EXISTS idx_requerimientos_estado ON requerimientos(estado)",
        "CREATE INDEX IF NOT EXISTS idx_requerimientos_empresa ON requerimientos(empresa_id)",
        "CREATE INDEX IF NOT EXISTS idx_resenas_proveedor ON resenas(proveedor_id)",
        "CREATE INDEX IF NOT EXISTS idx_perfiles_ciudad ON perfiles_proveedor(ciudad)",
        "CREATE INDEX IF NOT EXISTS idx_perfiles_verificado ON perfiles_proveedor(verificado)",
    ];

    indexes.forEach(q => {
        db.run(q, (err) => {
            if (err) console.error('Index error:', err.message);
            else console.log('Index OK:', q.substring(0, 60));
        });
    });

    // Activar WAL mode
    db.run("PRAGMA journal_mode = WAL", (err) => {
        if (err) console.error('WAL error:', err.message);
        else console.log('WAL Mode activado.');
    });
});

setTimeout(() => {
    db.close(() => console.log('Migración finalizada.'));
}, 2000);
