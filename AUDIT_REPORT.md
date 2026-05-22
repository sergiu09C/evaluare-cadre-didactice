# AUDIT REPORT — ECD (Evaluarea Cadrelor Didactice)

> ETAPA 1 din prompt-ul `CLAUDE_CODE_PROMPT_RICH_DASHBOARDS.md`.
> Generat din starea reală a DB (`backend/src/db/evaluare.db`) și a codului la 2026-05-21.

## 1. Date și dimensiuni

### 1.1 Tabele (27) și cardinalități reale

| Tabel | Rânduri | Comentariu |
|---|---:|---|
| `users` | 1401 | 1200 student + 200 professor + 1 admin |
| `professors` | 200 | toți au cont (după seed-missing-prof-accounts.js) |
| `faculties` | 5 | FI, FMI, FF, FET, FAC |
| `programs` | 15 | 10 licență + 5 master |
| `study_years` | 40 | 15 anul I, 15 anul II, 10 anul III |
| `series` | 80 | 2 serii / `study_year` (A, B) |
| `groups` | 240 | 3 grupe / serie |
| `courses` | 320 | 160 sem1, 160 sem2; 160 curs + 80 sem + 80 lab; toate `2023-2024` |
| `questions` | 13 | 10 likert + 3 text liber; categorii: didactica, organizare, comunicare, angajament, general, puncte_forte, imbunatatiri, altele |
| `evaluations` | 5899 | 5896 submitted + 3 draft, granularitate (student, course, professor) |
| `responses` | 64210 | medie ~10.9 răspunsuri / evaluare; 5250 NULL likert (=text liber); avg likert pe non-null ≈ 3.58 |
| `professor_actions` | 1 | doar 1 proposed — date sărace, candidat pentru seed mai bogat |
| `closing_loop_entries` | 3 | — |
| `platform_feedback_questions` | 5 | active pentru student+professor |
| `platform_feedback_responses` | 7 | UNIQUE(user_id, question_id) |
| `platform_feedback_messages` | 1 | mesaje free-form + closing-loop |
| `student_messages` | 7 | mesaje admin → studenți |
| `achievement_definitions` | 6 | 6 badge-uri |
| `user_achievements` | 2 | unlocked |
| `action_templates` | 6 | template-uri pentru CEAC |
| `guides` | 3 | ghiduri per rol |
| `evaluation_periods` | 1 | — |
| `platform_settings` | 1 | settings singletonu — `is_active`, `evaluation_deadline_date` |
| `reminders_log` | 0 | — |
| `user_preferences` | 3 | per user |

### 1.2 Vederi (4)

- `student_details` — JOIN users + programs + faculties (după backfill 013 e funcțional)
- `professor_details` — JOIN professors + faculties
- `professor_stats` — agregat avg + count per profesor
- `completion_rates` — rate completare per profesor

### 1.3 Dimensiuni filtrante extractibile

| Dimensiune | Tabel sursă | Cardinalitate | Folosit acum? |
|---|---|---:|---|
| Facultate | `faculties.id` | 5 | da (`/platform/home-stats?facultyId=`) |
| Departament | `professors.department` | ~20 valori unice (top 8: Termodinamică, Telecomunicații, Statistică, Sisteme de Control, Sisteme Embedded, Robotică, Programare, Procesare Semnale) | NU expus |
| Program | `programs.id` | 15 | NU expus în filtre globale |
| Nivel program | `programs.level` | 2 (licenta, master) | NU expus |
| An academic | `courses.academic_year` | 1 (`2023-2024`) | NU expus |
| Semestru | `courses.semester` | 2 (`1`, `2`) | NU expus în Acasă |
| Tip curs | `courses.course_type` | 3 (`curs`, `laborator`, `seminar`) | NU expus în Acasă |
| Categorie întrebare | `questions.category` | 8 (didactica, organizare, comunicare, angajament, general, puncte_forte, imbunatatiri, altele) | parțial (radar) |
| Tip întrebare | `questions.type` | 2 (`likert`, `text`) | NU expus |
| Status evaluare | `evaluations.status` | 2 (`draft`, `submitted`) | implicit (filtru pe submitted) |
| Interval temporal | `evaluations.submitted_at` | range 2023-12 → 2024-07 | slider 30-730 zile |
| Anul de studiu | `study_years.year_number` | 3 (1, 2, 3) | NU expus |
| Status acțiune CEAC | `professor_actions.status` | 4 (proposed/accepted/completed/rejected) | NU expus în Acasă |
| Status mesaj feedback | `platform_feedback_messages.status` | 4 (open/in_progress/answered/closed) | NU expus în Acasă |
| Rol utilizator | `users.role` | 3 | doar pe AdminUsers |
| Titlu profesor | `professors.title` | mai multe (Prof. Dr., Conf. Dr., Lect. Dr., Asist. Drd.) | NU expus |

