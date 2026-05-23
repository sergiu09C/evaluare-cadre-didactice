const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/achievementsController');

// Student / orice user autentificat — propriile achievements
router.get('/user', authenticateToken, ctrl.getUserAchievements);

// Admin — CRUD pe definiții
router.get('/definitions', authenticateToken, requireAdmin, ctrl.listDefinitions);
router.post('/definitions', authenticateToken, requireAdmin, ctrl.createDefinition);
router.put('/definitions/:id', authenticateToken, requireAdmin, ctrl.updateDefinition);
router.delete('/definitions/:id', authenticateToken, requireAdmin, ctrl.removeDefinition);
router.post('/recalc-all', authenticateToken, requireAdmin, ctrl.recalcAll);

module.exports = router;
