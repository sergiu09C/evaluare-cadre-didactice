const { getDatabase } = require('../config/database');

/**
 * Verifică dacă platforma acceptă noi evaluări (closure + deadline).
 * Returnează null dacă OK, altfel { status, error }.
 * NU afectează platform_feedback — acela are propriul flux.
 */
function checkPlatformAcceptsEvaluations(db) {
  const settings = db
    .prepare(
      `SELECT is_active, closure_message, evaluation_deadline_enabled,
              evaluation_deadline_date, auto_close_on_deadline
       FROM platform_settings WHERE id = 1`,
    )
    .get();
  if (!settings) return null;
  if (!settings.is_active) {
    return {
      status: 403,
      error: settings.closure_message || 'Platforma de evaluare este închisă.',
      reason: 'platform_closed',
    };
  }
  if (
    settings.evaluation_deadline_enabled &&
    settings.auto_close_on_deadline &&
    settings.evaluation_deadline_date
  ) {
    const deadline = new Date(settings.evaluation_deadline_date).getTime();
    if (!Number.isNaN(deadline) && Date.now() > deadline) {
      return {
        status: 403,
        error: `Termenul-limită pentru evaluări (${settings.evaluation_deadline_date}) a expirat. Mulțumim pentru participare!`,
        reason: 'deadline_passed',
      };
    }
  }
  return null;
}

/**
 * Obține lista profesorilor care trebuie evaluați de studentul curent
 * GET /api/evaluations/professors
 */
