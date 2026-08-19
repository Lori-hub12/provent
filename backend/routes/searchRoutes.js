const searchController = require('../controllers/searchController');
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
router.get('/stats/categorias', searchController.get_stats_categorias);
router.get('/stats', searchController.get_stats);
router.get('/search', searchController.get_search);

module.exports = router;
