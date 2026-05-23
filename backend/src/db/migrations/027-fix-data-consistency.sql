-- Migration 027: corecții consistență date
--
-- Audit complet (2026-05-23) a descoperit:
--   1. P2 „timp mediu completare" = 5782 min (4 zile) — absurd
--      cauza: started_at = submitted_at − (1..7 zile) din migrarea 024
--      fix: started_at = submitted_at − (2..6 minute) — realist
--   2. VIEW completion_rates returnează 100% pe toate facultățile
--      cauza: JOIN incorect între completion_tokens și faculty + lipsa filtrului
--             completed_at IS NOT NULL
--      fix: drop + recreate view bazat pe evaluations.status
--   3. Distribuția scoruri Likert prea concentrată în [3.5, 4.5]
--      → O4 = 37% (țintă < 20%)
--      fix: redistribuie cu bucketuri determinist:
--           low (5%), mid (15%), good (50%), top (30%)
--   4. Bug P1 (gestionat în adminController.js, NU aici): COUNT distinct user_id
--      din completion_tokens fără filtru completed_at IS NOT NULL

-- =====================================================================
-- PASUL 1: started_at realist pentru evaluările submitted
-- =====================================================================
UPDATE evaluations
   SET started_at = datetime(submitted_at, '-' || (2 + (id % 5)) || ' minutes')
 WHERE status = 'submitted' AND submitted_at IS NOT NULL;

-- =====================================================================
-- PASUL 2: VIEW completion_rates corect
-- =====================================================================
DROP VIEW IF EXISTS completion_rates;

CREATE VIEW completion_rates AS
SELECT
  f.id AS faculty_id,
  f.name AS faculty_name,
  COUNT(DISTINCT e.id) AS total_eligible,
  SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) AS completed,
  ROUND(
    100.0 * SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END)
    / NULLIF(COUNT(DISTINCT e.id), 0),
    2
  ) AS completion_rate
FROM faculties f
JOIN programs pr ON pr.faculty_id = f.id
JOIN study_years sy ON sy.program_id = pr.id
JOIN courses c ON c.study_year_id = sy.id
JOIN evaluations e ON e.course_id = c.id
GROUP BY f.id, f.name;

-- PASUL 3 (responses redistribuire) — mutat în migrarea 028 fiindcă responses
-- erau pe întrebări vechi (id 1-13) iar UPDATE-ul nu rezolva problema dimension.
-- Migrarea 028 șterge responses vechi și le regenerează pe întrebările active.
