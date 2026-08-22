const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const { PORT } = require('./backend/config/env');
const { globalLimiter } = require('./backend/middlewares/rateLimit');
const upload = require('./backend/middlewares/upload');
const { authenticateToken } = require('./backend/middlewares/auth');

// ROUTES
const authRoutes = require('./backend/routes/authRoutes');
const proveedoresRoutes = require('./backend/routes/proveedoresRoutes');
const empresasRoutes = require('./backend/routes/empresasRoutes');
const interaccionesRoutes = require('./backend/routes/interaccionesRoutes');
const adminRoutes = require('./backend/routes/adminRoutes');
const searchRoutes = require('./backend/routes/searchRoutes');

const app = express();

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

app.use('/api/', globalLimiter);

// UPLOAD endpoint con Supabase
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    
    const { SUPABASE_URL, SUPABASE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({ error: 'Faltan credenciales de Supabase en el servidor.' });
    }

    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // Creamos un nombre único
        const ext = path.extname(req.file.originalname);
        const fileName = `logos/${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
        
        // Subimos a Supabase Storage (al bucket 'provend-bucket' que crearemos)
        const { data, error } = await supabase.storage
            .from('provend-bucket')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });
            
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
            .from('provend-bucket')
            .getPublicUrl(fileName);
            
        res.json({ url: publicUrl });
    } catch (err) {
        console.error("Error al subir a Supabase:", err);
        res.status(500).json({ error: 'Error interno al subir la imagen a la nube' });
    }
});

// HEALTH
app.get('/api/health', async (req, res) => {
    const { dbGet } = require('./backend/config/database');
    try {
        const row = await dbGet('SELECT COUNT(*) as usuarios FROM usuarios');
        res.json({ status: 'ok', usuarios: row.usuarios, version: '2.0.0 (MVC)' });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// MOUNT ROUTES
app.use('/api', authRoutes);
app.use('/api', proveedoresRoutes);
app.use('/api', empresasRoutes);
app.use('/api', interaccionesRoutes);
app.use('/api', adminRoutes); // Using /api here, because routes inside adminRoutes are like /admin/...
app.use('/api', searchRoutes);

// GLOBAL ERROR HANDLING
app.use((err, req, res, next) => {
    console.error('🔥 Error no manejado:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
});

app.use((req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Endpoint no encontrado' });
    res.sendFile(path.join(__dirname, '404.html'));
});

// START
app.listen(PORT, () => {
    console.log(`🚀 Servidor ProVend en http://localhost:${PORT} (Arquitectura MVC)`);
});

const { db } = require('./backend/config/database');
process.on('SIGTERM', () => {
    console.log('Cerrando servidor...');
    db.close(() => {
        console.log('Base de datos cerrada.');
        process.exit(0);
    });
});
