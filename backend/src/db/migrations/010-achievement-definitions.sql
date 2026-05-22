-- Migration 010: definiții achievements editabile de admin
-- Engine recalculează la fiecare submit pentru utilizator.

CREATE TABLE IF NOT EXISTS achievement_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT 'trophy',
  tone TEXT DEFAULT 'accent',
  criteria_type TEXT NOT NULL CHECK(criteria_type IN ('count_submitted', 'streak_semesters', 'comments_with_text', 'first_in_program', 'fast_responder')),
  threshold INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id INTEGER NOT NULL,
  achievement_id INTEGER NOT NULL,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievement_definitions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- Definițiile inițiale (modificabile)
INSERT OR IGNORE INTO achievement_definitions (key, title, description, icon, tone, criteria_type, threshold) VALUES
  ('first_eval', 'Prima evaluare', 'Ai completat prima ta evaluare.', 'check', 'mint', 'count_submitted', 1),
  ('completionist', 'Completionist', 'Ai completat 5 evaluări în acest semestru.', 'trophy', 'accent', 'count_submitted', 5),
  ('voce_activa', 'Voce activă', 'Ai adăugat comentarii text la 3 evaluări.', 'sparkle', 'primary', 'comments_with_text', 3),
  ('explorator', 'Explorator', 'Ai evaluat 10 discipline în total.', 'flag', 'warm', 'count_submitted', 10),
  ('rapid', 'Răspuns rapid', 'Completează o evaluare în primele 72 ore de la activare.', 'bolt', 'warm', 'fast_responder', 1),
  ('feedback_detaliat', 'Feedback detaliat', 'Ai trimis 5 comentarii text de calitate.', 'sparkle', 'accent', 'comments_with_text', 5);
