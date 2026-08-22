const { dbRun, dbGet, dbAll } = require('../config/database');
const { sanitizeString } = require('../utils/validation');

exports.get_admin_stats = async (req, res) => {

    try {
        const [totalUsuarios, totalProveedores, totalEmpresas, totalMateriales,
               verificados, pendientes, totalReseñas, totalRequerimientos] = await Promise.all([
            dbGet('SELECT COUNT(*) as c FROM usuarios WHERE activo = 1'),
            dbGet("SELECT COUNT(*) as c FROM usuarios WHERE rol = 'proveedor' AND activo = 1"),
            dbGet("SELECT COUNT(*) as c FROM usuarios WHERE rol = 'empresa' AND activo = 1"),
            dbGet('SELECT COUNT(*) as c FROM materiales WHERE estado = "activo"'),
            dbGet("SELECT COUNT(*) as c FROM perfiles_proveedor WHERE verificado = 1"),
            dbGet("SELECT COUNT(*) as c FROM perfiles_proveedor WHERE verificado = 0"),
            dbGet('SELECT COUNT(*) as c FROM resenas'),
            dbGet("SELECT COUNT(*) as c FROM requerimientos WHERE estado = 'activo'"),
        ]);
        res.json({
            totalUsuarios: totalUsuarios.c,
            totalProveedores: totalProveedores.c,
            totalEmpresas: totalEmpresas.c,
            totalMateriales: totalMateriales.c,
            verificados: verificados.c,
            pendientes: pendientes.c,
            totalReseñas: totalReseñas.c,
            totalRequerimientos: totalRequerimientos.c,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.get_admin_usuarios = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.q ? `%${req.query.q}%` : '%';

        const usuarios = await dbAll(
            `SELECT u.id, u.nombre, u.email, u.rol, u.activo, u.created_at,
                    COALESCE(u.company, '') as empresa
             FROM usuarios u
             WHERE (u.nombre LIKE ? OR u.email LIKE ?)
             ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
            [search, search, limit, offset]
        );
        const total = await dbGet(
            `SELECT COUNT(*) as c FROM usuarios WHERE nombre LIKE ? OR email LIKE ?`,
            [search, search]
        );
        res.json({ usuarios, total: total.c, page, limit });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.get_admin_proveedores = async (req, res) => {
    try {
        const proveedores = await dbAll(
            `SELECT u.id, u.nombre, u.email, u.activo, u.created_at,
                    u.company, pp.ciudad, pp.categoria, pp.verificado,
                    (SELECT COUNT(*) FROM materiales m WHERE m.proveedor_id = u.id) as total_materiales,
                    (SELECT COUNT(*) FROM resenas r WHERE r.proveedor_id = u.id) as total_resenas,
                    (SELECT AVG(r2.rating) FROM resenas r2 WHERE r2.proveedor_id = u.id) as rating_promedio
             FROM usuarios u
             JOIN perfiles_proveedor pp ON pp.usuario_id = u.id
             ORDER BY u.created_at DESC LIMIT 50`
        );
        res.json(proveedores);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.patch_admin_proveedores__id_verificar = async (req, res) => {

    try {
        const { id } = req.params;
        const { verificado } = req.body;
        await dbRun(
            'UPDATE perfiles_proveedor SET verificado = ? WHERE usuario_id = ?',
            [verificado ? 1 : 0, id]
        );
        res.json({ success: true, verificado: !!verificado });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.patch_admin_usuarios__id_activo = async (req, res) => {

    try {
        const { id } = req.params;
        const { activo } = req.body;
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'No puedes desactivarte a ti mismo.' });
        }
        await dbRun('UPDATE usuarios SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
        res.json({ success: true, activo: !!activo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delete_admin_usuarios__id = async (req, res) => {

    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'No puedes eliminarte a ti mismo.' });
        }
        await dbRun('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.get_admin_actividad = async (req, res) => {

    try {
        const [recentUsers, recentMaterials, recentResenas] = await Promise.all([
            dbAll(`SELECT 'registro' as tipo, u.nombre as titulo, u.rol as detalle, u.created_at as fecha
                   FROM usuarios u ORDER BY u.created_at DESC LIMIT 5`),
            dbAll(`SELECT 'material' as tipo, m.nombre as titulo, u.nombre as detalle, m.created_at as fecha
                   FROM materiales m JOIN usuarios u ON u.id = m.proveedor_id
                   ORDER BY m.created_at DESC LIMIT 5`),
            dbAll(`SELECT 'resena' as tipo, 'Nueva reseña' as titulo,
                          CAST(r.rating AS TEXT) || ' estrellas — ' || u.nombre as detalle, r.created_at as fecha
                   FROM resenas r JOIN usuarios u ON u.id = r.empresa_id
                   ORDER BY r.created_at DESC LIMIT 5`),
        ]);
        const actividad = [...recentUsers, ...recentMaterials, ...recentResenas]
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 15);
        res.json(actividad);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

