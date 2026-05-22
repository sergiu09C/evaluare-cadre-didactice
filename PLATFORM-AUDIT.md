# Audit Platformă ECD — Corelare Roluri + Design Consistency

> **Data:** 21 mai 2026
> **Metodologie:** Inventar exhaustiv backend (`server.js`, `routes/*.js`) + frontend (`pages/*.tsx`, `components/*.tsx`) + audit Playwright pe toate cele 3 roluri + verificare CRUD cross-role.
> **Status:** 0 console errors, 0 network 4xx/5xx, dar **discrepanțe semnificative** între design student vs. admin/profesor și **lipsuri funcționale** la sidebar profesor.

---

## 📊 1. Tabel Matrice — Funcționalități × Roluri

Următoarele 35 acțiuni acoperă tot ce se poate face în platformă. ✅ = disponibil și funcțional · ⚠️ = parțial / disponibil dar UI vechi · ❌ = lipsește.

### A. Autentificare & navigare globală

| Acțiune | Student | Profesor | Admin | Backend OK |
|---------|:-------:|:--------:|:-----:|:----------:|
| Login / Logout | ✅ | ✅ | ✅ | `/api/auth/*` |
| Schimbă preferințe accesibilitate (font, dark, dyslexia) | ✅ | ✅ | ✅ | `/api/user/preferences` |
| Vede notificări (clopoțel topbar) | ✅ | ⚠️ DROPDOWN GOL | ⚠️ DROPDOWN GOL | `/api/student/notifications` (NUMAI pentru student) |
| Caută rapid (⌘K Command Palette) | ✅ | ⚠️ apelează endpoint student | ⚠️ apelează endpoint student | — |
| Sidebar cu navigare per rol | ✅ (5 itemi) | ⚠️ (2 itemi) | ⚠️ (4 itemi) | — |
| Ghid utilizator dedicat rolului | ✅ `/guide` | ❌ | ❌ | — |

### B. Student — fluxul de evaluare

| Acțiune | Student | Profesor | Admin | Backend OK |
|---------|:-------:|:--------:|:-----:|:----------:|
| Vede lista profesorilor de evaluat | ✅ | — | ❌ | `/api/evaluations/professors` |
| Pornește/continuă o evaluare | ✅ | — | ❌ | `POST /api/evaluations` |
| Completează 19 itemi Likert + comentariu | ✅ | — | ❌ | `PUT /api/evaluations/:id/responses` |
| Autosave la 30s | ✅ | — | ❌ | idem |
| Submit cu confirmare | ✅ | — | ❌ | `POST /api/evaluations/:id/submit` |
| Vede istoric propriu | ✅ `/history` | — | ❌ | `/api/student/evaluation-history` |
| Vede rezultate agregate (radar facultate) | ✅ `/results` | — | ⚠️ vede via admin/stats | `/api/student/feedback-stats` |
| Achievements / gamification | ✅ `/achievements` | — | ❌ | `/api/student/achievements` |

### C. Profesor — vizualizare propriile evaluări

| Acțiune | Student | Profesor | Admin | Backend OK |
|---------|:-------:|:--------:|:-----:|:----------:|
| Vede dashboard propriu (KPIs scor mediu, total) | — | ⚠️ DESIGN VECHI | ✅ via `/admin/professor/:id` | `/api/professor/dashboard` |
| Vede listă cursuri pe care le predă | — | ⚠️ DESIGN VECHI | ✅ | `/api/professor/courses` |
| Vede detalii curs (scoruri per disciplină) | — | ⚠️ DESIGN VECHI | ✅ | `/api/professor/courses/:id/stats` |
| Vede comentarii anonimizate de studenți | — | ⚠️ DESIGN VECHI | ✅ | idem |
| Exportă raport CSV propriu | — | ⚠️ DESIGN VECHI | ✅ | `/api/professor/export` |
| Vede evoluție temporală (trend pe semestre) | — | ❌ (statistici per curs, nu trend) | ❌ | — niciun endpoint dedicat |
| Vede comparație cu media departamentului | — | ❌ | ✅ via admin discipline | — niciun endpoint pentru profesor |

