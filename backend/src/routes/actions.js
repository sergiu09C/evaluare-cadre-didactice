const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/actionsController');

// Templates (admin doar)
router.get('/templates', authenticateToken, requireAdmin, ctrl.listTemplates);
router.post('/templates', authenticateToken, requireAdmin, ctrl.createTemplate);
router.delete('/templates/:id', authenticateToken, requireAdmin, ctrl.deleteTemplate);

// Admin: propunere + listare
router.post('/propose', authenticateToken, requireAdmin, ctrl.proposeAction);
router.get('/admin/list', authenticateToken, requireAdmin, ctrl.adminListActions);
router.get('/admin/summary', authenticateToken, requireAdmin, ctrl.aggregatedSummary);

// Professor: vizualizare + accept/reject/complete
router.get('/my', authenticateToken, ctrl.professorListActions);
router.put('/my/:id/respond', authenticateToken, ctrl.professorRespond);

module.exports = router;
