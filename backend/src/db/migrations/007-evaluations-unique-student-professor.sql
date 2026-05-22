-- Migration 007: schimbă UNIQUE constraint pe evaluations
-- De la: UNIQUE(student_id, course_id, professor_id) → 1 evaluare per (student, curs, profesor)
-- La:    UNIQUE(student_id, professor_id)             → 1 evaluare per (student, profesor)
--
-- Motiv: un student trebuie să evalueze un cadru didactic O SINGURĂ DATĂ,
-- indiferent de câte cursuri/laboratoare a făcut cu el sau câte semestre/ani au trecut.
-- Constraintul vechi permitea duplicate (același student × profesor × curs diferit).
--
-- Pași:
-- 1. Marchează evaluările de păstrat (cea mai recentă submitted per (student, professor)).
-- 2. Șterge celelalte evaluări — responses se șterg automat prin ON DELETE CASCADE.
-- 3. Recreează tabela cu noul UNIQUE constraint (preserve ID-urile).
-- 4. Recreează indexurile.

-- NOTE: trebuie rulat cu foreign_keys=OFF temporar pentru DROP/RENAME — gestionat în init.js
-- prin rularea blocului acesta secvențial (init.js execută statement-uri individual).

-- 1. Tabelă temporară cu ID-urile evaluărilor de PĂSTRAT
CREATE TEMP TABLE evaluations_to_keep AS
SELECT id FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY student_id, professor_id
      ORDER BY
        CASE status WHEN 'submitted' THEN 0 ELSE 1 END,
        COALESCE(submitted_at, started_at) DESC,
        id DESC
    ) AS rn
  FROM evaluations
) WHERE rn = 1;

-- 2. Șterge duplicate (responses dispar prin CASCADE)
DELETE FROM evaluations WHERE id NOT IN (SELECT id FROM evaluations_to_keep);
DROP TABLE evaluations_to_keep;

-- 3. Migrare structură: rename → create new → copy → drop old
ALTER TABLE evaluations RENAME TO evaluations_old_007;

CREATE TABLE evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  professor_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('draft', 'submitted')) DEFAULT 'draft',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  deadline DATETIME,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE CASCADE,
  UNIQUE(student_id, professor_id)
);

INSERT INTO evaluations (id, student_id, course_id, professor_id, status, started_at, submitted_at, deadline)
SELECT id, student_id, course_id, professor_id, status, started_at, submitted_at, deadline FROM evaluations_old_007;

DROP TABLE evaluations_old_007;

-- 4. Recreare indexuri
CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_professor ON evaluations(professor_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
