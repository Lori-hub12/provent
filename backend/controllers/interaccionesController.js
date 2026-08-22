const { dbRun, dbGet, dbAll } = require('../config/database');
const { sanitizeString } = require('../utils/validation');

exports.post_visitas = async (req, res) => {

    const { proveedor_id, visitante_id } = req.body;
    if (!proveedor_id) return res.status(400).json({ error: 'Falta proveedor_id' });
    try {
        await dbRun(`INSERT INTO visitas (proveedor_id, visitante_id) VALUES (?,?)`, [proveedor_id, visitante_id || null]);
        if (visitante_id) {
            const visitor = await dbGet(`SELECT company, nombre FROM usuarios WHERE id = ?`, [visitante_id]);
            if (visitor) {
                await dbRun(`INSERT INTO notificaciones (usuario_id, tipo, mensaje) VALUES (?, 'visita', ?)`,
                    [proveedor_id, `${visitor.company || visitor.nombre} visitó tu perfil`]);
            }
        }
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.post_favoritos = async (req, res) => {

    if (req.user.id !== parseInt(req.body.empresa_id)) return res.status(403).json({ error: 'Acceso denegado' });
    const { empresa_id, proveedor_id } = req.body;
    try {
        const result = await dbRun(`INSERT INTO favoritos (empresa_id, proveedor_id) VALUES (?,?) ON CONFLICT(empresa_id, proveedor_id) DO NOTHING`, [empresa_id, proveedor_id]);
        const count = await dbGet(`SELECT COUNT(*) as count FROM favoritos WHERE empresa_id = ?`, [empresa_id]);
        res.json({ added: result.changes > 0, total: count.count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delete_favoritos = async (req, res) => {

    if (req.user.id !== parseInt(req.body.empresa_id)) return res.status(403).json({ error: 'Acceso denegado' });
    const { empresa_id, proveedor_id } = req.body;
    try {
        await dbRun(`DELETE FROM favoritos WHERE empresa_id = ? AND proveedor_id = ?`, [empresa_id, proveedor_id]);
        res.json({ removed: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.get_notificaciones__usuario_id = async (req, res) => {

    if (req.user.id !== parseInt(req.params.usuario_id)) return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const rows = await dbAll(`SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 20`, [req.params.usuario_id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.patch_notificaciones__id_leida = async (req, res) => {

    try {
        await dbRun(`UPDATE notificaciones SET leida = 1 WHERE id = ?`, [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.get_requerimientos = async (req, res) => {

    try {
        const rows = await dbAll(`
            SELECT r.*, u.nombre as empresa_nombre, pe.logo_url, pe.ciudad_operacion, pe.telefono_contacto
            FROM requerimientos r
            JOIN usuarios u ON r.empresa_id = u.id
            LEFT JOIN perfiles_empresa pe ON u.id = pe.usuario_id
            WHERE r.estado = 'Activo'
            ORDER BY
                CASE r.urgencia WHEN 'Alta' THEN 1 WHEN 'Media' THEN 2 ELSE 3 END,
                r.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.get_requerimientos_empresa__id = async (req, res) => {

    try {
        const rows = await dbAll(`SELECT * FROM requerimientos WHERE empresa_id = ? ORDER BY created_at DESC`, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.post_requerimientos = async (req, res) => {

    if (req.user.id !== parseInt(req.body.empresa_id)) return res.status(403).json({ error: 'Acceso denegado' });
    const { empresa_id, titulo, cantidad, unidad, urgencia, descripcion } = req.body;
    if (!titulo || !titulo.trim()) return res.status(400).json({ error: 'El título es requerido' });
    if (!['Alta', 'Media', 'Baja'].includes(urgencia)) return res.status(400).json({ error: 'Urgencia inválida' });

    try {
        const result = await dbRun(
            `INSERT INTO requerimientos (empresa_id, titulo, cantidad, unidad, urgencia, descripcion) VALUES (?,?,?,?,?,?)`,
            [empresa_id, sanitizeString(titulo, 200), cantidad, unidad, urgencia, descripcion]
        );
        res.json({ id: result.lastID, message: 'Requerimiento publicado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delete_requerimientos__id = async (req, res) => {

    try {
        const req_record = await dbGet(`SELECT empresa_id FROM requerimientos WHERE id = ?`, [req.params.id]);
        if (!req_record) return res.status(404).json({ error: 'No encontrado' });
        if (req.user.id !== req_record.empresa_id) return res.status(403).json({ error: 'Acceso denegado' });
        await dbRun(`DELETE FROM requerimientos WHERE id = ?`, [req.params.id]);
        res.json({ message: 'Requerimiento eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.post_resenas = async (req, res) => {

    const { proveedor_id, rating, comentario } = req.body;
    if (!proveedor_id || !rating) return res.status(400).json({ error: 'Faltan campos' });
    if (req.user.rol !== 'empresa') return res.status(403).json({ error: 'Solo las empresas pueden reseñar' });
    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) return res.status(400).json({ error: 'Rating debe ser entre 1 y 5' });

    try {
        const result = await dbRun(
            `INSERT INTO resenas (proveedor_id, empresa_id, rating, comentario) VALUES (?,?,?,?) ON CONFLICT(proveedor_id, empresa_id) DO UPDATE SET rating = EXCLUDED.rating, comentario = EXCLUDED.comentario`,
            [proveedor_id, req.user.id, ratingNum, sanitizeString(comentario, 1000)]
        );
        res.status(201).json({ id: result.lastID, message: 'Reseña publicada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.put_resenas__id = async (req, res) => {
    try {
        const { dbGet, dbRun } = require('../config/database');
        const row = await dbGet('SELECT * FROM resenas WHERE id = ?', [req.params.id]);
        if (!row) return res.status(404).json({ error: 'Rese�a no encontrada' });
        if (row.empresa_id !== req.user.id) return res.status(403).json({ error: 'Acceso denegado' });

        const { rating, comentario } = req.body;
        await dbRun('UPDATE resenas SET rating = ?, comentario = ? WHERE id = ?', [rating, comentario, req.params.id]);
        res.json({ message: 'Rese�a actualizada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delete_resenas__id = async (req, res) => {
    try {
        const { dbGet, dbRun } = require('../config/database');
        const row = await dbGet('SELECT * FROM resenas WHERE id = ?', [req.params.id]);
        if (!row) return res.status(404).json({ error: 'Rese�a no encontrada' });
        if (row.empresa_id !== req.user.id) return res.status(403).json({ error: 'Acceso denegado' });

        await dbRun('DELETE FROM resenas WHERE id = ?', [req.params.id]);
        res.json({ message: 'Rese�a eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
