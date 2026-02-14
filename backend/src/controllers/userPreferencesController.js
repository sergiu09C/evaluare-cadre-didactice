const { getDatabase } = require('../config/database');

/**
 * Get user accessibility preferences
 * GET /api/user/preferences
 */
exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id; // From JWT middleware
    const db = getDatabase();

    const preferences = db.prepare(`
      SELECT
        font_size,
        high_contrast,
        reduce_motion,
        theme,
        dyslexia_font
      FROM user_preferences
      WHERE user_id = ?
    `).get(userId);

    // If no preferences found, create default ones
    if (!preferences) {
      db.prepare(`
        INSERT INTO user_preferences (user_id, font_size, high_contrast, reduce_motion, theme, dyslexia_font)
        VALUES (?, 'normal', 0, 0, 'light', 0)
      `).run(userId);

      return res.json({
        preferences: {
          fontSize: 'normal',
          highContrast: false,
          reduceMotion: false,
          theme: 'light',
          dyslexiaFont: false,
        }
      });
    }

    // Convert snake_case to camelCase for frontend
    res.json({
      preferences: {
        fontSize: preferences.font_size,
        highContrast: Boolean(preferences.high_contrast),
        reduceMotion: Boolean(preferences.reduce_motion),
        theme: preferences.theme,
        dyslexiaFont: Boolean(preferences.dyslexia_font),
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update user accessibility preferences
 * PUT /api/user/preferences
 * Body: { fontSize, highContrast, reduceMotion, theme, dyslexiaFont }
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fontSize, highContrast, reduceMotion, theme, dyslexiaFont } = req.body;

    // Validation
    const validFontSizes = ['small', 'normal', 'large', 'extra-large'];
    const validThemes = ['light', 'dark', 'system'];

    if (fontSize && !validFontSizes.includes(fontSize)) {
      return res.status(400).json({ error: 'Invalid fontSize value. Must be one of: small, normal, large, extra-large' });
    }

    if (theme && !validThemes.includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme value. Must be one of: light, dark, system' });
    }

    const db = getDatabase();

    // Check if preferences exist
    const existing = db.prepare('SELECT id FROM user_preferences WHERE user_id = ?').get(userId);

    if (existing) {
      // Update existing
      const updates = [];
      const values = [];

      if (fontSize !== undefined) {
        updates.push('font_size = ?');
        values.push(fontSize);
      }
      if (highContrast !== undefined) {
        updates.push('high_contrast = ?');
        values.push(highContrast ? 1 : 0);
      }
      if (reduceMotion !== undefined) {
        updates.push('reduce_motion = ?');
        values.push(reduceMotion ? 1 : 0);
      }
      if (theme !== undefined) {
        updates.push('theme = ?');
        values.push(theme);
      }
      if (dyslexiaFont !== undefined) {
        updates.push('dyslexia_font = ?');
        values.push(dyslexiaFont ? 1 : 0);
      }

      if (updates.length > 0) {
        values.push(userId);
        db.prepare(`
          UPDATE user_preferences
          SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `).run(...values);
      }
    } else {
      // Insert new
      db.prepare(`
        INSERT INTO user_preferences (user_id, font_size, high_contrast, reduce_motion, theme, dyslexia_font)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        fontSize || 'normal',
        highContrast ? 1 : 0,
        reduceMotion ? 1 : 0,
        theme || 'light',
        dyslexiaFont ? 1 : 0
      );
    }

    // Return updated preferences
    const updated = db.prepare(`
      SELECT font_size, high_contrast, reduce_motion, theme, dyslexia_font
      FROM user_preferences
      WHERE user_id = ?
    `).get(userId);

    res.json({
      message: 'Preferences updated successfully',
      preferences: {
        fontSize: updated.font_size,
        highContrast: Boolean(updated.high_contrast),
        reduceMotion: Boolean(updated.reduce_motion),
        theme: updated.theme,
        dyslexiaFont: Boolean(updated.dyslexia_font),
      }
    });

  } catch (error) {
    next(error);
  }
};
