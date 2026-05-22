-- Migration 006: Closing-the-loop entries
-- Stochează schimbările instituționale pe care admin le publică pentru studenți.

CREATE TABLE IF NOT EXISTS closing_loop_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  dot_color TEXT DEFAULT '#7C3AED',
  related_dimension TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_closing_loop_published ON closing_loop_entries(is_published, sort_order);

-- Seed demo entries (matching the hardcoded mockup)
INSERT INTO closing_loop_entries (title, body, dot_color, related_dimension, sort_order)
SELECT 'Materiale actualizate', 'Slide-urile la „Managementul calității" au fost rescrise după feedback-ul a 47 studenți.', '#C4B5FD', 'Resurse', 1
WHERE NOT EXISTS (SELECT 1 FROM closing_loop_entries WHERE title = 'Materiale actualizate');

INSERT INTO closing_loop_entries (title, body, dot_color, related_dimension, sort_order)
SELECT 'Mai multe consultații', 'Departamentul a alocat 2 ore suplimentare pentru consultații săptămânale.', '#A78BFA', 'Disponibilitate', 2
WHERE NOT EXISTS (SELECT 1 FROM closing_loop_entries WHERE title = 'Mai multe consultații');

INSERT INTO closing_loop_entries (title, body, dot_color, related_dimension, sort_order)
SELECT 'Calendar evaluări transparent', 'Datele examenelor sunt publicate cu 4 săptămâni înainte, nu cu 2.', '#7C3AED', 'Evaluare', 3
WHERE NOT EXISTS (SELECT 1 FROM closing_loop_entries WHERE title = 'Calendar evaluări transparent');
