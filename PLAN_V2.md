# PLAN V2 — Roadmap complet de finalizare & audit

> Generat: 2026-05-22 · scope: tot codebase-ul ECD (frontend + backend + tests + seed/migrations) · agregare din 13 rapoarte anterioare + audit fresh în această sesiune.

---

## A. Sumar executiv

**Stadiu actual:** 11 din 17 puncte planificate în rapoartele anterioare sunt închise (sesiunile A–K + bug-fix-uri P0/P1). Sunt cca. **20 items rămase** clasificate în 4 paliere de prioritate plus **3 axe orizontale** (lingvistic, logic defensiv, testare).

**Următorii pași recomandați (în ordine):**
1. **P0 (~25h)** — Refactor design admin/professor + paginare la liste mari + filtru bar consistent.
2. **P1 (~10h)** — Multi-select filtre + closing-loop admin CRUD + edge cases sem.
3. **Orizontale (~6h)** — pass linguistic complet, defensive coding, suite Playwright stabilizat (șterge teste obsolete, scrie 5 noi).

**Estimare totală finalizare „platformă curată 100%":** 40–45h muncă focusată.

---

## B. Items neexecutate (consolidate)

### B1. P0 — Critice / blocking pentru „platformă curată"

| ID | Item | Sursă | Estimare | Note |
|---|---|---|---|---|
| **R1** | Slim dashboards vechi (StudentDashboard / ProfessorDashboard / AdminDashboard refactor) | PLATFORM_AUDIT | 4–6h | StudentDashboard slim parțial — păstrat radar dual; ProfessorDashboard EXTINS în sesiune anterioară cu KPI + pipeline. **De fapt P1** acum. |
| **R2** | Paginare `/admin/users` (1401 → 25/pagină, sub 50 DOM buttons) | PLATFORM_AUDIT | 3–4h | DEJA implementat în AdminUsers.tsx (vezi `pagination` state). **Marcat ca închis după verificare**. |
| **R3** | Acasă în 3 tab-uri (Summary / Explore / Trend) cu URL persistence | PLATFORM_AUDIT | 3–5h | DEJA implementat în EvaluationLifecycle.tsx (`setActiveTab`, `searchParams.get('tab')`). **Verificat**. |
| **H1** | Refactor design admin (Dashboard, Controls, Reports, ProfessorDetails) | PLATFORM-AUDIT | 2h | Pagini admin folosesc deja `Card/Badge/Button` din `components/ui`. Auditul pare obsolet (raportul din mai e anterior refactor-ului). |
| **H2** | Refactor design profesor (Dashboard, CourseDetails, Reports) | PLATFORM-AUDIT | 2h | Idem H1 — deja refactorit. |
| **H5** | Closing-the-loop admin CRUD (text + bias hardcodat → DB + UI editor) | PLATFORM-AUDIT | 4h | AdminClosingLoop.tsx există dar e listă, nu CRUD pe template. **De verificat dacă mai e relevant** după sesiunile recente. |

> **Notă:** Auditul fresh arată că majoritatea items P0 din rapoartele vechi (R1–R3, H1–H2) sunt deja închise sau parțial închise. Recomand un sweep de verificare (1h) înainte de a re-aborda — apoi acceptarea ca closed.

### B2. P1 — Importante / planificate explicit dar neexecutate

| ID | Item | Sursă | Estimare | Detaliu |
|---|---|---|---|---|
| **J** | **Multi-select pe filtre dropdown** (an=1 ȘI an=2 simultan) | RAPORT_REPARARE | 4–6h | Refactor `useFilters` să accepte arrays + backend să primească CSV/repeat-params; component nou `MultiSelect`. |
| **R8** | Paginare `/professor/reports` + `/admin/reports` | PLATFORM_AUDIT | 2–3h | ProfReports nu pare paginat — verifică `<Pagination>` lipsă. Idem AdminReports. |
| **L3** | Reset password real (acum doar `mailto:`) | PLATFORM-COMPLETE | 1h | Backend: endpoint `/auth/reset-password-request` + token + email. |
| **M6** | Export ARACIS agregat (admin, format CSV/PDF cu schema ARACIS) | PLATFORM-COMPLETE | 2–3h | Endpoint nou care exportă agregare per facultate/program. |

