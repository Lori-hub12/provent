const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// ===================== CONFIGURACIÓN =====================
const JWT_SECRET = process.env.JWT_SECRET || 'provend_secreto_super_seguro_2026';
const PORT = process.env.PORT || 3000;

// ===================== APP =====================
const app = express();

// Seguridad HTTP headers
app.use(helmet({
    contentSecurityPolicy: false, // Desactivado para compatibilidad con frontend inline
    crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// ===================== RATE LIMITING =====================
// Límite global: 200 requests por minuto por IP
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: { error: 'Demasiadas peticiones. Espera un momento.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Límite especial para auth: solo 10 intentos por 15 minutos
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Demasiados intentos de login. Espera 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

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
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máx
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (JPG, PNG, WEBP, GIF)'));
        }
    }
});

// ===================== JWT MIDDLEWARE =====================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido o expirado.' });
        req.user = user;
        next();
    });
}

// ===================== VALIDACIÓN DE INPUTS =====================
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

function sanitizeString(str, maxLen = 255) {
    if (!str) return str;
    return String(str).trim().substring(0, maxLen);
}

// ===================== BASE DE DATOS =====================
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

// ===================== NODEMAILER =====================
let transporter;
nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error('⚠️  No se pudo crear la cuenta de prueba de correo:', err.message);
        return;
    }
    transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass }
    });
    console.log('✅ Sistema de correos listo (Ethereal Email).');
});

// ===================== UPLOAD =====================
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// ===================== HEALTH CHECK =====================
app.get('/api/health', async (req, res) => {
    try {
        const row = await dbGet('SELECT COUNT(*) as usuarios FROM usuarios');
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            db: 'connected',
            usuarios: row.usuarios,
            version: '2.0.0'
        });
    } catch (err) {
        res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
    }
});

