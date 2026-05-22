-- Migration 014: mesaje free-form de feedback platformă cu closing-loop
-- Separat de questionnaire (rămâne unique per întrebare); aici userul poate
-- transmite mesaje nelimitate; adminul răspunde și marchează rezolvat.

CREATE TABLE IF NOT EXISTS platform_feedback_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  user_role TEXT NOT NULL CHECK(user_role IN ('student','professor','admin')),
  subject TEXT,
  message TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','answered','closed')),
  admin_response TEXT,
  admin_response_at DATETIME,
  admin_user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pfm_user ON platform_feedback_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_pfm_status ON platform_feedback_messages(status);
CREATE INDEX IF NOT EXISTS idx_pfm_created ON platform_feedback_messages(created_at);
