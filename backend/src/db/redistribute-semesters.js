/**
 * Redistribute semestre astfel încât FIECARE combinație (course_type × semester)
 * să fie acoperită pentru fiecare study_year.
 *
 * Strategie: pentru fiecare study_year × course_type, jumătate din cursuri merg
 * pe sem=1 și jumătate pe sem=2 (round-robin determinist).
 */
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'evaluare.db'));

console.log('🔀 Redistribute semestre...');

const courses = db
  .prepare(`SELECT id, study_year_id, course_type FROM courses ORDER BY study_year_id, course_type, id`)
  .all();

// Grupez pe (study_year_id, course_type)
const groups = new Map();
for (const c of courses) {
  const key = `${c.study_year_id}|${c.course_type}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(c);
}

const update = db.prepare(`UPDATE courses SET semester = ? WHERE id = ?`);
db.exec('BEGIN');
try {
  for (const [, list] of groups) {
    // Pentru fiecare grup, alternez între sem=1 și sem=2
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

console.log('✓ Semestre redistribuite.');

// Verificare
const checkRows = db
  .prepare(
    `SELECT c.course_type, c.semester, COUNT(*) AS n
     FROM courses c GROUP BY c.course_type, c.semester ORDER BY c.course_type, c.semester`,
  )
  .all();
console.log('\n📊 Distribuție tip × semestru:');
for (const r of checkRows) console.log(`  ${r.course_type} × sem=${r.semester}: ${r.n} cursuri`);

// Per study_year verificare
const syCheck = db
  .prepare(
    `SELECT sy.id AS sy_id, sy.year_number,
       SUM(CASE WHEN c.course_type='curs' AND c.semester='1' THEN 1 ELSE 0 END) AS c1,
       SUM(CASE WHEN c.course_type='curs' AND c.semester='2' THEN 1 ELSE 0 END) AS c2,
       SUM(CASE WHEN c.course_type='seminar' AND c.semester='1' THEN 1 ELSE 0 END) AS s1,
       SUM(CASE WHEN c.course_type='seminar' AND c.semester='2' THEN 1 ELSE 0 END) AS s2,
       SUM(CASE WHEN c.course_type='laborator' AND c.semester='1' THEN 1 ELSE 0 END) AS l1,
       SUM(CASE WHEN c.course_type='laborator' AND c.semester='2' THEN 1 ELSE 0 END) AS l2
     FROM study_years sy JOIN courses c ON c.study_year_id = sy.id
     GROUP BY sy.id ORDER BY sy.id LIMIT 5`,
  )
  .all();
console.log('\n📊 Per study_year (primele 5):');
for (const r of syCheck) {
  console.log(`  sy=${r.sy_id} an=${r.year_number}: curs(${r.c1}|${r.c2}) sem(${r.s1}|${r.s2}) lab(${r.l1}|${r.l2})`);
}

db.close();