// ===================== AUTH =====================
app.post('/api/forgot-password', authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email || !validateEmail(email)) return res.status(400).json({ error: 'Proporciona un correo válido' });

    try {
        const user = await dbGet(`SELECT id, nombre FROM usuarios WHERE email = ? AND activo = 1`, [email.toLowerCase()]);
        // Por seguridad, siempre respondemos igual (no revelar si el email existe)
        if (!user) return res.json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000).toISOString();

        await dbRun(`UPDATE usuarios SET reset_token = ?, reset_token_expiry = ? WHERE id = ?`, [resetToken, expiry, user.id]);

        const resetLink = `http://localhost:${PORT}/reset-password.html?token=${resetToken}`;
        const mailOptions = {
            from: '"ProVend Soporte" <soporte@provend.ni>',
            to: email,
            subject: 'Recuperación de Contraseña - ProVend',
            html: `
                <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; background: #f8f9fa; border-radius: 12px;">
                    <h2 style="color: #1e40af;">ProVend</h2>
                    <p>Hola <strong>${user.nombre}</strong>,</p>
                    <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo:</p>
                    <a href="${resetLink}" style="display:inline-block; background:#1e40af; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; margin: 1rem 0;">Restablecer Contraseña</a>
                    <p style="color:#6b7280; font-size:0.875rem;">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.</p>
                </div>
            `
        };

        if (transporter) {
            const info = await transporter.sendMail(mailOptions);
            console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        res.json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });
    } catch (err) {
        console.error('Error forgot-password:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/reset-password', authLimiter, async (req, res) => {
    const { token, password } = req.body;
    if (!token || !validatePassword(password)) return res.status(400).json({ error: 'Datos inválidos. La contraseña debe tener al menos 6 caracteres.' });

    try {
        const user = await dbGet(`SELECT id FROM usuarios WHERE reset_token = ? AND reset_token_expiry > ?`, [token, new Date().toISOString()]);
        if (!user) return res.status(400).json({ error: 'El enlace es inválido o ha expirado.' });

        const hash = await bcrypt.hash(password, 12); // 12 rounds es más seguro
        await dbRun(`UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [hash, user.id]);
        res.json({ message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });
    } catch (err) {
        console.error('Error reset-password:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/register', authLimiter, async (req, res) => {
    const { nombre, email, password, rol, company } = req.body;

    // Validación robusta
    if (!nombre || !email || !password || !rol) return res.status(400).json({ error: 'Faltan campos obligatorios' });
    if (!validateEmail(email)) return res.status(400).json({ error: 'El correo no tiene un formato válido' });
    if (!validatePassword(password)) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    if (!['proveedor', 'empresa'].includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
    if (nombre.trim().length < 2) return res.status(400).json({ error: 'El nombre es muy corto' });

    const cleanNombre = sanitizeString(nombre, 100);
    const cleanEmail = email.toLowerCase().trim();
    const cleanCompany = sanitizeString(company || nombre, 150);

    try {
        const hash = await bcrypt.hash(password, 12);
        const result = await dbRun(
            `INSERT INTO usuarios (nombre, email, password, rol, company) VALUES (?, ?, ?, ?, ?)`,
            [cleanNombre, cleanEmail, hash, rol, cleanCompany]
        );

        const userId = result.lastID;

        if (rol === 'proveedor') {
            await dbRun(`INSERT OR IGNORE INTO perfiles_proveedor (usuario_id) VALUES (?)`, [userId]);
        } else if (rol === 'empresa') {
            await dbRun(`INSERT OR IGNORE INTO perfiles_empresa (usuario_id) VALUES (?)`, [userId]);
        }

        const token = jwt.sign({ id: userId, rol }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: { id: userId, nombre: cleanNombre, email: cleanEmail, rol, company: cleanCompany }
        });
    } catch (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Este correo ya está registrado.' });
        console.error('Error register:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Proporciona email y contraseña' });
    if (!validateEmail(email)) return res.status(400).json({ error: 'Formato de correo inválido' });

    try {
        const row = await dbGet(`SELECT * FROM usuarios WHERE email = ? AND activo = 1`, [email.toLowerCase().trim()]);
        if (!row) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

        const match = await bcrypt.compare(password, row.password);
        if (!match) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

        // Actualizar último login
        await dbRun(`UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?`, [row.id]);

        const token = jwt.sign({ id: row.id, rol: row.rol }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            message: 'Login exitoso',
            token,
            user: { id: row.id, nombre: row.nombre, email: row.email, rol: row.rol, company: row.company }
        });
    } catch (err) {
        console.error('Error login:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ===================== ESTADÍSTICAS GLOBALES =====================
app.get('/api/stats', async (req, res) => {
    try {
        const row = await dbGet(`
            SELECT
                (SELECT COUNT(*) FROM usuarios WHERE rol = 'proveedor' AND activo = 1) as proveedores,
                (SELECT COUNT(*) FROM usuarios WHERE rol = 'empresa' AND activo = 1) as empresas,
                (SELECT COUNT(*) FROM materiales WHERE estado = 'Activo') as materiales,
                (SELECT COUNT(*) FROM productos WHERE estado = 'Activo') as productos,
                (SELECT COUNT(*) FROM perfiles_proveedor WHERE verificado = 1) as verificados,
                (SELECT COUNT(*) FROM requerimientos WHERE estado = 'Activo') as requerimientos_activos
        `);
        res.json(row || {});
    } catch (err) {
        res.status(500).json({ error: 'Error de DB' });
    }
});

// ===================== PROVEEDORES =====================
app.get('/api/proveedores', async (req, res) => {
    try {
        const rows = await dbAll(`
            SELECT u.id, u.nombre, u.company, u.email,
                   p.logo_url, p.descripcion, p.ciudad, p.categoria, p.verificado, p.estado, p.tiempo_respuesta, p.whatsapp,
                   COALESCE(AVG(r.rating), 0) as rating,
                   COUNT(DISTINCT r.id) as reviews
            FROM usuarios u
            LEFT JOIN perfiles_proveedor p ON u.id = p.usuario_id
            LEFT JOIN resenas r ON u.id = r.proveedor_id
            WHERE u.rol = 'proveedor' AND u.activo = 1
            GROUP BY u.id
            ORDER BY p.verificado DESC, rating DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error de DB' });
    }
});

app.get('/api/proveedores/:id', async (req, res) => {
    try {
        const row = await dbGet(`
            SELECT u.id, u.nombre, u.company, u.email,
                   p.*,
                   COALESCE(AVG(r.rating), 0) as rating,
                   COUNT(DISTINCT r.id) as reviews,
                   COUNT(DISTINCT v.id) as visitas_total
            FROM usuarios u
            LEFT JOIN perfiles_proveedor p ON u.id = p.usuario_id
            LEFT JOIN resenas r ON u.id = r.proveedor_id
            LEFT JOIN visitas v ON u.id = v.proveedor_id
            WHERE u.id = ? AND u.rol = 'proveedor' AND u.activo = 1
            GROUP BY u.id
        `, [req.params.id]);
        if (!row) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: 'Error de DB' });
    }
});

