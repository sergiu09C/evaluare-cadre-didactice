const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'evaluare.db');
const targetPath = process.env.DB_PATH || seedPath;

if (targetPath === seedPath) {
  console.log(`[ensure-db] Using in-repo DB at ${targetPath}`);
  process.exit(0);
}

if (fs.existsSync(targetPath)) {
  const stats = fs.statSync(targetPath);
  const sizeMB = stats.size / 1024 / 1024;
  // Dacă DB-ul e mai mare de 500MB, e umflat de date sintetice (bug migration 015/028).
  // Seed-ul curat este ~7MB; date reale nu vor depăși 100MB pentru această aplicație.
  if (sizeMB > 500) {
    console.log(`[ensure-db] DB bloat detectat: ${sizeMB.toFixed(0)}MB > 500MB — înlocuiesc cu seed curat`);
    // Șterg WAL + SHM vechi înainte de copiere (altfel SQLite replay-uiesc date corupte)
    for (const suffix of ['-wal', '-shm', '-journal']) {
      const f = targetPath + suffix;
      if (fs.existsSync(f)) { fs.unlinkSync(f); console.log(`[ensure-db] Șters ${f}`); }
    }
    fs.copyFileSync(seedPath, targetPath);
    console.log(`[ensure-db] Seed copiat la ${targetPath} (${sizeMB.toFixed(0)}MB → ${(fs.statSync(seedPath).size/1024/1024).toFixed(1)}MB)`);
  } else {
    console.log(`[ensure-db] DB ok la ${sizeMB.toFixed(1)}MB — skip seed copy`);
  }
  process.exit(0);
}

if (!fs.existsSync(seedPath)) {
  console.error(`[ensure-db] Seed DB not found at ${seedPath} and target ${targetPath} is empty.`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(seedPath, targetPath);
console.log(`[ensure-db] Seeded DB copied to ${targetPath}`);
