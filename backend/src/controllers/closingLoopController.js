const { getDatabase } = require('../config/database');

exports.listPublic = (req, res, next) => {
  try {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT id, title, body, dot_color, related_dimension, sort_order, updated_at
         FROM closing_loop_entries
         WHERE is_published = 1
         ORDER BY sort_order ASC, id ASC`,
      )
      .all();
    res.json({ entries: rows });
  } catch (e) {
    next(e);
  }
};

exports.listAdmin = (req, res, next) => {
  try {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT id, title, body, dot_color, related_dimension, sort_order, is_published, created_at, updated_at
         FROM closing_loop_entries
         ORDER BY sort_order ASC, id ASC`,
      )
      .all();
    res.json({ entries: rows });
  } catch (e) {
    next(e);
  }
};

exports.create = (req, res, next) => {
  try {
    const db = getDatabase();
    const { title, body, dot_color, related_dimension, sort_order, is_published } = req.body || {};
    if (!title || !body) return res.status(400).json({ error: 'Titlu și conținut obligatorii' });
    const stmt = db.prepare(
      `INSERT INTO closing_loop_entries (title, body, dot_color, related_dimension, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const result = stmt.run(
      title,
      body,
      dot_color || '#7C3AED',
      related_dimension || null,
      sort_order ?? 99,
      is_published === false ? 0 : 1,
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    next(e);
  }
};

exports.update = (req, res, next) => {
  try {
    const db = getDatabase();
    const id = Number(req.params.id);
    const { title, body, dot_color, related_dimension, sort_order, is_published } = req.body || {};
    const existing = db.prepare('SELECT id FROM closing_loop_entries WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Intrare negăsită' });
    db.prepare(
      `UPDATE closing_loop_entries
       SET title = COALESCE(?, title),
           body = COALESCE(?, body),
           dot_color = COALESCE(?, dot_color),
           related_dimension = COALESCE(?, related_dimension),
           sort_order = COALESCE(?, sort_order),
           is_published = COALESCE(?, is_published),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    ).run(
      title ?? null,
      body ?? null,
      dot_color ?? null,
      related_dimension ?? null,
      sort_order ?? null,
      is_published === undefined ? null : is_published ? 1 : 0,
      id,
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
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
