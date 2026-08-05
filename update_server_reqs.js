const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

// 1. Add schema
const schemaInjection = `            db.run(\`CREATE TABLE IF NOT EXISTS requerimientos (
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
            )\`);

            // -------------------- INDICES PARA RENDIMIENTO --------------------`;
content = content.replace("// -------------------- INDICES PARA RENDIMIENTO --------------------", schemaInjection);

// 2. Add endpoints
const endpoints = `// ===================== REQUERIMIENTOS (PIZARRÓN INVERSO) =====================

// Obtener todos los requerimientos activos (Para Proveedores)
app.get('/api/requerimientos', (req, res) => {
    db.all(\`
        SELECT r.*, u.nombre as empresa_nombre, pe.logo_url, pe.ciudad_operacion, pe.telefono_contacto 
        FROM requerimientos r
        JOIN usuarios u ON r.empresa_id = u.id
        LEFT JOIN perfiles_empresa pe ON u.id = pe.usuario_id
        WHERE r.estado = 'Activo'
        ORDER BY r.created_at DESC
    \`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Obtener requerimientos de una empresa específica
app.get('/api/requerimientos/empresa/:id', authenticateToken, (req, res) => {
    db.all(\`SELECT * FROM requerimientos WHERE empresa_id = ? ORDER BY created_at DESC\`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Crear un requerimiento
app.post('/api/requerimientos', authenticateToken, (req, res) => {
    if (req.user.id !== parseInt(req.body.empresa_id)) return res.status(403).json({ error: 'Acceso denegado' });
    const { empresa_id, titulo, cantidad, unidad, urgencia, descripcion } = req.body;
    db.run(\`INSERT INTO requerimientos (empresa_id, titulo, cantidad, unidad, urgencia, descripcion) VALUES (?,?,?,?,?,?)\`,
        [empresa_id, titulo, cantidad, unidad, urgencia, descripcion],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Requerimiento publicado' });
        }
    );
});

// Eliminar/Cerrar requerimiento
app.delete('/api/requerimientos/:id', authenticateToken, (req, res) => {
    db.get(\`SELECT empresa_id FROM requerimientos WHERE id = ?\`, [req.params.id], (err, reqRecord) => {
        if (err || !reqRecord) return res.status(404).json({ error: 'No encontrado' });
        if (req.user.id !== reqRecord.empresa_id) return res.status(403).json({ error: 'Acceso denegado' });
        
        db.run(\`DELETE FROM requerimientos WHERE id = ?\`, [req.params.id], (delErr) => {
            if (delErr) return res.status(500).json({ error: delErr.message });
            res.json({ message: 'Requerimiento eliminado' });
        });
    });
});

// ===================== START SERVER =====================`;
content = content.replace("// ===================== START SERVER =====================", endpoints);

fs.writeFileSync('server.js', content, 'utf8');
console.log('server.js updated with Requerimientos API');
