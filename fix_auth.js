const fs = require('fs');
let code = fs.readFileSync('backend/controllers/authController.js', 'utf8');
code = code.replace(/exports\.post_reset_password[\s\S]*?exports\.post_register = async \(req, res\) => \{[\s\S]*?const cleanNombre = sanitizeString\(nombre, 100\);/g, `exports.post_reset_password = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !validatePassword(password)) return res.status(400).json({ error: 'Datos inválidos. La contraseña debe tener al menos 6 caracteres.' });

    try {
        const user = await dbGet(\`SELECT id FROM usuarios WHERE reset_token = ? AND reset_token_expiry > ?\`, [token, new Date().toISOString()]);
        if (!user) return res.status(400).json({ error: 'El enlace es inválido o ha expirado.' });

        const hash = await bcrypt.hash(password, 12); // 12 rounds es más seguro
        await dbRun(\`UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?\`, [hash, user.id]);
        res.json({ message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });
    } catch (err) {
        console.error('Error reset-password:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.post_register = async (req, res) => {
    const { nombre, email, password, rol, company } = req.body;
    if (!nombre || !email || !password || !rol) return res.status(400).json({ error: 'Faltan campos obligatorios' });
    if (!validateEmail(email)) return res.status(400).json({ error: 'El correo no tiene un formato válido' });
    if (!validatePassword(password)) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    if (!['proveedor', 'empresa'].includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
    if (nombre.trim().length < 2) return res.status(400).json({ error: 'El nombre es muy corto' });

    const cleanNombre = sanitizeString(nombre, 100);`);
fs.writeFileSync('backend/controllers/authController.js', code);
