const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const feedbackController = require('../controllers/feedbackController');
const { getDatabase } = require('../config/database');

// GET /api/notifications — role-aware notifications endpoint
router.get('/', authenticateToken, (req, res, next) => {
  const role = req.user?.role;

  // Student: delegate to existing feedback controller (rich notifications)
  if (role === 'student') {
    return feedbackController.getNotifications(req, res, next);
  }

  // Professor: synthesize from recent evaluation submissions
  if (role === 'professor') {
    try {
      const db = getDatabase();
      const profUser = db
        .prepare('SELECT professor_id FROM users WHERE id = ?')
        .get(req.user.id);
      if (!profUser?.professor_id) {
        return res.json({ notifications: [], unreadCount: 0 });
      }
      const recent = db
        .prepare(
          `SELECT e.id, e.submitted_at, c.name as course_name
           FROM evaluations e
           JOIN courses c ON c.id = e.course_id
           WHERE e.professor_id = ? AND e.status = 'submitted'
           ORDER BY e.submitted_at DESC LIMIT 5`,
        )
        .all(profUser.professor_id);
      const notifications = recent.map((r, idx) => ({
        id: `prof-eval-${r.id}`,
        type: 'info',
        title: 'Evaluare nouă primită',
        message: `Un student a completat evaluarea la „${r.course_name}".`,
        actionUrl: '/professor/reports',
        actionText: 'Vezi rapoarte',
        createdAt: r.submitted_at,
        read: idx > 0, // only most recent unread for demo
      }));
      return res.json({
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      });
    } catch (e) {
      return next(e);
    }
  }

  // Admin: synthesize from platform-wide stats (critical professors, low participation)
  if (role === 'admin') {
    try {
      const db = getDatabase();
      const notifications = [];

      // Critical professors (avg score < 2.5)
      const critical = db
        .prepare(
          `SELECT p.id, p.first_name, p.last_name, AVG(r.response_likert) as avg_score
           FROM professors p
           JOIN evaluations e ON e.professor_id = p.id
           JOIN responses r ON r.evaluation_id = e.id
           WHERE e.status = 'submitted'
           GROUP BY p.id
           HAVING avg_score < 2.5
           LIMIT 3`,
        )
        .all();
      critical.forEach((c) => {
        notifications.push({
          id: `admin-critical-${c.id}`,
          type: 'warning',
          title: 'Profesor cu scor critic',
          message: `${c.first_name} ${c.last_name} are media ${c.avg_score.toFixed(2)}. Recomandat: discuție cu șef departament.`,
          actionUrl: `/admin/professor/${c.id}`,
          actionText: 'Vezi detalii',
          createdAt: new Date().toISOString(),
          read: false,
        });
      });

      // Platform info
      const settings = db.prepare('SELECT is_active, closure_message FROM platform_settings LIMIT 1').get();
      if (settings && !settings.is_active) {
        notifications.push({
          id: 'admin-platform-off',
          type: 'error',
          title: 'Platforma este dezactivată',
          message: settings.closure_message || 'Studenții nu pot completa evaluări momentan.',
          actionUrl: '/admin/controls',
          actionText: 'Activează',
          createdAt: new Date().toISOString(),
          read: false,
        });
      }

      return res.json({
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      });
    } catch (e) {
      return next(e);
    }
  }

  res.json({ notifications: [], unreadCount: 0 });
});

module.exports = router;
