-- Migration 005: Add professor role and link professors to users table
-- Data: 2026-02-05
-- Descriere: Adaugă rolul 'professor' în tabela users și link către tabela professors

-- ============================================
-- PARTEA 1: Modificare tabelă users
-- ============================================

-- Pasul 1: Creăm o tabelă temporară cu structura nouă
CREATE TABLE IF NOT EXISTS users_new (
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

-- Pasul 2: Copiem datele din tabela veche în cea nouă
INSERT INTO users_new (id, email, password_hash, first_name, last_name, role, group_id, is_active, created_at, last_login)
SELECT id, email, password_hash, first_name, last_name, role, group_id, is_active, created_at, last_login
FROM users;

-- Pasul 3: Ștergem tabela veche
DROP TABLE users;

-- Pasul 4: Redenumim tabela nouă
ALTER TABLE users_new RENAME TO users;

-- Pasul 5: Recreăm indexurile
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_professor ON users(professor_id);

-- ============================================
-- PARTEA 2: Verificare integritate
-- ============================================

-- Verificăm că nu există profesori duplicați ca utilizatori
-- (acest SELECT va returna rezultate dacă există probleme)
-- SELECT p.id, p.email, COUNT(*) as user_count
-- FROM professors p
-- LEFT JOIN users u ON u.professor_id = p.id
-- WHERE u.role = 'professor'
-- GROUP BY p.id
-- HAVING user_count > 1;

-- ============================================
-- NOTA: Seed-ul va popula coloana professor_id
-- pentru utilizatorii cu rol 'professor'
-- ============================================
