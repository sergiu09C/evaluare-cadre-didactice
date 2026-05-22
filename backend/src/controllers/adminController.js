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
      LEFT JOIN users u ON u.group_id = g.id AND u.role = 'student'
      LEFT JOIN evaluations e ON e.student_id = u.id
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
      LEFT JOIN series s ON s.study_year_id = sy.id
      LEFT JOIN groups g ON g.series_id = s.id
      LEFT JOIN users u ON u.group_id = g.id
      LEFT JOIN evaluations e ON e.student_id = u.id
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

    let query = `
      SELECT
        f.name as faculty_name,
        p.level,
        sy.year_number,
        COUNT(DISTINCT u.id) as total_students,
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
      INNER JOIN series s ON s.study_year_id = sy.id
      INNER JOIN groups g ON g.series_id = s.id
      INNER JOIN users u ON u.group_id = g.id AND u.role = 'student'
      LEFT JOIN evaluations e ON e.student_id = u.id
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
 * GET /api/admin/export/aracis
 * Export agregat pentru raportare ARACIS (CSV; UTF-8 cu BOM).
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
    const filename = `aracis-export-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('﻿' + csv);
  } catch (error) {
    next(error);
  }
};
