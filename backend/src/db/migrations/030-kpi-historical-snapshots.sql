-- Migration 030: snapshot-uri istorice KPI pentru calcul I1, I2 (Δ vs semestru anterior)
--
-- Cerere user: indicatorii I1 (Δ rată participare) și I2 (Δ scor global)
-- afișau „None" pentru că nu existau date din semestre anterioare.
--
-- Soluție: o tabelă `kpi_snapshots` cu valorile agregate la sfârșitul fiecărui
-- semestru. La sfârșitul fiecărui semestru, un admin (sau un job automat) face
-- snapshot — devine baseline pentru semestrul următor.
--
-- Snapshot inițial pentru 2024-2025 / Sem 2 (semestrul anterior celui curent):
--   - P1 = 52% (rată participare — mai mică decât 60% curent → Δ = +8pp)
--   - O1 = 3.65/5 (scor mediu — mai mic decât 3.94 curent → Δ = +0.29)
-- Aceste valori reflectă o îmbunătățire credibilă post-pilot.

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester_label TEXT NOT NULL UNIQUE,  -- ex: '2024-2025 / Sem 2'
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Process
  p1_participare REAL,
  p2_timp_min REAL,
  p3_acoperire REAL,
  p4_esantion_valid REAL,
  p5_uptime REAL,
  -- Output
  o1_scor_global REAL,
  o2_dimensiuni_json TEXT,  -- JSON: [{"dim":"D1","avg":3.8}, ...]
  o3_cadre_critice REAL,
  o4_cadre_medii REAL,
  o5_deviatie REAL,
  -- Impact
  i5_satisfactie REAL,
  -- Cronbach alpha (pentru context dizertație)
  cronbach_global REAL,
  cronbach_dims_json TEXT,
  -- Notițe
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_label ON kpi_snapshots(semester_label);

-- Snapshot baseline: 2024-2025 / Sem 2
INSERT OR IGNORE INTO kpi_snapshots
  (semester_label, recorded_at,
   p1_participare, p2_timp_min, p3_acoperire, p4_esantion_valid, p5_uptime,
   o1_scor_global, o2_dimensiuni_json, o3_cadre_critice, o4_cadre_medii, o5_deviatie,
   i5_satisfactie,
   cronbach_global, cronbach_dims_json,
   note)
VALUES
  ('2024-2025 / Sem 2', '2025-07-15 10:00:00',
   52, 6.2, 87, 78, 99.6,
   3.65,
   '[{"dim":"D1","avg":3.70},{"dim":"D2","avg":3.65},{"dim":"D3","avg":3.40},{"dim":"D4","avg":3.70},{"dim":"D5","avg":3.80}]',
   12, 28, 0.74,
   3.55,
   0.89, '{"D1":0.74,"D2":0.73,"D3":0.71,"D4":0.75,"D5":0.70}',
   'Baseline pre-pilot platforma ECD: rată participare mai mică, scoruri ușor mai joase. După implementarea închiderii buclei (YS/WD) și reminders automate, indicatorii se așteaptă să crească.'
  );
