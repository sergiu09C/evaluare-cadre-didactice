const { getDatabase } = require('../config/database');

/**
 * Seed script to generate realistic evaluation responses
 * This adds completed evaluations with varied responses for data visualization
 */
function seedResponses() {
  console.log('\n🌱 Seeding database with realistic evaluation responses...\n');

  const db = getDatabase();

  try {
    // Get all evaluations that exist
    const evaluations = db.prepare(`
      SELECT e.id, e.student_id, e.course_id, e.professor_id, e.status
      FROM evaluations e
    `).all();

    if (evaluations.length === 0) {
      console.log('❌ No evaluations found. Please run seed-extended.js first.');
      return;
    }

    console.log(`📊 Found ${evaluations.length} evaluations`);

    // Get all questions
    const questions = db.prepare('SELECT id, type FROM questions ORDER BY order_index').all();
    console.log(`❓ Found ${questions.length} questions`);

    // Statistics
    let completedCount = 0;
    let responsesCount = 0;

    // Complete 60-80% of evaluations with realistic responses
    evaluations.forEach((evaluation, index) => {
      // Random completion rate between 60-80%
      const completionChance = 0.6 + Math.random() * 0.2;

      if (Math.random() < completionChance) {
        // Mark evaluation as submitted
        const submittedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random time in last 30 days

        db.prepare(`
          UPDATE evaluations
          SET status = 'submitted',
              submitted_at = ?
          WHERE id = ?
        `).run(submittedAt.toISOString(), evaluation.id);

        // Generate responses for each question
        questions.forEach((question) => {
          if (question.type === 'likert') {
            // Generate realistic Likert scores with normal distribution
            // Most scores between 3-5, with occasional 1-2
            const random = Math.random();
            let score;

            if (random < 0.05) {
              score = 1; // 5% chance of score 1
            } else if (random < 0.15) {
              score = 2; // 10% chance of score 2
            } else if (random < 0.35) {
              score = 3; // 20% chance of score 3
            } else if (random < 0.70) {
              score = 4; // 35% chance of score 4
            } else {
              score = 5; // 30% chance of score 5
            }

            db.prepare(`
              INSERT INTO responses (evaluation_id, question_id, response_likert)
              VALUES (?, ?, ?)
            `).run(evaluation.id, question.id, score);

            responsesCount++;
          } else if (question.type === 'text') {
            // Generate text responses for some evaluations (30% chance)
            if (Math.random() < 0.3) {
              const textResponses = [
                'Foarte bună prezentarea materialului.',
                'Profesor dedicat și pasionat de materie.',
                'Cursul ar putea fi mai interactiv.',
                'Explicațiile sunt clare și concise.',
                'Materialele de curs sunt foarte utile.',
                'Ar fi util să avem mai multe exemple practice.',
                'Profesorul este disponibil pentru întrebări.',
                'Cursul este bine structurat.',
                'Evaluarea este corectă și transparentă.',
                'Recomand cursul.',
                'Foarte mulțumit de calitatea predării.',
                'Subiectul este prezentat într-un mod interesant.',
                '',
              ];

              const response = textResponses[Math.floor(Math.random() * textResponses.length)];

              if (response) {
                db.prepare(`
                  INSERT INTO responses (evaluation_id, question_id, response_text)
                  VALUES (?, ?, ?)
                `).run(evaluation.id, question.id, response);

                responsesCount++;
              }
            }
          }
        });

        completedCount++;
      } else if (Math.random() < 0.1) {
        // 10% of remaining are drafts with partial responses
        db.prepare(`
          UPDATE evaluations
          SET status = 'draft',
              started_at = ?
          WHERE id = ?
        `).run(new Date().toISOString(), evaluation.id);

        // Add some partial responses (2-5 questions)
        const numPartialResponses = 2 + Math.floor(Math.random() * 4);
        const selectedQuestions = questions
          .filter(q => q.type === 'likert')
          .sort(() => Math.random() - 0.5)
          .slice(0, numPartialResponses);

        selectedQuestions.forEach((question) => {
          const score = 3 + Math.floor(Math.random() * 3); // 3-5
          db.prepare(`
            INSERT INTO responses (evaluation_id, question_id, response_likert)
            VALUES (?, ?, ?)
          `).run(evaluation.id, question.id, score);
          responsesCount++;
        });
      }
    });

    console.log(`\n✅ Seed completed successfully!`);
    console.log(`\n📊 Statistics:`);
    console.log(`  - Total evaluations: ${evaluations.length}`);
    console.log(`  - Completed evaluations: ${completedCount} (${(completedCount / evaluations.length * 100).toFixed(1)}%)`);
    console.log(`  - Total responses: ${responsesCount}`);
    console.log(`  - Average responses per completed evaluation: ${(responsesCount / completedCount).toFixed(1)}`);

    // Show sample statistics
    const avgScores = db.prepare(`
      SELECT
        AVG(r.response_likert) as avg_score,
        COUNT(*) as response_count
      FROM responses r
      WHERE r.response_likert IS NOT NULL
    `).get();

    console.log(`\n📈 Response Quality:`);
    console.log(`  - Average Likert score: ${avgScores.avg_score ? avgScores.avg_score.toFixed(2) : 'N/A'}`);
    console.log(`  - Total Likert responses: ${avgScores.response_count}`);

    const textResponseCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM responses
      WHERE response_text IS NOT NULL AND response_text != ''
    `).get();

    console.log(`  - Text responses: ${textResponseCount.count}`);

  } catch (error) {
    console.error('❌ Error seeding responses:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  const db = getDatabase();

  // Check if database has data
  const hasData = db.prepare('SELECT COUNT(*) as count FROM evaluations').get();

  if (hasData.count === 0) {
    console.log('❌ No evaluations found in database.');
    console.log('💡 Please run: npm run seed');
    process.exit(1);
  }

  // Clear existing responses only
  console.log('🧹 Clearing existing responses...');
  db.prepare('DELETE FROM responses').run();
  console.log('✓ Existing responses cleared\n');

  seedResponses();
  process.exit(0);
}

module.exports = { seedResponses };
