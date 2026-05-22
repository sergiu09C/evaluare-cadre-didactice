/**
 * Fix edge case: pentru fiecare combinație (departament, course_type, semester) fără acoperire,
 * fă un swap atomic cu alt curs din același study_year.
 */
const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, 'evaluare.db'));

const update = db.prepare(`UPDATE courses SET semester = ? WHERE id = ?`);

const findMissing = () =>
  db
    .prepare(
      `WITH all_combos AS (
         SELECT DISTINCT p.department, c.course_type FROM professors p, courses c
         WHERE p.department IS NOT NULL
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

db.exec('BEGIN');
try {
  for (let pass = 1; pass <= 5; pass++) {
    const missing = findMissing();
    if (missing.length === 0) {
      console.log(`✓ Convergent în ${pass - 1} swap-uri.`);
      break;
    }
    console.log(`Pas ${pass}: ${missing.length} combinații lipsă`);
    for (const m of missing) {
      // Vreau să mut un curs din dept-ul m cu sem opus la sem=m.sem
      const haveSem = m.sem === '1' ? '2' : '1';
      const myCourse = db
        .prepare(
          `SELECT c.id, c.study_year_id FROM courses c JOIN professors p ON p.id=c.professor_id
           WHERE p.department = ? AND c.course_type = ? AND c.semester = ? LIMIT 1`,
        )
        .get(m.department, m.course_type, haveSem);
      if (!myCourse) continue;
      // Compensez: mut un curs din alt dept cu sem=m.sem la sem=haveSem (din același sy + tip)
      const otherCourse = db
        .prepare(
          `SELECT c.id FROM courses c JOIN professors p ON p.id=c.professor_id
           WHERE c.study_year_id = ? AND c.course_type = ? AND c.semester = ?
             AND p.department != ? AND p.department IS NOT NULL
           LIMIT 1`,
        )
        .get(myCourse.study_year_id, m.course_type, m.sem, m.department);
      if (!otherCourse) {
        // Caută într-un alt study_year compatibil
        const otherCourseAny = db
          .prepare(
            `SELECT c.id FROM courses c JOIN professors p ON p.id=c.professor_id
             WHERE c.course_type = ? AND c.semester = ? AND p.department != ? AND p.department IS NOT NULL
             LIMIT 1`,
          )
          .get(m.course_type, m.sem, m.department);
        if (!otherCourseAny) continue;
        update.run(m.sem, myCourse.id);
        update.run(haveSem, otherCourseAny.id);
      } else {
        update.run(m.sem, myCourse.id);
        update.run(haveSem, otherCourse.id);
      }
    }
  }
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

const finalMissing = findMissing();
console.log(`\nFinal: ${finalMissing.length} combinații lipsă`);
db.close();
