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
