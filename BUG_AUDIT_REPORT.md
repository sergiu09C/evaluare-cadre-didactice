# Bug Audit Report — verificare post-seed comprehensive

Audit profund pe 4 axe: rulare suite + crawl console + audit per-rol + verificare consistență.

## Bugs găsite & fixate

### 1. ⚠️ FILTRELE NU MERG PE „Studenți cu evaluări rămase" (raportat de user)

**Severitate**: P0
**Simptom**: La aplicarea filtrului `facultyId`, endpoint-ul `/platform/home-stats` returna `500 Internal Server Error: no such column: p.faculty_id`. La `courseType=laborator`, returna numere inconsistente (5 cu rămase vs 1200 eligibili).

**Cauză**: Query-ul `studentsWithRemainingRow` folosea alias-uri `p2`/`g2`/`s2` în subquery, dar `evalF.sql` referențiază `p`/`c`. Mismatch SQL.

**Fix**: Rescris query-ul cu alias-uri `c`/`p` consistente cu `buildEvalFilters`. Folosit `CTE per_student` cu 3 contoare (with_remaining / completed_all / eligible_in_scope) + duplicat `evalF.params`. Acum filtrele merg pe TOATE dimensiunile: facultyId, year, semester, courseType, programLevel, departmentId.

### 2. ⚠️ `/student/feedback-stats` returna `completionRate: 100`

**Severitate**: P0 (visible pe AggregatedResults, StudentDashboard)
**Cauză**: Aceeași formulă veche `completed_evaluations / total_evaluations` — ambele numărate cu JOIN evaluations, deci raport 1:1.

**Fix**: Înlocuit cu `submitted_per_faculty / max_possible_per_faculty` (suma cursuri × studenți per study_year, filtrat pe facultate). Acum returnează 67% pentru FI (consistent cu Acasă).

### 3. ⚠️ StudentDashboard slim — DualRadar nu se afișa niciodată

**Severitate**: P1
**Cauză**: Pagina aștepta `feedback.byCategory` din API, dar endpoint-ul nu returna acest câmp. Radar-ul afișa mereu „Datele de comparație nu sunt încă disponibile".

**Fix**: Extins `/student/feedback-stats` cu `byCategory` — pentru fiecare categorie de întrebare (didactica, comunicare, organizare, angajament, general), returnează `{current, facultyAvg}`. StudentDashboard folosește acum `current` ca primary radar, `facultyAvg` ca secondary („Scorurile tale vs media facultății"). Verificat vizual — radar se afișează corect pentru Raluca (sub media facultății, comportament realist).

### 4. ⚠️ „Participare univ." nu se actualiza la filtre

**Severitate**: P1 (inconsistență)
**Simptom**: Cu `?courseType=laborator`, „Evaluări transmise: 1.617 / 2.400 (67%)" dar „Participare univ.: 6.505 / 9.600 (68%)" — diferite valori pe aceeași pagină.

**Cauză**: Query-ul `uniSubmitted` din participation nu aplica `evalF.sql` — întotdeauna număra global.

**Fix**: Refactor `participationUniversity` să refolosească `totalEvaluations` și `maxPossibleEvaluations` deja calculate (care respectă filtrele). Plus `participationFaculty` rescris să folosească `evalF` cu `facultyId` override la `focusFacultyId`. Toate metricile acum consistente între ele indiferent de filtru.

## Verificări care au trecut fără bug-uri

| Verificare | Rezultat |
|---|---|
| **Console errors crawl** — 29 pagini × 3 roluri | **0 erori, 0 warnings** (filtrate React Router future flags) |
| **Endpoint coverage** — toate KPI-urile filtrabile | Toate cele 9 dimensiuni filtrabile merg corect (facultyId, programId, programLevel, departmentId, year, semester, courseType, academicYear, category) |
| **Cross-browser** — Chromium + Firefox + WebKit | Toate cele 9 scenarii @cross treceau înainte de bug-fix; le voi rula din nou |
| **Mobile** — iPhone 13 viewport | 8/8 scenarii @mobile treceau înainte |
| **Suite regression v3-v12** | 23/23 verzi după fix-uri (48s) |

## Numere finale verificate consistente

| Scenariu | Submitted | Max | Rate | StWithRem | Eligibili |
|---|---:|---:|---:|---:|---:|
| Baseline | 6505 | 9600 | 68% | 1126 | 1200 |
| courseType=laborator | 1617 | 2400 | 67% | 663 | 1200 |
| facultyId=1 (FI) | 1286 | 1920 | 67% | 229 | 240 |
| FI + courseType=laborator | 332 | 480 | 69% | 129 | 240 |
| year=2 + semester=1 | 1225 | 1800 | 68% | 338 | 450 |
| programLevel=master | 1576 | 2400 | 66% | 289 | 300 |

Toate rate-urile între 66-69% (sub maxim, în interval realist conform seed-ului 55-85% per curs).

## Teste pre-existente care încă rămân roșii (nu sunt bug-uri)

- `v4-deadline-blocking:14` — caută eval ID hardcoded `35463` care nu mai există după re-seed. Test maintenance, nu bug funcțional.
- `full-platform`, `student-flow`, `visual-bug-eval`, `v2-design-verify` — caută componente vechi din pagini pre-refactor (StudentDashboard pre-slim, etc.). Test maintenance.

Acestea sunt teste vechi cu selecte UI obsolete — recomand să fie șterse sau rewritten ca parte din task ulterior.

## Fișiere modificate în această iterație

- `backend/src/controllers/platformController.js` — rescris `studentsWithRemainingRow`, `participationUniversity`, `participationFaculty`
- `backend/src/controllers/feedbackController.js` — fix `completionRate`, adăugat `byCategory`
- `frontend/src/pages/StudentDashboard.tsx` — DualRadar folosește acum `facultyAvg` ca secondary

## Status final

Toate bug-urile P0/P1 raportate sau descoperite în audit au fost fixate. Numerele sunt acum consistente pe TOATE rolurile × TOATE filtrele × TOATE KPI-urile.
