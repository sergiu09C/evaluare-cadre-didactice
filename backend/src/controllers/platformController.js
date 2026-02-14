const { getDatabase } = require('../config/database');
const emailService = require('../services/emailService');

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
