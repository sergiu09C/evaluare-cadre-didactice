const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireProfessor } = require('../middleware/authProfessor');
const professorController = require('../controllers/professorController');

// All professor routes require authentication and professor role
router.use(authenticateToken);
router.use(requireProfessor);

// GET /api/professor/dashboard - Dashboard overview pentru profesor
router.get('/dashboard', professorController.getDashboard);

// GET /api/professor/evaluations - Lista evaluărilor ANONIMIZATE
router.get('/evaluations', professorController.getEvaluations);

// GET /api/professor/courses - Cursurile profesorului cu statistici
router.get('/courses', professorController.getCourses);

// GET /api/professor/courses/:courseId/stats - Statistici detaliate per curs
router.get('/courses/:courseId/stats', professorController.getCourseStats);

// GET /api/professor/export - Export date în CSV
router.get('/export', professorController.exportData);

module.exports = router;
