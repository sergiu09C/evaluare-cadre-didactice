const { getDatabase } = require('../config/database');

// Coloane YS/WD (You Said / We Did) — Cap. 1.4.4 din dizertație
const SELECT_COLS = `id, title, body, dot_color, related_dimension, sort_order,
                     student_said, we_did, triggered_by_semester, impact_metric,
                     created_at, updated_at`;

exports.listPublic = (req, res, next) => {
  try {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT ${SELECT_COLS} FROM closing_loop_entries
         WHERE is_published = 1 ORDER BY sort_order ASC, id ASC`,
      )
      .all();
    res.json({ entries: rows });
  } catch (e) { next(e); }
};

exports.listAdmin = (req, res, next) => {
  try {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT ${SELECT_COLS}, is_published
         FROM closing_loop_entries ORDER BY sort_order ASC, id ASC`,
      )
      .all();
    res.json({ entries: rows });
  } catch (e) { next(e); }
};

exports.create = (req, res, next) => {
  try {
    const db = getDatabase();
    const {
      title, body, dot_color, related_dimension, sort_order, is_published,
      student_said, we_did, triggered_by_semester, impact_metric,
    } = req.body || {};
    if (!title || !body) return res.status(400).json({ error: 'Titlu și conținut obligatorii' });
    const stmt = db.prepare(
      `INSERT INTO closing_loop_entries
         (title, body, dot_color, related_dimension, sort_order, is_published,
          student_said, we_did, triggered_by_semester, impact_metric)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const result = stmt.run(
      title,
      body,
      dot_color || '#7C3AED',
      related_dimension || null,
      sort_order ?? 99,
      is_published === false ? 0 : 1,
      student_said || null,
      we_did || null,
      triggered_by_semester || null,
      impact_metric || null,
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) { next(e); }
};

exports.update = (req, res, next) => {
  try {
    const db = getDatabase();
    const id = Number(req.params.id);
    const {
      title, body, dot_color, related_dimension, sort_order, is_published,
      student_said, we_did, triggered_by_semester, impact_metric,
    } = req.body || {};
    const existing = db.prepare('SELECT id FROM closing_loop_entries WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Intrare negăsită' });
    db.prepare(
      `UPDATE closing_loop_entries SET
         title = COALESCE(?, title),
         body = COALESCE(?, body),
         dot_color = COALESCE(?, dot_color),
         related_dimension = COALESCE(?, related_dimension),
         sort_order = COALESCE(?, sort_order),
         is_published = COALESCE(?, is_published),
         student_said = COALESCE(?, student_said),
         we_did = COALESCE(?, we_did),
         triggered_by_semester = COALESCE(?, triggered_by_semester),
         impact_metric = COALESCE(?, impact_metric),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    ).run(
      title ?? null,
      body ?? null,
      dot_color ?? null,
      related_dimension ?? null,
      sort_order ?? null,
      is_published === undefined ? null : is_published ? 1 : 0,
      student_said ?? null,
      we_did ?? null,
      triggered_by_semester ?? null,
      impact_metric ?? null,
      id,
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.remove = (req, res, next) => {
  try {
    const db = getDatabase();
    const id = Number(req.params.id);
    db.prepare('DELETE FROM closing_loop_entries WHERE id = ?').run(id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
