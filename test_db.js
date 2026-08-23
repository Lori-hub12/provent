const db = require('./backend/config/database');
async function test() {
    try {
        const res = await db.dbAll("SELECT u.id, (SELECT COUNT(*) FROM requerimientos req WHERE req.empresa_id = u.id) as count FROM usuarios u WHERE u.rol = 'empresa' LIMIT 1");
        console.log("Success:", res);
    } catch(e) {
        console.error("Error:", e);
    }
    process.exit();
}
test();
