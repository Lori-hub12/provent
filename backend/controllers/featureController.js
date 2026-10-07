const { dbRun, dbAll, dbGet } = require('../config/database');

// ---------- helpers ----------
const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
};

async function notify(usuarioId, tipo, mensaje) {
    try {
        await dbRun(
            `INSERT INTO notificaciones (usuario_id, tipo, mensaje) VALUES (?, ?, ?)`,
            [usuarioId, tipo, mensaje]
        );
    } catch (e) {
        // Las notificaciones nunca deben romper el flujo principal
        console.error('No se pudo crear notificación:', e.message);
    }
}

// ---------- SMART POOLING ----------
exports.getSmartPooling = async (req, res) => {
    try {
        const groups = await dbAll(`
            SELECT g.*,
                   m.nombre as material_nombre, m.imagen_url as material_imagen, m.precio_estimado,
                   u.company as creador_empresa,
                   COALESCE((SELECT SUM(cantidad_aportada) FROM smart_pooling_participantes p WHERE p.grupo_id = g.id), 0) as progreso,
                   (SELECT COUNT(*) FROM smart_pooling_participantes p WHERE p.grupo_id = g.id) as participantes
            FROM smart_pooling_grupos g
            JOIN materiales m ON g.material_id = m.id
            JOIN usuarios u ON g.creador_id = u.id
            WHERE g.estado IN ('Activo', 'Completado')
            ORDER BY g.created_at DESC
        `);

        const now = Date.now();
        const result = groups
            .filter(g => g.estado === 'Completado' || !g.fecha_limite || new Date(g.fecha_limite).getTime() > now)
            .map(g => {
                const progreso = num(g.progreso) || 0;
                const objetivo = num(g.cantidad_objetivo) || 1;
                return {
                    ...g,
                    progreso,
                    participantes: parseInt(g.participantes, 10) || 0,
                    porcentaje: Math.min(100, Math.round((progreso / objetivo) * 100)),
                    faltante: Math.max(0, objetivo - progreso)
                };
            });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createSmartPooling = async (req, res) => {
    try {
        const creador_id = req.user.id;
        const { material_id, cantidad_objetivo, unidad, fecha_limite } = req.body;

        const objetivo = num(cantidad_objetivo);
        if (!material_id || !(objetivo > 0)) {
            return res.status(400).json({ error: 'Material y cantidad objetivo válida son obligatorios.' });
        }
        const material = await dbGet('SELECT id FROM materiales WHERE id = ?', [material_id]);
        if (!material) return res.status(404).json({ error: 'El material no existe.' });

        const result = await dbRun(
            `INSERT INTO smart_pooling_grupos (material_id, creador_id, cantidad_objetivo, unidad, fecha_limite)
             VALUES (?, ?, ?, ?, ?)`,
            [material_id, creador_id, objetivo, unidad || 'kg', fecha_limite || null]
        );
        res.json({ success: true, id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.joinSmartPooling = async (req, res) => {
    try {
        if (req.user.rol !== 'empresa') {
            return res.status(403).json({ error: 'Solo las cuentas de Empresa pueden unirse a una compra conjunta.' });
        }

        const empresa_id = req.user.id;
        const grupo_id = req.params.id;
        const cantidad = num(req.body.cantidad_aportada);

        if (!(cantidad > 0)) {
            return res.status(400).json({ error: 'Ingresa una cantidad válida mayor a 0.' });
        }

        const grupo = await dbGet(
            `SELECT g.*, m.nombre as material_nombre FROM smart_pooling_grupos g
             JOIN materiales m ON g.material_id = m.id WHERE g.id = ?`,
            [grupo_id]
        );
        if (!grupo) return res.status(404).json({ error: 'La compra conjunta no existe.' });
        if (grupo.estado !== 'Activo') {
            return res.status(400).json({ error: 'Esta compra conjunta ya alcanzó su meta o fue cerrada.' });
        }
        if (grupo.fecha_limite && new Date(grupo.fecha_limite).getTime() < Date.now()) {
            return res.status(400).json({ error: 'La fecha límite de esta compra conjunta ya venció.' });
        }

        // Una empresa = una participación (si vuelve a aportar, se suma)
        const existente = await dbGet(
            'SELECT id FROM smart_pooling_participantes WHERE grupo_id = ? AND empresa_id = ?',
            [grupo_id, empresa_id]
        );
        if (existente) {
            await dbRun(
                'UPDATE smart_pooling_participantes SET cantidad_aportada = cantidad_aportada + ? WHERE id = ?',
                [cantidad, existente.id]
            );
        } else {
            await dbRun(
                'INSERT INTO smart_pooling_participantes (grupo_id, empresa_id, cantidad_aportada) VALUES (?, ?, ?)',
                [grupo_id, empresa_id, cantidad]
            );
        }

        const total = await dbGet(
            'SELECT COALESCE(SUM(cantidad_aportada), 0) as total, COUNT(*) as participantes FROM smart_pooling_participantes WHERE grupo_id = ?',
            [grupo_id]
        );
        const progreso = num(total.total) || 0;
        const objetivo = num(grupo.cantidad_objetivo) || 1;
        const completado = progreso >= objetivo;

        if (completado) {
            await dbRun(`UPDATE smart_pooling_grupos SET estado = 'Completado' WHERE id = ?`, [grupo_id]);
        }

        // Notificaciones
        const quien = await dbGet('SELECT company, nombre FROM usuarios WHERE id = ?', [empresa_id]);
        const nombreEmpresa = (quien && (quien.company || quien.nombre)) || 'Una empresa';
        const unidad = grupo.unidad || 'kg';

        if (grupo.creador_id !== empresa_id) {
            await notify(grupo.creador_id, 'smart_pooling',
                `${nombreEmpresa} aportó ${cantidad} ${unidad} a la compra conjunta de "${grupo.material_nombre}".`);
        }
        if (completado) {
            const parts = await dbAll('SELECT DISTINCT empresa_id FROM smart_pooling_participantes WHERE grupo_id = ?', [grupo_id]);
            const ids = new Set(parts.map(p => p.empresa_id));
            ids.add(grupo.creador_id);
            for (const uid of ids) {
                await notify(uid, 'smart_pooling',
                    `¡Meta alcanzada! La compra conjunta de "${grupo.material_nombre}" llegó a ${objetivo} ${unidad}.`);
            }
        }

        res.json({
            success: true,
            completado,
            progreso,
            objetivo,
            porcentaje: Math.min(100, Math.round((progreso / objetivo) * 100)),
            participantes: parseInt(total.participantes, 10) || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ---------- PASAPORTES DIGITALES ----------
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

        if (!proveedor_id || !material_origen || !producto_final || !porcentaje_reciclado) {
            return res.status(400).json({ error: 'Proveedor, material, producto y % reciclado son obligatorios.' });
        }

        // Código único tipo PV-2026-XXXX (reintenta si hay colisión)
        const year = new Date().getFullYear();
        let id;
        for (let i = 0; i < 10; i++) {
            const candidate = `PV-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
            const exists = await dbGet('SELECT id FROM pasaportes_digitales WHERE id = ?', [candidate]);
            if (!exists) { id = candidate; break; }
        }
        if (!id) return res.status(500).json({ error: 'No se pudo generar un código único, intenta de nuevo.' });

        await dbRun(
            `INSERT INTO pasaportes_digitales (id, proveedor_id, empresa_id, material_origen, producto_final, porcentaje_reciclado, co2_evitado, costo_reducido)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
            `SELECT p.*,
                    prov.company as proveedor_nombre,
                    emp.company as empresa_nombre
             FROM pasaportes_digitales p
             JOIN usuarios prov ON p.proveedor_id = prov.id
             JOIN usuarios emp ON p.empresa_id = emp.id
             WHERE p.id = ?`,
            [id]
        );

        if (!pasaporte) {
            return res.status(404).json({ error: 'Pasaporte no encontrado' });
        }

        // Contador de escaneos (best-effort: no rompe si la columna aún no existe)
        try {
            await dbRun(
                'UPDATE pasaportes_digitales SET escaneos = COALESCE(escaneos, 0) + 1, ultimo_escaneo = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );
            pasaporte.escaneos = (parseInt(pasaporte.escaneos, 10) || 0) + 1;
        } catch (e) { /* ignorar */ }

        res.json(pasaporte);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
