-- Migration 017: anonimitate tehnică prin separarea structurală a datelor
-- Conform Cap. 4.3.2 + Anexa A3 din disertație: răspunsurile NU pot fi corelate
-- cu identitatea studentului prin niciun JOIN SQL după submit.

CREATE TABLE IF NOT EXISTS completion_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  evaluation_id INTEGER NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
  UNIQUE(user_id, evaluation_id)
);
CREATE INDEX IF NOT EXISTS idx_ct_user ON completion_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_ct_eval ON completion_tokens(evaluation_id);

-- Backfill: pentru evaluările deja submitted, creează completion_tokens
INSERT OR IGNORE INTO completion_tokens (user_id, evaluation_id, completed_at)
SELECT student_id, id, COALESCE(submitted_at, started_at, CURRENT_TIMESTAMP)
FROM evaluations
WHERE status = 'submitted' AND student_id IS NOT NULL;

-- Drop views care depind de evaluations (le recreăm la sfârșit)
DROP VIEW IF EXISTS professor_stats;
DROP VIEW IF EXISTS completion_rates;

-- Recrearea tabelei evaluations cu student_id permisiv NULL (anonim după submit)
CREATE TABLE evaluations_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  course_id INTEGER NOT NULL,
  professor_id INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'in_progress', 'submitted')),
  started_at DATETIME,
  submitted_at DATETIME,
  deadline DATETIME,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE CASCADE
);

-- Copiem toate evaluările, NULL pe student_id pentru cele submitted (anonim retroactiv)
INSERT INTO evaluations_new (id, student_id, course_id, professor_id, status, started_at, submitted_at, deadline)
SELECT id,
       CASE WHEN status = 'submitted' THEN NULL ELSE student_id END,
       course_id, professor_id, status, started_at, submitted_at, deadline
FROM evaluations;

DROP TABLE evaluations;
ALTER TABLE evaluations_new RENAME TO evaluations;

CREATE INDEX IF NOT EXISTS idx_eval_student ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_eval_course ON evaluations(course_id);
CREATE INDEX IF NOT EXISTS idx_eval_professor ON evaluations(professor_id);
CREATE INDEX IF NOT EXISTS idx_eval_status ON evaluations(status);

-- Recreez view-urile care depind de evaluations
CREATE VIEW professor_stats AS
SELECT
  p.id as professor_id,
  p.first_name || ' ' || p.last_name as professor_name,
  p.title,
  p.department,
  f.name as faculty_name,
  c.name as course_name,
  c.academic_year,
  c.semester,
  COUNT(DISTINCT e.id) as total_evaluations,
  SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) as completed_evaluations,
  AVG(CASE WHEN e.status = 'submitted' THEN
    (SELECT AVG(r.response_likert)
     FROM responses r
     WHERE r.evaluation_id = e.id AND r.response_likert IS NOT NULL)
  END) as average_score
FROM professors p
LEFT JOIN courses c ON c.professor_id = p.id
LEFT JOIN evaluations e ON e.professor_id = p.id AND e.course_id = c.id
LEFT JOIN faculties f ON f.id = p.faculty_id
GROUP BY p.id, c.id;

-- NOTĂ: completion_rates făcea JOIN cu users via student_id. După migrare,
-- student_id devine NULL pentru submitted → JOIN-ul nu mai funcționează corect.
-- Reformulăm folosind completion_tokens (sursa adevărului pentru „cine a completat").
CREATE VIEW completion_rates AS
SELECT
  f.name as faculty_name,
  (SELECT COUNT(DISTINCT u.id) FROM users u
   JOIN groups g ON g.id = u.group_id
   JOIN series s ON s.id = g.series_id
   JOIN study_years sy ON sy.program_id IN (SELECT id FROM programs WHERE faculty_id = f.id)
   WHERE u.role = 'student' AND u.is_active = 1) as total_eligible,
  (SELECT COUNT(DISTINCT ct.user_id) FROM completion_tokens ct
   JOIN users u ON u.id = ct.user_id
   JOIN groups g ON g.id = u.group_id
   JOIN series s ON s.id = g.series_id
   JOIN study_years sy ON sy.id = s.study_year_id
   JOIN programs pr ON pr.id = sy.program_id
   WHERE pr.faculty_id = f.id) as completed,
  ROUND(100.0 *
    (SELECT COUNT(DISTINCT ct.user_id) FROM completion_tokens ct
     JOIN users u ON u.id = ct.user_id
     JOIN groups g ON g.id = u.group_id
     JOIN series s ON s.id = g.series_id
     JOIN study_years sy ON sy.id = s.study_year_id
     JOIN programs pr ON pr.id = sy.program_id
     WHERE pr.faculty_id = f.id) /
    NULLIF((SELECT COUNT(DISTINCT u.id) FROM users u
     JOIN groups g ON g.id = u.group_id
     JOIN series s ON s.id = g.series_id
     JOIN study_years sy ON sy.id = s.study_year_id
     JOIN programs pr ON pr.id = sy.program_id
     WHERE pr.faculty_id = f.id AND u.role='student' AND u.is_active=1), 0), 2) as completion_rate
FROM faculties f;
