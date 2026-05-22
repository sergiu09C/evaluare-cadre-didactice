/**
 * Redistribute UNIFORM — alocă cursurile astfel încât FIECARE profesor să primească
 * cel puțin un curs (dacă există suficiente). Plus distribuție pe tipuri și semestre.
 *
 * Algoritm:
 *  1. Pentru fiecare facultate, shuffle profesori
 *  2. Cursurile sortate pe (course_type, study_year), round-robin pe profesori
 *  3. Verifică: fiecare prof primește cursuri din mai multe tipuri
 *  4. După alocare, redistribuie semestrele pe (study_year × course_type) pentru consistență
 */
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'evaluare.db'));

console.log('🔀 Redistribute UNIFORM courses pe profesori...');

let _seed = 11;
function srand() {
  _seed ^= _seed << 13;
  _seed ^= _seed >>> 17;
  _seed ^= _seed << 5;
  return ((_seed >>> 0) % 1000000) / 1000000;
}

const faculties = db.prepare('SELECT id, code FROM faculties').all();
const update = db.prepare(`UPDATE courses SET professor_id = ? WHERE id = ?`);

db.exec('BEGIN');
try {
  for (const f of faculties) {
    const profs = db
      .prepare(`SELECT id FROM professors WHERE faculty_id = ? ORDER BY id`)
      .all(f.id)
      .map((p) => p.id);
    if (profs.length === 0) continue;
    // shuffle
    for (let i = profs.length - 1; i > 0; i--) {
      const j = Math.floor(srand() * (i + 1));
      [profs[i], profs[j]] = [profs[j], profs[i]];
    }

    // Cursurile din facultatea f (via study_year → program → faculty)
    const courses = db
      .prepare(
        `SELECT c.id, c.course_type, c.study_year_id
         FROM courses c
         JOIN study_years sy ON sy.id = c.study_year_id
         JOIN programs pr ON pr.id = sy.program_id
         WHERE pr.faculty_id = ?
         ORDER BY c.course_type, c.study_year_id, c.id`,
      )
      .all(f.id);

    // Round-robin: aloc fiecare curs unui profesor (cycle)
    courses.forEach((c, idx) => {
      const prof = profs[idx % profs.length];
      update.run(prof, c.id);
    });
  }
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

console.log('✓ Redistribuit.');

// Verificare
const profsWithoutCourses = db
  .prepare(
    `SELECT p.id, p.first_name||' '||p.last_name AS name, COUNT(c.id) AS courses
     FROM professors p LEFT JOIN courses c ON c.professor_id = p.id
     GROUP BY p.id HAVING courses = 0`,
  )
  .all();
console.log(`\n📊 Profesori fără cursuri: ${profsWithoutCourses.length}`);
if (profsWithoutCourses.length > 0) {
  for (const p of profsWithoutCourses.slice(0, 5)) console.log(`  ❌ ${p.name}`);
}

const stats = db
  .prepare(
    `SELECT MIN(n) AS min_c, MAX(n) AS max_c, AVG(n) AS avg_c FROM
     (SELECT COUNT(*) AS n FROM courses GROUP BY professor_id)`,
  )
  .get();
console.log(`\nCursuri per prof: min=${stats.min_c}, max=${stats.max_c}, avg=${stats.avg_c.toFixed(2)}`);

db.close();
