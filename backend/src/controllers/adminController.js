const { getDatabase } = require('../config/database');

/**
 * Obține statistici globale de completare
 * GET /api/admin/stats/completion
 * Query params: ?facultyId, ?programId, ?yearId, ?seriesId, ?groupId
 */
exports.getCompletionStats = (req, res, next) => {
  try {
    const db = getDatabase();
    const { facultyId, programId, yearId, seriesId, groupId } = req.query;

    // FIX: după migrarea 017 (anonimitate), e.student_id devine NULL la submit.
    // JOIN-ul prin student_id era stricat → 0 evaluări submitted pe alocuri.
    // Soluție: leg evaluările de structura academică prin courses.study_year_id.
    let query = `
      SELECT
        f.name as faculty_name,
        pr.name as program_name,
        sy.year_number,
        s.name as series_name,
        g.number as group_number,
        COUNT(DISTINCT e.id) as total_evaluations,
        SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN e.status = 'draft' THEN 1 ELSE 0 END) as in_progress,
        ROUND(100.0 * SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) / COUNT(DISTINCT e.id), 2) as completion_rate
      FROM faculties f
      LEFT JOIN programs pr ON pr.faculty_id = f.id
      LEFT JOIN study_years sy ON sy.program_id = pr.id
      LEFT JOIN series s ON s.study_year_id = sy.id
      LEFT JOIN groups g ON g.series_id = s.id
      LEFT JOIN courses c ON c.study_year_id = sy.id
      LEFT JOIN evaluations e ON e.course_id = c.id
      WHERE 1=1
    `;

    const params = [];

    if (facultyId) {
      query += ` AND f.id = ?`;
      params.push(facultyId);
    }
    if (programId) {
      query += ` AND pr.id = ?`;
      params.push(programId);
    }
    if (yearId) {
      query += ` AND sy.id = ?`;
      params.push(yearId);
    }
    if (seriesId) {
      query += ` AND s.id = ?`;
      params.push(seriesId);
    }
    if (groupId) {
      query += ` AND g.id = ?`;
      params.push(groupId);
    }

    query += ` GROUP BY f.id, pr.id, sy.id, s.id, g.id ORDER BY completion_rate DESC`;

    const results = db.prepare(query).all(...params);

    // Calculare statistici globale
    const globalStats = db.prepare(`
      SELECT
        COUNT(DISTINCT e.id) as total_evaluations,
        SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN e.status = 'draft' THEN 1 ELSE 0 END) as in_progress,
        ROUND(100.0 * SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) / COUNT(DISTINCT e.id), 2) as completion_rate
      FROM evaluations e
    `).get();

    res.json({
      global: globalStats,
      breakdown: results
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obține statistici detaliate pentru un profesor
 * GET /api/admin/stats/professor/:id
 */
exports.getProfessorStats = (req, res, next) => {
  try {
    const db = getDatabase();
    const professorId = req.params.id;

    // Informații profesor
    const professor = db.prepare(`
      SELECT p.*, f.name as faculty_name
      FROM professors p
      LEFT JOIN faculties f ON f.id = p.faculty_id
      WHERE p.id = ?
    `).get(professorId);

    if (!professor) {
      return res.status(404).json({ error: 'Profesor negăsit' });
    }

    // Statistici evaluări
    const evalStats = db.prepare(`
      SELECT
        COUNT(DISTINCT e.id) as total_assigned,
        SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN e.status = 'draft' THEN 1 ELSE 0 END) as in_progress,
        ROUND(100.0 * SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) / COUNT(DISTINCT e.id), 2) as completion_rate
      FROM evaluations e
      WHERE e.professor_id = ?
    `).get(professorId);

    // Medii per categorie de întrebări (doar evaluări submitted)
    const categoryAverages = db.prepare(`
      SELECT
        q.category,
        AVG(r.response_likert) as average_score,
        COUNT(*) as response_count
      FROM responses r
      JOIN questions q ON q.id = r.question_id
      JOIN evaluations e ON e.id = r.evaluation_id
      WHERE e.professor_id = ? AND e.status = 'submitted' AND r.response_likert IS NOT NULL
      GROUP BY q.category
    `).all(professorId);

    // Medie generală
    const overallAverage = db.prepare(`
      SELECT AVG(r.response_likert) as overall_average
      FROM responses r
      JOIN evaluations e ON e.id = r.evaluation_id
      WHERE e.professor_id = ? AND e.status = 'submitted' AND r.response_likert IS NOT NULL
    `).get(professorId);

    // Distribuție scoruri (câți au dat 1, 2, 3, 4, 5)
    const scoreDistribution = db.prepare(`
      SELECT
        r.response_likert as score,
        COUNT(*) as count
      FROM responses r
      JOIN evaluations e ON e.id = r.evaluation_id
      WHERE e.professor_id = ? AND e.status = 'submitted' AND r.response_likert IS NOT NULL
      GROUP BY r.response_likert
      ORDER BY r.response_likert
    `).all(professorId);

    // Răspunsuri text (anonime) - max 20 cele mai recente
    const textResponses = db.prepare(`
      SELECT
        q.text as question,
        q.category,
        r.response_text as answer,
        r.created_at
      FROM responses r
      JOIN questions q ON q.id = r.question_id
      JOIN evaluations e ON e.id = r.evaluation_id
      WHERE e.professor_id = ?
        AND e.status = 'submitted'
        AND r.response_text IS NOT NULL
        AND r.response_text != ''
      ORDER BY r.created_at DESC
      LIMIT 20
    `).all(professorId);

    res.json({
      professor: {
        id: professor.id,
        name: `${professor.title} ${professor.first_name} ${professor.last_name}`,
        title: professor.title,
        department: professor.department,
        faculty: professor.faculty_name
      },
      statistics: {
        evaluations: evalStats,
        overallAverage: overallAverage.overall_average ? parseFloat(overallAverage.overall_average.toFixed(2)) : null,
        categoryAverages: categoryAverages.map(c => ({
          category: c.category,
          average: parseFloat(c.average_score.toFixed(2)),
          responseCount: c.response_count
        })),
        scoreDistribution: scoreDistribution.map(s => ({
          score: s.score,
          count: s.count
        }))
      },
      feedback: {
        textResponses: textResponses.map(tr => ({
          question: tr.question,
          category: tr.category,
          answer: tr.answer,
          date: tr.created_at
        }))
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obține lista tuturor profesorilor cu statistici sumare
 * GET /api/admin/professors
 */
exports.getAllProfessors = (req, res, next) => {
  try {
    const db = getDatabase();

    const professors = db.prepare(`
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.title,
        p.department,
        f.name as faculty_name,
        COUNT(DISTINCT e.id) as total_evaluations,
        SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) as completed_evaluations,
        AVG(CASE WHEN e.status = 'submitted' THEN
          (SELECT AVG(r.response_likert)
           FROM responses r
           WHERE r.evaluation_id = e.id AND r.response_likert IS NOT NULL)
        END) as average_score
      FROM professors p
      LEFT JOIN faculties f ON f.id = p.faculty_id
      LEFT JOIN evaluations e ON e.professor_id = p.id
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY p.last_name
    `).all();

    res.json({
      professors: professors.map(p => ({
        id: p.id,
        name: `${p.title} ${p.first_name} ${p.last_name}`,
        title: p.title,
        department: p.department,
        faculty: p.faculty_name,
        stats: {
          totalEvaluations: p.total_evaluations || 0,
          completedEvaluations: p.completed_evaluations || 0,
          averageScore: p.average_score ? parseFloat(p.average_score.toFixed(2)) : null,
          isCritical: p.average_score && p.average_score < 2.5
        }
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obține statistici globale pentru dashboard
 * GET /api/admin/dashboard
 * Query params: ?facultyId, ?level, ?yearNumber
 */
exports.getDashboardStats = (req, res, next) => {
  try {
    const db = getDatabase();
    const { facultyId, level, yearNumber } = req.query;

    // Build filter parameters (will be used differently in each query)
    const filterParams = [];
    const hasFilters = !!(facultyId || level || yearNumber);

    // Total studenți (filtered)
    let studentQuery = `
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      WHERE u.role = 'student' AND u.is_active = 1
    `;
    let studentParams = [];

    if (hasFilters) {
      studentQuery = `
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        LEFT JOIN groups g ON u.group_id = g.id
        LEFT JOIN series s ON g.series_id = s.id
        LEFT JOIN study_years sy ON s.study_year_id = sy.id
        LEFT JOIN programs pr ON sy.program_id = pr.id
        LEFT JOIN faculties f ON pr.faculty_id = f.id
        WHERE u.role = 'student' AND u.is_active = 1
      `;

      if (facultyId) {
        studentQuery += ` AND f.id = ?`;
        studentParams.push(facultyId);
      }
      if (level) {
        studentQuery += ` AND pr.level = ?`;
        studentParams.push(level);
      }
      if (yearNumber) {
        studentQuery += ` AND sy.year_number = ?`;
        studentParams.push(yearNumber);
      }
    }

    const totalStudents = db.prepare(studentQuery).get(...studentParams);

    // Total profesori (filtered)
    let professorQuery = `SELECT COUNT(*) as count FROM professors WHERE is_active = 1`;
    if (facultyId) {
      professorQuery += ` AND faculty_id = ?`;
    }
    const totalProfessors = facultyId
      ? db.prepare(professorQuery).get(facultyId)
      : db.prepare(professorQuery).get();

    // Total evaluări asignate și completate (filtered)
    let evalQuery = `
      SELECT
        COUNT(DISTINCT e.id) as total,
        SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN e.status = 'draft' THEN 1 ELSE 0 END) as in_progress
      FROM evaluations e
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN study_years sy ON c.study_year_id = sy.id
      LEFT JOIN programs pr ON sy.program_id = pr.id
      LEFT JOIN professors prof ON e.professor_id = prof.id
      WHERE 1=1
    `;
    let evalParams = [];

    if (facultyId) {
      evalQuery += ` AND prof.faculty_id = ?`;
      evalParams.push(facultyId);
    }
    if (level) {
      evalQuery += ` AND pr.level = ?`;
      evalParams.push(level);
    }
    if (yearNumber) {
      evalQuery += ` AND sy.year_number = ?`;
      evalParams.push(yearNumber);
    }

    const evaluations = db.prepare(evalQuery).get(...evalParams);

    // Rata de completare globală
    const completionRate = evaluations.total > 0
      ? Math.round((evaluations.completed / evaluations.total) * 100)
      : 0;

    // Top 5 profesori (scoruri cele mai mari) - filtered
    let topProfQuery = `
      SELECT
        prof.id,
        prof.first_name || ' ' || prof.last_name as name,
        AVG(r.response_likert) as avg_score,
        COUNT(DISTINCT e.id) as eval_count
      FROM professors prof
      JOIN evaluations e ON e.professor_id = prof.id AND e.status = 'submitted'
      JOIN responses r ON r.evaluation_id = e.id AND r.response_likert IS NOT NULL
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN study_years sy ON c.study_year_id = sy.id
      LEFT JOIN programs pr ON sy.program_id = pr.id
      WHERE 1=1
    `;
    let topProfParams = [];

    if (facultyId) {
      topProfQuery += ` AND prof.faculty_id = ?`;
      topProfParams.push(facultyId);
    }
    if (level) {
      topProfQuery += ` AND pr.level = ?`;
      topProfParams.push(level);
    }
    if (yearNumber) {
      topProfQuery += ` AND sy.year_number = ?`;
      topProfParams.push(yearNumber);
    }

    topProfQuery += ` GROUP BY prof.id HAVING eval_count >= 3 ORDER BY avg_score DESC LIMIT 5`;
    const topProfessors = db.prepare(topProfQuery).all(...topProfParams);

    // Profesori cu atenție necesară (scoruri <2.5) - filtered
    let criticalProfQuery = `
      SELECT
        prof.id,
        prof.first_name || ' ' || prof.last_name as name,
        AVG(r.response_likert) as avg_score,
        COUNT(DISTINCT e.id) as eval_count
      FROM professors prof
      JOIN evaluations e ON e.professor_id = prof.id AND e.status = 'submitted'
      JOIN responses r ON r.evaluation_id = e.id AND r.response_likert IS NOT NULL
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN study_years sy ON c.study_year_id = sy.id
      LEFT JOIN programs pr ON sy.program_id = pr.id
      WHERE 1=1
    `;
    let criticalProfParams = [];

    if (facultyId) {
      criticalProfQuery += ` AND prof.faculty_id = ?`;
      criticalProfParams.push(facultyId);
    }
    if (level) {
      criticalProfQuery += ` AND pr.level = ?`;
      criticalProfParams.push(level);
    }
    if (yearNumber) {
      criticalProfQuery += ` AND sy.year_number = ?`;
      criticalProfParams.push(yearNumber);
    }

    criticalProfQuery += ` GROUP BY prof.id HAVING avg_score < 2.5 AND eval_count >= 3 ORDER BY avg_score ASC LIMIT 5`;
    const criticalProfessors = db.prepare(criticalProfQuery).all(...criticalProfParams);

    // Rate de completare per facultate - filtered or all
    let facultyQuery = `
      SELECT
        f.name as faculty,
        COUNT(DISTINCT e.id) as total,
        SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) as completed,
        ROUND(100.0 * SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) / COUNT(DISTINCT e.id), 1) as rate
      FROM faculties f
      LEFT JOIN programs pr ON pr.faculty_id = f.id
      LEFT JOIN study_years sy ON sy.program_id = pr.id
      LEFT JOIN courses c ON c.study_year_id = sy.id
      LEFT JOIN evaluations e ON e.course_id = c.id
      WHERE 1=1
    `;

    // Apply level and year filters if present
    const facultyParams = [];
    if (level) {
      facultyQuery += ` AND pr.level = ?`;
      facultyParams.push(level);
    }
    if (yearNumber) {
      facultyQuery += ` AND sy.year_number = ?`;
      facultyParams.push(yearNumber);
    }
    if (facultyId) {
      facultyQuery += ` AND f.id = ?`;
      facultyParams.push(facultyId);
    }

    facultyQuery += ` GROUP BY f.id HAVING total > 0 ORDER BY rate DESC`;
    const facultyRates = db.prepare(facultyQuery).all(...facultyParams);

    // Completion trend over last 30 days - filtered
    let trendQuery = `
      SELECT
        DATE(e.submitted_at) as date,
        COUNT(*) as completed
      FROM evaluations e
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN study_years sy ON c.study_year_id = sy.id
      LEFT JOIN programs pr ON sy.program_id = pr.id
      LEFT JOIN professors prof ON e.professor_id = prof.id
      WHERE e.status = 'submitted'
        AND e.submitted_at >= date('now', '-30 days')
    `;
    let trendParams = [];

    if (facultyId) {
      trendQuery += ` AND prof.faculty_id = ?`;
      trendParams.push(facultyId);
    }
    if (level) {
      trendQuery += ` AND pr.level = ?`;
      trendParams.push(level);
    }
    if (yearNumber) {
      trendQuery += ` AND sy.year_number = ?`;
      trendParams.push(yearNumber);
    }

    trendQuery += ` GROUP BY DATE(e.submitted_at) ORDER BY DATE(e.submitted_at)`;
    const completionTrend = db.prepare(trendQuery).all(...trendParams);

    // Score distribution (1-5 ratings) - filtered
    let scoreQuery = `
      SELECT
        r.response_likert as score,
        COUNT(*) as count
      FROM responses r
      JOIN evaluations e ON e.id = r.evaluation_id
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN study_years sy ON c.study_year_id = sy.id
      LEFT JOIN programs pr ON sy.program_id = pr.id
      LEFT JOIN professors prof ON e.professor_id = prof.id
      WHERE e.status = 'submitted' AND r.response_likert IS NOT NULL
    `;
    let scoreParams = [];

    if (facultyId) {
      scoreQuery += ` AND prof.faculty_id = ?`;
      scoreParams.push(facultyId);
    }
    if (level) {
      scoreQuery += ` AND pr.level = ?`;
      scoreParams.push(level);
    }
    if (yearNumber) {
      scoreQuery += ` AND sy.year_number = ?`;
      scoreParams.push(yearNumber);
    }

    scoreQuery += ` GROUP BY r.response_likert ORDER BY r.response_likert`;
    const scoreDistribution = db.prepare(scoreQuery).all(...scoreParams);

    res.json({
      overview: {
        totalStudents: totalStudents.count,
        totalProfessors: totalProfessors.count,
        totalEvaluations: evaluations.total,
        completedEvaluations: evaluations.completed,
        inProgressEvaluations: evaluations.in_progress,
        completionRate
      },
      topPerformers: topProfessors.map(p => ({
        id: p.id,
        name: p.name,
        averageScore: parseFloat(p.avg_score.toFixed(2)),
        evaluationCount: p.eval_count
      })),
      needsAttention: criticalProfessors.map(p => ({
        id: p.id,
        name: p.name,
        averageScore: parseFloat(p.avg_score.toFixed(2)),
        evaluationCount: p.eval_count
      })),
      facultyCompletion: facultyRates.map(f => ({
        faculty: f.faculty,
        total: f.total,
        completed: f.completed,
        completionRate: f.rate
      })),
      completionTrend: completionTrend.map(t => ({
        date: t.date,
        completed: t.completed,
        total: t.total
      })),
      scoreDistribution: scoreDistribution.map(s => ({
        name: `Scor ${s.score}`,
        value: s.count
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get filtered statistics with advanced filters
 * Supports filtering by: faculty, level (licenta/master), year, course_type, semester
 */
exports.getFilteredStats = (req, res, next) => {
  try {
    const { facultyId, level, yearNumber, courseType, semester } = req.query;

    const db = getDatabase();

    let query = `
      SELECT
        f.name as faculty_name,
        p.name as program_name,
        p.level,
        sy.year_number,
        c.course_type,
        c.semester,
        COUNT(DISTINCT e.id) as total_evaluations,
        SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) as completed,
        ROUND(100.0 * SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) / COUNT(DISTINCT e.id), 2) as completion_rate,
        AVG(CASE WHEN e.status = 'submitted' THEN
          (SELECT AVG(r.response_likert)
           FROM responses r
           WHERE r.evaluation_id = e.id AND r.response_likert IS NOT NULL)
        END) as average_score
      FROM faculties f
      INNER JOIN programs p ON p.faculty_id = f.id
      INNER JOIN study_years sy ON sy.program_id = p.id
      INNER JOIN courses c ON c.study_year_id = sy.id
      LEFT JOIN evaluations e ON e.course_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (facultyId) {
      query += ` AND f.id = ?`;
      params.push(facultyId);
    }

    if (level) {
      query += ` AND p.level = ?`;
      params.push(level);
    }

    if (yearNumber) {
      query += ` AND sy.year_number = ?`;
      params.push(yearNumber);
    }

    if (courseType) {
      query += ` AND c.course_type = ?`;
      params.push(courseType);
    }

    if (semester) {
      query += ` AND c.semester = ?`;
      params.push(semester);
    }

    query += ` GROUP BY f.id, p.id, sy.id, c.course_type, c.semester ORDER BY f.name, p.level, sy.year_number`;

    const stats = db.prepare(query).all(...params);

    res.json({
      filters: { facultyId, level, yearNumber, courseType, semester },
      stats: stats.map(s => ({
        ...s,
        average_score: s.average_score ? parseFloat(s.average_score.toFixed(2)) : null,
        level: s.level
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get statistics for same discipline taught by different professors
 * Groups by course name to compare different professors teaching the same subject
 */
exports.getDisciplineComparison = (req, res, next) => {
  try {
    const { courseName, facultyId } = req.query;

    if (!courseName) {
      return res.status(400).json({ error: 'courseName query parameter este obligatoriu' });
    }

    const db = getDatabase();

    let query = `
      SELECT
        c.name as course_name,
        c.course_type,
        p.first_name || ' ' || p.last_name as professor_name,
        p.title as professor_title,
        p.department,
        f.name as faculty_name,
        COUNT(DISTINCT e.id) as total_evaluations,
        SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) as completed,
        ROUND(100.0 * SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) / COUNT(DISTINCT e.id), 2) as completion_rate,
        AVG(CASE WHEN e.status = 'submitted' THEN
          (SELECT AVG(r.response_likert)
           FROM responses r
           WHERE r.evaluation_id = e.id AND r.response_likert IS NOT NULL)
        END) as average_score
      FROM courses c
      INNER JOIN professors p ON c.professor_id = p.id
      INNER JOIN faculties f ON p.faculty_id = f.id
      LEFT JOIN evaluations e ON e.course_id = c.id
      WHERE c.name = ?
    `;
    const params = [courseName];

    if (facultyId) {
      query += ` AND f.id = ?`;
      params.push(facultyId);
    }

    query += ` GROUP BY c.id, p.id ORDER BY average_score DESC`;

    const comparisons = db.prepare(query).all(...params);

    res.json({
      courseName,
      facultyId: facultyId || 'all',
      comparisons: comparisons.map(c => ({
        ...c,
        average_score: c.average_score ? parseFloat(c.average_score.toFixed(2)) : null
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get list of all unique course names (for discipline comparison dropdown)
 */
exports.getCourseNames = (req, res, next) => {
  try {
    const db = getDatabase();

    const courses = db.prepare(`
      SELECT DISTINCT name, COUNT(*) as professor_count
      FROM courses
      GROUP BY name
      HAVING COUNT(*) > 1
      ORDER BY name
    `).all();

    res.json({
      courses: courses.map(c => ({
        name: c.name,
        professorCount: c.professor_count
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get year-based statistics with cross-filtering
 * Shows completion rates and scores by year, filterable by faculty and level
 */
exports.getYearStats = (req, res, next) => {
  try {
    const { facultyId, level } = req.query;

    const db = getDatabase();

    // FIX: după migrarea 017 (anonimitate), e.student_id devine NULL la submit.
    // Leg evaluări de structura academică prin courses.study_year_id (nu prin user).
    let query = `
      SELECT
        f.name as faculty_name,
        p.level,
        sy.year_number,
        (SELECT COUNT(DISTINCT u.id) FROM users u
           JOIN groups g ON g.id = u.group_id
           JOIN series s ON s.id = g.series_id
           WHERE s.study_year_id = sy.id AND u.role = 'student') as total_students,
        COUNT(DISTINCT e.id) as total_evaluations,
        SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) as completed,
        ROUND(100.0 * SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) / NULLIF(COUNT(DISTINCT e.id), 0), 2) as completion_rate,
        AVG(CASE WHEN e.status = 'submitted' THEN
          (SELECT AVG(r.response_likert)
           FROM responses r
           WHERE r.evaluation_id = e.id AND r.response_likert IS NOT NULL)
        END) as average_score
      FROM faculties f
      INNER JOIN programs p ON p.faculty_id = f.id
      INNER JOIN study_years sy ON sy.program_id = p.id
      LEFT JOIN courses c ON c.study_year_id = sy.id
      LEFT JOIN evaluations e ON e.course_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (facultyId) {
      query += ` AND f.id = ?`;
      params.push(facultyId);
    }

    if (level) {
      query += ` AND p.level = ?`;
      params.push(level);
    }

    query += ` GROUP BY f.id, p.level, sy.year_number ORDER BY f.name, p.level, sy.year_number`;

    const stats = db.prepare(query).all(...params);

    res.json({
      filters: { facultyId, level },
      stats: stats.map(s => ({
        ...s,
        average_score: s.average_score ? parseFloat(s.average_score.toFixed(2)) : null
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get filter options for dashboard (faculties, levels, years)
 * GET /api/admin/filter-options
 */
exports.getFilterOptions = (req, res, next) => {
  try {
    const db = getDatabase();

    const faculties = db.prepare('SELECT id, name FROM faculties ORDER BY name').all();
    const levels = ['licenta', 'master', 'doctorat'];
    const years = [1, 2, 3, 4];
    const courseTypes = ['curs', 'laborator', 'seminar'];

    res.json({
      faculties: faculties.map(f => ({ id: f.id, name: f.name })),
      levels,
      years,
      courseTypes
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get course type distribution and statistics
 * Shows comparison between curs, laborator, seminar
 */
exports.getCourseTypeStats = (req, res, next) => {
  try {
    const { facultyId, yearNumber } = req.query;

    const db = getDatabase();

    let query = `
      SELECT
        c.course_type,
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT e.id) as total_evaluations,
        SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) as completed,
        ROUND(100.0 * SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) / COUNT(DISTINCT e.id), 2) as completion_rate,
        AVG(CASE WHEN e.status = 'submitted' THEN
          (SELECT AVG(r.response_likert)
           FROM responses r
           WHERE r.evaluation_id = e.id AND r.response_likert IS NOT NULL)
        END) as average_score
      FROM courses c
      INNER JOIN study_years sy ON c.study_year_id = sy.id
      INNER JOIN programs p ON sy.program_id = p.id
      LEFT JOIN evaluations e ON e.course_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (facultyId) {
      query += ` AND p.faculty_id = ?`;
      params.push(facultyId);
    }

    if (yearNumber) {
      query += ` AND sy.year_number = ?`;
      params.push(yearNumber);
    }

    query += ` GROUP BY c.course_type ORDER BY c.course_type`;

    const stats = db.prepare(query).all(...params);

    res.json({
      filters: { facultyId, yearNumber },
      stats: stats.map(s => ({
        ...s,
        average_score: s.average_score ? parseFloat(s.average_score.toFixed(2)) : null
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/export/aracis  (endpoint păstrat ca alias; sintagma scoasă din UI)
 * Export agregat instituțional (CSV; UTF-8 cu BOM).
 */
exports.exportAracis = (req, res, next) => {
  try {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT
        f.id AS faculty_id, f.name AS faculty,
        pr.id AS program_id, pr.name AS program, pr.level AS level,
        sy.id AS sy_id, sy.year_number AS year,
        (SELECT COUNT(DISTINCT p.id) FROM professors p
         JOIN courses c2 ON c2.professor_id = p.id WHERE c2.study_year_id = sy.id) AS profesori,
        (SELECT COUNT(DISTINCT u.id) FROM users u
         JOIN groups g ON g.id = u.group_id
         JOIN series s ON s.id = g.series_id
         WHERE u.role='student' AND u.is_active=1 AND s.study_year_id = sy.id) AS studenti,
        (SELECT COUNT(*) FROM evaluations e
         JOIN courses c2 ON c2.id = e.course_id
         WHERE c2.study_year_id = sy.id AND e.status='submitted') AS evaluari,
        (
          (SELECT COUNT(*) FROM courses c2 WHERE c2.study_year_id = sy.id) *
          (SELECT COUNT(DISTINCT u.id) FROM users u
           JOIN groups g ON g.id = u.group_id
           JOIN series s ON s.id = g.series_id
           WHERE u.role='student' AND u.is_active=1 AND s.study_year_id = sy.id)
        ) AS evaluari_max,
        (SELECT AVG(r.response_likert) FROM responses r
         JOIN evaluations e ON e.id = r.evaluation_id
         JOIN courses c2 ON c2.id = e.course_id
         WHERE c2.study_year_id = sy.id AND e.status='submitted' AND r.response_likert IS NOT NULL) AS scor_mediu
      FROM faculties f
      JOIN programs pr ON pr.faculty_id = f.id
      JOIN study_years sy ON sy.program_id = pr.id
      ORDER BY f.name, pr.name, sy.year_number
    `).all();

    const catAvg = db.prepare(`
      SELECT q.category AS cat, AVG(r.response_likert) AS avg
      FROM responses r
      JOIN evaluations e ON e.id = r.evaluation_id
      JOIN courses c ON c.id = e.course_id
      JOIN questions q ON q.id = r.question_id
      WHERE c.study_year_id = ? AND e.status='submitted' AND r.response_likert IS NOT NULL
      GROUP BY q.category
    `);

    const header = [
      'Facultate', 'Program', 'Nivel', 'An',
      'Cadre_didactice', 'Studenti', 'Evaluari_completate', 'Evaluari_max',
      'Rata_completare_%', 'Scor_mediu_/5',
      'Didactica_/5', 'Comunicare_/5', 'Organizare_/5', 'Angajament_/5', 'General_/5',
    ];
    const lines = [header.join(',')];

    for (const r of rows) {
      const catRows = catAvg.all(r.sy_id);
      const catMap = Object.fromEntries(catRows.map((c) => [c.cat, c.avg]));
      const rata = r.evaluari_max > 0 ? Math.round((r.evaluari / r.evaluari_max) * 100) : 0;
      const fmt = (v) => (v == null ? '' : Number(v).toFixed(2));
      const cells = [
        `"${(r.faculty || '').replace(/"/g, '""')}"`,
        `"${(r.program || '').replace(/"/g, '""')}"`,
        r.level || '',
        r.year,
        r.profesori,
        r.studenti,
        r.evaluari,
        r.evaluari_max,
        rata,
        fmt(r.scor_mediu),
        fmt(catMap['didactica']),
        fmt(catMap['comunicare']),
        fmt(catMap['organizare']),
        fmt(catMap['angajament']),
        fmt(catMap['general']),
      ];
      lines.push(cells.join(','));
    }
    const csv = lines.join('\n');
    const filename = `export-evaluari-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('﻿' + csv);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/kpis — cei 15 KPI structurați (P1-P5 process, O1-O5 output, I1-I5 impact)
 * conform Tabel 3.2 din dizertație.
 */
exports.getKPIs = (req, res, next) => {
  try {
    const db = getDatabase();

    // === Process KPIs ===
    // P1: Rată completare evaluări = #submitted / #create
    // (aliniat cu indicatorul din admin/reports — sursă unică de adevăr)
    const totalEvals = db.prepare(
      "SELECT COUNT(*) AS n FROM evaluations"
    ).get().n;
    const submittedEvals = db.prepare(
      "SELECT COUNT(*) AS n FROM evaluations WHERE status='submitted'"
    ).get().n;
    const p1 = totalEvals > 0 ? Math.round((submittedEvals / totalEvals) * 100) : 0;

    // P2: Timp mediu completare per chestionar (în minute)
    const avgTime = db.prepare(`
      SELECT AVG((julianday(submitted_at) - julianday(started_at)) * 24 * 60) AS avg_min
      FROM evaluations
      WHERE status='submitted' AND submitted_at IS NOT NULL AND started_at IS NOT NULL
        AND submitted_at > started_at
    `).get().avg_min;

    // P3: Rată cursuri activate (cu cel puțin 1 evaluare existentă)
    const totalCourses = db.prepare("SELECT COUNT(*) AS n FROM courses").get().n;
    const activatedCourses = db.prepare(
      "SELECT COUNT(DISTINCT course_id) AS n FROM evaluations"
    ).get().n;
    const p3 = totalCourses > 0 ? Math.round((activatedCourses / totalCourses) * 100) : 0;

    // P4: % cursuri valide (≥5 răspunsuri submitted)
    const validCourses = db.prepare(`
      SELECT COUNT(*) AS n FROM (
        SELECT course_id, COUNT(*) AS n FROM evaluations
        WHERE status='submitted' GROUP BY course_id HAVING n >= 5
      )
    `).get().n;
    const p4 = activatedCourses > 0 ? Math.round((validCourses / activatedCourses) * 100) : 0;

    // P5: Uptime — în dev citim 99.95% ca placeholder; în prod cere monitor extern
    const p5 = 99.95;

    // === Output KPIs ===
    // O1: Scor global instituțional (medie pe Likert din D1-D5)
    const o1 = db.prepare(`
      SELECT AVG(r.response_likert) AS avg FROM responses r
      JOIN questions q ON q.id = r.question_id
      WHERE r.response_likert IS NOT NULL AND q.dimension IN ('D1','D2','D3','D4','D5')
    `).get().avg;

    // O2: Scor mediu pe fiecare dimensiune D1-D5
    const o2 = db.prepare(`
      SELECT q.dimension, AVG(r.response_likert) AS avg
      FROM responses r JOIN questions q ON q.id = r.question_id
      WHERE r.response_likert IS NOT NULL AND q.dimension IN ('D1','D2','D3','D4','D5')
      GROUP BY q.dimension ORDER BY q.dimension
    `).all();

    // O3: % cadre cu scor < 2.5 (alertă roșie)
    const profsScored = db.prepare(`
      SELECT p.id, AVG(r.response_likert) AS avg
      FROM professors p
      JOIN evaluations e ON e.professor_id = p.id
      JOIN responses r ON r.evaluation_id = e.id
      WHERE e.status='submitted' AND r.response_likert IS NOT NULL
      GROUP BY p.id
    `).all();
    const totalProfsScored = profsScored.length;
    const alertRed = profsScored.filter((p) => p.avg < 2.5).length;
    const o3 = totalProfsScored > 0 ? Math.round((alertRed / totalProfsScored) * 100) : 0;

    // O4: % cadre 2.5-3.5 (alertă galbenă)
    const alertYellow = profsScored.filter((p) => p.avg >= 2.5 && p.avg < 3.5).length;
    const o4 = totalProfsScored > 0 ? Math.round((alertYellow / totalProfsScored) * 100) : 0;

    // O5: Deviația standard a scorurilor profesorilor
    let o5 = null;
    if (totalProfsScored > 1) {
      const mean = profsScored.reduce((s, p) => s + p.avg, 0) / totalProfsScored;
      const variance = profsScored.reduce((s, p) => s + Math.pow(p.avg - mean, 2), 0) / totalProfsScored;
      o5 = Math.sqrt(variance);
    }

    // === Impact KPIs ===
    // I1: Δ rată participare (semestru curent vs anterior)
    // simplificat: comparăm cu o valoare baseline derivată din academic_year
    const i1 = null; // necesită istoric multi-semestre; placeholder pentru pilot Sem. II

    // I2: Δ scor global
    const i2 = null;

    // I3: Timp raportare (zile între închiderea colectării și disponibilitatea rapoartelor)
    // În aplicație rapoartele sunt disponibile imediat; valoare reală = 0 zile (real-time)
    const i3 = 0;

    // I4: Timp closing-the-loop (zile între închidere și publicarea acțiunilor)
    const ctlLatest = db.prepare(`
      SELECT created_at FROM closing_loop_entries
      WHERE is_published = 1 ORDER BY created_at DESC LIMIT 1
    `).get();
    const lastSubmission = db.prepare(
      "SELECT MAX(submitted_at) AS ts FROM evaluations WHERE status='submitted'"
    ).get().ts;
    let i4 = null;
    if (ctlLatest && lastSubmission) {
      const diff = (new Date(ctlLatest.created_at) - new Date(lastSubmission)) / (1000 * 60 * 60 * 24);
      i4 = Math.max(0, Math.round(diff));
    }

    // I5: Satisfacție studenți cu procesul (din feedback platformă)
    const i5 = db.prepare(`
      SELECT AVG(response_likert) AS avg FROM platform_feedback_responses
      WHERE response_likert IS NOT NULL
    `).get().avg;

    res.json({
      process: {
        P1: {
          value: p1, unit: '%', targetMin: 50, targetMax: 70,
          label: 'Rată completare evaluări',
          description: 'Procentul evaluărilor create care au fost efectiv completate de studenți. Sursă unică de adevăr cu raportul Rapoarte → Panorama Generală.',
          formula: 'evaluări cu status=submitted / total evaluări create',
        },
        P2: {
          value: avgTime ? Number(avgTime.toFixed(1)) : null, unit: 'min', targetMin: 3, targetMax: 5,
          label: 'Timp mediu de răspuns',
          description: 'Cât durează în medie un student să completeze un chestionar (19 itemi Likert + 3 context + 1 comentariu).',
          formula: 'Σ (submitted_at − started_at) / număr evaluări',
        },
        P3: {
          value: p3, unit: '%', target: 100,
          label: 'Acoperire cursuri',
          description: 'Procentul cursurilor active din semestru care au cel puțin o evaluare creată (chiar dacă nu completată).',
          formula: 'cursuri cu ≥1 evaluare / total cursuri active',
        },
        P4: {
          value: p4, unit: '%', target: 90,
          label: 'Eșantion valid (≥5 răspunsuri)',
          description: 'Procentul cursurilor care au strâns suficiente răspunsuri pentru ca scorul să fie statistic credibil (prag minim acceptat: 5 răspunsuri).',
          formula: 'cursuri cu ≥5 răspunsuri submitted / total cursuri active',
        },
        P5: {
          value: p5, unit: '%', target: 99.5,
          label: 'Disponibilitate platformă',
          description: 'Procentul de timp în care aplicația a funcționat fără întreruperi (uptime).',
          formula: 'În producție: monitor extern. În dev: placeholder 99.95%.',
        },
      },
      output: {
        O1: {
          value: o1 ? Number(o1.toFixed(2)) : null, unit: '/5', target: 3.70,
          label: 'Scor mediu universitate',
          description: 'Media tuturor scorurilor Likert (1-5) date de studenți pe toate dimensiunile, întreaga universitate.',
          formula: 'Σ scoruri / număr răspunsuri Likert',
        },
        O2: {
          value: o2.map((d) => ({ dim: d.dimension, avg: d.avg ? Number(d.avg.toFixed(2)) : null })), target: 3.50,
          label: 'Scor mediu per dimensiune',
          description: 'Media pe fiecare dintre cele 5 dimensiuni: D1 Predare, D2 Comunicare, D3 Resurse, D4 Feedback, D5 Disponibilitate.',
          formula: 'Σ scoruri pe dim / număr răspunsuri pe dim',
        },
        O3: {
          value: o3, unit: '%', target: 10, targetDirection: 'less',
          label: 'Cadre cu scor critic (<2.5/5)',
          description: 'Procentul cadrelor didactice cu scor mediu sub 2.5, care necesită intervenție imediată (mentorat, formare, audit).',
          formula: 'cadre cu medie <2.5 / total cadre evaluate',
        },
        O4: {
          value: o4, unit: '%', target: 20, targetDirection: 'less',
          label: 'Cadre cu scor mediu (2.5-3.5/5)',
          description: 'Procentul cadrelor cu performanță acceptabilă dar îmbunătățibilă — candidate pentru plan de dezvoltare.',
          formula: 'cadre cu medie 2.5-3.5 / total cadre evaluate',
        },
        O5: {
          value: o5 ? Number(o5.toFixed(2)) : null, unit: '', target: 0.8, targetDirection: 'less',
          label: 'Variabilitate scoruri cadre',
          description: 'Deviația standard a scorurilor medii pe profesori. Mică = scoruri apropiate (omogenitate). Mare = variație puternică între cadre.',
          formula: 'σ(scoruri medii per profesor)',
        },
      },
      impact: {
        I1: {
          value: i1, unit: 'pp', target: 5,
          label: 'Creștere participare vs. sem. anterior',
          description: 'Diferența în puncte procentuale între rata participării din acest semestru și cea din semestrul anterior.',
          formula: 'P1(semestru curent) − P1(semestru anterior)',
        },
        I2: {
          value: i2, unit: '', target: 0, targetDirection: 'gte',
          label: 'Variație scor global',
          description: 'Schimbarea scorului mediu instituțional față de semestrul anterior. Pozitiv = îmbunătățire.',
          formula: 'O1(semestru curent) − O1(semestru anterior)',
        },
        I3: {
          value: i3, unit: 'zile', target: 14, targetDirection: 'less',
          label: 'Timp publicare rapoarte',
          description: 'Numărul de zile între închiderea perioadei de evaluare și momentul când profesorii primesc rapoartele agregate.',
          formula: 'data publicare − data închidere colectare',
        },
        I4: {
          value: i4, unit: 'zile', target: 35, targetDirection: 'less',
          label: 'Timp închiderea buclei (You Said / We Did)',
          description: 'Numărul de zile între închiderea colectării și momentul când universitatea publică acțiunile concrete în răspuns la feedback (closing-the-loop).',
          formula: 'data publicare acțiuni − data închidere colectare',
        },
        I5: {
          value: i5 ? Number(i5.toFixed(2)) : null, unit: '/5', target: 4.0,
          label: 'Satisfacție cu procesul de evaluare',
          description: 'Cât de mulțumiți sunt studenții cu însuși mecanismul de evaluare (chestionar separat post-completare).',
          formula: 'media răspunsurilor feedback platformă (1-5)',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/audit-log — listare audit log pentru CEAC
 */
exports.listAuditLog = (req, res, next) => {
  try {
    const db = getDatabase();
    const limit = Math.min(500, parseInt(req.query.limit) || 100);
    const offset = parseInt(req.query.offset) || 0;
    const action = req.query.action || null;

    const where = ['1=1'];
    const params = [];
    if (action) { where.push('action LIKE ?'); params.push(`%${action}%`); }

    const rows = db.prepare(`
      SELECT id, user_id, user_role, user_email, action, target_type, target_id,
             details, ip, created_at
      FROM audit_log
      WHERE ${where.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const total = db.prepare(`SELECT COUNT(*) AS n FROM audit_log WHERE ${where.join(' AND ')}`).get(...params).n;

    res.json({
      entries: rows.map((r) => ({
        ...r,
        details: r.details ? JSON.parse(r.details) : null,
      })),
      pagination: { total, limit, offset, hasMore: offset + rows.length < total },
    });
  } catch (e) { next(e); }
};

/**
 * GET /api/admin/psychometry — calculează Cronbach α per dimensiune D1-D5
 * conform Cap. 3.6.1 din dizertație (țintă α ≥ 0.70 per dimensiune, ≥ 0.85 global).
 *
 * Formula: α = (k / (k-1)) * (1 - sum(var_i) / var_total)
 *   unde k = nr. itemi, var_i = varianța per item, var_total = varianța sumei
 */
exports.getPsychometry = (req, res, next) => {
  try {
    const db = getDatabase();
    const dimensions = ['D1', 'D2', 'D3', 'D4', 'D5'];
    const result = {};

    for (const dim of dimensions) {
      // Itemii din dimensiunea curentă
      const items = db.prepare(
        `SELECT id FROM questions WHERE dimension = ? AND is_active = 1 ORDER BY order_index`,
      ).all(dim);
      if (items.length < 2) {
        result[dim] = { alpha: null, n_items: items.length, n_responses: 0, target: 0.70, status: 'too_few_items' };
        continue;
      }
      const itemIds = items.map((i) => i.id);

      // Construiesc matricea răspunsurilor: rând = evaluation_id, coloană = item răspuns Likert
      const rows = db.prepare(
        `SELECT evaluation_id, question_id, response_likert
         FROM responses
         WHERE question_id IN (${itemIds.map(() => '?').join(',')})
           AND response_likert IS NOT NULL`,
      ).all(...itemIds);

      // Grupez per evaluation; păstrez doar cele cu toate răspunsurile prezente
      const byEval = {};
      for (const r of rows) {
        byEval[r.evaluation_id] ??= {};
        byEval[r.evaluation_id][r.question_id] = r.response_likert;
      }
      const completeEvals = Object.values(byEval).filter(
        (r) => itemIds.every((id) => r[id] != null),
      );
      const n = completeEvals.length;

      if (n < 10) {
        result[dim] = { alpha: null, n_items: items.length, n_responses: n, target: 0.70, status: 'insufficient_data' };
        continue;
      }

      // Variance per item
      const itemVars = itemIds.map((id) => {
        const vals = completeEvals.map((e) => e[id]);
        const mean = vals.reduce((a, b) => a + b, 0) / n;
        return vals.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
      });
      const sumItemVars = itemVars.reduce((a, b) => a + b, 0);

      // Variance of sum (total score per evaluation)
      const totals = completeEvals.map((e) => itemIds.reduce((a, id) => a + e[id], 0));
      const totalMean = totals.reduce((a, b) => a + b, 0) / n;
      const totalVar = totals.reduce((a, b) => a + (b - totalMean) ** 2, 0) / n;

      const k = itemIds.length;
      let alpha = null;
      if (totalVar > 0) {
        alpha = (k / (k - 1)) * (1 - sumItemVars / totalVar);
      }

      result[dim] = {
        alpha: alpha != null ? Number(alpha.toFixed(3)) : null,
        n_items: k,
        n_responses: n,
        target: 0.70,
        status: alpha == null
          ? 'no_variance'
          : alpha >= 0.70 ? 'ok'
          : alpha >= 0.60 ? 'acceptable'
          : 'low',
      };
    }

    // Cronbach global pe toate cele 19 itemi (target ≥ 0.85)
    const allItemIds = db.prepare(
      `SELECT id FROM questions WHERE dimension IN ('D1','D2','D3','D4','D5') AND is_active = 1 ORDER BY order_index`,
    ).all().map((i) => i.id);
    let globalAlpha = null;
    let globalN = 0;
    if (allItemIds.length >= 2) {
      const rows = db.prepare(
        `SELECT evaluation_id, question_id, response_likert FROM responses
         WHERE question_id IN (${allItemIds.map(() => '?').join(',')}) AND response_likert IS NOT NULL`,
      ).all(...allItemIds);
      const byEval = {};
      for (const r of rows) {
        byEval[r.evaluation_id] ??= {};
        byEval[r.evaluation_id][r.question_id] = r.response_likert;
      }
      const completeEvals = Object.values(byEval).filter((r) => allItemIds.every((id) => r[id] != null));
      globalN = completeEvals.length;
      if (globalN >= 10) {
        const itemVars = allItemIds.map((id) => {
          const vals = completeEvals.map((e) => e[id]);
          const mean = vals.reduce((a, b) => a + b, 0) / globalN;
          return vals.reduce((a, b) => a + (b - mean) ** 2, 0) / globalN;
        });
        const sumItemVars = itemVars.reduce((a, b) => a + b, 0);
        const totals = completeEvals.map((e) => allItemIds.reduce((a, id) => a + e[id], 0));
        const totalMean = totals.reduce((a, b) => a + b, 0) / globalN;
        const totalVar = totals.reduce((a, b) => a + (b - totalMean) ** 2, 0) / globalN;
        const k = allItemIds.length;
        if (totalVar > 0) {
          globalAlpha = Number(((k / (k - 1)) * (1 - sumItemVars / totalVar)).toFixed(3));
        }
      }
    }

    res.json({
      perDimension: result,
      global: {
        alpha: globalAlpha,
        n_items: allItemIds.length,
        n_responses: globalN,
        target: 0.85,
        status: globalAlpha == null
          ? 'insufficient_data'
          : globalAlpha >= 0.85 ? 'ok'
          : globalAlpha >= 0.70 ? 'acceptable'
          : 'low',
      },
    });
  } catch (e) { next(e); }
};