### 1.4 Metrici cuantitative extractibile

- **Counts**: utilizatori per rol, evaluări per status/facultate/curs/profesor, mesaje per status, acțiuni per status
- **Avg**: scor Likert global / per facultate / per departament / per program / per profesor / per categorie întrebare / per semestru / per nivel
- **Distribuții**: scoruri 1-5 (semantice: 1-2 negativ, 3 neutru, 4-5 pozitiv), tipuri întrebare, roluri
- **Rate**: completion rate (submitted/eligible), closing-loop rate, completare per facultate
- **Time series**: submisii pe zi/săptămână/lună (range 2023-12 → 2024-07), evaluări per semestru/an
- **Top-N**: top profesori după scor mediu, top discipline după număr evaluări, departamente cu cele mai bune scoruri

---

## 2. Endpoint-uri existente

### 2.1 Public / auth common (any role)

| Path | Method | Returnează |
|---|---|---|
| `/api/public-stats` | GET (no auth) | participation_rate, avg_score, submitted_count, total_students, is_active, deadline |
| `/api/platform/status` | GET | is_active, closure_message, deadline, deadline_passed, evaluations_accepted, platform_feedback_active |
| `/api/platform/lifecycle-summary` | GET | pipeline 6 etape + closing_loop + personal stats per rol |
| `/api/platform/home-stats` | GET | hero KPIs + scoreDistribution + facultyBreakdown + timeSeries + categoryAverages + roleDistribution + pipeline + personal — accepts `?facultyId&days` |

### 2.2 Auth (student-facing)

| Path | Method | Returnează |
|---|---|---|
| `/api/auth/me` | GET | user profile |
| `/api/evaluations/professors` | GET | lista cu profesori de evaluat |
| `/api/evaluations/status` | GET | total / completed / draft / not_started + breakdown |
| `/api/evaluations/:id` | GET | evaluare + întrebări + răspunsuri |
| `/api/feedback/feedback-stats` | GET | aggregated student feedback |
| `/api/feedback/achievements` | GET | static achievements |
| `/api/feedback/evaluation-history` | GET | history student |
| `/api/feedback/notifications` | GET | live notifications |
| `/api/platform-feedback/questions` | GET | întrebări chestionar |
| `/api/platform-feedback/messages/mine` | GET | mesaje free-form ale userului |
| `/api/actions/my` | GET | acțiuni CEAC pentru profesor curent |
| `/api/achievements/user` | GET | achievement-urile userului |
| `/api/guides/:role` | GET | ghid live |

### 2.3 Professor-only

| Path | Method | Returnează |
|---|---|---|
| `/api/professor/dashboard` | GET | summary + scoreDistribution + categoryAverages + per-course + trend |
| `/api/professor/courses` | GET | cursurile mele |
| `/api/professor/courses/:id/stats` | GET | distribuție per întrebare cu medie |
| `/api/professor/courses/:id/evaluations` | GET | drill-down anonim, k=5 |
| `/api/professor/evaluations` | GET | lista (paginată) cu medii |
| `/api/professor/evaluations/:id/details` | GET | scoruri + texte per evaluare |
| `/api/professor/students-list` | GET | studenți cu nume complet (no eval flag) |
| `/api/professor/trend` | GET | trend per sem/an |
| `/api/professor/export` | GET | CSV export |

### 2.4 Admin-only

