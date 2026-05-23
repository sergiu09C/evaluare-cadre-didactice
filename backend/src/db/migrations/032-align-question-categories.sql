-- Migration 032: aliniere question.category cu dimension semantică (D1-D5)
--
-- Cerere: tabelul „Detalii întrebări" din /professor/course/:id arată
-- categorii care nu corespund dimensiunilor reale:
--   D3 → „organizare"   (corect: „Resurse")
--   D4 → „general"      (corect: „Feedback")
--   D5 → „angajament"   (corect: „Disponibilitate")
--
-- Aliniere conform Anexa A1 dizertație:
--   D1 Predare         (4 itemi)
--   D2 Comunicare      (4 itemi)
--   D3 Resurse         (4 itemi)
--   D4 Feedback        (4 itemi)
--   D5 Disponibilitate (3 itemi)

UPDATE questions SET category = 'Predare'         WHERE dimension = 'D1' AND is_active = 1;
UPDATE questions SET category = 'Comunicare'      WHERE dimension = 'D2' AND is_active = 1;
UPDATE questions SET category = 'Resurse'         WHERE dimension = 'D3' AND is_active = 1;
UPDATE questions SET category = 'Feedback'        WHERE dimension = 'D4' AND is_active = 1;
UPDATE questions SET category = 'Disponibilitate' WHERE dimension = 'D5' AND is_active = 1;
UPDATE questions SET category = 'Global'          WHERE dimension = 'GLOBAL' AND is_active = 1;
UPDATE questions SET category = 'Context'         WHERE dimension = 'CONTEXT' AND is_active = 1;
UPDATE questions SET category = 'Comentariu'      WHERE dimension = 'COMMENT' AND is_active = 1;
