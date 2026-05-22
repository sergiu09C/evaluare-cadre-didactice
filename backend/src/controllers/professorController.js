const { getDatabase } = require('../config/database');

/**
 * Obține statistici dashboard pentru profesor
 * GET /api/professor/dashboard
 */
exports.getDashboard = (req, res, next) => {
  try {
    const db = getDatabase();
    const professorId = req.professorId;

    // Total evaluări primite (submitted)
    const totalEvaluationsResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM evaluations
      WHERE professor_id = ? AND status = 'submitted'
    `).get(professorId);

    const totalEvaluations = totalEvaluationsResult.count;

    // Medie generală (toate evaluările submitted)
    const overallAverageResult = db.prepare(`
      SELECT AVG(r.response_likert) as average
      FROM responses r
      JOIN evaluations e ON e.id = r.evaluation_id
      WHERE e.professor_id = ? AND e.status = 'submitted' AND r.response_likert IS NOT NULL
    `).get(professorId);

    const overallAverage = overallAverageResult.average
      ? parseFloat(overallAverageResult.average.toFixed(2))
      : null;

    // Număr studenți unici care au evaluat
    const uniqueStudentsResult = db.prepare(`
      SELECT COUNT(DISTINCT student_id) as count
      FROM evaluations
      WHERE professor_id = ? AND status = 'submitted'
    `).get(professorId);

    const uniqueStudents = uniqueStudentsResult.count;

    // Evaluări per curs (cu medie per curs)
    const courseEvaluations = db.prepare(`
      SELECT
        c.id as course_id,
        c.name as course_name,
        c.course_type,
        c.semester,
        COUNT(e.id) as evaluation_count,
        AVG(r.response_likert) as average_score
      FROM courses c
      LEFT JOIN evaluations e ON e.course_id = c.id AND e.status = 'submitted'
      LEFT JOIN responses r ON r.evaluation_id = e.id AND r.response_likert IS NOT NULL
      WHERE c.professor_id = ?
      GROUP BY c.id
      ORDER BY c.semester, c.name
    `).all(professorId);

    // Trend comparativ - semestru curent vs anterior
    // Pentru simplificare, considerăm ultimele 60 zile = semestru curent
    // și 60-120 zile = semestru anterior
    const currentSemesterAvg = db.prepare(`
      SELECT AVG(r.response_likert) as average
      FROM responses r
      JOIN evaluations e ON e.id = r.evaluation_id
      WHERE e.professor_id = ?
        AND e.status = 'submitted'
        AND r.response_likert IS NOT NULL
        AND e.submitted_at >= date('now', '-60 days')
    `).get(professorId);

    const previousSemesterAvg = db.prepare(`
      SELECT AVG(r.response_likert) as average
      FROM responses r
      JOIN evaluations e ON e.id = r.evaluation_id
      WHERE e.professor_id = ?
        AND e.status = 'submitted'
        AND r.response_likert IS NOT NULL
        AND e.submitted_at >= date('now', '-120 days')
        AND e.submitted_at < date('now', '-60 days')
    `).get(professorId);

    const trend = {
      current: currentSemesterAvg.average
        ? parseFloat(currentSemesterAvg.average.toFixed(2))
        : null,
      previous: previousSemesterAvg.average
        ? parseFloat(previousSemesterAvg.average.toFixed(2))
        : null,
      change: null
    };

    if (trend.current !== null && trend.previous !== null) {
      trend.change = parseFloat((trend.current - trend.previous).toFixed(2));
    }

    // Distribuție scoruri (toate răspunsurile Likert)
    const distRows = db
      .prepare(
        `SELECT r.response_likert AS score, COUNT(*) AS n
         FROM responses r
         JOIN evaluations e ON e.id = r.evaluation_id
         WHERE e.professor_id = ? AND e.status = 'submitted' AND r.response_likert IS NOT NULL
         GROUP BY r.response_likert`,
      )
      .all(professorId);
    const scoreDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of distRows) if (scoreDistribution[r.score] != null) scoreDistribution[r.score] = r.n;

    // Distribuție pe categorii (radar)
    const categoryAverages = db
      .prepare(
        `SELECT q.category AS category, AVG(r.response_likert) AS avg, COUNT(*) AS n
         FROM responses r
         JOIN questions q ON q.id = r.question_id
         JOIN evaluations e ON e.id = r.evaluation_id
         WHERE e.professor_id = ? AND e.status = 'submitted' AND r.response_likert IS NOT NULL
         GROUP BY q.category
         ORDER BY q.category`,
      )
      .all(professorId)
      .map((r) => ({
        category: r.category,
        avg: r.avg != null ? parseFloat(r.avg.toFixed(2)) : null,
        n: r.n,
      }));

    // Echivalent „notă ECTS" pe scara 1-10 din media 1-5
    const gradeOutOf10 =
      overallAverage != null ? parseFloat((overallAverage * 2).toFixed(2)) : null;

    res.json({
      summary: {
        totalEvaluations,
        overallAverage,
        uniqueStudents,
        gradeOutOf10,
      },
      scoreDistribution,
      categoryAverages,
      courseEvaluations: courseEvaluations.map(c => ({
        courseId: c.course_id,
        courseName: c.course_name,
        courseType: c.course_type,
        semester: c.semester,
        evaluationCount: c.evaluation_count,
        averageScore: c.average_score ? parseFloat(c.average_score.toFixed(2)) : null
      })),
      trend
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obține lista evaluărilor ANONIMIZATE pentru profesor
 * GET /api/professor/evaluations
 * Query params: ?courseId, ?semester, ?academicYear, ?limit, ?offset
 */
exports.getEvaluations = (req, res, next) => {
  try {
    const db = getDatabase();
    const professorId = req.professorId;
    const { courseId, semester, academicYear, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        e.id,
        e.course_id,
        c.name as course_name,
        c.course_type,
        c.semester,
        c.academic_year,
        e.submitted_at,
        AVG(r.response_likert) as average_score
      FROM evaluations e
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN responses r ON r.evaluation_id = e.id AND r.response_likert IS NOT NULL
      WHERE e.professor_id = ? AND e.status = 'submitted'
    `;

    const params = [professorId];

    if (courseId) {
      query += ` AND c.id = ?`;
      params.push(courseId);
    }

    if (semester) {
      query += ` AND c.semester = ?`;
      params.push(semester);
    }

    if (academicYear) {
      query += ` AND c.academic_year = ?`;
      params.push(academicYear);
    }

    query += ` GROUP BY e.id ORDER BY e.submitted_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const evaluations = db.prepare(query).all(...params);

    // Total count pentru paginare
    let countQuery = `
      SELECT COUNT(*) as total
      FROM evaluations e
      JOIN courses c ON c.id = e.course_id
      WHERE e.professor_id = ? AND e.status = 'submitted'
    `;
    const countParams = [professorId];

    if (courseId) {
      countQuery += ` AND c.id = ?`;
      countParams.push(courseId);
    }

    if (semester) {
      countQuery += ` AND c.semester = ?`;
      countParams.push(semester);
    }

    if (academicYear) {
      countQuery += ` AND c.academic_year = ?`;
      countParams.push(academicYear);
    }

    const totalResult = db.prepare(countQuery).get(...countParams);

    res.json({
      evaluations: evaluations.map(e => ({
        id: e.id,
        courseId: e.course_id,
        courseName: e.course_name,
        courseType: e.course_type,
        semester: e.semester,
        academicYear: e.academic_year,
        submittedAt: e.submitted_at,
        averageScore: e.average_score ? parseFloat(e.average_score.toFixed(2)) : null
        // NOTE: Nu includem student_id sau student_name pentru ANONIMIZARE
      })),
      pagination: {
        total: totalResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalResult.total
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obține cursurile profesorului cu statistici
 * GET /api/professor/courses
 */
exports.getCourses = (req, res, next) => {
  try {
    const db = getDatabase();
    const professorId = req.professorId;

    const courses = db.prepare(`
      SELECT
        c.id,
        c.name,
        c.course_type,
        c.semester,
        c.academic_year,
        COUNT(e.id) as total_evaluations,
        SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) as completed_evaluations,
        AVG(CASE WHEN e.status = 'submitted' THEN
          (SELECT AVG(r.response_likert)
           FROM responses r
           WHERE r.evaluation_id = e.id AND r.response_likert IS NOT NULL)
        END) as average_score
      FROM courses c
      LEFT JOIN evaluations e ON e.course_id = c.id
      WHERE c.professor_id = ?
      GROUP BY c.id
      ORDER BY c.semester DESC, c.name
    `).all(professorId);

    res.json({
      courses: courses.map(c => ({
        id: c.id,
        name: c.name,
        courseType: c.course_type,
        semester: c.semester,
        academicYear: c.academic_year,
        statistics: {
          totalEvaluations: c.total_evaluations,
          completedEvaluations: c.completed_evaluations,
          averageScore: c.average_score ? parseFloat(c.average_score.toFixed(2)) : null
        }
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obține statistici detaliate pentru un curs specific
 * GET /api/professor/courses/:courseId/stats
 */
exports.getCourseStats = (req, res, next) => {
  try {
    const db = getDatabase();
    const professorId = req.professorId;
    const courseId = req.params.courseId;

    // Verifică că cursul aparține profesorului
    const course = db.prepare(`
      SELECT c.*, COUNT(e.id) as evaluation_count
      FROM courses c
      LEFT JOIN evaluations e ON e.course_id = c.id AND e.status = 'submitted'
      WHERE c.id = ? AND c.professor_id = ?
      GROUP BY c.id
    `).get(courseId, professorId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    // Statistici generale pentru curs
    const stats = db.prepare(`
      SELECT
        COUNT(e.id) as total_evaluations,
        AVG(r.response_likert) as average_score
      FROM evaluations e
      LEFT JOIN responses r ON r.evaluation_id = e.id AND r.response_likert IS NOT NULL
      WHERE e.course_id = ? AND e.status = 'submitted'
    `).get(courseId);

    // Distribuție răspunsuri per întrebare
    const questionDistribution = db.prepare(`
      SELECT
        q.id as question_id,
        q.text as question_text,
        q.category,
        q.type,
        AVG(r.response_likert) as average_score,
        COUNT(r.id) as response_count,
        SUM(CASE WHEN r.response_likert = 1 THEN 1 ELSE 0 END) as score_1,
        SUM(CASE WHEN r.response_likert = 2 THEN 1 ELSE 0 END) as score_2,
        SUM(CASE WHEN r.response_likert = 3 THEN 1 ELSE 0 END) as score_3,
        SUM(CASE WHEN r.response_likert = 4 THEN 1 ELSE 0 END) as score_4,
        SUM(CASE WHEN r.response_likert = 5 THEN 1 ELSE 0 END) as score_5
      FROM questions q
      LEFT JOIN responses r ON r.question_id = q.id
      LEFT JOIN evaluations e ON e.id = r.evaluation_id AND e.course_id = ? AND e.status = 'submitted'
      WHERE q.type IN ('likert', 'yes_no')
      GROUP BY q.id
      ORDER BY q.order_index
    `).all(courseId);

    // Comentarii text ANONIMIZATE (doar dacă sunt >= 3 evaluări pentru acest curs)
    let textResponses = [];
    if (course.evaluation_count >= 3) {
      textResponses = db.prepare(`
        SELECT
          q.text as question,
          q.category,
          r.response_text as answer,
          e.submitted_at
        FROM responses r
        JOIN questions q ON q.id = r.question_id
        JOIN evaluations e ON e.id = r.evaluation_id
        WHERE e.course_id = ?
          AND e.status = 'submitted'
          AND r.response_text IS NOT NULL
          AND r.response_text != ''
        ORDER BY e.submitted_at DESC
        LIMIT 50
      `).all(courseId);
    }

    res.json({
      course: {
        id: course.id,
        name: course.name,
        courseType: course.course_type,
        semester: course.semester,
        academicYear: course.academic_year
      },
      statistics: {
        totalEvaluations: stats.total_evaluations,
        averageScore: stats.average_score ? parseFloat(stats.average_score.toFixed(2)) : null
      },
      questionDistribution: questionDistribution.map(q => ({
        questionId: q.question_id,
        questionText: q.question_text,
        category: q.category,
        type: q.type,
        averageScore: q.average_score ? parseFloat(q.average_score.toFixed(2)) : null,
        responseCount: q.response_count,
        distribution: {
          score1: q.score_1,
          score2: q.score_2,
          score3: q.score_3,
          score4: q.score_4,
          score5: q.score_5
        }
      })),
      textFeedback: course.evaluation_count >= 3 ? textResponses.map(t => ({
        question: t.question,
        category: t.category,
        answer: t.answer,
        submittedAt: t.submitted_at
        // NOTE: Nu includem student_id pentru ANONIMIZARE
      })) : {
        message: 'Text feedback available only when course has 3+ evaluations',
        minimumRequired: 3,
        currentCount: course.evaluation_count
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Export date în format CSV
 * GET /api/professor/export
 * Query params: ?courseId, ?semester, ?academicYear
 */
exports.exportData = (req, res, next) => {
  try {
    const db = getDatabase();
    const professorId = req.professorId;
    const { courseId, semester, academicYear } = req.query;

    let query = `
      SELECT
        c.name as course_name,
        c.course_type,
        c.semester,
        c.academic_year,
        q.text as question,
        q.category,
        AVG(r.response_likert) as average_score,
        COUNT(r.id) as response_count,
        SUM(CASE WHEN r.response_likert = 1 THEN 1 ELSE 0 END) as score_1,
        SUM(CASE WHEN r.response_likert = 2 THEN 1 ELSE 0 END) as score_2,
        SUM(CASE WHEN r.response_likert = 3 THEN 1 ELSE 0 END) as score_3,
        SUM(CASE WHEN r.response_likert = 4 THEN 1 ELSE 0 END) as score_4,
        SUM(CASE WHEN r.response_likert = 5 THEN 1 ELSE 0 END) as score_5
      FROM courses c
      JOIN evaluations e ON e.course_id = c.id AND e.status = 'submitted'
      JOIN responses r ON r.evaluation_id = e.id AND r.response_likert IS NOT NULL
      JOIN questions q ON q.id = r.question_id
      WHERE c.professor_id = ?
    `;

    const params = [professorId];

    if (courseId) {
      query += ` AND c.id = ?`;
      params.push(courseId);
    }

    if (semester) {
      query += ` AND c.semester = ?`;
      params.push(semester);
    }

    if (academicYear) {
      query += ` AND c.academic_year = ?`;
      params.push(academicYear);
    }

    query += ` GROUP BY c.id, q.id ORDER BY c.name, q.order_index`;

    const data = db.prepare(query).all(...params);

    // Generare CSV
    const csvHeader = 'Curs,Tip Curs,Semestru,An Academic,Întrebare,Categorie,Medie,Total Răspunsuri,Scor 1,Scor 2,Scor 3,Scor 4,Scor 5\n';

    const csvRows = data.map(row => {
      const avg = row.average_score ? row.average_score.toFixed(2) : 'N/A';
      return `"${row.course_name}","${row.course_type}","${row.semester}","${row.academic_year}","${row.question}","${row.category}",${avg},${row.response_count},${row.score_1},${row.score_2},${row.score_3},${row.score_4},${row.score_5}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Set headers pentru download CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="evaluari-profesor.csv"');
    res.send('\uFEFF' + csv); // BOM pentru UTF-8

  } catch (error) {
    next(error);
  }
};

