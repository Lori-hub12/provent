const interaccionesController = require('../controllers/interaccionesController');
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
router.post('/visitas', interaccionesController.post_visitas);
router.post('/favoritos', authenticateToken, interaccionesController.post_favoritos);
router.delete('/favoritos', authenticateToken, interaccionesController.delete_favoritos);
router.get('/notificaciones/:usuario_id', authenticateToken, interaccionesController.get_notificaciones__usuario_id);
router.patch('/notificaciones/:id/leida', authenticateToken, interaccionesController.patch_notificaciones__id_leida);
router.get('/requerimientos', interaccionesController.get_requerimientos);
router.get('/requerimientos/empresa/:id', authenticateToken, interaccionesController.get_requerimientos_empresa__id);
router.post('/requerimientos', authenticateToken, interaccionesController.post_requerimientos);
router.delete('/requerimientos/:id', authenticateToken, interaccionesController.delete_requerimientos__id);
router.post('/resenas', authenticateToken, interaccionesController.post_resenas);

router.put('/resenas/:id', authenticateToken, interaccionesController.put_resenas__id);
router.delete('/resenas/:id', authenticateToken, interaccionesController.delete_resenas__id);

module.exports = router;