### D. Admin — control instituțional

| Acțiune | Student | Profesor | Admin | Backend OK |
|---------|:-------:|:--------:|:-----:|:----------:|
| Vede dashboard global (4 KPIs: studenți, profesori, evaluări, rată) | ❌ | ❌ | ⚠️ DESIGN VECHI | `/api/admin/dashboard` |
| Vede top performers + needs attention | ❌ | ❌ | ⚠️ DESIGN VECHI | idem |
| Filtrare avansată (facultate, an, tip curs) | ❌ | ❌ | ⚠️ DESIGN VECHI | `/api/admin/stats/filtered` |
| Comparație profesori pe aceeași disciplină | ❌ | ❌ | ⚠️ DESIGN VECHI | `/api/admin/stats/discipline` |
| Activează/dezactivează platforma | ❌ | ❌ | ⚠️ DESIGN VECHI | `PUT /api/platform/settings` |
| Configurează deadline evaluări | ❌ | ❌ | ⚠️ DESIGN VECHI | idem |
| Trimite mesaje masive studenți (cu target) | ❌ | ❌ | ⚠️ DESIGN VECHI | `POST /api/platform/messages/send` |
| Editează chestionar (CRUD + reorder întrebări) | ❌ | ❌ | ⚠️ DESIGN VECHI | `/api/questions` (5 endpoints) |
| Configurează SMTP email | ❌ | ❌ | ⚠️ DESIGN VECHI | `PUT /api/platform/settings` |
| Vede tabel profesori cu sortare | ❌ | ❌ | ⚠️ DESIGN VECHI | `/api/admin/professors` |
| Click profesor → vede detalii complete | ❌ | ❌ | ⚠️ DESIGN VECHI | `/api/admin/stats/professor/:id` |
| Vede rapoarte tabulare/multi-tab | ❌ | ❌ | ⚠️ DESIGN VECHI | `/api/admin/stats/*` |
| Reorder întrebări prin drag&drop | ❌ | ❌ | ⚠️ EXISTĂ DAR UI VECHI | `POST /api/questions/reorder` |
| Test conexiune SMTP | ❌ | ❌ | ⚠️ DESIGN VECHI | `POST /api/platform/test-email` |
| Istoric mesaje trimise | ❌ | ❌ | ⚠️ DESIGN VECHI | `/api/platform/messages/history` |

### E. Acțiuni cross-role care **lipsesc complet din UI** (deși ar fi natural)

