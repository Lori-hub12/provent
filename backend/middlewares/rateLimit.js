const rateLimit = require('express-rate-limit');

// Límite global: 200 requests por minuto por IP
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: { error: 'Demasiadas peticiones. Espera un momento.' },
    standardHeaders: true,
    legacyHeaders: false,
});


// Límite especial para auth: solo 10 intentos por 15 minutos
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Demasiados intentos de login. Espera 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});


module.exports = { globalLimiter, authLimiter };
