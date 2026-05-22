# IMPLEMENTATION PLAN — Acasă rich + grafice exhaustive

> ETAPA 2 din prompt-ul `CLAUDE_CODE_PROMPT_RICH_DASHBOARDS.md`.
> Bazat pe `AUDIT_REPORT.md` (ETAPA 1).

## Obiectiv

Transformă pagina Acasă (`/`, `/professor`, `/admin`) și paginile dashboard secundare într-un sistem complet de vizualizare interactivă, cu filtre relevante per rol și toate tipurile de grafice (KPI, pie/donut, bar vertical/orizontal/stacked/grouped, line/area, radar, heatmap, top-N, progress).

---

## 1. Matricea filtre × roluri × pagini

Filtrele **globale** (set pe Acasă, persist via URL query):

| Filtru | Student | Profesor | Admin | Pagini afectate |
|---|:--:|:--:|:--:|---|
| **Facultate** | ✅ | ✅ | ✅ | Acasă, Reports, AggregatedResults |
| **Departament** | — | ✅ (doar propriul) | ✅ | Acasă admin, ProfDashboard |
| **Program** | ✅ (al meu) | — | ✅ | Acasă admin, AggregatedResults |
| **Nivel program** | ✅ | — | ✅ | Acasă admin |
| **An academic** | ✅ | ✅ | ✅ | toate dashboardurile |
| **Semestru (1/2)** | ✅ | ✅ | ✅ | toate dashboardurile |
| **Anul de studiu (1/2/3)** | — | ✅ | ✅ | Acasă, dashboarduri |
| **Tip curs** | ✅ | ✅ | ✅ | Acasă, ProfDashboard |
| **Categorie întrebare** | ✅ | ✅ | ✅ | Acasă (radar), ProfDashboard |
| **Interval temporal (slider zile)** | ✅ | ✅ | ✅ | Acasă |
| **Status acțiune CEAC** | — | ✅ | ✅ | ProfActions, AdminClosingLoop |
| **Status mesaj feedback** | ✅ (proprii) | ✅ (proprii) | ✅ | PlatformFeedback, AdminPlatformFeedback |
| **Rol utilizator** | — | — | ✅ | Acasă admin, AdminUsers |

**UI**: filter bar sticky sub header, cu chips pentru filtre active + buton „Resetează tot". Filtrele rezonabile per rol sunt afișate (un student NU vede „Rol" sau „Departament").

---

## 2. Matricea grafice × pagini

Cele 12 tipuri de vizualizări și unde le livrăm:

| Grafic | Acasă (toate) | ProfDashboard | AdminDashboard | AggregatedResults | ProfReports | AdminReports |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| **KPI big-number** | ✅ 6 carduri | ✅ 4 | ✅ 6 | ✅ 4 | ✅ 3 | ✅ 5 |
| **Pie** (distribuție scoruri 1-5) | ✅ + toggle %/abs | ✅ | ✅ | ✅ | — | ✅ |
| **Donut** (roluri / status acțiuni) | ✅ roluri + acțiuni | — | ✅ acțiuni | — | — | — |
| **Bar vertical** (count per categorie) | ✅ evaluări/facultate (clickable) | ✅ /curs | ✅ /facultate | ✅ | — | ✅ |
| **Bar orizontal** (top-N) | ✅ top 5 profesori (admin) / top discipline (student) | — | ✅ top 10 profi | — | — | ✅ |
| **Stacked bar** (semantic 1-2/3/4-5) | ✅ /facultate | ✅ /întrebare (există) | ✅ /facultate | ✅ /sem | — | ✅ |
| **Grouped bar** (multi-serie) | ✅ sem1 vs sem2 | ✅ /curs sem1 vs sem2 | ✅ /facultate /sem | ✅ | — | ✅ |
| **Line chart** (trend) | ✅ evoluție/lună | ✅ trend semestre | ✅ /lună | — | — | ✅ |
| **Area chart** (volum în timp) | ✅ submisii/zi | — | ✅ | — | — | — |
| **Radar** (multi-dimensional) | ✅ DualRadar categorii (vs platform avg) | ✅ DualRadar | ✅ | ✅ | — | — |
| **Heatmap** (2D) | ✅ facultate × categorie | ✅ /sem × /categorie | ✅ /program × /an | ✅ | — | ✅ |
| **Progress bar** (rate) | ✅ closing-loop + completion | ✅ /curs completion | ✅ /facultate completion | ✅ | — | — |

### Comportament interactiv obligatoriu

