const { getDatabase } = require('../config/database');

// ========== TEMPLATES ==========
exports.listTemplates = (req, res, next) => {
  try {
    const rows = getDatabase()
      .prepare('SELECT * FROM action_templates WHERE is_active = 1 ORDER BY category, title')
      .all();
    res.json({ templates: rows });
  } catch (e) { next(e); }
};

exports.createTemplate = (req, res, next) => {
  try {
    const { title, description, category, is_active } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title obligatoriu' });
    const result = getDatabase()
      .prepare('INSERT INTO action_templates (title, description, category, is_active) VALUES (?, ?, ?, ?)')
      .run(title, description || null, category || null, is_active === false ? 0 : 1);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) { next(e); }
};

exports.deleteTemplate = (req, res, next) => {
  try {
    getDatabase().prepare('DELETE FROM action_templates WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// ========== ADMIN: propunere acțiune pentru un profesor ==========
exports.proposeAction = (req, res, next) => {
  try {
    const { professor_id, template_id, title, description, category } = req.body || {};
    if (!professor_id || !title) return res.status(400).json({ error: 'professor_id și title obligatorii' });
    const result = getDatabase()
      .prepare(
        `INSERT INTO professor_actions (professor_id, template_id, title, description, category, status, proposed_by_user_id)
         VALUES (?, ?, ?, ?, ?, 'proposed', ?)`,
      )
      .run(
        Number(professor_id),
        template_id ? Number(template_id) : null,
        title,
        description || null,
        category || null,
        req.user.id,
      );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) { next(e); }
};

// ========== ADMIN: lista acțiuni pentru un profesor (sau toate) ==========
exports.adminListActions = (req, res, next) => {
  try {
    const { professor_id, status } = req.query || {};
    const where = ['1=1'];
    const params = [];
    if (professor_id) { where.push('pa.professor_id = ?'); params.push(Number(professor_id)); }
    if (status) { where.push('pa.status = ?'); params.push(status); }
    const rows = getDatabase()
      .prepare(
        `SELECT pa.*, p.first_name AS prof_first_name, p.last_name AS prof_last_name
         FROM professor_actions pa
         JOIN professors p ON p.id = pa.professor_id
         WHERE ${where.join(' AND ')}
         ORDER BY pa.proposed_at DESC`,
      )
      .all(...params);
    res.json({ actions: rows });
  } catch (e) { next(e); }
};

// ========== PROFESSOR: lista acțiuni proprii ==========
exports.professorListActions = (req, res, next) => {
  try {
    const db = getDatabase();
    const profUser = db.prepare('SELECT professor_id FROM users WHERE id = ?').get(req.user.id);
    if (!profUser?.professor_id) return res.json({ actions: [] });
    const rows = db
      .prepare(
        `SELECT * FROM professor_actions
         WHERE professor_id = ?
         ORDER BY
           CASE status WHEN 'proposed' THEN 0 WHEN 'accepted' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END,
           proposed_at DESC`,
      )
      .all(profUser.professor_id);
    res.json({ actions: rows });
  } catch (e) { next(e); }
};

// ========== PROFESSOR: accept / reject / complete ==========
exports.professorRespond = (req, res, next) => {
  try {
    const db = getDatabase();
    const profUser = db.prepare('SELECT professor_id FROM users WHERE id = ?').get(req.user.id);
    if (!profUser?.professor_id) return res.status(403).json({ error: 'Nu ești profesor' });

    const actionId = Number(req.params.id);
    const { decision, notes } = req.body || {};
    if (!['accepted', 'rejected', 'completed'].includes(decision)) {
      return res.status(400).json({ error: 'decision invalid: accepted | rejected | completed' });
    }

    const existing = db
      .prepare('SELECT id, professor_id, status FROM professor_actions WHERE id = ?')
      .get(actionId);
    if (!existing) return res.status(404).json({ error: 'Acțiune inexistentă' });
    if (existing.professor_id !== profUser.professor_id) {
      return res.status(403).json({ error: 'Nu îți aparține această acțiune' });
    }

    const now = new Date().toISOString();
    if (decision === 'accepted') {
      db.prepare('UPDATE professor_actions SET status = ?, accepted_at = ?, notes = COALESCE(?, notes) WHERE id = ?')
        .run('accepted', now, notes ?? null, actionId);
    } else if (decision === 'rejected') {
      db.prepare('UPDATE professor_actions SET status = ?, notes = COALESCE(?, notes) WHERE id = ?')
        .run('rejected', notes ?? null, actionId);
    } else if (decision === 'completed') {
      db.prepare('UPDATE professor_actions SET status = ?, completed_at = ?, notes = COALESCE(?, notes) WHERE id = ?')
        .run('completed', now, notes ?? null, actionId);
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// ========== AGREGATOR pentru finalizarea evaluării (admin) ==========
exports.aggregatedSummary = (req, res, next) => {
  try {
    const { professor_id } = req.query || {};
    if (!professor_id) return res.status(400).json({ error: 'professor_id obligatoriu' });
    const db = getDatabase();
    const pid = Number(professor_id);

    const counts = db
      .prepare(
        `SELECT
           SUM(CASE WHEN status = 'proposed' THEN 1 ELSE 0 END) AS proposed,
           SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
         FROM professor_actions WHERE professor_id = ?`,
      )
      .get(pid);

    const byCategory = db
      .prepare(
        `SELECT category, COUNT(*) AS total
         FROM professor_actions
         WHERE professor_id = ? AND status IN ('accepted', 'completed')
         GROUP BY category`,
      )
      .all(pid);

    const meetings = db
      .prepare(
        `SELECT COUNT(*) AS n FROM professor_actions
         WHERE professor_id = ? AND category = 'meeting' AND status = 'completed'`,
      )
      .get(pid).n;

    res.json({
      counts,
      meetings_completed: meetings,
      by_category: byCategory,
    });
  } catch (e) { next(e); }
};
