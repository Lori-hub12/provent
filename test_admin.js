require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
Promise.all([
    pool.query('SELECT COUNT(*) as c FROM usuarios WHERE activo = 1'),
    pool.query("SELECT COUNT(*) as c FROM usuarios WHERE rol = 'proveedor' AND activo = 1"),
    pool.query("SELECT COUNT(*) as c FROM usuarios WHERE rol = 'empresa' AND activo = 1"),
    pool.query("SELECT COUNT(*) as c FROM materiales WHERE estado = 'Activo'"),
    pool.query("SELECT COUNT(*) as c FROM perfiles_proveedor WHERE verificado = 1"),
    pool.query("SELECT COUNT(*) as c FROM perfiles_proveedor WHERE verificado = 0"),
    pool.query('SELECT COUNT(*) as c FROM resenas'),
    pool.query("SELECT COUNT(*) as c FROM requerimientos WHERE estado = 'Activo'"),
]).then(res => console.log('OK'))
  .catch(err => console.error('ERROR:', err.message))
  .finally(() => pool.end());
