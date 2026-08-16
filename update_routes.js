const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

// POST /api/upload
content = content.replace(
    "app.post('/api/upload', upload.single('file'), (req, res) => {",
    "app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {"
);

// POST /api/materiales
content = content.replace(
    "app.post('/api/materiales', (req, res) => {",
    "app.post('/api/materiales', authenticateToken, (req, res) => {\n    if (req.user.id !== parseInt(req.body.proveedor_id)) return res.status(403).json({ error: 'Acceso denegado' });"
);

// DELETE /api/materiales/:id
content = content.replace(
    "app.delete('/api/materiales/:id', (req, res) => {\n    db.run(`DELETE FROM materiales WHERE id = ?`, [req.params.id], (err) => {",
    "app.delete('/api/materiales/:id', authenticateToken, (req, res) => {\n    db.run(`DELETE FROM materiales WHERE id = ? AND proveedor_id = ?`, [req.params.id, req.user.id], (err) => {"
);

// PUT /api/usuarios/empresa/:id
content = content.replace(
    "app.put('/api/usuarios/empresa/:id', (req, res) => {",
    "app.put('/api/usuarios/empresa/:id', authenticateToken, (req, res) => {\n    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Acceso denegado' });"
);

// PUT /api/perfiles_proveedor/:id
content = content.replace(
    "app.put('/api/perfiles_proveedor/:id', (req, res) => {",
    "app.put('/api/perfiles_proveedor/:id', authenticateToken, (req, res) => {\n    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Acceso denegado' });"
);

// POST /api/favoritos
content = content.replace(
    "app.post('/api/favoritos', (req, res) => {",
    "app.post('/api/favoritos', authenticateToken, (req, res) => {\n    if (req.user.id !== parseInt(req.body.empresa_id)) return res.status(403).json({ error: 'Acceso denegado' });"
);

// DELETE /api/favoritos
content = content.replace(
    "app.delete('/api/favoritos', (req, res) => {",
    "app.delete('/api/favoritos', authenticateToken, (req, res) => {\n    if (req.user.id !== parseInt(req.body.empresa_id)) return res.status(403).json({ error: 'Acceso denegado' });"
);

// GET /api/dashboard/empresa/:id/historial
content = content.replace(
    "app.get('/api/dashboard/empresa/:id/historial', (req, res) => {",
    "app.get('/api/dashboard/empresa/:id/historial', authenticateToken, (req, res) => {\n    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Acceso denegado' });"
);

fs.writeFileSync('server.js', content, 'utf8');
console.log('Rutas actualizadas con middleware y controles IDOR.');
