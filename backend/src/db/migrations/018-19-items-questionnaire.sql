-- Migration 018: chestionarul cu 19 itemi pe 5 dimensiuni (D1-D5)
-- Conform Anexa A1 a dizertației + Cap. 3.6.
-- Înlocuim cei 13 itemi vechi (categorii arbitrare) cu structura validată
-- psihometric: D1 Predare (4 itemi), D2 Comunicare (4), D3 Resurse (4),
-- D4 Evaluare/Feedback (4), D5 Disponibilitate (3) + 1 item global + 3 contextualizare.

-- 1. Adaug coloana dimension dacă nu există (fallback pe 'category' vechi)
-- SQLite nu permite ADD COLUMN cu DEFAULT non-NULL dinamic în CREATE; folosim ALTER

-- Dacă dimension există deja, ALTER va eșua silent — în init.js o ignorăm cu try/catch
-- AICI nu putem catch, deci punem un test indirect: dacă coloana există, INSERT-urile
-- de mai jos vor merge oricum.

ALTER TABLE questions ADD COLUMN dimension TEXT;
ALTER TABLE questions ADD COLUMN is_contextual INTEGER DEFAULT 0;

-- 2. Dezactivez toate itemii vechi (păstrăm istoricul răspunsurilor existente)
UPDATE questions SET is_active = 0;

-- 3. Inserez cei 19 itemi din Anexa A1
-- D1 — Predare și conținut (itemi 1-4)
INSERT INTO questions (text, category, dimension, type, order_index, is_active, is_required, is_contextual)
VALUES
('Cadrul didactic prezintă materialul clar și structurat.',
 'didactica', 'D1', 'likert', 1, 1, 1, 0),
('Obiectivele cursului sunt formulate clar și respectate pe parcurs.',
 'didactica', 'D1', 'likert', 2, 1, 1, 0),
('Conținutul predat este relevant și actual pentru domeniu.',
 'didactica', 'D1', 'likert', 3, 1, 1, 0),
('Cadrul didactic stimulează gândirea critică și aplicarea practică.',
 'didactica', 'D1', 'likert', 4, 1, 1, 0);

-- D2 — Comunicare și interacțiune (itemi 5-8)
INSERT INTO questions (text, category, dimension, type, order_index, is_active, is_required, is_contextual)
VALUES
('Cadrul didactic explică dificultățile conceptuale într-un mod ușor de înțeles.',
 'comunicare', 'D2', 'likert', 5, 1, 1, 0),
('Cadrul didactic încurajează participarea activă a studenților.',
 'comunicare', 'D2', 'likert', 6, 1, 1, 0),
('Cadrul didactic răspunde adecvat la întrebările studenților.',
 'comunicare', 'D2', 'likert', 7, 1, 1, 0),
('Atmosfera din cadrul activităților este propice învățării.',
 'comunicare', 'D2', 'likert', 8, 1, 1, 0);

-- D3 — Resurse și suport (itemi 9-12)
INSERT INTO questions (text, category, dimension, type, order_index, is_active, is_required, is_contextual)
VALUES
('Materialele didactice (prezentări, suporturi de curs) sunt clare și utile.',
 'organizare', 'D3', 'likert', 9, 1, 1, 0),
('Cadrul didactic recomandă resurse bibliografice relevante și accesibile.',
 'organizare', 'D3', 'likert', 10, 1, 1, 0),
('Platforma online a cursului este actualizată și bine organizată.',
 'organizare', 'D3', 'likert', 11, 1, 1, 0),
('Cadrul didactic oferă suport suplimentar studenților care întâmpină dificultăți.',
 'organizare', 'D3', 'likert', 12, 1, 1, 0);

-- D4 — Evaluare și feedback (itemi 13-16)
INSERT INTO questions (text, category, dimension, type, order_index, is_active, is_required, is_contextual)
VALUES
('Criteriile de evaluare sunt clare și comunicate din timp.',
 'general', 'D4', 'likert', 13, 1, 1, 0),
('Metodele de evaluare sunt diversificate și adecvate obiectivelor cursului.',
 'general', 'D4', 'likert', 14, 1, 1, 0),
('Cadrul didactic furnizează feedback constructiv după evaluări.',
 'general', 'D4', 'likert', 15, 1, 1, 0),
('Evaluările sunt corecte și obiective.',
 'general', 'D4', 'likert', 16, 1, 1, 0);

-- D5 — Disponibilitate și profesionalism (itemi 17-19)
INSERT INTO questions (text, category, dimension, type, order_index, is_active, is_required, is_contextual)
VALUES
('Cadrul didactic respectă orarul și este prezent conform programului.',
 'angajament', 'D5', 'likert', 17, 1, 1, 0),
('Cadrul didactic este accesibil și disponibil în afara orelor de curs.',
 'angajament', 'D5', 'likert', 18, 1, 1, 0),
('Cadrul didactic manifestă respect față de studenți și creează un climat de încredere.',
 'angajament', 'D5', 'likert', 19, 1, 1, 0);

-- Item global de ansamblu (item 20)
INSERT INTO questions (text, category, dimension, type, order_index, is_active, is_required, is_contextual)
VALUES
('În ansamblu, cum evaluezi activitatea didactică a acestui cadru didactic?',
 'global', 'GLOBAL', 'likert', 20, 1, 1, 0);

-- Itemi de contextualizare (nu intră în scor) — item 21-23
INSERT INTO questions (text, category, dimension, type, order_index, is_active, is_required, is_contextual)
VALUES
('Dificultatea percepută a acestei discipline:',
 'context', 'CONTEXT', 'likert', 21, 1, 0, 1),
('Nota anticipată la această disciplină:',
 'context', 'CONTEXT', 'likert', 22, 1, 0, 1),
('Ore de studiu individual săptămânal pentru această disciplină:',
 'context', 'CONTEXT', 'likert', 23, 1, 0, 1);

-- Comentariu liber (item 24)
INSERT INTO questions (text, category, dimension, type, order_index, is_active, is_required, is_contextual)
VALUES
('Comentarii sau sugestii suplimentare (opțional, max. 500 caractere):',
 'general', 'COMMENT', 'text', 24, 1, 0, 0);
