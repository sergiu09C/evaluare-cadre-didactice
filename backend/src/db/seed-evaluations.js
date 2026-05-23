/**
 * Seed evaluations with realistic fictional data.
 *
 * Strategy:
 *  1. Clone 2023-2024 courses to a previous academic year (2022-2023) so that
 *     /api/professor/trend has multiple data points.
 *  2. Assign each professor a "true quality" in [2.5, 4.8] — hidden parameter
 *     that drives the average response on their evaluations.
 *  3. For each student, iterate over courses in their study year + academic
 *     years that overlap with current/previous period. Roll a participation
 *     coin (≈ 58% current, ≈ 45% previous) to decide if they submitted.
 *  4. For each submitted evaluation, generate 10 Likert responses around the
 *     professor's quality (with Gaussian-ish noise) and 0–2 text comments
 *     picked from realistic pools.
 *
 * Keeps existing proportions (faculties, programs, years, students, professors,
 * courses per year) intact — only adds new evaluations + clone courses
 * for the historical academic year.
 *
 * Usage: `node src/db/seed-evaluations.js`
 *        (or `npm run seed:evaluations` after wiring to package.json)
 */

require('dotenv').config();
const { getDatabase } = require('../config/database');

// ── PRNG (Mulberry32) for reproducibility ─────────────────────────────────
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260521);

