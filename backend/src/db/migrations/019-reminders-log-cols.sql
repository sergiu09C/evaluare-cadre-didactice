-- Migration 019: extinde reminders_log cu coloanele necesare pentru
-- scheduler-ul automat (evaluation_id, user_id, threshold).
-- ALTER TABLE poate eșua silent dacă coloanele există deja → controlat în init.js.

ALTER TABLE reminders_log ADD COLUMN evaluation_id INTEGER REFERENCES evaluations(id);
ALTER TABLE reminders_log ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE reminders_log ADD COLUMN threshold REAL;

CREATE INDEX IF NOT EXISTS idx_reminders_eval_user ON reminders_log(evaluation_id, user_id);
