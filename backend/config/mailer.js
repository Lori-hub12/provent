const nodemailer = require('nodemailer');

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


module.exports = {
    getTransporter: () => transporter
};
