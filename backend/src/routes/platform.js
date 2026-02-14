const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// === PLATFORM SETTINGS (Admin only) ===
router.get('/settings', authenticateToken, requireAdmin, platformController.getPlatformSettings);
router.put('/settings', authenticateToken, requireAdmin, platformController.updatePlatformSettings);
router.post('/test-email', authenticateToken, requireAdmin, platformController.testEmail);

// === MESSAGING (Admin only) ===
router.post('/messages/send', authenticateToken, requireAdmin, platformController.sendMessage);
router.get('/messages/history', authenticateToken, requireAdmin, platformController.getMessageHistory);

// === FILTER OPTIONS (Admin only) ===
router.get('/filters/options', authenticateToken, requireAdmin, platformController.getFilterOptions);

// === STUDENT MESSAGES (Students only) ===
router.get('/messages/student', authenticateToken, platformController.getStudentMessages);

module.exports = router;
