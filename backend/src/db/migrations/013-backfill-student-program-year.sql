-- Migration 013: backfill users.program_id și users.year pentru studenți
-- Coloanele există din migrația 004 dar nu au fost populate la seed.
-- Chain-ul groups → series → study_years furnizează valorile canonice.

UPDATE users
SET
  program_id = (
    SELECT sy.program_id
    FROM groups g
    JOIN series s ON s.id = g.series_id
    JOIN study_years sy ON sy.id = s.study_year_id
    WHERE g.id = users.group_id
  ),
  year = (
    SELECT sy.year_number
    FROM groups g
    JOIN series s ON s.id = g.series_id
    JOIN study_years sy ON sy.id = s.study_year_id
    WHERE g.id = users.group_id
  )
WHERE role = 'student'
  AND group_id IS NOT NULL
  AND (program_id IS NULL OR year IS NULL);
