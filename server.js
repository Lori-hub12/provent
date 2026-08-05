const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ===================== MULTER (SUBIDA DE ARCHIVOS) =====================
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// ===================== BASE DE DATOS =====================
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error abriendo base de datos', err.message);
    } else {
        console.log('✅ Conectado a SQLite.');
        db.serialize(() => {
            // Habilitar Foreign Keys en SQLite
            db.run(`PRAGMA foreign_keys = ON;`);

            // Usuarios
            db.run(`CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT,
                email TEXT UNIQUE,
                password TEXT,
                rol TEXT,
                company TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Perfiles de proveedor
            db.run(`CREATE TABLE IF NOT EXISTS perfiles_proveedor (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER UNIQUE,
                logo_url TEXT,
                descripcion TEXT,
                ciudad TEXT,
                categoria TEXT,
                ruc TEXT,
                telefono TEXT,
                whatsapp TEXT,
                sitio_web TEXT,
                horario TEXT,
                cobertura TEXT,
                verificado INTEGER DEFAULT 0,
                nivel_verificacion TEXT DEFAULT 'Básico',
                tiempo_respuesta TEXT DEFAULT '24 horas',
                estado TEXT DEFAULT 'Disponible',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`);

            // Materiales del proveedor
            db.run(`CREATE TABLE IF NOT EXISTS materiales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                proveedor_id INTEGER,
                nombre TEXT,
                cantidad TEXT,
                unidad TEXT,
                descripcion TEXT,
                imagen_url TEXT,
                estado TEXT DEFAULT 'Activo',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`);

            // Productos del proveedor
            db.run(`CREATE TABLE IF NOT EXISTS productos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                proveedor_id INTEGER,
                nombre TEXT,
                precio TEXT,
                categoria TEXT,
                descripcion TEXT,
                imagen_url TEXT,
                estado TEXT DEFAULT 'Activo',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`);

            // Visitas a perfiles
            db.run(`CREATE TABLE IF NOT EXISTS visitas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                proveedor_id INTEGER,
                visitante_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`);

            // Favoritos
            db.run(`CREATE TABLE IF NOT EXISTS favoritos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                empresa_id INTEGER,
                proveedor_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(empresa_id, proveedor_id),
                FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`);

            // Reseñas
            db.run(`CREATE TABLE IF NOT EXISTS resenas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                proveedor_id INTEGER,
                empresa_id INTEGER,
                rating INTEGER,
                comentario TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`);

            // Notificaciones
            db.run(`CREATE TABLE IF NOT EXISTS notificaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                tipo TEXT,
                mensaje TEXT,
                leida INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`);

            // -------------------- INDICES PARA RENDIMIENTO --------------------
            db.run(`CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_perfiles_categoria ON perfiles_proveedor(categoria);`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_materiales_proveedor ON materiales(proveedor_id);`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_favoritos_empresa ON favoritos(empresa_id);`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leida);`);
        });
    }
});

// Servir frontend
app.use(express.static(path.join(__dirname, '')));

