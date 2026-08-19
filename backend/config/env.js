const process = require('process');

const JWT_SECRET = process.env.JWT_SECRET || 'provend_secreto_super_seguro_2026';
const PORT = process.env.PORT || 3000;

module.exports = {
    JWT_SECRET,
    PORT
};
