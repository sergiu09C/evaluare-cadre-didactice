const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/database');
const { auditLog } = require('../middleware/auditLog');

exports.list = (req, res, next) => {
  try {
    const db = getDatabase();
    const { role, search } = req.query || {};
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 25));
    const offset = (page - 1) * pageSize;

    const where = ['1=1'];
    const params = [];
    if (role) {
      where.push('u.role = ?');
      params.push(role);
    }
    if (search) {
      where.push('(u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    const total = db
      .prepare(`SELECT COUNT(*) AS n FROM users u WHERE ${where.join(' AND ')}`)
      .get(...params).n;

    const rows = db
      .prepare(
        `SELECT u.id, u.email, u.first_name AS firstName, u.last_name AS lastName, u.role,
                u.is_active, u.professor_id, u.program_id, u.year,
                p.department, f.name AS faculty
         FROM users u
         LEFT JOIN professors p ON p.id = u.professor_id
         LEFT JOIN faculties f ON f.id = p.faculty_id
         WHERE ${where.join(' AND ')}
         ORDER BY u.role, u.last_name, u.first_name
         LIMIT ? OFFSET ?`,
      )
      .all(...params, pageSize, offset);
    res.json({
      users: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: offset + rows.length < total,
      },
    });
  } catch (e) {
    next(e);
  }
};

