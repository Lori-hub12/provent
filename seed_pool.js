const { dbRun, dbGet, isPg } = require('./backend/config/database');
async function seedPool() {
    try {
        const admin = await dbGet("SELECT id FROM usuarios WHERE email='admin@provend.com'");
        const material = await dbGet("SELECT id FROM materiales LIMIT 1");
        if(admin && material && isPg) {
            // Check if exists
            const check = await dbGet("SELECT id FROM smart_pooling_grupos WHERE material_id=$1", [material.id]);
            if (!check) {
                const r = await dbRun("INSERT INTO smart_pooling_grupos (material_id, creador_id, cantidad_objetivo, unidad, fecha_limite) VALUES ($1, $2, 1000, 'kg', '2027-01-01') RETURNING id", [material.id, admin.id]);
                const gId = r.rows[0].id;
                await dbRun("INSERT INTO smart_pooling_participantes (grupo_id, empresa_id, cantidad_aportada) VALUES ($1, $2, 600)", [gId, admin.id]);
                console.log('Seed exitoso');
            } else {
                console.log('Ya existe un pool para este material.');
            }
        }
    } catch(e) { console.error(e); }
    process.exit(0);
}
seedPool();
