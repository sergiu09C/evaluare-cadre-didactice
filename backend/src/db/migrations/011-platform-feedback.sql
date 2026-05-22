-- Migration 011: chestionar feedback despre platformă (separat de evaluarea profesorilor)
-- Adminul îl personalizează, studenții + profesorii îl completează, rezultatele se agregă în rapoarte.

CREATE TABLE IF NOT EXISTS platform_feedback_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('likert', 'text', 'choice')),
  category TEXT,
  options_json TEXT, -- pentru type='choice': JSON array de opțiuni
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT 0,
  target_roles TEXT DEFAULT 'student,professor', -- CSV: roluri vizate
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_feedback_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  response_likert INTEGER CHECK(response_likert BETWEEN 1 AND 5),
  response_text TEXT,
  response_choice TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES platform_feedback_questions(id) ON DELETE CASCADE,
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_pf_responses_question ON platform_feedback_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_pf_responses_user ON platform_feedback_responses(user_id);

-- Seed inițial cu 5 întrebări generale
INSERT OR IGNORE INTO platform_feedback_questions (text, type, category, order_index, is_required, target_roles) VALUES
  ('Cât de ușor de folosit ți s-a părut platforma?', 'likert', 'usability', 1, 1, 'student,professor'),
  ('Cât de relevant a fost chestionarul de evaluare?', 'likert', 'content', 2, 1, 'student'),
  ('Designul platformei este atrăgător și modern?', 'likert', 'design', 3, 0, 'student,professor'),
  ('Ce funcționalitate ai dori să fie adăugată?', 'text', 'suggestions', 4, 0, 'student,professor'),
  ('Care a fost partea care ți-a plăcut cel mai mult?', 'text', 'praise', 5, 0, 'student,professor');
