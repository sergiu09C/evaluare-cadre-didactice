const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'evaluare.db');
const targetPath = process.env.DB_PATH || seedPath;

if (targetPath === seedPath) {
  console.log(`[ensure-db] Using in-repo DB at ${targetPath}`);
  process.exit(0);
}

if (fs.existsSync(targetPath)) {
  console.log(`[ensure-db] DB already exists at ${targetPath} — skipping seed copy`);
  process.exit(0);
}

if (!fs.existsSync(seedPath)) {
  console.error(`[ensure-db] Seed DB not found at ${seedPath} and target ${targetPath} is empty.`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(seedPath, targetPath);
console.log(`[ensure-db] Seeded DB copied to ${targetPath}`);
