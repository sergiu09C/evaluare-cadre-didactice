/**
 * Aplică migrațiile pe DB-ul curent fără a re-iniția schema.
 * Rulează idempotent la fiecare boot (ALTER TABLE + IF NOT EXISTS sunt
 * gestionate per-statement, ignoram „duplicate column" și „already exists").
 *
 * Folosit pe Railway: ensure-db.js copiază seed-ul prima dată; migrate-on-boot
 * aduce schema la zi după fiecare deploy.
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'evaluare.db');
const migrationsDir = path.join(__dirname, 'migrations');

// Migrațiile incrementale (de la 015 încolo) — restul sunt în init.js, se aplică doar la schemă fresh.
const INCREMENTAL_MIGRATIONS = [
  '015-platform-feedback-submissions.sql',
  '016-password-reset.sql',
  '017-anonymity-separation.sql',
  '018-19-items-questionnaire.sql',
  '019-reminders-log-cols.sql',
  '020-closing-loop-yswd.sql',
  '021-cleanup-old-questions.sql',
  '022-audit-log.sql',
  '023-refresh-2026-dates.sql',
  '024-shift-all-dates-may-2026.sql',
  '025-rebalance-completion-rates.sql',
  '026-doctorate-programs.sql',
];

function isBenign(errMsg) {
  return (
    /duplicate column/i.test(errMsg) ||
    /already exists/i.test(errMsg) ||
    /NOT NULL constraint failed/i.test(errMsg) // pentru backfill care nu mai are loc
  );
}

if (!fs.existsSync(dbPath)) {
  console.log(`[migrate-on-boot] DB inexistent la ${dbPath} — skip migrations (init.js va prelua)`);
  process.exit(0);
}

const db = new Database(dbPath);
db.exec('PRAGMA foreign_keys = OFF');

let appliedFiles = 0;
let appliedStmts = 0;
let skippedStmts = 0;

for (const file of INCREMENTAL_MIGRATIONS) {
  const fullPath = path.join(migrationsDir, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`[migrate-on-boot] ${file} lipsește — skip`);
    continue;
  }
  const sql = fs.readFileSync(fullPath, 'utf8');
  const cleaned = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  const stmts = cleaned.split(';').map((s) => s.trim()).filter(Boolean);
  let fileApplied = 0;
  let fileSkipped = 0;
  for (const stmt of stmts) {
    try {
      db.exec(stmt);
      fileApplied++;
      appliedStmts++;
    } catch (e) {
      if (isBenign(e.message)) {
        fileSkipped++;
        skippedStmts++;
      } else {
        console.error(`[migrate-on-boot] EROARE în ${file}:`, e.message.substring(0, 200));
        console.error('  Statement:', stmt.substring(0, 150));
      }
    }
  }
  if (fileApplied > 0 || fileSkipped > 0) {
    console.log(`[migrate-on-boot] ${file}: applied=${fileApplied} skipped=${fileSkipped}`);
  }
  appliedFiles++;
}

db.exec('PRAGMA foreign_keys = ON');
db.close();
console.log(`[migrate-on-boot] DONE — ${appliedFiles} fișiere · ${appliedStmts} aplicate · ${skippedStmts} benign-skipped`);
