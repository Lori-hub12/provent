const bcrypt = require('bcrypt');
const { dbRun, dbGet, isPg } = require('./backend/config/database');

async function createTestEmpresa() {
    try {
        const email = 'empresa@test.com';
        const plainPassword = 'password123';
        
        // Verificar si ya existe
        const existing = await dbGet("SELECT id FROM usuarios WHERE email = $1", [email]);
        if (existing) {
            console.log('El usuario ya existe con ID:', existing.id);
            process.exit(0);
        }

        const hash = await bcrypt.hash(plainPassword, 10);
        
        // Insertar usuario
        const result = await dbRun(
            `INSERT INTO usuarios (nombre, email, password, rol, activo, company) 
             VALUES ($1, $2, $3, $4, 1, $5) RETURNING id`,
            ['Empresa de Prueba', email, hash, 'empresa', 'EcoDiseño Test']
        );
        
        let userId = result.rows ? result.rows[0].id : result.id;
        
        if (userId) {
            // Insertar perfil de empresa
            await dbRun(
                `INSERT INTO perfiles_empresa (usuario_id, rubro_industria, ciudad_operacion, tamano_empresa) 
                 VALUES ($1, $2, $3, $4)`,
                [userId, 'Textil Sostenible', 'Managua', 'MIPYME']
            );
            console.log('Cuenta de empresa creada exitosamente. ID:', userId);
        } else {
            console.log('No se pudo obtener el ID del usuario creado.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

createTestEmpresa();
