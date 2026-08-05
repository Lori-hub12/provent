const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    console.log('Migrando base de datos para Oportunidades...');

    db.run(`CREATE TABLE IF NOT EXISTS requerimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa_id INTEGER,
        titulo TEXT,
        cantidad TEXT,
        unidad TEXT,
        urgencia TEXT,
        descripcion TEXT,
        estado TEXT DEFAULT 'Activo',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) console.error('Error:', err.message);
        else console.log('Tabla requerimientos creada exitosamente.');
    });
});

setTimeout(() => {
    db.close();
    console.log('Migración finalizada.');
}, 1000);
