const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Para poder recibir JSON en el body

// Configurar SQLite
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error abriendo base de datos', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        // Crear tabla de usuarios
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            email TEXT UNIQUE,
            password TEXT,
            rol TEXT
        )`);
    }
});

// Servir archivos estáticos del frontend (la carpeta actual)
app.use(express.static(path.join(__dirname, '')));

// API: Registro
app.post('/api/register', async (req, res) => {
    const { nombre, email, password, rol } = req.body;
    
    if (!email || !password || !rol) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        // Encriptar la contraseña (Salt = 10)
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Guardar en la base de datos
        db.run(`INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)`, 
            [nombre, email, hash, rol], 
            function(err) {
                if (err) {
                    return res.status(400).json({ error: 'El correo ya está registrado.' });
                }
                res.status(201).json({ 
                    message: 'Usuario registrado exitosamente',
                    user: { id: this.lastID, nombre, email, rol }
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// API: Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Proporciona email y contraseña' });
    }

    db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        if (!row) {
            return res.status(401).json({ error: 'Correo no encontrado' });
        }

        // Comparar contraseña
        const match = await bcrypt.compare(password, row.password);
        if (match) {
            // Login exitoso
            res.json({
                message: 'Login exitoso',
                user: {
                    id: row.id,
                    nombre: row.nombre,
                    email: row.email,
                    rol: row.rol
                }
            });
        } else {
            res.status(401).json({ error: 'Contraseña incorrecta' });
        }
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
