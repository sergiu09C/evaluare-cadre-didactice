const express = require('express');
const router = express.Router();
const userPreferencesController = require('../controllers/userPreferencesController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Preferences routes
router.get('/preferences', userPreferencesController.getPreferences);
router.put('/preferences', userPreferencesController.updatePreferences);

module.exports = router;
