const { getDatabase } = require('../config/database');

/**
 * Middleware to check if platform is active
 * Blocks students (NOT admins) when platform is closed
 */
exports.checkPlatformActive = (req, res, next) => {
  try {
    // Skip check for:
    // 1. Admin users (they can always access)
    // 2. Auth routes (need to be able to login)
    // 3. Platform settings routes (admins need to turn it back on)
    if (
      req.user?.role === 'admin' ||
      req.originalUrl.includes('/auth') ||
      req.originalUrl.includes('/platform/settings') ||
      req.originalUrl.includes('/platform/status') ||
      req.originalUrl.includes('/closing-the-loop') ||
      req.originalUrl.includes('/notifications') ||
      req.originalUrl.includes('/guides') ||
      req.originalUrl.includes('/achievements') ||
      req.originalUrl.includes('/platform-feedback') ||
      req.originalUrl.includes('/actions') ||
      req.originalUrl.includes('/public-stats')
    ) {
      return next();
    }

    const db = getDatabase();
    const settings = db.prepare('SELECT is_active, closure_message FROM platform_settings WHERE id = 1').get();

    // If no settings exist, assume platform is active (fail-safe)
    if (!settings) {
      console.warn('⚠️  Platform settings not found, defaulting to active');
      return next();
    }

    // Check if platform is active
    if (!settings.is_active) {
      return res.status(503).json({
        error: 'Platforma este temporar închisă',
        message: settings.closure_message || 'Platforma de evaluare este momentan închisă.',
        platformClosed: true
      });
    }

    next();
  } catch (error) {
    console.error('Error checking platform status:', error);
    // On error, allow access (fail-safe)
    next();
  }
};
