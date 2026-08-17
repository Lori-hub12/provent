const fs = require('fs');

// Patch server.js
let serverContent = fs.readFileSync('server.js', 'utf-8');
const backendEndpoint = `
});

app.put('/api/materiales/:id', authenticateToken, async (req, res) => {
    const { nombre, cantidad, unidad, descripcion, imagen_url, precio_estimado, frecuencia_disponibilidad, calidad_pureza, volumen_minimo } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre del material es requerido' });

    try {
        const material = await dbGet(\`SELECT proveedor_id FROM materiales WHERE id = ?\`, [req.params.id]);
        if (!material) return res.status(404).json({ error: 'Material no encontrado' });
        if (req.user.id !== material.proveedor_id) return res.status(403).json({ error: 'Acceso denegado' });

        await dbRun(
            \`UPDATE materiales SET nombre=?, cantidad=?, unidad=?, descripcion=?, imagen_url=COALESCE(?, imagen_url), precio_estimado=?, frecuencia_disponibilidad=?, calidad_pureza=?, volumen_minimo=? WHERE id=?\`,
            [sanitizeString(nombre, 150), cantidad, unidad, descripcion, imagen_url, precio_estimado, frecuencia_disponibilidad, calidad_pureza, volumen_minimo, req.params.id]
        );
        res.json({ message: 'Material actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
`;
serverContent = serverContent.replace(/res\.status\(500\)\.json\(\{ error: err\.message \}\);\s*\}\s*\}\);/, `res.status(500).json({ error: err.message });\n    }\n});\n${backendEndpoint}`);
fs.writeFileSync('server.js', serverContent);


// Patch dashboard-proveedor.html
let dashContent = fs.readFileSync('dashboard-proveedor.html', 'utf-8');

const jsGlobalVars = `  <script>
    document.getElementById('navbar-container').innerHTML = buildNavbar('dashboard');
    const user = ProVendAuth.requireAuth(['proveedor']);
    let prevKpi = null;
    let currentEditMaterialId = null;

    function openMaterialModal(mat = null) {
      const form = document.getElementById('form-material');
      const title = document.querySelector('#modal-material h3');
      const btn = document.getElementById('btn-submit-mat');
      
      if (mat) {
        currentEditMaterialId = mat.id;
        title.textContent = '✏️ Editar Material';
        btn.textContent = 'Guardar Cambios';
        document.getElementById('mat-nombre').value = mat.nombre || '';
        document.getElementById('mat-cantidad').value = mat.cantidad || '';
        document.getElementById('mat-unidad').value = mat.unidad || 'kg';
        document.getElementById('mat-precio').value = mat.precio_estimado || '';
        document.getElementById('mat-volumen').value = mat.volumen_minimo || '';
        document.getElementById('mat-frecuencia').value = mat.frecuencia_disponibilidad || 'Mensual';
        document.getElementById('mat-calidad').value = mat.calidad_pureza || '';
        document.getElementById('mat-descripcion').value = mat.descripcion || '';
      } else {
        currentEditMaterialId = null;
        form.reset();
        title.textContent = '📦 Publicar Material';
        btn.textContent = 'Publicar Material';
      }
      openModal('modal-material');
    }`;

dashContent = dashContent.replace(/<script>\s*document\.getElementById\('navbar-container'\)\.innerHTML = buildNavbar\('dashboard'\);\s*const user = ProVendAuth\.requireAuth\(\['proveedor'\]\);\s*let prevKpi = null;/, jsGlobalVars);

dashContent = dashContent.replace(/onclick="openModal\('modal-material'\)"/g, `onclick="openMaterialModal()"`);

dashContent = dashContent.replace(/<button onclick="alert\('Próximamente'\)">✏️ Editar<\/button>/, `<button onclick='openMaterialModal(' + JSON.stringify(m).replace(/'/g, "&#39;") + ')'>✏️ Editar</button>`);

const fetchReplacement = `        const method = currentEditMaterialId ? 'PUT' : 'POST';
        const url = currentEditMaterialId ? \\\`\\\${API_BASE}/api/materiales/\\\${currentEditMaterialId}\\\` : \\\`\\\${API_BASE}/api/materiales\\\`;

        const res = await ProVendAuth.apiFetch(url, {
          method: method,`;

dashContent = dashContent.replace(/const res = await ProVendAuth\.apiFetch\(`\${API_BASE}\/api\/materiales`, \{\s*method: 'POST',/, fetchReplacement);

fs.writeFileSync('dashboard-proveedor.html', dashContent);
console.log('Patched');
