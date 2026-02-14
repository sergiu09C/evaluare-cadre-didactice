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

    res.json({
      summary: {
        totalEvaluations,
        overallAverage,
        uniqueStudents
      },
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
