const { getDatabase } = require('../config/database');
const emailService = require('../services/emailService');
const { auditLog } = require('../middleware/auditLog');

// ===== PLATFORM SETTINGS =====

/**
 * Test email configuration by sending a test email
 * POST /api/platform/test-email
 */
exports.testEmail = async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({ error: 'Adresa de email este obligatorie' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return res.status(400).json({ error: 'Adresa de email este invalidă' });
    }

    const result = await emailService.sendTestEmail(testEmail);

    res.json({
      message: 'Email de test trimis cu succes',
      messageId: result.messageId,
      recipient: testEmail
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      error: 'Eroare la trimiterea email-ului de test',
      details: error.message
    });
  }
};

/**
 * Get platform settings (on/off status, reminder config, etc.)
 */
exports.getPlatformSettings = (req, res) => {
  try {
    const db = getDatabase();

    const settings = db.prepare(`
      SELECT id, is_active, closure_message, auto_reminders_enabled, reminder_days,
             evaluation_deadline_enabled, evaluation_deadline_date, auto_close_on_deadline,
             email_enabled, email_host, email_port, email_secure, email_user, email_from_name,
             email_from_address, send_email_on_message, last_updated
      FROM platform_settings
      WHERE id = 1
    `).get();

    if (!settings) {
      // Create default settings if they don't exist
      db.prepare(`
        INSERT OR IGNORE INTO platform_settings (id, is_active, auto_reminders_enabled)
        VALUES (1, 1, 1)
      `).run();

      return res.json({
        id: 1,
        is_active: true,
        closure_message: 'Platforma de evaluare este momentan închisă.',
        auto_reminders_enabled: true,
        reminder_days: '3,2,1',
        evaluation_deadline_enabled: false,
        evaluation_deadline_date: null,
        auto_close_on_deadline: false,
        last_updated: new Date().toISOString()
      });
    }

    res.json({
      ...settings,
      is_active: Boolean(settings.is_active),
      auto_reminders_enabled: Boolean(settings.auto_reminders_enabled),
      evaluation_deadline_enabled: Boolean(settings.evaluation_deadline_enabled),
      auto_close_on_deadline: Boolean(settings.auto_close_on_deadline),
      email_enabled: Boolean(settings.email_enabled),
      email_secure: Boolean(settings.email_secure),
      send_email_on_message: Boolean(settings.send_email_on_message),
      // Don't send password to frontend for security
      email_password: settings.email_password ? '********' : ''
    });
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    res.status(500).json({ error: 'Eroare la încărcarea setărilor platformei' });
  }
};

/**
 * Update platform settings (admin only)
 */
exports.updatePlatformSettings = (req, res) => {
  try {
    const {
      is_active,
      closure_message,
      auto_reminders_enabled,
      reminder_days,
      evaluation_deadline_enabled,
      evaluation_deadline_date,
      auto_close_on_deadline,
      email_enabled,
      email_host,
      email_port,
      email_secure,
      email_user,
      email_password,
      email_from_name,
      email_from_address,
      send_email_on_message
    } = req.body;
    const userId = req.user.id;

    const db = getDatabase();

    // Citim is_active curent ÎNAINTE de update — necesar pentru D-07 (notificări activare)
    const prevSettings = db.prepare('SELECT is_active FROM platform_settings WHERE id = 1').get();

    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }
    if (closure_message !== undefined) {
      updates.push('closure_message = ?');
      values.push(closure_message || 'Platforma de evaluare este momentan închisă.');
    }
    if (auto_reminders_enabled !== undefined) {
      updates.push('auto_reminders_enabled = ?');
      values.push(auto_reminders_enabled ? 1 : 0);
    }
    if (reminder_days !== undefined) {
      updates.push('reminder_days = ?');
      values.push(reminder_days || '3,2,1');
    }
    if (evaluation_deadline_enabled !== undefined) {
      updates.push('evaluation_deadline_enabled = ?');
      values.push(evaluation_deadline_enabled ? 1 : 0);
    }
    if (evaluation_deadline_date !== undefined) {
      updates.push('evaluation_deadline_date = ?');
      values.push(evaluation_deadline_date || null);
    }
    if (auto_close_on_deadline !== undefined) {
      updates.push('auto_close_on_deadline = ?');
      values.push(auto_close_on_deadline ? 1 : 0);
    }

    // Email settings
    if (email_enabled !== undefined) {
      updates.push('email_enabled = ?');
      values.push(email_enabled ? 1 : 0);
    }
    if (email_host !== undefined) {
      updates.push('email_host = ?');
      values.push(email_host || null);
    }
    if (email_port !== undefined) {
      updates.push('email_port = ?');
      values.push(email_port || 587);
    }
    if (email_secure !== undefined) {
      updates.push('email_secure = ?');
      values.push(email_secure ? 1 : 0);
    }
    if (email_user !== undefined) {
      updates.push('email_user = ?');
      values.push(email_user || null);
    }
    // Only update password if a new one is provided (not masked)
    if (email_password && email_password !== '********') {
      updates.push('email_password = ?');
      values.push(email_password);
    }
    if (email_from_name !== undefined) {
      updates.push('email_from_name = ?');
      values.push(email_from_name || 'Platformă Evaluare');
    }
    if (email_from_address !== undefined) {
      updates.push('email_from_address = ?');
      values.push(email_from_address || null);
    }
    if (send_email_on_message !== undefined) {
      updates.push('send_email_on_message = ?');
      values.push(send_email_on_message ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nu au fost furnizate date pentru actualizare' });
    }

    updates.push('last_updated = CURRENT_TIMESTAMP');
    updates.push('updated_by = ?');
    values.push(userId);

    const query = `UPDATE platform_settings SET ${updates.join(', ')} WHERE id = 1`;
    db.prepare(query).run(...values);

    // D-08: audit log la schimbare de stare a platformei
    if (is_active !== undefined) {
      const wasActive = prevSettings ? !!prevSettings.is_active : null;
      const nowActive = !!is_active;
      if (wasActive !== nowActive) {
        auditLog(
          req,
          nowActive ? 'platform.activate' : 'platform.deactivate',
          'platform_settings',
          1,
          { previous: wasActive, current: nowActive },
        );
      }
    }

    // D-07: dacă platforma tocmai a fost activată manual, notificăm studenții eligibili
    if (is_active === true && prevSettings && !prevSettings.is_active) {
      try {
        const eligible = db
          .prepare(
            `SELECT DISTINCT u.id, u.email
             FROM users u
             JOIN evaluations e ON e.student_id = u.id
             WHERE u.role = 'student' AND u.is_active = 1 AND e.status != 'submitted'`,
          )
          .all();
        const notifStmt = db.prepare(
          `INSERT INTO reminders_log (sent_to, message, sent_by, evaluation_id, user_id, threshold)
           VALUES (?, ?, ?, NULL, ?, 0.0)`,
        );
        for (const s of eligible) {
          try { notifStmt.run(s.email, 'Perioada de evaluare a fost deschisă. Completează evaluările disponibile.', userId, s.id); } catch (_) {}
        }
        if (eligible.length > 0) {
          console.log(`[platform] ${eligible.length} studenți notificați la activare manuală`);
        }
      } catch (notifErr) {
        // Notificările nu trebuie să blocheze răspunsul la activare
        console.error('[platform] eroare la inserare notificări D-07:', notifErr.message);
      }
    }

    res.json({
      message: 'Setări actualizate cu succes',
      is_active: Boolean(is_active),
      settings: {
        evaluation_deadline_enabled: Boolean(evaluation_deadline_enabled),
        evaluation_deadline_date,
        auto_close_on_deadline: Boolean(auto_close_on_deadline)
      }
    });
  } catch (error) {
    console.error('Error updating platform settings:', error);
    res.status(500).json({ error: 'Eroare la actualizarea setărilor' });
  }
};

// ===== STUDENT MESSAGING =====

/**
 * Send manual message to students (admin only)
 * target_audience can filter by: facultyIds, yearNumbers, level (licenta/master), seriesNames, groupIds
 */