- **Hover**: tooltip Recharts pe toate elementele grafice
- **Click pe bar/segment**: setează filtrul corespunzător (ex: click pe „FI" în bar → `facultyId=1`)
- **Slider zile**: re-fetch debounced 250ms
- **Toggle %/absolut pe pie**: Switch UI component, recalculează valori client-side
- **Chips filtre active**: fiecare cu „×" pentru reset individual; „Resetează tot" global

---

## 3. Endpoint-uri noi (backend)

Pentru ce nu se poate calcula client-side eficient. Extindem `home-stats` + creăm dedicate:

| Endpoint | Method | Params | Returnează | Justificare |
|---|---|---|---|---|
| `/api/platform/home-stats` | GET (extins) | `facultyId, programId, programLevel, departmentId, year, semester, courseType, days` | + grouped bar data (sem1/sem2), + heatmap data (facultate × categorie), + status acțiuni breakdown, + status mesaje breakdown | extindere endpoint existent |
| `/api/platform/top-rankings` | GET (nou) | `metric (avg/count), entity (professors/courses/departments), limit (10)` | top-N rankings | Top-N pe Acasă (admin: top profesori; student: top discipline propriei facultăți) |
| `/api/platform/heatmap` | GET (nou) | `rowDim, colDim` (ex: faculty×category, program×year) | grid 2D cu count + avg | Heatmap viz |
| `/api/platform/time-series-monthly` | GET (nou) | `facultyId, year` | submisii grupat pe lună (12 puncte) | line chart trend lunar |
| `/api/platform/grouped-bar` | GET (nou) | `groupBy (faculty/department/program), splitBy (semester/year/courseType)` | series multi-grup | grouped bar |
| `/api/platform/filter-options-public` | GET (nou, common) | — | toate facultățile, programele, departamentele, anii (no admin gate) | dropdown-uri filtre, momentan doar admin are filter-options |

Total: 1 extindere + 5 endpoints noi.

---

## 4. Ordinea de implementare

| # | Etapa | Output | Depinde de |
|---|---|---|---|
| **E0** | Backend: extinde `home-stats` cu noi filtre + `filter-options-public` | platformController.js +200 linii; routes/platform.js | nimic |
| **E1** | Backend: endpoint `/heatmap` + `/grouped-bar` + `/top-rankings` + `/time-series-monthly` | 4 funcții noi | E0 |
| **E2** | Frontend: extinde `EvaluationLifecycle.tsx` cu toate filtrele + chips active | UI bar sticky + state machine pentru filtre | E0 |
| **E3** | Frontend: componente charts reutilizabile noi: `Heatmap.tsx`, `GroupedBar.tsx`, `TopNList.tsx`, `PieWithToggle.tsx` | `frontend/src/components/charts/` +4 fișiere | nimic |
| **E4** | Frontend: integrare grafice noi pe Acasă (heatmap, grouped, top-N, monthly trend) + click-handlers pe bar/segment pentru filtru | Acasă completă | E1, E2, E3 |
| **E5** | Frontend: replicare filtre+grafice pe ProfDashboard, AdminDashboard, AggregatedResults (pattern unificat) | 3 pagini reactualizate | E4 |
| **E6** | Playwright: tests `v8-rich-dashboards.spec.ts` cu 12+ scenarii (filtre, click-to-filter, slider, toggle, reset) | tests/e2e/v8-*.spec.ts | E5 |
| **E7** | VALIDATION_REPORT.md + screenshots | doc + 3 PNG-uri | E6 |

Estimare: ~3-4h dacă lucrăm strict pe pattern reutilizabil; ~6h dacă fiecare grafic primește customizare manuală.

---

## 5. Plan de teste Playwright

Spec nou: `tests/e2e/v8-rich-dashboards.spec.ts` (~12 teste).

### Scenarii student (3 teste)

1. **Acasă student render baseline** — login, navigate `/`, verifică prezența celor 6 KPI + pie + donut + radar + heatmap + top-N + area + grouped + progress
2. **Filtre student aplicate** — selectează facultate „FI" + program „INF" + nivel licență + slider 90 zile → verifică actualizare KPI + grafice + chips
3. **Click-to-filter pe bar** — click pe o bară din „evaluări/facultate" → verifică că filtrul s-a setat și restul graficelor s-au reactualizat

### Scenarii profesor (3 teste)

4. **Acasă profesor render** — login, navigate `/professor`, verifică KPI personal + grafice
5. **Filtre profesor — departament + categorie** — aplică departament + categorie → grafice update
6. **Slider zile interval temporal** — slide la 90, 180, 365 → verifică schimbare time series

### Scenarii admin (3 teste)

7. **Acasă admin render** — login, navigate `/admin`, verifică toate graficele
8. **Top-N profesori clickable** — click pe primul rang → navigate la `/admin/professor/:id`
9. **Heatmap render** — verifică prezența celulelor heatmap cu tooltip pe hover

### Scenarii cross-cutting (3 teste)

10. **Toggle %/absolut pe pie** — click toggle → valorile recompute
11. **Chips filtre + reset individual** — set 3 filtre → 3 chips → click „×" pe unul → 2 chips
12. **Resetează tot** — set 4 filtre → click „Resetează tot" → toate dispar, baseline

### Criterii de validare per test

- Snapshot full-page după fiecare interacțiune majoră
- Verificare numerică: cel puțin un KPI sau o legendă se schimbă la filtru
- A11y: focus management după click filter (nu pierdere focus)

---

## 6. Riscuri și mitigări

| Risc | Probabilitate | Mitigare |
|---|---|---|
| Heatmap în Recharts nu există nativ | Mare | Implementăm custom cu CSS grid + cells colorate semantic |
| Bundle size cu mai multe charts | Mediu | Toate Recharts componente sunt deja în vendor-charts chunk; nu adăugăm librării noi |
| Performanță DB pe queries grouped 2D | Mic | Indexare pe `evaluations.submitted_at`, `professors.faculty_id` deja există; queries simple |
| Filtre prea multe = UX greoi | Mediu | „Filtre avansate" colapsibil în drawer; doar 3-4 esențiale vizibile by default |
| Click-to-filter conflict cu hover tooltip | Mic | `onClick` la nivel de chart, NU pe segment; evită event double-fire |

---

## 7. Format URL pentru filtre persistente

`/?facultyId=1&programId=3&semester=2&days=180&category=didactica`

Toate filtrele se reflectă în URL (via `useSearchParams` din react-router). Reîncărcarea paginii păstrează starea. Bookmark-uri partajabile.

---

**Status ETAPA 2**: complet. Treci la ETAPA 3 (implementare) după aprobarea ta.
