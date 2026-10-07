/**
 * Migraciones incrementales (PostgreSQL).
 * Todas son idempotentes: se pueden ejecutar en cada arranque sin riesgo.
 * Cada sentencia corre aislada, así que un fallo nunca tumba el servidor.
 */
module.exports = async function runMigrations(pool) {
    const steps = [
        // --- Nuevas columnas ---
        `ALTER TABLE pasaportes_digitales ADD COLUMN IF NOT EXISTS escaneos INTEGER DEFAULT 0`,
        `ALTER TABLE pasaportes_digitales ADD COLUMN IF NOT EXISTS ultimo_escaneo TIMESTAMP`,

        // --- Limpieza: fusionar participaciones duplicadas antes de imponer unicidad ---
        `UPDATE smart_pooling_participantes p
            SET cantidad_aportada = s.total
            FROM (SELECT grupo_id, empresa_id, MIN(id) AS keep_id, SUM(cantidad_aportada) AS total
                  FROM smart_pooling_participantes GROUP BY grupo_id, empresa_id HAVING COUNT(*) > 1) s
            WHERE p.id = s.keep_id`,
        `DELETE FROM smart_pooling_participantes a
            USING smart_pooling_participantes b
            WHERE a.grupo_id = b.grupo_id AND a.empresa_id = b.empresa_id AND a.id > b.id`,
        `CREATE UNIQUE INDEX IF NOT EXISTS uq_pooling_participante ON smart_pooling_participantes(grupo_id, empresa_id)`,

        // --- Integridad de datos ---
        `DO $$ BEGIN
            ALTER TABLE smart_pooling_grupos ADD CONSTRAINT chk_pool_objetivo CHECK (cantidad_objetivo > 0);
         EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
        `DO $$ BEGIN
            ALTER TABLE smart_pooling_participantes ADD CONSTRAINT chk_pool_aporte CHECK (cantidad_aportada > 0);
         EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

        // --- Índices de rendimiento ---
        `CREATE INDEX IF NOT EXISTS idx_pool_material_estado ON smart_pooling_grupos(material_id, estado)`,
        `CREATE INDEX IF NOT EXISTS idx_pool_estado_fecha ON smart_pooling_grupos(estado, created_at DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_pool_part_grupo ON smart_pooling_participantes(grupo_id)`,
        `CREATE INDEX IF NOT EXISTS idx_pool_part_empresa ON smart_pooling_participantes(empresa_id)`,
        `CREATE INDEX IF NOT EXISTS idx_pasaportes_empresa ON pasaportes_digitales(empresa_id, created_at DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_pasaportes_proveedor ON pasaportes_digitales(proveedor_id)`,
        `CREATE INDEX IF NOT EXISTS idx_materiales_created ON materiales(created_at DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_notificaciones_reciente ON notificaciones(usuario_id, created_at DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_resenas_empresa ON resenas(empresa_id)`,
        `CREATE INDEX IF NOT EXISTS idx_requerimientos_reciente ON requerimientos(created_at DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_visitas_fecha ON visitas(proveedor_id, created_at DESC)`,

        // Estadísticas frescas para el planificador de consultas
        `ANALYZE`
    ];

    let ok = 0;
    for (const sql of steps) {
        try {
            await pool.query(sql);
            ok++;
        } catch (err) {
            console.warn('⚠️  Migración omitida:', err.message.split('\n')[0]);
        }
    }
    console.log(`✅ Migraciones PG aplicadas (${ok}/${steps.length}).`);
};
