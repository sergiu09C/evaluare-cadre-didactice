const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// === PLATFORM SETTINGS (Admin only) ===
router.get('/settings', authenticateToken, requireAdmin, platformController.getPlatformSettings);
router.put('/settings', authenticateToken, requireAdmin, platformController.updatePlatformSettings);
router.post('/test-email', authenticateToken, requireAdmin, platformController.testEmail);

// === MESSAGING (Admin only) ===
router.post('/messages/send', authenticateToken, requireAdmin, platformController.sendMessage);
router.get('/messages/history', authenticateToken, requireAdmin, platformController.getMessageHistory);

// === HOME STATS — complete pentru pagina Acasă (any auth user) ===
router.get('/home-stats', authenticateToken, platformController.getHomeStats);

// === FILTER OPTIONS PUBLIC (any auth user) — facultăți, programe, departamente, etc. ===
router.get('/filter-options-public', authenticateToken, platformController.getPublicFilterOptions);

// === Rich dashboards endpoints (any auth user) ===
router.get('/heatmap', authenticateToken, platformController.getHeatmap);
router.get('/grouped-bar', authenticateToken, platformController.getGroupedBar);
router.get('/top-rankings', authenticateToken, platformController.getTopRankings);
router.get('/time-series-monthly', authenticateToken, platformController.getTimeSeriesMonthly);

// === FILTER OPTIONS (Admin only) ===
router.get('/filters/options', authenticateToken, requireAdmin, platformController.getFilterOptions);

// === STUDENT MESSAGES (Students only) ===
router.get('/messages/student', authenticateToken, platformController.getStudentMessages);

// === PUBLIC STATUS (any authenticated user) ===
router.get('/status', authenticateToken, (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT is_active, closure_message, evaluation_deadline_enabled,
                evaluation_deadline_date, auto_close_on_deadline
         FROM platform_settings LIMIT 1`,
      )
      .get();
    const isActive = row ? !!row.is_active : true;
    let evaluationsAccepted = isActive;
    let deadlinePassed = false;
    if (
      row &&
      row.evaluation_deadline_enabled &&
      row.auto_close_on_deadline &&
      row.evaluation_deadline_date
    ) {
      const t = new Date(row.evaluation_deadline_date).getTime();
      if (!Number.isNaN(t) && Date.now() > t) {
        deadlinePassed = true;
        evaluationsAccepted = false;
      }
    }
    res.json({
      is_active: isActive,
      closure_message: row?.closure_message || null,
      deadline: row?.evaluation_deadline_date || null,
      deadline_passed: deadlinePassed,
      evaluations_accepted: evaluationsAccepted,
      platform_feedback_active: true, // platform feedback rămâne mereu activ
    });
  } catch (e) {
    next(e);
  }
});

// === PUBLIC STATS — NO AUTH (pentru pagina de login) ===
router.get('/public-stats', (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const totalStudents = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='student'").get().n;
    const submittedCount = db.prepare("SELECT COUNT(*) AS n FROM evaluations WHERE status='submitted'").get().n;
    const totalRequired = db
      .prepare(
        `SELECT COUNT(*) AS n
         FROM users u
         INNER JOIN groups g ON g.id = u.group_id
         INNER JOIN series s ON s.id = g.series_id
         INNER JOIN study_years sy ON sy.id = s.study_year_id
         INNER JOIN courses c ON c.study_year_id = sy.id
         WHERE u.role = 'student' AND c.academic_year = (
           SELECT academic_year FROM courses ORDER BY academic_year DESC LIMIT 1
         )`,
      )
      .get().n;
    const completionRate = totalRequired > 0 ? Math.round((submittedCount / totalRequired) * 100) : 0;
    const avgRow = db
      .prepare(
        `SELECT AVG(r.response_likert) AS avg
         FROM responses r
         JOIN evaluations e ON e.id = r.evaluation_id
         WHERE r.response_likert IS NOT NULL AND e.status = 'submitted'`,
      )
      .get();
    const avgScore = avgRow.avg ? Number(avgRow.avg.toFixed(2)) : 0;
    const settings = db
      .prepare('SELECT is_active, evaluation_deadline_date FROM platform_settings LIMIT 1')
      .get();
    res.json({
      participation_rate: completionRate,
      avg_score: avgScore,
      submitted_count: submittedCount,
      total_students: totalStudents,
      is_active: settings ? !!settings.is_active : true,
      deadline: settings?.evaluation_deadline_date || null,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
