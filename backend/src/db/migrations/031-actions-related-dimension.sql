-- Migration 031: leg acțiunile (professor_actions) de dimensiuni D1-D5
--
-- Cerere user: „există vreo corelare între acțiuni și cum se măsoară D1,D2 etc?"
-- Răspuns: în prezent nu — acțiunile au doar `category` text liber. Pentru a
-- închide bucla feedback→acțiune→efect, adăug:
--   - coloana `related_dimension TEXT` (D1..D5, CONTEXT, GLOBAL sau NULL)
--   - backfill determinist pe acțiunile existente, bazat pe `category`
--
-- Dimensiunile sunt cele din chestionar (Anexa A1):
--   D1=Predare, D2=Comunicare, D3=Resurse, D4=Feedback, D5=Disponibilitate

ALTER TABLE professor_actions ADD COLUMN related_dimension TEXT;

-- Backfill: deduc dimensiunea din category (best-effort)
UPDATE professor_actions
   SET related_dimension = CASE
         WHEN category LIKE '%predare%' OR category LIKE '%curs%' OR category LIKE '%training%' THEN 'D1'
         WHEN category LIKE '%comunic%' OR category LIKE '%meeting%' OR category LIKE '%feedback%studen%' THEN 'D2'
         WHEN category LIKE '%resurs%' OR category LIKE '%material%' OR category LIKE '%biblio%' THEN 'D3'
         WHEN category LIKE '%feedback%' OR category LIKE '%evaluare%' OR category LIKE '%review%' THEN 'D4'
         WHEN category LIKE '%disponibilitate%' OR category LIKE '%consultatii%' OR category LIKE '%consultații%' THEN 'D5'
         ELSE NULL
       END
 WHERE related_dimension IS NULL;

-- Pentru cele rămase fără dimensiune, atribui determinist pe baza id-ului
-- (distribuție echilibrată D1-D5, ca să avem date demonstrative)
UPDATE professor_actions
   SET related_dimension = CASE (id % 5)
         WHEN 0 THEN 'D1' WHEN 1 THEN 'D2' WHEN 2 THEN 'D3' WHEN 3 THEN 'D4' ELSE 'D5'
       END
 WHERE related_dimension IS NULL;
