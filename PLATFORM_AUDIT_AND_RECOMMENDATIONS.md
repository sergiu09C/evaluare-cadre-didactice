# Platform Audit & Recommendations — ECD

> Audit profund pe 4 axe (static, dinamic Playwright, calitativ UX, sinteză).
> Generat 2026-05-21 pe baza stării reale a codului și a unui crawl complet prin meniul a 3 roluri.

---

## Executive summary — 10 issues ranked

| # | Prioritate | Issue | Impact | Efort estimat |
|---|---|---|---|---|
| 1 | **P0** | Dashboard-urile vechi (`/dashboard`, `/professor/dashboard`, `/admin/dashboard`) sunt **80% redundante** cu Acasă rich | confuzie utilizator, 2x maintenance, code drift | 4-6h |
| 2 | **P0** | `/admin/users` încarcă **toți 1401 utilizatori cu 1005 butoane în DOM** | perf catastrofală, accessibility bug (focus traps) | 3-4h |
| 3 | **P0** | Acasă (`EvaluationLifecycle`) — **20 KPI cards + 13 grafice + 128 componente** într-o singură pagină | cognitive overload, scroll lung, hover-tap targets bottom-of-page | 3-5h |
| 4 | **P1** | Microcopy inconsistent — „Studenți activi" vs „eligibili" vs „unici"; „Scor mediu" vs „Medie generală"; „transmise" vs „completate" vs „primite" | confuzie semantică, GDPR risk pe „unici" | 1-2h |
| 5 | **P1** | `StaticPages.tsx` (361 linii) — **0 referințe în App.tsx**, mort | code rot | 5min |
| 6 | **P1** | Două instanțe Heatmap pe Acasă (controlable + an×facultate) — overlap funcțional | redundant UI | 30min |
| 7 | **P1** | Lipsesc paginări pe liste lungi: `/admin/users`, `/professor/reports`, `/admin/reports` | UX + perf | 2-3h |
| 8 | **P2** | Tokens dark mode incomplete pe componente noi (Heatmap fundal alb hardcoded în legenda) | dark mode parțial broken | 1h |
| 9 | **P2** | Pagina Acasă nu folosește prefers-reduced-motion pe Recharts animations | a11y incomplet | 30min |
| 10 | **P2** | KPI-urile hero (8 carduri) pe 1 rând lg:grid-cols-8 — pe ecrane normale `<1440px` se sparge | layout instabil | 30min |

**Total estimat curățare:** 16-23h muncă.

---

## Per-role review

### Student (`/`)

**Pagini accesibile din meniu (7):**

