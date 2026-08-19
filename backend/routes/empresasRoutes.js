const empresasController = require('../controllers/empresasController');
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
router.get('/dashboard/empresa/:id', authenticateToken, empresasController.get_dashboard_empresa__id);
router.get('/dashboard/empresa/:id/favoritos', authenticateToken, empresasController.get_dashboard_empresa__id_favoritos);
router.get('/dashboard/empresa/:id/historial', authenticateToken, empresasController.get_dashboard_empresa__id_historial);
router.put('/usuarios/empresa/:id', authenticateToken, empresasController.put_usuarios_empresa__id);

module.exports = router;
