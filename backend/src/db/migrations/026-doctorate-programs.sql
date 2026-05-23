-- Migration 026: programe doctorat (lipsă din seed inițial)
--
-- Cerință utilizator: agregările „per ciclu" trebuie să acopere și DOCTORAT,
-- nu doar licență + master.
--
-- Strategie: 1 program doctorat per facultate (5 total), 3 ani de studiu,
-- ~9 cursuri/program, doctoranzi reciclați din pool-ul existent.
-- ID-urile sunt FIX-uite pentru idempotență (INSERT OR IGNORE).
--
-- Status evaluări calculat determinist cu aceeași formulă ca migrarea 025
-- (rate per profesor ∈ [35, 85] → agregate ∈ [50, 70]).

-- =====================================================================
-- PASUL 1: Programe doctorat (1 per facultate)
-- =====================================================================
INSERT OR IGNORE INTO programs (id, faculty_id, name, code, level) VALUES
  (51, 1, 'Doctorat Informatică', 'DOC-INFO', 'doctorat'),
  (52, 2, 'Doctorat Matematică', 'DOC-MAT', 'doctorat'),
  (53, 3, 'Doctorat Fizică', 'DOC-FIZ', 'doctorat'),
  (54, 4, 'Doctorat Electronică', 'DOC-ELECTRO', 'doctorat'),
  (55, 5, 'Doctorat Automatică', 'DOC-AUTO', 'doctorat');

-- =====================================================================
-- PASUL 2: Ani de studiu doctorat (3 ani × 5 programe = 15)
-- =====================================================================
INSERT OR IGNORE INTO study_years (id, program_id, year_number) VALUES
  (51, 51, 1), (52, 51, 2), (53, 51, 3),
  (54, 52, 1), (55, 52, 2), (56, 52, 3),
  (57, 53, 1), (58, 53, 2), (59, 53, 3),
  (60, 54, 1), (61, 54, 2), (62, 54, 3),
  (63, 55, 1), (64, 55, 2), (65, 55, 3);

-- =====================================================================
-- PASUL 3: Cursuri doctorat — 3 cursuri/an × 3 ani × 5 programe = 45 cursuri
-- IDs: 9001..9045
-- Profesor: reciclez modulo 40 (profi din pool-ul existent)
-- Tip curs: distribuit pe curs/seminar/lab
-- =====================================================================
INSERT OR IGNORE INTO courses (id, name, code, professor_id, study_year_id, semester, academic_year, course_type) VALUES
  -- INFORMATICA (program 51) - 9 cursuri (3 ani × 3)
  (9001, 'Algoritmi Avansați I', 'DOC-INFO-01',  10, 51, '1', '2025-2026', 'curs'),
  (9002, 'Cercetare Aplicată I',  'DOC-INFO-02',  20, 51, '2', '2025-2026', 'seminar'),
  (9003, 'Metodologie Cercetare', 'DOC-INFO-03',  30, 51, '1', '2025-2026', 'laborator'),
  (9004, 'Algoritmi Avansați II', 'DOC-INFO-04',  40, 52, '1', '2025-2026', 'curs'),
  (9005, 'Cercetare Aplicată II', 'DOC-INFO-05',  50, 52, '2', '2025-2026', 'seminar'),
  (9006, 'Tehnici Avansate IT',   'DOC-INFO-06',  60, 52, '1', '2025-2026', 'curs'),
  (9007, 'Cercetare Doctorală I', 'DOC-INFO-07',  70, 53, '1', '2025-2026', 'curs'),
  (9008, 'Cercetare Doctorală II','DOC-INFO-08',  80, 53, '2', '2025-2026', 'seminar'),
  (9009, 'Susținere Teză',        'DOC-INFO-09',  90, 53, '2', '2025-2026', 'laborator'),

  -- MATEMATICA (program 52)
  (9010, 'Analiză Matematică Avansată', 'DOC-MAT-01',  11, 54, '1', '2025-2026', 'curs'),
  (9011, 'Algebră Avansată',            'DOC-MAT-02',  21, 54, '2', '2025-2026', 'seminar'),
  (9012, 'Geometrie Diferențială',      'DOC-MAT-03',  31, 54, '1', '2025-2026', 'laborator'),
  (9013, 'Teoria Numerelor',            'DOC-MAT-04',  41, 55, '1', '2025-2026', 'curs'),
  (9014, 'Statistică Avansată',         'DOC-MAT-05',  51, 55, '2', '2025-2026', 'seminar'),
  (9015, 'Topologie Avansată',          'DOC-MAT-06',  61, 55, '1', '2025-2026', 'curs'),
  (9016, 'Cercetare Doctorală Mat I',   'DOC-MAT-07',  71, 56, '1', '2025-2026', 'curs'),
  (9017, 'Cercetare Doctorală Mat II',  'DOC-MAT-08',  81, 56, '2', '2025-2026', 'seminar'),
  (9018, 'Susținere Teză Mat',          'DOC-MAT-09',  91, 56, '2', '2025-2026', 'laborator'),

  -- FIZICA (program 53)
  (9019, 'Fizică Teoretică Avansată', 'DOC-FIZ-01', 101, 57, '1', '2025-2026', 'curs'),
  (9020, 'Mecanică Cuantică',         'DOC-FIZ-02', 111, 57, '2', '2025-2026', 'seminar'),
  (9021, 'Termodinamică Avansată',    'DOC-FIZ-03', 121, 57, '1', '2025-2026', 'laborator'),
  (9022, 'Optică Cuantică',           'DOC-FIZ-04', 131, 58, '1', '2025-2026', 'curs'),
  (9023, 'Relativitate Generală',     'DOC-FIZ-05', 141, 58, '2', '2025-2026', 'seminar'),
  (9024, 'Fizica Particulelor',       'DOC-FIZ-06', 151, 58, '1', '2025-2026', 'curs'),
  (9025, 'Cercetare Doctorală Fiz I', 'DOC-FIZ-07', 161, 59, '1', '2025-2026', 'curs'),
  (9026, 'Cercetare Doctorală Fiz II','DOC-FIZ-08', 171, 59, '2', '2025-2026', 'seminar'),
  (9027, 'Susținere Teză Fiz',        'DOC-FIZ-09', 181, 59, '2', '2025-2026', 'laborator'),

  -- ELECTRONICA (program 54)
  (9028, 'Procesare Semnale Avansată', 'DOC-ELE-01', 102, 60, '1', '2025-2026', 'curs'),
  (9029, 'Sisteme Embedded Avansate',  'DOC-ELE-02', 112, 60, '2', '2025-2026', 'seminar'),
  (9030, 'Telecomunicații Optice',     'DOC-ELE-03', 122, 60, '1', '2025-2026', 'laborator'),
  (9031, 'Circuite VLSI',              'DOC-ELE-04', 132, 61, '1', '2025-2026', 'curs'),
  (9032, 'Antene și Microunde',        'DOC-ELE-05', 142, 61, '2', '2025-2026', 'seminar'),
  (9033, 'Sisteme RF Avansate',        'DOC-ELE-06', 152, 61, '1', '2025-2026', 'curs'),
  (9034, 'Cercetare Doctorală Ele I',  'DOC-ELE-07', 162, 62, '1', '2025-2026', 'curs'),
  (9035, 'Cercetare Doctorală Ele II', 'DOC-ELE-08', 172, 62, '2', '2025-2026', 'seminar'),
  (9036, 'Susținere Teză Ele',         'DOC-ELE-09', 182, 62, '2', '2025-2026', 'laborator'),

  -- AUTOMATICA (program 55)
  (9037, 'Control Avansat',         'DOC-AUT-01', 103, 63, '1', '2025-2026', 'curs'),
  (9038, 'Robotică Avansată',       'DOC-AUT-02', 113, 63, '2', '2025-2026', 'seminar'),
  (9039, 'IA Avansată',             'DOC-AUT-03', 123, 63, '1', '2025-2026', 'laborator'),
  (9040, 'Sisteme Distribuite',     'DOC-AUT-04', 133, 64, '1', '2025-2026', 'curs'),
  (9041, 'Machine Learning',        'DOC-AUT-05', 143, 64, '2', '2025-2026', 'seminar'),
  (9042, 'Optimizare Avansată',     'DOC-AUT-06', 153, 64, '1', '2025-2026', 'curs'),
  (9043, 'Cercetare Doctorală Aut I','DOC-AUT-07', 163, 65, '1', '2025-2026', 'curs'),
  (9044, 'Cercetare Doctorală Aut II','DOC-AUT-08', 173, 65, '2', '2025-2026', 'seminar'),
  (9045, 'Susținere Teză Aut',      'DOC-AUT-09', 183, 65, '2', '2025-2026', 'laborator');

