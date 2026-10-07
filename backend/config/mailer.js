/**
 * Correo saliente.
 * - Con SMTP_HOST (+ SMTP_USER, SMTP_PASS, SMTP_FROM) envía correos REALES.
 * - Sin eso usa una cuenta de pruebas Ethereal (los correos NO llegan a ninguna bandeja real).
 */
const nodemailer = require('nodemailer');

let transporter = null;
let usingTestAccount = false;

const ready = (async () => {
    try {
        if (process.env.SMTP_HOST) {
            const port = Number(process.env.SMTP_PORT || 587);
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port,
                secure: process.env.SMTP_SECURE === 'true' || port === 465,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            });
            console.log('✅ Correo SMTP real configurado (' + process.env.SMTP_HOST + ').');
        } else {
            const account = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: account.smtp.host,
                port: account.smtp.port,
                secure: account.smtp.secure,
                auth: { user: account.user, pass: account.pass }
            });
            usingTestAccount = true;
            console.log('⚠️  Correo en modo PRUEBA (Ethereal). Configura SMTP_HOST para enviar correos reales.');
        }
    } catch (err) {
        console.error('⚠️  No se pudo iniciar el sistema de correo:', err.message);
    }
})();

async function sendMail(options) {
    await ready;
    if (!transporter) throw new Error('Sistema de correo no disponible');
    const info = await transporter.sendMail({ ...options, from: process.env.SMTP_FROM || options.from });
    return { info, previewUrl: usingTestAccount ? nodemailer.getTestMessageUrl(info) : null };
}

module.exports = {
    sendMail,
    getTransporter: () => transporter,
    isRealMail: () => !!transporter && !usingTestAccount
};