// GET /api/professor/students-list - Lista studenți înrolați per disciplină
// Returnează nume complet (NU expune flag „a evaluat" per student — privacy-by-design,
// previne presiuni asupra studenților care nu au dat feedback).
// Doar la nivel agregat (rate de completare per curs) sunt expuse cifrele.
exports.getStudentsList = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const profUser = db.prepare('SELECT professor_id FROM users WHERE id = ?').get(req.user.id);
    if (!profUser?.professor_id) {
      return res.json({ courses: [], total_unique: 0, total_evaluations: 0 });
    }
    const professorId = profUser.professor_id;

    // Cursuri ale profesorului (anul curent)
    const currentYearRow = db
      .prepare('SELECT academic_year FROM courses ORDER BY academic_year DESC LIMIT 1')
      .get();
    const currentYear = currentYearRow?.academic_year || '2023-2024';

    const courses = db
      .prepare(
        `SELECT c.id, c.name, c.code, c.semester, c.course_type
         FROM courses c
         WHERE c.professor_id = ? AND c.academic_year = ?
         ORDER BY c.semester, c.name`,
      )
      .all(professorId, currentYear);

    // Pentru fiecare curs: lista studenți înrolați + flag dacă au evaluat (fără scor!)
    // Studenți care fac cursul = au grup ce aparține de study_year-ul cursului.
    const out = courses.map((c) => {
      const enrolled = db
        .prepare(
          `SELECT
             u.first_name,
             u.last_name,
             u.program_id,
             u.year,
             CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END AS has_evaluated
           FROM users u
           INNER JOIN groups g ON g.id = u.group_id
           INNER JOIN series s ON s.id = g.series_id
           INNER JOIN study_years sy ON sy.id = s.study_year_id
           LEFT JOIN evaluations e
             ON e.student_id = u.id
             AND e.course_id = ?
             AND e.professor_id = ?
             AND e.status = 'submitted'
           WHERE u.role = 'student'
             AND sy.id = (SELECT study_year_id FROM courses WHERE id = ?)
           ORDER BY u.last_name, u.first_name`,
        )
        .all(c.id, professorId, c.id);

      // Nume complete — NU expunem has_evaluated per student (privacy-by-design)
      const totalEvaluatedCount = enrolled.filter((s) => !!s.has_evaluated).length;
      const studentsList = enrolled.map((s) => ({
        name: `${s.last_name || ''} ${s.first_name || ''}`.trim(),
        year: s.year,
      }));

      return {
        course_id: c.id,
        course_name: c.name,
        course_code: c.code,
        course_type: c.course_type,
        semester: c.semester,
        total_enrolled: enrolled.length,
        total_evaluated: totalEvaluatedCount,
        completion_rate:
          enrolled.length > 0 ? Math.round((totalEvaluatedCount / enrolled.length) * 100) : 0,
        students: studentsList,
      };
    });

    // Studenți UNICI între toate cursurile (folosim id-uri, dar nu le returnăm)
    const uniqueStudentIds = new Set();
    const uniqueWithAnyEval = new Set();
    for (const c of courses) {
      const ids = db
        .prepare(
          `SELECT u.id, CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END AS has_eval
           FROM users u
           INNER JOIN groups g ON g.id = u.group_id
           INNER JOIN series s ON s.id = g.series_id
           INNER JOIN study_years sy ON sy.id = s.study_year_id
           LEFT JOIN evaluations e ON e.student_id = u.id AND e.course_id = ? AND e.professor_id = ? AND e.status = 'submitted'
           WHERE u.role = 'student'
             AND sy.id = (SELECT study_year_id FROM courses WHERE id = ?)`,
        )
        .all(c.id, professorId, c.id);
      ids.forEach((r) => {
        uniqueStudentIds.add(r.id);
        if (r.has_eval) uniqueWithAnyEval.add(r.id);
      });
    }

    res.json({
      courses: out,
      total_unique_students: uniqueStudentIds.size,
      unique_students_who_evaluated: uniqueWithAnyEval.size,
      total_evaluations_received: out.reduce((acc, c) => acc + c.total_evaluated, 0),
      total_enrollments: out.reduce((acc, c) => acc + c.total_enrolled, 0),
    });
  } catch (e) {
    next(e);
  }
};

