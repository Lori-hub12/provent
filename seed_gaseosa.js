const { dbRun, isPg } = require('./backend/config/database'); 
async function add() { 
    try { 
        const r = await dbRun("INSERT INTO smart_pooling_grupos (material_id, creador_id, cantidad_objetivo, unidad, fecha_limite) VALUES (3, 1, 500, 'litros', '2027-01-01') RETURNING id"); 
        const gid = r.rows[0].id; 
        await dbRun("INSERT INTO smart_pooling_participantes (grupo_id, empresa_id, cantidad_aportada) VALUES ($1, 1, 200)", [gid]); 
        console.log('Added pool to gaseosa'); 
    } catch(e) { console.error(e) } finally { process.exit(0) } 
} 
add();
