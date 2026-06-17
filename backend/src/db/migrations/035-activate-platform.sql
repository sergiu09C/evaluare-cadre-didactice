-- Migration 035: asigură că platforma rămâne activă după reset seed
-- Extinde deadline, dezactivează auto-close și prelungește perioadele de evaluare expirate.
-- Idempotentă (UPDATE nu INSERT).

UPDATE platform_settings SET
  is_active = 1,
  evaluation_deadline_date = '2027-12-31 23:59:59',
  auto_close_on_deadline = 0
WHERE id = 1;

-- Prelungim perioadele de evaluare cu end_date în trecut pentru a preveni
-- dezactivarea automată din activationScheduler (care rulează la 10s după boot).
UPDATE evaluation_periods
SET end_date = '2027-12-31 23:59:59',
    is_active = 1
WHERE end_date <= datetime('now');