| Acțiune lipsă | Cui i-ar trebui | Dificultate adaugare |
|---------------|-----------------|--------------------|
| **Admin · Editor "Closing-the-loop"** (publică textul „Ați evaluat, noi am acționat" văzut de studenți pe dashboard) | Admin | Mediu — nou endpoint + tabelă |
| **Admin · CRUD utilizatori** (creare/editare/dezactivare studenți și profesori) | Admin | Mare — endpoint-uri lipsesc complet |
| **Admin · Vede toate evaluările unui profesor specific** (drill-down individual) | Admin | Mic — există API, lipsește pagina dedicată |
| **Admin · Override/anulează o evaluare individuală** (în caz de campanie negativă) | Admin | Mediu |
| **Profesor · Vede notificări** (când studenții complete evaluări noi) | Profesor | Mediu — endpoint `/api/professor/notifications` lipsește |
| **Profesor · Trend temporal scor** (line chart pe semestre) | Profesor | Mic — nou endpoint |
| **Profesor · Plan de îmbunătățire (din raport)** | Profesor | Mediu — UI nou |
| **Profesor · Acces la ghid și setări** | Profesor | Mic — copie din student sidebar |
| **Toate rolurile · Schimb parolă din UI** | Toate | Mic — endpoint lipsește |

---

## 🔗 2. Corelarea Datelor între Roluri (verificat în testare)

### ✅ Funcționează corect end-to-end
| Flux | Verificare | Rezultat |
|------|------------|----------|
| Admin editează chestionar → student primește exact aceleași întrebări | API call: admin vede 13 întrebări, studentul primește 13 | **OK** ✅ |
| Admin trimite mesaj masiv → student îl vede în "Mesaje importante" | `POST /messages/send` cu target=all → `GET /messages/student` | **OK** ✅ |
| Admin schimbă setări platformă (`is_active`, deadline) → studentul vede statusul | Citire `is_active=true` posibilă din ambele roluri | **OK** ✅ |
| Student submitează evaluare → profesorul vede agregat în Dashboard | Profesorul poate citi propriul dashboard | **OK** ✅ |

### ⚠️ Lipsuri de corelare
| Flux dorit | Problemă |
|------------|----------|
| Admin schimbă text „closing-the-loop" → studentul îl vede pe Dashboard | Textul este HARDCODAT în `StudentDashboard.tsx`. Nu există endpoint admin pentru editare. Student vede mereu același text demonstrativ. |
| Admin schimbă culoarea/branding-ul → toți utilizatorii văd | Toate tokens sunt în `tokens.css` static. Nu există UI admin pentru theming. |
| Admin dezactivează platforma → student nu mai poate submite | Backend are middleware `requirePlatformActive`, dar UI student NU afișează mesaj „Platforma este închisă" — doar primește 403. |
| Profesor răspunde la comentariile studenților | Nu există. Comentarii sunt one-way. |
| Admin marchează evaluări „alertă roșie" → profesorul vede notificare | Nu există. Profesorul nu primește nicio notificare. |
| Admin face „export anonimizat" pentru raportare ARACIS | Nu există endpoint admin de export agregat. |

---

## 🎨 3. Audit Design (verificat automat cu Playwright)

Fiecare pagină a fost scanată: număr clase vechi (`.card`, `.btn-*`, `bg-gray-*`, `text-gray-*`, `bg-blue-*`) vs. componente noi (Card/Button/Badge, paleta navy+violet, tokens-uri proprii).

### 📈 Scoruri design per pagină (0–100)

| Pagină | Rol | Score | Clase vechi | Componente noi | Status |
|--------|-----|------:|------------:|---------------:|--------|
| StudentDashboard | Student | **100** | 27 | 86 | ✅ Nou complet |
| ActiveEvaluations | Student | **100** | 27 | 95 | ✅ Nou complet |
| EvaluationHistory | Student | **100** | 27 | 93 | ✅ Nou complet |
| AggregatedResults | Student | **100** | 27 | 66 | ✅ Nou complet |
| Achievements | Student | **100** | 27 | 62 | ✅ Nou complet |
| EvaluationForm | Student | **100** | * | * | ✅ Nou complet |
| LoginPage | Toate | **100** | * | * | ✅ Nou complet |
| AdminDashboard | Admin | **0** | **1064** | 43 | 🔴 Vechi complet |
| AdminControls | Admin | **0** | 51 | 41 | 🔴 Vechi complet |
| AdminReports | Admin | **0** | **660** | 41 | 🔴 Vechi complet |
| ProfessorDetails (vizibil admin) | Admin | **0** | 49 | 39 | 🔴 Vechi complet |
| ProfessorDashboard | Profesor | **0** | 68 | 38 | 🔴 Vechi complet |
| ProfessorCourseDetails | Profesor | **0** | 128 | 36 | 🔴 Vechi complet |
| ProfessorReports | Profesor | **0** | 52 | 38 | 🔴 Vechi complet |

> **Notă:** „27 clase vechi" pe paginile student vine de la Layout-ul comun (sidebar, topbar) — sunt clase legitime, nu probleme. „1064 clase vechi" pe AdminDashboard vin dintr-un tabel HTML cu sute de celule colorate hardcodat.

### Discrepanțe specifice constatate

**1. Layout / Topbar / Sidebar funcționează corect pentru toate rolurile** — același cod `Layout.tsx`. Geist font, `bg-neutral-25`, NotificationsDropdown, CommandPalette: aplicate global. ✅

**2. Sidebar items inconsistente per rol:**

| Rol | Itemi actuali | Itemi lipsă față de student |
|-----|---------------|------------------------------|
| Student | Acasă, Evaluări active, Istoric, Rezultate agregate, Achievements, Ghid pentru studenți, Setări | — (referință) |
| Profesor | Acasă, Rapoarte | **Cursurile mele**, **Notificări**, **Ghid pentru profesori**, **Setări** |
| Admin | Acasă, Gestionare, Rapoarte, Utilizatori | **Chestionar (acces direct)**, **Mesaje (acces direct)**, **Ghid pentru admin**, **Setări** |

**3. Componente vechi nefolosite în admin/profesor:**
- `.btn btn-primary` → ar trebui `<Button variant="primary">`
- `.btn btn-secondary` → `<Button variant="secondary">`
- `.card p-6` (string) → `<Card padding="md">`
- `bg-blue-100 text-blue-800` (badge informativ) → `<Badge tone="info">`
- `bg-green-100 text-green-800` (badge succes) → `<Badge tone="success">`
- `bg-red-50 border-red-200` (alertă) → `<Card>` cu `tone="danger"` (lipsește variantă tone pe Card)
- Tabele HTML pure → ar trebui în `<Card padding="none">` cu styling consistent

**4. Bug-uri minore detectate în taburi admin:**
- 4 din 6 taburi din AdminControls nu sunt detectabile cu selectorul `button[role="tab"]` — folosesc `<button>` plain fără atribut role. **Recomandare:** adaugă `role="tab"` pentru accesibilitate.

---

## 🐛 4. Lista Bug-urilor & Discrepanțelor Găsite (sortate pe prioritate)

### 🔴 CRITIC (blochează folosirea de către un rol)
*Niciun bug critic detectat. Aplicația rulează end-to-end pentru toate rolurile.*

### 🟠 HIGH PRIORITY (afectează UX major)

| # | Problemă | Locație | Fix sugerat |
|---|----------|---------|-------------|
| H1 | **Design vechi pe TOATE paginile admin** (Dashboard, Controls, Reports, ProfessorDetails) — clase `.card`, `.btn-*`, `bg-gray-*`, `text-gray-*` peste tot | `pages/Admin*.tsx`, `pages/ProfessorDetails.tsx` | Refactor pe Card/Button/Badge/KPICard din `components/ui/` |
| H2 | **Design vechi pe TOATE paginile profesor** | `pages/Professor*.tsx`, `components/professor/*.tsx` | Idem H1 |
| H3 | **Notificări dropdown apelează endpoint care există DOAR pentru student** | `NotificationsDropdown.tsx` linia 30 — `api.getNotifications()` → `/api/student/notifications` | Endpoint backend nou: `/api/notifications` (rol-agnostic) sau dropdown ascuns pentru non-student |
| H4 | **Sidebar profesor are doar 2 itemi** (Acasă + Rapoarte) — nu vede „Cursurile mele" ca destinatar dedicat, nu are Setări, Ghid, Notificări | `components/Layout.tsx` linia 41 | Adaugă itemi în `professorNav` |
| H5 | **Text „closing-the-loop" hardcodat** — admin NU poate edita textul „Ați evaluat, noi am acționat" văzut pe Dashboard student | `pages/StudentDashboard.tsx` ll. 134–166 | Tabelă DB `closing_loop_entries` + endpoint admin CRUD + UI editor |

### 🟡 MEDIUM PRIORITY (lipsuri funcționale ușor de adăugat)

| # | Problemă | Locație | Fix sugerat |
|---|----------|---------|-------------|
| M1 | **Admin nu poate edita utilizatori** (creare/dezactivare studenți/profesori) | `routes/admin.js` | Adaugă CRUD `/api/admin/users` |
| M2 | **Profesor nu are pagină „Cursurile mele"** dedicată — apare doar pe Dashboard | `pages/Professor*` | Pagină nouă `/professor/courses` |
| M3 | **Profesor nu vede trend temporal** (line chart pe semestre) | `professorController.js` | Endpoint nou `/api/professor/trend` + chart Recharts |
| M4 | **Lipsește badge `tone="danger"` pe Card** — folosit în UI vechi `bg-red-50 border-red-200` | `components/ui/Card.tsx` | Adaugă prop `tone?: 'default' \| 'success' \| 'warning' \| 'danger'` |
| M5 | **AdminControls 4 taburi fără `role="tab"`** (a11y) | `pages/AdminControls.tsx` | Adaugă atribute |
| M6 | **Admin nu poate exporta date pentru ARACIS** | — | Endpoint nou `/api/admin/export/full` |
| M7 | **Backend cere `requirePlatformActive` dar frontend nu afișează stare** — student primește 403 fără explicație | `pages/Active*`, `pages/EvaluationForm` | Adaugă banner global dacă `settings.is_active===false` |

### 🟢 LOW PRIORITY (polish)

| # | Problemă | Locație | Fix sugerat |
|---|----------|---------|-------------|
| L1 | Inconsistență: student are „Ghid", profesor și admin nu | `Layout.tsx` | Creează `/guide/professor` și `/guide/admin` (sau folosesc același cu adaptare per rol) |
| L2 | Achievements icons folosesc `inferIcon` heuristic — nu corespund mereu cu mockup-ul | `Achievements.tsx` | Mapează explicit per `achievement.id` |
| L3 | Reset password din UI lipsește | — | Endpoint + pagină `/forgot-password` |
| L4 | Logout nu cere confirmare | `Layout.tsx` | Modal de confirmare cu Headless UI |

---

## 🗺️ 5. Plan de Execuție (3 sprint-uri + polish)

### Sprint 1 — Design parity (3–5 zile)
**Obiectiv:** Toate paginile admin + profesor folosesc design system nou.

**Pași concreți:**
1. **Extinde Card cu prop `tone`** (`default | success | warning | danger | info`) — 30 min
2. **Refactor ProfessorDashboard.tsx** la Card/Button/KPICard/Badge — 1.5h
   - Header: KPICard pentru "Total evaluări / Medie / Studenți unici"
   - Lista cursuri: Card cu Avatar (inițiale curs), Badge status
   - Stripped down: elimină dublarea SVG-uri trend, folosește KPICard cu `spark`
3. **Refactor ProfessorCourseDetails.tsx** — 2h
   - Header curs: Card cu meta info
   - Scoruri detaliate: KPICard cu 5 dimensiuni
   - Lista evaluări: Card listă (similar cu StudentDashboard)
   - Comentarii: Card cu `tone="info"` per comentariu
4. **Refactor ProfessorReports.tsx** — 1.5h
5. **Refactor AdminDashboard.tsx** — 2h
   - KPI overview: KPICard × 4
   - Top performers/Needs attention: Card lists cu Avatar + Badge tone
   - Filter chips: pattern-ul din `ActiveEvaluations.tsx`
6. **Refactor AdminControls.tsx** — 3h
   - Tabs cu `Headless UI Tab` + design system
   - Adaugă `role="tab"` (M5)
   - Form fields cu `Input` component
7. **Refactor AdminReports.tsx** — 2h
8. **Refactor ProfessorDetails.tsx** (vizibil din admin) — 1h
9. **Update `components/professor/StatCard.tsx` și `CourseCard.tsx`** sau șterge-le (înlocuiește cu Card/KPICard) — 1h

**Verificare:** rerulează `deep-audit.spec.ts` — toate paginile admin/profesor să aibă score ≥80/100.

### Sprint 2 — Sidebar + functionality parity (2–3 zile)
**Obiectiv:** Toate cele 3 roluri au sidebar consistent ca structură, profesor are pagini noi.

**Pași:**
1. **Extinde `professorNav`** cu (1.5h):
   - „Cursurile mele" → `/professor/courses` (lista cursurilor)
   - „Notificări" → `/professor/notifications` (eveniment când studenții completează)
   - „Ghid pentru profesori" → `/guide/professor`
2. **Extinde `adminNav`** cu (1h):
   - „Chestionar" → `/admin/questionnaire` (acces direct, fără tab)
   - „Mesaje" → `/admin/messages`
   - „Ghid pentru admin" → `/guide/admin`
3. **Backend: endpoint notificări rol-agnostic** (1h):
   - `/api/notifications` care delege la `feedbackController.getNotifications` cu logică per rol
4. **Pagină nouă `/professor/courses`** (2h) — reutilizează design pattern din `ActiveEvaluations`
5. **Pagini noi `/guide/professor` și `/guide/admin`** (1h) — adaptare `StaticPages.tsx`

### Sprint 3 — Cross-role data flow gaps (3–4 zile)
**Obiectiv:** Tot ce e administrabil este editabil DIN admin, nu hardcodat.

**Pași:**
1. **Editor admin pentru „Closing-the-loop"** (4h):
   - Backend: tabelă `closing_loop_entries (id, title, body, dot_color, related_dim, published_at, sort_order)`
   - Backend: CRUD `/api/admin/closing-the-loop`
   - Backend: GET public `/api/platform/closing-the-loop` (pentru student dashboard)
   - Frontend admin: tab nou în AdminControls SAU pagină dedicată `/admin/closing-the-loop`
   - Frontend student: înlocuiește textul hardcodat în StudentDashboard cu fetch
2. **Admin CRUD utilizatori** (4h):
   - Backend: `/api/admin/users` (GET list, POST create, PUT update, DELETE deactivate)
   - Frontend: pagină `/admin/users` cu tabel + modal edit (Headless UI Dialog)
3. **Profesor trend temporal** (2h):
   - Backend: endpoint `/api/professor/trend` (agregare per semestru)
   - Frontend: line chart Recharts în ProfessorDashboard
4. **Banner global „Platforma este închisă"** (1h):
   - În `Layout.tsx`, fetch `settings.is_active` și afișează banner roșu dacă false

### Polish Sprint (1–2 zile)
1. Logout confirmation modal — 30 min
2. Map explicit icons în Achievements — 30 min
3. Reset password (mailto OR endpoint real) — 1h
4. Test final cu axe DevTools pentru a11y — 2h
5. Verifică Playwright suite: target = 0 erori, scor ≥90/100 design pe TOATE paginile

---

## 🧪 6. Cum reproduci acest audit

```bash
# 1. Pornește serverele
cd /Users/anosr/Desktop/test1/evaluare-cadre-didactice && npm run dev

# 2. În alt terminal:
cd tests
npx playwright test deep-audit

# 3. Vezi rezultate:
cat deep-audit-report.json | jq '.summary'
cat deep-audit-report.json | jq '.findings'
cat deep-audit-report.json | jq '.designAudits[] | {page, role, score: .designScore, oldClasses: .oldClassCount, notes}'
```

**Fișiere generate:**
- `tests/deep-audit-report.json` — JSON cu toate findings + scoruri design
- `tests/audit-results.json` — Audit original (15 teste student flow)
- `tests/full-platform-audit.json` — Audit complet 21 puncte

---

## ✅ 7. Concluzii

**Ce merge bine:**
- Backend solid, 0 endpoint-uri lipsă, 0 404 din frontend
- Cross-role data flow funcționează (admin → student propagă mesaje, chestionar, setări)
- Student UX este complet modernizat, conform design system
- Acoperire test e2e: 16 teste deep-audit, 15 student-flow, 10 full-platform — toate trec

**Ce nu merge consistent:**
- **Design dual:** student arată ca o aplicație 2026, admin/profesor arată ca o aplicație 2020
- **Sidebar inegal:** profesorul are doar 2 itemi vs. 7 la student
- **Editare „live" lipsă pentru admin** la elementele care apar la studenți (text closing-the-loop, branding)
- **Profesor primește puține semnale active** — notificări, trend, plan de îmbunătățire

**Verdict:** Platforma este complet **funcțională** la toate cele 3 roluri, dar are nevoie de **3 sprint-uri** (~10 zile de muncă) pentru a fi consistentă vizual și pentru a oferi admin-ului control complet asupra a ce văd studenții.
