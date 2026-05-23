/**
 * Audit log helper — folosit de controllerele admin pentru a înregistra
 * acțiuni cu impact (create/update/delete user, publish closing-loop, etc.).
 * Conform CF-14 din dizertație + cerințe GDPR.
 *
 * Folosire: `auditLog(req, 'user.create', 'user', newUserId, { email, role })`.
 */
const { getDatabase } = require('../config/database');

function auditLog(req, action, targetType = null, targetId = null, details = null) {
  try {
    const db = getDatabase();
    const user = req.user || {};
    db.prepare(
      `INSERT INTO audit_log (user_id, user_role, user_email, action, target_type, target_id, details, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      user.id || null,
      user.role || null,
      user.email || null,
      action,
      targetType,
      targetId != null ? String(targetId) : null,
      details ? JSON.stringify(details) : null,
      req.ip || req.connection?.remoteAddress || null,
    );
  } catch (e) {
    // Audit log eroare nu trebuie să blocheze acțiunea principală
    console.error('[audit] failed to log:', e.message);
  }
}

module.exports = { auditLog };
