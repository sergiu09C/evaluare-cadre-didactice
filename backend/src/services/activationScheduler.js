/**
 * Activation scheduler — D-04 dizertație (Cap. 3.3 + CF-04)
 * Rulează orar și gestionează ciclul de viață al perioadelor de evaluare:
 *
 *  (a) Activare automată: dacă o perioadă are start_date <= acum și is_active = 0
 *      → setează evaluation_periods.is_active = 1 + platform_settings.is_active = 1
 *
 *  (b) Dezactivare la expirare: dacă o perioadă are end_date <= acum și is_active = 1
 *      → setează evaluation_periods.is_active = 0
 *      → dacă nu mai există nicio perioadă activă, dezactivează și platform_settings
 *
 *  (c) Auto-close pe deadline: dacă adminul a activat auto_close_on_deadline în setări
 *      și termenul a trecut → dezactivează platform_settings.is_active
 *
 * Conflict manual/auto: scheduler-ul activează DOAR perioadele cu is_active = 0.
 * Dacă adminul dezactivează manual platforma în timp ce o perioadă rulează,
 * evaluation_periods.is_active rămâne 1 și scheduler-ul nu va re-activa platforma
 * la tick-ul următor (condiția de activare cere is_active = 0).
 */
const { getDatabase } = require('../config/database');

function runActivationTick() {
  const db = getDatabase();

  // (a) Activează perioadele care trebuie să înceapă acum
  const toActivate = db
    .prepare(
      `SELECT id, name FROM evaluation_periods
       WHERE is_active = 0
         AND datetime(start_date) <= datetime('now')
         AND datetime(end_date) > datetime('now')`,
    )
    .all();

  for (const p of toActivate) {
    db.prepare(`UPDATE evaluation_periods SET is_active = 1 WHERE id = ?`).run(p.id);
    db.prepare(
      `UPDATE platform_settings SET is_active = 1, last_updated = CURRENT_TIMESTAMP WHERE id = 1`,
    ).run();
    console.log(`[activation] Perioadă "${p.name}" (id=${p.id}) activată automat`);

    // D-07: notificări in-app pentru toți studenții cu evaluări nepreduse
    // (student_id IS NOT NULL → evaluare nedeschisă/draft; după submit devine NULL)
    const eligible = db
      .prepare(
        `SELECT DISTINCT u.id, u.email
         FROM users u
         JOIN evaluations e ON e.student_id = u.id
         WHERE u.role = 'student' AND u.is_active = 1 AND e.status != 'submitted'`,
      )
      .all();
    const notifMsg = `Evaluările sunt deschise (${p.name}). Completează-le înainte de termenul limită!`;
    const notifStmt = db.prepare(
      `INSERT INTO reminders_log (sent_to, message, sent_by, evaluation_id, user_id, threshold)
       VALUES (?, ?, 'system', NULL, ?, 0.0)`,
    );
    for (const s of eligible) {
      try { notifStmt.run(s.email, notifMsg, s.id); } catch (_) {}
    }
    if (eligible.length > 0) {
      console.log(`[activation] ${eligible.length} studenți notificați pentru perioada "${p.name}"`);
    }
  }

  // (b) Dezactivează perioadele expirate
  const toExpire = db
    .prepare(
      `SELECT id, name FROM evaluation_periods
       WHERE is_active = 1
         AND datetime(end_date) <= datetime('now')`,
    )
    .all();

  for (const p of toExpire) {
    db.prepare(`UPDATE evaluation_periods SET is_active = 0 WHERE id = ?`).run(p.id);
    console.log(`[activation] Perioadă "${p.name}" (id=${p.id}) marcată expirată`);
  }

  if (toExpire.length > 0) {
    const stillActive = db
      .prepare(`SELECT COUNT(*) AS n FROM evaluation_periods WHERE is_active = 1`)
      .get().n;
    if (stillActive === 0) {
      db.prepare(
        `UPDATE platform_settings SET is_active = 0, last_updated = CURRENT_TIMESTAMP WHERE id = 1`,
      ).run();
      console.log('[activation] Nicio perioadă activă rămasă — platforma dezactivată automat');
    }
  }

  // (c) Auto-close pe baza evaluation_deadline_date din platform_settings
  const settings = db
    .prepare(
      `SELECT is_active, evaluation_deadline_enabled, evaluation_deadline_date, auto_close_on_deadline
       FROM platform_settings WHERE id = 1`,
    )
    .get();

  if (
    settings &&
    settings.is_active &&
    settings.auto_close_on_deadline &&
    settings.evaluation_deadline_enabled &&
    settings.evaluation_deadline_date &&
    new Date(settings.evaluation_deadline_date) <= new Date()
  ) {
    db.prepare(
      `UPDATE platform_settings SET is_active = 0, last_updated = CURRENT_TIMESTAMP WHERE id = 1`,
    ).run();
    console.log(
      '[activation] Termen limită depășit — platforma dezactivată automat (auto_close_on_deadline)',
    );
  }
}

let handle = null;

function startActivationScheduler({ intervalMs = 60 * 60 * 1000 } = {}) {
  if (handle) return;
  // Prim tick după 10s — înainte de reminderScheduler (30s) pentru a activa platforma
  // înainte ca reminderScheduler să o găsească potențial inactivă
  setTimeout(() => {
    try {
      runActivationTick();
    } catch (e) {
      console.error('[activation] tick inițial:', e.message);
    }
  }, 10_000);

  handle = setInterval(() => {
    try {
      runActivationTick();
    } catch (e) {
      console.error('[activation] tick:', e.message);
    }
  }, intervalMs);

  if (handle.unref) handle.unref();
  console.log(`⏰ Activation scheduler pornit (interval ${intervalMs / 1000}s)`);
}

function stopActivationScheduler() {
  if (handle) {
    clearInterval(handle);
    handle = null;
  }
}

module.exports = { startActivationScheduler, stopActivationScheduler, runActivationTick };
