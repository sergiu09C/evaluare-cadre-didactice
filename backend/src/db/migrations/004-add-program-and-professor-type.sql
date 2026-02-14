-- Migration 004: Add program_id and year to users, add type to professors

-- 1. Add program_id and year to users table (for students)
ALTER TABLE users ADD COLUMN program_id INTEGER;
ALTER TABLE users ADD COLUMN year INTEGER CHECK(year BETWEEN 1 AND 6);

-- Add foreign key constraint
CREATE INDEX idx_users_program ON users(program_id);

-- 2. Add type to professors table (Curs/Laborator/Seminar)
ALTER TABLE professors ADD COLUMN type TEXT CHECK(type IN ('curs', 'laborator', 'seminar')) DEFAULT 'curs';

-- 3. Update existing data with sample values
-- Update some users to have programs (assuming students exist)
UPDATE users SET program_id = 1, year = 3 WHERE id = 1 AND role = 'student'; -- Informatică, Anul 3
UPDATE users SET program_id = 2, year = 2 WHERE id = 2 AND role = 'student'; -- CTI, Anul 2
UPDATE users SET program_id = 3, year = 1 WHERE id = 3 AND role = 'student'; -- IAIA Master, Anul 1
UPDATE users SET program_id = 4, year = 4 WHERE id = 4 AND role = 'student'; -- Matematică, Anul 4

-- Update some professors to have types
UPDATE professors SET type = 'curs' WHERE id IN (1, 3, 5, 7); -- Profesori de curs
UPDATE professors SET type = 'laborator' WHERE id IN (2, 4, 6, 8); -- Profesori de laborator
UPDATE professors SET type = 'seminar' WHERE id IN (9, 10); -- Profesori de seminar

-- 4. Create view for student details with program info
CREATE VIEW IF NOT EXISTS student_details AS
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.group_id,
  u.year,
  p.id as program_id,
  p.name as program_name,
  p.code as program_code,
  p.level as program_level,
  f.id as faculty_id,
  f.name as faculty_name
FROM users u
LEFT JOIN programs p ON u.program_id = p.id
LEFT JOIN faculties f ON p.faculty_id = f.id
WHERE u.role = 'student';

-- 5. Create view for professor details with type
CREATE VIEW IF NOT EXISTS professor_details AS
SELECT
  pr.id,
  pr.first_name,
  pr.last_name,
  pr.title,
  pr.email,
  pr.department,
  pr.type as professor_type,
  pr.is_active,
  f.id as faculty_id,
  f.name as faculty_name
FROM professors pr
LEFT JOIN faculties f ON pr.faculty_id = f.id;