exports.counts = (req, res, next) => {
  try {
    const db = getDatabase();
    const { search } = req.query || {};
    const where = ['1=1'];
    const params = [];
    if (search) {
      where.push('(u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    const rows = db
      .prepare(
        `SELECT u.role AS role, COUNT(*) AS total
         FROM users u
         WHERE ${where.join(' AND ')}
         GROUP BY u.role`,
      )
      .all(...params);
    const counts = { all: 0, student: 0, professor: 0, admin: 0 };
    for (const r of rows) {
      if (counts[r.role] != null) counts[r.role] = r.total;
      counts.all += r.total;
    }
    res.json({ counts });
  } catch (e) {
    next(e);
  }
};

function applyProfessorAssignments(db, professorId, assignments) {
  if (!Array.isArray(assignments)) return;
  const updCourse = db.prepare(`UPDATE courses SET professor_id = ?, course_type = ? WHERE id = ?`);
  for (const a of assignments) {
    if (!a || !a.course_id) continue;
    const activity = ['curs', 'seminar', 'laborator'].includes(a.activity) ? a.activity : 'curs';
    updCourse.run(professorId, activity, a.course_id);
  }
}

exports.create = async (req, res, next) => {
  try {
    const db = getDatabase();
    const {
      email, firstName, lastName, role, password,
      program_id, year, professor_id,
      // câmpuri profesor:
      department, facultyId, assignments,
    } = req.body || {};
    if (!email || !firstName || !lastName || !role || !password) {
      return res.status(400).json({ error: 'Câmpuri obligatorii lipsă' });
    }
    if (!['student', 'professor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rol invalid' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email deja folosit' });
    const hash = await bcrypt.hash(password, 10);

    let resolvedProfessorId = professor_id || null;

    // dacă creezi un profesor și nu există încă rândul în professors, îl creăm
    if (role === 'professor' && !resolvedProfessorId) {
      if (!facultyId) return res.status(400).json({ error: 'Facultatea e obligatorie pentru profesori' });
      const newProf = db
        .prepare(`INSERT INTO professors (first_name, last_name, faculty_id, department) VALUES (?, ?, ?, ?)`)
        .run(firstName, lastName, facultyId, department || null);
      resolvedProfessorId = newProf.lastInsertRowid;
    }

    const result = db
      .prepare(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, program_id, year, professor_id, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      )
      .run(email, hash, firstName, lastName, role, program_id || null, year || null, resolvedProfessorId, );

    if (role === 'professor' && resolvedProfessorId) {
      applyProfessorAssignments(db, resolvedProfessorId, assignments);
    }

    auditLog(req, 'user.create', 'user', result.lastInsertRowid, { email, role });
    res.status(201).json({ id: result.lastInsertRowid, professor_id: resolvedProfessorId });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const db = getDatabase();
    const id = Number(req.params.id);
    const {
      firstName, lastName, email, role,
      program_id, year, professor_id, is_active, password,
      department, facultyId, assignments,
    } = req.body || {};
    const existing = db.prepare('SELECT id, professor_id, role FROM users WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Utilizator inexistent' });

    let passwordHash = null;
    if (password) passwordHash = await bcrypt.hash(password, 10);

    let resolvedProfessorId = professor_id ?? existing.professor_id ?? null;

    // dacă deja era profesor și avem date noi pentru rândul professors → update
    if ((existing.role === 'professor' || role === 'professor') && resolvedProfessorId) {
      const updateParts = [];
      const params = [];
      if (firstName) { updateParts.push('first_name = ?'); params.push(firstName); }
      if (lastName) { updateParts.push('last_name = ?'); params.push(lastName); }
      if (department !== undefined) { updateParts.push('department = ?'); params.push(department || null); }
      if (facultyId !== undefined) { updateParts.push('faculty_id = ?'); params.push(facultyId || null); }
      if (updateParts.length) {
        db.prepare(`UPDATE professors SET ${updateParts.join(', ')} WHERE id = ?`).run(...params, resolvedProfessorId);
      }
    } else if (role === 'professor' && !resolvedProfessorId) {
      // promovat la profesor — creăm rândul în professors
      if (!facultyId) return res.status(400).json({ error: 'Facultatea e obligatorie pentru profesori' });
      const newProf = db
        .prepare(`INSERT INTO professors (first_name, last_name, faculty_id, department) VALUES (?, ?, ?, ?)`)
        .run(firstName || 'N/A', lastName || 'N/A', facultyId, department || null);
      resolvedProfessorId = newProf.lastInsertRowid;
    }

    db.prepare(
      `UPDATE users SET
         first_name = COALESCE(?, first_name),
         last_name = COALESCE(?, last_name),
         email = COALESCE(?, email),
         role = COALESCE(?, role),
         program_id = COALESCE(?, program_id),
         year = COALESCE(?, year),
         professor_id = COALESCE(?, professor_id),
         is_active = COALESCE(?, is_active),
         password_hash = COALESCE(?, password_hash)
       WHERE id = ?`,
    ).run(
      firstName ?? null,
      lastName ?? null,
      email ?? null,
      role ?? null,
      program_id ?? null,
      year ?? null,
      resolvedProfessorId ?? null,
      is_active === undefined ? null : is_active ? 1 : 0,
      passwordHash,
      id,
    );

    if ((role === 'professor' || existing.role === 'professor') && resolvedProfessorId && Array.isArray(assignments)) {
      // Resetăm cursurile alocate anterior și aplicăm noile assignments
      // (numai pe cursurile pe care le-am primit explicit — nu detașăm orbește)
      applyProfessorAssignments(db, resolvedProfessorId, assignments);
    }

    res.json({ ok: true, professor_id: resolvedProfessorId });
  } catch (e) {
    next(e);
  }
};

// GET /api/admin/users/:id/professor-profile  — date detaliate pentru editare
exports.getProfessorProfile = (req, res, next) => {
  try {
    const db = getDatabase();
    const id = Number(req.params.id);
    const u = db.prepare(
      `SELECT u.id, u.professor_id, p.faculty_id, p.department,
              f.name AS facultyName
       FROM users u
       LEFT JOIN professors p ON p.id = u.professor_id
       LEFT JOIN faculties f ON f.id = p.faculty_id
       WHERE u.id = ?`,
    ).get(id);
    if (!u || !u.professor_id) return res.json({ professor: null, courses: [] });
    const courses = db.prepare(
      `SELECT c.id, c.name, c.course_type AS activity, c.semester, sy.year_number AS year,
              pr.name AS program, pr.level AS programLevel, pr.faculty_id AS programFacultyId
       FROM courses c
       JOIN study_years sy ON sy.id = c.study_year_id
       JOIN programs pr ON pr.id = sy.program_id
       WHERE c.professor_id = ?
       ORDER BY pr.name, sy.year_number, c.semester, c.name`,
    ).all(u.professor_id);
    res.json({
      professor: {
        id: u.professor_id,
        facultyId: u.faculty_id,
        facultyName: u.facultyName,
        department: u.department,
      },
      courses,
    });
  } catch (e) { next(e); }
};

// GET /api/admin/lookup/courses  — listă cursuri disponibile pentru asignare (cu filtre opționale)
exports.lookupCourses = (req, res, next) => {
  try {
    const db = getDatabase();
    const { facultyId, search } = req.query || {};
    const where = ['1=1'];
    const params = [];
    if (facultyId) { where.push('pr.faculty_id = ?'); params.push(Number(facultyId)); }
    if (search) {
      where.push('(c.name LIKE ? OR pr.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    const rows = db.prepare(
      `SELECT c.id, c.name, c.course_type AS activity, c.semester,
              sy.year_number AS year, pr.name AS program, pr.level AS programLevel,
              p.first_name || ' ' || p.last_name AS currentProfessor
       FROM courses c
       JOIN study_years sy ON sy.id = c.study_year_id
       JOIN programs pr ON pr.id = sy.program_id
       LEFT JOIN professors p ON p.id = c.professor_id
       WHERE ${where.join(' AND ')}
       ORDER BY pr.name, sy.year_number, c.name
       LIMIT 500`,
    ).all(...params);
    res.json({ courses: rows });
  } catch (e) { next(e); }
};

// GET /api/admin/lookup/departments  — distinct departments (opțional pe facultate)
exports.lookupDepartments = (req, res, next) => {
  try {
    const db = getDatabase();
    const { facultyId } = req.query || {};
    const where = ['p.department IS NOT NULL'];
    const params = [];
    if (facultyId) { where.push('p.faculty_id = ?'); params.push(Number(facultyId)); }
    const rows = db.prepare(
      `SELECT DISTINCT p.department FROM professors p WHERE ${where.join(' AND ')} ORDER BY p.department`,
    ).all(...params);
    res.json({ departments: rows.map((r) => r.department) });
  } catch (e) { next(e); }
};

exports.deactivate = (req, res, next) => {
  try {
    const db = getDatabase();
    const id = Number(req.params.id);
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(id);
    auditLog(req, 'user.deactivate', 'user', id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