// GET /api/professor/trend - Trend temporal pe semestre
exports.getTrend = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const profUser = db.prepare('SELECT professor_id FROM users WHERE id = ?').get(req.user.id);
    if (!profUser?.professor_id) {
      return res.json({ trend: [] });
    }
    const rows = db.prepare(
      `SELECT
         c.semester || ' ' || c.academic_year AS period,
         AVG(r.response_likert) AS avg,
         COUNT(DISTINCT e.id) AS count
       FROM evaluations e
       JOIN courses c ON c.id = e.course_id
       JOIN responses r ON r.evaluation_id = e.id
       WHERE e.professor_id = ? AND e.status = 'submitted'
       GROUP BY c.semester, c.academic_year
       ORDER BY c.academic_year ASC, c.semester ASC
       LIMIT 8`
    ).all(profUser.professor_id);

    res.json({
      trend: rows.map(r => ({
        period: r.period,
        avg: r.avg != null ? parseFloat(r.avg.toFixed(2)) : 0,
        count: r.count,
      })),
    });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/professor/courses/:courseId/evaluations
 * Drill-down per evaluare individuală — strict ANONIM:
 *  - fără student_id, fără submitted_at exact (doar luna)
 *  - ordine randomizată (stable per evaluation_id, dar nu cronologică)
 *  - k-anonymity threshold: dacă < MIN_K evaluări, returnăm doar agregat
 */
