const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/student/feedback-stats - Statistici anonimizate
router.get('/feedback-stats', feedbackController.getFeedbackStats);

// GET /api/student/achievements - Badge-uri și achievements
router.get('/achievements', feedbackController.getAchievements);

// GET /api/student/evaluation-history - Timeline evaluări
router.get('/evaluation-history', feedbackController.getEvaluationHistory);

// GET /api/student/notifications - Notificări
router.get('/notifications', feedbackController.getNotifications);

module.exports = router;
