const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/dashboard - Dashboard overview
router.get('/dashboard', adminController.getDashboardStats);

// GET /api/admin/filter-options - Get available filter options
router.get('/filter-options', adminController.getFilterOptions);

// GET /api/admin/stats/completion - Statistici completare (cu filtre)
router.get('/stats/completion', adminController.getCompletionStats);

// GET /api/admin/professors - Lista profesori cu statistici
router.get('/professors', adminController.getAllProfessors);

// GET /api/admin/stats/professor/:id - Statistici detaliate profesor
router.get('/stats/professor/:id', adminController.getProfessorStats);

// === ADVANCED FILTERING ROUTES ===

// GET /api/admin/stats/filtered - Statistici cu filtre avansate (faculty, level, year, course_type)
router.get('/stats/filtered', adminController.getFilteredStats);

// GET /api/admin/stats/discipline - Comparație profesori pentru aceeași disciplină
router.get('/stats/discipline', adminController.getDisciplineComparison);

// GET /api/admin/courses/names - Listă discipline unice pentru comparație
router.get('/courses/names', adminController.getCourseNames);

// GET /api/admin/stats/by-year - Statistici pe ani de studiu
router.get('/stats/by-year', adminController.getYearStats);

// GET /api/admin/stats/by-course-type - Statistici pe tipuri de curs (curs/lab/seminar)
router.get('/stats/by-course-type', adminController.getCourseTypeStats);

// Export ARACIS — CSV agregat (facultate × program × an de studiu)
router.get('/export/aracis', adminController.exportAracis);

// === USERS CRUD ===
const adminUsersController = require('../controllers/adminUsersController');
router.get('/users', adminUsersController.list);
router.get('/users/counts', adminUsersController.counts);
router.get('/users/:id/professor-profile', adminUsersController.getProfessorProfile);
router.post('/users', adminUsersController.create);
router.put('/users/:id', adminUsersController.update);
router.delete('/users/:id', adminUsersController.deactivate);

// Lookups pentru editor profil profesor
router.get('/lookup/courses', adminUsersController.lookupCourses);
router.get('/lookup/departments', adminUsersController.lookupDepartments);

module.exports = router;
