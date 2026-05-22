const { getDatabase } = require('../config/database');

// GET /api/platform-feedback/questions — pentru user curent (formular CURAT)
// Nu mai pre-completează cu răspunsurile anterioare — fiecare submisie e independentă.
// Returnează în plus `submissionCount` (câte feedbackuri a transmis userul până acum).
exports.listForUser = (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT q.id, q.text, q.type, q.category, q.options_json, q.is_required
         FROM platform_feedback_questions q
         WHERE q.is_active = 1 AND ',' || q.target_roles || ',' LIKE '%,' || ? || ',%'
         ORDER BY q.order_index, q.id`,
      )
      .all(role);
    const submissionCount = db
      .prepare('SELECT COUNT(*) AS n FROM platform_feedback_submissions WHERE user_id = ?')
      .get(userId).n;
    res.json({
      questions: rows.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        category: q.category,
        options: q.options_json ? JSON.parse(q.options_json) : [],
        is_required: !!q.is_required,
        response: null, // formular mereu curat
      })),
      submissionCount,
    });
  } catch (e) { next(e); }
};

// POST /api/platform-feedback/submit — creează O SUBMISIE NOUĂ (nu mai face upsert).
exports.submit = (req, res, next) => {
  try {
    const userId = req.user.id;
    const { responses } = req.body || {};
    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ error: 'responses array obligatoriu' });
    }
    const db = getDatabase();
    const insertSubmission = db.prepare(
      `INSERT INTO platform_feedback_submissions (user_id) VALUES (?)`,
    );
    const insertResponse = db.prepare(
      `INSERT INTO platform_feedback_responses
         (submission_id, user_id, question_id, response_likert, response_text, response_choice)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const tx = db.transaction((rows) => {
      const subId = insertSubmission.run(userId).lastInsertRowid;
      let n = 0;
      for (const r of rows) {
        if (!r.questionId) continue;
        // sar peste itemii goi — nu poluez istoricul
        if (r.likert == null && (!r.text || !r.text.trim()) && (!r.choice || !r.choice.trim())) continue;
        insertResponse.run(subId, userId, r.questionId, r.likert ?? null, r.text ?? null, r.choice ?? null);
        n++;
      }
      return { subId, n };
    });
    const result = tx(responses);
    const newCount = db
      .prepare('SELECT COUNT(*) AS n FROM platform_feedback_submissions WHERE user_id = ?')
      .get(userId).n;
    res.json({ ok: true, submissionId: result.subId, count: result.n, submissionCount: newCount });
  } catch (e) { next(e); }
};

// GET /api/platform-feedback/history — istoricul submisiilor user-ului curent
exports.listMySubmissions = (req, res, next) => {
  try {
    const userId = req.user.id;
    const db = getDatabase();
    const subs = db
      .prepare(
        `SELECT s.id, s.submitted_at,
                (SELECT COUNT(*) FROM platform_feedback_responses r WHERE r.submission_id = s.id) AS responseCount
         FROM platform_feedback_submissions s
         WHERE s.user_id = ?
         ORDER BY s.submitted_at DESC, s.id DESC`,
      )
      .all(userId);
    res.json({ submissions: subs });
  } catch (e) { next(e); }
};

// GET /api/platform-feedback/history/:id — detaliile unei submisii (cu întrebarea + răspuns)
exports.getMySubmission = (req, res, next) => {
  try {
    const userId = req.user.id;
    const subId = Number(req.params.id);
    const db = getDatabase();
    const sub = db
      .prepare('SELECT id, submitted_at, user_id FROM platform_feedback_submissions WHERE id = ?')
      .get(subId);
    if (!sub || sub.user_id !== userId) {
      return res.status(404).json({ error: 'Submisie inexistentă' });
    }
    const items = db
      .prepare(
        `SELECT q.id AS question_id, q.text AS question_text, q.type, q.category, q.options_json,
                r.response_likert, r.response_text, r.response_choice
         FROM platform_feedback_responses r
         JOIN platform_feedback_questions q ON q.id = r.question_id
         WHERE r.submission_id = ?
         ORDER BY q.order_index, q.id`,
      )
      .all(subId);
    res.json({
      submission: { id: sub.id, submittedAt: sub.submitted_at },
      items: items.map((it) => ({
        questionId: it.question_id,
        text: it.question_text,
        type: it.type,
        category: it.category,
        options: it.options_json ? JSON.parse(it.options_json) : [],
        response: {
          likert: it.response_likert,
          text: it.response_text,
          choice: it.response_choice,
        },
      })),
    });
  } catch (e) { next(e); }
};