// ===================== AUTH =====================
app.post('/api/register', async (req, res) => {
    const { nombre, email, password, rol, company } = req.body;
    if (!email || !password || !rol) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO usuarios (nombre, email, password, rol, company) VALUES (?, ?, ?, ?, ?)`,
            [nombre, email, hash, rol, company || nombre],
            function(err) {
                if (err) return res.status(400).json({ error: 'El correo ya está registrado.' });

                const userId = this.lastID;

                // Si es proveedor, crear perfil vacío
                if (rol === 'proveedor') {
                    db.run(`INSERT INTO perfiles_proveedor (usuario_id) VALUES (?)`, [userId]);
                }

                res.status(201).json({
                    message: 'Usuario registrado exitosamente',
                    user: { id: userId, nombre, email, rol, company: company || nombre }
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Proporciona email y contraseña' });

    db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], async (err, row) => {
        if (err) return res.status(500).json({ error: 'Error interno' });
        if (!row) return res.status(401).json({ error: 'Correo no encontrado' });

        const match = await bcrypt.compare(password, row.password);
        if (match) {
            res.json({
                message: 'Login exitoso',
                user: { id: row.id, nombre: row.nombre, email: row.email, rol: row.rol, company: row.company }
            });
        } else {
            res.status(401).json({ error: 'Contraseña incorrecta' });
        }
    });
});

// ===================== ESTADÍSTICAS GLOBALES (para Landing) =====================
app.get('/api/stats', (req, res) => {
    db.all(`
        SELECT
            (SELECT COUNT(*) FROM usuarios WHERE rol = 'proveedor') as proveedores,
            (SELECT COUNT(*) FROM usuarios WHERE rol = 'empresa') as empresas,
            (SELECT COUNT(*) FROM materiales WHERE estado = 'Activo') as materiales,
            (SELECT COUNT(*) FROM productos WHERE estado = 'Activo') as productos,
            (SELECT COUNT(*) FROM perfiles_proveedor WHERE verificado = 1) as verificados
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error de DB' });
        res.json(rows[0] || { proveedores: 0, empresas: 0, materiales: 0, productos: 0, verificados: 0 });
    });
});

