const { dbRun, dbAll, isPg } = require('./backend/config/database');

async function migrate() {
    console.log('Running migrations...');
    if (isPg) {
        const queries = [
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
        
        for (let q of queries) {
            try {
                await dbRun(q);
                console.log('Query executed successfully');
            } catch (e) {
                console.error('Error executing query:', e);
            }
        }
        console.log('Postgres migrations completed.');
    } else {
        console.log('Database is not Postgres! Not applying PG migrations.');
    }
    
    // We should also patch database.js so these exist next time it initializes
    const fs = require('fs');
    let dbJs = fs.readFileSync('./backend/config/database.js', 'utf8');
    
    const pgHook = "CREATE INDEX IF NOT EXISTS idx_resenas_proveedor ON resenas(proveedor_id)`";
    const pgAppend = `,\n            \`CREATE TABLE IF NOT EXISTS smart_pooling_grupos (
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
            )\`,
            \`CREATE TABLE IF NOT EXISTS smart_pooling_participantes (
                id SERIAL PRIMARY KEY,
                grupo_id INTEGER NOT NULL,
                empresa_id INTEGER NOT NULL,
                cantidad_aportada DECIMAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(grupo_id) REFERENCES smart_pooling_grupos(id) ON DELETE CASCADE,
                FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )\`,
            \`CREATE TABLE IF NOT EXISTS pasaportes_digitales (
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
            )\``;
            
    if (dbJs.includes(pgHook) && !dbJs.includes('smart_pooling_grupos')) {
        dbJs = dbJs.replace(pgHook, pgHook + pgAppend);
        fs.writeFileSync('./backend/config/database.js', dbJs);
        console.log('database.js patched with new PG tables.');
    } else {
        console.log('Could not patch database.js or already patched.');
    }
    process.exit(0);
}

migrate();
