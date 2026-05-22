-- Migration 012: workflow acțiuni admin → profesor
-- 1. action_templates: șabloane standard pe care admin le folosește pentru propuneri rapide
-- 2. professor_actions: acțiunile propuse/acceptate/finalizate, per profesor

CREATE TABLE IF NOT EXISTS action_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- ex: "meeting", "training", "review"
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS professor_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  professor_id INTEGER NOT NULL,
  template_id INTEGER, -- NULL pentru acțiuni personalizate
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- copie din template sau custom
  status TEXT NOT NULL DEFAULT 'proposed' CHECK(status IN ('proposed', 'accepted', 'completed', 'rejected')),
  proposed_by_user_id INTEGER NOT NULL,
  proposed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME,
  completed_at DATETIME,
  notes TEXT, -- profesorul poate adăuga note la finalizare
  FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES action_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (proposed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pa_professor ON professor_actions(professor_id);
CREATE INDEX IF NOT EXISTS idx_pa_status ON professor_actions(status);

-- Seed templates standard
INSERT OR IGNORE INTO action_templates (title, description, category) VALUES
  ('Întâlnire cu șeful de departament', 'Discuție 1-la-1 pentru a analiza feedback-ul și a stabili obiective.', 'meeting'),
  ('Participare workshop pedagogie', 'Workshop CEAC dedicat metodelor moderne de predare.', 'training'),
  ('Peer review cu alt cadru didactic', 'Schimb de practici cu un coleg din top performers.', 'review'),
  ('Plan de îmbunătățire detaliat', 'Plan scris cu obiective SMART pentru semestrul următor.', 'planning'),
  ('Mentorat lunar', 'Sesiuni de mentorat cu un cadru didactic experimentat (3 luni).', 'mentoring'),
  ('Curs online de upgrade didactic', 'Curs online recomandat de CEAC (10-20h).', 'training');
