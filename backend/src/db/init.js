require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getDatabase } = require('../config/database');

function initializeDatabase() {
  console.log('🔧 Initializing database...');

  const db = getDatabase();

  // Read and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Remove all SQL comments (both -- and /* */ style)
  const cleanedSchema = schema
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))  // Remove -- comments
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');  // Remove /* */ comments

  try {
    // Execute entire schema at once (SQLite can handle multiple statements)
    db.exec(cleanedSchema);
    console.log('✅ Database schema created successfully');

    // Apply migrations (order matters)
    const migrationsDir = path.join(__dirname, 'migrations');
    // Note: 005-add-professor-role.sql is skipped because schema.sql already
    // includes `professor_id` in users, and 005's rebuild drops the columns
    // added by 004 (program_id, year). It is fully redundant.
    const migrationFiles = [
      '003-add-user-preferences.sql',
      '004-add-program-and-professor-type.sql',
      'add-course-type-and-platform-settings.sql',
      'add-email-settings.sql',
      'add-platform-deadline.sql',
      '006-closing-the-loop.sql',
      // 007 + 008: 007 schimba la (student, professor), 008 revine la
      // (student, course, professor). Pe DB nou se aplică amândouă în ordine
      // și rezultă final granularitate per disciplină.
      '007-evaluations-unique-student-professor.sql',
      '008-evaluations-unique-per-discipline.sql',
      '009-guides.sql',
      '010-achievement-definitions.sql',
      '011-platform-feedback.sql',
      '012-action-templates.sql',
      '013-backfill-student-program-year.sql',
      '014-platform-feedback-messages.sql',
      '015-platform-feedback-submissions.sql',
      '016-password-reset.sql',
    ];
    for (const file of migrationFiles) {
      const p = path.join(migrationsDir, file);
      if (!fs.existsSync(p)) continue;
      const sql = fs.readFileSync(p, 'utf8');
      // Strip comments
      const cleaned = sql
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      // Run statements one-by-one; ignore "duplicate column" errors so re-runs are idempotent
      const statements = cleaned
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const stmt of statements) {
        try {
          db.exec(stmt);
        } catch (e) {
          const msg = String(e.message || e);
          if (msg.includes('duplicate column') || msg.includes('already exists')) {
            continue;
          }
          console.warn(`⚠️  Migration ${file}: ${msg}`);
        }
      }
    }
    console.log('✅ Migrations applied');

    // Run EXTENDED seeding with realistic data
    const { seedExtendedData } = require('./seed-extended');
    seedExtendedData(db);

    console.log('🎉 Database initialization complete!');
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

