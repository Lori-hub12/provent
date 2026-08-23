const adminController = require('../controllers/adminController');
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/auth');
router.get('/admin/stats', requireAdmin, adminController.get_admin_stats);
router.get('/admin/usuarios', requireAdmin, adminController.get_admin_usuarios);
router.get('/admin/proveedores', requireAdmin, adminController.get_admin_proveedores);
router.patch('/admin/proveedores/:id/verificar', requireAdmin, adminController.patch_admin_proveedores__id_verificar);
router.patch('/admin/usuarios/:id/activo', requireAdmin, adminController.patch_admin_usuarios__id_activo);
router.delete('/admin/usuarios/:id', requireAdmin, adminController.delete_admin_usuarios__id);
router.get('/admin/actividad', requireAdmin, adminController.get_admin_actividad);

router.get('/admin/empresas', requireAdmin, adminController.get_admin_empresas);

module.exports = router;
