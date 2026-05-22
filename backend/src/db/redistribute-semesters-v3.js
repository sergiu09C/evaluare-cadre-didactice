/**
 * Redistribute v3 — combinat:
 *  1. Pas 1: split pe (study_year, course_type) — garantează program × an × tip × sem are date
 *  2. Pas 2: swap-uri ca să echilibreze și pe (departament, course_type)
 */
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'evaluare.db'));

console.log('🔀 Redistribute semestre (v3 — combinat)...');

// PAS 1: split pe (study_year, course_type)
const courses = db
  .prepare(
    `SELECT c.id, c.study_year_id, c.course_type, p.department
     FROM courses c JOIN professors p ON p.id = c.professor_id
     ORDER BY c.study_year_id, c.course_type, c.id`,
  )
  .all();

const groupsSY = new Map();
for (const c of courses) {
  const key = `${c.study_year_id}|${c.course_type}`;
  if (!groupsSY.has(key)) groupsSY.set(key, []);
  groupsSY.get(key).push(c);
}

const update = db.prepare(`UPDATE courses SET semester = ? WHERE id = ?`);
db.exec('BEGIN');
try {
  // Inițial: round-robin pe study_year + tip
  for (const [, list] of groupsSY) {
    list.forEach((c, idx) => {
      c.semester = idx % 2 === 0 ? '1' : '2';
      update.run(c.semester, c.id);
    });
  }
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

// PAS 2: identifică departamente cu dezechilibru pe sem și swap cu un alt
//        departament din același study_year + tip
const checkAndFix = () => {
  const swaps = [];
  // Pentru fiecare (departament, course_type): câte sem=1 vs sem=2
  const deptBalance = db
    .prepare(
      `SELECT p.department, c.course_type,
              SUM(CASE WHEN c.semester='1' THEN 1 ELSE 0 END) AS s1,
              SUM(CASE WHEN c.semester='2' THEN 1 ELSE 0 END) AS s2
       FROM courses c JOIN professors p ON p.id=c.professor_id
       WHERE p.department IS NOT NULL
       GROUP BY p.department, c.course_type`,
    )
    .all();

  // Departamente cu sem=0 pe un sem
  const imbalanced = deptBalance.filter((r) => r.s1 === 0 || r.s2 === 0);
  if (imbalanced.length === 0) return { swaps: 0, imbalanced: 0 };

  db.exec('BEGIN');
  try {
    for (const r of imbalanced) {
      const missingSem = r.s1 === 0 ? '1' : '2';
      const haveSem = missingSem === '1' ? '2' : '1';
      // Găsește un curs din dept-ul nostru cu haveSem
      const myCourse = db
        .prepare(
          `SELECT c.id, c.study_year_id FROM courses c
           JOIN professors p ON p.id=c.professor_id
           WHERE p.department = ? AND c.course_type = ? AND c.semester = ?
           LIMIT 1`,
        )
        .get(r.department, r.course_type, haveSem);
      if (!myCourse) continue;
      // Găsește un curs din ALT departament din același study_year+tip cu missingSem
      const otherCourse = db
        .prepare(
          `SELECT c.id FROM courses c
           JOIN professors p ON p.id=c.professor_id
           WHERE c.study_year_id = ? AND c.course_type = ? AND c.semester = ?
             AND p.department != ? AND p.department IS NOT NULL
           LIMIT 1`,
        )
        .get(myCourse.study_year_id, r.course_type, missingSem, r.department);
      if (!otherCourse) continue;
      // Swap semestrele între cele 2 cursuri
      update.run(missingSem, myCourse.id);
      update.run(haveSem, otherCourse.id);
      swaps.push({ myCourseId: myCourse.id, otherCourseId: otherCourse.id });
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  return { swaps: swaps.length, imbalanced: imbalanced.length };
};

// Aplic swap-uri iterativ până la convergență (max 10 iterații)
for (let i = 1; i <= 10; i++) {
  const { swaps, imbalanced } = checkAndFix();
  console.log(`  Pas ${i}: ${imbalanced} dept dezechilibrate, ${swaps} swap-uri aplicate`);
  if (imbalanced === 0 || swaps === 0) break;
}

// Verificare finală
const final = db
  .prepare(
    `WITH all_combos AS (
       SELECT DISTINCT p.department, c.course_type
       FROM professors p, courses c
       WHERE p.department IS NOT NULL
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
console.log(`\n📊 Dept × tip × sem fără acoperire: ${final.length}`);

// Verifică program × an × tip × sem
const finalPYTS = db
  .prepare(
    `WITH all_combos AS (
       SELECT DISTINCT sy.program_id, sy.year_number, c.course_type, sems.sem
       FROM study_years sy
       JOIN courses cc ON cc.study_year_id = sy.id
       JOIN courses c ON c.id = cc.id
       CROSS JOIN (SELECT '1' AS sem UNION SELECT '2') sems
     )
     SELECT ac.program_id, ac.year_number, ac.course_type, ac.sem
     FROM all_combos ac
     WHERE NOT EXISTS (
       SELECT 1 FROM courses c2 JOIN study_years sy2 ON sy2.id=c2.study_year_id
       WHERE sy2.program_id=ac.program_id AND sy2.year_number=ac.year_number
         AND c2.course_type=ac.course_type AND c2.semester=ac.sem
     )`,
  )
  .all();
console.log(`📊 Program × an × tip × sem fără acoperire: ${finalPYTS.length}`);
if (finalPYTS.length > 0 && finalPYTS.length <= 10) {
  for (const m of finalPYTS) console.log(`  ❌ programId=${m.program_id} an=${m.year_number} ${m.course_type} sem=${m.sem}`);
}

db.close();
