const express = require('express');
const router = express.Router();
const featureController = require('../controllers/featureController');
const { requireAuth } = require('../middlewares/auth');

// Smart Pooling
router.get('/smart-pooling', featureController.getSmartPooling);
router.post('/smart-pooling', requireAuth, featureController.createSmartPooling);
router.post('/smart-pooling/:id/join', requireAuth, featureController.joinSmartPooling);

// Pasaportes Digitales
router.get('/pasaportes', requireAuth, featureController.getPasaportes);
router.post('/pasaportes', requireAuth, featureController.createPasaporte);
router.get('/pasaportes/:id', featureController.getPasaportePublico);

module.exports = router;
