const { dbRun, dbGet, dbAll } = require('../config/database');
const { sanitizeString } = require('../utils/validation');

exports.get_proveedores = async (req, res) => {

    try {
        const rows = await dbAll(`
            SELECT u.id, u.nombre, u.company, u.email,
                   p.logo_url, p.descripcion, p.ciudad, p.categoria, p.verificado, p.estado, p.tiempo_respuesta, p.whatsapp,
                   COALESCE(AVG(r.rating), 0) as rating,
                   COUNT(DISTINCT r.id) as reviews
            FROM usuarios u
            LEFT JOIN perfiles_proveedor p ON u.id = p.usuario_id
            LEFT JOIN resenas r ON u.id = r.proveedor_id
            WHERE u.rol = 'proveedor' AND u.activo = 1
            GROUP BY u.id
            ORDER BY p.verificado DESC, rating DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error de DB' });
    }
};

exports.get_proveedores__id = async (req, res) => {

    try {
        const row = await dbGet(`
            SELECT u.id, u.nombre, u.company, u.email,
                   p.*,
                   COALESCE(AVG(r.rating), 0) as rating,
                   COUNT(DISTINCT r.id) as reviews,
                   COUNT(DISTINCT v.id) as visitas_total
            FROM usuarios u
            LEFT JOIN perfiles_proveedor p ON u.id = p.usuario_id
            LEFT JOIN resenas r ON u.id = r.proveedor_id
            LEFT JOIN visitas v ON u.id = v.proveedor_id
            WHERE u.id = ? AND u.rol = 'proveedor' AND u.activo = 1
            GROUP BY u.id
        `, [req.params.id]);
        if (!row) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: 'Error de DB' });
    }
};

exports.get_dashboard_proveedor__id = async (req, res) => {

    const { id } = req.params;
    try {
        const row = await dbGet(`
            SELECT
                (SELECT COUNT(*) FROM materiales WHERE proveedor_id = ? AND estado = 'Activo') as materiales,
                (SELECT COUNT(*) FROM productos WHERE proveedor_id = ? AND estado = 'Activo') as productos,
                (SELECT COUNT(*) FROM visitas WHERE proveedor_id = ?) as visitas,
                (SELECT COUNT(*) FROM resenas WHERE proveedor_id = ?) as resenas,
                (SELECT COALESCE(AVG(rating), 0) FROM resenas WHERE proveedor_id = ?) as rating,
                (SELECT COUNT(*) FROM favoritos WHERE proveedor_id = ?) as favoritos
        `, [id, id, id, id, id, id]);
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: 'Error de DB' });
    }
};

exports.get_dashboard_proveedor__id_materiales = async (req, res) => {

    try {
        const rows = await dbAll(`SELECT * FROM materiales WHERE proveedor_id = ? ORDER BY created_at DESC`, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.get_dashboard_proveedor__id_productos = async (req, res) => {

    try {
        const rows = await dbAll(`SELECT * FROM productos WHERE proveedor_id = ? ORDER BY created_at DESC`, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.get_dashboard_proveedor__id_resenas = async (req, res) => {

    try {
        const rows = await dbAll(`
            SELECT r.*, u.company as empresa_nombre
            FROM resenas r
            LEFT JOIN usuarios u ON r.empresa_id = u.id
            WHERE r.proveedor_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.post_materiales = async (req, res) => {

    if (req.user.id !== parseInt(req.body.proveedor_id)) return res.status(403).json({ error: 'Acceso denegado' });

    const { proveedor_id, nombre, cantidad, unidad, descripcion, imagen_url, precio_estimado, frecuencia_disponibilidad, calidad_pureza, volumen_minimo } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre del material es requerido' });

    try {
        const result = await dbRun(
            `INSERT INTO materiales (proveedor_id, nombre, cantidad, unidad, descripcion, imagen_url, precio_estimado, frecuencia_disponibilidad, calidad_pureza, volumen_minimo)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [proveedor_id, sanitizeString(nombre, 150), cantidad, unidad, descripcion, imagen_url, precio_estimado, frecuencia_disponibilidad, calidad_pureza, volumen_minimo]
        );
        await dbRun(`INSERT INTO notificaciones (usuario_id, tipo, mensaje) VALUES (?, 'material', ?)`,
            [proveedor_id, `Publicaste un nuevo material: ${nombre}`]);
        res.status(201).json({ id: result.lastID, message: 'Material publicado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.put_materiales__id = async (req, res) => {

    const { nombre, cantidad, unidad, descripcion, imagen_url, precio_estimado, frecuencia_disponibilidad, calidad_pureza, volumen_minimo } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre del material es requerido' });

    try {
        const material = await dbGet(`SELECT proveedor_id FROM materiales WHERE id = ?`, [req.params.id]);
        if (!material) return res.status(404).json({ error: 'Material no encontrado' });
        if (req.user.id !== material.proveedor_id) return res.status(403).json({ error: 'Acceso denegado' });

        await dbRun(
            `UPDATE materiales SET nombre=?, cantidad=?, unidad=?, descripcion=?, imagen_url=COALESCE(?, imagen_url), precio_estimado=?, frecuencia_disponibilidad=?, calidad_pureza=?, volumen_minimo=? WHERE id=?`,
            [sanitizeString(nombre, 150), cantidad, unidad, descripcion, imagen_url, precio_estimado, frecuencia_disponibilidad, calidad_pureza, volumen_minimo, req.params.id]
        );
        res.json({ message: 'Material actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delete_materiales__id = async (req, res) => {

    try {
        const material = await dbGet(`SELECT proveedor_id FROM materiales WHERE id = ?`, [req.params.id]);
        if (!material) return res.status(404).json({ error: 'Material no encontrado' });
        if (req.user.id !== material.proveedor_id) return res.status(403).json({ error: 'Acceso denegado' });

        await dbRun(`DELETE FROM materiales WHERE id = ?`, [req.params.id]);
        res.json({ message: 'Eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.put_perfiles_proveedor__id = async (req, res) => {

    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Acceso denegado' });
    const { logo_url, descripcion, ciudad, categoria, telefono, whatsapp, sitio_web, horario, cobertura, capacidad_mensual_toneladas, tiene_transporte } = req.body;
    try {
        await dbRun(`
            INSERT INTO perfiles_proveedor (
                usuario_id, logo_url, descripcion, ciudad, categoria, telefono, whatsapp, sitio_web, horario, cobertura, capacidad_mensual_toneladas, tiene_transporte
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(usuario_id) DO UPDATE SET
                logo_url = COALESCE(EXCLUDED.logo_url, perfiles_proveedor.logo_url),
                descripcion = COALESCE(EXCLUDED.descripcion, perfiles_proveedor.descripcion),
                ciudad = COALESCE(EXCLUDED.ciudad, perfiles_proveedor.ciudad),
                categoria = COALESCE(EXCLUDED.categoria, perfiles_proveedor.categoria),
                telefono = COALESCE(EXCLUDED.telefono, perfiles_proveedor.telefono),
                whatsapp = COALESCE(EXCLUDED.whatsapp, perfiles_proveedor.whatsapp),
                sitio_web = COALESCE(EXCLUDED.sitio_web, perfiles_proveedor.sitio_web),
                horario = COALESCE(EXCLUDED.horario, perfiles_proveedor.horario),
                cobertura = COALESCE(EXCLUDED.cobertura, perfiles_proveedor.cobertura),
                capacidad_mensual_toneladas = COALESCE(EXCLUDED.capacidad_mensual_toneladas, perfiles_proveedor.capacidad_mensual_toneladas),
                tiene_transporte = COALESCE(EXCLUDED.tiene_transporte, perfiles_proveedor.tiene_transporte)
        `, [req.params.id, logo_url, descripcion, ciudad, categoria, telefono, whatsapp, sitio_web, horario, cobertura, capacidad_mensual_toneladas, tiene_transporte]);
        res.json({ message: 'Perfil actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

