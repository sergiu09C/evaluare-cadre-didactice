-- Migration 008: revenire la granularitate per disciplină
-- De la: UNIQUE(student_id, professor_id)             → 1 evaluare per (student, profesor)
-- La:    UNIQUE(student_id, course_id, professor_id)  → 1 evaluare per disciplină
--
-- Motiv: fiecare disciplină trebuie evaluată distinct. Calitatea predării poate
-- diferi pe materii diferite cu același cadru didactic (ex: profesor excelent la
-- specialitatea lui, mediu la curs general). Studenții trebuie să poată
-- diferenția feedback-ul pe fondul materiei.
--
-- NU recuperăm datele șterse de migration 007 — re-rulează seed-evaluations.js
-- după aplicarea acestei migrații pentru a regenera evaluările.

ALTER TABLE evaluations RENAME TO evaluations_old_008;

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
  UNIQUE(student_id, course_id, professor_id)
);

INSERT INTO evaluations (id, student_id, course_id, professor_id, status, started_at, submitted_at, deadline)
SELECT id, student_id, course_id, professor_id, status, started_at, submitted_at, deadline
FROM evaluations_old_008;

DROP TABLE evaluations_old_008;

CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_professor ON evaluations(professor_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
