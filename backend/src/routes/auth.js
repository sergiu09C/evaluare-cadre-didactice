const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

// Limiter-e pe endpoint-uri sensibile (per IP):
//  - login: 10/min — protejează contra brute-force
//  - forgot-password: 5/h — protejează contra token spam
//  - reset-password: 10/h — protejează validation-flooding pe token endpoint
const loginLimiter = createRateLimiter({
  key: 'login', windowMs: 60_000, max: 10,
  message: 'Prea multe încercări de autentificare. Așteaptă un minut.',
});
const forgotLimiter = createRateLimiter({
  key: 'forgot', windowMs: 60 * 60 * 1000, max: 5,
  message: 'Prea multe solicitări de resetare. Revino într-o oră.',
});
const resetLimiter = createRateLimiter({
  key: 'reset', windowMs: 60 * 60 * 1000, max: 10,
  message: 'Prea multe încercări de resetare. Revino într-o oră.',
});

// Public routes
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', forgotLimiter, authController.forgotPassword);
router.post('/reset-password', resetLimiter, authController.resetPassword);

// Protected routes (require authentication)
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
