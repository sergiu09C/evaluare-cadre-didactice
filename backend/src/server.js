require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { checkPlatformActive } = require('./middleware/platformStatus');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
// Pe Railway / reverse-proxy, X-Forwarded-For ne dă IP real (folosit de rate limiter).
app.set('trust proxy', 1);

// Middleware
app.use(helmet()); // Security headers
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    commit: process.env.RAILWAY_GIT_COMMIT_SHA || 'local',
  });
});

// Public stats (no auth) — used by login page brand panel
app.get('/api/public-stats', (req, res, next) => {
  try {
    const { getDatabase } = require('./config/database');
    const db = getDatabase();
    const totalStudents = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='student'").get().n;
    const professorCount = db.prepare('SELECT COUNT(*) AS n FROM professors').get().n;
    const courseCount = db.prepare('SELECT COUNT(*) AS n FROM courses').get().n;
    const totalEvaluations = db.prepare('SELECT COUNT(*) AS n FROM evaluations').get().n;
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
      professor_count: professorCount,
      course_count: courseCount,
      total_evaluations: totalEvaluations,
      is_active: settings ? !!settings.is_active : true,
      deadline: settings?.evaluation_deadline_date || null,
    });
  } catch (e) {
    next(e);
  }
});

// În producție: servim build-ul React static din backend (single-service deploy).
// În dev: frontend rulează separat pe :3000 (Vite dev server) — skip această secțiune.
const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');
const serveFrontend = process.env.SERVE_FRONTEND === 'true' || process.env.NODE_ENV === 'production';
if (serveFrontend && fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  console.log(`📦 Servesc frontend static din ${FRONTEND_DIST}`);
}

// API Routes
app.use('/api/auth', require('./routes/auth'));
// For protected routes: authenticate first, THEN check platform status
app.use('/api/evaluations', authenticateToken, checkPlatformActive, require('./routes/evaluations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/platform', authenticateToken, checkPlatformActive, require('./routes/platform'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/user', require('./routes/user'));
app.use('/api/student', authenticateToken, require('./routes/feedback'));
app.use('/api/professor', require('./routes/professorRoutes'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/closing-the-loop', require('./routes/closingLoop'));
app.use('/api/guides', require('./routes/guides'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/platform-feedback', require('./routes/platformFeedback'));
app.use('/api/actions', require('./routes/actions'));

// Pagina publică de prezentare a platformei (accesibilă fără autentificare).
app.get('/prezentare', (req, res) => {
  const prezentarePath = path.join(FRONTEND_DIST, 'prezentare.html');
  if (fs.existsSync(prezentarePath)) res.sendFile(prezentarePath);
  else res.status(404).send('Pagina de prezentare nu este disponibilă momentan.');
});

// SPA fallback — în producție, orice URL non-/api e routat la index.html
// ca să funcționeze React Router pe deep links (ex. /reset-password?token=...).
if (serveFrontend && fs.existsSync(FRONTEND_DIST)) {
  app.get(/^(?!\/api).*/, (req, res, next) => {
    const indexPath = path.join(FRONTEND_DIST, 'index.html');
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else next();
  });
}

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start reminder scheduler (Cap. 3.3 dizertație, CF-06).
// În dev rulează o dată la 5 minute pentru testabilitate; în prod la fiecare oră.
const { startReminderScheduler } = require('./services/reminderScheduler');
const reminderInterval = process.env.NODE_ENV === 'production' ? 60 * 60 * 1000 : 5 * 60 * 1000;
startReminderScheduler({ intervalMs: reminderInterval });

// Start activation scheduler (D-04 dizertație) — activează/dezactivează automat
// perioadele de evaluare pe baza start_date/end_date din evaluation_periods.
// Rulează orar atât în dev cât și în prod (primul tick la 10s după boot).
const { startActivationScheduler } = require('./services/activationScheduler');
startActivationScheduler({ intervalMs: 60 * 60 * 1000 });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  const { closeDatabase } = require('./config/database');
  closeDatabase();
  process.exit(0);
});

// Pornește server-ul DOAR când e rulat direct (nu importat din bootstrap.js)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
