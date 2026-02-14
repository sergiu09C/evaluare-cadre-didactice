const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

/**
 * Middleware pentru verificare acces profesor
 * Verifică că utilizatorul autentificat are rol = 'professor'
 * și extrage professorId din baza de date
 */
function requireProfessor(req, res, next) {
  try {
    // Verifică dacă utilizatorul este autentificat (verificat deja de authenticateToken)
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verifică dacă utilizatorul are rol de profesor
    if (req.user.role !== 'professor') {
      return res.status(403).json({ error: 'Professor access required' });
    }

    // Extrage professor_id din users pentru acest utilizator
    const db = getDatabase();
    const userData = db.prepare(`
      SELECT professor_id
      FROM users
      WHERE id = ? AND role = 'professor'
    `).get(req.user.id);

    if (!userData || !userData.professor_id) {
      return res.status(403).json({ error: 'Professor account not properly configured' });
    }

    // Adaugă professorId la request pentru folosire în controller
    req.professorId = userData.professor_id;

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error verifying professor access' });
  }
}

module.exports = {
  requireProfessor
};
