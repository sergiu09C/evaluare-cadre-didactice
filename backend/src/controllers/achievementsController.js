const { getDatabase } = require('../config/database');

/**
 * Engine: recalculează achievements pentru un user pe baza datelor curente.
 * Apelat după fiecare submit din partea studentului.
 */
function recalculateForUser(db, userId) {
  const defs = db.prepare('SELECT * FROM achievement_definitions WHERE is_active = 1').all();
  if (!defs.length) return;

  // Strângem metrici pentru user în paralel.
  // ANONIMITATE: după submit, evaluations.student_id e NULL. Folosim
  // completion_tokens (tabelul separat care înregistrează cine a completat)
  // pentru a număra contribuțiile per user, FĂRĂ să corelăm răspunsurile.
  // BUG FIX: filtrez completed_at IS NOT NULL — tokens cu completed_at=NULL
  // sunt drafturi în desfășurare, NU evaluări trimise. Înainte achievement-urile
  // se acordau și pentru drafturi → contraintuitiv (ex. Explorator la 8/10).
  const submittedCount = db
    .prepare('SELECT COUNT(*) AS n FROM completion_tokens WHERE user_id = ? AND completed_at IS NOT NULL')
    .get(userId).n;
  const commentsWithText = db
    .prepare(
      `SELECT COUNT(DISTINCT ct.evaluation_id) AS n
       FROM completion_tokens ct
       JOIN responses r ON r.evaluation_id = ct.evaluation_id
       WHERE ct.user_id = ? AND ct.completed_at IS NOT NULL
         AND r.response_text IS NOT NULL AND LENGTH(r.response_text) > 10`,
    )
    .get(userId).n;
  // Fast responder: evaluări completate în <= 3 zile de la started_at
  const fastCount = db
    .prepare(
      `SELECT COUNT(*) AS n
       FROM completion_tokens ct
       JOIN evaluations e ON e.id = ct.evaluation_id
       WHERE ct.user_id = ? AND ct.completed_at IS NOT NULL
         AND e.submitted_at IS NOT NULL AND e.started_at IS NOT NULL
         AND (julianday(e.submitted_at) - julianday(e.started_at)) <= 3`,
    )
    .get(userId).n;
  // Streak semesters: distinct (academic_year, semester) cu completări
  const streakRow = db
    .prepare(
      `SELECT COUNT(DISTINCT c.academic_year || '-' || c.semester) AS n
       FROM completion_tokens ct
       JOIN evaluations e ON e.id = ct.evaluation_id
       JOIN courses c ON c.id = e.course_id
       WHERE ct.user_id = ? AND ct.completed_at IS NOT NULL`,
    )
    .get(userId);
  const streakCount = streakRow?.n || 0;

  const insertOrIgnore = db.prepare(
    'INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
  );
  const remove = db.prepare('DELETE FROM user_achievements WHERE user_id = ? AND achievement_id = ?');

  for (const def of defs) {
    let value = 0;
    switch (def.criteria_type) {
      case 'count_submitted':
        value = submittedCount;
        break;
      case 'comments_with_text':
        value = commentsWithText;
        break;
      case 'fast_responder':
        value = fastCount;
        break;
      case 'streak_semesters':
        value = streakCount;
        break;
      case 'first_in_program':
        // Simplification: first to submit in their program
        value = submittedCount >= 1 ? 1 : 0;
        break;
    }

    if (value >= def.threshold) {
      insertOrIgnore.run(userId, def.id);
    } else {
      // Revoke if previously earned but criteria no longer met (rar dar consistent)
      remove.run(userId, def.id);
    }
  }
}

// POST /api/achievements/recalc-all (admin) — re-evaluează toți userii
exports.recalcAll = (req, res, next) => {
  try {
    const db = getDatabase();
    const users = db.prepare("SELECT id FROM users WHERE role='student' AND is_active=1").all();
    for (const u of users) recalculateForUser(db, u.id);
    res.json({ ok: true, recalculated: users.length });
  } catch (e) { next(e); }
};

// GET /api/achievements/definitions (admin)
exports.listDefinitions = (req, res, next) => {
  try {
    const rows = getDatabase().prepare('SELECT * FROM achievement_definitions ORDER BY threshold, id').all();
    res.json({ definitions: rows });
  } catch (e) { next(e); }
};

// POST /api/achievements/definitions (admin)
exports.createDefinition = (req, res, next) => {
  try {
    const { key, title, description, icon, tone, criteria_type, threshold, is_active } = req.body || {};
    if (!key || !title || !criteria_type || threshold == null) {
      return res.status(400).json({ error: 'key, title, criteria_type, threshold sunt obligatorii' });
    }
    const validTypes = ['count_submitted', 'streak_semesters', 'comments_with_text', 'first_in_program', 'fast_responder'];
    if (!validTypes.includes(criteria_type)) {
      return res.status(400).json({ error: 'criteria_type invalid' });
    }
    const result = getDatabase()
      .prepare(
        `INSERT INTO achievement_definitions (key, title, description, icon, tone, criteria_type, threshold, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        key,
        title,
        description || '',
        icon || 'trophy',
        tone || 'accent',
        criteria_type,
        Number(threshold),
        is_active === false ? 0 : 1,
      );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) { next(e); }
};

// PUT /api/achievements/definitions/:id (admin)
exports.updateDefinition = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, description, icon, tone, criteria_type, threshold, is_active } = req.body || {};
    const existing = getDatabase().prepare('SELECT id FROM achievement_definitions WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Definiție inexistentă' });
    getDatabase()
      .prepare(
        `UPDATE achievement_definitions SET
           title = COALESCE(?, title),
           description = COALESCE(?, description),
           icon = COALESCE(?, icon),
           tone = COALESCE(?, tone),
           criteria_type = COALESCE(?, criteria_type),
           threshold = COALESCE(?, threshold),
           is_active = COALESCE(?, is_active),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .run(
        title ?? null,
        description ?? null,
        icon ?? null,
        tone ?? null,
        criteria_type ?? null,
        threshold != null ? Number(threshold) : null,
        is_active === undefined ? null : is_active ? 1 : 0,
        id,
      );
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// DELETE /api/achievements/definitions/:id (admin)
exports.removeDefinition = (req, res, next) => {
  try {
    getDatabase().prepare('DELETE FROM achievement_definitions WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// GET /api/achievements/user — returnează definițiile + earned per user curent
exports.getUserAchievements = (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    // Recalcul on-the-fly pentru a fi mereu sincronizat
    try { recalculateForUser(db, userId); } catch (_) { /* tolerăm */ }

    const rows = db
      .prepare(
        `SELECT ad.id, ad.key, ad.title, ad.description, ad.icon, ad.tone, ad.criteria_type, ad.threshold,
                ua.earned_at IS NOT NULL AS earned, ua.earned_at
         FROM achievement_definitions ad
         LEFT JOIN user_achievements ua ON ua.achievement_id = ad.id AND ua.user_id = ?
         WHERE ad.is_active = 1
         ORDER BY (ua.earned_at IS NOT NULL) DESC, ad.threshold ASC`,
      )
      .all(userId);

    const totalActive = rows.length;
    const earnedCount = rows.filter((r) => r.earned).length;
    res.json({
      achievements: rows.map((r) => ({
        id: r.id,
        key: r.key,
        title: r.title,
        description: r.description,
        icon: r.icon,
        tone: r.tone,
        earned: !!r.earned,
        earnedAt: r.earned_at,
      })),
      totalBadges: earnedCount,
      totalPossible: totalActive,
    });
  } catch (e) { next(e); }
};

exports.recalculateForUser = recalculateForUser;
