const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const evaluationsController = require('../controllers/evaluationsController');

// All evaluation routes require authentication
router.use(authenticateToken);

// GET /api/evaluations/professors - Lista profesori de evaluat
router.get('/professors', evaluationsController.getProfessorsToEvaluate);

// GET /api/evaluations/status - Status evaluări student
router.get('/status', evaluationsController.getEvaluationStatus);

// POST /api/evaluations - Creează evaluare nouă
router.post('/', evaluationsController.createEvaluation);

// GET /api/evaluations/:id - Detalii evaluare + întrebări
router.get('/:id', evaluationsController.getEvaluation);

// PUT /api/evaluations/:id/responses - Salvează răspunsuri (draft)
router.put('/:id/responses', evaluationsController.saveResponses);

// POST /api/evaluations/:id/submit - Trimite evaluare final
router.post('/:id/submit', evaluationsController.submitEvaluation);

module.exports = router;
