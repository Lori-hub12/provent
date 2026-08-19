const { dbRun, dbGet, dbAll } = require('../config/database');
const { sanitizeString } = require('../utils/validation');

exports.get_dashboard_empresa__id = async (req, res) => {

    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const row = await dbGet(`
            SELECT
                (SELECT COUNT(*) FROM visitas WHERE visitante_id = ?) as proveedores_visitados,
                (SELECT COUNT(*) FROM favoritos WHERE empresa_id = ?) as favoritos,
                (SELECT COUNT(*) FROM requerimientos WHERE empresa_id = ? AND estado = 'Activo') as requerimientos_activos
        `, [req.params.id, req.params.id, req.params.id]);
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: 'Error de DB' });
    }
};

exports.get_dashboard_empresa__id_favoritos = async (req, res) => {

    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const rows = await dbAll(`
            SELECT u.id, u.nombre, u.company, p.logo_url, p.categoria, p.verificado,
                   COALESCE(AVG(r.rating), 0) as rating, COUNT(DISTINCT r.id) as reviews
            FROM favoritos f
            JOIN usuarios u ON f.proveedor_id = u.id
            LEFT JOIN perfiles_proveedor p ON u.id = p.usuario_id
            LEFT JOIN resenas r ON u.id = r.proveedor_id
            WHERE f.empresa_id = ?
            GROUP BY u.id
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.get_dashboard_empresa__id_historial = async (req, res) => {

    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const rows = await dbAll(`
            SELECT u.id, u.nombre, u.company, p.logo_url, p.categoria, p.verificado, MAX(v.created_at) as last_visited,
                   COALESCE(AVG(r.rating), 0) as rating, COUNT(DISTINCT r.id) as reviews
            FROM visitas v
            JOIN usuarios u ON v.proveedor_id = u.id
            LEFT JOIN perfiles_proveedor p ON u.id = p.usuario_id
            LEFT JOIN resenas r ON u.id = r.proveedor_id
            WHERE v.visitante_id = ?
            GROUP BY u.id
            ORDER BY last_visited DESC
            LIMIT 10
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.put_usuarios_empresa__id = async (req, res) => {

    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Acceso denegado' });
    const { nombre, company } = req.body;
    if (!nombre || nombre.trim().length < 2) return res.status(400).json({ error: 'Nombre inválido' });
    try {
        const result = await dbRun(
            `UPDATE usuarios SET nombre = ?, company = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND rol = 'empresa'`,
            [sanitizeString(nombre, 100), sanitizeString(company, 150), req.params.id]
        );
        res.json({ success: true, changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

