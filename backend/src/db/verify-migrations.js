/**
 * Verifică idempotența migrațiilor: rulează toate fișierele SQL de migrație
 * peste DB-ul curent și confirmă că tabelele/coloanele așteptate există.
 *
 * Nu re-resetează DB-ul — doar verifică starea.
 *
 * Rulează: node src/db/verify-migrations.js
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'evaluare.db');
const migrationsDir = path.join(__dirname, 'migrations');

const REQUIRED = [
  { table: 'users', columns: ['id', 'email', 'role', 'professor_id', 'program_id', 'year', 'is_active'] },
  { table: 'professors', columns: ['id', 'first_name', 'last_name', 'faculty_id', 'department'] },
  { table: 'courses', columns: ['id', 'name', 'study_year_id', 'professor_id', 'course_type', 'semester'] },
  { table: 'evaluations', columns: ['id', 'student_id', 'course_id', 'professor_id', 'status'] },
  { table: 'responses', columns: ['id', 'evaluation_id', 'question_id', 'response_likert'] },
  { table: 'platform_feedback_questions', columns: ['id', 'text', 'type', 'category'] },
  { table: 'platform_feedback_submissions', columns: ['id', 'user_id', 'submitted_at'] },
  { table: 'platform_feedback_responses', columns: ['id', 'submission_id', 'user_id', 'question_id'] },
  { table: 'platform_feedback_messages', columns: ['id', 'user_id', 'message', 'status'] },
  { table: 'achievement_definitions', columns: ['id', 'key', 'title', 'icon', 'tone', 'threshold'] },
  { table: 'action_templates', columns: ['id', 'title', 'description', 'category', 'is_active'] },
  { table: 'professor_actions', columns: ['id', 'professor_id', 'template_id', 'title', 'status'] },
  { table: 'password_reset_tokens', columns: ['id', 'user_id', 'token', 'expires_at', 'used_at'] },
];

function getTableColumns(db, table) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.map((r) => r.name);
}

function main() {
  if (!fs.existsSync(dbPath)) {
    console.error('✗ DB inexistent la', dbPath);
    process.exit(2);
  }
  const db = new Database(dbPath);
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  console.log(`📁 ${files.length} fișiere SQL de migrație în repo.`);

  let ok = true;
  for (const { table, columns } of REQUIRED) {
    const exists = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(table);
    if (!exists) {
      console.error(`✗ Tabel lipsă: ${table}`);
      ok = false;
      continue;
    }
    const present = getTableColumns(db, table);
    const missing = columns.filter((c) => !present.includes(c));
    if (missing.length > 0) {
      console.error(`✗ ${table}: coloane lipsă: ${missing.join(', ')}`);
      ok = false;
    } else {
      console.log(`✓ ${table} (${present.length} coloane)`);
    }
  }

  // Sanity counts
  const tx = (q) => {
    try { return db.prepare(q).get().n; } catch { return -1; }
  };
  console.log('\n📊 Sanity counts:');
  console.log('  users:', tx('SELECT COUNT(*) AS n FROM users'));
  console.log('  professors:', tx('SELECT COUNT(*) AS n FROM professors'));
  console.log('  courses:', tx('SELECT COUNT(*) AS n FROM courses'));
  console.log('  evaluations submitted:', tx("SELECT COUNT(*) AS n FROM evaluations WHERE status='submitted'"));
  console.log('  pf submissions:', tx('SELECT COUNT(*) AS n FROM platform_feedback_submissions'));
  console.log('  password reset tokens active:',
    tx("SELECT COUNT(*) AS n FROM password_reset_tokens WHERE used_at IS NULL AND expires_at > CURRENT_TIMESTAMP"));

  db.close();
  if (!ok) {
    console.error('\n✗ Schema invalidă — rulează `npm run init-db` ca să aplici migrațiile.');
    process.exit(1);
  }
  console.log('\n✓ Schema OK. Toate tabelele și coloanele așteptate sunt prezente.');
}

main();
