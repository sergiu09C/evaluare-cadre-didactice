/**
 * Verifică sistematic TOATE combinațiile critice de filtre:
 *  1. Departament × Tip curs (20 × 3 = 60 combinații)
 *  2. Program × An × Tip curs (15 × {1,2,3 sau 1,2} × 3)
 *  3. Departament × An (20 × 3)
 *  4. Program × Departament (15 × 20)
 *
 * Raportează orice combinație cu 0 evaluări transmise (potențial bug structural).
 */
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'evaluare.db'));

// Datele de referință
const depts = db
  .prepare(`SELECT DISTINCT department, faculty_id FROM professors WHERE department IS NOT NULL ORDER BY department`)
  .all();
const programs = db
  .prepare(`SELECT id, code, level, faculty_id FROM programs ORDER BY code`)
  .all();
const courseTypes = ['curs', 'seminar', 'laborator'];

console.log(`📊 Verificare sistematică (${depts.length} dept × 3 tipuri = ${depts.length * 3} combinații dept×tip)\n`);

// === 1. DEPARTAMENT × TIP CURS ===
console.log('=== 1. Departament × Tip curs ===');
const deptTypeIssues = [];
for (const d of depts) {
  for (const ct of courseTypes) {
    const row = db
      .prepare(
        `SELECT COUNT(DISTINCT e.id) AS evals, COUNT(DISTINCT c.id) AS courses
         FROM courses c
         JOIN professors p ON p.id = c.professor_id
         LEFT JOIN evaluations e ON e.course_id = c.id AND e.status='submitted'
         WHERE p.department = ? AND c.course_type = ?`,
      )
      .get(d.department, ct);
    if (row.courses === 0) {
      deptTypeIssues.push({ dept: d.department, type: ct, reason: 'no_courses' });
    } else if (row.evals === 0) {
      deptTypeIssues.push({ dept: d.department, type: ct, courses: row.courses, reason: 'no_evals' });
    }
  }
}
console.log(`  Combinații verificate: ${depts.length * 3}`);
console.log(`  Combinații cu probleme: ${deptTypeIssues.length}`);
if (deptTypeIssues.length > 0) {
  for (const i of deptTypeIssues.slice(0, 10)) console.log(`    ❌ ${i.dept} + ${i.type}: ${i.reason}`);
}

// === 2. PROGRAM × AN × TIP CURS ===
console.log('\n=== 2. Program × An × Tip curs ===');
const programYearTypeIssues = [];
let tested = 0;
for (const pr of programs) {
  const years = db
    .prepare(`SELECT year_number FROM study_years WHERE program_id = ? ORDER BY year_number`)
    .all(pr.id)
    .map((r) => r.year_number);
  for (const y of years) {
    for (const ct of courseTypes) {
      tested++;
      const row = db
        .prepare(
          `SELECT COUNT(DISTINCT e.id) AS evals, COUNT(DISTINCT c.id) AS courses
           FROM courses c
           JOIN study_years sy ON sy.id = c.study_year_id
           LEFT JOIN evaluations e ON e.course_id = c.id AND e.status='submitted'
           WHERE sy.program_id = ? AND sy.year_number = ? AND c.course_type = ?`,
        )
        .get(pr.id, y, ct);
      if (row.courses === 0) {
        programYearTypeIssues.push({ program: pr.code, level: pr.level, year: y, type: ct, reason: 'no_courses' });
      } else if (row.evals === 0) {
        programYearTypeIssues.push({ program: pr.code, level: pr.level, year: y, type: ct, courses: row.courses, reason: 'no_evals' });
      }
    }
  }
}
console.log(`  Combinații testate: ${tested}`);
console.log(`  Cu probleme: ${programYearTypeIssues.length}`);
if (programYearTypeIssues.length > 0) {
  for (const i of programYearTypeIssues.slice(0, 10)) {
    console.log(`    ❌ ${i.program} (${i.level}) an=${i.year} + ${i.type}: ${i.reason} (${i.courses ?? 0} cursuri)`);
  }
}

