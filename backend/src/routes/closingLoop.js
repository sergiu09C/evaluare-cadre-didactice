const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/closingLoopController');

// Public (any authenticated user): list published entries
router.get('/', authenticateToken, controller.listPublic);

// Admin endpoints
router.get('/admin', authenticateToken, requireAdmin, controller.listAdmin);
router.post('/', authenticateToken, requireAdmin, controller.create);
router.put('/:id', authenticateToken, requireAdmin, controller.update);
router.delete('/:id', authenticateToken, requireAdmin, controller.remove);

module.exports = router;