// ============ ADMIN ============
exports.adminListQuestions = (req, res, next) => {
  try {
    const rows = getDatabase().prepare('SELECT * FROM platform_feedback_questions ORDER BY order_index, id').all();
    res.json({ questions: rows });
  } catch (e) { next(e); }
};

exports.adminCreateQuestion = (req, res, next) => {
  try {
    const { text, type, category, options, order_index, is_required, target_roles, is_active } = req.body || {};
    if (!text || !type) return res.status(400).json({ error: 'text și type obligatorii' });
    if (!['likert', 'text', 'choice'].includes(type)) return res.status(400).json({ error: 'type invalid' });
    const result = getDatabase()
      .prepare(
        `INSERT INTO platform_feedback_questions (text, type, category, options_json, order_index, is_required, target_roles, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        text,
        type,
        category || null,
        options ? JSON.stringify(options) : null,
        order_index ?? 99,
        is_required ? 1 : 0,
        target_roles || 'student,professor',
        is_active === false ? 0 : 1,
      );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) { next(e); }
};

exports.adminUpdateQuestion = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { text, type, category, options, order_index, is_required, target_roles, is_active } = req.body || {};
    getDatabase()
      .prepare(
        `UPDATE platform_feedback_questions SET
           text = COALESCE(?, text),
           type = COALESCE(?, type),
           category = COALESCE(?, category),
           options_json = COALESCE(?, options_json),
           order_index = COALESCE(?, order_index),
           is_required = COALESCE(?, is_required),
           target_roles = COALESCE(?, target_roles),
           is_active = COALESCE(?, is_active),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .run(
        text ?? null,
        type ?? null,
        category ?? null,
        options ? JSON.stringify(options) : null,
        order_index ?? null,
        is_required === undefined ? null : is_required ? 1 : 0,
        target_roles ?? null,
        is_active === undefined ? null : is_active ? 1 : 0,
        id,
      );
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.adminDeleteQuestion = (req, res, next) => {
  try {
    getDatabase().prepare('DELETE FROM platform_feedback_questions WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// GET /api/platform-feedback/report (admin)
exports.adminReport = (req, res, next) => {
  try {
    const db = getDatabase();
    const questions = db.prepare('SELECT * FROM platform_feedback_questions WHERE is_active = 1 ORDER BY order_index').all();
    const total_respondents = db.prepare('SELECT COUNT(DISTINCT user_id) AS n FROM platform_feedback_responses').get().n;
    const total_submissions = db.prepare('SELECT COUNT(*) AS n FROM platform_feedback_submissions').get().n;

    const report = questions.map((q) => {
      if (q.type === 'likert') {
        const dist = db
          .prepare(
            `SELECT response_likert AS score, COUNT(*) AS n
             FROM platform_feedback_responses
             WHERE question_id = ? AND response_likert IS NOT NULL
             GROUP BY response_likert ORDER BY response_likert`,
          )
          .all(q.id);
        const total = dist.reduce((a, b) => a + b.n, 0);
        const avg = total > 0 ? dist.reduce((a, b) => a + b.score * b.n, 0) / total : null;
        // interpretation
        let interpretation = 'Date insuficiente';
        if (avg != null) {
          if (avg >= 4.5) interpretation = 'Foarte pozitiv — feedback excelent.';
          else if (avg >= 4.0) interpretation = 'Pozitiv — majoritatea utilizatorilor sunt mulțumiți.';
          else if (avg >= 3.5) interpretation = 'Neutru-bun — există loc de îmbunătățire.';
          else if (avg >= 2.5) interpretation = 'Mixt — zone de atenție; analizează comentariile text.';
          else interpretation = 'Negativ — necesită intervenție urgentă.';
        }
        return {
          question_id: q.id,
          text: q.text,
          type: q.type,
          category: q.category,
          total_responses: total,
          average: avg != null ? Number(avg.toFixed(2)) : null,
          distribution: [1, 2, 3, 4, 5].map((s) => ({ score: s, count: dist.find((d) => d.score === s)?.n || 0 })),
          interpretation,
        };
      }
      if (q.type === 'text') {
        const texts = db
          .prepare(
            `SELECT response_text, submitted_at
             FROM platform_feedback_responses
             WHERE question_id = ? AND response_text IS NOT NULL AND length(response_text) > 0
             ORDER BY submitted_at DESC LIMIT 100`,
          )
          .all(q.id);
        return {
          question_id: q.id,
          text: q.text,
          type: q.type,
          category: q.category,
          total_responses: texts.length,
          recent_responses: texts,
        };
      }
      // choice
      const choices = db
        .prepare(
          `SELECT response_choice AS choice, COUNT(*) AS n
           FROM platform_feedback_responses
           WHERE question_id = ? AND response_choice IS NOT NULL
           GROUP BY response_choice`,
        )
        .all(q.id);
      return {
        question_id: q.id,
        text: q.text,
        type: q.type,
        category: q.category,
        total_responses: choices.reduce((a, b) => a + b.n, 0),
        distribution: choices,
      };
    });

    res.json({ report, total_respondents, total_submissions });
  } catch (e) { next(e); }
};

// ====== MESAJE FREE-FORM CU CLOSING-LOOP ======

// POST /api/platform-feedback/messages — user transmite mesaj nou
exports.createMessage = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const { subject, message, category } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Mesajul este obligatoriu' });
    }
    if (message.length > 4000) {
      return res.status(400).json({ error: 'Mesajul depășește 4000 caractere' });
    }
    const r = db
      .prepare(
        `INSERT INTO platform_feedback_messages (user_id, user_role, subject, message, category)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(req.user.id, req.user.role, subject || null, message.trim(), category || null);
    res.status(201).json({ id: r.lastInsertRowid });
  } catch (e) {
    next(e);
  }
};

// GET /api/platform-feedback/messages/mine — user vede istoricul mesajelor sale
exports.listMyMessages = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT m.id, m.subject, m.message, m.category, m.status,
                m.admin_response, m.admin_response_at,
                m.created_at, m.updated_at,
                au.first_name AS admin_first_name, au.last_name AS admin_last_name
         FROM platform_feedback_messages m
         LEFT JOIN users au ON au.id = m.admin_user_id
         WHERE m.user_id = ?
         ORDER BY m.created_at DESC`,
      )
      .all(req.user.id);
    res.json({ messages: rows });
  } catch (e) {
    next(e);
  }
};

// GET /api/platform-feedback/messages — admin vede toate mesajele
exports.adminListMessages = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const { status, role } = req.query || {};
    const where = ['1=1'];
    const params = [];
    if (status) {
      where.push('m.status = ?');
      params.push(status);
    }
    if (role) {
      where.push('m.user_role = ?');
      params.push(role);
    }
    const rows = db
      .prepare(
        `SELECT m.id, m.user_id, m.user_role, m.subject, m.message, m.category, m.status,
                m.admin_response, m.admin_response_at, m.created_at, m.updated_at,
                u.first_name AS user_first_name, u.last_name AS user_last_name, u.email AS user_email,
                au.first_name AS admin_first_name, au.last_name AS admin_last_name
         FROM platform_feedback_messages m
         JOIN users u ON u.id = m.user_id
         LEFT JOIN users au ON au.id = m.admin_user_id
         WHERE ${where.join(' AND ')}
         ORDER BY
           CASE m.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'answered' THEN 2 ELSE 3 END,
           m.created_at DESC`,
      )
      .all(...params);
    res.json({ messages: rows });
  } catch (e) {
    next(e);
  }
};

// POST /api/platform-feedback/messages/:id/respond — admin răspunde + setează status
exports.adminRespond = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const id = Number(req.params.id);
    const { response, status } = req.body || {};
    const validStatus = ['open', 'in_progress', 'answered', 'closed'];
    const newStatus = validStatus.includes(status) ? status : 'answered';
    if (!response || !response.trim()) {
      return res.status(400).json({ error: 'Răspunsul este obligatoriu' });
    }
    const r = db
      .prepare(
        `UPDATE platform_feedback_messages
         SET admin_response = ?, admin_response_at = CURRENT_TIMESTAMP,
             admin_user_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .run(response.trim(), req.user.id, newStatus, id);
    if (r.changes === 0) return res.status(404).json({ error: 'Mesaj inexistent' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

// PATCH /api/platform-feedback/messages/:id/status — schimbă doar statusul (ex: close fără răspuns)
exports.adminUpdateStatus = (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const id = Number(req.params.id);
    const { status } = req.body || {};
    const valid = ['open', 'in_progress', 'answered', 'closed'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Status invalid' });
    const r = db
      .prepare(
        `UPDATE platform_feedback_messages
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .run(status, id);
    if (r.changes === 0) return res.status(404).json({ error: 'Mesaj inexistent' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