// ===================== DASHBOARD PROVEEDOR =====================
app.get('/api/dashboard/proveedor/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const row = await dbGet(`
            SELECT
                (SELECT COUNT(*) FROM materiales WHERE proveedor_id = ? AND estado = 'Activo') as materiales,
                (SELECT COUNT(*) FROM productos WHERE proveedor_id = ? AND estado = 'Activo') as productos,
                (SELECT COUNT(*) FROM visitas WHERE proveedor_id = ?) as visitas,
                (SELECT COUNT(*) FROM resenas WHERE proveedor_id = ?) as resenas,
                (SELECT COALESCE(AVG(rating), 0) FROM resenas WHERE proveedor_id = ?) as rating,
                (SELECT COUNT(*) FROM favoritos WHERE proveedor_id = ?) as favoritos
        `, [id, id, id, id, id, id]);
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: 'Error de DB' });
    }
});

app.get('/api/dashboard/proveedor/:id/materiales', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM materiales WHERE proveedor_id = ? ORDER BY created_at DESC`, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/dashboard/proveedor/:id/productos', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM productos WHERE proveedor_id = ? ORDER BY created_at DESC`, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/dashboard/proveedor/:id/resenas', async (req, res) => {
    try {
        const rows = await dbAll(`
            SELECT r.*, u.company as empresa_nombre
            FROM resenas r
            LEFT JOIN usuarios u ON r.empresa_id = u.id
            WHERE r.proveedor_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/materiales', authenticateToken, async (req, res) => {
    if (req.user.id !== parseInt(req.body.proveedor_id)) return res.status(403).json({ error: 'Acceso denegado' });

    const { proveedor_id, nombre, cantidad, unidad, descripcion, imagen_url, precio_estimado, frecuencia_disponibilidad, calidad_pureza, volumen_minimo } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre del material es requerido' });

    try {
        const result = await dbRun(
            `INSERT INTO materiales (proveedor_id, nombre, cantidad, unidad, descripcion, imagen_url, precio_estimado, frecuencia_disponibilidad, calidad_pureza, volumen_minimo)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [proveedor_id, sanitizeString(nombre, 150), cantidad, unidad, descripcion, imagen_url, precio_estimado, frecuencia_disponibilidad, calidad_pureza, volumen_minimo]
        );
        await dbRun(`INSERT INTO notificaciones (usuario_id, tipo, mensaje) VALUES (?, 'material', ?)`,
            [proveedor_id, `Publicaste un nuevo material: ${nombre}`]);
        res.status(201).json({ id: result.lastID, message: 'Material publicado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/materiales/:id', authenticateToken, async (req, res) => {
    try {
        const material = await dbGet(`SELECT proveedor_id FROM materiales WHERE id = ?`, [req.params.id]);
        if (!material) return res.status(404).json({ error: 'Material no encontrado' });
        if (req.user.id !== material.proveedor_id) return res.status(403).json({ error: 'Acceso denegado' });

        await dbRun(`DELETE FROM materiales WHERE id = ?`, [req.params.id]);
        res.json({ message: 'Eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== DASHBOARD EMPRESA =====================
app.get('/api/dashboard/empresa/:id', authenticateToken, async (req, res) => {
    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const row = await dbGet(`
            SELECT
                (SELECT COUNT(*) FROM visitas WHERE visitante_id = ?) as proveedores_visitados,
                (SELECT COUNT(*) FROM favoritos WHERE empresa_id = ?) as favoritos,
                (SELECT COUNT(*) FROM requerimientos WHERE empresa_id = ? AND estado = 'Activo') as requerimientos_activos
        `, [req.params.id, req.params.id, req.params.id]);
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: 'Error de DB' });
    }
});

app.get('/api/dashboard/empresa/:id/favoritos', authenticateToken, async (req, res) => {
    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const rows = await dbAll(`
            SELECT u.id, u.nombre, u.company, p.logo_url, p.categoria, p.verificado,
                   COALESCE(AVG(r.rating), 0) as rating, COUNT(DISTINCT r.id) as reviews
            FROM favoritos f
            JOIN usuarios u ON f.proveedor_id = u.id
            LEFT JOIN perfiles_proveedor p ON u.id = p.usuario_id
            LEFT JOIN resenas r ON u.id = r.proveedor_id
            WHERE f.empresa_id = ?
            GROUP BY u.id
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/dashboard/empresa/:id/historial', authenticateToken, async (req, res) => {
    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const rows = await dbAll(`
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
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/usuarios/empresa/:id', authenticateToken, async (req, res) => {
    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Acceso denegado' });
    const { nombre, company } = req.body;
    if (!nombre || nombre.trim().length < 2) return res.status(400).json({ error: 'Nombre inválido' });
    try {
        const result = await dbRun(
            `UPDATE usuarios SET nombre = ?, company = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND rol = 'empresa'`,
            [sanitizeString(nombre, 100), sanitizeString(company, 150), req.params.id]
        );
        res.json({ success: true, changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== VISITAS =====================
app.post('/api/visitas', async (req, res) => {
    const { proveedor_id, visitante_id } = req.body;
    if (!proveedor_id) return res.status(400).json({ error: 'Falta proveedor_id' });
    try {
        await dbRun(`INSERT INTO visitas (proveedor_id, visitante_id) VALUES (?,?)`, [proveedor_id, visitante_id || null]);
        if (visitante_id) {
            const visitor = await dbGet(`SELECT company, nombre FROM usuarios WHERE id = ?`, [visitante_id]);
            if (visitor) {
                await dbRun(`INSERT INTO notificaciones (usuario_id, tipo, mensaje) VALUES (?, 'visita', ?)`,
                    [proveedor_id, `${visitor.company || visitor.nombre} visitó tu perfil`]);
            }
        }
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== PERFIL PROVEEDOR =====================
app.put('/api/perfiles_proveedor/:id', authenticateToken, async (req, res) => {
    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Acceso denegado' });
    const { logo_url, descripcion, ciudad, categoria, telefono, whatsapp, sitio_web, direccion, latitud, longitud, horario, certificados, capacidad_mensual_toneladas, tiene_transporte } = req.body;
    try {
        await dbRun(`
            UPDATE perfiles_proveedor SET
                logo_url = COALESCE(?, logo_url),
                descripcion = COALESCE(?, descripcion),
                ciudad = COALESCE(?, ciudad),
                categoria = COALESCE(?, categoria),
                telefono = COALESCE(?, telefono),
                whatsapp = COALESCE(?, whatsapp),
                sitio_web = COALESCE(?, sitio_web),
                direccion = COALESCE(?, direccion),
                latitud = COALESCE(?, latitud),
                longitud = COALESCE(?, longitud),
                horario = COALESCE(?, horario),
                certificados = COALESCE(?, certificados),
                capacidad_mensual_toneladas = COALESCE(?, capacidad_mensual_toneladas),
                tiene_transporte = COALESCE(?, tiene_transporte),
                updated_at = CURRENT_TIMESTAMP
            WHERE usuario_id = ?`,
            [logo_url, descripcion, ciudad, categoria, telefono, whatsapp, sitio_web, direccion, latitud, longitud, horario, certificados, capacidad_mensual_toneladas, tiene_transporte, req.params.id]
        );
        res.json({ message: 'Perfil actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== BUSCADOR DINÁMICO =====================
app.get('/api/search', async (req, res) => {
    const q = req.query.q ? req.query.q.trim().toLowerCase() : '';
    const type = req.query.type || 'materiales';
    let locations = req.query.ubicacion ? req.query.ubicacion.split(',') : [];
    const verificados = req.query.verificados === 'true';

    // Sanitize search term
    if (q.length > 100) return res.status(400).json({ error: 'Término de búsqueda muy largo' });

    try {
        let query = '';
        let params = [];

        if (type === 'materiales') {
            query = `
                SELECT m.*, u.company as empresa_nombre, p.ciudad, p.verificado, p.logo_url, u.nombre as proveedor_nombre
                FROM materiales m
                JOIN perfiles_proveedor p ON m.proveedor_id = p.usuario_id
                JOIN usuarios u ON m.proveedor_id = u.id
                WHERE m.estado = 'Activo' AND u.activo = 1
            `;
            if (q) {
                query += ` AND (LOWER(m.nombre) LIKE ? OR LOWER(m.descripcion) LIKE ? OR LOWER(m.calidad_pureza) LIKE ?)`;
                params.push(`%${q}%`, `%${q}%`, `%${q}%`);
            }
        } else {
            query = `
                SELECT p.*, u.nombre as proveedor_nombre, u.email, u.company
                FROM perfiles_proveedor p
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE u.rol = 'proveedor' AND u.activo = 1
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

        if (verificados) query += ` AND p.verificado = 1`;

        query += ` ORDER BY ${type === 'materiales' ? 'm.created_at' : 'u.created_at'} DESC LIMIT 50`;

        const rows = await dbAll(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== FAVORITOS =====================
app.post('/api/favoritos', authenticateToken, async (req, res) => {
    if (req.user.id !== parseInt(req.body.empresa_id)) return res.status(403).json({ error: 'Acceso denegado' });
    const { empresa_id, proveedor_id } = req.body;
    try {
        const result = await dbRun(`INSERT OR IGNORE INTO favoritos (empresa_id, proveedor_id) VALUES (?,?)`, [empresa_id, proveedor_id]);
        const count = await dbGet(`SELECT COUNT(*) as count FROM favoritos WHERE empresa_id = ?`, [empresa_id]);
        res.json({ added: result.changes > 0, total: count.count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/favoritos', authenticateToken, async (req, res) => {
    if (req.user.id !== parseInt(req.body.empresa_id)) return res.status(403).json({ error: 'Acceso denegado' });
    const { empresa_id, proveedor_id } = req.body;
    try {
        await dbRun(`DELETE FROM favoritos WHERE empresa_id = ? AND proveedor_id = ?`, [empresa_id, proveedor_id]);
        res.json({ removed: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== NOTIFICACIONES =====================
app.get('/api/notificaciones/:usuario_id', authenticateToken, async (req, res) => {
    if (req.user.id !== parseInt(req.params.usuario_id)) return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const rows = await dbAll(`SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 20`, [req.params.usuario_id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/notificaciones/:id/leida', authenticateToken, async (req, res) => {
    try {
        await dbRun(`UPDATE notificaciones SET leida = 1 WHERE id = ?`, [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== REQUERIMIENTOS (PIZARRÓN INVERSO) =====================
app.get('/api/requerimientos', async (req, res) => {
    try {
        const rows = await dbAll(`
            SELECT r.*, u.nombre as empresa_nombre, pe.logo_url, pe.ciudad_operacion, pe.telefono_contacto
            FROM requerimientos r
            JOIN usuarios u ON r.empresa_id = u.id
            LEFT JOIN perfiles_empresa pe ON u.id = pe.usuario_id
            WHERE r.estado = 'Activo'
            ORDER BY
                CASE r.urgencia WHEN 'Alta' THEN 1 WHEN 'Media' THEN 2 ELSE 3 END,
                r.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/requerimientos/empresa/:id', authenticateToken, async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM requerimientos WHERE empresa_id = ? ORDER BY created_at DESC`, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/requerimientos', authenticateToken, async (req, res) => {
    if (req.user.id !== parseInt(req.body.empresa_id)) return res.status(403).json({ error: 'Acceso denegado' });
    const { empresa_id, titulo, cantidad, unidad, urgencia, descripcion } = req.body;
    if (!titulo || !titulo.trim()) return res.status(400).json({ error: 'El título es requerido' });
    if (!['Alta', 'Media', 'Baja'].includes(urgencia)) return res.status(400).json({ error: 'Urgencia inválida' });

    try {
        const result = await dbRun(
            `INSERT INTO requerimientos (empresa_id, titulo, cantidad, unidad, urgencia, descripcion) VALUES (?,?,?,?,?,?)`,
            [empresa_id, sanitizeString(titulo, 200), cantidad, unidad, urgencia, descripcion]
        );
        res.json({ id: result.lastID, message: 'Requerimiento publicado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/requerimientos/:id', authenticateToken, async (req, res) => {
    try {
        const req_record = await dbGet(`SELECT empresa_id FROM requerimientos WHERE id = ?`, [req.params.id]);
        if (!req_record) return res.status(404).json({ error: 'No encontrado' });
        if (req.user.id !== req_record.empresa_id) return res.status(403).json({ error: 'Acceso denegado' });
        await dbRun(`DELETE FROM requerimientos WHERE id = ?`, [req.params.id]);
        res.json({ message: 'Requerimiento eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== RESENAS =====================
app.post('/api/resenas', authenticateToken, async (req, res) => {
    const { proveedor_id, rating, comentario } = req.body;
    if (!proveedor_id || !rating) return res.status(400).json({ error: 'Faltan campos' });
    if (req.user.rol !== 'empresa') return res.status(403).json({ error: 'Solo las empresas pueden reseñar' });
    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) return res.status(400).json({ error: 'Rating debe ser entre 1 y 5' });

    try {
        const result = await dbRun(
            `INSERT OR REPLACE INTO resenas (proveedor_id, empresa_id, rating, comentario) VALUES (?,?,?,?)`,
            [proveedor_id, req.user.id, ratingNum, sanitizeString(comentario, 1000)]
        );
        res.status(201).json({ id: result.lastID, message: 'Reseña publicada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== ADMIN MIDDLEWARE =====================
function requireAdmin(req, res, next) {
    authenticateToken(req, res, () => {
        if (req.user.rol !== 'admin') {
            return res.status(403).json({ error: 'Acceso solo para administradores.' });
        }
        next();
    });
}

// ===================== ADMIN: STATS COMPLETAS =====================
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const [totalUsuarios, totalProveedores, totalEmpresas, totalMateriales,
               verificados, pendientes, totalReseñas, totalRequerimientos] = await Promise.all([
            dbGet('SELECT COUNT(*) as c FROM usuarios WHERE activo = 1'),
            dbGet("SELECT COUNT(*) as c FROM usuarios WHERE rol = 'proveedor' AND activo = 1"),
            dbGet("SELECT COUNT(*) as c FROM usuarios WHERE rol = 'empresa' AND activo = 1"),
            dbGet('SELECT COUNT(*) as c FROM materiales WHERE estado = "activo"'),
            dbGet("SELECT COUNT(*) as c FROM perfiles_proveedor WHERE verificado = 1"),
            dbGet("SELECT COUNT(*) as c FROM perfiles_proveedor WHERE verificado = 0"),
            dbGet('SELECT COUNT(*) as c FROM resenas'),
            dbGet("SELECT COUNT(*) as c FROM requerimientos WHERE estado = 'activo'"),
        ]);
        res.json({
            totalUsuarios: totalUsuarios.c,
            totalProveedores: totalProveedores.c,
            totalEmpresas: totalEmpresas.c,
            totalMateriales: totalMateriales.c,
            verificados: verificados.c,
            pendientes: pendientes.c,
            totalReseñas: totalReseñas.c,
            totalRequerimientos: totalRequerimientos.c,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== ADMIN: LISTA DE USUARIOS =====================
app.get('/api/admin/usuarios', requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.q ? `%${req.query.q}%` : '%';

        const usuarios = await dbAll(
            `SELECT u.id, u.nombre, u.email, u.rol, u.activo, u.created_at,
                    COALESCE(pp.company, pe.company, '') as empresa
             FROM usuarios u
             LEFT JOIN perfiles_proveedor pp ON pp.usuario_id = u.id
             LEFT JOIN perfiles_empresa pe ON pe.usuario_id = u.id
             WHERE (u.nombre LIKE ? OR u.email LIKE ?)
             ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
            [search, search, limit, offset]
        );
        const total = await dbGet(
            `SELECT COUNT(*) as c FROM usuarios WHERE nombre LIKE ? OR email LIKE ?`,
            [search, search]
        );
        res.json({ usuarios, total: total.c, page, limit });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== ADMIN: LISTA DE PROVEEDORES (con verificación) =====================
app.get('/api/admin/proveedores', requireAdmin, async (req, res) => {
    try {
        const proveedores = await dbAll(
            `SELECT u.id, u.nombre, u.email, u.activo, u.created_at,
                    pp.company, pp.ciudad, pp.categoria, pp.verificado,
                    (SELECT COUNT(*) FROM materiales m WHERE m.proveedor_id = u.id) as total_materiales,
                    (SELECT COUNT(*) FROM resenas r WHERE r.proveedor_id = u.id) as total_resenas,
                    (SELECT AVG(r2.rating) FROM resenas r2 WHERE r2.proveedor_id = u.id) as rating_promedio
             FROM usuarios u
             JOIN perfiles_proveedor pp ON pp.usuario_id = u.id
             ORDER BY u.created_at DESC LIMIT 50`
        );
        res.json(proveedores);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== ADMIN: TOGGLE VERIFICACIÓN =====================
app.patch('/api/admin/proveedores/:id/verificar', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { verificado } = req.body;
        await dbRun(
            'UPDATE perfiles_proveedor SET verificado = ? WHERE usuario_id = ?',
            [verificado ? 1 : 0, id]
        );
        res.json({ success: true, verificado: !!verificado });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== ADMIN: TOGGLE USUARIO ACTIVO =====================
app.patch('/api/admin/usuarios/:id/activo', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body;
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'No puedes desactivarte a ti mismo.' });
        }
        await dbRun('UPDATE usuarios SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
        res.json({ success: true, activo: !!activo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== ADMIN: ELIMINAR USUARIO =====================
app.delete('/api/admin/usuarios/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'No puedes eliminarte a ti mismo.' });
        }
        await dbRun('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== ADMIN: ACTIVIDAD RECIENTE =====================
app.get('/api/admin/actividad', requireAdmin, async (req, res) => {
    try {
        const [recentUsers, recentMaterials, recentResenas] = await Promise.all([
            dbAll(`SELECT 'registro' as tipo, u.nombre as titulo, u.rol as detalle, u.created_at as fecha
                   FROM usuarios u ORDER BY u.created_at DESC LIMIT 5`),
            dbAll(`SELECT 'material' as tipo, m.nombre as titulo, u.nombre as detalle, m.created_at as fecha
                   FROM materiales m JOIN usuarios u ON u.id = m.proveedor_id
                   ORDER BY m.created_at DESC LIMIT 5`),
            dbAll(`SELECT 'resena' as tipo, 'Nueva reseña' as titulo,
                          CAST(r.rating AS TEXT) || ' estrellas — ' || u.nombre as detalle, r.created_at as fecha
                   FROM resenas r JOIN usuarios u ON u.id = r.empresa_id
                   ORDER BY r.created_at DESC LIMIT 5`),
        ]);
        const actividad = [...recentUsers, ...recentMaterials, ...recentResenas]
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 15);
        res.json(actividad);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================== MANEJO GLOBAL DE ERRORES =====================
app.use((err, req, res, next) => {
    console.error('❌ Error no manejado:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint no encontrado' });
    }
    res.sendFile(path.join(__dirname, '404.html'));
});

// ===================== ARRANQUE =====================
app.listen(PORT, () => {
    console.log(`🚀 Servidor ProVend en http://localhost:${PORT}`);
    console.log(`🔒 JWT + Rate Limiting + Helmet activos`);
    console.log(`💾 SQLite WAL Mode + Cache 32MB`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Cerrando servidor...');
    db.close(() => {
        console.log('Base de datos cerrada.');
        process.exit(0);
    });
});
