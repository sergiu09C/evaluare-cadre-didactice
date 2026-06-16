-- Migration 033: limitează răspunsurile sintetice la max 300 evaluări submitted
-- Problemă: migration 028 generează un cross-join evaluări × 23 întrebări pe toate
-- evaluările existente → pe seed-ul de 1GB rezultă ~5.8GB de date noi → SQLITE_IOERR
-- pe Railway (free tier, ~5GB volum). Această migrație păstrează cele mai recente
-- 300 evaluări submitted (suficient pentru demo KPI/charts) și șterge restul.
-- Idempotentă: dacă sunt deja ≤ 300, nu face nimic.

DELETE FROM responses
WHERE evaluation_id NOT IN (
  SELECT id FROM evaluations
  WHERE status = 'submitted'
  ORDER BY COALESCE(submitted_at, started_at, id) DESC
  LIMIT 300
)
AND evaluation_id IN (
  SELECT id FROM evaluations WHERE status = 'submitted'
);

-- Curăță și completion_tokens orfane (evaluare submitted fără responses)
DELETE FROM completion_tokens
WHERE evaluation_id IN (
  SELECT e.id FROM evaluations e
  WHERE e.status = 'submitted'
    AND NOT EXISTS (
      SELECT 1 FROM responses r WHERE r.evaluation_id = e.id
    )
);

-- Curăță platform_feedback_responses duplicate (migration anterioară a generat
-- un cross-join → 128M rânduri pentru 2128 submissions × 5 întrebări).
-- Păstrează un singur rând per (submission_id, question_id).
DELETE FROM platform_feedback_responses
WHERE id NOT IN (
  SELECT MIN(id)
  FROM platform_feedback_responses
  GROUP BY submission_id, question_id
);