| Path | Method | Returnează |
|---|---|---|
| `/api/admin/dashboard` | GET | dashboard global |
| `/api/admin/filter-options` | GET | opțiuni filtre |
| `/api/admin/stats/completion` | GET | rate per profesor |
| `/api/admin/stats/professor/:id` | GET | drill-down profesor |
| `/api/admin/stats/filtered` | GET | aggregated cu filtre |
| `/api/admin/stats/discipline` | GET | comparație discipline |
| `/api/admin/stats/by-year` | GET | comparație an |
| `/api/admin/stats/by-course-type` | GET | comparație tip curs |
| `/api/admin/professors` | GET | lista profesori |
| `/api/admin/users` + `/users/counts` | GET | utilizatori + counts stabile per rol |
| `/api/admin/courses/names` | GET | cursuri |
| `/api/closing-loop` (admin) | GET | entries |
| `/api/platform/filters/options` | GET | filtre globale |
| `/api/platform/messages/history` | GET | history mesaje admin |
| `/api/platform-feedback/admin/questions` | GET | editor |
| `/api/platform-feedback/admin/report` | GET | rapoarte chestionar |
| `/api/platform-feedback/admin/messages` | GET | mesaje free-form |
| `/api/actions/admin/list` | GET | acțiuni propuse |
| `/api/actions/admin/summary` | GET | agregat acțiuni |

### 2.5 Observații pe endpoints

- `/api/platform/home-stats` (creat recent) e cel mai complet pentru Acasă, dar acceptă DOAR `facultyId+days`. Lipsesc: filtre pe semestru, an academic, tip curs, categorie întrebare, anul de studiu, nivel program, status acțiune.
- `/api/admin/stats/filtered` are filtre granulare (în AdminReports), dar e admin-only — datele se pot expune și pe Acasă dacă agregăm public-friendly.
- NU există endpoint generic "heatmap" (program × an, facultate × categorie, departament × scor).
- NU există endpoint pentru top-N rankings (top profesori, top discipline) public-friendly.

---

## 3. Pagini frontend și ce afișează acum

### 3.1 Pagina Acasă (toate rolurile)

`EvaluationLifecycle.tsx` (rutele `/`, `/professor`, `/admin`)

- Hero: 6 KPICards (studenți, profesori, evaluări, ultima lună, scor mediu, rată)
- Filtre: Select facultate, slider zile (30-730)
- Grafice prezente:
  - Pie scoruri Likert
  - Bar evaluări per facultate (clickable → setează filtrul)
  - Area chart submisii în timp
  - Donut roluri active
  - DualRadar categorii întrebare
- Pipeline 6 etape (cards)
- Personal impact per rol (4 KPI)
- Closing-loop bar

### 3.2 Pagini student (lazy-load)

| Ruta | Pagină | Conținut |
|---|---|---|
| `/dashboard` | `StudentDashboard.tsx` | hero + DualRadar (curent vs anterior) + cards skeleton |
| `/evaluations` | `ActiveEvaluations.tsx` | listă profesori cu status + banner deadline |
| `/evaluation/:id` | `EvaluationForm.tsx` | formular 19 întrebări + auto-save |
| `/history` | `EvaluationHistory.tsx` | istoric submisii |
| `/results` | `AggregatedResults.tsx` | rezultate agregate pentru student |
| `/achievements` | `Achievements.tsx` | badge-uri unlocked |
| `/feedback` | `PlatformFeedback.tsx` | chestionar + mesaje free-form + closing-loop visibility |

### 3.3 Pagini profesor

| Ruta | Pagină | Conținut |
|---|---|---|
| `/professor/dashboard` | `ProfessorDashboard.tsx` | KPI 4 + Pie scoruri + Bar per curs + Radar categorii + Line trend |
| `/professor/courses` | `ProfessorCourses.tsx` | lista cursurilor |
| `/professor/courses/:id` | `ProfessorCourseDetails.tsx` | distribuție per întrebare + StackedSemanticBar + drill-down individual |
| `/professor/students` | `ProfessorStudents.tsx` | listă nume complete (no eval flag) + KPI agregate |
| `/professor/actions` | `ProfessorActions.tsx` | acțiuni CEAC + closing-loop |
| `/professor/reports` | `ProfessorReports.tsx` | listă evaluări clickable → drill-down |
| `/professor/evaluations/:id` | `ProfessorEvaluationDetails.tsx` | detalii scoruri + texte + KPI |

