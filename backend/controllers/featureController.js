const { dbRun, dbAll, dbGet } = require('../config/database');

exports.getSmartPooling = async (req, res) => {
    try {
        const groups = await dbAll(`
            SELECT g.*, 
                   m.nombre as material_nombre, m.imagen_url as material_imagen, m.precio_estimado,
                   u.company as creador_empresa,
                   COALESCE((SELECT SUM(cantidad_aportada) FROM smart_pooling_participantes p WHERE p.grupo_id = g.id), 0) as progreso
            FROM smart_pooling_grupos g
            JOIN materiales m ON g.material_id = m.id
            JOIN usuarios u ON g.creador_id = u.id
            WHERE g.estado = 'Activo'
            ORDER BY g.created_at DESC
        `);
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createSmartPooling = async (req, res) => {
    try {
        const creador_id = req.user.id;
        const { material_id, cantidad_objetivo, unidad, fecha_limite } = req.body;
        
        const result = await dbRun(
            `INSERT INTO smart_pooling_grupos (material_id, creador_id, cantidad_objetivo, unidad, fecha_limite) 
             VALUES (?, ?, ?, ?, ?) RETURNING id`,
            [material_id, creador_id, cantidad_objetivo, unidad, fecha_limite]
        );
        
        // El creador automǭticamente puede ser considerado participante si queremos, pero mejor que el decida cuǭnto aportar despuǸs o en la creacin.
        // Por ahora solo creamos el grupo.
        res.json({ success: true, id: result.id || (result.rows && result.rows[0].id) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.joinSmartPooling = async (req, res) => {
    try {
        const empresa_id = req.user.id;
        const grupo_id = req.params.id;
        const { cantidad_aportada } = req.body;
        
        await dbRun(
            `INSERT INTO smart_pooling_participantes (grupo_id, empresa_id, cantidad_aportada) VALUES (?, ?, ?)`,
            [grupo_id, empresa_id, cantidad_aportada]
        );
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPasaportes = async (req, res) => {
    try {
        const empresa_id = req.user.id;
        const pasaportes = await dbAll(
            `SELECT p.*, u.company as proveedor_nombre 
             FROM pasaportes_digitales p
             JOIN usuarios u ON p.proveedor_id = u.id
             WHERE p.empresa_id = ?
             ORDER BY p.created_at DESC`,
            [empresa_id]
        );
        res.json(pasaportes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createPasaporte = async (req, res) => {
    try {
        const empresa_id = req.user.id;
        const { proveedor_id, material_origen, producto_final, porcentaje_reciclado, co2_evitado, costo_reducido } = req.body;
        
        // Generar un cdigo Ǟnico tipo PV-2026-XXXX
        const codeNum = Math.floor(1000 + Math.random() * 9000);
        const year = new Date().getFullYear();
        const id = \`PV-\${year}-\${codeNum}\`;
        
        await dbRun(
            \`INSERT INTO pasaportes_digitales (id, proveedor_id, empresa_id, material_origen, producto_final, porcentaje_reciclado, co2_evitado, costo_reducido) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)\`,
            [id, proveedor_id, empresa_id, material_origen, producto_final, porcentaje_reciclado, co2_evitado, costo_reducido]
        );
        
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPasaportePublico = async (req, res) => {
    try {
        const id = req.params.id;
        const pasaporte = await dbGet(
            \`SELECT p.*, 
                    prov.company as proveedor_nombre, 
                    emp.company as empresa_nombre 
             FROM pasaportes_digitales p
             JOIN usuarios prov ON p.proveedor_id = prov.id
             JOIN usuarios emp ON p.empresa_id = emp.id
             WHERE p.id = ?\`,
            [id]
        );
        
        if (!pasaporte) {
            return res.status(404).json({ error: 'Pasaporte no encontrado' });
        }
        
        res.json(pasaporte);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
