const { dbRun, dbGet, dbAll } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET, PORT } = require('../config/env');
const { validateEmail, validatePassword, sanitizeString } = require('../utils/validation');
const { getTransporter } = require('../config/mailer');

exports.post_forgot_password = async (req, res) => {

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
};

exports.post_reset_password = async (req, res) => {

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
};

exports.post_register = async (req, res) => {

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
};

exports.post_login = async (req, res) => {

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
};

