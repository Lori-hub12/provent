const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '';
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

app.disable('x-powered-by');
app.use(cors(FRONTEND_ORIGIN ? { origin: FRONTEND_ORIGIN, credentials: true } : undefined));
app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const run = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function onRun(err) { err ? reject(err) : resolve(this); }));
const get = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
const all = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function validId(value) { return Number.isInteger(Number(value)) && Number(value) > 0; }
function text(value, max = 500) { return String(value || '').trim().slice(0, max); }
function parseCookies(header = '') { return Object.fromEntries(header.split(';').filter(Boolean).map(pair => { const [key, ...rest] = pair.trim().split('='); return [key, decodeURIComponent(rest.join('='))]; })); }
function sign(value) { return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url'); }
function createSession(user) { const payload = Buffer.from(JSON.stringify({ id: user.id, rol: user.rol, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString('base64url'); return `${payload}.${sign(payload)}`; }
function readSession(token) { try { const [payload, signature] = String(token || '').split('.'); if (!payload || !signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign(payload)))) return null; const session = JSON.parse(Buffer.from(payload, 'base64url').toString()); return session.exp > Date.now() ? session : null; } catch { return null; } }
function setSession(res, user) { res.setHeader('Set-Cookie', `proven_session=${createSession(user)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`); }
function clearSession(res) { res.setHeader('Set-Cookie', 'proven_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0'); }

async function auth(req, res, next) {
  const session = readSession(parseCookies(req.headers.cookie).proven_session);
  if (!session) return res.status(401).json({ error: 'Sesión requerida' });
  const user = await get('SELECT id, nombre, email, rol, company FROM usuarios WHERE id = ?', [session.id]).catch(() => null);
  if (!user) return res.status(401).json({ error: 'Sesión inválida' });
  req.user = user;
  next();
}
function roles(...allowed) { return (req, res, next) => allowed.includes(req.user.rol) ? next() : res.status(403).json({ error: 'No tienes permisos para esta acción' }); }
function owner(param = 'id') { return (req, res, next) => String(req.user.id) === String(req.params[param]) ? next() : res.status(403).json({ error: 'No puedes acceder a este recurso' }); }
function publicUser(row) { return { id: row.id, nombre: row.nombre, email: row.email, rol: row.rol, company: row.company }; }

async function initialize() {
  await run('PRAGMA foreign_keys = ON');
  await run(`CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, rol TEXT NOT NULL CHECK (rol IN ('empresa','proveedor','admin')), company TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS perfiles_proveedor (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER UNIQUE NOT NULL, logo_url TEXT, descripcion TEXT, ciudad TEXT, categoria TEXT, ruc TEXT, telefono TEXT, whatsapp TEXT, sitio_web TEXT, horario TEXT, cobertura TEXT, verificado INTEGER DEFAULT 0, nivel_verificacion TEXT DEFAULT 'Básico', tiempo_respuesta TEXT DEFAULT '24 horas', estado TEXT DEFAULT 'Disponible', FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE)`);
  await run(`CREATE TABLE IF NOT EXISTS materiales (id INTEGER PRIMARY KEY AUTOINCREMENT, proveedor_id INTEGER NOT NULL, nombre TEXT NOT NULL, cantidad TEXT, unidad TEXT, descripcion TEXT, imagen_url TEXT, estado TEXT DEFAULT 'Activo', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE)`);
  await run(`CREATE TABLE IF NOT EXISTS productos (id INTEGER PRIMARY KEY AUTOINCREMENT, proveedor_id INTEGER NOT NULL, nombre TEXT NOT NULL, precio TEXT, categoria TEXT, descripcion TEXT, imagen_url TEXT, estado TEXT DEFAULT 'Activo', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE)`);
  await run(`CREATE TABLE IF NOT EXISTS visitas (id INTEGER PRIMARY KEY AUTOINCREMENT, proveedor_id INTEGER NOT NULL, visitante_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE)`);
  await run(`CREATE TABLE IF NOT EXISTS favoritos (id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, proveedor_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(empresa_id, proveedor_id), FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE, FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE)`);
  await run(`CREATE TABLE IF NOT EXISTS resenas (id INTEGER PRIMARY KEY AUTOINCREMENT, proveedor_id INTEGER NOT NULL, empresa_id INTEGER NOT NULL, rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5), comentario TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE, FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE)`);
  await run(`CREATE TABLE IF NOT EXISTS notificaciones (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, tipo TEXT, mensaje TEXT NOT NULL, leida INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE)`);
  await run(`CREATE TABLE IF NOT EXISTS cotizaciones (id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, proveedor_id INTEGER NOT NULL, producto_id INTEGER, mensaje TEXT NOT NULL, estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Aceptada','Rechazada','Cerrada')), respuesta TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE, FOREIGN KEY(proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE, FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE SET NULL)`);
  await run('CREATE INDEX IF NOT EXISTS idx_perfiles_categoria ON perfiles_proveedor(categoria)');
  await run('CREATE INDEX IF NOT EXISTS idx_materiales_proveedor ON materiales(proveedor_id)');
  await run('CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id)');
  await run('CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leida)');
}

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.post('/api/register', async (req, res) => {
  const nombre = text(req.body.nombre, 120), email = normalizeEmail(req.body.email), password = String(req.body.password || ''), rol = text(req.body.rol, 20), company = text(req.body.company || req.body.nombre, 160), ruc = text(req.body.ruc, 40), categoria = text(req.body.categoria, 80);
  if (nombre.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6 || !['empresa','proveedor'].includes(rol) || company.length < 2) return res.status(400).json({ error: 'Revisa los campos obligatorios' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const inserted = await run('INSERT INTO usuarios (nombre,email,password,rol,company) VALUES (?,?,?,?,?)', [nombre, email, hash, rol, company]);
    const user = { id: inserted.lastID, nombre, email, rol, company };
    if (rol === 'proveedor') await run('INSERT INTO perfiles_proveedor (usuario_id,ruc,categoria) VALUES (?,?,?)', [user.id, ruc, categoria]);
    setSession(res, user); res.status(201).json({ message: 'Usuario registrado exitosamente', user });
  } catch (error) { res.status(error.code === 'SQLITE_CONSTRAINT' ? 409 : 500).json({ error: error.code === 'SQLITE_CONSTRAINT' ? 'El correo ya está registrado' : 'Error interno del servidor' }); }
});
app.post('/api/login', async (req, res) => {
  const email = normalizeEmail(req.body.email), password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Proporciona email y contraseña' });
  const row = await get('SELECT * FROM usuarios WHERE email = ?', [email]).catch(() => null);
  if (!row || !(await bcrypt.compare(password, row.password))) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  const user = publicUser(row); setSession(res, user); res.json({ message: 'Login exitoso', user });
});
app.post('/api/logout', (req, res) => { clearSession(res); res.json({ ok: true }); });
app.get('/api/me', auth, (req, res) => res.json({ user: req.user }));

app.get('/api/stats', async (req, res) => { try { const row = await get(`SELECT (SELECT COUNT(*) FROM usuarios WHERE rol='proveedor') proveedores, (SELECT COUNT(*) FROM usuarios WHERE rol='empresa') empresas, (SELECT COUNT(*) FROM materiales WHERE estado='Activo') materiales, (SELECT COUNT(*) FROM productos WHERE estado='Activo') productos, (SELECT COUNT(*) FROM perfiles_proveedor WHERE verificado=1) verificados`); res.json(row); } catch { res.status(500).json({ error: 'Error de DB' }); } });
app.get('/api/proveedores', async (req, res) => { try { const q = `%${text(req.query.q, 100).toLowerCase()}%`; const rows = await all(`SELECT u.id,u.nombre,u.company,u.email,p.logo_url,p.descripcion,p.ciudad,p.categoria,p.verificado,p.estado,p.tiempo_respuesta,p.whatsapp,COALESCE(AVG(r.rating),0) rating,COUNT(DISTINCT r.id) reviews FROM usuarios u LEFT JOIN perfiles_proveedor p ON u.id=p.usuario_id LEFT JOIN resenas r ON u.id=r.proveedor_id WHERE u.rol='proveedor' AND (LOWER(u.nombre) LIKE ? OR LOWER(u.company) LIKE ? OR LOWER(COALESCE(p.categoria,'')) LIKE ? OR LOWER(COALESCE(p.ciudad,'')) LIKE ? OR LOWER(COALESCE(p.descripcion,'')) LIKE ?) GROUP BY u.id ORDER BY p.verificado DESC,rating DESC`, [q,q,q,q,q]); res.json(rows); } catch { res.status(500).json({ error: 'Error de DB' }); } });
app.get('/api/proveedores/:id', async (req, res) => { if (!validId(req.params.id)) return res.status(400).json({ error: 'ID inválido' }); try { const row = await get(`SELECT u.id,u.nombre,u.company,u.email,p.*,COALESCE(AVG(r.rating),0) rating,COUNT(DISTINCT r.id) reviews FROM usuarios u LEFT JOIN perfiles_proveedor p ON u.id=p.usuario_id LEFT JOIN resenas r ON u.id=r.proveedor_id WHERE u.id=? AND u.rol='proveedor' GROUP BY u.id`, [req.params.id]); if (!row) return res.status(404).json({ error: 'Proveedor no encontrado' }); res.json(row); } catch { res.status(500).json({ error: 'Error de DB' }); } });

app.get('/api/dashboard/proveedor/:id', auth, owner('id'), async (req,res) => { const id=req.params.id; try { res.json(await get(`SELECT (SELECT COUNT(*) FROM materiales WHERE proveedor_id=? AND estado='Activo') materiales,(SELECT COUNT(*) FROM productos WHERE proveedor_id=? AND estado='Activo') productos,(SELECT COUNT(*) FROM visitas WHERE proveedor_id=?) visitas,(SELECT COUNT(*) FROM resenas WHERE proveedor_id=?) resenas,(SELECT COALESCE(AVG(rating),0) FROM resenas WHERE proveedor_id=?) rating,(SELECT COUNT(*) FROM favoritos WHERE proveedor_id=?) favoritos`, [id,id,id,id,id,id])); } catch { res.status(500).json({error:'Error de DB'}); } });
app.get('/api/dashboard/proveedor/:id/materiales', async (req,res)=>{ if(!validId(req.params.id)) return res.status(400).json({error:'ID inválido'}); res.json(await all('SELECT * FROM materiales WHERE proveedor_id=? AND estado=\'Activo\' ORDER BY created_at DESC',[req.params.id])); });
app.get('/api/dashboard/proveedor/:id/productos', auth, owner('id'), async (req,res)=>res.json(await all('SELECT * FROM productos WHERE proveedor_id=? ORDER BY created_at DESC',[req.params.id])));
app.get('/api/dashboard/proveedor/:id/resenas', async (req,res)=>res.json(await all('SELECT r.*,u.company empresa_nombre FROM resenas r LEFT JOIN usuarios u ON r.empresa_id=u.id WHERE r.proveedor_id=? ORDER BY r.created_at DESC',[req.params.id])));

async function createListing(req,res,type) { const table=type==='material'?'materiales':'productos'; const name=text(req.body.nombre,120); if (!name) return res.status(400).json({error:'El nombre es obligatorio'}); try { const values=type==='material' ? [req.user.id,name,text(req.body.cantidad,60),text(req.body.unidad,30),text(req.body.descripcion,500),text(req.body.imagen_url,500)] : [req.user.id,name,text(req.body.precio,60),text(req.body.categoria,80),text(req.body.descripcion,500),text(req.body.imagen_url,500)]; const columns=type==='material' ? '(proveedor_id,nombre,cantidad,unidad,descripcion,imagen_url)' : '(proveedor_id,nombre,precio,categoria,descripcion,imagen_url)'; const result=await run(`INSERT INTO ${table} ${columns} VALUES (?,?,?,?,?,?)`, values); res.status(201).json({id:result.lastID}); } catch { res.status(500).json({error:'No se pudo guardar'}); } }
app.post('/api/materiales', auth, roles('proveedor'), (req,res)=>createListing(req,res,'material'));
app.post('/api/productos', auth, roles('proveedor'), (req,res)=>createListing(req,res,'producto'));
async function deleteListing(req,res,type) { const table=type==='material'?'materiales':'productos'; const row=await get(`SELECT proveedor_id FROM ${table} WHERE id=?`,[req.params.id]); if(!row) return res.status(404).json({error:'Registro no encontrado'}); if(row.proveedor_id!==req.user.id) return res.status(403).json({error:'No autorizado'}); await run(`DELETE FROM ${table} WHERE id=?`,[req.params.id]); res.json({ok:true}); }
app.patch('/api/materiales/:id', auth, roles('proveedor'), async (req,res)=>{ const fields={nombre:text(req.body.nombre,120),cantidad:text(req.body.cantidad,60),unidad:text(req.body.unidad,30),descripcion:text(req.body.descripcion,500),imagen_url:text(req.body.imagen_url,500)}; if(!fields.nombre) return res.status(400).json({error:'El nombre es obligatorio'}); const result=await run('UPDATE materiales SET nombre=?,cantidad=?,unidad=?,descripcion=?,imagen_url=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND proveedor_id=?',Object.values(fields).concat([req.params.id,req.user.id])); res.json({ok:result.changes>0}); });
app.patch('/api/productos/:id', auth, roles('proveedor'), async (req,res)=>{ const fields={nombre:text(req.body.nombre,120),precio:text(req.body.precio,60),categoria:text(req.body.categoria,80),descripcion:text(req.body.descripcion,500),imagen_url:text(req.body.imagen_url,500)}; if(!fields.nombre) return res.status(400).json({error:'El nombre es obligatorio'}); const result=await run('UPDATE productos SET nombre=?,precio=?,categoria=?,descripcion=?,imagen_url=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND proveedor_id=?',Object.values(fields).concat([req.params.id,req.user.id])); res.json({ok:result.changes>0}); });
app.delete('/api/materiales/:id', auth, roles('proveedor'), (req,res)=>deleteListing(req,res,'material'));
app.delete('/api/productos/:id', auth, roles('proveedor'), (req,res)=>deleteListing(req,res,'producto'));

app.get('/api/dashboard/empresa/:id', auth, owner('id'), async(req,res)=>res.json(await get('SELECT (SELECT COUNT(*) FROM visitas WHERE visitante_id=?) proveedores_visitados,(SELECT COUNT(*) FROM favoritos WHERE empresa_id=?) favoritos',(req.params.id,req.params.id))));
app.get('/api/dashboard/empresa/:id/favoritos', auth, owner('id'), async(req,res)=>res.json(await all(`SELECT u.id,u.nombre,u.company,p.logo_url,p.categoria,p.verificado,COALESCE(AVG(r.rating),0) rating,COUNT(DISTINCT r.id) reviews FROM favoritos f JOIN usuarios u ON f.proveedor_id=u.id LEFT JOIN perfiles_proveedor p ON u.id=p.usuario_id LEFT JOIN resenas r ON u.id=r.proveedor_id WHERE f.empresa_id=? GROUP BY u.id`,[req.params.id])));
app.post('/api/favoritos', auth, roles('empresa'), async(req,res)=>{ const id=Number(req.body.proveedor_id); if(!validId(id)) return res.status(400).json({error:'Proveedor inválido'}); await run('INSERT OR IGNORE INTO favoritos (empresa_id,proveedor_id) SELECT ?,id FROM usuarios WHERE id=? AND rol=\'proveedor\'',[req.user.id,id]); res.json({added:true}); });
app.delete('/api/favoritos/:proveedorId', auth, roles('empresa'), async(req,res)=>{ await run('DELETE FROM favoritos WHERE empresa_id=? AND proveedor_id=?',[req.user.id,req.params.proveedorId]); res.json({removed:true}); });
app.post('/api/visitas', async(req,res)=>{ const proveedorId=Number(req.body.proveedor_id); if(!validId(proveedorId)) return res.status(400).json({error:'Proveedor inválido'}); const session=readSession(parseCookies(req.headers.cookie).proven_session); await run('INSERT INTO visitas(proveedor_id,visitante_id) VALUES(?,?)',[proveedorId,session?.id||null]); res.json({ok:true}); });

app.patch('/api/perfiles-proveedor', auth, roles('proveedor'), async(req,res)=>{ await run('UPDATE usuarios SET company=?,nombre=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',[text(req.body.company,160)||req.user.company,text(req.body.nombre,120)||req.user.nombre,req.user.id]); await run('UPDATE perfiles_proveedor SET descripcion=?,ciudad=?,categoria=?,telefono=?,whatsapp=?,sitio_web=?,horario=?,cobertura=?,updated_at=CURRENT_TIMESTAMP WHERE usuario_id=?',[text(req.body.descripcion),text(req.body.ciudad,80),text(req.body.categoria,80),text(req.body.telefono,40),text(req.body.whatsapp,40),text(req.body.sitio_web,200),text(req.body.horario,120),text(req.body.cobertura,120),req.user.id]); res.json({ok:true}); });
app.get('/api/notificaciones', auth, async(req,res)=>res.json(await all('SELECT * FROM notificaciones WHERE usuario_id=? ORDER BY created_at DESC LIMIT 20',[req.user.id])));
app.patch('/api/notificaciones/:id/leida', auth, async(req,res)=>{ const result=await run('UPDATE notificaciones SET leida=1 WHERE id=? AND usuario_id=?',[req.params.id,req.user.id]); res.json({ok:result.changes>0}); });
app.patch('/api/notificaciones/leidas', auth, async(req,res)=>{ const result=await run('UPDATE notificaciones SET leida=1 WHERE usuario_id=? AND leida=0',[req.user.id]); res.json({ok:true,updated:result.changes}); });
app.post('/api/cotizaciones', auth, roles('empresa'), async(req,res)=>{ const proveedor=Number(req.body.proveedor_id); const mensaje=text(req.body.mensaje,1000); if(!validId(proveedor)||!mensaje) return res.status(400).json({error:'Proveedor y mensaje son obligatorios'}); const result=await run('INSERT INTO cotizaciones(empresa_id,proveedor_id,producto_id,mensaje) VALUES(?,?,?,?)',[req.user.id,proveedor,validId(req.body.producto_id)?Number(req.body.producto_id):null,mensaje]); res.status(201).json({id:result.lastID}); });
app.get('/api/cotizaciones', auth, async(req,res)=>res.json(await all(`SELECT c.*,e.company empresa_nombre,p.company proveedor_nombre FROM cotizaciones c JOIN usuarios e ON e.id=c.empresa_id JOIN usuarios p ON p.id=c.proveedor_id WHERE c.empresa_id=? OR c.proveedor_id=? ORDER BY c.created_at DESC`,[req.user.id,req.user.id])));
app.patch('/api/cotizaciones/:id', auth, roles('proveedor'), async(req,res)=>{ const estado=['Aceptada','Rechazada','Cerrada'].includes(req.body.estado)?req.body.estado:null; if(!estado) return res.status(400).json({error:'Estado inválido'}); const result=await run('UPDATE cotizaciones SET estado=?,respuesta=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND proveedor_id=?',[estado,text(req.body.respuesta,1000),req.params.id,req.user.id]); res.json({ok:result.changes>0}); });

app.use(express.static(__dirname));
app.use((err,req,res,next)=>{ if(err instanceof SyntaxError && err.status===400) return res.status(400).json({error:'JSON inválido'}); next(err); });
initialize().then(()=>app.listen(PORT,HOST,()=>console.log(`ProVend escuchando en ${HOST}:${PORT}`))).catch(error=>{ console.error('No se pudo inicializar la base de datos',error); process.exit(1); });
