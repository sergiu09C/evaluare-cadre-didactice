/**
 * Backfill: creează user accounts pentru toți profesorii care nu au unul.
 * Idempotent — re-rularea nu duplică conturile.
 */
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/database');

function run() {
  const db = getDatabase();
  const missing = db
    .prepare(
      `SELECT p.id, p.first_name, p.last_name, p.email
       FROM professors p
       LEFT JOIN users u ON u.professor_id = p.id
       WHERE u.id IS NULL
       ORDER BY p.id`,
    )
    .all();

  if (!missing.length) {
    console.log('✅ Toți profesorii au deja cont — nimic de făcut.');
    return;
  }

  const passwordHash = bcrypt.hashSync('password123', 10);
  const insert = db.prepare(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, professor_id, is_active)
     VALUES (?, ?, ?, ?, 'professor', ?, 1)`,
  );

  let created = 0;
  for (const p of missing) {
    const slug = `${p.first_name}.${p.last_name}.${p.id}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9.]/g, '');
    const email = `${slug}@prof.univ.ro`;
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) {
      console.log(`  ⚠️  Email ${email} ocupat — skip professor ${p.id}`);
      continue;
    }
    insert.run(email, passwordHash, p.first_name, p.last_name, p.id);
    created++;
  }
  console.log(`✅ ${created} conturi profesor create (${missing.length} fără cont identificate).`);

  const totals = db.prepare(`SELECT role, COUNT(*) AS n FROM users GROUP BY role`).all();
  console.log('Distribuție finală:', totals.map((r) => `${r.role}=${r.n}`).join(', '));
}

if (require.main === module) {
  run();
}

module.exports = { run };
