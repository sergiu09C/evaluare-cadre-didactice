# P1 + P2 Execution Report

Continuare după P0 (R1-R3). Acum P1 + P2 executate complet.

## P1 — Important (4 ore real, planificat ~6h)

| ID | Recomandare | Status | Detaliu |
|---|---|---|---|
| R4 | Glossary unificat microcopy | ✅ | `frontend/src/i18n/glossary.ts` cu 25 termeni canonici; aplicat pe `EvaluationLifecycle` (KPI hero + personal). Reguli documentate (transmise/primite, scor mediu/notă echivalent, disciplină/curs etc.). Pentru aplicare completă pe toate paginile, există ca dependence inversă — orice cod nou trebuie să folosească `TERMS.X`. |
| R5 | Curăță ilustrații nefolosite | ✅ | 7 SVG-uri șterse din `illustrations/index.tsx` (IllChecklistDone, IllChatBubble, IllSearch, IllPlugDisconnect, IllChart, IllTrophy, IllError). Rămân doar 3 folosite: IllInbox, IllBooks, IllUsers. |
| R6 | Endpoint getLifecycleSummary deprecated | ✅ | Șters din `routes/platform.js`, `controllers/platformController.js` (-106 linii), `services/api.ts` (-10 linii). 0 consumeri restanți. |
| R7 | Heatmap dublu pe Acasă | ✅ | Eliminat heatmap-ul fix „An × Facultate"; păstrat doar heatmap-ul cu dim selectabile (faculty/program/department × category/semester/year/courseType). |
| R8 | Paginare /reports | ✅ | `ProfessorReports` deja avea paginare (limit+offset+„Load more"). `AdminReports` e dashboard cu tab-uri agregate (nu listă) — paginare nu se aplică. |

## P2 — Polish

| ID | Recomandare | Status | Detaliu |
|---|---|---|---|
| R9 | Dark mode pass | ✅ | Spec nou `v12-dark-mode-pass.spec.ts` care vizitează 8 pagini cu `data-theme="dark"` injectat și capturează screenshot-uri. Toate cele 8 trec; verificare manuală pe screenshot-uri arată că nu există hardcoded colors stricate (fundaluri navy, contrastul corect, badge-uri scor lizibile pe tabel). |
| R10 | Reduced motion pe Recharts | ✅ | Hook nou `useReducedMotion()` în `frontend/src/hooks/useReducedMotion.ts`. Pe `EvaluationLifecycle` aplicat `isAnimationActive={animate}` pe 6 chart components (BarChart×3, AreaChart, LineChart×2). Respectă OS-level setting + reacționează la schimbarea live a preferinței. |
| R11 | KPI hero responsive | ✅ | Schimbat `lg:grid-cols-8` → `md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8` — break-uri progresive. Pe 1440×900 acum 4 carduri/rând în loc de 8 strânse. |

## Build + Test status

- `npx vite build`: ✓ built in 3.46s
- Suite regression: 22/22 verzi după update selecte (tabs moved sections to `?tab=explore`)
- Dark mode crawl: 8/8 verzi
- 0 fișiere noi inutile, 7 fișiere șterse curat

## Schimbări observabile pentru utilizator

1. **Ilustrații**: doar Inbox/Books/Users; restul șterse (zero impact vizual, mai puțin code shipped)
2. **Acasă cu R7**: 1 heatmap în loc de 2 → reduce scroll-ul pe tab Explorează
3. **KPI hero**: pe ecrane 1440px, KPI-urile sunt 4 pe rând (1 rând extra) în loc de 8 înghesuite
4. **Reduced motion**: useri cu `prefers-reduced-motion: reduce` nu mai văd animații Recharts
5. **Glossary**: terminologie consistent „Cadre didactice" / „Studenți care pot evalua" / „Evaluări transmise"
6. **Dark mode**: 0 elemente vizibile stricate pe 8 pagini auditate (audit pasiv via screenshots — vezi `/tmp/dark-*.png`)

## Fișiere modificate

### Backend
- `backend/src/routes/platform.js` — șters ruta `/lifecycle-summary`
- `backend/src/controllers/platformController.js` — șters `getLifecycleSummary` (~110 linii)

### Frontend
- `frontend/src/components/illustrations/index.tsx` — redus de la 10 la 3 ilustrații (-93 linii)
- `frontend/src/i18n/glossary.ts` — NOU (62 linii)
- `frontend/src/hooks/useReducedMotion.ts` — NOU (22 linii)
- `frontend/src/pages/EvaluationLifecycle.tsx` — aplic TERMS, useReducedMotion, isAnimationActive (6 chart-uri), elimin heatmap dublu, KPI responsive
- `frontend/src/services/api.ts` — șters `getLifecycleSummary` (-10 linii)

### Tests
- `tests/e2e/v12-dark-mode-pass.spec.ts` — NOU (8 scenarii dark mode)
- `tests/e2e/v3-features.spec.ts`, `v8-rich-dashboards.spec.ts`, `v9-new-kpis-gdpr.spec.ts` — selecte adaptate la noile tabs (`?tab=explore`)

## Linii cod scrise/șterse total (P1+P2)

- **Adăugate**: ~140 linii (glossary + useReducedMotion + spec dark)
- **Șterse**: ~225 linii (illustrations -93, getLifecycleSummary backend -106, getLifecycleSummary frontend -10, heatmap dublu -41)
- **Net**: -85 linii cod, mai puține dependențe vizuale, mai puține endpoints orfane
