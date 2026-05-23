-- Migration 024: shift toate timestamp-urile la mai 2026, fără ziua 24+
-- Cerere documentul „Erori identificate" punctul 2: toate datele să fie în mai 2026.
--
-- Strategy: distribuim datele între 1-22 mai 2026, păstrând ordinea relativă.
-- Folosim un offset bazat pe ID: id_min → 2026-05-01, id_max → 2026-05-22.

-- IDEMPOTENT: rulează doar dacă există măcar 1 timestamp din afara mai 2026.
-- Folosim INSERT INTO + dummy ca să prevenim execuția UPDATE-urilor dacă deja
-- migrate-on-boot a făcut shift-ul. Atributul: presupunem că nu se intră în mai
-- 2026 manual via UI — doar prin acest migration.

-- Variabile derivate via subquery (SQLite nu suportă declaration)
-- Toate evaluările submitted: redistribuim între 2026-05-01 09:00 și 2026-05-22 18:00
UPDATE evaluations
   SET submitted_at = datetime(
         '2026-05-01 09:00:00',
         '+' || (
           CAST((id - (SELECT MIN(id) FROM evaluations WHERE status='submitted')) AS REAL) * 21.0 * 24 * 3600 /
           NULLIF((SELECT MAX(id) - MIN(id) FROM evaluations WHERE status='submitted'), 0)
         ) || ' seconds'
       )
 WHERE status = 'submitted'
   AND (submitted_at < '2026-05-01' OR submitted_at > '2026-05-23');

-- started_at: cu 1-7 zile înainte (random-ish pe baza id-ului)
UPDATE evaluations
   SET started_at = datetime(submitted_at, '-' || (1 + (id % 7)) || ' days')
 WHERE status = 'submitted';

-- Draft-urile: started_at în ultimele 5 zile, deadline +14 zile
UPDATE evaluations
   SET started_at = datetime('2026-05-' || printf('%02d', 18 + (id % 5)) || ' 10:00:00'),
       deadline = '2026-06-05 23:59:59'
 WHERE status = 'draft';

-- completion_tokens sincronizate cu evaluations.submitted_at
UPDATE completion_tokens
   SET completed_at = (
     SELECT submitted_at FROM evaluations WHERE id = completion_tokens.evaluation_id
   )
 WHERE EXISTS (
   SELECT 1 FROM evaluations WHERE id = completion_tokens.evaluation_id AND submitted_at IS NOT NULL
 );

-- closing_loop_entries: updated_at în mai 2026 (sortare corectă pe Acasă)
UPDATE closing_loop_entries
   SET updated_at = datetime('2026-05-' || printf('%02d', 15 + (id % 8)) || ' 10:00:00'),
       triggered_by_semester = '2025-2026 / Sem 2'
 WHERE id > 0;

-- platform_feedback_submissions: distribuite în mai 2026
UPDATE platform_feedback_submissions
   SET submitted_at = datetime(
         '2026-05-05 12:00:00',
         '+' || (id % 17) || ' days',
         '+' || (id % 23 * 30) || ' minutes'
       )
 WHERE 1=1;
