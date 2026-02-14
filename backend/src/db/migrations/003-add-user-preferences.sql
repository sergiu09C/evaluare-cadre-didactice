-- Migration: Adăugare tabelă user_preferences pentru setări de accesibilitate
-- Data: 2026-02-04
-- Descriere: Stochează preferințele de accesibilitate per utilizator (font size, theme, high contrast, etc.)

-- Creare tabelă pentru preferințe utilizatori
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,

  -- Accessibility preferences
  font_size TEXT CHECK(font_size IN ('small', 'normal', 'large', 'extra-large')) DEFAULT 'normal',
  high_contrast BOOLEAN DEFAULT 0,
  reduce_motion BOOLEAN DEFAULT 0,
  theme TEXT CHECK(theme IN ('light', 'dark', 'system')) DEFAULT 'light',
  dyslexia_font BOOLEAN DEFAULT 0,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pentru lookup rapid după user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Trigger pentru auto-update updated_at
CREATE TRIGGER IF NOT EXISTS update_user_preferences_timestamp
AFTER UPDATE ON user_preferences
FOR EACH ROW
BEGIN
  UPDATE user_preferences SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Inserare preferințe default pentru utilizatori existenți
INSERT INTO user_preferences (user_id, font_size, high_contrast, reduce_motion, theme, dyslexia_font)
SELECT id, 'normal', 0, 0, 'light', 0
FROM users
WHERE id NOT IN (SELECT user_id FROM user_preferences);
