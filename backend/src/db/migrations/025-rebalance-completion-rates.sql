-- Migration 025: rebalansare rate de completare
--
-- Cerință utilizator (2026-05-23):
--   - Rata agregată per universitate/facultate/departament/program/an/ciclu/
--     semestru/activitate să fie ÎN INTERVALUL [50%, 70%] (nu lângă 100%, nu 0%)
--   - Rata per profesor să fie ÎN INTERVALUL [30%, 90%] (variabilitate naturală)
--   - Acțiuni (professor_actions) redistribuite: completed > accepted > proposed > rejected,
--     fără 0 într-o categorie, fără 100%
--
-- Algoritm determinist (idempotent — recalculează același rezultat la rerun):
--   target_rate_per_prof = 35 + (professor_id * 7 + 11) % 51    → ∈ [35, 85]
--   evaluation completed iff hash(id, prof_id) % 100 < target_rate
--   hash = (id * 31 + professor_id * 17 + 23) % 100
--
-- Spread ±25 per profesor cu medie ~60 → LLN garantează agregatele ∈ [50,70]
-- pentru orice subset cu ≥15 profesori (toate departamentele au 20-25 profesori).

-- =====================================================================
-- PASUL 1: Recalculez status pe evaluations folosind hash determinist
-- =====================================================================
UPDATE evaluations
   SET status = CASE
         WHEN ((id * 31 + professor_id * 17 + 23) % 100)
              < (35 + (professor_id * 7 + 11) % 51)
         THEN 'submitted'
         ELSE 'draft'
       END;

-- =====================================================================
-- PASUL 2: submitted_at — păstrez vechea valoare dacă există, altfel
--           generez una în intervalul 2026-05-01..22
-- =====================================================================
UPDATE evaluations
   SET submitted_at = COALESCE(
         submitted_at,
         datetime('2026-05-01 09:00:00', '+' || ((id * 7919) % (22*24*3600)) || ' seconds')
       )
 WHERE status = 'submitted';

UPDATE evaluations
   SET submitted_at = NULL
 WHERE status = 'draft';

-- started_at: 1-7 zile înainte de submit pentru cele submitted
UPDATE evaluations
   SET started_at = datetime(submitted_at, '-' || (1 + (id % 7)) || ' days')
 WHERE status = 'submitted';

-- Draft-urile: started_at în ultimele 5 zile, deadline +14 zile
UPDATE evaluations
   SET started_at = datetime('2026-05-' || printf('%02d', 18 + (id % 5)) || ' 10:00:00'),
       submitted_at = NULL,
       deadline = '2026-06-05 23:59:59'
 WHERE status = 'draft';

-- =====================================================================
-- PASUL 3: completion_tokens — sync cu evaluations.status
-- Strategie: păstrez token-urile existente; setez completed_at conform status.
-- Tokens existente pentru evaluări acum „draft" → completed_at = NULL
-- Tokens existente pentru evaluări „submitted" → completed_at = submitted_at
-- =====================================================================
UPDATE completion_tokens
   SET completed_at = (
         SELECT CASE WHEN e.status = 'submitted' THEN e.submitted_at ELSE NULL END
           FROM evaluations e WHERE e.id = completion_tokens.evaluation_id
       );

-- Insert tokens lipsă pentru evaluări submitted care n-au token
-- (au rămas fără din migrarea anterioară). user_id determinist din pool studenți.
INSERT INTO completion_tokens (user_id, evaluation_id, completed_at)
SELECT
  52 + ((e.id * 13) % 1200),  -- user_id din intervalul student [52..1251]
  e.id,
  e.submitted_at
  FROM evaluations e
 WHERE e.status = 'submitted'
   AND NOT EXISTS (SELECT 1 FROM completion_tokens ct WHERE ct.evaluation_id = e.id);

-- =====================================================================
-- PASUL 4: closing_loop_entries — păstrez (nu are status), doar refresh date
-- =====================================================================
UPDATE closing_loop_entries
   SET updated_at = datetime('2026-05-' || printf('%02d', 15 + (id % 8)) || ' 10:00:00')
 WHERE id > 0;

-- =====================================================================
-- PASUL 5: professor_actions — redistribuie status în proporții cerute
--   completed: ~45%   (cele mai multe, „realizate")
--   accepted:  ~25%   (mediu-mare)
--   proposed:  ~20%   (mediu)  ← „solicitate"
--   rejected:  ~10%   (cele mai puține, „refuzate")
-- Distribuție bazată pe hash % 100:
--   [0, 45)  → completed
--   [45, 70) → accepted
--   [70, 90) → proposed
--   [90, 100)→ rejected
-- =====================================================================
UPDATE professor_actions
   SET status = CASE
         WHEN ((id * 41 + professor_id * 7 + 13) % 100) < 45 THEN 'completed'
         WHEN ((id * 41 + professor_id * 7 + 13) % 100) < 70 THEN 'accepted'
         WHEN ((id * 41 + professor_id * 7 + 13) % 100) < 90 THEN 'proposed'
         ELSE 'rejected'
       END;

-- Setează completed_at/accepted_at conform statusului nou (idempotent)
UPDATE professor_actions
   SET accepted_at = COALESCE(accepted_at, datetime(proposed_at, '+' || (1 + (id % 5)) || ' days')),
       completed_at = COALESCE(completed_at, datetime(proposed_at, '+' || (5 + (id % 10)) || ' days'))
 WHERE status = 'completed';

UPDATE professor_actions
   SET accepted_at = COALESCE(accepted_at, datetime(proposed_at, '+' || (1 + (id % 5)) || ' days')),
       completed_at = NULL
 WHERE status = 'accepted';

UPDATE professor_actions
   SET accepted_at = NULL,
       completed_at = NULL
 WHERE status IN ('proposed', 'rejected');
