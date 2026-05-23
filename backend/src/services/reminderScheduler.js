/**
 * Reminder scheduler — conform CF-06 din dizertație + Cap. 3.3.
 * Rulează la fiecare oră, scanează evaluările active și identifică studenții
 * care nu au completat încă, trimițând notificări in-app la praguri:
 *   - 50% din durata perioadei
 *   - 80% din durata perioadei
 *
 * Implementarea folosește setInterval (zero dependențe). Datele se persist
 * în `reminders_log` pentru audit și pentru a evita reminder-uri duplicate.
 */
const { getDatabase } = require('../config/database');

const ONE_HOUR_MS = 60 * 60 * 1000;
const REMINDER_THRESHOLDS = [0.5, 0.8]; // 50% și 80% din perioada activă

function calculateProgress(startedAt, deadline) {
  if (!startedAt || !deadline) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(deadline).getTime();
  const now = Date.now();
  if (now < start || now > end || end <= start) return null;
  return (now - start) / (end - start);
}

function findThresholdsToTrigger(progress, alreadySent) {
  if (progress == null) return [];
  return REMINDER_THRESHOLDS.filter(
    (t) => progress >= t && !alreadySent.includes(t),
  );
}

/**
 * Rulează o singură iterație a scheduler-ului.
 * Returnează numărul de remindere trimise.
 */
function runReminderTick() {
  const db = getDatabase();
  let totalSent = 0;

  // Toate evaluările care sunt încă deschise + au deadline
  const openEvals = db
    .prepare(
      `SELECT id, course_id, professor_id, started_at, deadline
       FROM evaluations
       WHERE status != 'submitted'
         AND deadline IS NOT NULL
         AND datetime('now') < deadline
         AND datetime('now') > started_at`,
    )
    .all();

  if (openEvals.length === 0) return 0;

  for (const ev of openEvals) {
    const progress = calculateProgress(ev.started_at, ev.deadline);
    if (progress == null) continue;

    // Studenții eligibili = cei din groups/study_year-uri ale cursului
    // care NU au completat deja (verific completion_tokens).
    const candidates = db
      .prepare(
        `SELECT DISTINCT u.id, u.email
         FROM users u
         JOIN groups g ON g.id = u.group_id
         JOIN series s ON s.id = g.series_id
         JOIN study_years sy ON sy.id = s.study_year_id
         JOIN courses c ON c.study_year_id = sy.id
         WHERE c.id = ?
           AND u.role = 'student'
           AND u.is_active = 1
           AND NOT EXISTS (
             SELECT 1 FROM completion_tokens ct
             WHERE ct.evaluation_id = ? AND ct.user_id = u.id
           )`,
      )
      .all(ev.course_id, ev.id);

    for (const cand of candidates) {
      // verifică ce trigger-uri sunt deja trimise pentru această (evaluation, user)
      const sent = db
        .prepare(
          `SELECT threshold FROM reminders_log
           WHERE evaluation_id = ? AND user_id = ?`,
        )
        .all(ev.id, cand.id)
        .map((r) => r.threshold);

      const toTrigger = findThresholdsToTrigger(progress, sent);
      for (const t of toTrigger) {
        try {
          db.prepare(
            `INSERT INTO reminders_log
               (sent_to, message, sent_by, evaluation_id, user_id, threshold)
             VALUES (?, ?, 'system', ?, ?, ?)`,
          ).run(
            cand.email,
            `Reminder ${Math.round(t * 100)}%: evaluare expiră la ${new Date(ev.deadline).toLocaleDateString('ro-RO')}`,
            ev.id,
            cand.id,
            t,
          );
          totalSent++;
        } catch (e) {
          // Tabel poate să nu aibă coloanele noi (vechi DB); ignorăm silent în primul tick
        }
      }
    }
  }

  return totalSent;
}

let intervalHandle = null;

function startReminderScheduler({ intervalMs = ONE_HOUR_MS, enabled = true } = {}) {
  if (!enabled || intervalHandle) return;
  // Run once la pornire (după 30s ca să nu interfere cu boot)
  setTimeout(() => {
    try {
      const sent = runReminderTick();
      if (sent > 0) console.log(`[reminders] tick inițial: ${sent} remindere trimise`);
    } catch (e) {
      console.error('[reminders] eroare la tick inițial:', e.message);
    }
  }, 30_000);

  intervalHandle = setInterval(() => {
    try {
      const sent = runReminderTick();
      if (sent > 0) console.log(`[reminders] tick: ${sent} remindere trimise`);
    } catch (e) {
      console.error('[reminders] eroare la tick:', e.message);
    }
  }, intervalMs);

  if (intervalHandle.unref) intervalHandle.unref();
  console.log(`📨 Reminder scheduler pornit (interval ${intervalMs / 1000}s)`);
}

function stopReminderScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = {
  startReminderScheduler,
  stopReminderScheduler,
  runReminderTick, // exportat pentru endpoint admin manual + teste
  calculateProgress,
};
