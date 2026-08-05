const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

// 1. Add requirements
content = content.replace(
    "const jwt = require('jsonwebtoken');",
    "const jwt = require('jsonwebtoken');\nconst nodemailer = require('nodemailer');\nconst crypto = require('crypto');"
);

// 2. Update schema
content = content.replace(
    "company TEXT,\n                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,",
    "company TEXT,\n                reset_token TEXT,\n                reset_token_expiry DATETIME,\n                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,"
);

// 3. Add transporter and endpoints
const authHeader = `// ===================== AUTH =====================`;
const newAuthStuff = `// ===================== AUTH =====================

// --- Nodemailer Setup (Ethereal for testing) ---
let transporter;
nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error('Failed to create a testing account. ' + err.message);
        return;
    }
    transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass }
    });
});

app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Proporciona tu correo' });

    db.get(\`SELECT id, nombre FROM usuarios WHERE email = ?\`, [email], (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'No existe cuenta con este correo' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hora

        db.run(\`UPDATE usuarios SET reset_token = ?, reset_token_expiry = ? WHERE id = ?\`, [resetToken, expiry, user.id], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: 'Error del servidor' });

            const resetLink = \`http://localhost:3000/reset-password.html?token=\${resetToken}\`;
            
            const mailOptions = {
                from: '"ProVend Soporte" <soporte@provend.ni>',
                to: email,
                subject: 'Recuperación de Contraseña - ProVend',
                text: \`Hola \${user.nombre},\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n\${resetLink}\n\nSi no solicitaste este cambio, ignora este correo.\`,
                html: \`<p>Hola <strong>\${user.nombre}</strong>,</p><p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><p><a href="\${resetLink}">\${resetLink}</a></p><p>Si no solicitaste este cambio, ignora este correo.</p>\`
            };

            transporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) return res.status(500).json({ error: 'Error enviando correo' });
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                res.json({ message: 'Correo de recuperación enviado. Revisa la consola del servidor para el enlace de prueba.' });
            });
        });
    });
});

app.post('/api/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Faltan datos' });

    db.get(\`SELECT id FROM usuarios WHERE reset_token = ? AND reset_token_expiry > ?\`, [token, new Date().toISOString()], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'El enlace es inválido o ha expirado.' });

        const hash = await bcrypt.hash(password, 10);
        db.run(\`UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?\`, [hash, user.id], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: 'Error actualizando contraseña' });
            res.json({ message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });
        });
    });
});
`;

content = content.replace(authHeader, newAuthStuff);

fs.writeFileSync('server.js', content, 'utf8');
console.log('server.js updated with Nodemailer');
