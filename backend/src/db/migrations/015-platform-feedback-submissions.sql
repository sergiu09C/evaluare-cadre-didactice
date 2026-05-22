-- Migration 015: pluralizare submisii feedback platformă
-- ANTERIOR: 1 set de răspunsuri / user (UNIQUE(user_id, question_id) → UPSERT distruge istoricul).
-- ACUM: fiecare apel la /submit creează o submisie nouă; răspunsurile rămân atașate de submisia respectivă.
-- Permite număr exact de feedbackuri, accesarea istoricului și formular curat la fiecare reluare.

CREATE TABLE IF NOT EXISTS platform_feedback_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pf_submissions_user ON platform_feedback_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_pf_submissions_submitted_at ON platform_feedback_submissions(submitted_at);

-- Rescriu platform_feedback_responses fără UNIQUE(user_id, question_id) + cu submission_id
CREATE TABLE platform_feedback_responses_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER,
  user_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  response_likert INTEGER CHECK(response_likert BETWEEN 1 AND 5),
  response_text TEXT,
  response_choice TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES platform_feedback_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES platform_feedback_questions(id) ON DELETE CASCADE
);

-- Pentru fiecare user existent care are răspunsuri, creez o submisie istorică
-- (orientativ pe MIN submitted_at al răspunsurilor lui), apoi mut răspunsurile în tabela nouă cu submission_id legat.
INSERT INTO platform_feedback_submissions (user_id, submitted_at)
SELECT user_id, MIN(submitted_at) FROM platform_feedback_responses
GROUP BY user_id;

INSERT INTO platform_feedback_responses_new
  (submission_id, user_id, question_id, response_likert, response_text, response_choice, submitted_at)
SELECT s.id, r.user_id, r.question_id, r.response_likert, r.response_text, r.response_choice, r.submitted_at
FROM platform_feedback_responses r
JOIN platform_feedback_submissions s ON s.user_id = r.user_id;

DROP TABLE platform_feedback_responses;
ALTER TABLE platform_feedback_responses_new RENAME TO platform_feedback_responses;

CREATE INDEX IF NOT EXISTS idx_pf_responses_question ON platform_feedback_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_pf_responses_user ON platform_feedback_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_pf_responses_submission ON platform_feedback_responses(submission_id);