### 3.4 Pagini admin

| Ruta | Pagină | Conținut |
|---|---|---|
| `/admin/dashboard` | `AdminDashboard.tsx` | dashboard global cu Recharts |
| `/admin/reports` | `AdminReports.tsx` | rapoarte cu filtre granulare |
| `/admin/users` | `AdminUsers.tsx` | CRUD + counts stabile |
| `/admin/controls` | `AdminControls.tsx` | settings platform + closing message |
| `/admin/closing-loop` | `AdminClosingLoop.tsx` | entries closing-loop |
| `/admin/guides` | `AdminGuides.tsx` | editor ghiduri |
| `/admin/achievements` | `AdminAchievements.tsx` | editor badge-uri |
| `/admin/platform-feedback` | `AdminPlatformFeedback.tsx` | editor chestionar + report + tab mesaje |

### 3.5 Componente charts existente

- `frontend/src/components/charts/DualRadar.tsx` — radar SVG nativ cu 2 serii suprapuse, hover targets, legend
- `frontend/src/components/charts/StackedSemanticBar.tsx` — Recharts BarChart vertical cu 3 stacks semantice (Negativ 1-2 / Neutru 3 / Pozitiv 4-5) + ReferenceLine

Recharts e folosit în 6 fișiere: `AdminPlatformFeedback`, `AdminReports`, `EvaluationLifecycle`, `ProfessorDashboard`, `ProfessorDetails`, `StackedSemanticBar`.

### 3.6 Slidere range

- Doar 1 slider există acum: `EvaluationLifecycle.tsx` (interval zile time series).
- Toate celelalte filtre sunt Select sau Input.

---

## 4. Design system și componente reutilizabile

### 4.1 Tokens CSS (`frontend/src/styles/tokens.css`)

- **Primary** (navy): `--ecd-primary-50` … `--ecd-primary-900` (base `#0E2233`)
- **Accent** (violet): `--ecd-accent-50` … `--ecd-accent-900` (base `#7C3AED`)
- **Neutral**: `--ecd-neutral-0` (white) … `--ecd-neutral-900`
- **Semantic**: `--ecd-success`, `--ecd-success-bg`, `--ecd-success-fg`, `--ecd-warning*`, `--ecd-danger*`, `--ecd-info*`
- **Surfaces**: `--ecd-bg`, `--ecd-surface`, `--ecd-border`, `--ecd-border-soft`, `--ecd-text`, `--ecd-text-soft`
- **Dark mode**: override via `[data-theme="dark"]` din `tokens-dark.css`

### 4.2 Componente UI (`frontend/src/components/ui/`)

`Avatar`, `Badge`, `Button`, `Card` (tone: default/success/warning/danger/info), `EmptyState` (cu illustration prop), `Input` (prefix slot), `KPICard` (label/value/suffix/delta/trend/footnote), `Progress`, `Select`, `Skeleton` (skel + variante KPI/CardList/Chart/Radar), `SortHeader`, `Switch`, `Tabs` + `TabPanel`

### 4.3 Componente cross-cutting

- `Toast.tsx` cu `ToastProvider` + `useToast()` API: `push({tone, title, desc?, action?, duration?})`
- `AccessibilityMenu.tsx` cu toggle dark mode + reduced motion
- `DeadlineTimer.tsx` cu 3 variante (inline/compact/card) + prop `platformClosed`
- `AchievementUnlock.tsx` cu confetti
- `Layout.tsx` cu sidebar nav + header sticky + banner platform closed global

### 4.4 Ilustrații

`frontend/src/components/illustrations/index.tsx` — 10 SVG line-art (IllInbox, IllChecklistDone, IllBooks, IllUsers, IllChatBubble, IllSearch, IllPlugDisconnect, IllChart, IllTrophy, IllError)

---

## 5. Conturi de test verificate

Confirmat din `tests/e2e/*.spec.ts`:

| Rol | Email | Parolă |
|---|---|---|
| Student | `student1@univ.ro` | `password123` |
| Profesor | `vasile.popescu.1@prof.univ.ro` | `password123` |
| Admin | `admin@univ.ro` | `password123` |

Există 1200 conturi student + 200 conturi profesor (toți reali). Profesori multipli cu același nume „Vasile Popescu" pe facultăți diferite (legacy seed).

