const { getDatabase } = require('../config/database');

/**
 * Obține lista profesorilor care trebuie evaluați de studentul curent
 * GET /api/evaluations/professors
 */
exports.getProfessorsToEvaluate = (req, res, next) => {
  try {
    const db = getDatabase();
    const studentId = req.user.id;

    // Găsim cursurile la care este înscris studentul (prin grup)
    const professors = db.prepare(`
      SELECT DISTINCT
        p.id,
        p.first_name,
        p.last_name,
        p.title,
        p.department,
        p.type as professor_type,
        c.id as course_id,
        c.name as course_name,
        c.code as course_code,
        c.semester,
        c.academic_year,
        COALESCE(e.id, 0) as evaluation_id,
        COALESCE(e.status, 'not_started') as evaluation_status,
        e.started_at,
        e.submitted_at,
        e.deadline
      FROM users u
      INNER JOIN groups g ON g.id = u.group_id
      INNER JOIN series s ON s.id = g.series_id
      INNER JOIN study_years sy ON sy.id = s.study_year_id
      INNER JOIN courses c ON c.study_year_id = sy.id
      INNER JOIN professors p ON p.id = c.professor_id
      LEFT JOIN evaluations e ON e.student_id = u.id
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
        p.last_name
    `).all(studentId);

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

    if (!courseId || !professorId) {
      return res.status(400).json({ error: 'courseId și professorId sunt obligatorii' });
    }

    // Verificăm dacă există deja o evaluare
    const existing = db.prepare(`
      SELECT id, status FROM evaluations
      WHERE student_id = ? AND course_id = ? AND professor_id = ?
    `).get(studentId, courseId, professorId);

    if (existing) {
      // Dacă e submitted, nu poate fi modificată
      if (existing.status === 'submitted') {
        return res.status(400).json({
          error: 'Evaluarea a fost deja trimisă și nu mai poate fi modificată'
        });
      }

      // Returnează evaluarea existentă (draft)
      return res.json({
        message: 'Evaluare existentă (draft)',
        evaluationId: existing.id,
        status: existing.status
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

    // Total cursuri (perechi profesor-curs) de evaluat
    // Un profesor poate preda mai multe cursuri (ex: Curs + Lab), fiecare trebuie evaluat separat
    const total = db.prepare(`
      SELECT COUNT(*) as count
      FROM users u
      INNER JOIN groups g ON g.id = u.group_id
      INNER JOIN series s ON s.id = g.series_id
      INNER JOIN study_years sy ON sy.id = s.study_year_id
      INNER JOIN courses c ON c.study_year_id = sy.id
      INNER JOIN professors p ON p.id = c.professor_id
      WHERE u.id = ? AND p.is_active = 1
    `).get(studentId);

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

    res.json({
      total: totalCount,
      completed: completedCount,
      draft: draftCount,
      notStarted: notStartedCount,
      completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    });

  } catch (error) {
    next(error);
  }
};
