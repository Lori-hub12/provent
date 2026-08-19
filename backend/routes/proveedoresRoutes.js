const proveedoresController = require('../controllers/proveedoresController');
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
router.get('/proveedores', proveedoresController.get_proveedores);
router.get('/proveedores/:id', proveedoresController.get_proveedores__id);
router.get('/dashboard/proveedor/:id', proveedoresController.get_dashboard_proveedor__id);
router.get('/dashboard/proveedor/:id/materiales', proveedoresController.get_dashboard_proveedor__id_materiales);
router.get('/dashboard/proveedor/:id/productos', proveedoresController.get_dashboard_proveedor__id_productos);
router.get('/dashboard/proveedor/:id/resenas', proveedoresController.get_dashboard_proveedor__id_resenas);
router.post('/materiales', authenticateToken, proveedoresController.post_materiales);
router.put('/materiales/:id', authenticateToken, proveedoresController.put_materiales__id);
router.delete('/materiales/:id', authenticateToken, proveedoresController.delete_materiales__id);
router.put('/perfiles_proveedor/:id', authenticateToken, proveedoresController.put_perfiles_proveedor__id);

module.exports = router;
