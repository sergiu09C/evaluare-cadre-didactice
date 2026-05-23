-- Migration 020: extinde closing_loop_entries pentru formatul „You Said, We Did".
-- Conform Cap. 1.4.4 + Cap. 3.5 din dizertație, mecanismul-cheie al modelului propus.
--
-- Coloane noi:
--   - student_said: TEXT — citat anonim din comentariile studenților care
--                     a generat acțiunea (ex: „Materialele nu sunt actualizate")
--   - we_did: TEXT — acțiunea concretă luată ca răspuns
--   - triggered_by_semester: TEXT — semestrul evaluării care a generat acțiunea
--   - impact_metric: TEXT — metric măsurabil (ex: „D3 Resurse: 3.2 → 3.8")
--
-- ALTER TABLE eșuează silent dacă coloanele există → controlat în init.js.

ALTER TABLE closing_loop_entries ADD COLUMN student_said TEXT;
ALTER TABLE closing_loop_entries ADD COLUMN we_did TEXT;
ALTER TABLE closing_loop_entries ADD COLUMN triggered_by_semester TEXT;
ALTER TABLE closing_loop_entries ADD COLUMN impact_metric TEXT;

-- Backfill demo pentru entries-urile existente (only when fields sunt NULL)
UPDATE closing_loop_entries SET
  student_said = 'Materialele de curs sunt depășite și greu accesibile.',
  we_did = 'Am actualizat materialele a 12 cursuri și am implementat un portal unificat pe Moodle UNSTPB.',
  triggered_by_semester = '2024-2025 / Sem 1',
  impact_metric = 'D3 Resurse: 3.2 → 3.8 (+19%)'
WHERE id = 1 AND student_said IS NULL;

UPDATE closing_loop_entries SET
  student_said = 'Profesorii nu oferă feedback constructiv după examene.',
  we_did = 'Am organizat sesiuni post-examen obligatorii (15 min/curs) pentru explicarea grilelor și a punctajelor.',
  triggered_by_semester = '2024-2025 / Sem 1',
  impact_metric = 'D4 Feedback: 3.0 → 3.5 (+17%)'
WHERE id = 2 AND student_said IS NULL;

UPDATE closing_loop_entries SET
  student_said = 'Orarul de consultații e prea restrâns și nu coincide cu programul nostru.',
  we_did = 'Am introdus consultații hibride (1h fizice + 1h online) și un sistem de programare cu calendar partajat.',
  triggered_by_semester = '2024-2025 / Sem 1',
  impact_metric = 'D5 Disponibilitate: 3.5 → 4.0 (+14%)'
WHERE id = 3 AND student_said IS NULL;
