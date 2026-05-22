const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getDatabase } = require('../config/database');

// GET /api/guides/:role — public (orice utilizator autenticat)
router.get('/:role', authenticateToken, (req, res, next) => {
  try {
    const { role } = req.params;
    if (!['student', 'professor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rol invalid' });
    }
    const row = getDatabase().prepare('SELECT role, title, body, updated_at FROM guides WHERE role = ?').get(role);
    if (!row) return res.status(404).json({ error: 'Ghid nedefinit' });
    res.json(row);
  } catch (e) { next(e); }
});

// GET /api/guides — toate (admin)
router.get('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const rows = getDatabase().prepare('SELECT role, title, body, updated_at FROM guides ORDER BY role').all();
    res.json({ guides: rows });
  } catch (e) { next(e); }
});

// PUT /api/guides/:role — admin
router.put('/:role', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { role } = req.params;
    const { title, body } = req.body || {};
    if (!['student', 'professor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rol invalid' });
    }
    if (!title || !body) return res.status(400).json({ error: 'Titlu și conținut obligatorii' });
    getDatabase()
      .prepare('UPDATE guides SET title = ?, body = ?, updated_at = CURRENT_TIMESTAMP WHERE role = ?')
      .run(title, body, role);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
