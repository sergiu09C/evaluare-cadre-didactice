const { getDatabase } = require('../config/database');

// Categorii standardizate conform Anexa A1 + migration 018-19-items-questionnaire.sql.
// Tuplul (category, dimension) reflectă structura validată psihometric:
//   D1 Predare → didactica, D2 Comunicare → comunicare, D3 Resurse → organizare,
//   D4 Evaluare/Feedback → general, D5 Disponibilitate → angajament,
//   item global → global, contextualizare → context.
const CATEGORY_ENUM = ['didactica', 'comunicare', 'organizare', 'general', 'angajament', 'global', 'context'];
const DIMENSION_ENUM = ['D1', 'D2', 'D3', 'D4', 'D5', 'GLOBAL', 'CONTEXT', 'COMMENT'];

exports.CATEGORY_ENUM = CATEGORY_ENUM;
exports.DIMENSION_ENUM = DIMENSION_ENUM;

/**
 * GET /api/questions
 * Get all questions for the questionnaire
 */
exports.getAllQuestions = (req, res) => {
  try {
    const db = getDatabase();
    const questions = db.prepare(`
      SELECT id, text, type, category, dimension, is_contextual,
             order_index, is_required
      FROM questions
      WHERE is_active = 1
      ORDER BY order_index ASC
    `).all();

    res.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Eroare la încărcarea întrebărilor' });
  }
};

/**
 * POST /api/questions
 * Create a new question
 */
exports.createQuestion = (req, res) => {
  try {
    const { text, type, category, dimension, order_index, is_required, is_contextual } = req.body;

    if (!text || !type || !category) {
      return res.status(400).json({ error: 'Text, tip și categorie sunt obligatorii' });
    }

    if (!['likert', 'text'].includes(type)) {
      return res.status(400).json({ error: 'Tipul trebuie să fie likert sau text' });
    }

    if (!CATEGORY_ENUM.includes(category)) {
      return res.status(400).json({
        error: `Categorie invalidă. Valori permise: ${CATEGORY_ENUM.join(', ')}`,
      });
    }

    if (dimension && !DIMENSION_ENUM.includes(dimension)) {
      return res.status(400).json({
        error: `Dimensiune invalidă. Valori permise: ${DIMENSION_ENUM.join(', ')}`,
      });
    }

    const db = getDatabase();

    // If no order_index provided, add to end
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const maxOrder = db.prepare('SELECT MAX(order_index) as max FROM questions').get();
      finalOrderIndex = (maxOrder.max || 0) + 1;
    }

    const result = db.prepare(`
      INSERT INTO questions (text, type, category, dimension, is_contextual, order_index, is_required)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      text,
      type,
      category,
      dimension || null,
      is_contextual ? 1 : 0,
      finalOrderIndex,
      is_required ? 1 : 0,
    );

    const newQuestion = db.prepare('SELECT * FROM questions WHERE id = ?').get(result.lastInsertRowid);

    res.json({ message: 'Întrebare creată cu succes', question: newQuestion });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Eroare la crearea întrebării' });
  }
};

/**
 * PUT /api/questions/:id
 * Update a question
 */
exports.updateQuestion = (req, res) => {
  try {
    const { id } = req.params;
    const { text, type, category, dimension, order_index, is_required, is_contextual } = req.body;

    if (!text || !type || !category) {
      return res.status(400).json({ error: 'Text, tip și categorie sunt obligatorii' });
    }

    if (!['likert', 'text'].includes(type)) {
      return res.status(400).json({ error: 'Tipul trebuie să fie likert sau text' });
    }

    if (!CATEGORY_ENUM.includes(category)) {
      return res.status(400).json({
        error: `Categorie invalidă. Valori permise: ${CATEGORY_ENUM.join(', ')}`,
      });
    }

    if (dimension && !DIMENSION_ENUM.includes(dimension)) {
      return res.status(400).json({
        error: `Dimensiune invalidă. Valori permise: ${DIMENSION_ENUM.join(', ')}`,
      });
    }

    const db = getDatabase();

    // Preserve existing order_index if not provided (better-sqlite3 doesn't accept undefined)
    const existing = db.prepare('SELECT order_index, dimension, is_contextual FROM questions WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Întrebarea nu a fost găsită' });
    }
    const orderIdx = order_index ?? existing.order_index;
    const dimVal = dimension !== undefined ? (dimension || null) : existing.dimension;
    const ctxVal = is_contextual !== undefined ? (is_contextual ? 1 : 0) : existing.is_contextual;

    const result = db.prepare(`
      UPDATE questions
      SET text = ?, type = ?, category = ?, dimension = ?, is_contextual = ?, order_index = ?, is_required = ?
      WHERE id = ?
    `).run(text, type, category, dimVal, ctxVal, orderIdx, is_required ? 1 : 0, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Întrebarea nu a fost găsită' });
    }

    const updatedQuestion = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);

    res.json({ message: 'Întrebare actualizată cu succes', question: updatedQuestion });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Eroare la actualizarea întrebării', detail: error.message });
  }
};

/**
 * DELETE /api/questions/:id
 * Delete a question
 */
exports.deleteQuestion = (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if question has responses
    const hasResponses = db.prepare('SELECT COUNT(*) as count FROM responses WHERE question_id = ?').get(id);

    if (hasResponses.count > 0) {
      return res.status(400).json({
        error: 'Nu se poate șterge întrebarea deoarece există răspunsuri asociate'
      });
    }

    const result = db.prepare('DELETE FROM questions WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Întrebarea nu a fost găsită' });
    }

    res.json({ message: 'Întrebare ștearsă cu succes' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Eroare la ștergerea întrebării' });
  }
};

/**
 * POST /api/questions/reorder
 * Reorder questions
 */
exports.reorderQuestions = (req, res) => {
  try {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'Lista de ID-uri este invalidă' });
    }

    const db = getDatabase();

    // Update order_index for each question
    const updateStmt = db.prepare('UPDATE questions SET order_index = ? WHERE id = ?');

    questionIds.forEach((id, index) => {
      updateStmt.run(index + 1, id);
    });

    res.json({ message: 'Ordinea întrebărilor a fost actualizată' });
  } catch (error) {
    console.error('Error reordering questions:', error);
    res.status(500).json({ error: 'Eroare la reordonarea întrebărilor' });
  }
};