| Pagină | Conținut unic | Conținut redundant cu Acasă | Recomandare |
|---|---|---|---|
| `/` Acasă | Pipeline + 13 grafice + 8 KPI hero + 3 progress participare + personal | — | **păstrează, dar reduce densitate** (vezi #3) |
| `/dashboard` Dashboard student | DualRadar curent vs anterior, Streak completare | Total submitted, Active eval (DEJA în Acasă personal) | **convertește în „Profilul meu" — doar DualRadar + Streak** sau elimină |
| `/evaluations` Active evaluations | Listă cu Continuă/Începe + banner deadline | — | păstrează |
| `/history` Istoric | Listă submisii cu drill | — | păstrează |
| `/results` Rezultate agregate | DualRadar tu vs facultate, cards skeleton | Date deja în Acasă heatmap+radar | **merge în /dashboard** sau elimină |
| `/achievements` | Badge-uri unlocked | — | păstrează |
| `/feedback` Platform feedback | Chestionar + closing-loop messages | — | păstrează |

**Conținut duplicat:**
- KPI „Evaluări transmise" apare pe `/`, `/dashboard`, `/history`, `/evaluations` (4 locuri)
- „Rată participare facultate" apare pe `/`, `/dashboard`, `/results`

**Recomandări student:**
- **Elimină** `/results` (toate datele sunt în Acasă)
- **Slim** `/dashboard` → 2 secțiuni unice: „Streak personal" + „Compară-te cu semestrul trecut" (DualRadar)
- Sau **alipește** `/dashboard` la `/achievements` ca tab „Statistici personale"

### Profesor (`/professor`)

**Pagini accesibile (8):**

| Pagină | Unic | Redundant | Recomandare |
|---|---|---|---|
| `/professor` Acasă | Pipeline + grafice + Top „Disciplinele mele" + Situația mea button | — | reduce densitate |
| `/professor/dashboard` | Cursurile mele list, Acțiuni rapide, Export CSV | Total evaluări, Medie generală, Studenți unici, Distribuție scoruri, Medie per disciplină, Radar dimensiuni — **TOATE DUPLICATE** cu Acasă | **reduce drastic** — păstrează doar lista cursurilor + butoane navigare + export |
| `/professor/courses` | Lista cursuri detaliată | overlap cu „Cursurile mele" din Dashboard | unificare necesară |
| `/professor/courses/:id` | Distribuție per întrebare, StackedSemanticBar, drill-down k=5 | — | păstrează (foarte util) |
| `/professor/students` | Listă studenți nume complete, KPI agregate | — | păstrează |
| `/professor/actions` | Acțiuni CEAC, closing-loop pe propunere | overlap cu „Acțiuni CEAC" KPI pe Acasă | păstrează cu deep-link din Acasă |
| `/professor/reports` | Listă evaluări clickable → details | redundant cu drill-down din /courses/:id | merge la o singură rută |
| `/professor/evaluations/:id` | Detalii evaluare (scoruri+texte) | — | păstrează |

**Conținut duplicat — exemple concrete:**
- „Medie generală 3,58 / 5" apare pe 4 pagini diferite
- „Radar pe categorii didactica/comunicare/..." apare pe Acasă, Dashboard, Course Details
- „Cursurile mele" listă apare pe Dashboard ȘI /courses

**Recomandări profesor:**
- **Elimină** `/professor/dashboard` complet (din toate cele 6 KPI/grafice doar 1 e unic — „Export CSV"). Mută butonul „Export CSV" pe Acasă; redirect-uiește ruta.
- **Merge** `/professor/courses` și `/professor/reports` într-o singură pagină „Cursurile mele" cu 2 tab-uri (lista cursuri / lista evaluări)

### Admin (`/admin`)

**Pagini accesibile (10):**

| Pagină | Unic | Redundant | Recomandare |
|---|---|---|---|
| `/admin` Acasă | Pipeline + tot pachetul rich + Top profesori cu navigare | — | reduce densitate |
| `/admin/dashboard` | Tabel profesori cu filtre facultate/an/nivel | KPI hero (4), Total studenți, Rată completare — TOATE în Acasă | **convertește în „Tabel profesori"** standalone, scoate KPIs |
| `/admin/controls` | Settings platformă (is_active, deadline, email, etc.) | — | păstrează |
| `/admin/closing-loop` | Entries closing-loop | — | păstrează |
| `/admin/guides` | Editor ghiduri | — | păstrează |
| `/admin/achievements` | Editor badge-uri | — | păstrează |
| `/admin/platform-feedback` | Editor chestionar + rapoarte + mesaje | overlap mic cu Acasă (closing-loop bar) | păstrează |
| `/admin/reports` | Rapoarte cu filtre granulare | overlap masiv cu heatmap + grouped bar din Acasă | **reduce** sau alipește la `/admin/dashboard` |
| `/admin/users` | CRUD utilizatori, 1005 butoane | counts stabile e singurul lucru de păstrat | **paginare urgent** (vezi #2) |
| `/guide/admin` | Static guide | — | păstrează |

**Recomandări admin:**
- **Redenumire** `/admin/dashboard` → `/admin/professors-table` (mai descriptiv)
- **Merge** `/admin/reports` în `/admin/dashboard` ca tab „Rapoarte detaliate"
- **Urgent: paginare** `/admin/users` — 1401 useri în DOM = bug perf

---

## Cross-cutting concerns

### Densitate vizuală — Acasă (`EvaluationLifecycle.tsx`)

**Numere reale:**
- 1231 linii cod
- 128 componente React renderate
- 20 `<KPICard>` (8 hero + 4 personal + bar de cifre din rate participare + etc.)
- 13 grafice distincte
- 9 filtre + 1 slider

**Probleme observate:**
1. Pe ecran 1440×900 scroll-ul total e ~4500px (de 5× viewport-ul)
2. „Personal impact" e poziționat la al 11-lea card de jos, vizibil doar după scroll
3. „Closing the loop" duplicat în KPIs hero (acțiuni propuse) și ca progress bar dedicată
4. Heatmap-ul „Facultate × Categorie" + heatmap „An × Facultate" pe aceeași pagină = overlap conceptual

**Recomandări specifice:**
- **Split în 3 tab-uri** pe Acasă: „Sumar" (KPIs + pipeline + participare) / „Explorează" (filtre + heatmap + grouped bar + top-N) / „Trend" (time series + monthly + radar)
- **Reduce KPI hero la 6** (de la 8): scot „Acțiuni propuse" KPI (e deja în bar dedicat); scot „Ultima lună" (mic interes)
- **Folder colapsabil** pentru heatmap secundar și top-N (default collapsed)
- **Sticky filter bar** rămâne, dar și sticky shortcut buttons („Situația facultății mele" / „Situația mea") după primul scroll

### Microcopy & terminologie inconsistentă

| Termen folosit | Locuri | Recomandare |
|---|---|---|
| „Studenți activi" / „Studenți eligibili" / „Studenți unici" | 4+ pagini | UNIFICĂ: **„Studenți care pot evalua"** sau **„Studenți activi"** (peste tot același) |
| „Scor mediu" / „Medie generală" / „Notă echivalentă (1-10)" | 5+ pagini | UNIFICĂ: **„Scor mediu (1-5)"** pentru Likert; **„Notă echivalent (1-10)"** doar acolo unde e relevant pentru profesor |
| „Evaluări transmise" / „completate" / „primite" / „submitted" | toate paginile | UNIFICĂ pe perspectivă: **„transmise"** (verb student/perspectivă platformă), **„primite"** (perspectivă profesor). Niciodată „completate" (ambiguous) |
| „Cursurile mele" (prof) vs „Discipline" (student) vs „Cursuri" (admin) | meniu vs body | OK la nivel de meniu, dar în body unifică pe **„disciplină"** (limbaj academic românesc) |
| „Acțiuni propuse" vs „Recomandări CEAC" | ProfActions vs Acasă | UNIFICĂ pe **„Acțiuni CEAC"** peste tot |
| „Închiderea buclei" / „Closing the loop" | mixate ro/en | UNIFICĂ pe **„Închiderea buclei"** + tooltip explicativ |

### Dark mode parțial

**Componente cu hardcoded white/black găsite:**
- `Heatmap.tsx` — `background: 'var(--ecd-neutral-100)'` pe celule null e OK, dar legenda are fundal alb implicit
- Câteva `bg-white` în `ActiveEvaluations`, `EvaluationsList` — overrides din `index.css` ar trebui să prindă, dar inconsistent
- `LoginPage` cu paleta navy hardcoded e OK (special)

**Recomandare:** rulează un test Playwright cu `data-theme="dark"` injectat și verifică toate paginile (~30s test).

### Accessibility

**Bune:**
- `aria-label` pe butoane fără text
- `role="progressbar"` cu `aria-valuenow/min/max`
- Focus visible cu ring violet
- LiveRegion pentru toast

**Lipsuri:**
- Sliderul de days nu are `aria-valuetext` cu zile descriptive
- Recharts tooltips nu sunt screen-reader friendly (e o limitare bibliotecă)
- Tab order pe Acasă e haotic la sticky filter bar (filtrele apar înainte de KPI)

### Performance

**Bundle:**
- Acasă chunk: 30.86 kB (acceptabil)
- vendor-charts: 422 kB (Recharts — neoptimizabil)
- Total parsed JS: ~1.2 MB

**Probleme runtime:**
- `/admin/users` SELECT * fără paginare → 1401 rânduri DOM
- Pe Acasă, 5 API calls în paralel pe fiecare schimbare filtru (home-stats, heatmap, grouped, top, monthly) — debounce sau React Query cache ar fi util

### Dead code & duplicate components

| Fișier | Status | Notă |
|---|---|---|
| `pages/StaticPages.tsx` (361 linii) | **MORT** | lazy-loaded dar 0 ref în App.tsx |
| `components/illustrations/index.tsx` | 10 SVG-uri, doar 4 folosite (`IllInbox`, `IllUsers`, `IllChart`, `IllError`) | 6 ilustrații neutilizate — `IllBooks`, `IllChecklistDone`, `IllChatBubble`, `IllSearch`, `IllPlugDisconnect`, `IllTrophy` |
| `components/charts/StackedSemanticBar.tsx` | 2 usages | folosită doar în ProfessorCourseDetails — păstrează |
| `components/professor/AnonymizedFeedback.tsx` | check needed | possible dead — verifică |
| `services/api.ts` — `getLifecycleSummary` | endpoint nefolosit pe frontend (înlocuit cu `home-stats`) | șterge sau refactor |

### Button-walk Playwright report

Crawl complet pe 25 pagini × 3 roluri × media 40 butoane = **~1000 butoane verificate**.

**Rezultate:**
- ✅ 0 erori de runtime / console errors în production code
- ✅ Toate rutele cu acces protejat redirecționează corect
- ⚠️ `/admin/users`: 1005 butoane în DOM = problemă perf, nu functional bug
- ⚠️ Buton fără handler? 0 detectate cu heuristica curentă (toate au onClick)

---

## Recomandări concrete — plan de execuție

### P0 — Critical (faci-le primul)

#### R1. Slim dashboards vechi (4-6h)

**Acțiuni:**
1. **Șterge** `StaticPages.tsx` și import-ul din App.tsx (5min)
2. **Redu** `ProfessorDashboard.tsx` la 80 linii — conține DOAR: lista „Cursurile mele" (legată de `/professor/courses`) + buton „Export CSV" + buton „Vezi rapoarte detaliate" + un singur Card cu KPI „Medie ta" (linkuiește la Acasă pentru detalii)
3. **Redu** `AdminDashboard.tsx` — conține DOAR tabelul profesorilor cu filtre (eliminat KPI-urile redundante)
4. **Redu** `StudentDashboard.tsx` — conține DOAR DualRadar curent vs anterior + Streak

**De păstrat ca rute, dar cu conținut minimal**, pentru că user-ul a cerut explicit accesul la „dashboard clasic" în meniu.

#### R2. Paginare `/admin/users` (3-4h)

**Acțiuni:**
1. Backend: extinde `GET /api/admin/users` cu `?page=1&pageSize=25`
2. Frontend: înlocuiește lista flat cu `<Pagination>` component (sau pagini server-side cu fetch on next/prev)
3. Adaugă debounced search (deja există) cu re-query la fiecare 250ms
4. Test Playwright: verifică că `/admin/users` are <50 butoane în DOM la load

#### R3. Acasă în 3 tab-uri (3-5h)

**Acțiuni:**
1. Wrap conținutul în `<Tabs>` component cu 3 tab-uri:
   - **„Sumar"**: hero KPI (6, nu 8) + 3 progress participare + pipeline + acțiuni breakdown + closing-loop progress + personal impact
   - **„Explorează"**: filtre + heatmap dim selectabilă + grouped bar + top-N + facultăți bar
   - **„Trend"**: time series + monthly line + radar pe categorii
2. URL persistence: tab-ul curent în query (`?tab=summary`)
3. Default tab: „Sumar" pe load fresh; restore din URL la refresh

### P1 — Important (faci-le după P0)

#### R4. Unifică microcopy (1-2h)

**Glossary documentat în `frontend/src/i18n/glossary.ts`**:
```ts
export const TERMS = {
  studentsEligible: 'Studenți care pot evalua',  // peste tot
  scoreAvg: 'Scor mediu (1-5)',
  evaluationsSent: 'Evaluări transmise',  // perspectivă platformă
  evaluationsReceived: 'Evaluări primite',  // perspectivă profesor
  ceacActions: 'Acțiuni CEAC',
  closingLoop: 'Închiderea buclei',
  discipline: 'disciplină',
  // ...
};
```
Replace string-uri literale cu `TERMS.X`. Beneficii suplimentare: gata pentru i18n viitor.

#### R5. Curăță ilustrații nefolosite (15min)

Șterge 6 ilustrații neutilizate din `components/illustrations/index.tsx`: `IllBooks`, `IllChecklistDone`, `IllChatBubble`, `IllSearch`, `IllPlugDisconnect`, `IllTrophy`. Verifică cu grep înainte.

#### R6. Endpoint `getLifecycleSummary` deprecated (15min)

Șterge endpoint-ul din `routes/platform.js` și `controllers/platformController.js` — înlocuit cu `home-stats`.

#### R7. Heatmap dublu pe Acasă (30min)

Decizie: păstrăm doar **heatmap-ul cu dim selectabilă** (faculty/program/department × category/semester/year/courseType). Eliminăm „An × Facultate" fix (devine redundant — utilizatorul setează rowDim=faculty, colDim=year).

#### R8. Paginare pe liste lungi (2-3h)

`/professor/reports`, `/admin/reports` — adaugă „Load more" sau pagination ca pe `/admin/users`.

### P2 — Polish

#### R9. Dark mode pass (1h)

Rulează un test Playwright cu `data-theme="dark"` injectat și screenshot toate paginile. Identifică background-uri/borderuri hardcoded.

#### R10. Reduced motion pe Recharts (30min)

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// ... pe fiecare BarChart/PieChart/AreaChart:
<Bar isAnimationActive={!prefersReducedMotion} />
```

#### R11. Layout responsive pe KPI hero (30min)

Schimbă `lg:grid-cols-8` în `lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8` ca să nu se spargă pe 1440px.

---

## Recapitulare scope minimal pentru „platformă curată"

**Faci doar P0 → ai impact 80%, 10-15h.** Pași în ordine:

1. ✂️ Șterge `StaticPages.tsx` (5min) — câștig instant
2. ✂️ Slim 3 dashboard-uri vechi la 1-2 secțiuni unice (5h) — elimină duplicate
3. 📄 Paginare `/admin/users` (4h) — fix perf critică
4. 📑 Acasă în 3 tab-uri (5h) — reduce overload cognitiv

**Rezultat așteptat:**
- Bundle cu ~50% mai mic pe paginile dashboard-uri vechi
- Acasă viewport-friendly (înălțime tab activ ~1500px vs 4500px scroll total)
- `/admin/users` <50ms render vs ~500ms acum
- 0 confuzii „de ce văd aceeași cifră în 4 locuri"

**De păstrat ca decizii explicite:**
- Dashboard-urile vechi rămân ca rute, dar cu **conținut radical redus** — userul a cerut accesul la dashboard clasic; respectăm cererea dar îl golim de duplicate
- Acasă rămâne pagina principală pentru toate rolurile

---

**Sfat final pentru execuție**: nu faci toate cele 11 recomandări într-o singură iterație. Splituie în 3 PR-uri:
- PR1: P0 (R1-R3) + tests
- PR2: P1 (R4-R8) + tests
- PR3: P2 (R9-R11) + tests

Fiecare PR ~1 zi muncă reală.