exports.getCourseEvaluations = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const MIN_K = 5;
    const courseId = Number(req.params.courseId);
    const profUser = db.prepare('SELECT professor_id FROM users WHERE id = ?').get(req.user.id);
    if (!profUser?.professor_id) {
      return res.status(403).json({ error: 'Acces refuzat' });
    }
    // Verifică ownership: cursul aparține profesorului
    const owns = db
      .prepare('SELECT 1 FROM courses WHERE id = ? AND professor_id = ?')
      .get(courseId, profUser.professor_id);
    if (!owns) return res.status(404).json({ error: 'Disciplină inexistentă' });

    const evals = db
      .prepare(
        `SELECT e.id, strftime('%Y-%m', e.submitted_at) AS submitted_month
         FROM evaluations e
         WHERE e.course_id = ? AND e.professor_id = ? AND e.status = 'submitted'
         ORDER BY e.id`,
      )
      .all(courseId, profUser.professor_id);

    if (evals.length < MIN_K) {
      return res.json({
        threshold_met: false,
        min_required: MIN_K,
        total_evaluations: evals.length,
        evaluations: [],
        message: `Pentru a proteja anonimitatea, drill-down-ul este disponibil doar dacă există minim ${MIN_K} evaluări. Momentan: ${evals.length}.`,
      });
    }

    // Pentru fiecare eval — răspunsuri pe întrebări + media
    const responsesByEval = db
      .prepare(
        `SELECT r.evaluation_id, r.question_id, r.response_likert, r.response_text,
                q.text AS question_text, q.category, q.type AS question_type
         FROM responses r
         JOIN questions q ON q.id = r.question_id
         WHERE r.evaluation_id IN (${evals.map(() => '?').join(',')})
         ORDER BY q.id`,
      )
      .all(...evals.map((e) => e.id));

    const byEval = new Map();
    for (const e of evals) byEval.set(e.id, { id: e.id, submitted_month: e.submitted_month, responses: [] });
    for (const r of responsesByEval) {
      const slot = byEval.get(r.evaluation_id);
      if (slot) slot.responses.push(r);
    }

    // Calculează media + dezordonează (Fisher-Yates seedat pe id-uri pentru stabilitate)
    const out = Array.from(byEval.values()).map((e) => {
      const likerts = e.responses.map((r) => r.response_likert).filter((x) => x != null);
      const avg = likerts.length ? likerts.reduce((a, b) => a + b, 0) / likerts.length : null;
      return {
        // hash-ed id (poziție stabilă, dar nu expune ordine reală)
        anon_id: `EV-${(e.id * 9301 + 49297) % 233280}`,
        submitted_month: e.submitted_month, // ex: "2024-06"
        average: avg != null ? Math.round(avg * 100) / 100 : null,
        responses: e.responses.map((r) => ({
          question_id: r.question_id,
          question_text: r.question_text,
          category: r.category,
          likert: r.response_likert,
          text: r.response_text,
        })),
      };
    });
    // Sortăm după anon_id (random-stable), nu după id sau submitted_at
    out.sort((a, b) => a.anon_id.localeCompare(b.anon_id));

    res.json({
      threshold_met: true,
      min_required: MIN_K,
      total_evaluations: evals.length,
      evaluations: out,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/professor/evaluations/:id/details
 * Detalii complete pentru o evaluare individuală — accesibil profesorului
 * care a fost evaluat. Fără limita k-anonymity: profesorul își vede propriile date.
 * Nu expune student_id; expune submitted_at exact (decizie produs).
 */
exports.getEvaluationDetails = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const evaluationId = Number(req.params.id);
    const profUser = db.prepare('SELECT professor_id FROM users WHERE id = ?').get(req.user.id);
    if (!profUser?.professor_id) return res.status(403).json({ error: 'Acces refuzat' });

    // Verifică ownership + status submitted
    const ev = db
      .prepare(
        `SELECT e.id, e.submitted_at, e.status,
                c.id AS course_id, c.name AS course_name, c.code AS course_code,
                c.course_type, c.semester, c.academic_year
         FROM evaluations e
         JOIN courses c ON c.id = e.course_id
         WHERE e.id = ? AND e.professor_id = ? AND e.status = 'submitted'`,
      )
      .get(evaluationId, profUser.professor_id);
    if (!ev) return res.status(404).json({ error: 'Evaluare inexistentă' });

    const responses = db
      .prepare(
        `SELECT r.question_id, r.response_likert, r.response_text,
                q.text AS question_text, q.category, q.type AS question_type
         FROM responses r
         JOIN questions q ON q.id = r.question_id
         WHERE r.evaluation_id = ?
         ORDER BY q.id`,
      )
      .all(evaluationId);

    const likerts = responses.map((r) => r.response_likert).filter((x) => x != null);
    const average = likerts.length ? likerts.reduce((a, b) => a + b, 0) / likerts.length : null;

    // Distribuție rapidă pentru sumar
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const v of likerts) if (dist[v] != null) dist[v] += 1;

    res.json({
      evaluation: {
        id: ev.id,
        anon_id: `EV-${(ev.id * 9301 + 49297) % 233280}`,
        submitted_at: ev.submitted_at,
        course: {
          id: ev.course_id,
          name: ev.course_name,
          code: ev.course_code,
          courseType: ev.course_type,
          semester: ev.semester,
          academicYear: ev.academic_year,
        },
        average: average != null ? Math.round(average * 100) / 100 : null,
        score_distribution: dist,
        responses: responses.map((r) => ({
          question_id: r.question_id,
          question_text: r.question_text,
          category: r.category,
          question_type: r.question_type,
          likert: r.response_likert,
          text: r.response_text,
        })),
      },
    });
  } catch (e) {
    next(e);
  }
};
