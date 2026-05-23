-- Migration 021: dezactivează întrebările vechi rămase active după migration 018
-- Pe Railway, migration 018 a INSERT-uit 24 itemi noi DAR UPDATE is_active=0
-- a rulat ÎNAINTE de inserts, deci itemii noi au început deja activi.
-- Acum: la fiecare boot, dezactivăm explicit itemii cu order_index între 1-13
-- care NU au coloana dimension setată (sunt cei vechi pre-migration 018).

UPDATE questions
SET is_active = 0
WHERE dimension IS NULL
  AND is_active = 1;
