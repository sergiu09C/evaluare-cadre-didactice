/**
 * Seed 3 cursuri suplimentare pentru a închide edge case-urile dept × course_type × semester:
 *   - Programare / laborator / sem 2
 *   - Statistică / seminar / sem 1
 *   - Robotică / laborator / sem 1
 *
 * Fără aceste cursuri, filtrele dept × tip × sem returnează 0 rezultate pe aceste combinații.
 */
const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, 'evaluare.db'));

const additions = [
  { dept: 'Programare', name: 'Algoritmi Aplicați', course_type: 'laborator', semester: '2' },
  { dept: 'Statistică', name: 'Statistică Aplicată', course_type: 'seminar', semester: '1' },
  { dept: 'Robotică', name: 'Programare Roboți', course_type: 'laborator', semester: '1' },
];

const findProf = db.prepare(
  `SELECT id, faculty_id FROM professors WHERE department LIKE ? ORDER BY id LIMIT 1`,
);
const findStudyYear = db.prepare(
  `SELECT sy.id FROM study_years sy
   JOIN programs pr ON pr.id = sy.program_id
   WHERE pr.faculty_id = ?
   ORDER BY sy.year_number LIMIT 1`,
);
const checkExists = db.prepare(
  `SELECT c.id FROM courses c JOIN professors p ON p.id = c.professor_id
   WHERE p.department LIKE ? AND c.course_type = ? AND c.semester = ? LIMIT 1`,
);
const insertCourse = db.prepare(
  `INSERT INTO courses (name, code, study_year_id, professor_id, course_type, semester, academic_year)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
);

db.exec('BEGIN');
try {
  for (const a of additions) {
    const existing = checkExists.get('%' + a.dept + '%', a.course_type, a.semester);
    if (existing) {
      console.log(`✓ ${a.dept}/${a.course_type}/sem ${a.semester} deja există (course ${existing.id})`);
      continue;
    }
    const prof = findProf.get('%' + a.dept + '%');
    if (!prof) {
      console.log(`✗ Niciun profesor în dept ${a.dept}`);
      continue;
    }
    const sy = findStudyYear.get(prof.faculty_id);
    if (!sy) {
      console.log(`✗ Niciun study_year în facultatea profesorului ${a.dept}`);
      continue;
    }
    const code = a.name.toUpperCase().replace(/\s+/g, '').slice(0, 8) + a.course_type[0].toUpperCase();
    // Folosesc același academic_year ca restul DB-ului pentru consistență
    // (altfel MAX(academic_year) filtrează celelalte cursuri din endpoint-uri).
    const academicYear = db
      .prepare('SELECT academic_year FROM courses GROUP BY academic_year ORDER BY COUNT(*) DESC LIMIT 1')
      .get()?.academic_year || '2025-2026';
    const result = insertCourse.run(
      a.name,
      code,
      sy.id,
      prof.id,
      a.course_type,
      a.semester,
      academicYear,
    );
    console.log(`+ ${a.dept}/${a.course_type}/sem ${a.semester} → "${a.name}" course_id=${result.lastInsertRowid}`);
  }
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

// Verificare
const stillMissing = db
  .prepare(
    `WITH all_combos AS (
       SELECT DISTINCT p.department, c.course_type FROM professors p, courses c WHERE p.department IS NOT NULL
     )
     SELECT ac.department, ac.course_type, sems.sem
     FROM all_combos ac
     CROSS JOIN (SELECT '1' AS sem UNION SELECT '2') sems
     WHERE NOT EXISTS (
       SELECT 1 FROM courses c2 JOIN professors p2 ON p2.id=c2.professor_id
       WHERE p2.department=ac.department AND c2.course_type=ac.course_type AND c2.semester=sems.sem
     )`,
  )
  .all();
console.log(`\nFinal: ${stillMissing.length} combinații încă lipsă`);
for (const m of stillMissing) console.log('  ', m.department, '/', m.course_type, '/ sem', m.sem);

db.close();