-- =====================================================================
-- PASUL 4: Evaluări doctorat — fiecare curs are 8 doctoranzi evaluatori
-- Total: 45 cursuri × 8 evaluări = 360 evaluări noi
-- ID-uri evaluări: 90000..90360 (deterministic)
-- =====================================================================
-- Folosesc generare cu UNION ALL pentru cele 8 evaluări/curs (limit SQLite recursion)
INSERT OR IGNORE INTO evaluations (id, student_id, course_id, professor_id, status, started_at, submitted_at, deadline)
SELECT
  90000 + (c.id - 9001) * 8 + offset_table.n AS new_id,
  52 + ((c.id * 13 + offset_table.n * 7) % 1200) AS sid,
  c.id,
  c.professor_id,
  'draft', -- temporar, va fi setat de PASUL 5
  datetime('2026-05-' || printf('%02d', 1 + ((c.id + offset_table.n) % 22)) || ' 09:00:00'),
  NULL,
  '2026-06-05 23:59:59'
FROM courses c
JOIN (
  SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
  UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
) offset_table
WHERE c.id BETWEEN 9001 AND 9045;

-- =====================================================================
-- PASUL 5: APLICĂ formula deterministă de status pe toate evaluările
-- (re-run pentru orice evaluări introduse acum + cele vechi rămân stabile)
-- =====================================================================
UPDATE evaluations
   SET status = CASE
         WHEN ((id * 31 + professor_id * 17 + 23) % 100)
              < (35 + (professor_id * 7 + 11) % 51)
         THEN 'submitted'
         ELSE 'draft'
       END
 WHERE id >= 90000;

UPDATE evaluations
   SET submitted_at = datetime('2026-05-01 09:00:00', '+' || ((id * 7919) % (22*24*3600)) || ' seconds')
 WHERE id >= 90000 AND status = 'submitted' AND submitted_at IS NULL;

UPDATE evaluations
   SET started_at = datetime(submitted_at, '-' || (1 + (id % 7)) || ' days')
 WHERE id >= 90000 AND status = 'submitted';

-- =====================================================================
-- PASUL 6: completion_tokens pentru evaluările doctorat submitted
-- =====================================================================
INSERT OR IGNORE INTO completion_tokens (user_id, evaluation_id, completed_at)
SELECT
  52 + ((e.id * 13) % 1200),
  e.id,
  e.submitted_at
  FROM evaluations e
 WHERE e.id >= 90000 AND e.status = 'submitted'
   AND NOT EXISTS (SELECT 1 FROM completion_tokens ct WHERE ct.evaluation_id = e.id);
