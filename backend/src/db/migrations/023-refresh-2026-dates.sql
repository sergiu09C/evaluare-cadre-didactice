-- Migration 023: aliniere date demo la ciclul curent (mai 2026).
--
-- Cerere din feedback: „toate datele existente acum să fie pe 2026, luna mai".
-- Aici împingem doar valorile string vizibile în UI (semestrul declanșator din
-- entries-urile „You said / We did") + actualizăm updated_at pe entries-urile
-- închizătoare de loop pentru a se sorta corect în interfața studentului.

UPDATE closing_loop_entries
   SET triggered_by_semester = '2025-2026 / Sem 2',
       updated_at = '2026-05-19 10:00:00'
 WHERE triggered_by_semester LIKE '2024-2025%'
    OR triggered_by_semester LIKE '2023-2024%';

-- Dacă există perioade de evaluare istorice (`evaluation_periods`) marcate active
-- dar legate de un academic_year vechi, le aliniem la ciclul curent. Idempotent.
UPDATE evaluation_periods
   SET academic_year = '2025-2026',
       semester = '2',
       name = 'Evaluare Semestrul II - 2025/2026'
 WHERE is_active = 1
   AND academic_year IN ('2022-2023', '2023-2024', '2024-2025');

-- Cursurile demo: aliniem academic_year vechi la ciclul curent.
UPDATE courses
   SET academic_year = '2025-2026'
 WHERE academic_year IN ('2022-2023', '2023-2024', '2024-2025');