### B3. P2 — Nice-to-have

| ID | Item | Sursă | Estimare |
|---|---|---|---|
| **K** | 3 dept × tip × sem fără acoperire (Programare laborator sem=2, etc.) | RAPORT_REPARARE | 30min seed |
| **L2** | Achievements icon mapping explicit (nu heuristic pe nume) | PLATFORM-COMPLETE | 1h |
| **N1** | Migrare ListFilterBar pe AdminUsers, AdminDashboard tabel, AggregatedResults | RAPORT_REPARARE (E parțial) | 1.5h |
| **N2** | UI CRUD pentru `action_templates` (acum doar API) | sesiune curentă | 2h |

### B4. P3 — Tehnică / cleanup

| ID | Item | Estimare |
|---|---|---|
| **C1** | Șterge teste Playwright obsolete (`v4-deadline-blocking`, `full-platform`, `visual-bug-eval`, `v2-design-verify`) | 30min |
| **C2** | Renunță la directorul fantomă `/Users/anosr/Desktop/test1/AntiGravity` (symlink rezidual) | 5min |
| **C3** | Comentariile RO/EN inconsistente în controlleri (uniformizează în RO) | 1h |

---

## C. Axa lingvistică — exprimare & terminologie

### C1. Bugs lingvistice concrete (din audit fresh)

| Fișier:linie | Problema | Fix |
|---|---|---|
| `EvaluationLifecycle.tsx:1166` | `<option>Tip curs</option>` în select (label rezidual) | Folosește `TERMS.filterActivity` consistent |
| `EvaluationLifecycle.tsx:58–63` | `SCORE_LABELS: 'foarte slab'` (lowercase) vs `KPI: 'Activ'` (capitalized) | Standardizează: capitalize pe label, lowercase pe descrieri |
| `AdminControls.tsx:134` | `console.error('Error loading course names:', error)` engleză | RO: `'Eroare la încărcarea disciplinelor'` |
| `ProfessorDashboard.tsx:3` | Comentariu „cursuri personale" — termenul corect e „discipline" | Editare 1 linie |
| Glossary | Lipsește o regulă pentru „Trimite feedback" vs „Transmite feedback" — folosit ambele | Standardizează la „Trimite" (consistent cu `submit` în engleză) |

### C2. Reguli care trebuie aplicate uniform

1. **disciplină** = noțiunea principală (substantiv); poate avea 1+ **activități** (curs / seminar / laborator). Niciodată „tip curs".
2. **evaluare** = chestionarul completat de student pentru o disciplină. „Chestionar" doar pentru meta (chestionar de feedback platformă).
3. **profesor / cadru didactic** — folosește „profesor" în UI casual; „cadru didactic" la admin/rapoarte oficiale.
4. **rezultat / scor** — „scor" pentru valoare numerică Likert; „rezultat" pentru agregare/raport.
5. Capitalize doar primul cuvânt în label-uri (sentence case), NU title case.
6. Verbele de acțiune la imperativ: „Trimite", „Salvează", „Anulează" (NU „Trimiteți"/„Salvați").

### C3. Acțiuni
- Adaugă în `glossary.ts` o secțiune `verbs: { submit, save, cancel, view, edit, delete, ... }` ca să garantezi uniformitatea
- Grep automat: `git grep -E "Tip curs|Course|Submit|Loading|Error " frontend/src/` → la 0 rezultate

---

## D. Axa logică — predictibilitate & defensive coding

### D1. Findings concrete din audit fresh

