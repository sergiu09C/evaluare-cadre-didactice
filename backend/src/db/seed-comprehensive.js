/**
 * Seed COMPREHENSIVE — re-generează datele tranzacționale:
 *  - evaluări (cu rate completare 55-85% per disciplină, NICIODATĂ 100%)
 *  - răspunsuri Likert + text (cu distribuții realiste per tier profesor)
 *  - acțiuni CEAC (mix de statuse, focus pe profesorii at-risk)
 *  - mesaje feedback platformă (4 statuse, unele cu răspuns admin)
 *  - răspunsuri chestionar feedback platformă
 *  - closing-loop entries
 *
 * Acoperă: toate facultățile × programele × nivelurile × departamentele × anii × semestrele × tipurile de curs.
 * Toate dimensiunile au date pentru a evita „cifre 0" în UI.
 *
 * Rulare: node backend/src/db/seed-comprehensive.js
 */
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'evaluare.db');
const db = new Database(DB_PATH);

// ====== UTILS RNG REPRODUCIBIL ======
let _seed = 42;
function srandom() {
  // xorshift32
  _seed ^= _seed << 13;
  _seed ^= _seed >>> 17;
  _seed ^= _seed << 5;
  return ((_seed >>> 0) % 1000000) / 1000000;
}
function rint(min, max) {
  return Math.floor(srandom() * (max - min + 1)) + min;
}
function rfloat(min, max) {
  return srandom() * (max - min) + min;
}
function rchoice(arr) {
  return arr[Math.floor(srandom() * arr.length)];
}
function rweighted(weights) {
  // weights: array of {value, weight}. Returns one .value.
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let t = srandom() * total;
  for (const w of weights) {
    t -= w.weight;
    if (t <= 0) return w.value;
  }
  return weights[weights.length - 1].value;
}

