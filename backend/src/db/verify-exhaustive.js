/**
 * Verificare EXHAUSTIVĂ — include semestru:
 *  1. Departament × Tip curs × Semestru (20×3×2 = 120)
 *  2. Program × An × Tip curs × Semestru
 *  3. Pentru fiecare tip de curs (curs/seminar/laborator) separat:
 *     - cu și fără filtru sem=1
 *     - cu și fără filtru sem=2
 *  4. Verifică explicit: orice combinație activă în UI (cascading enforced) → date
 */
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'evaluare.db'));

const depts = db
  .prepare(`SELECT DISTINCT department, faculty_id FROM professors WHERE department IS NOT NULL ORDER BY department`)
  .all();
const programs = db
  .prepare(`SELECT id, code, level, faculty_id FROM programs ORDER BY code`)
  .all();
const courseTypes = ['curs', 'seminar', 'laborator'];
const semesters = ['1', '2'];

let totalChecks = 0;
let totalProblems = 0;

// === 1. Dept × Tip × Semestru (120) ===
console.log('=== 1. Departament × Tip curs × Semestru ===');
const issues1 = [];
for (const d of depts) {
  for (const ct of courseTypes) {
    for (const sem of semesters) {
      totalChecks++;
      const row = db
        .prepare(
          `SELECT COUNT(DISTINCT e.id) AS evals, COUNT(DISTINCT c.id) AS courses
           FROM courses c
           JOIN professors p ON p.id = c.professor_id
           LEFT JOIN evaluations e ON e.course_id = c.id AND e.status='submitted'
           WHERE p.department = ? AND c.course_type = ? AND c.semester = ?`,
        )
        .get(d.department, ct, sem);
      if (row.courses === 0) {
        issues1.push({ dept: d.department, type: ct, sem, reason: 'no_courses' });
      } else if (row.evals === 0) {
        issues1.push({ dept: d.department, type: ct, sem, courses: row.courses, reason: 'no_evals' });
      }
    }
  }
}
console.log(`  Verificate: ${depts.length * 3 * 2} | Cu probleme: ${issues1.length}`);
if (issues1.length > 0) {
  // grupez pe motiv
  const noCoursesGroup = issues1.filter((i) => i.reason === 'no_courses');
  const noEvalsGroup = issues1.filter((i) => i.reason === 'no_evals');
  console.log(`    Fără cursuri: ${noCoursesGroup.length}`);
  console.log(`    Cu cursuri dar fără eval: ${noEvalsGroup.length}`);
  if (noCoursesGroup.length > 0 && noCoursesGroup.length <= 20) {
    console.log('    Detalii fără cursuri:');
    for (const i of noCoursesGroup) console.log(`      ❌ ${i.dept} + ${i.type} + sem=${i.sem}`);
  } else if (noCoursesGroup.length > 20) {
    console.log('    Primele 5:');
    for (const i of noCoursesGroup.slice(0, 5)) console.log(`      ❌ ${i.dept} + ${i.type} + sem=${i.sem}`);
  }
}
totalProblems += issues1.length;

// === 2. Program × An × Tip × Semestru ===
console.log('\n=== 2. Program × An × Tip × Semestru ===');
const issues2 = [];
let tested2 = 0;
for (const pr of programs) {
  const years = db
    .prepare(`SELECT year_number FROM study_years WHERE program_id = ? ORDER BY year_number`)
    .all(pr.id)
    .map((r) => r.year_number);
  for (const y of years) {
    for (const ct of courseTypes) {
      for (const sem of semesters) {
        tested2++;
        totalChecks++;
        const row = db
          .prepare(
            `SELECT COUNT(DISTINCT e.id) AS evals, COUNT(DISTINCT c.id) AS courses
             FROM courses c
             JOIN study_years sy ON sy.id = c.study_year_id
             LEFT JOIN evaluations e ON e.course_id = c.id AND e.status='submitted'
             WHERE sy.program_id = ? AND sy.year_number = ? AND c.course_type = ? AND c.semester = ?`,
          )
          .get(pr.id, y, ct, sem);
        if (row.courses === 0) {
          issues2.push({ program: pr.code, year: y, type: ct, sem, reason: 'no_courses' });
        } else if (row.evals === 0) {
          issues2.push({ program: pr.code, year: y, type: ct, sem, reason: 'no_evals' });
        }
      }
    }
  }
}
console.log(`  Verificate: ${tested2} | Cu probleme: ${issues2.length}`);
if (issues2.length > 0) {
  const noCourses = issues2.filter((i) => i.reason === 'no_courses');
  const noEvals = issues2.filter((i) => i.reason === 'no_evals');
  console.log(`    Fără cursuri: ${noCourses.length}`);
  console.log(`    Cu cursuri dar fără eval: ${noEvals.length}`);
  if (noCourses.length > 0) {
    console.log('    Detalii primele 10 fără cursuri:');
    for (const i of noCourses.slice(0, 10)) console.log(`      ❌ ${i.program} an=${i.year} + ${i.type} + sem=${i.sem}`);
  }
}
totalProblems += issues2.length;

// === 3. Per tip curs separat: distribuția pe semestre per dept ===
console.log('\n=== 3. Distribuție per tip curs × semestru (cumulat pe dept) ===');
for (const ct of courseTypes) {
  console.log(`  Tip: ${ct}`);
  for (const sem of semesters) {
    const row = db
      .prepare(
        `SELECT COUNT(DISTINCT c.id) AS courses, COUNT(DISTINCT e.id) AS evals,
                COUNT(DISTINCT p.department) AS depts_covered
         FROM courses c
         JOIN professors p ON p.id = c.professor_id
         LEFT JOIN evaluations e ON e.course_id = c.id AND e.status='submitted'
         WHERE c.course_type = ? AND c.semester = ? AND p.department IS NOT NULL`,
      )
      .get(ct, sem);
    console.log(`    sem=${sem}: ${row.courses} cursuri, ${row.evals} eval, ${row.depts_covered} departamente acoperite`);
  }
}

// === 4. Per program×semestru explicit ===
console.log('\n=== 4. Program × Semestru (toate trebuie să aibă date) ===');
const issues4 = [];
for (const pr of programs) {
  for (const sem of semesters) {
    totalChecks++;
    const row = db
      .prepare(
        `SELECT COUNT(DISTINCT e.id) AS evals
         FROM courses c
         JOIN study_years sy ON sy.id = c.study_year_id
         LEFT JOIN evaluations e ON e.course_id = c.id AND e.status='submitted'
         WHERE sy.program_id = ? AND c.semester = ?`,
      )
      .get(pr.id, sem);
    if (row.evals === 0) {
      issues4.push({ program: pr.code, sem });
    }
  }
}
console.log(`  Verificate: ${programs.length * 2} | Cu probleme: ${issues4.length}`);
totalProblems += issues4.length;
if (issues4.length > 0) {
  for (const i of issues4) console.log(`    ❌ ${i.program} sem=${i.sem}`);
}

console.log(`\n📋 TOTAL: ${totalChecks} combinații verificate, ${totalProblems} probleme.`);
db.close();
