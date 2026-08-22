require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query(`
            SELECT u.id, u.nombre, u.company, u.email,
                   p.*,
                   COALESCE(AVG(r.rating), 0) as rating,
                   COUNT(DISTINCT r.id) as reviews,
                   COUNT(DISTINCT v.id) as visitas_total
            FROM usuarios u
            LEFT JOIN perfiles_proveedor p ON u.id = p.usuario_id
            LEFT JOIN resenas r ON u.id = r.proveedor_id
            LEFT JOIN visitas v ON u.id = v.proveedor_id
            WHERE u.id = $1 AND u.rol = 'proveedor' AND u.activo = 1
            GROUP BY u.id, p.id
        `, [2])
  .then(res => console.log('Profile:', res.rows))
  .catch(err => console.error('ERROR:', err.message))
  .finally(() => pool.end());
