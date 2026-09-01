const express = require('express');
const router = express.Router();
const featureController = require('../controllers/featureController');
const { authenticateToken } = require('../middlewares/auth');

// Smart Pooling
router.get('/smart-pooling', featureController.getSmartPooling);
router.post('/smart-pooling', authenticateToken, featureController.createSmartPooling);
router.post('/smart-pooling/:id/join', authenticateToken, featureController.joinSmartPooling);

// Pasaportes Digitales
router.get('/pasaportes', authenticateToken, featureController.getPasaportes);
router.post('/pasaportes', authenticateToken, featureController.createPasaporte);
router.get('/pasaportes/:id', featureController.getPasaportePublico);

module.exports = router;
