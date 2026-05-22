const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/platformFeedbackController');

// User curent (orice rol cu auth)
router.get('/questions', authenticateToken, ctrl.listForUser);
router.post('/submit', authenticateToken, ctrl.submit);
router.get('/history', authenticateToken, ctrl.listMySubmissions);
router.get('/history/:id', authenticateToken, ctrl.getMySubmission);

// Admin
router.get('/admin/questions', authenticateToken, requireAdmin, ctrl.adminListQuestions);
router.post('/admin/questions', authenticateToken, requireAdmin, ctrl.adminCreateQuestion);
router.put('/admin/questions/:id', authenticateToken, requireAdmin, ctrl.adminUpdateQuestion);
router.delete('/admin/questions/:id', authenticateToken, requireAdmin, ctrl.adminDeleteQuestion);
router.get('/admin/report', authenticateToken, requireAdmin, ctrl.adminReport);

// ===== Mesaje free-form cu closing-loop =====
router.post('/messages', authenticateToken, ctrl.createMessage);
router.get('/messages/mine', authenticateToken, ctrl.listMyMessages);
router.get('/admin/messages', authenticateToken, requireAdmin, ctrl.adminListMessages);
router.post('/admin/messages/:id/respond', authenticateToken, requireAdmin, ctrl.adminRespond);
router.patch('/admin/messages/:id/status', authenticateToken, requireAdmin, ctrl.adminUpdateStatus);

module.exports = router;
