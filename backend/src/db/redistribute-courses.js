/**
 * Redistribute courses among professors astfel încât fiecare DEPARTAMENT
 * să predea cursuri din TOATE tipurile (curs + seminar + laborator).
 *
 * Strategie: pentru fiecare facultate, grupez profesorii pe departament.
 * Pentru fiecare study_year × course_type, aloc rotativ profesorii din departamente
 * astfel încât în decursul tuturor study_years, fiecare departament să prindă
 * cel puțin un curs din fiecare tip.
 */
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'evaluare.db');
const db = new Database(DB_PATH);

let _seed = 7;
function srandom() {
  _seed ^= _seed << 13;
  _seed ^= _seed >>> 17;
  _seed ^= _seed << 5;
  return ((_seed >>> 0) % 1000000) / 1000000;
}

console.log('🔀 Redistribute course assignments...');

// 1. Pentru fiecare facultate: profesori grupați pe departament
const faculties = db.prepare(`SELECT id, code FROM faculties`).all();
const profByFacAndDept = new Map(); // facId -> Map<dept, prof[]>
for (const f of faculties) {
  const profs = db
    .prepare(`SELECT id, department FROM professors WHERE faculty_id=? AND department IS NOT NULL`)
    .all(f.id);
  const byDept = new Map();
  for (const p of profs) {
    if (!byDept.has(p.department)) byDept.set(p.department, []);
    byDept.get(p.department).push(p.id);
  }
  profByFacAndDept.set(f.id, byDept);
}

// 2. Cursurile existente cu facultatea derivată via study_year → program → faculty
const courses = db
  .prepare(
    `SELECT c.id, c.course_type, c.study_year_id, pr.faculty_id
     FROM courses c
     JOIN study_years sy ON sy.id = c.study_year_id
     JOIN programs pr ON pr.id = sy.program_id
     ORDER BY c.study_year_id, c.id`,
  )
  .all();

// 3. Pentru fiecare facultate + course_type, distribuie cursurile round-robin pe departamente
// astfel încât fiecare departament să predea în toate tipurile.
const update = db.prepare(`UPDATE courses SET professor_id = ? WHERE id = ?`);
db.exec('BEGIN');
try {
  // Grupez cursurile pe (faculty_id, course_type)
  const byFacType = new Map();
  for (const c of courses) {
    const key = `${c.faculty_id}|${c.course_type}`;
    if (!byFacType.has(key)) byFacType.set(key, []);
    byFacType.get(key).push(c);
  }

  for (const [key, list] of byFacType) {
    const [facId, courseType] = key.split('|');
    const deptMap = profByFacAndDept.get(Number(facId));
    if (!deptMap || deptMap.size === 0) continue;
    const depts = [...deptMap.keys()];
    // shuffle departments pentru variabilitate
    for (let i = depts.length - 1; i > 0; i--) {
      const j = Math.floor(srandom() * (i + 1));
      [depts[i], depts[j]] = [depts[j], depts[i]];
    }
    // alocăm fiecare curs unui profesor din departamentul i % depts.length
    list.forEach((c, idx) => {
      const dept = depts[idx % depts.length];
      const profsInDept = deptMap.get(dept);
      const prof = profsInDept[idx % profsInDept.length];
      update.run(prof, c.id);
    });
  }
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

console.log('✓ Re-asignare profesori finalizată.');

// 4. Verificare: fiecare departament are toate cele 3 tipuri?
const checkRows = db
  .prepare(
    `SELECT p.department,
            SUM(CASE WHEN c.course_type='curs' THEN 1 ELSE 0 END) AS cursuri,
            SUM(CASE WHEN c.course_type='seminar' THEN 1 ELSE 0 END) AS seminarii,
            SUM(CASE WHEN c.course_type='laborator' THEN 1 ELSE 0 END) AS laboratoare
     FROM professors p JOIN courses c ON c.professor_id = p.id
     WHERE p.department IS NOT NULL
     GROUP BY p.department
     ORDER BY p.department`,
  )
  .all();
const missing = checkRows.filter((r) => r.cursuri === 0 || r.seminarii === 0 || r.laboratoare === 0);
console.log(`\n📊 Verificare distribuție:`);
console.log(`  Departamente total: ${checkRows.length}`);
console.log(`  Cu toate 3 tipuri:  ${checkRows.length - missing.length}`);
console.log(`  Lipsesc tipuri:     ${missing.length}`);
if (missing.length > 0) {
  console.log('  Departamente incomplete:');
  for (const r of missing.slice(0, 10)) {
    console.log(`    ${r.department}: c=${r.cursuri}, s=${r.seminarii}, l=${r.laboratoare}`);
  }
}

db.close();