// === 3. DEPARTAMENT × AN ===
console.log('\n=== 3. Departament × An studiu ===');
const deptYearIssues = [];
const allYears = db.prepare(`SELECT DISTINCT year_number FROM study_years ORDER BY year_number`).all().map((r) => r.year_number);
for (const d of depts) {
  for (const y of allYears) {
    const row = db
      .prepare(
        `SELECT COUNT(DISTINCT e.id) AS evals, COUNT(DISTINCT c.id) AS courses
         FROM courses c
         JOIN study_years sy ON sy.id = c.study_year_id
         JOIN professors p ON p.id = c.professor_id
         LEFT JOIN evaluations e ON e.course_id = c.id AND e.status='submitted'
         WHERE p.department = ? AND sy.year_number = ?`,
      )
      .get(d.department, y);
    if (row.courses === 0) {
      deptYearIssues.push({ dept: d.department, year: y, reason: 'no_courses' });
    } else if (row.evals === 0) {
      deptYearIssues.push({ dept: d.department, year: y, courses: row.courses, reason: 'no_evals' });
    }
  }
}
console.log(`  Combinații verificate: ${depts.length * allYears.length}`);
console.log(`  Cu probleme: ${deptYearIssues.length}`);
if (deptYearIssues.length > 0) {
  for (const i of deptYearIssues.slice(0, 10)) console.log(`    ❌ ${i.dept} an=${i.year}: ${i.reason} (${i.courses ?? 0} cursuri)`);
}

// === 4. PROGRAM × DEPARTAMENT ===
console.log('\n=== 4. Program × Departament (predare cursuri) ===');
const programDeptIssues = [];
let testedPD = 0;
for (const pr of programs) {
  // Doar departamente din aceeași facultate (logică)
  const deptsInFac = depts.filter((d) => d.faculty_id === pr.faculty_id);
  for (const d of deptsInFac) {
    testedPD++;
    const row = db
      .prepare(
        `SELECT COUNT(DISTINCT e.id) AS evals, COUNT(DISTINCT c.id) AS courses
         FROM courses c
         JOIN study_years sy ON sy.id = c.study_year_id
         JOIN professors p ON p.id = c.professor_id
         LEFT JOIN evaluations e ON e.course_id = c.id AND e.status='submitted'
         WHERE sy.program_id = ? AND p.department = ?`,
      )
      .get(pr.id, d.department);
    if (row.courses === 0) {
      programDeptIssues.push({ program: pr.code, dept: d.department, reason: 'no_courses' });
    } else if (row.evals === 0) {
      programDeptIssues.push({ program: pr.code, dept: d.department, courses: row.courses, reason: 'no_evals' });
    }
  }
}
console.log(`  Combinații testate (în aceeași facultate): ${testedPD}`);
console.log(`  Cu probleme: ${programDeptIssues.length}`);
if (programDeptIssues.length > 0 && programDeptIssues.length <= 30) {
  for (const i of programDeptIssues) {
    console.log(`    ⚠️ ${i.program} × ${i.dept}: ${i.reason} (${i.courses ?? 0} cursuri)`);
  }
} else if (programDeptIssues.length > 30) {
  console.log(`    Primele 10: `);
  for (const i of programDeptIssues.slice(0, 10)) {
    console.log(`    ⚠️ ${i.program} × ${i.dept}: ${i.reason}`);
  }
}

// === Sumar ===
console.log('\n📋 SUMAR:');
console.log(`  1. Dept × Tip curs:           ${deptTypeIssues.length === 0 ? '✅ 60/60 OK' : `❌ ${deptTypeIssues.length} probleme`}`);
console.log(`  2. Program × An × Tip curs:   ${programYearTypeIssues.length === 0 ? `✅ ${tested}/${tested} OK` : `❌ ${programYearTypeIssues.length} probleme`}`);
console.log(`  3. Dept × An studiu:          ${deptYearIssues.length === 0 ? `✅ ${depts.length * allYears.length}/${depts.length * allYears.length} OK` : `❌ ${deptYearIssues.length} probleme`}`);
console.log(`  4. Program × Departament:     ${programDeptIssues.length === 0 ? `✅ ${testedPD}/${testedPD} OK` : `⚠️ ${programDeptIssues.length} cazuri (din ${testedPD}; unele pot fi normale)`}`);

db.close();
