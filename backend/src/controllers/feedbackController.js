const { getDatabase } = require('../config/database');

/**
 * GET /api/student/feedback-stats
 * Statistici anonimizate pentru feedback loop
 */
exports.getFeedbackStats = (req, res, next) => {
  try {
    const db = getDatabase();
    const studentId = req.user.id;

    // Get student's program info
    const student = db.prepare(`
      SELECT u.program_id, u.year, p.faculty_id
      FROM users u
      LEFT JOIN programs p ON p.id = u.program_id
      WHERE u.id = ?
    `).get(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Stats per faculty (anonymous)
    const facultyStats = db.prepare(`
      SELECT
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT CASE WHEN e.status = 'submitted' THEN e.student_id END) as active_students,
        COUNT(CASE WHEN e.status = 'submitted' THEN 1 END) as completed_evaluations,
        COUNT(e.id) as total_evaluations
      FROM users u
      LEFT JOIN programs p ON p.id = u.program_id
      LEFT JOIN evaluations e ON e.student_id = u.id
      WHERE p.faculty_id = ? AND u.role = 'student'
    `).get(student.faculty_id);

    const completionRate = facultyStats.total_evaluations > 0
      ? Math.round((facultyStats.completed_evaluations / facultyStats.total_evaluations) * 100)
      : 0;

    // Stats per program (anonymous)
    const programStats = db.prepare(`
      SELECT
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT CASE WHEN e.status = 'submitted' THEN e.student_id END) as active_students
      FROM users u
      LEFT JOIN evaluations e ON e.student_id = u.id AND e.status = 'submitted'
      WHERE u.program_id = ? AND u.year = ?
    `).get(student.program_id, student.year);

    // Global platform stats
    const globalStats = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as total_submitted,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as total_draft,
        COUNT(*) as total_evaluations
      FROM evaluations
    `).get();

    res.json({
      faculty: {
        completionRate,
        activeStudents: facultyStats.active_students,
        totalStudents: facultyStats.total_students,
        message: `${completionRate}% dintre studenții de la facultatea ta au completat evaluările`
      },
      program: {
        activeStudents: programStats.active_students,
        totalStudents: programStats.total_students,
        message: `${programStats.active_students} din ${programStats.total_students} colegi din programul tău au contribuit`
      },
      global: {
        totalSubmitted: globalStats.total_submitted,
        totalDraft: globalStats.total_draft,
        totalEvaluations: globalStats.total_evaluations,
        message: `Peste ${globalStats.total_submitted} evaluări trimise pe platformă!`
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/achievements
 * Badge-uri și achievements câștigate de student
 */
exports.getAchievements = (req, res, next) => {
  try {
    const db = getDatabase();
    const studentId = req.user.id;

    // Check evaluations status
    const evaluations = db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
        MIN(CASE WHEN status = 'submitted' THEN submitted_at END) as first_submission
      FROM evaluations
      WHERE student_id = ?
    `).get(studentId);

    const achievements = [];

    // Badge 1: All Complete
    if (evaluations.completed === evaluations.total && evaluations.total > 0) {
      achievements.push({
        id: 'all_complete',
        title: 'Evaluări Complete',
        description: 'Ai completat toate evaluările atribuite!',
        icon: '🏆',
        earned: true,
        earnedAt: db.prepare(`
          SELECT MAX(submitted_at) as last_submission
          FROM evaluations
          WHERE student_id = ? AND status = 'submitted'
        `).get(studentId).last_submission
      });
    }

    // Badge 2: Early Bird (first in program/year to submit)
    if (evaluations.first_submission) {
      const student = db.prepare(`
        SELECT program_id, year FROM users WHERE id = ?
      `).get(studentId);

      const isEarlyBird = db.prepare(`
        SELECT COUNT(*) as count
        FROM evaluations e
        INNER JOIN users u ON u.id = e.student_id
        WHERE u.program_id = ?
          AND u.year = ?
          AND e.status = 'submitted'
          AND e.submitted_at < ?
      `).get(student.program_id, student.year, evaluations.first_submission).count === 0;

      if (isEarlyBird) {
        achievements.push({
          id: 'early_bird',
          title: 'Pionier',
          description: 'Printre primii din programul tău care au completat o evaluare!',
          icon: '⭐',
          earned: true,
          earnedAt: evaluations.first_submission
        });
      }
    }

    // Badge 3: Fast Responder (completed within 7 days)
    const fastResponses = db.prepare(`
      SELECT COUNT(*) as count
      FROM evaluations
      WHERE student_id = ?
        AND status = 'submitted'
        AND julianday(submitted_at) - julianday(started_at) <= 7
    `).get(studentId).count;

    if (fastResponses >= 5) {
      achievements.push({
        id: 'fast_responder',
        title: 'Răspuns Rapid',
        description: 'Ai completat 5+ evaluări în mai puțin de 7 zile!',
        icon: '⚡',
        earned: true,
        earnedAt: new Date().toISOString()
      });
    }

    // Badge 4: Detailed Feedback (provided text responses)
    const textResponses = db.prepare(`
      SELECT COUNT(*) as count
      FROM responses r
      INNER JOIN evaluations e ON e.id = r.evaluation_id
      INNER JOIN questions q ON q.id = r.question_id
      WHERE e.student_id = ?
        AND q.type = 'text'
        AND LENGTH(r.text_response) > 50
    `).get(studentId).count;

    if (textResponses >= 10) {
      achievements.push({
        id: 'detailed_feedback',
        title: 'Feedback Detaliat',
        description: 'Ai oferit răspunsuri extinse la 10+ întrebări!',
        icon: '📝',
        earned: true,
        earnedAt: new Date().toISOString()
      });
    }

    // Calculate progress towards next badges
    const progress = {
      allComplete: {
        current: evaluations.completed,
        total: evaluations.total,
        percentage: evaluations.total > 0 ? Math.round((evaluations.completed / evaluations.total) * 100) : 0
      },
      fastResponder: {
        current: fastResponses,
        total: 5,
        percentage: Math.round((fastResponses / 5) * 100)
      },
      detailedFeedback: {
        current: textResponses,
        total: 10,
        percentage: Math.round((textResponses / 10) * 100)
      }
    };

    res.json({
      achievements,
      progress,
      totalBadges: achievements.length,
      totalPossible: 4
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/evaluation-history
 * Timeline cu istoricul evaluărilor
 */
exports.getEvaluationHistory = (req, res, next) => {
  try {
    const db = getDatabase();
    const studentId = req.user.id;

    const history = db.prepare(`
      SELECT
        e.id,
        e.status,
        e.started_at,
        e.submitted_at,
        e.deadline,
        p.id as professor_id,
        p.first_name,
        p.last_name,
        p.title,
        p.type as professor_type,
        c.id as course_id,
        c.name as course_name,
        c.code as course_code,
        COUNT(r.id) as responses_count
      FROM evaluations e
      INNER JOIN professors p ON p.id = e.professor_id
      INNER JOIN courses c ON c.id = e.course_id
      LEFT JOIN responses r ON r.evaluation_id = e.id
      WHERE e.student_id = ?
      GROUP BY e.id
      ORDER BY
        CASE
          WHEN e.status = 'draft' THEN 1
          WHEN e.status = 'submitted' THEN 2
        END,
        e.submitted_at DESC,
        e.started_at DESC
    `).all(studentId);

    res.json({
      history: history.map(item => ({
        id: item.id,
        status: item.status,
        startedAt: item.started_at,
        submittedAt: item.submitted_at,
        deadline: item.deadline,
        professor: {
          id: item.professor_id,
          name: `${item.title} ${item.first_name} ${item.last_name}`,
          type: item.professor_type
        },
        course: {
          id: item.course_id,
          name: item.course_name,
          code: item.course_code
        },
        responsesCount: item.responses_count
      })),
      summary: {
        total: history.length,
        submitted: history.filter(h => h.status === 'submitted').length,
        draft: history.filter(h => h.status === 'draft').length
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/notifications
 * Notificări pentru student (reminders, confirmări)
 */
exports.getNotifications = (req, res, next) => {
  try {
    const db = getDatabase();
    const studentId = req.user.id;

    const notifications = [];

    // Check for evaluations nearing deadline
    const nearingDeadline = db.prepare(`
      SELECT
        e.id,
        e.deadline,
        p.first_name,
        p.last_name,
        c.name as course_name,
        julianday(e.deadline) - julianday('now') as days_remaining
      FROM evaluations e
      INNER JOIN professors p ON p.id = e.professor_id
      INNER JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = ?
        AND e.status != 'submitted'
        AND e.deadline IS NOT NULL
        AND julianday(e.deadline) - julianday('now') <= 7
        AND julianday(e.deadline) - julianday('now') > 0
      ORDER BY e.deadline ASC
    `).all(studentId);

    nearingDeadline.forEach(item => {
      const daysRemaining = Math.ceil(item.days_remaining);
      notifications.push({
        id: `deadline_${item.id}`,
        type: 'warning',
        title: 'Deadline aproape!',
        message: `Evaluarea pentru ${item.first_name} ${item.last_name} (${item.course_name}) expiră în ${daysRemaining} ${daysRemaining === 1 ? 'zi' : 'zile'}`,
        actionUrl: `/evaluation/${item.id}`,
        actionText: 'Completează acum',
        createdAt: new Date().toISOString(),
        read: false
      });
    });

    // Check for draft evaluations
    const drafts = db.prepare(`
      SELECT
        e.id,
        p.first_name,
        p.last_name,
        c.name as course_name,
        julianday('now') - julianday(e.started_at) as days_since_started
      FROM evaluations e
      INNER JOIN professors p ON p.id = e.professor_id
      INNER JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = ?
        AND e.status = 'draft'
        AND julianday('now') - julianday(e.started_at) > 3
      ORDER BY e.started_at ASC
      LIMIT 3
    `).all(studentId);

    drafts.forEach(item => {
      const daysSince = Math.ceil(item.days_since_started);
      notifications.push({
        id: `draft_${item.id}`,
        type: 'info',
        title: 'Evaluare în progres',
        message: `Ai început evaluarea pentru ${item.first_name} ${item.last_name} acum ${daysSince} zile. Continuă-o!`,
        actionUrl: `/evaluation/${item.id}`,
        actionText: 'Continuă',
        createdAt: new Date(Date.now() - daysSince * 24 * 60 * 60 * 1000).toISOString(),
        read: false
      });
    });

    // Congratulations for completed evaluations (recent)
    const recentSubmissions = db.prepare(`
      SELECT
        e.id,
        e.submitted_at,
        p.first_name,
        p.last_name,
        c.name as course_name
      FROM evaluations e
      INNER JOIN professors p ON p.id = e.professor_id
      INNER JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = ?
        AND e.status = 'submitted'
        AND julianday('now') - julianday(e.submitted_at) <= 1
      ORDER BY e.submitted_at DESC
      LIMIT 2
    `).all(studentId);

    recentSubmissions.forEach(item => {
      notifications.push({
        id: `success_${item.id}`,
        type: 'success',
        title: 'Evaluare trimisă cu succes!',
        message: `Mulțumim pentru feedback-ul oferit la cursul ${item.course_name}. Contribuția ta este importantă!`,
        actionUrl: '/dashboard',
        actionText: 'Vezi dashboard',
        createdAt: item.submitted_at,
        read: false
      });
    });

    res.json({
      notifications: notifications.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      unreadCount: notifications.filter(n => !n.read).length
    });

  } catch (error) {
    next(error);
  }
};
