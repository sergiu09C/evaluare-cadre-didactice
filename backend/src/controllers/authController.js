const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

/**
 * Login utilizator (student sau admin)
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validare input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email și password sunt obligatorii' });
    }

    const db = getDatabase();

    // Căutare utilizator
    const user = db.prepare(`
      SELECT u.*,
             p.name as program_name,
             p.code as program_code,
             p.level as program_level,
             f.name as faculty_name
      FROM users u
      LEFT JOIN programs p ON p.id = u.program_id
      LEFT JOIN faculties f ON f.id = p.faculty_id
      WHERE u.email = ? AND u.is_active = 1
    `).get(email);

    if (!user) {
      return res.status(401).json({ error: 'Credențiale invalide' });
    }

    // Verificare parolă
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credențiale invalide' });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?')
      .run(new Date().toISOString(), user.id);

    // Generare JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.SESSION_EXPIRY || '24h' }
    );

    // Răspuns (fără password_hash)
    const { password_hash, ...userData } = user;

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role,
        ...(userData.role === 'student' && userData.program_name && {
          program: {
            name: userData.program_name,
            code: userData.program_code,
            level: userData.program_level,
            year: userData.year,
            faculty: userData.faculty_name
          }
        })
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Logout utilizator (invalidare token pe client)
 * POST /api/auth/logout
 */
exports.logout = (req, res) => {
  // În această implementare simplă, logout-ul se face pe client (ștergere token)
  // Într-o implementare mai complexă, am putea avea o blacklist de token-uri
  res.json({ message: 'Logout successful' });
};

/**
 * Obține informații despre utilizatorul curent
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 */
exports.getCurrentUser = (req, res, next) => {
  try {
    const db = getDatabase();

    // req.user vine din middleware-ul authenticateToken
    const user = db.prepare(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.group_id,
             g.number as group_number, s.name as series_name,
             sy.year_number, pr.name as program_name, f.name as faculty_name
      FROM users u
      LEFT JOIN groups g ON g.id = u.group_id
      LEFT JOIN series s ON s.id = g.series_id
      LEFT JOIN study_years sy ON sy.id = s.study_year_id
      LEFT JOIN programs pr ON pr.id = sy.program_id
      LEFT JOIN faculties f ON f.id = pr.faculty_id
      WHERE u.id = ? AND u.is_active = 1
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      ...(user.role === 'student' && {
        group: {
          id: user.group_id,
          number: user.group_number,
          series: user.series_name,
          year: user.year_number,
          program: user.program_name,
          faculty: user.faculty_name
        }
      })
    });

  } catch (error) {
    next(error);
  }
};