exports.getProfessorsToEvaluate = (req, res, next) => {
  try {
    const db = getDatabase();
    const studentId = req.user.id;

    // Anul academic curent — derivat din cea mai recentă valoare existentă
    const currentYearRow = db
      .prepare('SELECT academic_year FROM courses ORDER BY academic_year DESC LIMIT 1')
      .get();
    const currentYear = currentYearRow?.academic_year || '2023-2024';

    // UNIQUE constraint = 1 evaluare per (student, curs, profesor) — granularitate
    // pe disciplină. Dacă un student are 2 cursuri cu același profesor, apar
    // 2 carduri distincte și fiecare se evaluează separat.
    const professors = db
      .prepare(
        `
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.title,
        p.department,
        p.type AS professor_type,
        c.id AS course_id,
        c.name AS course_name,
        c.code AS course_code,
        c.semester,
        c.academic_year,
        c.course_type AS activity_type,
        COALESCE(e.id, 0) AS evaluation_id,
        COALESCE(e.status, 'not_started') AS evaluation_status,
        e.started_at,
        e.submitted_at,
        e.deadline
      FROM users u
      INNER JOIN groups g ON g.id = u.group_id
      INNER JOIN series s ON s.id = g.series_id
      INNER JOIN study_years sy ON sy.id = s.study_year_id
      INNER JOIN courses c ON c.study_year_id = sy.id AND c.academic_year = ?
      INNER JOIN professors p ON p.id = c.professor_id
      LEFT JOIN evaluations e
        ON e.student_id = u.id
        AND e.course_id = c.id
        AND e.professor_id = p.id
      WHERE u.id = ?
        AND p.is_active = 1
      ORDER BY
        CASE
          WHEN e.status IS NULL THEN 1
          WHEN e.status = 'draft' THEN 2
          WHEN e.status = 'submitted' THEN 3
        END,
        p.last_name,
        c.semester,
        c.name
    `,
      )
      .all(currentYear, studentId);

    res.json({
      professors: professors.map(p => ({
        id: p.id,
        name: `${p.title} ${p.first_name} ${p.last_name}`,
        firstName: p.first_name,
        lastName: p.last_name,
        title: p.title,
        department: p.department,
        type: p.professor_type,
        course: {
          id: p.course_id,
          name: p.course_name,
          code: p.course_code,
          semester: p.semester,
          academicYear: p.academic_year
        },
        evaluation: {
          id: p.evaluation_id || null,
          status: p.evaluation_status,
          startedAt: p.started_at,
          submittedAt: p.submitted_at,
          deadline: p.deadline
        }
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Creează o evaluare nouă (draft) sau returnează cea existentă
 * POST /api/evaluations
 * Body: { courseId, professorId }
 */
exports.createEvaluation = (req, res, next) => {
  try {
    const db = getDatabase();
    const studentId = req.user.id;
    const { courseId, professorId } = req.body;

    const blocked = checkPlatformAcceptsEvaluations(db);
    if (blocked) return res.status(blocked.status).json({ error: blocked.error, reason: blocked.reason });

    if (!courseId || !professorId) {
      return res.status(400).json({ error: 'courseId și professorId sunt obligatorii' });
    }

    // UNIQUE constraint = (student_id, course_id, professor_id) — un student
    // evaluează fiecare disciplină distinct (granularitate pe materie).
    const existing = db
      .prepare(
        `
      SELECT id, status FROM evaluations
      WHERE student_id = ? AND course_id = ? AND professor_id = ?
    `,
      )
      .get(studentId, courseId, professorId);

    if (existing) {
      if (existing.status === 'submitted') {
        return res.status(400).json({
          error: 'Ai evaluat deja această disciplină. Fiecare disciplină se evaluează o singură dată.',
        });
      }
      return res.json({
        message: 'Evaluare existentă (draft)',
        evaluationId: existing.id,
        status: existing.status,
      });
    }

    // Creăm evaluare nouă
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 zile

    const result = db.prepare(`
      INSERT INTO evaluations (student_id, course_id, professor_id, status, deadline)
      VALUES (?, ?, ?, 'draft', ?)
    `).run(studentId, courseId, professorId, deadline);

    res.status(201).json({
      message: 'Evaluare creată cu succes',
      evaluationId: result.lastInsertRowid,
      status: 'draft',
      deadline
    });

  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Evaluarea există deja' });
    }
    next(error);
  }
};

/**
 * Obține detaliile unei evaluări împreună cu întrebările
 * GET /api/evaluations/:id
 */
exports.getEvaluation = (req, res, next) => {
  try {
    const db = getDatabase();
    const evaluationId = req.params.id;
    const studentId = req.user.id;

    // Verificăm că evaluarea aparține studentului
    const evaluation = db.prepare(`
      SELECT e.*, p.first_name, p.last_name, p.title, c.name as course_name
      FROM evaluations e
      JOIN professors p ON p.id = e.professor_id
      JOIN courses c ON c.id = e.course_id
      WHERE e.id = ? AND e.student_id = ?
    `).get(evaluationId, studentId);

    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluare negăsită' });
    }

    // Dacă platforma e închisă / deadline depășit, blocăm accesul la draft/not-started.
    // Submitted rămâne vizibil (istoric).
    if (evaluation.status !== 'submitted') {
      const blocked = checkPlatformAcceptsEvaluations(db);
      if (blocked) {
        return res.status(blocked.status).json({ error: blocked.error, reason: blocked.reason });
      }
    }

    // Obținem toate întrebările
    const questions = db.prepare(`
      SELECT id, text, type, category, order_index, is_required
      FROM questions
      WHERE is_active = 1
      ORDER BY order_index
    `).all();

    // Obținem răspunsurile existente
    const responses = db.prepare(`
      SELECT question_id, response_likert, response_text
      FROM responses
      WHERE evaluation_id = ?
    `).all(evaluationId);

    // Map răspunsuri pentru acces rapid
    const responseMap = {};
    responses.forEach(r => {
      responseMap[r.question_id] = {
        likert: r.response_likert,
        text: r.response_text
      };
    });

    res.json({
      evaluation: {
        id: evaluation.id,
        status: evaluation.status,
        deadline: evaluation.deadline,
        startedAt: evaluation.started_at,
        submittedAt: evaluation.submitted_at,
        professor: {
          name: `${evaluation.title} ${evaluation.first_name} ${evaluation.last_name}`,
          title: evaluation.title
        },
        course: {
          name: evaluation.course_name
        }
      },
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        category: q.category,
        isRequired: q.is_required === 1,
        response: responseMap[q.id] || null
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Salvează răspunsuri (draft - auto-save)
 * PUT /api/evaluations/:id/responses
 * Body: { responses: [{ questionId, likert?, text? }] }
 */
exports.saveResponses = (req, res, next) => {
  try {
    const db = getDatabase();
    const evaluationId = req.params.id;
    const studentId = req.user.id;
    const { responses } = req.body;

    const blocked = checkPlatformAcceptsEvaluations(db);
    if (blocked) return res.status(blocked.status).json({ error: blocked.error, reason: blocked.reason });

    // Verificăm că evaluarea aparține studentului și e draft
    const evaluation = db.prepare(`
      SELECT id, status FROM evaluations
      WHERE id = ? AND student_id = ?
    `).get(evaluationId, studentId);

    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluare negăsită' });
    }

    if (evaluation.status === 'submitted') {
      return res.status(400).json({ error: 'Evaluarea a fost deja trimisă și nu mai poate fi modificată' });
    }

    // Salvăm răspunsurile (upsert)
    const upsertResponse = db.prepare(`
      INSERT INTO responses (evaluation_id, question_id, response_likert, response_text, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(evaluation_id, question_id)
      DO UPDATE SET
        response_likert = excluded.response_likert,
        response_text = excluded.response_text,
        updated_at = CURRENT_TIMESTAMP
    `);

    const saveMany = db.transaction((responsesToSave) => {
      for (const r of responsesToSave) {
        upsertResponse.run(
          evaluationId,
          r.questionId,
          r.likert || null,
          r.text || null
        );
      }
    });

    saveMany(responses);

    res.json({
      message: 'Răspunsuri salvate cu succes',
      saved: responses.length
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Trimite evaluarea final (submit)
 * POST /api/evaluations/:id/submit
 */
exports.submitEvaluation = (req, res, next) => {
  try {
    const db = getDatabase();
    const evaluationId = req.params.id;
    const studentId = req.user.id;

    const blocked = checkPlatformAcceptsEvaluations(db);
    if (blocked) return res.status(blocked.status).json({ error: blocked.error, reason: blocked.reason });

    // Verificăm că evaluarea aparține studentului și e draft
    const evaluation = db.prepare(`
      SELECT id, status FROM evaluations
      WHERE id = ? AND student_id = ?
    `).get(evaluationId, studentId);

    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluare negăsită' });
    }

    if (evaluation.status === 'submitted') {
      return res.status(400).json({ error: 'Evaluarea a fost deja trimisă' });
    }

    // Verificăm că toate întrebările obligatorii au răspuns
    const requiredQuestions = db.prepare(`
      SELECT COUNT(*) as count FROM questions
      WHERE is_active = 1 AND is_required = 1
    `).get();

    const answeredRequired = db.prepare(`
      SELECT COUNT(*) as count FROM responses r
      JOIN questions q ON q.id = r.question_id
      WHERE r.evaluation_id = ? AND q.is_required = 1
        AND (r.response_likert IS NOT NULL OR r.response_text IS NOT NULL)
    `).get(evaluationId);

    if (answeredRequired.count < requiredQuestions.count) {
      return res.status(400).json({
        error: 'Toate întrebările obligatorii trebuie completate înainte de trimitere'
      });
    }

    // Marcăm evaluarea ca submitted
    db.prepare(`
      UPDATE evaluations
      SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(evaluationId);

    // Recalcul achievements pentru user (tolerăm eșec dacă tabelul nu există încă)
    try {
      const { recalculateForUser } = require('./achievementsController');
      recalculateForUser(db, studentId);
    } catch (_) { /* opțional */ }

    res.json({
      message: 'Evaluare trimisă cu succes',
      evaluationId,
      status: 'submitted'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obține statusul evaluărilor pentru studentul curent
 * GET /api/evaluations/status
 */
exports.getEvaluationStatus = (req, res, next) => {
  try {
    const db = getDatabase();
    const studentId = req.user.id;

    // Anul academic curent
    const currentYearRow = db
      .prepare('SELECT academic_year FROM courses ORDER BY academic_year DESC LIMIT 1')
      .get();
    const currentYear = currentYearRow?.academic_year || '2023-2024';

    // Total cursuri (perechi profesor-curs) de evaluat — granularitate per disciplină.
    const total = db.prepare(`
      SELECT COUNT(*) as count
      FROM users u
      INNER JOIN groups g ON g.id = u.group_id
      INNER JOIN series s ON s.id = g.series_id
      INNER JOIN study_years sy ON sy.id = s.study_year_id
      INNER JOIN courses c ON c.study_year_id = sy.id AND c.academic_year = ?
      INNER JOIN professors p ON p.id = c.professor_id
      WHERE u.id = ? AND p.is_active = 1
    `).get(currentYear, studentId);

    // Evaluări completate (submitted)
    const completed = db.prepare(`
      SELECT COUNT(*) as count FROM evaluations
      WHERE student_id = ? AND status = 'submitted'
    `).get(studentId);

    // Evaluări în draft (începute dar netrimise)
    const draft = db.prepare(`
      SELECT COUNT(*) as count FROM evaluations
      WHERE student_id = ? AND status = 'draft'
    `).get(studentId);

    const totalCount = total.count || 0;
    const completedCount = completed.count || 0;
    const draftCount = draft.count || 0;
    const notStartedCount = Math.max(0, totalCount - completedCount - draftCount);

    // Breakdown agregat: discipline distincte, cadre didactice unice, defalcare pe tip activitate
    const breakdown = db.prepare(`
      SELECT
        COUNT(DISTINCT c.id) AS discipline,
        COUNT(DISTINCT p.id) AS cadre_didactice_unice,
        SUM(CASE WHEN c.course_type = 'curs' THEN 1 ELSE 0 END) AS cursuri,
        SUM(CASE WHEN c.course_type = 'laborator' THEN 1 ELSE 0 END) AS laboratoare,
        SUM(CASE WHEN c.course_type = 'seminar' THEN 1 ELSE 0 END) AS seminare
      FROM users u
      INNER JOIN groups g ON g.id = u.group_id
      INNER JOIN series s ON s.id = g.series_id
      INNER JOIN study_years sy ON sy.id = s.study_year_id
      INNER JOIN courses c ON c.study_year_id = sy.id AND c.academic_year = ?
      INNER JOIN professors p ON p.id = c.professor_id
      WHERE u.id = ? AND p.is_active = 1
    `).get(currentYear, studentId);

    res.json({
      total: totalCount,
      completed: completedCount,
      draft: draftCount,
      notStarted: notStartedCount,
      completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      breakdown: {
        discipline: breakdown.discipline || 0,
        cadreDidacticeUnice: breakdown.cadre_didactice_unice || 0,
        cursuri: breakdown.cursuri || 0,
        laboratoare: breakdown.laboratoare || 0,
        seminare: breakdown.seminare || 0,
      },
    });

  } catch (error) {
    next(error);
  }
};
