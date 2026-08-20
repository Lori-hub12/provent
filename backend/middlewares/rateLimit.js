const rateLimit = require('express-rate-limit');

// Límite global: 200 requests por minuto por IP
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: { error: 'Demasiadas peticiones. Espera un momento.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Bloqueo de 15 minutos deshabilitado a petición
const authLimiter = (req, res, next) => {
    next();
};

module.exports = { globalLimiter, authLimiter };
