const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

// 1. Update CREATE TABLE materiales
content = content.replace(
    "imagen_url TEXT,\n                estado TEXT DEFAULT 'Activo',",
    "imagen_url TEXT,\n                precio_estimado TEXT,\n                frecuencia_disponibilidad TEXT,\n                calidad_pureza TEXT,\n                volumen_minimo TEXT,\n                estado TEXT DEFAULT 'Activo',"
);

// 2. Update CREATE TABLE perfiles_proveedor
content = content.replace(
    "whatsapp TEXT,\n                sitio_web TEXT,",
    "whatsapp TEXT,\n                sitio_web TEXT,\n                capacidad_mensual_toneladas TEXT,\n                tiene_transporte INTEGER DEFAULT 0,"
);

// 3. Add CREATE TABLE perfiles_empresa right before perfiles_proveedor
content = content.replace(
    "db.run(`CREATE TABLE IF NOT EXISTS perfiles_proveedor",
    "db.run(`CREATE TABLE IF NOT EXISTS perfiles_empresa (\n                id INTEGER PRIMARY KEY AUTOINCREMENT,\n                usuario_id INTEGER UNIQUE,\n                logo_url TEXT,\n                rubro_industria TEXT,\n                ciudad_operacion TEXT,\n                telefono_contacto TEXT,\n                tamano_empresa TEXT,\n                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n                FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE\n            `);\n\n            db.run(`CREATE TABLE IF NOT EXISTS perfiles_proveedor"
);

// 4. Update POST /api/materiales
const oldPostMat = `app.post('/api/materiales', authenticateToken, (req, res) => {
    if (req.user.id !== parseInt(req.body.proveedor_id)) return res.status(403).json({ error: 'Acceso denegado' });
    const { proveedor_id, nombre, cantidad, unidad, descripcion, imagen_url } = req.body;
    db.run(\`INSERT INTO materiales (proveedor_id, nombre, cantidad, unidad, descripcion, imagen_url) VALUES (?,?,?,?,?,?)\`,
        [proveedor_id, nombre, cantidad, unidad, descripcion, imagen_url],`;

const newPostMat = `app.post('/api/materiales', authenticateToken, (req, res) => {
    if (req.user.id !== parseInt(req.body.proveedor_id)) return res.status(403).json({ error: 'Acceso denegado' });
    const { proveedor_id, nombre, cantidad, unidad, descripcion, imagen_url, precio_estimado, frecuencia_disponibilidad, calidad_pureza, volumen_minimo } = req.body;
    db.run(\`INSERT INTO materiales (proveedor_id, nombre, cantidad, unidad, descripcion, imagen_url, precio_estimado, frecuencia_disponibilidad, calidad_pureza, volumen_minimo) VALUES (?,?,?,?,?,?,?,?,?,?)\`,
        [proveedor_id, nombre, cantidad, unidad, descripcion, imagen_url, precio_estimado, frecuencia_disponibilidad, calidad_pureza, volumen_minimo],`;

content = content.replace(oldPostMat, newPostMat);

// 5. Update PUT /api/perfiles_proveedor/:id
const oldPutProv = `const { descripcion, ciudad, categoria, ruc, telefono, whatsapp, sitio_web, direccion, latitud, longitud, horario, certificados, logo_url } = req.body;`;
const newPutProv = `const { descripcion, ciudad, categoria, ruc, telefono, whatsapp, sitio_web, direccion, latitud, longitud, horario, certificados, logo_url, capacidad_mensual_toneladas, tiene_transporte } = req.body;`;
content = content.replace(oldPutProv, newPutProv);

const oldPutProvQuery = `db.run(\`
        UPDATE perfiles_proveedor SET
            descripcion = ?, ciudad = ?, categoria = ?, ruc = ?,
            telefono = ?, whatsapp = ?, sitio_web = ?, direccion = ?,
            latitud = ?, longitud = ?, horario = ?, certificados = ?, logo_url = ?
        WHERE usuario_id = ?
    \`, [descripcion, ciudad, categoria, ruc, telefono, whatsapp, sitio_web, direccion, latitud, longitud, horario, certificados, logo_url, req.params.id]`;
const newPutProvQuery = `db.run(\`
        UPDATE perfiles_proveedor SET
            descripcion = ?, ciudad = ?, categoria = ?, ruc = ?,
            telefono = ?, whatsapp = ?, sitio_web = ?, direccion = ?,
            latitud = ?, longitud = ?, horario = ?, certificados = ?, logo_url = ?,
            capacidad_mensual_toneladas = ?, tiene_transporte = ?
        WHERE usuario_id = ?
    \`, [descripcion, ciudad, categoria, ruc, telefono, whatsapp, sitio_web, direccion, latitud, longitud, horario, certificados, logo_url, capacidad_mensual_toneladas, tiene_transporte, req.params.id]`;
content = content.replace(oldPutProvQuery, newPutProvQuery);

fs.writeFileSync('server.js', content, 'utf8');
console.log('server.js updated');
