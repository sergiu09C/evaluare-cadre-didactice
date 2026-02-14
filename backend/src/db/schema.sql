-- ============================================
-- SCHEMA BAZĂ DE DATE - Platformă Evaluare Cadre Didactice
-- Versiune: 1.0.0
-- Descriere: Schema SQLite cu anonimizare garantată
-- ============================================

-- Facultăți
CREATE TABLE IF NOT EXISTS faculties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Programe de studiu
CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  faculty_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  level TEXT CHECK(level IN ('licenta', 'master', 'doctorat')) DEFAULT 'licenta',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
);

-- Ani de studiu (1, 2, 3, 4 pentru licență; 1, 2 pentru master)
CREATE TABLE IF NOT EXISTS study_years (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER NOT NULL,
  year_number INTEGER NOT NULL CHECK(year_number BETWEEN 1 AND 4),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  UNIQUE(program_id, year_number)
);

-- Serii (A, B, C, etc.)
CREATE TABLE IF NOT EXISTS series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  study_year_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (study_year_id) REFERENCES study_years(id) ON DELETE CASCADE,
  UNIQUE(study_year_id, name)
);

-- Grupe (1, 2, 3, etc.)
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id INTEGER NOT NULL,
  number INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
  UNIQUE(series_id, number)
);

-- Utilizatori (Studenți + Administratori + Profesori)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT CHECK(role IN ('student', 'admin', 'professor')) DEFAULT 'student',
  group_id INTEGER,
  professor_id INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
  FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE CASCADE
);

-- Index pentru căutare rapidă utilizatori
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_professor ON users(professor_id);

-- Cadre didactice (Profesori)
CREATE TABLE IF NOT EXISTS professors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT, -- Dr., Prof., Conf., Lect., etc.
  email TEXT UNIQUE,
  department TEXT,
  faculty_id INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_professors_faculty ON professors(faculty_id);

-- Discipline (Cursuri predate)
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  professor_id INTEGER NOT NULL,
  study_year_id INTEGER NOT NULL,
  semester TEXT CHECK(semester IN ('1', '2')) NOT NULL,
  academic_year TEXT NOT NULL, -- ex: "2023-2024"
  course_type TEXT CHECK(course_type IN ('curs', 'laborator', 'seminar')) DEFAULT 'curs',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE CASCADE,
  FOREIGN KEY (study_year_id) REFERENCES study_years(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_courses_professor ON courses(professor_id);
CREATE INDEX IF NOT EXISTS idx_courses_academic_year ON courses(academic_year, semester);
CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(course_type);
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);

-- Întrebări din chestionar
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  type TEXT CHECK(type IN ('likert', 'text')) NOT NULL,
  category TEXT, -- ex: "didactica", "comunicare", "organizare"
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT 1,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Evaluări (Tracking cine evaluează pe cine, fără răspunsuri)
-- Acest tabel leagă studentul de profesor dar NU conține răspunsurile
CREATE TABLE IF NOT EXISTS evaluations (
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
  UNIQUE(student_id, course_id, professor_id) -- Previne duplicate
);

CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_professor ON evaluations(professor_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);

-- Răspunsuri ANONIME (separate de identitatea studentului)
-- IMPORTANT: Acest tabel NU conține student_id direct!
-- Legătura se face prin evaluation_id, dar nu putem vedea cine a răspuns ce
CREATE TABLE IF NOT EXISTS responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evaluation_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  response_likert INTEGER CHECK(response_likert BETWEEN 1 AND 5),
  response_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE(evaluation_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_responses_evaluation ON responses(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON responses(question_id);

-- Sesiuni de evaluare (Perioade când sunt active evaluările)
CREATE TABLE IF NOT EXISTS evaluation_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  semester TEXT CHECK(semester IN ('1', '2')) NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT 0,
  reminders_sent TEXT DEFAULT '', -- JSON array cu zilele când s-au trimis remindere
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Setări platformă (toggle on/off, mesaje, etc.)
CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- Only one row allowed
  is_active BOOLEAN DEFAULT 1,
  closure_message TEXT DEFAULT 'Platforma de evaluare este momentan închisă.',
  auto_reminders_enabled BOOLEAN DEFAULT 1,
  reminder_days TEXT DEFAULT '3,2,1', -- Zile înainte de deadline când se trimit remindere
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Mesaje către studenți (manuale sau automate)
CREATE TABLE IF NOT EXISTS student_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT CHECK(message_type IN ('manual', 'automated', 'reminder')) DEFAULT 'manual',
  target_audience TEXT, -- JSON: {"facultyIds": [1,2], "yearNumbers": [1,2], "level": "licenta"}
  sent_by INTEGER NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  recipients_count INTEGER DEFAULT 0,
  FOREIGN KEY (sent_by) REFERENCES users(id)
);

-- Log pentru remindere trimise (legacy, păstrat pentru compatibilitate)
CREATE TABLE IF NOT EXISTS reminders_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sent_to TEXT NOT NULL, -- 'all', 'faculty:X', 'program:Y'
  message TEXT NOT NULL,
  stats_included TEXT, -- JSON cu statistici la momentul trimiterii
  sent_by INTEGER NOT NULL, -- admin user_id
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sent_by) REFERENCES users(id)
);

-- ============================================
-- VIEWS pentru agregare date (fără expunere identitate)
-- ============================================

-- View: Statistici globale per profesor (anonime)
CREATE VIEW IF NOT EXISTS professor_stats AS
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

-- View: Rate de completare per facultate
CREATE VIEW IF NOT EXISTS completion_rates AS
SELECT
  f.name as faculty_name,
  COUNT(DISTINCT e.id) as total_assigned,
  SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) as completed,
  ROUND(100.0 * SUM(CASE WHEN e.status = 'submitted' THEN 1 ELSE 0 END) / COUNT(DISTINCT e.id), 2) as completion_rate
FROM faculties f
LEFT JOIN programs pr ON pr.faculty_id = f.id
LEFT JOIN study_years sy ON sy.program_id = pr.id
LEFT JOIN series s ON s.study_year_id = sy.id
LEFT JOIN groups g ON g.series_id = s.id
LEFT JOIN users u ON u.group_id = g.id
LEFT JOIN evaluations e ON e.student_id = u.id
GROUP BY f.id;
