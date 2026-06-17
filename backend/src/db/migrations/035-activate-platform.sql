-- Migration 035: asigură că platforma rămâne activă după reset seed
-- Deadline extins la 2027-12-31 și auto-close dezactivat pentru demo.
-- Idempotentă (UPDATE nu INSERT).

UPDATE platform_settings SET
  is_active = 1,
  evaluation_deadline_date = '2027-12-31 23:59:59',
  auto_close_on_deadline = 0
WHERE id = 1;