function gaussNoise() {
  // Box–Muller, lightweight: returns ~N(0, 1)
  const u = 1 - rand();
  const v = 1 - rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function pickOne(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function randomDateBetween(startIso, endIso) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return new Date(start + rand() * (end - start)).toISOString().replace('T', ' ').slice(0, 19);
}

// ── Text comment pools (categorised by sentiment) ─────────────────────────
const POSITIVE_COMMENTS = {
  puncte_forte: [
    'Cursul a fost bine structurat și ușor de urmărit. Exemplele practice mi-au fost extrem de utile.',
    'Apreciez disponibilitatea cadrului didactic și răspunsurile prompte la întrebări.',
    'Materialele sunt foarte clare și ușor de consultat după curs.',
    'Atmosfera la curs încurajează participarea — m-am simțit confortabil să pun întrebări.',
    'Cadrul didactic explică foarte clar conceptele dificile.',
    'Subiectele tratate sunt actuale și relevante pentru piața muncii.',
    'Pasiunea cadrului didactic pentru materie se transmite și nouă.',
    'Laboratoarele complementau perfect partea teoretică.',
    'Feedback-ul după teste a fost detaliat și util pentru pregătirea finalei.',
  ],
  imbunatatiri: [
    'Sugerez mai multe exemple practice aplicate.',
    'Ar fi util să existe un slack/teams unde să adresăm întrebări între cursuri.',
    'Mai multe exerciții rezolvate înainte de examen.',
    'Mi-ar fi plăcut studii de caz reale din industrie.',
    'O recapitulare scurtă la începutul fiecărui curs ar ajuta continuitatea.',
    'Bibliografia ar putea include și surse online actuale.',
    'Materiale video pentru recapitulare ar fi binevenite.',
  ],
  altele: [
    'Mulțumesc pentru semestru, a fost o experiență formativă.',
    'Aștept cu interes continuarea în semestrul următor.',
    'Recomand cu căldură acest curs colegilor mei mai mici.',
  ],
};
const NEUTRAL_COMMENTS = {
  puncte_forte: [
    'Cursul își atinge obiectivele declarate.',
    'Volumul de informație este adecvat semestrului.',
    'Cadrul didactic a fost punctual și organizat.',
  ],
  imbunatatiri: [
    'Mai multă interactivitate la curs ar fi binevenită.',
    'Există loc pentru mai multă diversitate în metodele de predare.',
    'Mai multe consultații înainte de examen.',
    'Calendarul evaluărilor ar putea fi anunțat mai din timp.',
  ],
  altele: [
    'În rest, totul a decurs conform planului.',
    'Nu am alte observații semnificative.',
  ],
};
const CRITICAL_COMMENTS = {
  puncte_forte: [
    'Apreciez că materialele sunt accesibile online.',
    'Notarea a fost transparentă, am știut clar criteriile.',
  ],
  imbunatatiri: [
    'Ritmul cursului este prea rapid — am avut dificultăți să țin pasul.',
    'Materialele sunt depășite și ar trebui actualizate.',
    'Comunicarea în afara cursului este lentă și inconsistentă.',
    'Lipsesc exemple practice care să arate aplicabilitatea conceptelor.',
    'Recomand un format diferit de evaluare — testele actuale nu reflectă cunoștințele.',
    'Atmosfera de la curs e tensionată, nu încurajează întrebările.',
  ],
  altele: [
    'Aș aprecia o sesiune de feedback la mijlocul semestrului.',
    'Sper că observațiile mele vor fi luate în considerare.',
  ],
};

function pickComment(quality, category) {
  // quality in [2.5, 4.8]
  let pool;
  if (quality >= 4.2) pool = POSITIVE_COMMENTS;
  else if (quality >= 3.4) pool = rand() < 0.7 ? POSITIVE_COMMENTS : NEUTRAL_COMMENTS;
  else if (quality >= 2.8) pool = rand() < 0.6 ? NEUTRAL_COMMENTS : CRITICAL_COMMENTS;
  else pool = rand() < 0.7 ? CRITICAL_COMMENTS : NEUTRAL_COMMENTS;
  const subset = pool[category] || pool.altele || POSITIVE_COMMENTS.altele;
  return pickOne(subset);
}

// ── Main ──────────────────────────────────────────────────────────────────
function seed() {
  const db = getDatabase();
  console.log('🌱 Generating fictional evaluations...\n');

  // 0. Stats — current state
  const before = {
    evaluations: db.prepare('SELECT COUNT(*) AS n FROM evaluations').get().n,
    responses: db.prepare('SELECT COUNT(*) AS n FROM responses').get().n,
    courses: db.prepare('SELECT COUNT(*) AS n FROM courses').get().n,
  };
  console.log('📊 Before:', before);

  // NOTĂ: anterior cloneam cursurile pentru 2022-2023 pentru a avea trend
  // pe mai multe semestre. Asta produce însă inconsistențe (studenții actuali
  // ar avea evaluări pentru același curs cu același profesor în 2 ani — nereal).
  // Renunțăm la clonare. Trend-ul profesor folosește semestrul 1 + 2 din anul
  // curent, ceea ce e suficient pentru chart-uri.
  console.log('📚 Skipping course cloning (preserves realism)\n');

  // 2. Build "true quality" map per professor — stays stable across runs (seeded)
  const professors = db.prepare('SELECT id FROM professors').all();
  const profQuality = {};
  for (const p of professors) {
    // Beta-ish: cluster around 3.5–4.2, with tails. Range [2.4, 4.8].
    const base = 2.4 + rand() * 2.4;
    profQuality[p.id] = base;
  }
  console.log(`👩‍🏫 Assigned quality to ${Object.keys(profQuality).length} professors`);

  // 3. Get questions
  const questions = db.prepare('SELECT id, type, category FROM questions ORDER BY order_index').all();
  const likertQs = questions.filter((q) => q.type === 'likert');
  const textQs = questions.filter((q) => q.type === 'text');
  console.log(`❓ Found ${likertQs.length} Likert questions + ${textQs.length} text questions`);

  // 4. Students with their study_year_id
  const students = db
    .prepare(
      `SELECT u.id AS student_id, sy.id AS study_year_id
       FROM users u
       JOIN groups g ON g.id = u.group_id
       JOIN series s ON s.id = g.series_id
       JOIN study_years sy ON sy.id = s.study_year_id
       WHERE u.role = 'student'`,
    )
    .all();
  console.log(`👨‍🎓 Found ${students.length} students\n`);

  // 5. For each (student, course), maybe submit evaluation
  const insertEval = db.prepare(`
    INSERT OR IGNORE INTO evaluations (student_id, course_id, professor_id, status, started_at, submitted_at, deadline)
    VALUES (?, ?, ?, 'submitted', ?, ?, ?)
  `);
  const insertResp = db.prepare(`
    INSERT OR IGNORE INTO responses (evaluation_id, question_id, response_likert, response_text)
    VALUES (?, ?, ?, ?)
  `);
  const getCoursesForStudent = db.prepare(`
    SELECT id, professor_id, academic_year, semester
    FROM courses
    WHERE study_year_id = ?
  `);

  // Time windows: TOATE evaluările pică în mai 2026 (sesiunea curentă).
  // Anul 2025-2026 acoperă atât sem. I cât și sem. II din ciclul curent.
  const windows = {
    '2025-2026:1': { start: '2026-05-04', end: '2026-05-15', deadline: '2026-05-31' },
    '2025-2026:2': { start: '2026-05-08', end: '2026-05-22', deadline: '2026-05-31' },
    // Fallback pentru cursurile vechi rămase fără sincronizare (toate redirecționate spre mai 2026):
    '2022-2023:1': { start: '2026-05-04', end: '2026-05-15', deadline: '2026-05-31' },
    '2022-2023:2': { start: '2026-05-04', end: '2026-05-15', deadline: '2026-05-31' },
    '2023-2024:1': { start: '2026-05-04', end: '2026-05-22', deadline: '2026-05-31' },
    '2023-2024:2': { start: '2026-05-08', end: '2026-05-22', deadline: '2026-05-31' },
  };
  // Participation rate per academic year (uniform pentru ciclul curent)
  const participationRate = {
    '2025-2026': 0.61,
    '2022-2023': 0.42,
    '2023-2024': 0.55,
  };
  // Fără drift: toate datele sunt din același ciclu mai 2026.
  const yearDelta = {
    '2025-2026': 0,
    '2022-2023': 0,
    '2023-2024': 0,
  };

  let createdEvals = 0;
  let createdResponses = 0;
  let skipped = 0;

  // UNIQUE constraint = (student_id, course_id, professor_id) — granularitate
  // per disciplină. Fiecare combinație student × curs × profesor poate primi
  // o evaluare separată.
  const txAll = db.transaction(() => {
    for (const stud of students) {
      const courses = getCoursesForStudent.all(stud.study_year_id);

      for (const course of courses) {
        const rate = participationRate[course.academic_year] ?? 0.55;
        if (rand() > rate) continue;

        const w = windows[`${course.academic_year}:${course.semester}`];
        if (!w) continue;
        const submittedAt = randomDateBetween(w.start, w.end);
        const startedAt = randomDateBetween(w.start, submittedAt);

        const result = insertEval.run(
          stud.student_id,
          course.id,
          course.professor_id,
          startedAt,
          submittedAt,
          w.deadline,
        );
        if (result.changes === 0) {
          skipped++;
          continue;
        }
        const evalId = result.lastInsertRowid;

        const baseQuality = profQuality[course.professor_id];
        const adjustedQuality = baseQuality + yearDelta[course.academic_year];

        // Likert: every question
        for (const q of likertQs) {
          // Per-question variation around quality
          const noise = gaussNoise() * 0.55;
          let score = Math.round(adjustedQuality + noise);
          score = clamp(score, 1, 5);
          insertResp.run(evalId, q.id, score, null);
          createdResponses++;
        }

        // Text: 1–2 random comments per evaluation
        const numTextComments = rand() < 0.6 ? (rand() < 0.5 ? 1 : 2) : 0;
        const shuffledTextQs = [...textQs].sort(() => rand() - 0.5);
        for (let i = 0; i < numTextComments && i < shuffledTextQs.length; i++) {
          const q = shuffledTextQs[i];
          const txt = pickComment(adjustedQuality, q.category);
          insertResp.run(evalId, q.id, null, txt);
          createdResponses++;
        }

        createdEvals++;
      }
    }
  });

  console.log('⚡ Inserting (this may take a few seconds)...');
  const t0 = Date.now();
  txAll();
  const ms = Date.now() - t0;

  // 6. Stats — final
  const after = {
    evaluations: db.prepare('SELECT COUNT(*) AS n FROM evaluations').get().n,
    responses: db.prepare('SELECT COUNT(*) AS n FROM responses').get().n,
    courses: db.prepare('SELECT COUNT(*) AS n FROM courses').get().n,
  };
  console.log(`\n✅ Done in ${ms} ms`);
  console.log(`   ➕ ${createdEvals} new evaluations (skipped ${skipped} duplicates)`);
  console.log(`   ➕ ${createdResponses} new responses`);
  console.log('\n📊 After:', after);

  // 7. Sanity check
  const byYear = db
    .prepare(
      `SELECT c.academic_year, c.semester, COUNT(DISTINCT e.id) AS evals
       FROM evaluations e
       JOIN courses c ON c.id = e.course_id
       WHERE e.status = 'submitted'
       GROUP BY c.academic_year, c.semester
       ORDER BY c.academic_year, c.semester`,
    )
    .all();
  console.log('\n📈 Evaluations by year/semester:');
  byYear.forEach((r) => console.log(`   ${r.academic_year} sem ${r.semester}: ${r.evals}`));

  const profStats = db
    .prepare(
      `SELECT
         AVG(avg_score) AS overall_avg,
         MIN(avg_score) AS min_avg,
         MAX(avg_score) AS max_avg,
         COUNT(*) AS profs
       FROM (
         SELECT p.id, AVG(r.response_likert) AS avg_score
         FROM professors p
         JOIN evaluations e ON e.professor_id = p.id
         JOIN responses r ON r.evaluation_id = e.id
         WHERE e.status = 'submitted' AND r.response_likert IS NOT NULL
         GROUP BY p.id
       )`,
    )
    .get();
  console.log('\n👩‍🏫 Professor score distribution:');
  console.log(`   Avg of avgs: ${profStats.overall_avg?.toFixed(2)} | min: ${profStats.min_avg?.toFixed(2)} | max: ${profStats.max_avg?.toFixed(2)} | profs: ${profStats.profs}`);

  const textRespCount = db.prepare("SELECT COUNT(*) AS n FROM responses WHERE response_text IS NOT NULL AND response_text != ''").get().n;
  console.log(`\n💬 Text comments: ${textRespCount}`);
}

if (require.main === module) {
  try {
    seed();
    process.exit(0);
  } catch (e) {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  }
}

module.exports = { seed };
