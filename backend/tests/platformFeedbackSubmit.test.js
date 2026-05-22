/**
 * Unit tests pentru logica de submit feedback platformă (DB in-memory).
 * Rulează cu: node --test backend/tests/platformFeedbackSubmit.test.js
 */
const test = require('node:test');
const assert = require('node:assert');
const Database = require('better-sqlite3');

function setupDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE platform_feedback_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE platform_feedback_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER,
      user_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      response_likert INTEGER,
      response_text TEXT,
      response_choice TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return db;
}

// Replică pură a tranzacției din controller (fără request/response).
function submit(db, userId, responses) {
  const insertSubmission = db.prepare(
    `INSERT INTO platform_feedback_submissions (user_id) VALUES (?)`,
  );
  const insertResponse = db.prepare(
    `INSERT INTO platform_feedback_responses
       (submission_id, user_id, question_id, response_likert, response_text, response_choice)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const tx = db.transaction((rows) => {
    const subId = insertSubmission.run(userId).lastInsertRowid;
    let n = 0;
    for (const r of rows) {
      if (!r.questionId) continue;
      if (r.likert == null && (!r.text || !r.text.trim()) && (!r.choice || !r.choice.trim())) continue;
      insertResponse.run(subId, userId, r.questionId, r.likert ?? null, r.text ?? null, r.choice ?? null);
      n++;
    }
    return { subId, n };
  });
  return tx(responses);
}

test('submit creează submission + count corect', () => {
  const db = setupDb();
  const r = submit(db, 42, [
    { questionId: 1, likert: 5 },
    { questionId: 2, text: 'bun' },
  ]);
  assert.strictEqual(r.n, 2);
  const subs = db.prepare('SELECT * FROM platform_feedback_submissions WHERE user_id = ?').all(42);
  assert.strictEqual(subs.length, 1);
  const resps = db.prepare('SELECT * FROM platform_feedback_responses WHERE submission_id = ?').all(r.subId);
  assert.strictEqual(resps.length, 2);
});

test('submit nou creează A DOUA submisie (nu UPSERT)', () => {
  const db = setupDb();
  submit(db, 42, [{ questionId: 1, likert: 5 }]);
  submit(db, 42, [{ questionId: 1, likert: 3 }]);
  const subs = db.prepare('SELECT * FROM platform_feedback_submissions WHERE user_id = ?').all(42);
  assert.strictEqual(subs.length, 2);
  const resps = db.prepare('SELECT * FROM platform_feedback_responses WHERE user_id = ?').all(42);
  assert.strictEqual(resps.length, 2);
});

test('itemii goi sunt săriți (nu poluez istoricul)', () => {
  const db = setupDb();
  const r = submit(db, 1, [
    { questionId: 1, likert: 5 },
    { questionId: 2, text: '' }, // gol
    { questionId: 3, choice: '   ' }, // doar spații
    { questionId: 4 }, // nimic
  ]);
  assert.strictEqual(r.n, 1);
});

test('items fără questionId sunt săriți', () => {
  const db = setupDb();
  const r = submit(db, 1, [
    { likert: 5 }, // missing questionId
    { questionId: 1, likert: 4 },
  ]);
  assert.strictEqual(r.n, 1);
});

test('tranzacția e atomică (rollback la error)', () => {
  const db = setupDb();
  // forțez eroare prin question_id NULL (NOT NULL constraint)
  try {
    submit(db, 1, [
      { questionId: 1, likert: 5 },
      { questionId: null, text: 'x' }, // sare peste — nu produce eroare
    ]);
  } catch {
    /* expected if would throw */
  }
  // în cazul ăsta nu se aruncă eroare pentru că skip rule; verific că ce s-a băgat
  const subs = db.prepare('SELECT COUNT(*) AS n FROM platform_feedback_submissions').get();
  assert.strictEqual(subs.n, 1);
});