// ====== STEP 1: CURĂȚARE TRANZACȚIONAL ======
console.log('🧹 Curăț datele tranzacționale...');
db.exec('BEGIN');
try {
  db.prepare('DELETE FROM responses').run();
  db.prepare('DELETE FROM evaluations').run();
  db.prepare('DELETE FROM professor_actions').run();
  db.prepare('DELETE FROM platform_feedback_responses').run();
  db.prepare('DELETE FROM platform_feedback_messages').run();
  // closing_loop_entries — păstrez existente; nu re-generez
  db.exec('COMMIT');
  console.log('  ✓ Datele vechi șterse');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

// ====== STEP 2: TIER-IZARE PROFESORI ======
// 5% at-risk, 15% under, 50% average, 25% good, 5% excellent
const profs = db.prepare(`SELECT id, faculty_id FROM professors`).all();
console.log(`📊 Tier-izez ${profs.length} profesori...`);
const tiers = {
  at_risk: [], // avg target 1.8-2.4
  under: [], // avg target 2.5-3.0
  average: [], // avg target 3.1-3.8
  good: [], // avg target 3.9-4.4
  excellent: [], // avg target 4.5-4.8
};
for (const p of profs) {
  const r = srandom();
  if (r < 0.05) tiers.at_risk.push(p);
  else if (r < 0.2) tiers.under.push(p);
  else if (r < 0.7) tiers.average.push(p);
  else if (r < 0.95) tiers.good.push(p);
  else tiers.excellent.push(p);
}
const tierByProfId = new Map();
for (const [tier, list] of Object.entries(tiers)) {
  for (const p of list) tierByProfId.set(p.id, tier);
}
console.log(`  at-risk: ${tiers.at_risk.length}, under: ${tiers.under.length}, average: ${tiers.average.length}, good: ${tiers.good.length}, excellent: ${tiers.excellent.length}`);

// Per-tier: distribuție Likert (probabilități pentru scoruri 1,2,3,4,5)
const LIKERT_DIST = {
  at_risk: [0.35, 0.35, 0.2, 0.07, 0.03], // mediu ~ 2.0
  under: [0.15, 0.3, 0.3, 0.18, 0.07], // mediu ~ 2.7
  average: [0.05, 0.1, 0.3, 0.4, 0.15], // mediu ~ 3.5
  good: [0.02, 0.05, 0.15, 0.45, 0.33], // mediu ~ 4.0
  excellent: [0, 0.02, 0.08, 0.35, 0.55], // mediu ~ 4.4
};
function sampleLikert(tier) {
  const dist = LIKERT_DIST[tier];
  const r = srandom();
  let cum = 0;
  for (let i = 0; i < 5; i++) {
    cum += dist[i];
    if (r <= cum) return i + 1;
  }
  return 5;
}

// ====== STEP 3: TEXT POOL pentru răspunsuri text ======
const TEXTS_POSITIVE = [
  'Cursul este foarte bine organizat și informația este clară.',
  'Profesorul explică foarte bine și se vede pasiunea pentru materie.',
  'Materialele suplimentare sunt utile și actualizate.',
  'Atmosfera la curs este plăcută, încurajează discuțiile.',
  'Apreciez disponibilitatea profesorului pentru întrebări.',
  'Conținutul cursului mă pregătește bine pentru piața muncii.',
];
const TEXTS_IMPROVE = [
  'Aș dori mai multe exemple practice și exerciții aplicate.',
  'Materialele de curs ar putea fi disponibile mai devreme.',
  'Examenul este prea greu față de ce s-a predat efectiv.',
  'Lipsesc consultațiile săptămânale — ar fi utile.',
  'Aș vrea proiecte de grup în loc de doar lucrare individuală.',
  'Capitole importante au fost predate prea repede la final.',
];
const TEXTS_NEUTRAL = [
  'Nimic deosebit de menționat.',
  'Cursul este standard, fără probleme majore.',
  'Mediu — nici prea bun, nici prea slab.',
];
const TEXTS_NEGATIVE = [
  'Profesorul lipsește des și înlocuitorii nu cunosc materia.',
  'Cursul este dezorganizat, slide-urile contradictorii cu manualul.',
  'Tonul profesorului este uneori nepoliticos cu studenții.',
  'Notele sunt date arbitrar, fără criterii clare.',
];

function pickText(tier, category) {
  // text question types: puncte_forte, imbunatatiri, altele
  // probabilitate de a completa cu text variază
  const fillProb = { at_risk: 0.7, under: 0.55, average: 0.4, good: 0.5, excellent: 0.6 }[tier];
  if (srandom() > fillProb) return null;
  if (category === 'puncte_forte') {
    if (tier === 'at_risk' || tier === 'under') {
      if (srandom() < 0.5) return null;
      return rchoice(TEXTS_NEUTRAL);
    }
    return rchoice(TEXTS_POSITIVE);
  }
  if (category === 'imbunatatiri') {
    if (tier === 'at_risk') return rchoice(TEXTS_NEGATIVE);
    if (tier === 'under') return rchoice([...TEXTS_IMPROVE, ...TEXTS_NEGATIVE]);
    return rchoice(TEXTS_IMPROVE);
  }
  // altele
  if (srandom() < 0.7) return null;
  return rchoice(TEXTS_NEUTRAL);
}

// ====== STEP 4: GENEREZ EVALUĂRI ======
console.log('📝 Generez evaluări...');
const courses = db
  .prepare(
    `SELECT c.id AS course_id, c.professor_id, c.study_year_id, c.semester, c.course_type, c.academic_year
     FROM courses c
     ORDER BY c.id`,
  )
  .all();
const questions = db.prepare(`SELECT id, category, type FROM questions WHERE is_active=1 ORDER BY id`).all();
const questionLikert = questions.filter((q) => q.type === 'likert');
const questionText = questions.filter((q) => q.type === 'text');

// Pre-fetch studenții per study_year
const studentsBySy = new Map();
const allStudents = db
  .prepare(
    `SELECT u.id AS student_id, sy.id AS sy_id
     FROM users u
     JOIN groups g ON g.id = u.group_id
     JOIN series s ON s.id = g.series_id
     JOIN study_years sy ON sy.id = s.study_year_id
     WHERE u.role = 'student' AND u.is_active = 1`,
  )
  .all();
for (const s of allStudents) {
  if (!studentsBySy.has(s.sy_id)) studentsBySy.set(s.sy_id, []);
  studentsBySy.get(s.sy_id).push(s.student_id);
}

const insertEval = db.prepare(
  `INSERT INTO evaluations (student_id, course_id, professor_id, status, submitted_at, deadline)
   VALUES (?, ?, ?, 'submitted', ?, ?)`,
);
const insertResp = db.prepare(
  `INSERT INTO responses (evaluation_id, question_id, response_likert, response_text)
   VALUES (?, ?, ?, ?)`,
);

// Distribuție timpi: împrăștie submitted_at uniform în mai 2026 (sesiunea curentă).
// Nimic „din trecut" — toate evaluările sunt din ciclul activ.
function randomSubmittedAt() {
  const start = new Date('2026-05-01T08:00:00Z').getTime();
  const end = new Date('2026-05-23T18:00:00Z').getTime();
  return new Date(start + srandom() * (end - start)).toISOString().replace('T', ' ').slice(0, 19);
}

db.exec('BEGIN');
let totalEvals = 0;
let totalResps = 0;
try {
  for (const c of courses) {
    const eligible = studentsBySy.get(c.study_year_id) || [];
    if (eligible.length === 0) continue;

    // Rate completare: 55-85%, GARANTAT sub 86%
    const completionRate = rfloat(0.55, 0.85);
    const picked = Math.floor(eligible.length * completionRate);
    if (picked === 0) continue;

    // Shuffle + take first `picked`
    const shuffled = [...eligible].sort(() => srandom() - 0.5);
    const submitters = shuffled.slice(0, picked);

    const tier = tierByProfId.get(c.professor_id) || 'average';

    for (const studentId of submitters) {
      let evalId;
      try {
        const result = insertEval.run(
          studentId,
          c.course_id,
          c.professor_id,
          randomSubmittedAt(),
          '2026-05-31',
        );
        evalId = result.lastInsertRowid;
        totalEvals++;
      } catch (e) {
        // UNIQUE collision — skip
        continue;
      }
      // Răspunsuri Likert (10)
      for (const q of questionLikert) {
        const score = sampleLikert(tier);
        insertResp.run(evalId, q.id, score, null);
        totalResps++;
      }
      // Răspunsuri text (3) — partial fill
      for (const q of questionText) {
        const txt = pickText(tier, q.category);
        if (txt !== null) {
          insertResp.run(evalId, q.id, null, txt);
          totalResps++;
        }
      }
    }
  }
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}
console.log(`  ✓ ${totalEvals} evaluări, ${totalResps} răspunsuri`);

// ====== STEP 5: ACȚIUNI CEAC ======
console.log('🎯 Generez acțiuni CEAC...');
const admin = db.prepare(`SELECT id FROM users WHERE role='admin' LIMIT 1`).get();
const adminId = admin?.id || 1;
const actionTemplates = db.prepare(`SELECT id, title, description, category FROM action_templates WHERE is_active=1`).all();

const ACTION_NOTES_BY_STATUS = {
  proposed: [
    'CEAC a identificat zone de îmbunătățire pe baza scorurilor din ultimul semestru.',
    'Recomandare bazată pe pattern-uri din feedback-ul text al studenților.',
    'Acțiune sugerată ca parte din planul anual de calitate.',
  ],
  accepted: [
    'Voi participa la workshop în luna următoare. Aștept detalii organizatorice.',
    'Am încredere în această recomandare — sunt deschis să încerc.',
    'Sunt de acord, mai ales după discuțiile de la ultimul curs.',
  ],
  completed: [
    'Workshop finalizat cu succes. Aplic deja câteva tehnici noi la curs.',
    'Plan de îmbunătățire implementat. Feedback-ul studenților e deja mai pozitiv.',
    'Mentorat încheiat — mulțumesc colegului care m-a sprijinit.',
  ],
  rejected: [
    'Refuz — consider că observațiile nu reflectă corect activitatea mea.',
    'Nu pot să accept acest plan în actualele condiții de încărcare didactică.',
  ],
};

const insertAction = db.prepare(
  `INSERT INTO professor_actions (
     professor_id, template_id, title, description, category, status, notes,
     proposed_at, accepted_at, completed_at, proposed_by_user_id
   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

db.exec('BEGIN');
let totalActions = 0;
try {
  // Pentru profesorii at-risk: 2-3 acțiuni each
  for (const p of tiers.at_risk) {
    const n = rint(2, 3);
    for (let i = 0; i < n; i++) {
      const tpl = rchoice(actionTemplates);
      const status = rweighted([
        { value: 'proposed', weight: 4 },
        { value: 'accepted', weight: 3 },
        { value: 'completed', weight: 2 },
        { value: 'rejected', weight: 1 },
      ]);
      const proposedAt = randomSubmittedAt();
      const acceptedAt = ['accepted', 'completed'].includes(status) ? randomSubmittedAt() : null;
      const completedAt = status === 'completed' ? randomSubmittedAt() : null;
      insertAction.run(
        p.id,
        tpl.id,
        tpl.title,
        tpl.description,
        tpl.category,
        status,
        rchoice(ACTION_NOTES_BY_STATUS[status]),
        proposedAt,
        acceptedAt,
        completedAt,
        adminId,
      );
      totalActions++;
    }
  }
  // Pentru under: 1-2 acțiuni
  for (const p of tiers.under) {
    const n = rint(1, 2);
    for (let i = 0; i < n; i++) {
      const tpl = rchoice(actionTemplates);
      const status = rweighted([
        { value: 'proposed', weight: 5 },
        { value: 'accepted', weight: 3 },
        { value: 'completed', weight: 2 },
      ]);
      const proposedAt = randomSubmittedAt();
      const acceptedAt = ['accepted', 'completed'].includes(status) ? randomSubmittedAt() : null;
      const completedAt = status === 'completed' ? randomSubmittedAt() : null;
      insertAction.run(
        p.id,
        tpl.id,
        tpl.title,
        tpl.description,
        tpl.category,
        status,
        rchoice(ACTION_NOTES_BY_STATUS[status]),
        proposedAt,
        acceptedAt,
        completedAt,
        adminId,
      );
      totalActions++;
    }
  }
  // Pentru ~10% din average: 1 acțiune (preventiv)
  for (const p of tiers.average) {
    if (srandom() > 0.1) continue;
    const tpl = rchoice(actionTemplates);
    insertAction.run(
      p.id,
      tpl.id,
      tpl.title,
      tpl.description,
      tpl.category,
      'proposed',
      'Recomandare preventivă — pentru menținerea standardelor.',
      randomSubmittedAt(),
      null,
      null,
      adminId,
    );
    totalActions++;
  }
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}
console.log(`  ✓ ${totalActions} acțiuni CEAC`);

// ====== STEP 6: MESAJE FEEDBACK PLATFORMĂ ======
console.log('💬 Generez mesaje feedback platformă...');
const MSG_SUBJECTS = [
  'Sugestie funcționalitate filtru',
  'Probleme cu exportul CSV',
  'Recomandare design header',
  'Bug pe paginile mobile',
  'Idee pentru notificări push',
  'Feedback general',
  'Propunere îmbunătățire chestionar',
  null,
];
const MSG_BODIES = [
  'Ar fi util dacă filtrele s-ar combina cu chips active vizibile.',
  'Atunci când export ca CSV, diacriticele apar corupte în Excel.',
  'Header-ul ocupă mult spațiu pe ecrane mici. Ar putea fi mai compact?',
  'Pe iPhone, butonul „Începe evaluarea" nu mai e vizibil la scroll.',
  'Ar fi util să primesc notificare când CEAC mi-a propus o acțiune nouă.',
  'În general sunt mulțumit de platformă. Felicitări echipei!',
  'Ar fi util ca chestionarul de feedback să permită edit după submit, măcar 24h.',
  'Pot să propun să adăugați un buton de skip pentru întrebările pe care nu vreau să le răspund?',
  'Pe pagina cu istoricul, mi-ar plăcea să văd grafic evoluția scorurilor mele.',
];
const ADMIN_RESPONSES = [
  'Mulțumim pentru sugestie! Am notat și o vom evalua în următorul sprint.',
  'Bug-ul cu diacriticele a fost reparat în versiunea de săptămâna trecută. Re-încearcă și anunță-ne dacă mai apare.',
  'Sugestie validă — o vom prioritiza pentru următoarea iterație.',
  'Mulțumim pentru raportare. Echipa tehnică verifică problema.',
];

const allUsers = db
  .prepare(`SELECT id, role FROM users WHERE is_active=1 ORDER BY RANDOM() LIMIT 60`)
  .all();
const insertMsg = db.prepare(
  `INSERT INTO platform_feedback_messages
   (user_id, user_role, subject, message, status, admin_response, admin_response_at, admin_user_id, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

db.exec('BEGIN');
let totalMsgs = 0;
try {
  for (let i = 0; i < 22; i++) {
    const u = allUsers[i % allUsers.length];
    const subject = rchoice(MSG_SUBJECTS);
    const message = rchoice(MSG_BODIES);
    const status = rweighted([
      { value: 'open', weight: 4 },
      { value: 'in_progress', weight: 3 },
      { value: 'answered', weight: 5 },
      { value: 'closed', weight: 2 },
    ]);
    const hasResp = ['answered', 'closed'].includes(status) || (status === 'in_progress' && srandom() < 0.3);
    const adminResp = hasResp ? rchoice(ADMIN_RESPONSES) : null;
    const adminRespAt = hasResp ? randomSubmittedAt() : null;
    insertMsg.run(
      u.id,
      u.role,
      subject,
      message,
      status,
      adminResp,
      adminRespAt,
      hasResp ? adminId : null,
      randomSubmittedAt(),
    );
    totalMsgs++;
  }
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}
console.log(`  ✓ ${totalMsgs} mesaje feedback platformă`);

// ====== STEP 7: RĂSPUNSURI CHESTIONAR FEEDBACK PLATFORMĂ ======
console.log('📋 Generez răspunsuri chestionar feedback...');
const pfQuestions = db
  .prepare(`SELECT id, type, options_json FROM platform_feedback_questions WHERE is_active=1`)
  .all();
const pfRespondents = db
  .prepare(`SELECT id, role FROM users WHERE is_active=1 AND role IN ('student','professor') ORDER BY RANDOM() LIMIT 350`)
  .all();
const insertPfResp = db.prepare(
  `INSERT OR IGNORE INTO platform_feedback_responses (user_id, question_id, response_likert, response_text, response_choice)
   VALUES (?, ?, ?, ?, ?)`,
);

const PF_TEXTS = [
  'Platforma este intuitivă și ușor de folosit.',
  'Apreciez că nu trebuie să dau parolă de fiecare dată — sesiunea e persistentă.',
  'Designul e curat, fără reclame sau distrageri.',
  'Aș vrea mai multe tutoriale pentru începători.',
  'Tab-urile noi de pe pagina Acasă sunt foarte utile.',
];

db.exec('BEGIN');
let totalPfResps = 0;
try {
  for (const u of pfRespondents) {
    // 70% din useri completează chestionarul
    if (srandom() > 0.7) continue;
    for (const q of pfQuestions) {
      let likert = null, text = null, choice = null;
      if (q.type === 'likert') {
        likert = rweighted([
          { value: 3, weight: 2 },
          { value: 4, weight: 5 },
          { value: 5, weight: 3 },
          { value: 2, weight: 1 },
        ]);
      } else if (q.type === 'text' && srandom() < 0.4) {
        text = rchoice(PF_TEXTS);
      } else if (q.type === 'choice' && q.options_json) {
        try {
          const opts = JSON.parse(q.options_json);
          if (opts.length) choice = rchoice(opts);
        } catch {
          /* skip */
        }
      }
      if (likert !== null || text !== null || choice !== null) {
        insertPfResp.run(u.id, q.id, likert, text, choice);
        totalPfResps++;
      }
    }
  }
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}
console.log(`  ✓ ${totalPfResps} răspunsuri chestionar`);

// ====== STEP 8: VERIFICARE ======
console.log('\n📊 Verificare distribuție finală:');
const totals = db
  .prepare(
    `SELECT
      (SELECT COUNT(*) FROM evaluations WHERE status='submitted') AS evals,
      (SELECT COUNT(*) FROM responses) AS resps,
      (SELECT COUNT(*) FROM professor_actions) AS actions,
      (SELECT COUNT(*) FROM platform_feedback_messages) AS msgs,
      (SELECT COUNT(*) FROM platform_feedback_responses) AS pf_resps`,
  )
  .get();
console.log(`  Evaluări: ${totals.evals}, Răspunsuri: ${totals.resps}, Acțiuni: ${totals.actions}, Mesaje: ${totals.msgs}, ChestionarResp: ${totals.pf_resps}`);

// Rate completare per curs
const completionStats = db
  .prepare(
    `WITH per_course AS (
      SELECT c.id,
             (SELECT COUNT(*) FROM evaluations WHERE course_id=c.id AND status='submitted') AS subm,
             (SELECT COUNT(*) FROM users u
              JOIN groups g ON g.id=u.group_id
              JOIN series s ON s.id=g.series_id
              WHERE u.role='student' AND s.study_year_id=c.study_year_id) AS eligible
      FROM courses c
    )
    SELECT
      ROUND(MIN(subm * 1.0 / eligible) * 100, 1) AS min_pct,
      ROUND(AVG(subm * 1.0 / eligible) * 100, 1) AS avg_pct,
      ROUND(MAX(subm * 1.0 / eligible) * 100, 1) AS max_pct,
      COUNT(*) FILTER (WHERE eligible > 0) AS courses_with_students
    FROM per_course WHERE eligible > 0`,
  )
  .get();
console.log(`  Completare per curs: min ${completionStats.min_pct}%, avg ${completionStats.avg_pct}%, max ${completionStats.max_pct}%`);

// Distribuție tier-uri profesori reală
const profAvgs = db
  .prepare(
    `SELECT p.id, AVG(r.response_likert) AS avg
     FROM professors p
     JOIN evaluations e ON e.professor_id = p.id
     JOIN responses r ON r.evaluation_id = e.id
     WHERE e.status='submitted' AND r.response_likert IS NOT NULL
     GROUP BY p.id`,
  )
  .all();
const distribute = { atrisk: 0, under: 0, average: 0, good: 0, excellent: 0 };
for (const p of profAvgs) {
  if (p.avg < 2.5) distribute.atrisk++;
  else if (p.avg < 3.0) distribute.under++;
  else if (p.avg < 3.8) distribute.average++;
  else if (p.avg < 4.4) distribute.good++;
  else distribute.excellent++;
}
console.log(`  Tier-uri reale (din ${profAvgs.length} profesori cu evaluări):`);
console.log(`    at-risk (<2.5):  ${distribute.atrisk}`);
console.log(`    under (2.5-3.0): ${distribute.under}`);
console.log(`    average (3.0-3.8): ${distribute.average}`);
console.log(`    good (3.8-4.4): ${distribute.good}`);
console.log(`    excellent (≥4.4): ${distribute.excellent}`);

// Status acțiuni
const actStatus = db.prepare(`SELECT status, COUNT(*) AS n FROM professor_actions GROUP BY status`).all();
console.log(`  Acțiuni per status:`, Object.fromEntries(actStatus.map((r) => [r.status, r.n])));

// Status mesaje
const msgStatus = db.prepare(`SELECT status, COUNT(*) AS n FROM platform_feedback_messages GROUP BY status`).all();
console.log(`  Mesaje per status:`, Object.fromEntries(msgStatus.map((r) => [r.status, r.n])));

console.log('\n✅ Seed comprehensive complet.');
db.close();
