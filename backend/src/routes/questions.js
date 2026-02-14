const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const questionsController = require('../controllers/questionsController');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/questions - Get all questions
router.get('/', questionsController.getAllQuestions);

// POST /api/questions - Create new question
router.post('/', questionsController.createQuestion);

// PUT /api/questions/:id - Update question
router.put('/:id', questionsController.updateQuestion);

// DELETE /api/questions/:id - Delete question
router.delete('/:id', questionsController.deleteQuestion);

// POST /api/questions/reorder - Reorder questions
router.post('/reorder', questionsController.reorderQuestions);

module.exports = router;