| Cat. | Locație | Problema | Fix |
|---|---|---|---|
| Defensiv | `AdminUsers.tsx:167` | `pp.courses.map(...)` fără verificare array | `pp.courses?.map(...) ?? []` |
| Defensiv | `ProfessorStudents.tsx:128` | `c.students.filter()` fără verificare | `(c.students ?? []).filter()` |
| Defensiv | `EvaluationLifecycle.tsx:248–252` | `monthly.data.map()` când `monthly` poate fi `null` | `(monthly?.data ?? []).map()` |
| Conversie | `EvaluationLifecycle.tsx:181` | `Number(v)` poate da NaN — trimite la backend | `Number(v) || undefined` |
| Confirm | `AdminUsers.tsx:183`, `AdminAchievements.tsx:86` | `window.confirm()` nativ — inconsistent UX | Component `<ConfirmDialog>` reutilizabil |
| a11y | `AdminUsers.tsx:510` | `<button><XMarkIcon /></button>` fără `aria-label` | Adaugă `aria-label="Elimină disciplina"` |
| State | `ProfessorStudents.tsx:38` | `if (error || !data)` — `data = { courses: [] }` valid → ar arăta eroare | `if (error && !data)` |

### D2. Pattern-uri repetate de îmbunătățit

1. **`<ConfirmDialog>` global** — înlocuiește toate `confirm()` native (5–7 locuri)
2. **`<LoadingState>` standardizat** — spinner + text „Se încarcă…" cu `role="status"` și `aria-busy`
3. **Type-guard helper** `safeArray<T>(x): T[]` pentru `.map`/`.filter` pe inputuri externe
4. **Eroare API → toast unificat** — middleware axios interceptor cu mapare cod→mesaj

---

## E. Axa testare — Playwright + alte

### E1. Status suite curent
- ~30 spec-uri în `tests/e2e/`
- Conform `BUG_AUDIT_REPORT.md`: 23/23 verzi în suite-ul mainstream
- 4 spec-uri obsolete care eșuează: `v4-deadline-blocking` (eval ID hardcoded), `full-platform`, `visual-bug-eval`, `v2-design-verify` — selectoare vechi

### E2. Teste de șters (curățare)
```
tests/e2e/v4-deadline-blocking.spec.ts  → reasign ID din DB curent
tests/e2e/full-platform.spec.ts        → rescriere (selectoare obsolete)
tests/e2e/visual-bug-eval.spec.ts      → spec mort
tests/e2e/v2-design-verify.spec.ts     → pre-refactor, irelevant
```

### E3. Teste noi necesare

| # | Spec | Scop |
|---|---|---|
| T1 | `pf-history.spec.ts` | submit feedback → counter crește → istoric apare → modal vizualizare |
| T2 | `prof-profile-crud.spec.ts` | admin creează profesor → asignează disciplină → profesor o vede în Dashboard |
| T3 | `filter-bar.spec.ts` | ListFilterBar pe 3 pagini (ProfStudents/ProfReports/EvalHistory) — tabs + selects + clear |
| T4 | `situatia-mea.spec.ts` | profesor click → navighează la `/professor/dashboard` (nu mai aplică filtru) |
| T5 | `multi-select-filter.spec.ts` | (după implementarea J) — selectează an=1 ȘI an=2, KPI se actualizează |
| T6 | `a11y-keyboard.spec.ts` | tab prin tot lifecycle-ul; screen reader announce-uri |
| T7 | `console-clean.spec.ts` | crawl 25 pagini × 3 roluri = 0 erori console (regression) |
| T8 | `i18n-no-english.spec.ts` | grep prin DOM pentru cuvinte EN reziduuale |

### E4. Acoperire testare în afara Playwright
- **Unit tests backend (Jest):** zero acoperire pe controlleri. Min de pus: `platformFeedbackController.submit` (cazul empty rows / submission_id corect), `adminUsersController.applyProfessorAssignments`.
- **Schema migrations test:** verifică că `015-platform-feedback-submissions` rulează idempotent pe DB existent (script de assert).

