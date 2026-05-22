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

// GET /api/professor/evaluations/:id/details - Detalii complete pentru o evaluare
router.get('/evaluations/:id/details', professorController.getEvaluationDetails);

// GET /api/professor/courses - Cursurile profesorului cu statistici
router.get('/courses', professorController.getCourses);

// GET /api/professor/courses/:courseId/stats - Statistici detaliate per curs
router.get('/courses/:courseId/stats', professorController.getCourseStats);

// GET /api/professor/courses/:courseId/evaluations - Drill-down evaluări individuale (k-anonim)
router.get('/courses/:courseId/evaluations', professorController.getCourseEvaluations);

// GET /api/professor/export - Export date în CSV
router.get('/export', professorController.exportData);

// GET /api/professor/trend - Trend temporal pe semestre
router.get('/trend', professorController.getTrend);

// GET /api/professor/students-list - Lista studenți per disciplină (ANONIMIZAT)
router.get('/students-list', professorController.getStudentsList);

module.exports = router;