exports.sendMessage = (req, res) => {
  try {
    const { title, content, target_audience } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ error: 'Titlu și conținut sunt obligatorii' });
    }

    const db = getDatabase();

    // Calculate recipients count based on target_audience filters
    let recipientsCount = 0;

    if (target_audience && Object.keys(target_audience).length > 0) {
      // Build dynamic query based on filters
      let query = `
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        INNER JOIN groups g ON u.group_id = g.id
        INNER JOIN series s ON g.series_id = s.id
        INNER JOIN study_years sy ON s.study_year_id = sy.id
        INNER JOIN programs p ON sy.program_id = p.id
        WHERE u.role = 'student' AND u.is_active = 1
      `;
      const params = [];

      if (target_audience.facultyIds && target_audience.facultyIds.length > 0) {
        query += ` AND p.faculty_id IN (${target_audience.facultyIds.map(() => '?').join(',')})`;
        params.push(...target_audience.facultyIds);
      }

      if (target_audience.level) {
        query += ` AND p.level = ?`;
        params.push(target_audience.level);
      }

      if (target_audience.yearNumbers && target_audience.yearNumbers.length > 0) {
        query += ` AND sy.year_number IN (${target_audience.yearNumbers.map(() => '?').join(',')})`;
        params.push(...target_audience.yearNumbers);
      }

      if (target_audience.seriesNames && target_audience.seriesNames.length > 0) {
        query += ` AND s.name IN (${target_audience.seriesNames.map(() => '?').join(',')})`;
        params.push(...target_audience.seriesNames);
      }

      if (target_audience.groupIds && target_audience.groupIds.length > 0) {
        query += ` AND g.id IN (${target_audience.groupIds.map(() => '?').join(',')})`;
        params.push(...target_audience.groupIds);
      }

      const result = db.prepare(query).get(...params);
      recipientsCount = result.count;
    } else {
      // No filters = all active students
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_active = 1
      `).get();
      recipientsCount = result.count;
    }

    // Insert message
    const insertStmt = db.prepare(`
      INSERT INTO student_messages (title, content, message_type, target_audience, sent_by, recipients_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      title,
      content,
      'manual',
      target_audience ? JSON.stringify(target_audience) : null,
      userId,
      recipientsCount
    );

    const messageId = result.lastInsertRowid;

    // Send email notifications if enabled
    const settings = db.prepare('SELECT email_enabled, send_email_on_message FROM platform_settings WHERE id = 1').get();

    if (settings && settings.email_enabled && settings.send_email_on_message) {
      // Get recipients' emails
      let emailQuery = `
        SELECT DISTINCT u.id, u.email, u.first_name
        FROM users u
        INNER JOIN groups g ON u.group_id = g.id
        INNER JOIN series s ON g.series_id = s.id
        INNER JOIN study_years sy ON s.study_year_id = sy.id
        INNER JOIN programs p ON sy.program_id = p.id
        WHERE u.role = 'student' AND u.is_active = 1
      `;
      const emailParams = [];

      if (target_audience && Object.keys(target_audience).length > 0) {
        if (target_audience.facultyIds && target_audience.facultyIds.length > 0) {
          emailQuery += ` AND p.faculty_id IN (${target_audience.facultyIds.map(() => '?').join(',')})`;
          emailParams.push(...target_audience.facultyIds);
        }
        if (target_audience.level) {
          emailQuery += ` AND p.level = ?`;
          emailParams.push(target_audience.level);
        }
        if (target_audience.yearNumbers && target_audience.yearNumbers.length > 0) {
          emailQuery += ` AND sy.year_number IN (${target_audience.yearNumbers.map(() => '?').join(',')})`;
          emailParams.push(...target_audience.yearNumbers);
        }
        if (target_audience.seriesNames && target_audience.seriesNames.length > 0) {
          emailQuery += ` AND s.name IN (${target_audience.seriesNames.map(() => '?').join(',')})`;
          emailParams.push(...target_audience.seriesNames);
        }
        if (target_audience.groupIds && target_audience.groupIds.length > 0) {
          emailQuery += ` AND g.id IN (${target_audience.groupIds.map(() => '?').join(',')})`;
          emailParams.push(...target_audience.groupIds);
        }
      }

      const recipients = db.prepare(emailQuery).all(...emailParams);

      if (recipients.length > 0) {
        // Get the full message object
        const message = db.prepare('SELECT * FROM student_messages WHERE id = ?').get(messageId);

        // Send emails asynchronously (don't wait for completion)
        emailService.sendMessageNotification(message, recipients)
          .then(result => {
            console.log(`✅ Email notifications sent for message ${messageId}: ${result.sent} sent, ${result.failed} failed`);
          })
          .catch(error => {
            console.error(`❌ Error sending email notifications for message ${messageId}:`, error);
          });
      }
    }

    res.json({
      message: 'Mesaj trimis cu succes',
      messageId,
      recipientsCount,
      emailsScheduled: settings && settings.email_enabled && settings.send_email_on_message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Eroare la trimiterea mesajului' });
  }
};

/**
 * Get message history (admin only)
 */
exports.getMessageHistory = (req, res) => {
  try {
    const { limit = 50, offset = 0, message_type } = req.query;

    const db = getDatabase();

    let query = `
      SELECT
        sm.id,
        sm.title,
        sm.content,
        sm.message_type,
        sm.target_audience,
        sm.recipients_count,
        sm.sent_at,
        u.first_name || ' ' || u.last_name as sent_by_name
      FROM student_messages sm
      INNER JOIN users u ON sm.sent_by = u.id
    `;
    const params = [];

    if (message_type) {
      query += ` WHERE sm.message_type = ?`;
      params.push(message_type);
    }

    query += ` ORDER BY sm.sent_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const messages = db.prepare(query).all(...params);

    // Parse target_audience JSON
    const messagesWithParsedAudience = messages.map(m => ({
      ...m,
      target_audience: m.target_audience ? JSON.parse(m.target_audience) : null
    }));

    res.json({
      messages: messagesWithParsedAudience,
      total: db.prepare(`SELECT COUNT(*) as count FROM student_messages`).get().count
    });
  } catch (error) {
    console.error('Error fetching message history:', error);
    res.status(500).json({ error: 'Eroare la încărcarea istoricului mesajelor' });
  }
};

/**
 * Get messages for current student (filtered by their attributes)
 * Returns messages targeted to their faculty, year, level, series, or group
 */
exports.getStudentMessages = (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDatabase();

    // Get student's attributes
    const student = db.prepare(`
      SELECT
        u.id,
        u.group_id,
        g.series_id,
        s.study_year_id,
        sy.year_number,
        sy.program_id,
        p.level,
        p.faculty_id
      FROM users u
      INNER JOIN groups g ON u.group_id = g.id
      INNER JOIN series s ON g.series_id = s.id
      INNER JOIN study_years sy ON s.study_year_id = sy.id
      INNER JOIN programs p ON sy.program_id = p.id
      WHERE u.id = ?
    `).get(userId);

    if (!student) {
      return res.status(404).json({ error: 'Student negăsit' });
    }

    // Get all messages where target_audience is null (broadcast) or matches student's attributes
    const messages = db.prepare(`
      SELECT
        id,
        title,
        content,
        message_type,
        target_audience,
        sent_at
      FROM student_messages
      ORDER BY sent_at DESC
      LIMIT 50
    `).all();

    // Filter messages based on target_audience
    const relevantMessages = messages.filter(msg => {
      if (!msg.target_audience) {
        return true; // Broadcast message
      }

      const audience = JSON.parse(msg.target_audience);

      // Check each filter
      if (audience.facultyIds && !audience.facultyIds.includes(student.faculty_id)) {
        return false;
      }

      if (audience.level && audience.level !== student.level) {
        return false;
      }

      if (audience.yearNumbers && !audience.yearNumbers.includes(student.year_number)) {
        return false;
      }

      if (audience.groupIds && !audience.groupIds.includes(student.group_id)) {
        return false;
      }

      return true;
    });

    res.json({
      messages: relevantMessages.map(m => ({
        id: m.id,
        title: m.title,
        content: m.content,
        message_type: m.message_type,
        sent_at: m.sent_at
      }))
    });
  } catch (error) {
    console.error('Error fetching student messages:', error);
    res.status(500).json({ error: 'Eroare la încărcarea mesajelor' });
  }
};

// ===== FILTER OPTIONS =====

/**
 * Get available filter options for messaging/statistics
 * Returns faculties, programs, years, series for dropdown filters
 */
exports.getFilterOptions = (req, res) => {
  try {
    const db = getDatabase();

    const faculties = db.prepare(`
      SELECT id, name, code FROM faculties ORDER BY name
    `).all();

    const programs = db.prepare(`
      SELECT id, faculty_id, name, code, level FROM programs ORDER BY faculty_id, level, name
    `).all();

    const studyYears = db.prepare(`
      SELECT DISTINCT sy.year_number, p.level
      FROM study_years sy
      INNER JOIN programs p ON sy.program_id = p.id
      ORDER BY p.level, sy.year_number
    `).all();

    const series = db.prepare(`
      SELECT DISTINCT name FROM series ORDER BY name
    `).all();

    res.json({
      faculties,
      programs,
      studyYears,
      series: series.map(s => s.name),
      levels: ['licenta', 'master']
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Eroare la încărcarea opțiunilor de filtrare' });
  }
};


/**
 * GET /api/platform/home-stats
 * Statistici complete pentru pagina Acasă — agregat platform-wide + grafice multiple.
 * Acceptă query params: ?facultyId=N (filtrează evaluările pe facultate)
 *                       ?days=N (restrânge time-series la ultimele N zile)
 */
/**
 * Helper — construiește WHERE clause + params pentru queries pe evaluations.
 * Folosește alias-uri: e (evaluations), p (professors), c (courses), q (questions optional).
 * Returnează: { sql, params } unde sql începe cu " AND ..." (caller-ul adaugă WHERE 1=1).
 */
function buildEvalFilters(query, opts = {}) {
  const { withQuestion = false, withCourse = true } = opts;
  const parts = [];
  const params = [];

  // Helper: parsează „1,2,3" sau „1" în array de string-uri non-empty.
  const parseList = (v) => {
    if (v == null) return [];
    return String(v).split(',').map((s) => s.trim()).filter(Boolean);
  };

  if (query.facultyId) {
    parts.push('p.faculty_id = ?');
    params.push(Number(query.facultyId));
  }
  if (query.departmentId) {
    parts.push('p.department = ?');
    params.push(String(query.departmentId));
  }
  if (withCourse) {
    const semesters = parseList(query.semester);
    if (semesters.length === 1) {
      parts.push('c.semester = ?');
      params.push(semesters[0]);
    } else if (semesters.length > 1) {
      parts.push(`c.semester IN (${semesters.map(() => '?').join(',')})`);
      params.push(...semesters);
    }
    if (query.academicYear) {
      parts.push('c.academic_year = ?');
      params.push(String(query.academicYear));
    }
    const courseTypes = parseList(query.courseType);
    if (courseTypes.length === 1) {
      parts.push('c.course_type = ?');
      params.push(courseTypes[0]);
    } else if (courseTypes.length > 1) {
      parts.push(`c.course_type IN (${courseTypes.map(() => '?').join(',')})`);
      params.push(...courseTypes);
    }
  }
  if (query.programId) {
    parts.push(
      'c.study_year_id IN (SELECT id FROM study_years WHERE program_id = ?)',
    );
    params.push(Number(query.programId));
  }
  if (query.programLevel) {
    const levels = parseList(query.programLevel);
    if (levels.length === 1) {
      parts.push(
        'c.study_year_id IN (SELECT sy.id FROM study_years sy JOIN programs pr ON pr.id=sy.program_id WHERE pr.level = ?)',
      );
      params.push(levels[0]);
    } else if (levels.length > 1) {
      parts.push(
        `c.study_year_id IN (SELECT sy.id FROM study_years sy JOIN programs pr ON pr.id=sy.program_id WHERE pr.level IN (${levels.map(() => '?').join(',')}))`,
      );
      params.push(...levels);
    }
  }
  const years = parseList(query.year);
  if (years.length === 1) {
    parts.push('c.study_year_id IN (SELECT id FROM study_years WHERE year_number = ?)');
    params.push(Number(years[0]));
  } else if (years.length > 1) {
    parts.push(
      `c.study_year_id IN (SELECT id FROM study_years WHERE year_number IN (${years.map(() => '?').join(',')}))`,
    );
    params.push(...years.map((y) => Number(y)));
  }
  if (withQuestion) {
    const cats = parseList(query.category);
    if (cats.length === 1) {
      parts.push('q.category = ?');
      params.push(cats[0]);
    } else if (cats.length > 1) {
      parts.push(`q.category IN (${cats.map(() => '?').join(',')})`);
      params.push(...cats);
    }
  }
  return {
    sql: parts.length ? ' AND ' + parts.join(' AND ') : '',
    params,
  };
}

exports.getHomeStats = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const role = req.user.role;
    const userId = req.user.id;
    const days = req.query.days ? Math.max(1, Math.min(3650, Number(req.query.days))) : 365;

    // Construim filtre pentru queries pe evaluări (cu JOIN courses + professors)
    const evalF = buildEvalFilters(req.query, { withQuestion: false, withCourse: true });
    const evalQF = buildEvalFilters(req.query, { withQuestion: true, withCourse: true });

    const facultyId = req.query.facultyId ? Number(req.query.facultyId) : null;
    // legacy compat
    const facultyFilter = evalF.sql;
    const facultyParam = evalF.params;

    // === HERO KPIs ===
    const totalStudents = db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role='student' AND is_active=1`).get().n;
    // Cadre didactice — filtrate: profesori distincți care PREDAU cursuri match-uind filterele.
    // Fără filtre = total profesori activi.
    const totalProfessors = db
      .prepare(
        `SELECT COUNT(DISTINCT p.id) AS n
         FROM professors p
         JOIN courses c ON c.professor_id = p.id
         WHERE 1=1 ${evalF.sql}`,
      )
      .get(...evalF.params).n;
    const totalEvaluations = db
      .prepare(
        `SELECT COUNT(*) AS n FROM evaluations e
         JOIN professors p ON p.id = e.professor_id
         JOIN courses c ON c.id = e.course_id
         WHERE e.status='submitted' ${evalF.sql}`,
      )
      .get(...evalF.params).n;
    const submittedThisMonth = db
      .prepare(
        `SELECT COUNT(*) AS n FROM evaluations e
         JOIN professors p ON p.id = e.professor_id
         JOIN courses c ON c.id = e.course_id
         WHERE e.status='submitted' AND e.submitted_at >= date('now', '-30 days') ${evalF.sql}`,
      )
      .get(...evalF.params).n;
    const overallAvg = db
      .prepare(
        `SELECT AVG(r.response_likert) AS avg
         FROM responses r
         JOIN evaluations e ON e.id = r.evaluation_id
         JOIN professors p ON p.id = e.professor_id
         JOIN courses c ON c.id = e.course_id
         WHERE e.status='submitted' AND r.response_likert IS NOT NULL ${evalF.sql}`,
      )
      .get(...evalF.params).avg;

    // Rate completare CORECTĂ = evaluări transmise / max evaluări posibile.
    // (Anterior era distinct_students / total → 100% pentru că orice student cu 1 eval = participă.)
    // Folosim numerele deja calculate mai jos. Pentru moment lăsăm legacy, recalculăm la final.
    const completionRate = 0; // placeholder — recalculăm corect mai jos după ce avem maxPossibleEvaluations

    // === STUDENȚI ELIGIBILI (au cel puțin un curs care poate fi evaluat, respectă filtre)
    const eligibleStudentsRow = db
      .prepare(
        `SELECT COUNT(DISTINCT u.id) AS n
         FROM users u
         JOIN groups g ON g.id = u.group_id
         JOIN series s ON s.id = g.series_id
         JOIN study_years sy ON sy.id = s.study_year_id
         JOIN courses c ON c.study_year_id = sy.id
         JOIN professors p ON p.id = c.professor_id
         WHERE u.role='student' AND u.is_active=1 ${evalF.sql}`,
      )
      .get(...evalF.params);
    const eligibleStudents = eligibleStudentsRow?.n || 0;

    // Studenți cu evaluări rămase — pentru fiecare student în scope-ul filtrelor:
    //   possible = câte cursuri din scope ar putea evalua (via study_year chain)
    //   done = câte evaluări A TRANSMIS efectiv pentru cursuri din scope
    //   remaining = possible > done
    // FIX: după migrarea 017, e.student_id devine NULL la submit. Folosesc
    // completion_tokens.user_id care păstrează identitatea pentru tracking de
    // progres (anonimitatea se aplică doar la nivel de responses).
    const studentsWithRemainingRow = db
      .prepare(
        `WITH per_student AS (
           SELECT u.id AS sid,
             (SELECT COUNT(*) FROM courses c
              JOIN professors p ON p.id = c.professor_id
              JOIN groups g_in ON g_in.id = u.group_id
              JOIN series s_in ON s_in.id = g_in.series_id
              WHERE c.study_year_id = s_in.study_year_id ${evalF.sql}) AS possible,
             (SELECT COUNT(*) FROM completion_tokens ct
              JOIN evaluations e ON e.id = ct.evaluation_id
              JOIN courses c ON c.id = e.course_id
              JOIN professors p ON p.id = e.professor_id
              WHERE ct.user_id = u.id AND ct.completed_at IS NOT NULL ${evalF.sql}) AS done
           FROM users u WHERE u.role='student' AND u.is_active=1
         )
         SELECT
           COUNT(*) FILTER (WHERE done < possible AND possible > 0) AS with_remaining,
           COUNT(*) FILTER (WHERE done = possible AND possible > 0) AS completed_all,
           COUNT(*) FILTER (WHERE possible > 0) AS eligible_in_scope
         FROM per_student`,
      )
      .get(...evalF.params, ...evalF.params);
    const studentsWithRemaining = studentsWithRemainingRow?.with_remaining || 0;
    const studentsCompletedAll = studentsWithRemainingRow?.completed_all || 0;
    const eligibleStudentsInScope = studentsWithRemainingRow?.eligible_in_scope || eligibleStudents;

    // === MAX EVALUĂRI POSIBILE (cursuri × studenți din study_year) ===
    const maxPossibleRow = db
      .prepare(
        `SELECT SUM(student_counts.cnt) AS max_evals
         FROM courses c
         JOIN professors p ON p.id = c.professor_id
         JOIN (
           SELECT sy.id AS sy_id, COUNT(*) AS cnt
           FROM users u
           JOIN groups g ON g.id = u.group_id
           JOIN series s ON s.id = g.series_id
           JOIN study_years sy ON sy.id = s.study_year_id
           WHERE u.role='student' AND u.is_active=1
           GROUP BY sy.id
         ) student_counts ON student_counts.sy_id = c.study_year_id
         WHERE 1=1 ${evalF.sql}`,
      )
      .get(...evalF.params);
    const maxPossibleEvaluations = maxPossibleRow?.max_evals || 0;

    // Recalculez completionRate CORECT = submitted / max_possible (NU distinct/total)
    const completionRateFixed =
      maxPossibleEvaluations > 0
        ? Math.round((totalEvaluations / maxPossibleEvaluations) * 100)
        : 0;

    // === EVALUĂRI PER AN DE STUDIU ===
    const evalsByYear = db
      .prepare(
        `SELECT sy.year_number AS year_number, COUNT(DISTINCT e.id) AS n
         FROM evaluations e
         JOIN courses c ON c.id = e.course_id
         JOIN professors p ON p.id = e.professor_id
         JOIN study_years sy ON sy.id = c.study_year_id
         WHERE e.status='submitted' ${evalF.sql}
         GROUP BY sy.year_number
         ORDER BY sy.year_number`,
      )
      .all(...evalF.params)
      .map((r) => ({ year: r.year_number, n: r.n }));

    // === EVALUĂRI PER CICLU (licenta/master) ===
    const evalsByLevel = db
      .prepare(
        `SELECT pr.level AS level, COUNT(DISTINCT e.id) AS n,
                AVG(r.response_likert) AS avg
         FROM evaluations e
         JOIN courses c ON c.id = e.course_id
         JOIN professors p ON p.id = e.professor_id
         JOIN study_years sy ON sy.id = c.study_year_id
         JOIN programs pr ON pr.id = sy.program_id
         LEFT JOIN responses r ON r.evaluation_id = e.id AND r.response_likert IS NOT NULL
         WHERE e.status='submitted' ${evalF.sql}
         GROUP BY pr.level`,
      )
      .all(...evalF.params)
      .map((r) => ({ level: r.level, n: r.n, avg: r.avg != null ? parseFloat(r.avg.toFixed(2)) : null }));

    // === EVALUĂRI PER AN × FACULTATE (matrice) ===
    const evalsByYearAndFaculty = db
      .prepare(
        `SELECT sy.year_number AS year_number, f.code AS faculty_code, f.name AS faculty_name,
                COUNT(DISTINCT e.id) AS n
         FROM evaluations e
         JOIN courses c ON c.id = e.course_id
         JOIN professors p ON p.id = e.professor_id
         JOIN faculties f ON f.id = p.faculty_id
         JOIN study_years sy ON sy.id = c.study_year_id
         WHERE e.status='submitted' ${evalF.sql}
         GROUP BY sy.year_number, f.id
         ORDER BY sy.year_number, f.name`,
      )
      .all(...evalF.params)
      .map((r) => ({ year: r.year_number, faculty: r.faculty_code, facultyName: r.faculty_name, n: r.n }));

    // === ACȚIUNI BREAKDOWN (per status × per facultate × per ciclu × per an) ===
    const actionsTotal = db
      .prepare(
        `SELECT a.status AS status, COUNT(DISTINCT a.id) AS n
         FROM professor_actions a
         GROUP BY a.status`,
      )
      .all()
      .reduce(
        (acc, r) => {
          acc[r.status] = r.n;
          return acc;
        },
        { proposed: 0, accepted: 0, completed: 0, rejected: 0 },
      );
    const actionsByFaculty = db
      .prepare(
        `SELECT f.code AS faculty_code, f.name AS faculty_name, a.status AS status, COUNT(DISTINCT a.id) AS n
         FROM professor_actions a
         JOIN professors p ON p.id = a.professor_id
         JOIN faculties f ON f.id = p.faculty_id
         GROUP BY f.id, a.status
         ORDER BY f.name`,
      )
      .all();
    const actionsByLevel = db
      .prepare(
        `SELECT pr.level AS level, a.status AS status, COUNT(DISTINCT a.id) AS n
         FROM professor_actions a
         JOIN professors p ON p.id = a.professor_id
         JOIN courses c ON c.professor_id = p.id
         JOIN study_years sy ON sy.id = c.study_year_id
         JOIN programs pr ON pr.id = sy.program_id
         GROUP BY pr.level, a.status`,
      )
      .all();

    // === MY FACULTY / DEPARTMENT / PROFESSOR_ID (context personal) ===
    let myFacultyId = null;
    let myFacultyName = null;
    let myDepartment = null;
    let myProfessorId = null;
    if (role === 'student') {
      const my = db
        .prepare(
          `SELECT f.id, f.name, f.code
           FROM users u
           JOIN groups g ON g.id = u.group_id
           JOIN series s ON s.id = g.series_id
           JOIN study_years sy ON sy.id = s.study_year_id
           JOIN programs pr ON pr.id = sy.program_id
           JOIN faculties f ON f.id = pr.faculty_id
           WHERE u.id = ?`,
        )
        .get(userId);
      if (my) {
        myFacultyId = my.id;
        myFacultyName = my.name;
      }
    } else if (role === 'professor') {
      const my = db
        .prepare(
          `SELECT p.id AS professor_id, p.department, f.id AS faculty_id, f.name AS faculty_name
           FROM users u
           JOIN professors p ON p.id = u.professor_id
           JOIN faculties f ON f.id = p.faculty_id
           WHERE u.id = ?`,
        )
        .get(userId);
      if (my) {
        myFacultyId = my.faculty_id;
        myFacultyName = my.faculty_name;
        myDepartment = my.department;
        myProfessorId = my.professor_id;
      }
    }

    // === RATE PARTICIPARE PE 3 NIVELURI (FIXED) ===
    // Folosim totalEvaluations + maxPossibleEvaluations deja calculate (respectă filtrele).
    // Așa rămâne consistent cu KPI „Evaluări transmise" și „Max. evaluări posibile".
    const participationUniversity = {
      evaluated: totalEvaluations,
      eligible: maxPossibleEvaluations,
      rate:
        maxPossibleEvaluations > 0
          ? Math.round((totalEvaluations / maxPossibleEvaluations) * 100)
          : 0,
    };

    // Facultate: submitted_per_faculty / max_possible_per_faculty
    // Aplică TOATE filtrele active + override facultyId la focusFacultyId (myFaculty fallback).
    let participationFaculty = null;
    const focusFacultyId = facultyId || myFacultyId;
    if (focusFacultyId) {
      // Folosim evalF cu facultyId înlocuit cu focusFacultyId
      const facFilter = buildEvalFilters(
        { ...req.query, facultyId: focusFacultyId },
        { withQuestion: false, withCourse: true },
      );
      const facSubmitted = db
        .prepare(
          `SELECT COUNT(*) AS n
           FROM evaluations e
           JOIN professors p ON p.id = e.professor_id
           JOIN courses c ON c.id = e.course_id
           WHERE e.status='submitted' ${facFilter.sql}`,
        )
        .get(...facFilter.params).n;
      // Max evaluări posibile per facultate cu TOATE filtrele aplicate
      const facMaxRow = db
        .prepare(
          `SELECT SUM(student_counts.cnt) AS max_evals
           FROM courses c
           JOIN professors p ON p.id = c.professor_id
           JOIN (
             SELECT sy.id AS sy_id, COUNT(*) AS cnt
             FROM users u
             JOIN groups g ON g.id = u.group_id
             JOIN series s ON s.id = g.series_id
             JOIN study_years sy ON sy.id = s.study_year_id
             WHERE u.role='student' AND u.is_active=1
             GROUP BY sy.id
           ) student_counts ON student_counts.sy_id = c.study_year_id
           WHERE 1=1 ${facFilter.sql}`,
        )
        .get(...facFilter.params);
      const facMax = facMaxRow?.max_evals || 0;
      const fName = db.prepare('SELECT name FROM faculties WHERE id = ?').get(focusFacultyId)?.name;
      participationFaculty = {
        faculty_id: focusFacultyId,
        faculty_name: fName,
        evaluated: facSubmitted,
        eligible: facMax,
        rate: facMax > 0 ? Math.round((facSubmitted / facMax) * 100) : 0,
      };
    }
    // Personal: pentru profesor, studenții care l-au evaluat vs cei care puteau
    let participationMe = null;
    if (role === 'professor' && myProfessorId) {
      // FIX: e.student_id e NULL după anonimizare (migrarea 017).
      // Folosesc completion_tokens.user_id (păstrat pentru tracking).
      const meWho = db
        .prepare(
          `SELECT COUNT(DISTINCT ct.user_id) AS n
           FROM completion_tokens ct
           JOIN evaluations e ON e.id = ct.evaluation_id
           WHERE ct.completed_at IS NOT NULL AND e.professor_id = ?`,
        )
        .get(myProfessorId).n;
      const meEligible = db
        .prepare(
          `SELECT COUNT(DISTINCT u.id) AS n
           FROM users u
           JOIN groups g ON g.id = u.group_id
           JOIN series s ON s.id = g.series_id
           JOIN study_years sy ON sy.id = s.study_year_id
           JOIN courses c ON c.study_year_id = sy.id
           WHERE u.role='student' AND u.is_active=1 AND c.professor_id = ?`,
        )
        .get(myProfessorId).n;
      participationMe = {
        evaluated: meWho,
        eligible: meEligible,
        rate: meEligible > 0 ? Math.round((meWho / meEligible) * 100) : 0,
      };
    }
    const participation = {
      university: participationUniversity,
      faculty: participationFaculty,
      me: participationMe,
    };

    // === FACULTIES (pentru filtru) ===
    const faculties = db
      .prepare(`SELECT id, name, code FROM faculties ORDER BY name`)
      .all();

    // === SCORE DISTRIBUTION (Likert 1-5) ===
    const scoreRows = db
      .prepare(
        `SELECT r.response_likert AS score, COUNT(*) AS n
         FROM responses r
         JOIN questions q ON q.id = r.question_id
         JOIN evaluations e ON e.id = r.evaluation_id
         JOIN professors p ON p.id = e.professor_id
         JOIN courses c ON c.id = e.course_id
         WHERE e.status='submitted' AND r.response_likert IS NOT NULL ${evalQF.sql}
         GROUP BY r.response_likert
         ORDER BY r.response_likert`,
      )
      .all(...evalQF.params);
    const scoreDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of scoreRows) if (scoreDistribution[r.score] != null) scoreDistribution[r.score] = r.n;

    // === FACULTY BREAKDOWN (bar) ===
    const facultyBreakdown = db
      .prepare(
        `SELECT f.id AS faculty_id, f.name AS faculty_name, f.code,
                COUNT(DISTINCT e.id) AS evaluations,
                AVG(r.response_likert) AS avg_score
         FROM faculties f
         LEFT JOIN professors p ON p.faculty_id = f.id
         LEFT JOIN evaluations e ON e.professor_id = p.id AND e.status='submitted'
         LEFT JOIN responses r ON r.evaluation_id = e.id AND r.response_likert IS NOT NULL
         GROUP BY f.id
         ORDER BY f.name`,
      )
      .all()
      .map((r) => ({
        faculty_id: r.faculty_id,
        faculty_name: r.faculty_name,
        code: r.code,
        evaluations: r.evaluations || 0,
        avg_score: r.avg_score != null ? parseFloat(r.avg_score.toFixed(2)) : null,
      }));

    // === TIME SERIES (submissions per zi pentru ultimele N zile) ===
    const timeSeries = db
      .prepare(
        `SELECT date(e.submitted_at) AS day, COUNT(*) AS n
         FROM evaluations e
         JOIN professors p ON p.id = e.professor_id
         JOIN courses c ON c.id = e.course_id
         WHERE e.status='submitted' AND e.submitted_at >= date('now', '-' || ? || ' days') ${evalF.sql}
         GROUP BY date(e.submitted_at)
         ORDER BY day ASC`,
      )
      .all(days, ...evalF.params);

    // === CATEGORY AVERAGES (radar) — fără filtru pe category (păstrăm toate dim)
    const categoryEvalF = buildEvalFilters({ ...req.query, category: undefined }, { withQuestion: false, withCourse: true });
    const categoryAverages = db
      .prepare(
        `SELECT q.category AS category, AVG(r.response_likert) AS avg, COUNT(*) AS n
         FROM responses r
         JOIN questions q ON q.id = r.question_id
         JOIN evaluations e ON e.id = r.evaluation_id
         JOIN professors p ON p.id = e.professor_id
         JOIN courses c ON c.id = e.course_id
         WHERE e.status='submitted' AND r.response_likert IS NOT NULL ${categoryEvalF.sql}
         GROUP BY q.category
         ORDER BY q.category`,
      )
      .all(...categoryEvalF.params)
      .map((r) => ({
        category: r.category,
        avg: r.avg != null ? parseFloat(r.avg.toFixed(2)) : null,
        n: r.n,
      }));

    // === ROLE DISTRIBUTION (pie) ===
    const roleRows = db
      .prepare(`SELECT role, COUNT(*) AS n FROM users WHERE is_active=1 GROUP BY role`)
      .all();
    const roleDistribution = { student: 0, professor: 0, admin: 0 };
    for (const r of roleRows) if (roleDistribution[r.role] != null) roleDistribution[r.role] = r.n;

    // === LIFECYCLE PIPELINE (păstrat) ===
    const totalDraft = db.prepare(`SELECT COUNT(*) AS n FROM evaluations WHERE status='draft'`).get().n;
    const actionsProposed = db.prepare(`SELECT COUNT(*) AS n FROM professor_actions WHERE status='proposed'`).get().n;
    const actionsAccepted = db.prepare(`SELECT COUNT(*) AS n FROM professor_actions WHERE status='accepted'`).get().n;
    const actionsCompleted = db.prepare(`SELECT COUNT(*) AS n FROM professor_actions WHERE status='completed'`).get().n;
    const messagesOpen = db.prepare(`SELECT COUNT(*) AS n FROM platform_feedback_messages WHERE status='open'`).get().n;
    const messagesInProgress = db.prepare(`SELECT COUNT(*) AS n FROM platform_feedback_messages WHERE status='in_progress'`).get().n;
    const messagesAnswered = db.prepare(`SELECT COUNT(*) AS n FROM platform_feedback_messages WHERE status='answered'`).get().n;
    const messagesClosed = db.prepare(`SELECT COUNT(*) AS n FROM platform_feedback_messages WHERE status='closed'`).get().n;
    const messagesTotal = messagesOpen + messagesInProgress + messagesAnswered + messagesClosed;

    // === PERSONAL (varies by role) ===
    let personal = null;
    if (role === 'student') {
      personal = {
        my_submitted: db
          .prepare(`SELECT COUNT(*) AS n FROM evaluations WHERE student_id=? AND status='submitted'`)
          .get(userId).n,
        my_draft: db
          .prepare(`SELECT COUNT(*) AS n FROM evaluations WHERE student_id=? AND status='draft'`)
          .get(userId).n,
        my_messages_open: db
          .prepare(`SELECT COUNT(*) AS n FROM platform_feedback_messages WHERE user_id=? AND status IN ('open','in_progress')`)
          .get(userId).n,
        my_messages_answered: db
          .prepare(`SELECT COUNT(*) AS n FROM platform_feedback_messages WHERE user_id=? AND status='answered'`)
          .get(userId).n,
        my_avg_given: db
          .prepare(
            `SELECT AVG(r.response_likert) AS avg
             FROM responses r
             JOIN evaluations e ON e.id = r.evaluation_id
             WHERE e.student_id = ? AND e.status='submitted' AND r.response_likert IS NOT NULL`,
          )
          .get(userId).avg,
      };
      if (personal.my_avg_given != null) personal.my_avg_given = parseFloat(personal.my_avg_given.toFixed(2));
    } else if (role === 'professor') {
      const profIdRow = db.prepare(`SELECT professor_id FROM users WHERE id=?`).get(userId);
      const pid = profIdRow?.professor_id;
      personal = {
        my_evaluations_received: pid
          ? db.prepare(`SELECT COUNT(*) AS n FROM evaluations WHERE professor_id=? AND status='submitted'`).get(pid).n
          : 0,
        my_avg: null,
        my_actions_proposed: pid
          ? db.prepare(`SELECT COUNT(*) AS n FROM professor_actions WHERE professor_id=? AND status='proposed'`).get(pid).n
          : 0,
        my_actions_accepted: pid
          ? db.prepare(`SELECT COUNT(*) AS n FROM professor_actions WHERE professor_id=? AND status='accepted'`).get(pid).n
          : 0,
        my_actions_completed: pid
          ? db.prepare(`SELECT COUNT(*) AS n FROM professor_actions WHERE professor_id=? AND status='completed'`).get(pid).n
          : 0,
      };
      if (pid) {
        const a = db
          .prepare(
            `SELECT AVG(r.response_likert) AS avg
             FROM responses r
             JOIN evaluations e ON e.id = r.evaluation_id
             WHERE e.professor_id = ? AND e.status='submitted' AND r.response_likert IS NOT NULL`,
          )
          .get(pid).avg;
        personal.my_avg = a != null ? parseFloat(a.toFixed(2)) : null;
      }
    } else if (role === 'admin') {
      personal = {
        pending_replies: messagesOpen,
        completed_actions: actionsCompleted,
        actions_in_progress: actionsAccepted,
        total_users: totalStudents + totalProfessors + 1,
      };
    }

    res.json({
      role,
      filters: {
        facultyId,
        programId: req.query.programId ? Number(req.query.programId) : null,
        programLevel: req.query.programLevel || null,
        departmentId: req.query.departmentId || null,
        // year/semester/courseType/category pot fi multi-value (CSV) — păstrăm raw
        year: req.query.year || null,
        semester: req.query.semester || null,
        courseType: req.query.courseType || null,
        academicYear: req.query.academicYear || null,
        category: req.query.category || null,
        days,
      },
      faculties,
      hero: {
        totalStudents,
        totalProfessors,
        totalEvaluations,
        submittedThisMonth,
        overallAvg: overallAvg != null ? parseFloat(overallAvg.toFixed(2)) : null,
        completionRate: completionRateFixed,
        eligibleStudents,
        studentsWithRemaining,
        studentsCompletedAll,
        maxPossibleEvaluations,
      },
      scoreDistribution,
      facultyBreakdown,
      evalsByYear,
      evalsByLevel,
      evalsByYearAndFaculty,
      actionsTotal,
      actionsByFaculty,
      actionsByLevel,
      myFacultyId,
      myFacultyName,
      myDepartment,
      myProfessorId,
      participation,
      timeSeries: timeSeries.map((r) => ({ day: r.day, n: r.n })),
      categoryAverages,
      roleDistribution,
      pipeline: (() => {
        // PER ROL — datele relevante pentru ce vede user-ul.
        if (role === 'professor' && myProfessorId) {
          const myEligible = db
            .prepare(
              `SELECT COUNT(DISTINCT u.id) AS n
               FROM users u
               JOIN groups g ON g.id = u.group_id
               JOIN series s ON s.id = g.series_id
               JOIN study_years sy ON sy.id = s.study_year_id
               JOIN courses c ON c.study_year_id = sy.id
               WHERE u.role='student' AND u.is_active=1 AND c.professor_id = ?`,
            )
            .get(myProfessorId).n;
          const myDraft = db
            .prepare(
              `SELECT COUNT(*) AS n FROM evaluations WHERE professor_id = ? AND status='draft'`,
            )
            .get(myProfessorId).n;
          return [
            { stage: 'invite', label: 'Studenții tăi eligibili', value: myEligible },
            { stage: 'draft', label: 'Evaluări în curs (drafts)', value: myDraft },
            { stage: 'submitted', label: 'Evaluări primite', value: personal?.my_evaluations_received ?? 0 },
            { stage: 'actions_proposed', label: 'Acțiuni propuse ție', value: personal?.my_actions_proposed ?? 0 },
            { stage: 'actions_in_progress', label: 'Acțiuni acceptate', value: personal?.my_actions_accepted ?? 0 },
            { stage: 'actions_completed', label: 'Acțiuni finalizate', value: personal?.my_actions_completed ?? 0 },
          ];
        }
        // Student și admin: cifre globale (din scope-ul filtrelor)
        return [
          { stage: 'invite', label: 'Studenți eligibili', value: eligibleStudents },
          { stage: 'draft', label: 'Evaluări în curs', value: totalDraft },
          { stage: 'submitted', label: 'Evaluări transmise', value: totalEvaluations },
          { stage: 'actions_proposed', label: 'Acțiuni propuse', value: actionsProposed },
          { stage: 'actions_in_progress', label: 'Acțiuni acceptate', value: actionsAccepted },
          { stage: 'actions_completed', label: 'Acțiuni finalizate', value: actionsCompleted },
        ];
      })(),
      closing_loop: {
        messages_open: messagesOpen,
        messages_in_progress: messagesInProgress,
        messages_answered: messagesAnswered,
        messages_closed: messagesClosed,
        messages_total: messagesTotal,
      },
      personal,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/platform/filter-options-public
 * Opțiuni publice de filtrare — facultăți, programe, departamente, ani, etc.
 * Accesibil oricărui user autentificat (NU doar admin).
 */
exports.getPublicFilterOptions = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();

    const faculties = db
      .prepare(`SELECT id, name, code FROM faculties ORDER BY name`)
      .all();
    const programs = db
      .prepare(
        `SELECT p.id, p.name, p.code, p.level, p.faculty_id,
                f.name AS faculty_name
         FROM programs p
         JOIN faculties f ON f.id = p.faculty_id
         ORDER BY f.name, p.name`,
      )
      .all();
    const departments = db
      .prepare(
        `SELECT DISTINCT p.department AS name, p.faculty_id, f.name AS faculty_name
         FROM professors p
         JOIN faculties f ON f.id = p.faculty_id
         WHERE p.department IS NOT NULL AND p.department <> ''
         ORDER BY f.name, p.department`,
      )
      .all();

    // Cross-mapping pentru cascading: pentru fiecare program, ce departamente predau
    // pentru fiecare departament, ce programe servește (via cursuri).
    const programDeptRows = db
      .prepare(
        `SELECT DISTINCT pr.id AS program_id, prof.department AS department
         FROM programs pr
         JOIN study_years sy ON sy.program_id = pr.id
         JOIN courses c ON c.study_year_id = sy.id
         JOIN professors prof ON prof.id = c.professor_id
         WHERE prof.department IS NOT NULL`,
      )
      .all();
    const programToDepts = new Map();
    const deptToPrograms = new Map();
    for (const r of programDeptRows) {
      if (!programToDepts.has(r.program_id)) programToDepts.set(r.program_id, []);
      programToDepts.get(r.program_id).push(r.department);
      if (!deptToPrograms.has(r.department)) deptToPrograms.set(r.department, []);
      deptToPrograms.get(r.department).push(r.program_id);
    }
    // Atașăm departments la fiecare program și programs la fiecare department
    for (const p of programs) {
      p.departments = programToDepts.get(p.id) || [];
    }
    for (const d of departments) {
      d.programs = deptToPrograms.get(d.name) || [];
    }
    const years = db
      .prepare(`SELECT DISTINCT year_number AS value FROM study_years ORDER BY year_number`)
      .all()
      .map((r) => r.value);
    const semesters = db
      .prepare(`SELECT DISTINCT semester AS value FROM courses ORDER BY semester`)
      .all()
      .map((r) => r.value);
    const academicYears = db
      .prepare(`SELECT DISTINCT academic_year AS value FROM courses ORDER BY academic_year DESC`)
      .all()
      .map((r) => r.value);
    const courseTypes = db
      .prepare(`SELECT DISTINCT course_type AS value FROM courses ORDER BY course_type`)
      .all()
      .map((r) => r.value);
    const levels = db
      .prepare(`SELECT DISTINCT level AS value FROM programs ORDER BY level`)
      .all()
      .map((r) => r.value);
    const categories = db
      .prepare(`SELECT DISTINCT category AS value FROM questions WHERE category IS NOT NULL ORDER BY category`)
      .all()
      .map((r) => r.value);

    res.json({
      faculties,
      programs,
      departments,
      years,
      semesters,
      academicYears,
      courseTypes,
      levels,
      categories,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/platform/heatmap
 * Heatmap 2D: rândul = dimensiune 1, coloana = dimensiune 2, celula = avg + count.
 * Query: ?rowDim=faculty|program|department  &colDim=category|semester|year|courseType
 */
exports.getHeatmap = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const rowDim = (req.query.rowDim || 'faculty').toString();
    const colDim = (req.query.colDim || 'category').toString();

    const rowSelect = {
      faculty: { col: 'f.name', join: 'JOIN faculties f ON f.id = p.faculty_id', label: 'Facultate' },
      program: { col: 'pr.name', join: 'JOIN study_years sy ON sy.id = c.study_year_id JOIN programs pr ON pr.id = sy.program_id', label: 'Program' },
      department: { col: 'p.department', join: '', label: 'Departament' },
    };
    const colSelect = {
      category: { col: 'q.category', extra_join: 'JOIN questions q ON q.id = r.question_id', label: 'Categorie' },
      semester: { col: 'c.semester', extra_join: '', label: 'Semestru' },
      year: { col: 'sy2.year_number', extra_join: 'JOIN study_years sy2 ON sy2.id = c.study_year_id', label: 'An' },
      courseType: { col: 'c.course_type', extra_join: '', label: 'Tip curs' },
    };
    const rDef = rowSelect[rowDim];
    const cDef = colSelect[colDim];
    if (!rDef || !cDef) {
      return res.status(400).json({ error: 'rowDim/colDim invalid' });
    }

    const evalF = buildEvalFilters(req.query, { withQuestion: false, withCourse: true });

    const rows = db
      .prepare(
        `SELECT ${rDef.col} AS row_label, ${cDef.col} AS col_label,
                COUNT(DISTINCT e.id) AS n_evals,
                AVG(r.response_likert) AS avg_score
         FROM responses r
         JOIN evaluations e ON e.id = r.evaluation_id
         JOIN professors p ON p.id = e.professor_id
         JOIN courses c ON c.id = e.course_id
         ${rDef.join}
         ${cDef.extra_join}
         WHERE e.status='submitted' AND r.response_likert IS NOT NULL ${evalF.sql}
         GROUP BY row_label, col_label
         ORDER BY row_label, col_label`,
      )
      .all(...evalF.params)
      .map((r) => ({
        row: r.row_label,
        col: r.col_label,
        n: r.n_evals || 0,
        avg: r.avg_score != null ? parseFloat(r.avg_score.toFixed(2)) : null,
      }));

    const rowLabels = [...new Set(rows.map((r) => r.row))];
    const colLabels = [...new Set(rows.map((r) => r.col))];

    res.json({ rowDim: rDef.label, colDim: cDef.label, rows: rowLabels, cols: colLabels, cells: rows });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/platform/grouped-bar
 * Grouped bar: groupBy (axa X) × splitBy (serii multiple în fiecare grup).
 * Query: ?groupBy=faculty|department|program  &splitBy=semester|courseType|year
 */
exports.getGroupedBar = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const groupBy = (req.query.groupBy || 'faculty').toString();
    const splitBy = (req.query.splitBy || 'semester').toString();

    const groupSelect = {
      faculty: { col: 'f.code', join: 'JOIN faculties f ON f.id = p.faculty_id', label: 'Facultate' },
      department: { col: 'p.department', join: '', label: 'Departament' },
      program: { col: 'pr.code', join: 'JOIN study_years sy ON sy.id = c.study_year_id JOIN programs pr ON pr.id = sy.program_id', label: 'Program' },
    };
    const splitSelect = {
      semester: { col: 'c.semester', label: 'Semestru' },
      courseType: { col: 'c.course_type', label: 'Tip curs' },
      year: { col: 'sy3.year_number', extra_join: 'JOIN study_years sy3 ON sy3.id = c.study_year_id', label: 'An' },
    };
    const gDef = groupSelect[groupBy];
    const sDef = splitSelect[splitBy];
    if (!gDef || !sDef) return res.status(400).json({ error: 'groupBy/splitBy invalid' });

    const evalF = buildEvalFilters(req.query, { withQuestion: false, withCourse: true });

    const rows = db
      .prepare(
        `SELECT ${gDef.col} AS group_key, ${sDef.col} AS split_key,
                COUNT(DISTINCT e.id) AS n_evals,
                AVG(r.response_likert) AS avg_score
         FROM responses r
         JOIN evaluations e ON e.id = r.evaluation_id
         JOIN professors p ON p.id = e.professor_id
         JOIN courses c ON c.id = e.course_id
         ${gDef.join}
         ${sDef.extra_join || ''}
         WHERE e.status='submitted' AND r.response_likert IS NOT NULL ${evalF.sql}
         GROUP BY group_key, split_key
         ORDER BY group_key, split_key`,
      )
      .all(...evalF.params);

    // Pivotează: { group: 'FI', semester_1: avg, semester_2: avg, n_1: count, n_2: count }
    const pivot = {};
    const splitValues = new Set();
    for (const r of rows) {
      const g = r.group_key;
      const s = r.split_key;
      splitValues.add(s);
      if (!pivot[g]) pivot[g] = { group: g };
      pivot[g][`avg_${s}`] = r.avg_score != null ? parseFloat(r.avg_score.toFixed(2)) : null;
      pivot[g][`n_${s}`] = r.n_evals || 0;
    }

    res.json({
      groupBy: gDef.label,
      splitBy: sDef.label,
      splits: [...splitValues].sort(),
      data: Object.values(pivot),
    });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/platform/top-rankings
 * Top-N rankings: entity = professors|courses|departments, metric = avg|count
 * Query: ?entity=...&metric=...&limit=10&order=desc|asc
 */
exports.getTopRankings = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const entity = (req.query.entity || 'departments').toString();
    const metric = (req.query.metric || 'avg').toString();
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
    const role = req.user.role;
    const userId = req.user.id;

    // === GDPR — RESTRICȚII PER ROL ===
    // - student: doar agregate (departamente). Nu poate vedea scoruri individuale
    //   ale profesorilor sau cursurilor (un curs = un profesor → de-anonimizează).
    // - professor: departamente + propriile cursuri. NU poate vedea alți profesori.
    // - admin: orice.
    if (role === 'student' && entity !== 'departments') {
      return res
        .status(403)
        .json({ error: 'Studenții pot vedea doar agregate pe departamente, nu rankinguri individuale.' });
    }
    if (role === 'professor' && entity === 'professors') {
      return res
        .status(403)
        .json({ error: 'Profesorii pot vedea doar departamente sau propriile lor cursuri.' });
    }
    const evalF = buildEvalFilters(req.query, { withQuestion: false, withCourse: true });

    const orderExpr = metric === 'count' ? 'n_evals' : 'avg_score';
    let sql, mapper;
    if (entity === 'professors') {
      sql = `SELECT p.id, p.first_name || ' ' || p.last_name AS name, p.title, p.department,
                    f.name AS faculty_name,
                    COUNT(DISTINCT e.id) AS n_evals,
                    AVG(r.response_likert) AS avg_score
             FROM professors p
             JOIN faculties f ON f.id = p.faculty_id
             LEFT JOIN evaluations e ON e.professor_id = p.id AND e.status='submitted'
             LEFT JOIN responses r ON r.evaluation_id = e.id AND r.response_likert IS NOT NULL
             LEFT JOIN courses c ON c.id = e.course_id
             WHERE 1=1 ${evalF.sql}
             GROUP BY p.id
             HAVING n_evals > 0
             ORDER BY ${orderExpr} ${order}
             LIMIT ${limit}`;
      // Pentru fiecare profesor în top, calculează programele unde predă (program codes)
      const programsByProfStmt = db.prepare(
        `SELECT DISTINCT pr.code AS code
         FROM courses c
         JOIN study_years sy ON sy.id = c.study_year_id
         JOIN programs pr ON pr.id = sy.program_id
         WHERE c.professor_id = ?
         ORDER BY pr.code`,
      );
      mapper = (r) => ({
        id: r.id,
        name: r.name,
        title: r.title,
        department: r.department,
        faculty: r.faculty_name,
        programs_taught: programsByProfStmt.all(r.id).map((x) => x.code),
        n_evals: r.n_evals || 0,
        avg_score: r.avg_score != null ? parseFloat(r.avg_score.toFixed(2)) : null,
      });
    } else if (entity === 'courses') {
      // Profesor: doar propriile cursuri
      let extraWhere = '';
      const extraParams = [];
      if (role === 'professor') {
        const profRow = db.prepare('SELECT professor_id FROM users WHERE id = ?').get(userId);
        if (profRow?.professor_id) {
          extraWhere = ' AND c.professor_id = ?';
          extraParams.push(profRow.professor_id);
        }
      }
      sql = `SELECT c.id, c.name, c.code, c.course_type, c.semester,
                    p.first_name || ' ' || p.last_name AS prof_name,
                    f.name AS faculty_name,
                    COUNT(DISTINCT e.id) AS n_evals,
                    AVG(r.response_likert) AS avg_score
             FROM courses c
             JOIN professors p ON p.id = c.professor_id
             JOIN faculties f ON f.id = p.faculty_id
             LEFT JOIN evaluations e ON e.course_id = c.id AND e.status='submitted'
             LEFT JOIN responses r ON r.evaluation_id = e.id AND r.response_likert IS NOT NULL
             WHERE 1=1 ${evalF.sql}${extraWhere}
             GROUP BY c.id
             HAVING n_evals > 0
             ORDER BY ${orderExpr} ${order}
             LIMIT ${limit}`;
      // mergem extra params înainte de orice query
      evalF.params.push(...extraParams);
      mapper = (r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        course_type: r.course_type,
        semester: r.semester,
        professor: r.prof_name,
        faculty: r.faculty_name,
        n_evals: r.n_evals || 0,
        avg_score: r.avg_score != null ? parseFloat(r.avg_score.toFixed(2)) : null,
      });
    } else if (entity === 'departments') {
      sql = `SELECT p.department AS name,
                    f.name AS faculty_name,
                    COUNT(DISTINCT e.id) AS n_evals,
                    AVG(r.response_likert) AS avg_score
             FROM professors p
             JOIN faculties f ON f.id = p.faculty_id
             LEFT JOIN evaluations e ON e.professor_id = p.id AND e.status='submitted'
             LEFT JOIN responses r ON r.evaluation_id = e.id AND r.response_likert IS NOT NULL
             LEFT JOIN courses c ON c.id = e.course_id
             WHERE p.department IS NOT NULL AND p.department <> '' ${evalF.sql}
             GROUP BY p.department
             HAVING n_evals > 0
             ORDER BY ${orderExpr} ${order}
             LIMIT ${limit}`;
      mapper = (r) => ({
        name: r.name,
        faculty: r.faculty_name,
        n_evals: r.n_evals || 0,
        avg_score: r.avg_score != null ? parseFloat(r.avg_score.toFixed(2)) : null,
      });
    } else {
      return res.status(400).json({ error: 'entity invalid' });
    }

    const items = db.prepare(sql).all(...evalF.params).map(mapper);
    res.json({ entity, metric, order: order.toLowerCase(), limit, items });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/platform/time-series-monthly
 * Trend lunar: submisii grupate per lună (YYYY-MM).
 * Query: ?months=12 (default ultimele 12 luni); restul filtre comune.
 */
exports.getTimeSeriesMonthly = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const months = Math.max(1, Math.min(60, Number(req.query.months) || 36));

    const evalF = buildEvalFilters(req.query, { withQuestion: false, withCourse: true });

    const rows = db
      .prepare(
        `SELECT strftime('%Y-%m', e.submitted_at) AS month,
                COUNT(DISTINCT e.id) AS submissions,
                AVG(r.response_likert) AS avg_score
         FROM evaluations e
         JOIN professors p ON p.id = e.professor_id
         JOIN courses c ON c.id = e.course_id
         LEFT JOIN responses r ON r.evaluation_id = e.id AND r.response_likert IS NOT NULL
         WHERE e.status='submitted'
           AND e.submitted_at >= date('now', '-' || ? || ' months')
           ${evalF.sql}
         GROUP BY month
         ORDER BY month ASC`,
      )
      .all(months, ...evalF.params);

    res.json({
      months,
      data: rows.map((r) => ({
        month: r.month,
        submissions: r.submissions,
        avg_score: r.avg_score != null ? parseFloat(r.avg_score.toFixed(2)) : null,
      })),
    });
  } catch (e) {
    next(e);
  }
};
