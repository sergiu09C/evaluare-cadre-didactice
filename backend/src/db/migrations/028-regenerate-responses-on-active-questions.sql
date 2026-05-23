-- Migration 028: regenerez responses pe întrebările D1-D5 active (id 77-95)
--
-- Audit a descoperit:
--   - 71774 responses existau pe question_id ∈ [1, 13] (întrebări vechi, is_active=0)
--   - întrebările ACTIVE sunt id 77-100 (D1×4, D2×4, D3×4, D4×4, D5×3 + GLOBAL + 3 CONTEXT + COMMENT)
--   - KPI O1 (scor global) și O2 (scor per dimensiune) filtrează după dimension D1-D5
--     → returnau NULL fiindcă responses nu erau pe acele întrebări
--   - Cronbach α (validare psihometrică) — afectat identic
--
-- Fix: șterg responses vechi + generez 19 Likert + 1 GLOBAL + 3 CONTEXT per evaluare
-- submitted, deterministic per profesor (target_score) + noise per item.
--
-- Distribuție per profesor (bucket = (prof_id * 11) % 100):
--   [0, 5)   → target = 2.0  (slab — 5%)
--   [5, 20)  → target = 3.0  (mediu — 15%)
--   [20, 70) → target = 4.0  (bun — 50%)
--   [70,100) → target = 4.7  (excelent — 30%)
-- noise per response = ((eval_id*17 + qid*3) % 21 − 10) / 10  ∈ [−1.0, +1.0]
-- response_likert = clamp(round(target + noise), 1, 5)

-- =====================================================================
-- PASUL 1: șterg răspunsurile vechi (pe întrebări inactive 1-13)
-- =====================================================================
DELETE FROM responses WHERE question_id < 77;

-- =====================================================================
-- PASUL 2: 19 itemi Likert (D1-D5: question_id 77-95)
-- Cross-join cu CTE de question_ids
-- =====================================================================
-- Plus bias per dimensiune pentru a obține scoruri diferite pe D1-D5
-- (D3 Resurse intenționat mai slab — pattern cunoscut în literatură de specialitate;
-- D5 Disponibilitate intenționat mai bun — ușor de îndeplinit).
INSERT OR IGNORE INTO responses (evaluation_id, question_id, response_likert, created_at)
SELECT
  e.id AS evaluation_id,
  q.id AS question_id,
  MAX(1, MIN(5, CAST(ROUND(
    CASE
      WHEN (p.id * 11) % 100 <  5 THEN 2.0
      WHEN (p.id * 11) % 100 < 20 THEN 3.0
      WHEN (p.id * 11) % 100 < 70 THEN 4.0
      ELSE 4.7
    END
    + CASE q.dimension
        WHEN 'D1' THEN  0.10  -- Predare
        WHEN 'D2' THEN  0.05  -- Comunicare
        WHEN 'D3' THEN -0.25  -- Resurse (cea mai slabă — actionable insight)
        WHEN 'D4' THEN  0.00  -- Feedback
        WHEN 'D5' THEN  0.20  -- Disponibilitate (cea mai bună)
        ELSE 0
      END
    + (((e.id * 17 + q.id * 3) % 21) - 10) / 10.0
  ) AS INTEGER))) AS response_likert,
  e.submitted_at
FROM evaluations e
JOIN professors p ON p.id = e.professor_id
JOIN questions q ON q.is_active = 1 AND q.dimension IN ('D1','D2','D3','D4','D5')
WHERE e.status = 'submitted';

-- =====================================================================
-- PASUL 3: 1 răspuns GLOBAL (question_id 96)
-- =====================================================================
INSERT OR IGNORE INTO responses (evaluation_id, question_id, response_likert, created_at)
SELECT
  e.id, 96,
  MAX(1, MIN(5, CAST(ROUND(
    CASE
      WHEN (p.id * 11) % 100 <  5 THEN 2.0
      WHEN (p.id * 11) % 100 < 20 THEN 3.0
      WHEN (p.id * 11) % 100 < 70 THEN 4.0
      ELSE 4.7
    END
    + (((e.id * 19) % 21) - 10) / 10.0
  ) AS INTEGER))),
  e.submitted_at
FROM evaluations e
JOIN professors p ON p.id = e.professor_id
WHERE e.status = 'submitted';

-- =====================================================================
-- PASUL 4: 3 răspunsuri CONTEXT (question_id 97, 98, 99)
-- (intervale: prezență, dificultate, recomandare)
-- =====================================================================
INSERT OR IGNORE INTO responses (evaluation_id, question_id, response_likert, created_at)
SELECT e.id, qctx.qid,
  MAX(1, MIN(5, CAST(ROUND(3.5 + (((e.id * qctx.salt) % 21) - 10) / 10.0) AS INTEGER))),
  e.submitted_at
FROM evaluations e
JOIN (SELECT 97 AS qid, 23 AS salt UNION SELECT 98, 29 UNION SELECT 99, 31) qctx
WHERE e.status = 'submitted';

-- =====================================================================
-- PASUL 5: ~30% din evaluări primesc și un text COMMENT (question_id 100)
-- =====================================================================
INSERT OR IGNORE INTO responses (evaluation_id, question_id, response_text, created_at)
SELECT e.id, 100,
  CASE (e.id % 5)
    WHEN 0 THEN 'Curs bine structurat și prezentat. Aprecietez munca depusă.'
    WHEN 1 THEN 'Aș sugera mai multe exemple practice și exerciții aplicate.'
    WHEN 2 THEN 'Profesorul este disponibil și răspunde clar la întrebări.'
    WHEN 3 THEN 'Materialele de curs ar putea fi actualizate.'
    ELSE 'Apreciez stilul interactiv de predare. Recomand cursul.'
  END,
  e.submitted_at
FROM evaluations e
WHERE e.status = 'submitted' AND (e.id % 10) < 3;