---

## 6. Lacune identificate

### 6.1 Date neexpuse în endpoint-uri

| Date | Unde sunt | Unde lipsesc |
|---|---|---|
| Departament profesor (group-by) | `professors.department` | nici un endpoint nu agregă pe departament |
| Anul de studiu (group-by) | chain groups→series→study_years.year_number | nu există filtru/grup pe Acasă |
| Nivel program (licență/master) | `programs.level` | NU expus în filtre |
| Tip curs filtru | `courses.course_type` | DAR nu e filtru în `home-stats` |
| Top-N rankings | calculabil din `professor_stats` | nu există endpoint dedicat |
| Heatmap data | calculabil cu GROUP BY 2D | nu există endpoint |
| Status acțiuni breakdown | `professor_actions` | doar count agregat în `home-stats.pipeline` |
| Status mesaje breakdown | `platform_feedback_messages.status` | nu există în Acasă |
| Trend pe luni | calculabil din `submitted_at` | doar pe zi |

### 6.2 Filtre lipsă pe Acasă

`EvaluationLifecycle.tsx` are doar: facultate + slider zile. Lipsesc:
- Semestru (1/2)
- Anul de studiu (1/2/3)
- Nivel program (licență/master)
- Tip curs (curs/seminar/laborator)
- Categorie întrebare (didactica/organizare/comunicare/angajament/general)
- Departament (admin / profesor)
- Program (student / admin)

### 6.3 Vizualizări lipsă

| Tip vizualizare | Există? | Notă |
|---|---|---|
| KPI cards | ✅ | KPICard reutilizabil |
| Pie | ✅ | Recharts, dar fără toggle %/absolut |
| Donut | ✅ (roluri active) | doar 1 instanță |
| Bar vertical | ✅ | mai multe instanțe |
| Bar orizontal | ⚠️ | doar StackedSemanticBar pe drilldown |
| Stacked bar semantic | ✅ | StackedSemanticBar |
| Grouped bar (multi-serie) | ❌ | nu există |
| Line chart | ✅ | ProfessorDashboard trend |
| Area chart | ✅ | EvaluationLifecycle time series |
| Radar | ✅ | DualRadar |
| Heatmap | ❌ | nu există |
| Progress bar | ✅ | Progress component + bar inline pe closing-loop |
| Top-N list/leaderboard | ❌ | nu există |
| Sankey / flow | ❌ | nu există (pipeline e cu cards, nu sankey) |
| Treemap | ❌ | nu există |

### 6.4 Interactivitate lipsă

- Click pe pie/donut segments → nu setează filtru (doar tooltip)
- Click pe time series puncte → nu zoom-uiește interval
- Toggle absolut/% pe pie charts → nu există
- Chips pentru filtre active cu „×" reset individual → există parțial pe AdminReports, lipsește pe Acasă
- Sortare interactivă (asc/desc) pe top-N → nu există (n-a fost nevoie)

### 6.5 Lacune testare Playwright

Specs existente acoperă:
- `v2-design-verify`, `v3-features`, `v4-reports-drilldown`, `v4-deadline-blocking`, `v5-manual-close`, `v5-login-status`, `v6-feedback-confirm`, `v7-home-lifecycle`, plus mai vechi (`student-flow`, `admin-diagnose`, `deep-audit`, `full-platform`, `visual-bug-eval`).

NU există teste pentru:
- Interactivitate grafice (click pe segment → filtru aplicat)
- Slider time series → schimbare valoare
- Toggle %/absolut
- Heatmap rendering
- Grouped/stacked bar render correctness
- Pagină Acasă cu toate filtrele aplicate

### 6.6 Riscuri de scop

- 200 profesori dar `professor_actions` are doar 1 propunere → graficele „acțiuni CEAC" vor arăta cifre triviale; nevoie seed mai bogat pentru demo
- `evaluation_periods` are 1 rând, `academic_year` are 1 valoare → nu se poate face comparație multi-an
- Categoriile întrebări sunt 8 dar 3 sunt text → radar are 5 dimensiuni Likert util

---

**Status ETAPA 1**: complet. Treci la ETAPA 2 (`IMPLEMENTATION_PLAN.md`).
