-- Migration: Adăugare tip curs și setări platformă
-- Data: 2026-02-03

-- 1. Adăugare coloană course_type în tabela courses
ALTER TABLE courses ADD COLUMN course_type TEXT CHECK(course_type IN ('curs', 'laborator', 'seminar')) DEFAULT 'curs';

-- 2. Creare tabelă pentru setări platformă
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

-- Inserare setări default
INSERT OR IGNORE INTO platform_settings (id, is_active, auto_reminders_enabled) VALUES (1, 1, 1);

-- 3. Creare tabelă pentru mesaje către studenți
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

-- 4. Actualizare evaluation_periods cu flag pentru remindere
ALTER TABLE evaluation_periods ADD COLUMN reminders_sent TEXT DEFAULT ''; -- JSON array cu zilele când s-au trimis remindere

-- 5. Index pentru filtrare rapidă
CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(course_type);
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);
