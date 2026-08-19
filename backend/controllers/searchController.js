const { dbRun, dbGet, dbAll } = require('../config/database');
const { sanitizeString } = require('../utils/validation');

exports.get_stats_categorias = async (req, res) => {

    try {
        const rows = await dbAll(`
            SELECT p.categoria as name, COUNT(u.id) as count 
            FROM perfiles_proveedor p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE u.rol = 'proveedor' AND u.activo = 1 AND p.categoria IS NOT NULL AND p.categoria != ''
            GROUP BY p.categoria
            ORDER BY count DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error in /api/stats/categorias:', error);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.get_stats = async (req, res) => {

    try {
        const row = await dbGet(`
            SELECT
                (SELECT COUNT(*) FROM usuarios WHERE rol = 'proveedor' AND activo = 1) as proveedores,
                (SELECT COUNT(*) FROM usuarios WHERE rol = 'empresa' AND activo = 1) as empresas,
                (SELECT COUNT(*) FROM materiales WHERE estado = 'Activo') as materiales,
                (SELECT COUNT(*) FROM productos WHERE estado = 'Activo') as productos,
                (SELECT COUNT(*) FROM perfiles_proveedor WHERE verificado = 1) as verificados,
                (SELECT COUNT(*) FROM requerimientos WHERE estado = 'Activo') as requerimientos_activos
        `);
        res.json(row || {});
    } catch (err) {
        res.status(500).json({ error: 'Error de DB' });
    }
};

exports.get_search = async (req, res) => {

    const q = req.query.q ? req.query.q.trim().toLowerCase() : '';
    const type = req.query.type || 'materiales';
    let locations = req.query.ubicacion ? req.query.ubicacion.split(',') : [];
    const verificados = req.query.verificados === 'true';

    // Sanitize search term
    if (q.length > 100) return res.status(400).json({ error: 'Término de búsqueda muy largo' });

    try {
        let query = '';
        let params = [];

        if (type === 'materiales') {
            query = `
                SELECT m.*, u.company as empresa_nombre, p.ciudad, p.verificado, p.logo_url, u.nombre as proveedor_nombre
                FROM materiales m
                JOIN usuarios u ON m.proveedor_id = u.id
                LEFT JOIN perfiles_proveedor p ON m.proveedor_id = p.usuario_id
                WHERE m.estado = 'Activo' AND u.activo = 1
            `;
            if (q) {
                query += ` AND (LOWER(m.nombre) LIKE ? OR LOWER(m.descripcion) LIKE ? OR LOWER(m.calidad_pureza) LIKE ?)`;
                params.push(`%${q}%`, `%${q}%`, `%${q}%`);
            }
        } else {
            query = `
                SELECT p.*, u.id as usuario_id, u.nombre as proveedor_nombre, u.email, u.company
                FROM usuarios u
                LEFT JOIN perfiles_proveedor p ON u.id = p.usuario_id
                WHERE u.rol = 'proveedor' AND u.activo = 1
            `;
            if (q) {
                query += ` AND (LOWER(u.company) LIKE ? OR LOWER(u.nombre) LIKE ? OR LOWER(p.descripcion) LIKE ? OR LOWER(p.categoria) LIKE ?)`;
                params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
        }

        if (locations.length > 0) {
            const placeholders = locations.map(() => '?').join(',');
            query += ` AND p.ciudad IN (${placeholders})`;
            params.push(...locations);
        }

        if (verificados) query += ` AND p.verificado = 1`;

        query += ` ORDER BY ${type === 'materiales' ? 'm.created_at DESC' : 'u.id DESC'} LIMIT 50`;

        const rows = await dbAll(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

