const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

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

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Generează un token de reset, îl salvează în DB, îl loghează în consolă (dev).
 * Răspunsul e mereu 200 indiferent dacă emailul există — evită enumerarea conturilor.
 */
exports.forgotPassword = (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email obligatoriu' });
    const db = getDatabase();
    const user = db.prepare('SELECT id, email FROM users WHERE email = ? AND is_active = 1').get(email);
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
      db.prepare(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
      ).run(user.id, token, expiresAt);
      // În producție: trimite email cu link „<APP_URL>/reset-password?token=XYZ".
      // În dev: log în consolă ca să poată fi copiat manual.
      const resetUrl = `${req.protocol}://${req.get('host').replace(':5001', ':3000')}/reset-password?token=${token}`;
      console.log(`[reset-password] token pentru ${user.email}: ${token}`);
      console.log(`[reset-password] URL: ${resetUrl}`);
      // Trimite emailul real dacă SMTP e configurat; altfel rămâne logat în consolă.
      try {
        const emailService = require('../services/emailService');
        emailService.sendPasswordReset(user.email, resetUrl).catch(() => {});
      } catch (_) { /* opțional */ }
    }
    // Răspuns generic — nu spunem dacă emailul există sau nu
    res.json({
      ok: true,
      message: 'Dacă acest email este înregistrat, vei primi în scurt timp un link de resetare.',
    });
  } catch (e) { next(e); }
};

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 * Validează tokenul, marchează ca folosit, actualizează parola.
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Token și parolă obligatorii' });
    if (password.length < 6) return res.status(400).json({ error: 'Parola trebuie să aibă cel puțin 6 caractere' });
    const db = getDatabase();
    const row = db.prepare(
      `SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ?`,
    ).get(token);
    if (!row) return res.status(400).json({ error: 'Token invalid sau expirat' });
    if (row.used_at) return res.status(400).json({ error: 'Acest token a fost deja folosit' });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Token expirat — solicită unul nou' });
    }
    const hash = await bcrypt.hash(password, 10);
    const tx = db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.user_id);
      db.prepare('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?').run(row.id);
    });
    tx();
    res.json({ ok: true, message: 'Parolă schimbată cu succes. Te poți autentifica.' });
  } catch (e) { next(e); }
};
