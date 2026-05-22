/**
 * Unit tests pentru applyProfessorAssignments — folosește DB temporar in-memory.
 * Rulează cu: node --test backend/tests/applyProfessorAssignments.test.js
 */
const test = require('node:test');
const assert = require('node:assert');
const Database = require('better-sqlite3');

// Inline helper — copy din adminUsersController.js (sincronizat).
function applyProfessorAssignments(db, professorId, assignments) {
  if (!Array.isArray(assignments)) return;
  const updCourse = db.prepare(`UPDATE courses SET professor_id = ?, course_type = ? WHERE id = ?`);
  for (const a of assignments) {
    if (!a || !a.course_id) continue;
    const activity = ['curs', 'seminar', 'laborator'].includes(a.activity) ? a.activity : 'curs';
    updCourse.run(professorId, activity, a.course_id);
  }
}

function setupDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE courses (
      id INTEGER PRIMARY KEY,
      professor_id INTEGER,
      course_type TEXT
    );
    INSERT INTO courses (id, professor_id, course_type) VALUES
      (1, 99, 'curs'),
      (2, 99, 'seminar'),
      (3, 88, 'laborator');
  `);
  return db;
}

test('non-array assignments → no-op', () => {
  const db = setupDb();
  applyProfessorAssignments(db, 7, null);
  applyProfessorAssignments(db, 7, undefined);
  applyProfessorAssignments(db, 7, 'not array');
  const c = db.prepare('SELECT professor_id, course_type FROM courses WHERE id = 1').get();
  assert.strictEqual(c.professor_id, 99);
  assert.strictEqual(c.course_type, 'curs');
});

test('assigns courses to professor with valid activity', () => {
  const db = setupDb();
  applyProfessorAssignments(db, 7, [
    { course_id: 1, activity: 'laborator' },
    { course_id: 2, activity: 'curs' },
  ]);
  const c1 = db.prepare('SELECT * FROM courses WHERE id = 1').get();
  const c2 = db.prepare('SELECT * FROM courses WHERE id = 2').get();
  const c3 = db.prepare('SELECT * FROM courses WHERE id = 3').get();
  assert.strictEqual(c1.professor_id, 7);
  assert.strictEqual(c1.course_type, 'laborator');
  assert.strictEqual(c2.professor_id, 7);
  assert.strictEqual(c2.course_type, 'curs');
  // course 3 nemodificat
  assert.strictEqual(c3.professor_id, 88);
  assert.strictEqual(c3.course_type, 'laborator');
});

test('invalid activity → fallback to curs', () => {
  const db = setupDb();
  applyProfessorAssignments(db, 7, [{ course_id: 1, activity: 'invalid' }]);
  const c1 = db.prepare('SELECT * FROM courses WHERE id = 1').get();
  assert.strictEqual(c1.course_type, 'curs');
});

test('assignment without course_id → skipped', () => {
  const db = setupDb();
  applyProfessorAssignments(db, 7, [
    { activity: 'curs' }, // missing course_id
    { course_id: 1, activity: 'laborator' },
  ]);
  const c1 = db.prepare('SELECT * FROM courses WHERE id = 1').get();
  // doar al doilea s-a aplicat
  assert.strictEqual(c1.professor_id, 7);
  assert.strictEqual(c1.course_type, 'laborator');
});

test('null/undefined assignment entries → skipped', () => {
  const db = setupDb();
  applyProfessorAssignments(db, 7, [null, undefined, { course_id: 1, activity: 'curs' }]);
  const c1 = db.prepare('SELECT * FROM courses WHERE id = 1').get();
  assert.strictEqual(c1.professor_id, 7);
});