---

## F. Sprint propus — 3 cicluri

### Sprint S1 — „Verificare & închidere stoc P0" (1 zi, 8h)
1. Sweep peste R1–R3, H1–H2, H5 → confirm că sunt închise sau identifică gap-uri reale (1h)
2. **R8** — paginare ProfessorReports + AdminReports (2.5h)
3. **L3** — Reset password real backend + UI (1.5h)
4. **C1** — șterge spec-uri obsolete + adaugă T7 console-clean (1h)
5. Pass linguistic C1 (1h)
6. **K** — adaugă cele 3 cursuri lipsă în seed pentru edge case dept×tip×sem (30min)
7. Commit + raport S1 (30min)

### Sprint S2 — „Multi-select + extensii" (1.5 zi, 12h)
1. **J** — multi-select filtre (frontend MultiSelect + backend array params) (5h)
2. T5 spec — multi-select (1h)
3. **N1** — migrare ListFilterBar pe AdminUsers + AggregatedResults (1.5h)
4. **N2** — UI CRUD pentru action_templates (2h)
5. **M6** — Export ARACIS endpoint + UI button (2h)
6. T2 + T3 + T4 spec-uri noi (30min)

### Sprint S3 — „Polish & robustețe" (1 zi, 8h)
1. Defensive coding pass D1–D2 (3h)
2. `<ConfirmDialog>` + `<LoadingState>` componente + integrare (2h)
3. **C3** — uniformizare comentarii (1h)
4. Unit tests backend min (1h)
5. T6 (a11y) + T8 (i18n) (1h)

**Total:** 28h muncă (3.5 zile FTE) → platforma 100% curată + testată + predictibilă.

---

## G. Definition of Done

Pentru a închide planul:
- [ ] `git grep "Tip curs"` → 0 rezultate
- [ ] `git grep -i "course\|submit\|loading\|error " frontend/src/pages/` → 0 rezultate user-facing
- [ ] Playwright suite: ≥ 35 teste, 0 fail, 0 flaky
- [ ] `console-clean.spec.ts` trece pe 25+ pagini × 3 roluri
- [ ] Backend: minim 3 fișiere de unit test (controller-uri critice)
- [ ] Toate `window.confirm()` înlocuite cu `<ConfirmDialog>`
- [ ] Toate `.map`/`.filter` pe input extern → safe-guarded
- [ ] Migration 015 documentată în README + script idempotent verify
- [ ] Glossary completat cu secțiunea `verbs`

---

## H. Risc & dependențe

| Risc | Mitigare |
|---|---|
| Multi-select (J) cere schimbare API contract | Suportă BOTH `year=1` și `year=1&year=2` în paralel — backwards compatible |
| Reset password (L3) cere SMTP config | Folosește console transport în dev; lăsăm flag `MAIL_PROVIDER=console\|smtp` |
| Refactor confirm dialog poate sparge teste | Update spec-uri în același PR |
| Directorul fantomă `AntiGravity` | Verifică că nimic nu îl referențiază (grep) înainte de șters |

---

## I. Note finale & decizii deschise

- **Decision needed:** Mai vrem să existe pagina **„Situația mea"** pe Acasă (cum era inițial, ca filtru) sau doar prin buton către `/professor/dashboard`? Acum e doar buton — confirmă că OK.
- **Decision needed:** Multi-select pe filtre — limitez la max 3 selecții simultan sau nu pun limită?
- **Decision needed:** Export ARACIS — schema oficială? (cere doc oficial dacă există)
- **Open question:** Există clienți reali care folosesc platforma sau e numai pentru dizertație? Influențează prioritizarea reset password real vs. mock.

> Acest plan e exhaustiv; nu intenționez să execut nimic până nu confirmi prioritizarea sau alegi un sprint.
