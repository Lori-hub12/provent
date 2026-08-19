const authController = require('../controllers/authController');
const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middlewares/rateLimit');
router.post('/forgot-password', authLimiter, authController.post_forgot_password);
router.post('/reset-password', authLimiter, authController.post_reset_password);
router.post('/register', authLimiter, authController.post_register);
router.post('/login', authLimiter, authController.post_login);

module.exports = router;