// ===================== PROVEEDORES =====================
app.get('/api/proveedores', (req, res) => {
    db.all(`
        SELECT u.id, u.nombre, u.company, u.email,
               p.logo_url, p.descripcion, p.ciudad, p.categoria, p.verificado, p.estado, p.tiempo_respuesta, p.whatsapp,
               COALESCE(AVG(r.rating), 0) as rating,
               COUNT(DISTINCT r.id) as reviews
        FROM usuarios u
        LEFT JOIN perfiles_proveedor p ON u.id = p.usuario_id
        LEFT JOIN resenas r ON u.id = r.proveedor_id
        WHERE u.rol = 'proveedor'
        GROUP BY u.id
        ORDER BY p.verificado DESC, rating DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error de DB' });
        res.json(rows);
    });
});

app.get('/api/proveedores/:id', (req, res) => {
    const { id } = req.params;
    db.get(`
        SELECT u.id, u.nombre, u.company, u.email,
               p.*, 
               COALESCE(AVG(r.rating), 0) as rating,
               COUNT(DISTINCT r.id) as reviews,
               COUNT(DISTINCT v.id) as visitas_total
        FROM usuarios u
        LEFT JOIN perfiles_proveedor p ON u.id = p.usuario_id
        LEFT JOIN resenas r ON u.id = r.proveedor_id
        LEFT JOIN visitas v ON u.id = v.proveedor_id
        WHERE u.id = ? AND u.rol = 'proveedor'
        GROUP BY u.id
    `, [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Error de DB' });
        if (!row) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json(row);
    });
});

// ===================== DASHBOARD PROVEEDOR =====================
app.get('/api/dashboard/proveedor/:id', (req, res) => {
    const { id } = req.params;
    db.get(`
        SELECT
            (SELECT COUNT(*) FROM materiales WHERE proveedor_id = ? AND estado = 'Activo') as materiales,
            (SELECT COUNT(*) FROM productos WHERE proveedor_id = ? AND estado = 'Activo') as productos,
            (SELECT COUNT(*) FROM visitas WHERE proveedor_id = ?) as visitas,
            (SELECT COUNT(*) FROM resenas WHERE proveedor_id = ?) as resenas,
            (SELECT COALESCE(AVG(rating), 0) FROM resenas WHERE proveedor_id = ?) as rating,
            (SELECT COUNT(*) FROM favoritos WHERE proveedor_id = ?) as favoritos
    `, [id, id, id, id, id, id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Error de DB' });
        res.json(row);
    });
});

app.get('/api/dashboard/proveedor/:id/materiales', (req, res) => {
    db.all(`SELECT * FROM materiales WHERE proveedor_id = ? ORDER BY created_at DESC`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/dashboard/proveedor/:id/productos', (req, res) => {
    db.all(`SELECT * FROM productos WHERE proveedor_id = ? ORDER BY created_at DESC`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/dashboard/proveedor/:id/resenas', (req, res) => {
    db.all(`
        SELECT r.*, u.company as empresa_nombre
        FROM resenas r
        LEFT JOIN usuarios u ON r.empresa_id = u.id
        WHERE r.proveedor_id = ?
        ORDER BY r.created_at DESC
    `, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/materiales', (req, res) => {
    const { proveedor_id, nombre, cantidad, unidad, descripcion, imagen_url } = req.body;
    db.run(`INSERT INTO materiales (proveedor_id, nombre, cantidad, unidad, descripcion, imagen_url) VALUES (?,?,?,?,?,?)`,
        [proveedor_id, nombre, cantidad, unidad, descripcion, imagen_url],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            // Notificar
            db.run(`INSERT INTO notificaciones (usuario_id, tipo, mensaje) VALUES (?, 'material', ?)`,
                [proveedor_id, `Publicaste un nuevo material: ${nombre}`]);
            res.status(201).json({ id: this.lastID, message: 'Material publicado' });
        }
    );
});

app.delete('/api/materiales/:id', (req, res) => {
    db.run(`DELETE FROM materiales WHERE id = ?`, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Eliminado' });
    });
});

// ===================== DASHBOARD EMPRESA =====================
app.get('/api/dashboard/empresa/:id', (req, res) => {
    const { id } = req.params;
    db.get(`
        SELECT
            (SELECT COUNT(*) FROM visitas WHERE visitante_id = ?) as proveedores_visitados,
            (SELECT COUNT(*) FROM favoritos WHERE empresa_id = ?) as favoritos
    `, [id, id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Error de DB' });
        res.json(row);
    });
});

app.get('/api/dashboard/empresa/:id/favoritos', (req, res) => {
    db.all(`
        SELECT u.id, u.nombre, u.company, p.logo_url, p.categoria, p.verificado,
               COALESCE(AVG(r.rating), 0) as rating, COUNT(DISTINCT r.id) as reviews
        FROM favoritos f
        JOIN usuarios u ON f.proveedor_id = u.id
        LEFT JOIN perfiles_proveedor p ON u.id = p.usuario_id
        LEFT JOIN resenas r ON u.id = r.proveedor_id
        WHERE f.empresa_id = ?
        GROUP BY u.id
    `, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/dashboard/empresa/:id/historial', (req, res) => {
    db.all(`
        SELECT u.id, u.nombre, u.company, p.logo_url, p.categoria, p.verificado, MAX(v.created_at) as last_visited,
               COALESCE(AVG(r.rating), 0) as rating, COUNT(DISTINCT r.id) as reviews
        FROM visitas v
        JOIN usuarios u ON v.proveedor_id = u.id
        LEFT JOIN perfiles_proveedor p ON u.id = p.usuario_id
        LEFT JOIN resenas r ON u.id = r.proveedor_id
        WHERE v.visitante_id = ?
        GROUP BY u.id
        ORDER BY last_visited DESC
        LIMIT 10
    `, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.put('/api/usuarios/empresa/:id', (req, res) => {
    const { nombre, company } = req.body;
    db.run(
        `UPDATE usuarios SET nombre = ?, company = ? WHERE id = ? AND rol = 'empresa'`,
        [nombre, company, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, changes: this.changes });
        }
    );
});

// ===================== VISITAS =====================
app.post('/api/visitas', (req, res) => {
    const { proveedor_id, visitante_id } = req.body;
    if (!proveedor_id) return res.status(400).json({ error: 'Falta proveedor_id' });
    db.run(`INSERT INTO visitas (proveedor_id, visitante_id) VALUES (?,?)`, [proveedor_id, visitante_id || null], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        // Notificar al proveedor
        if (visitante_id) {
            db.get(`SELECT company, nombre FROM usuarios WHERE id = ?`, [visitante_id], (e, visitor) => {
                if (visitor) {
                    db.run(`INSERT INTO notificaciones (usuario_id, tipo, mensaje) VALUES (?, 'visita', ?)`,
                        [proveedor_id, `${visitor.company || visitor.nombre} visitó tu perfil`]);
                }
            });
        }
        res.json({ ok: true });
    });
});

app.put('/api/perfiles_proveedor/:id', (req, res) => {
    const { logo_url, descripcion, ciudad, categoria, telefono, whatsapp, sitio_web } = req.body;
    db.run(`UPDATE perfiles_proveedor SET 
            logo_url = COALESCE(?, logo_url),
            descripcion = COALESCE(?, descripcion),
            ciudad = COALESCE(?, ciudad),
            categoria = COALESCE(?, categoria),
            telefono = COALESCE(?, telefono),
            whatsapp = COALESCE(?, whatsapp),
            sitio_web = COALESCE(?, sitio_web),
            updated_at = CURRENT_TIMESTAMP
            WHERE usuario_id = ?`,
        [logo_url, descripcion, ciudad, categoria, telefono, whatsapp, sitio_web, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Perfil actualizado' });
        }
    );
});

// ===================== BUSCADOR DINÁMICO =====================
app.get('/api/search', (req, res) => {
    const q = req.query.q ? req.query.q.trim().toLowerCase() : '';
    const type = req.query.type || 'materiales';
    let locations = req.query.ubicacion ? req.query.ubicacion.split(',') : [];
    const verificados = req.query.verificados === 'true';

    let query = '';
    let params = [];

    if (type === 'materiales') {
        query = `
            SELECT m.*, u.company as empresa_nombre, p.ciudad, p.verificado, p.logo_url, u.nombre as proveedor_nombre 
            FROM materiales m 
            JOIN perfiles_proveedor p ON m.proveedor_id = p.usuario_id 
            JOIN usuarios u ON m.proveedor_id = u.id
            WHERE m.estado = 'Activo'
        `;
        
        if (q) {
            query += ` AND (LOWER(m.nombre) LIKE ? OR LOWER(m.descripcion) LIKE ?)`;
            params.push(`%${q}%`, `%${q}%`);
        }
    } else {
        query = `
            SELECT p.*, u.nombre as proveedor_nombre, u.email, u.company 
            FROM perfiles_proveedor p 
            JOIN usuarios u ON p.usuario_id = u.id 
            WHERE u.rol = 'proveedor'
        `;
        
        if (q) {
            query += ` AND (LOWER(u.company) LIKE ? OR LOWER(u.nombre) LIKE ? OR LOWER(p.descripcion) LIKE ? OR LOWER(p.categoria) LIKE ?)`;
            params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
        }
    }

    if (locations.length > 0) {
        const placeholders = locations.map(() => '?').join(',');
        query += ` AND p.ciudad IN (${placeholders})`;
        params.push(...locations);
    }

    if (verificados) {
        query += ` AND p.verificado = 1`;
    }

    // Ordenar por fecha de creación (los más recientes primero)
    query += ` ORDER BY ${type === 'materiales' ? 'm.created_at' : 'u.created_at'} DESC LIMIT 50`;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ===================== FAVORITOS =====================
app.post('/api/favoritos', (req, res) => {
    const { empresa_id, proveedor_id } = req.body;
    db.run(`INSERT OR IGNORE INTO favoritos (empresa_id, proveedor_id) VALUES (?,?)`, [empresa_id, proveedor_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const added = this.changes > 0;
        db.get(`SELECT COUNT(*) as count FROM favoritos WHERE empresa_id = ?`, [empresa_id], (err2, row) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ added, total: row.count });
        });
    });
});

app.delete('/api/favoritos', (req, res) => {
    const { empresa_id, proveedor_id } = req.body;
    db.run(`DELETE FROM favoritos WHERE empresa_id = ? AND proveedor_id = ?`, [empresa_id, proveedor_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ removed: true });
    });
});

// ===================== NOTIFICACIONES =====================
app.get('/api/notificaciones/:usuario_id', (req, res) => {
    db.all(`SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 20`, [req.params.usuario_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.patch('/api/notificaciones/:id/leida', (req, res) => {
    db.run(`UPDATE notificaciones SET leida = 1 WHERE id = ?`, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ok: true });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor ProVend en http://localhost:${PORT}`);
});