function seedDatabase(db) {
  console.log('🌱 Seeding database with mock data...');

  const bcrypt = require('bcryptjs');

  try {
    // 1. Facultăți
    const facultiesInsert = db.prepare(`
      INSERT INTO faculties (name, code) VALUES (?, ?)
    `);

    const faculties = [
      { name: 'Facultatea de Informatică', code: 'FI' },
      { name: 'Facultatea de Matematică', code: 'FM' },
      { name: 'Facultatea de Fizică', code: 'FF' }
    ];

    faculties.forEach(f => facultiesInsert.run(f.name, f.code));
    console.log('  ✓ Facultăți create');

    // 2. Programe de studiu
    const programsInsert = db.prepare(`
      INSERT INTO programs (faculty_id, name, code, level) VALUES (?, ?, ?, ?)
    `);

    const programs = [
      { faculty_id: 1, name: 'Informatică', code: 'INF', level: 'licenta' },
      { faculty_id: 1, name: 'Calculatoare și Tehnologia Informației', code: 'CTI', level: 'licenta' },
      { faculty_id: 1, name: 'Inteligență Artificială', code: 'IA', level: 'master' },
      { faculty_id: 2, name: 'Matematică', code: 'MAT', level: 'licenta' },
      { faculty_id: 3, name: 'Fizică', code: 'FIZ', level: 'licenta' }
    ];

    programs.forEach(p => programsInsert.run(p.faculty_id, p.name, p.code, p.level));
    console.log('  ✓ Programe create');

    // 3. Ani de studiu
    const yearsInsert = db.prepare(`
      INSERT INTO study_years (program_id, year_number) VALUES (?, ?)
    `);

    // Pentru licență: 3 ani, pentru master: 2 ani
    [1, 2, 4, 5].forEach(programId => {
      for (let year = 1; year <= 3; year++) {
        yearsInsert.run(programId, year);
      }
    });
    [3].forEach(programId => {
      for (let year = 1; year <= 2; year++) {
        yearsInsert.run(programId, year);
      }
    });
    console.log('  ✓ Ani de studiu creați');

    // 4. Serii
    const seriesInsert = db.prepare(`
      INSERT INTO series (study_year_id, name) VALUES (?, ?)
    `);

    // Pentru fiecare an, creăm 2 serii (A, B)
    for (let yearId = 1; yearId <= 11; yearId++) {
      ['A', 'B'].forEach(seriesName => {
        seriesInsert.run(yearId, seriesName);
      });
    }
    console.log('  ✓ Serii create');

    // 5. Grupe
    const groupsInsert = db.prepare(`
      INSERT INTO groups (series_id, number) VALUES (?, ?)
    `);

    // Pentru fiecare serie, creăm 3 grupe (1, 2, 3)
    for (let seriesId = 1; seriesId <= 22; seriesId++) {
      for (let groupNum = 1; groupNum <= 3; groupNum++) {
        groupsInsert.run(seriesId, groupNum);
      }
    }
    console.log('  ✓ Grupe create');

    // 6. Utilizatori (Studenți + Admin)
    const usersInsert = db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, group_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const password = bcrypt.hashSync('password123', 10);

    // Admin
    usersInsert.run(
      'admin@univ.ro',
      password,
      'Admin',
      'Principal',
      'admin',
      null
    );

    // Studenți mock (50 studenți distribuiți în grupe)
    const firstNames = ['Ion', 'Maria', 'Andrei', 'Elena', 'Mihai', 'Ana', 'Alexandru', 'Ioana', 'Gabriel', 'Cristina'];
    const lastNames = ['Popescu', 'Ionescu', 'Popa', 'Dumitrescu', 'Constantin', 'Stanciu', 'Gheorghe', 'Marin', 'Tudor', 'Stoica'];

    for (let i = 1; i <= 50; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      const groupId = ((i - 1) % 66) + 1; // Distribuie în primele 66 grupe

      usersInsert.run(
        `student${i}@univ.ro`,
        password,
        firstName,
        lastName,
        'student',
        groupId
      );
    }
    console.log('  ✓ Utilizatori creați (1 admin + 50 studenți)');

    // 7. Profesori
    const professorsInsert = db.prepare(`
      INSERT INTO professors (first_name, last_name, title, email, department, faculty_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const professors = [
      { first_name: 'Vasile', last_name: 'Marinescu', title: 'Prof. Dr.', email: 'v.marinescu@univ.ro', department: 'Algoritmi și Structuri de Date', faculty_id: 1 },
      { first_name: 'Carmen', last_name: 'Dumitrescu', title: 'Conf. Dr.', email: 'c.dumitrescu@univ.ro', department: 'Baze de Date', faculty_id: 1 },
      { first_name: 'Adrian', last_name: 'Ionescu', title: 'Lect. Dr.', email: 'a.ionescu@univ.ro', department: 'Programare Orientată Obiect', faculty_id: 1 },
      { first_name: 'Gabriela', last_name: 'Popescu', title: 'Prof. Dr.', email: 'g.popescu@univ.ro', department: 'Inteligență Artificială', faculty_id: 1 },
      { first_name: 'Mihai', last_name: 'Constantin', title: 'Conf. Dr.', email: 'm.constantin@univ.ro', department: 'Rețele de Calculatoare', faculty_id: 1 },
      { first_name: 'Elena', last_name: 'Georgescu', title: 'Prof. Dr.', email: 'e.georgescu@univ.ro', department: 'Analiză Matematică', faculty_id: 2 },
      { first_name: 'Dan', last_name: 'Petrescu', title: 'Lect. Dr.', email: 'd.petrescu@univ.ro', department: 'Algebră', faculty_id: 2 },
      { first_name: 'Ioana', last_name: 'Radu', title: 'Conf. Dr.', email: 'i.radu@univ.ro', department: 'Fizică Teoretică', faculty_id: 3 }
    ];

    professors.forEach(p => {
      professorsInsert.run(p.first_name, p.last_name, p.title, p.email, p.department, p.faculty_id);
    });
    console.log('  ✓ Profesori creați (8 cadre didactice)');

    // 8. Cursuri
    const coursesInsert = db.prepare(`
      INSERT INTO courses (name, code, professor_id, study_year_id, semester, academic_year)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const courses = [
      { name: 'Algoritmi și Structuri de Date', code: 'ASD', professor_id: 1, study_year_id: 1, semester: '1', academic_year: '2023-2024' },
      { name: 'Baze de Date', code: 'BD', professor_id: 2, study_year_id: 2, semester: '1', academic_year: '2023-2024' },
      { name: 'Programare Orientată Obiect', code: 'POO', professor_id: 3, study_year_id: 2, semester: '2', academic_year: '2023-2024' },
      { name: 'Inteligență Artificială', code: 'IA', professor_id: 4, study_year_id: 3, semester: '1', academic_year: '2023-2024' },
      { name: 'Rețele de Calculatoare', code: 'RC', professor_id: 5, study_year_id: 3, semester: '2', academic_year: '2023-2024' },
    ];

    courses.forEach(c => {
      coursesInsert.run(c.name, c.code, c.professor_id, c.study_year_id, c.semester, c.academic_year);
    });
    console.log('  ✓ Cursuri create');

    // 9. Întrebări chestionar
    const questionsInsert = db.prepare(`
      INSERT INTO questions (text, type, category, order_index)
      VALUES (?, ?, ?, ?)
    `);

    const questions = [
      // Cantitative (Likert 1-5)
      { text: 'Cadrul didactic prezintă informația într-un mod clar și structurat', type: 'likert', category: 'didactica', order: 1 },
      { text: 'Materialele de curs sunt utile și bine organizate', type: 'likert', category: 'didactica', order: 2 },
      { text: 'Cadrul didactic răspunde prompt și clar la întrebări', type: 'likert', category: 'comunicare', order: 3 },
      { text: 'Atmosfera la curs/seminar este propice învățării', type: 'likert', category: 'comunicare', order: 4 },
      { text: 'Organizarea activităților (curs/laborator/seminar) este eficientă', type: 'likert', category: 'organizare', order: 5 },
      { text: 'Evaluarea este corectă și transparentă', type: 'likert', category: 'organizare', order: 6 },
      { text: 'Cadrul didactic demonstrează pasiune pentru subiect', type: 'likert', category: 'angajament', order: 7 },
      { text: 'Cadrul didactic încurajează gândirea critică și creativitatea', type: 'likert', category: 'angajament', order: 8 },
      { text: 'Sunt satisfăcut/ă de interacțiunea cu acest cadru didactic', type: 'likert', category: 'general', order: 9 },
      { text: 'Aș recomanda acest curs colegilor', type: 'likert', category: 'general', order: 10 },

      // Calitative (text liber)
      { text: 'Ce aspecte ale predării apreciezi cel mai mult?', type: 'text', category: 'puncte_forte', order: 11 },
      { text: 'Ce sugestii ai pentru îmbunătățirea cursului/seminarului?', type: 'text', category: 'imbunatatiri', order: 12 },
      { text: 'Alte comentarii sau observații', type: 'text', category: 'altele', order: 13 }
    ];

    questions.forEach(q => {
      questionsInsert.run(q.text, q.type, q.category, q.order);
    });
    console.log('  ✓ Întrebări chestionar create (10 Likert + 3 text)');

    // 10. Evaluări mock (câteva draft + câteva submitted pentru demo)
    const evaluationsInsert = db.prepare(`
      INSERT INTO evaluations (student_id, course_id, professor_id, status, submitted_at, deadline)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const responsesInsert = db.prepare(`
      INSERT INTO responses (evaluation_id, question_id, response_likert, response_text)
      VALUES (?, ?, ?, ?)
    `);

    // Creăm evaluări pentru primii 20 de studenți pentru cursul 1 (ASD)
    for (let studentId = 2; studentId <= 21; studentId++) {
      const isSubmitted = studentId <= 12; // Primii 10 au submitted, restul draft
      const status = isSubmitted ? 'submitted' : 'draft';
      const submittedAt = isSubmitted ? new Date().toISOString() : null;
      const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 zile

      evaluationsInsert.run(studentId, 1, 1, status, submittedAt, deadline);

      if (isSubmitted) {
        const evalId = db.prepare('SELECT last_insert_rowid() as id').get().id;

        // Răspunsuri Likert (întrebările 1-10)
        for (let qId = 1; qId <= 10; qId++) {
          const score = Math.floor(Math.random() * 2) + 4; // Random între 4-5 (scoruri bune)
          responsesInsert.run(evalId, qId, score, null);
        }

        // Răspunsuri text (întrebările 11-13)
        const textResponses = [
          'Explicațiile clare și exemple practice.',
          'Mai multe exemple aplicative ar fi utile.',
          'Foarte mulțumit de acest curs!'
        ];

        for (let i = 0; i < 3; i++) {
          responsesInsert.run(evalId, 11 + i, null, textResponses[i]);
        }
      }
    }
    console.log('  ✓ Evaluări mock create (10 submitted + 10 draft)');

    // 11. Perioadă de evaluare activă
    const periodInsert = db.prepare(`
      INSERT INTO evaluation_periods (name, academic_year, semester, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const startDate = new Date();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    periodInsert.run(
      'Evaluare Semestrul I - 2023/2024',
      '2023-2024',
      '1',
      startDate.toISOString(),
      endDate.toISOString(),
      1
    );
    console.log('  ✓ Perioadă de evaluare activă creată');

    console.log('✅ Database seeding complete!');

    // Afișare statistici
    console.log('\n📊 Database Statistics:');
    console.log(`  - Facultăți: ${db.prepare('SELECT COUNT(*) as count FROM faculties').get().count}`);
    console.log(`  - Programe: ${db.prepare('SELECT COUNT(*) as count FROM programs').get().count}`);
    console.log(`  - Utilizatori: ${db.prepare('SELECT COUNT(*) as count FROM users').get().count}`);
    console.log(`  - Profesori: ${db.prepare('SELECT COUNT(*) as count FROM professors').get().count}`);
    console.log(`  - Cursuri: ${db.prepare('SELECT COUNT(*) as count FROM courses').get().count}`);
    console.log(`  - Întrebări: ${db.prepare('SELECT COUNT(*) as count FROM questions').get().count}`);
    console.log(`  - Evaluări: ${db.prepare('SELECT COUNT(*) as count FROM evaluations').get().count}`);
    console.log('\n🔐 Test Credentials:');
    console.log('  Admin: admin@univ.ro / password123');
    console.log('  Student: student1@univ.ro / password123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  try {
    initializeDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

module.exports = { initializeDatabase, seedDatabase };
