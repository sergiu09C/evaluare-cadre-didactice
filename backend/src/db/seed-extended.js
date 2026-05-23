const bcrypt = require('bcryptjs');

function seedExtendedData(db) {
  console.log('🌱 Seeding EXTENDED database with realistic data...');

  const password = bcrypt.hashSync('password123', 10);

  try {
    // Ștergem toate datele existente (în ordine inversă pentru a respecta FK constraints)
    console.log('  🧹 Clearing existing data...');
    // Dezactivăm temporar foreign keys pentru a putea șterge
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('DELETE FROM responses');
    db.exec('DELETE FROM evaluations');
    db.exec('DELETE FROM questions');
    db.exec('DELETE FROM courses');
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM professors');
    db.exec('DELETE FROM groups');
    db.exec('DELETE FROM series');
    db.exec('DELETE FROM study_years');
    db.exec('DELETE FROM programs');
    db.exec('DELETE FROM faculties');
    db.exec('DELETE FROM platform_settings');
    db.exec('DELETE FROM student_messages');
    // Reactivăm foreign keys
    db.exec('PRAGMA foreign_keys = ON');
    console.log('  ✓ Existing data cleared');

    // 1. FACULTĂȚI - 5 facultăți
    const facultiesInsert = db.prepare(`INSERT INTO faculties (name, code) VALUES (?, ?)`);

    const facultiesData = [
      { name: 'Facultatea de Informatică', code: 'FI' },
      { name: 'Facultatea de Matematică și Informatică', code: 'FMI' },
      { name: 'Facultatea de Fizică', code: 'FF' },
      { name: 'Facultatea de Electronică și Telecomunicații', code: 'FET' },
      { name: 'Facultatea de Automatică și Calculatoare', code: 'FAC' }
    ];

    const faculties = [];
    facultiesData.forEach((f, idx) => {
      const result = facultiesInsert.run(f.name, f.code);
      faculties.push({ id: result.lastInsertRowid, ...f });
    });
    console.log(`  ✓ ${faculties.length} Facultăți create`);

    // 2. PROGRAME DE STUDIU - 2 programe licență per facultate + 1 master per facultate
    const programsInsert = db.prepare(`INSERT INTO programs (faculty_id, name, code, level) VALUES (?, ?, ?, ?)`);

    const programs = [];
    const programsData = [
      [ // Informatică (faculties[0])
        { name: 'Informatică', code: 'INF', level: 'licenta' },
        { name: 'Calculatoare și Tehnologia Informației', code: 'CTI', level: 'licenta' },
        { name: 'Inteligență Artificială și Învățare Automată', code: 'IAIA', level: 'master' }
      ],
      [ // Matematică și Informatică (faculties[1])
        { name: 'Matematică', code: 'MAT', level: 'licenta' },
        { name: 'Matematică Aplicată', code: 'MATA', level: 'licenta' },
        { name: 'Matematică Computațională', code: 'MATC', level: 'master' }
      ],
      [ // Fizică (faculties[2])
        { name: 'Fizică', code: 'FIZ', level: 'licenta' },
        { name: 'Fizică Aplicată', code: 'FIZA', level: 'licenta' },
        { name: 'Fizică Teoretică', code: 'FIZT', level: 'master' }
      ],
      [ // Electronică (faculties[3])
        { name: 'Electronică Aplicată', code: 'EA', level: 'licenta' },
        { name: 'Telecomunicații', code: 'TEL', level: 'licenta' },
        { name: 'Sisteme Embedded', code: 'SEMB', level: 'master' }
      ],
      [ // Automatică (faculties[4])
        { name: 'Automatică și Informatică Aplicată', code: 'AIA', level: 'licenta' },
        { name: 'Ingineria Sistemelor', code: 'IS', level: 'licenta' },
        { name: 'Robotică și Inteligență Artificială', code: 'RIA', level: 'master' }
      ]
    ];

    faculties.forEach((faculty, fIdx) => {
      programsData[fIdx].forEach(p => {
        const result = programsInsert.run(faculty.id, p.name, p.code, p.level);
        programs.push({ id: result.lastInsertRowid, facultyId: faculty.id, ...p });
      });
    });
    console.log(`  ✓ ${programs.length} Programe create`);

    // 3. ANI DE STUDIU - 3 ani pentru licență, 2 pentru master
    const yearsInsert = db.prepare(`INSERT INTO study_years (program_id, year_number) VALUES (?, ?)`);

    const studyYears = [];
    programs.forEach(program => {
      const maxYear = program.level === 'licenta' ? 3 : 2;
      for (let year = 1; year <= maxYear; year++) {
        const result = yearsInsert.run(program.id, year);
        studyYears.push({ id: result.lastInsertRowid, programId: program.id, year });
      }
    });
    console.log(`  ✓ ${studyYears.length} Ani de studiu creați`);

    // 4. SERII - 2 serii (A, B) per an
    const seriesInsert = db.prepare(`INSERT INTO series (study_year_id, name) VALUES (?, ?)`);

    const seriesList = [];
    studyYears.forEach(sy => {
      ['A', 'B'].forEach(seriesName => {
        const result = seriesInsert.run(sy.id, seriesName);
        seriesList.push({ id: result.lastInsertRowid, studyYearId: sy.id, name: seriesName });
      });
    });
    console.log(`  ✓ ${seriesList.length} Serii create`);

    // 5. GRUPE - 3 grupe (1, 2, 3) per serie
    const groupsInsert = db.prepare(`INSERT INTO groups (series_id, number) VALUES (?, ?)`);

    const groupsList = [];
    seriesList.forEach(series => {
      for (let groupNum = 1; groupNum <= 3; groupNum++) {
        const result = groupsInsert.run(series.id, groupNum);
        groupsList.push({ id: result.lastInsertRowid, seriesId: series.id, number: groupNum });
      }
    });
    console.log(`  ✓ ${groupsList.length} Grupe create`);

    // 6. PROFESORI - 8 profesori per grupă (distribuit)
    const professorsInsert = db.prepare(`INSERT INTO professors (first_name, last_name, title, email, department, faculty_id) VALUES (?, ?, ?, ?, ?, ?)`);

    const firstNamesProfessors = ['Vasile', 'Maria', 'Ion', 'Elena', 'Mihai', 'Ana', 'Constantin', 'Ioana', 'Alexandru', 'Gabriela', 'Dan', 'Carmen', 'Adrian', 'Raluca', 'Cristian', 'Simona', 'George', 'Diana', 'Florin', 'Laura'];
    const lastNamesProfessors = ['Popescu', 'Ionescu', 'Popa', 'Dumitrescu', 'Constantin', 'Stanciu', 'Gheorghe', 'Marin', 'Tudor', 'Stoica', 'Radu', 'Marinescu', 'Vasilescu', 'Ilie', 'Mihăilescu', 'Andrei', 'Dobre', 'Barbu', 'Moldovan', 'Cristea'];
    const titles = ['Prof. Dr.', 'Conf. Dr.', 'Lect. Dr.', 'Asist. Dr.'];
    const departments = {
      1: ['Algoritmi și Structuri de Date', 'Baze de Date', 'Programare', 'Inteligență Artificială'],
      2: ['Analiză Matematică', 'Algebră', 'Geometrie', 'Statistică'],
      3: ['Fizică Teoretică', 'Fizică Experimentală', 'Optică', 'Termodinamică'],
      4: ['Electronică Digitală', 'Circuite Electrice', 'Telecomunicații', 'Sisteme Embedded'],
      5: ['Automatizări', 'Robotică', 'Sisteme de Control', 'Procesare Semnale']
    };

    const professorsList = [];
    faculties.forEach((faculty, fIdx) => {
      const facultyDepartments = departments[fIdx + 1];
      // Creăm 40 profesori per facultate (suficienți pentru 8 per grupă distribuit)
      for (let i = 0; i < 40; i++) {
        const firstName = firstNamesProfessors[i % firstNamesProfessors.length];
        const lastName = lastNamesProfessors[Math.floor(i / firstNamesProfessors.length) % lastNamesProfessors.length];
        const title = titles[i % titles.length];
        const dept = facultyDepartments[i % facultyDepartments.length];
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.f${fIdx + 1}.${i}@univ.ro`;

        const result = professorsInsert.run(firstName, lastName, title, email, dept, faculty.id);
        professorsList.push({ id: result.lastInsertRowid, facultyId: faculty.id, firstName, lastName, title, dept });
      }
    });
    console.log(`  ✓ ${professorsList.length} Profesori creați`);

    // 7. UTILIZATORI (Admin + Profesori + Studenți)
    const usersInsert = db.prepare(`INSERT INTO users (email, password_hash, first_name, last_name, role, group_id, professor_id) VALUES (?, ?, ?, ?, ?, ?, ?)`);

    // Admin
    usersInsert.run('admin@univ.ro', password, 'Admin', 'Principal', 'admin', null, null);

    // PROFESORI - Creăm utilizatori pentru primii 10 profesori din fiecare facultate (50 total)
    const professorUsersList = [];
    faculties.forEach((faculty, fIdx) => {
      const facultyProfessors = professorsList.filter(p => p.facultyId === faculty.id).slice(0, 10);

      facultyProfessors.forEach(prof => {
        // Generăm email fără diacritice: prenume.nume.professorId@prof.univ.ro
        const firstNameClean = prof.firstName.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove diacritics
          .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i')
          .replace(/ș/g, 's').replace(/ț/g, 't');

        const lastNameClean = prof.lastName.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i')
          .replace(/ș/g, 's').replace(/ț/g, 't');

        // Adăugăm ID-ul profesorului pentru a face emailul unic
        const email = `${firstNameClean}.${lastNameClean}.${prof.id}@prof.univ.ro`;

        usersInsert.run(email, password, prof.firstName, prof.lastName, 'professor', null, prof.id);
        professorUsersList.push({
          email,
          name: `${prof.firstName} ${prof.lastName}`,
          title: prof.title,
          department: prof.dept
        });
      });
    });
    console.log(`  ✓ ${professorUsersList.length} Utilizatori profesori creați`);

    const firstNames = ['Ion', 'Maria', 'Andrei', 'Elena', 'Mihai', 'Ana', 'Alexandru', 'Ioana', 'Gabriel', 'Cristina', 'Ștefan', 'Raluca', 'Cristian', 'Diana', 'Florin', 'Laura', 'Adrian', 'Simona', 'George', 'Carmen'];
    const lastNames = ['Popescu', 'Ionescu', 'Popa', 'Dumitrescu', 'Constantin', 'Stanciu', 'Gheorghe', 'Marin', 'Tudor', 'Stoica', 'Radu', 'Vasilescu', 'Ilie', 'Mihăilescu', 'Andrei', 'Barbu', 'Moldovan', 'Cristea', 'Dobre', 'Petrescu'];

    // STUDENȚI - 5 studenți per grupă
    let totalUsers = 1 + professorUsersList.length; // Admin + Profesori
    groupsList.forEach(group => {
      // 5 studenți per grupă
      for (let i = 0; i < 5; i++) {
        const firstName = firstNames[(totalUsers + i) % firstNames.length];
        const lastName = lastNames[Math.floor((totalUsers + i) / firstNames.length) % lastNames.length];
        const email = `student${totalUsers - professorUsersList.length}@univ.ro`;

        usersInsert.run(email, password, firstName, lastName, 'student', group.id, null);
        totalUsers++;
      }
    });
    const totalStudents = totalUsers - 1 - professorUsersList.length;
    console.log(`  ✓ ${totalUsers - 1} Utilizatori creați total (1 admin + ${professorUsersList.length} profesori + ${totalStudents} studenți)`);

    // 8. CURSURI - 8 cursuri per study_year (4 curs + 4 lab/seminar)
    const coursesInsert = db.prepare(`INSERT INTO courses (name, code, professor_id, study_year_id, semester, academic_year, course_type) VALUES (?, ?, ?, ?, ?, ?, ?)`);

    // Mapăm faculty IDs la indici pentru courseNames
    const facultyIdToIndex = {};
    faculties.forEach((f, idx) => {
      facultyIdToIndex[f.id] = idx;
    });

    const courseNamesArray = [
      ['Algoritmi și Structuri de Date', 'Programare Orientată Obiect', 'Baze de Date', 'Sisteme de Operare', 'Rețele de Calculatoare', 'Inteligență Artificială', 'Dezvoltare Web', 'Securitate Informatică'],
      ['Analiză Matematică', 'Algebră Liniară', 'Geometrie Analitică', 'Ecuații Diferențiale', 'Statistică', 'Probabilități', 'Matematică Discretă', 'Analiză Numerică'],
      ['Mecanică', 'Electricitate și Magnetism', 'Optică', 'Termodinamică', 'Fizică Modernă', 'Fizică Atomică', 'Mecanică Cuantică', 'Fizică Statistică'],
      ['Electronică Analogică', 'Electronică Digitală', 'Circuite Electrice', 'Sisteme cu Microprocesoare', 'Telecomunicații', 'Procesare Semnale', 'Sisteme Embedded', 'Comunicații Mobile'],
      ['Teoria Sistemelor', 'Automatizări Industriale', 'Robotică', 'Sisteme de Control', 'Procesare Semnale', 'Inginerie Software', 'Microcontrolere', 'Sisteme în Timp Real']
    ];

    let courseId = 1;
    studyYears.forEach(sy => {
      const program = programs.find(p => p.id === sy.programId);
      const facultyId = program.facultyId;
      const facultyIndex = facultyIdToIndex[facultyId];
      const facultyCourses = courseNamesArray[facultyIndex];

      // Creăm 8 cursuri per an (4 în semestrul 1, 4 în semestrul 2)
      for (let i = 0; i < 8; i++) {
        const courseName = facultyCourses[i % facultyCourses.length];
        const code = courseName.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase() + sy.id + '-' + (i + 1);
        const semester = i < 4 ? '1' : '2';

        // Determinăm tipul cursului: 50% curs, 25% laborator, 25% seminar
        let courseType;
        if (i < 4) {
          courseType = 'curs'; // primele 4 sunt cursuri (50%)
        } else if (i < 6) {
          courseType = 'laborator'; // următoarele 2 sunt laboratoare (25%)
        } else {
          courseType = 'seminar'; // ultimele 2 sunt seminarii (25%)
        }

        // Selectăm un profesor din aceeași facultate (direct din DB)
        const facultyProfessorsFromDB = db.prepare('SELECT id FROM professors WHERE faculty_id = ? ORDER BY id').all(facultyId);
        if (facultyProfessorsFromDB.length === 0) continue; // Skip dacă nu există profesori
        const professorIndex = (sy.id * 8 + i) % facultyProfessorsFromDB.length;
        const professorId = facultyProfessorsFromDB[professorIndex].id;

        coursesInsert.run(courseName, code, professorId, sy.id, semester, '2025-2026', courseType);
        courseId++;
      }
    });
    console.log(`  ✓ ${courseId - 1} Cursuri create (8 per an de studiu)`);

    // 9. ÎNTREBĂRI CHESTIONAR - 13 întrebări (10 Likert + 3 text)
    const questionsInsert = db.prepare(`INSERT INTO questions (text, type, category, order_index) VALUES (?, ?, ?, ?)`);

    const questions = [
      { text: 'Cadrul didactic prezintă informația într-un mod clar și structurat', type: 'likert', category: 'didactica', order: 1 },
      { text: 'Materialele de curs sunt utile și bine organizate', type: 'likert', category: 'didactica', order: 2 },
      { text: 'Cadrul didactic răspunde prompt și clar la întrebări', type: 'likert', category: 'comunicare', order: 3 },
      { text: 'Atmosfera la curs/seminar este propice învățării', type: 'likert', category: 'comunicare', order: 4 },
      { text: 'Organizarea activităților este eficientă', type: 'likert', category: 'organizare', order: 5 },
      { text: 'Evaluarea este corectă și transparentă', type: 'likert', category: 'organizare', order: 6 },
      { text: 'Cadrul didactic demonstrează pasiune pentru subiect', type: 'likert', category: 'angajament', order: 7 },
      { text: 'Cadrul didactic încurajează gândirea critică și creativitatea', type: 'likert', category: 'angajament', order: 8 },
      { text: 'Sunt satisfăcut/ă de interacțiunea cu acest cadru didactic', type: 'likert', category: 'general', order: 9 },
      { text: 'Aș recomanda acest curs colegilor', type: 'likert', category: 'general', order: 10 },
      { text: 'Ce aspecte ale predării apreciezi cel mai mult?', type: 'text', category: 'puncte_forte', order: 11 },
      { text: 'Ce sugestii ai pentru îmbunătățirea cursului?', type: 'text', category: 'imbunatatiri', order: 12 },
      { text: 'Alte comentarii sau observații', type: 'text', category: 'altele', order: 13 }
    ];

    questions.forEach(q => questionsInsert.run(q.text, q.type, q.category, q.order));
    console.log(`  ✓ ${questions.length} Întrebări chestionar create`);

    // 10. EVALUĂRI MOCK - Unii studenți au evaluat deja (pentru demo)
    const evaluationsInsert = db.prepare(`INSERT INTO evaluations (student_id, course_id, professor_id, status, submitted_at, deadline) VALUES (?, ?, ?, ?, ?, ?)`);
    const responsesInsert = db.prepare(`INSERT INTO responses (evaluation_id, question_id, response_likert, response_text) VALUES (?, ?, ?, ?)`);

    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Creăm evaluări pentru primii 50 de studenți (unele submitted, altele draft)
    let evalId = 1;
    for (let stId = 2; stId <= 51; stId++) {
      // Fiecare student evaluează primele 2 cursuri disponibile pentru el
      const student = db.prepare('SELECT group_id FROM users WHERE id = ?').get(stId);
      if (!student || !student.group_id) continue;

      const studentCourses = db.prepare(`
        SELECT DISTINCT c.id, c.professor_id
        FROM courses c
        JOIN study_years sy ON sy.id = c.study_year_id
        JOIN series s ON s.study_year_id = sy.id
        JOIN groups g ON g.series_id = s.id
        WHERE g.id = ?
        LIMIT 2
      `).all(student.group_id);

      studentCourses.forEach((course, idx) => {
        const isSubmitted = (stId + idx) % 3 !== 0; // ~66% submitted, 33% draft
        const status = isSubmitted ? 'submitted' : 'draft';
        const submittedAt = isSubmitted ? new Date().toISOString() : null;

        evaluationsInsert.run(stId, course.id, course.professor_id, status, submittedAt, deadline);

        if (isSubmitted) {
          // Adăugăm răspunsuri
          for (let qId = 1; qId <= 10; qId++) {
            const score = Math.floor(Math.random() * 2) + 4; // 4-5
            responsesInsert.run(evalId, qId, score, null);
          }

          const textResponses = ['Explicații clare.', 'Mai multe exemple.', 'Foarte bun!'];
          for (let i = 0; i < 3; i++) {
            responsesInsert.run(evalId, 11 + i, null, textResponses[i]);
          }
        }

        evalId++;
      });
    }
    console.log(`  ✓ ${evalId - 1} Evaluări mock create`);

    // 11. PERIOADĂ EVALUARE ACTIVĂ
    const periodInsert = db.prepare(`INSERT INTO evaluation_periods (name, academic_year, semester, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?)`);

    const startDate = new Date();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    periodInsert.run('Evaluare Semestrul II - 2025/2026', '2025-2026', '2', startDate.toISOString(), endDate.toISOString(), 1);
    console.log('  ✓ Perioadă de evaluare activă creată');

    // 12. SETĂRI PLATFORMĂ - Insert default settings
    const platformSettingsInsert = db.prepare(`INSERT OR IGNORE INTO platform_settings (id, is_active, auto_reminders_enabled) VALUES (?, ?, ?)`);
    platformSettingsInsert.run(1, 1, 1);
    console.log('  ✓ Setări platformă inițializate');

    console.log('\n✅ Database seeding complete!');

    // Statistici finale
    console.log('\n📊 Database Statistics:');
    console.log(`  - Facultăți: ${db.prepare('SELECT COUNT(*) as count FROM faculties').get().count}`);
    console.log(`  - Programe: ${db.prepare('SELECT COUNT(*) as count FROM programs').get().count}`);
    console.log(`  - Ani de studiu: ${db.prepare('SELECT COUNT(*) as count FROM study_years').get().count}`);
    console.log(`  - Serii: ${db.prepare('SELECT COUNT(*) as count FROM series').get().count}`);
    console.log(`  - Grupe: ${db.prepare('SELECT COUNT(*) as count FROM groups').get().count}`);
    console.log(`  - Utilizatori: ${db.prepare('SELECT COUNT(*) as count FROM users').get().count}`);
    console.log(`  - Profesori: ${db.prepare('SELECT COUNT(*) as count FROM professors').get().count}`);
    console.log(`  - Cursuri: ${db.prepare('SELECT COUNT(*) as count FROM courses').get().count}`);
    console.log(`  - Întrebări: ${db.prepare('SELECT COUNT(*) as count FROM questions').get().count}`);
    console.log(`  - Evaluări: ${db.prepare('SELECT COUNT(*) as count FROM evaluations').get().count}`);

    console.log('\n🔐 Test Credentials:');
    console.log('  Admin: admin@univ.ro / password123');
    console.log('  Student: student1@univ.ro / password123');
    console.log('  Student: student50@univ.ro / password123');

    console.log('\n👨‍🏫 Professor Credentials (primii 5):');
    professorUsersList.slice(0, 5).forEach((prof, idx) => {
      console.log(`  ${idx + 1}. ${prof.name} (${prof.title}) - ${prof.email} / password123`);
      console.log(`     Departament: ${prof.department}`);
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

module.exports = { seedExtendedData };
