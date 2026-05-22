/**
 * Redistribute semestre v2 — grupare pe (departament, tip_curs) astfel încât
 * fiecare departament să aibă cursuri din fiecare tip distribuite pe ambele semestre.
 *
 * Tipic: fiecare departament are 8 cursuri tip „curs", 4 „seminar", 4 „laborator".
 * Target: 4|4 split pentru curs, 2|2 pentru seminar și laborator.
 */
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'evaluare.db'));

console.log('🔀 Redistribute semestre (v2 — pe departament × tip)...');

const courses = db
  .prepare(
    `SELECT c.id, c.course_type, p.department
     FROM courses c JOIN professors p ON p.id = c.professor_id
     WHERE p.department IS NOT NULL
     ORDER BY p.department, c.course_type, c.id`,
  )
  .all();

// Grupez pe (departament, tip_curs)
const groups = new Map();
for (const c of courses) {
  const key = `${c.department}|${c.course_type}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(c);
}

const update = db.prepare(`UPDATE courses SET semester = ? WHERE id = ?`);
db.exec('BEGIN');
try {
  for (const [, list] of groups) {
    list.forEach((c, idx) => {
      const semester = idx % 2 === 0 ? '1' : '2';
      update.run(semester, c.id);
    });
  }
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

console.log('✓ Semestre redistribuite per dept × tip.');

// Verificare
const check = db
  .prepare(
    `SELECT p.department, c.course_type, c.semester, COUNT(*) AS n
     FROM courses c JOIN professors p ON p.id=c.professor_id
     WHERE p.department IS NOT NULL
     GROUP BY p.department, c.course_type, c.semester
     ORDER BY p.department, c.course_type, c.semester`,
  )
  .all();
console.log('\n📊 Sample (Algebră, Algoritmi, Programare):');
for (const r of check) {
  if (['Algebră', 'Algoritmi și Structuri de Date', 'Programare'].includes(r.department)) {
    console.log(`  ${r.department} | ${r.course_type} | sem=${r.semester}: ${r.n}`);
  }
}

// Verifică acoperirea: pentru fiecare combinație (dept, tip, sem), trebuie să fie >0
const missing = db
  .prepare(
    `WITH all_combos AS (
       SELECT DISTINCT p.department, c.course_type FROM professors p, courses c WHERE p.department IS NOT NULL
     )
     SELECT ac.department, ac.course_type, sem
     FROM all_combos ac
     CROSS JOIN (SELECT '1' AS sem UNION SELECT '2') sems
     WHERE NOT EXISTS (
       SELECT 1 FROM courses c2 JOIN professors p2 ON p2.id=c2.professor_id
       WHERE p2.department=ac.department AND c2.course_type=ac.course_type AND c2.semester=sem
     )`,
  )
  .all();
console.log(`\n📊 Combinații fără acoperire: ${missing.length}`);
for (const m of missing.slice(0, 10)) {
  console.log(`  ❌ ${m.department} | ${m.course_type} | sem=${m.sem}`);
}

db.close();
