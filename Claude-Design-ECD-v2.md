# Claude Design Prompt v2 — ECD (Evoluție UI/UX)

> **Context fișier:** Acesta este al doilea brief de design pentru aplicația ECD (Evaluarea Cadrelor Didactice). Primul brief (`Claude-Design-ECD.md`) a stabilit fundația — paleta navy + violet, Geist font, Card/Button/Badge/KPICard, flow-ul student. Acest al doilea brief pleacă de la **ce există deja** și cere îmbunătățiri specifice de UI/UX, data visualization și microinteracțiuni pentru a duce experiența la nivel premium.
>
> **Stack tehnic implementabil:** React 18 + TypeScript + Vite + Tailwind CSS 3 + Headless UI + Heroicons + Recharts. Design system tokens în `frontend/src/styles/tokens.css`. Lazy loading per rută cu React.lazy + Suspense.

---

=== START PROMPT ===

# Brief de design v2 — ECD · evoluție polish + data viz

## 1. Cine ești și ce ai de făcut

Ești designer UI/UX senior cu specializare în **data visualization, dashboard design și microinteracțiuni**. Ai lucrat pe produse SaaS B2B (Linear, Vercel, Stripe, Notion) și știi să balansezi densitatea informațională cu claritate vizuală.

Aplicația ECD există deja, are 25 pagini funcționale, design system stabilit, datele reale curg prin platformă. **Nu redesignuezi de la zero** — ești invitat să identifici momentele unde experiența poate fi îmbunătățită semnificativ și să propui soluții concrete, implementabile.

**Outputul tău:** un pachet de îmbunătățiri pe 4 dimensiuni (vezi secțiunea 6), fiecare cu mockup-uri high-fi și spec de implementare.

## 2. Starea curentă (referință)

### Design system existent (NU-l reinventa, doar extinde-l dacă e cazul)

- **Paletă:** Primary navy (#0E2233 → #06121E), Accent violet (#7C3AED → #A78BFA), Neutrals cool blue-tinted (#FAFAFB → #0A0B0E), Semantic (success #10B981, warning #F59E0B, danger #EF4444, info #3B82F6)
- **Tipografie:** Geist (display + body), Geist Mono (numere/cod), scala modulară 1.25
- **Spacing:** 4px base scale, container 1280px max
- **Radii:** 4 / 8 / 12 / 16 / 24px
- **Shadows:** 5 niveluri elev-1 → elev-5, soft layered
- **Motion:** 150/200/300ms, easing `cubic-bezier(0.16, 1, 0.3, 1)`

### Componente UI atomice disponibile
`Button` (5 variante × 3 size), `Input` (cu prefix/suffix/error/hint), `Card` (cu prop `tone`: default/success/warning/danger/info/accent/primary), `Badge` (7 tone-uri), `Avatar` (5 culori cu inițiale), `Progress` (linear cu 3 culori), `KPICard` (cu sparkline opțional), `Tabs` (underline + segmented), `Select`, `Switch`, `EmptyState`, `SortHeader`.

### Componente complexe deja construite
`Layout` (sidebar 248px + topbar sticky + banner platform-closed + CommandPalette + NotificationsDropdown + DeadlineTimer), `LikertScale` Varianta C (size-progressive grayscale, keyboard a11y), `AccessibilityMenu` (font size + dyslexia font + high contrast), `AdminActionsPanel`, `ErrorBoundary`.

### Cele 3 roluri + paginile lor (25 pagini total)

**STUDENT (8 pagini):**
- `/` StudentDashboard — KPIs (4), closing-the-loop banner, breakdown semestru (5 metrici), lista evaluări active, radar facultate, achievements teaser
- `/evaluations` ActiveEvaluations — listă completă cu filtre status
- `/evaluation/:id` EvaluationForm — flow single-question, Likert + text liber, autosave 30s, dot navigator
- `/history` EvaluationHistory — istoric submitted + draft
- `/results` AggregatedResults — radar facultate curent vs. anterior, lista schimbări CEAC
- `/achievements` Achievements — hero deblocat + grid deblocate/locked
- `/feedback` PlatformFeedback — chestionar despre platformă (Likert + text + choice)
- `/guide` Guide — markdown dinamic editat de admin

**PROFESOR (7 pagini):**
- `/professor` ProfessorDashboard — KPIs (3), trend chart (Recharts LineChart), listă cursuri cu badge calitate, quick actions
- `/professor/courses` ProfessorCourses — listă completă cu filtre course_type
- `/professor/students` ProfessorStudents — listă anonimă per disciplină (DOAR inițiale + flag evaluat), filtre status
- `/professor/course/:id` ProfessorCourseDetails — KPIs, medii per dimensiune, distribuție răspunsuri (Bar/Pie), tabel întrebări, comentarii text anonime
- `/professor/actions` ProfessorActions — inbox acțiuni propuse (3 secțiuni: propuse / în curs / istoric)
- `/professor/reports` ProfessorReports — filtre + export CSV
- `/professor/trend` (integrat în Dashboard) — line chart pe semestre

**ADMIN (10 pagini):**
- `/admin` AdminDashboard — 4 KPIs, DashboardCharts (3 Recharts), top 5 + needs attention (clickabil → ProfessorDetails), filtre, tabel profesori sortabil cu SortHeader
- `/admin/controls` AdminControls — 6 tab-uri (Platform, Mesaje, Filtre, Discipline, Chestionar, Email)
- `/admin/closing-loop` AdminClosingLoop — CRUD pe entries publicate studenților
- `/admin/guides` AdminGuides — editor markdown pentru 3 ghiduri (tab-uri)
- `/admin/achievements` AdminAchievements — CRUD definiții cu praguri + criterii
- `/admin/platform-feedback` AdminPlatformFeedback — 2 tab-uri (Editor întrebări + Raport cu Bar/Pie Recharts + interpretare text)
- `/admin/users` AdminUsers — CRUD utilizatori cu filtre rol
- `/admin/reports` AdminReports — multi-tab cu rapoarte filtrabile
- `/admin/professor/:id` ProfessorDetails — vedere completă + AdminActionsPanel (propunere + agregare meetings)

### Sidebar items per rol (după ce a expandat la #1-9)
| Rol | Itemi (în ordine) |
|-----|-------------------|
| Student (6) | Acasă · Evaluări active · Istoric · Rezultate agregate · Achievements · Feedback platformă |
| Profesor (6) | Acasă · Cursurile mele · Studenți (anonim) · Acțiuni propuse · Rapoarte · Feedback platformă · Ghid |
| Admin (8) | Acasă · Gestionare · Closing-the-loop · Editor ghiduri · Editor achievements · Feedback platformă · Rapoarte · Utilizatori · Ghid |

### Date reale în sistem (NU folosi lorem ipsum)
- 5 facultăți · 15 programe · 240 grupe · 1.200 studenți · 200 profesori · 1 admin · 320 cursuri active
- ~5.900 evaluări trimise, ~63.000 răspunsuri Likert, ~5.250 comentarii text anonime
- 13 întrebări chestionar (10 Likert + 3 text), 5 dimensiuni (predare/comunicare/resurse/evaluare/disponibilitate)
- 6 achievement-uri standard cu praguri configurabile
- Distribuție scoruri: min 2.38 · medie 3.58 · max 4.74

## 3. Ce **NU** trebuie refăcut

Acestea sunt deja la 100/100 — NU le redesignuezi, doar le respecți:
- Paleta de culori, tipografia Geist, sistemul de spacing/radii/shadows
- Layout-ul (sidebar 248px + topbar 64px sticky)
- LikertScale Varianta C (size-progressive grayscale)
- AccessibilityMenu (font scaling, dyslexia, high contrast)
- Login page (split brand panel navy + form light)
- StudentDashboard hero + KPI cards (deja recente)
- Componente UI atomice (Card/Button/Badge/Avatar/KPICard)

## 4. Ce ÎMBUNĂTĂȚEȘTI — direcții cheie

### A. Data Visualization — pune datele să spună o poveste

Acum folosim Recharts simplu (BarChart, LineChart, PieChart, radar custom SVG). **Putem face mai mult:**

1. **Storytelling cards** — în loc de simple KPI numerice, propune layout care contextualizează (ex: „Scorul tău mediu e 3.58, ceea ce te plasează în **top 28%** din facultate. Față de semestrul trecut, ai crescut cu +0.18 puncte la dimensiunea Predare.")
2. **Distribuția scorurilor** — în loc de bar chart simplu, propune **histograms + violin plots** cu evidențierea poziției proprii
3. **Heatmaps** — pentru AdminDashboard, heatmap departamente × dimensiuni (deja menționat în brief v1, dar nu implementat încă). Cu drill-down la click.
4. **Sankey diagrams** — flow evaluări (studenți → cursuri → profesori → dimensiuni cu probleme)
5. **Small multiples** — 5 mini-line-charts (câte unul per dimensiune) în loc de un radar singular
6. **Comparație temporală** — mini-spark-line pe fiecare KPI Card cu trend pe ultimele N semestre

**Pagini țintă pentru data viz:**
- `/admin` AdminDashboard (densitate informațională maximă)
- `/admin/reports` AdminReports (multi-tab analitice)
- `/professor` ProfessorDashboard (trend + per-course breakdown)
- `/results` AggregatedResults (radar comparativ — student-facing)
- `/admin/platform-feedback` raport (vizibilitate insights NPS-style)

### B. Density & layout — mai multă informație, fără claustrofobie

- **AdminDashboard** are deja un tabel sortabil cu 200 profesori. Propune o variantă **dense table** (12px rows) cu mini-spark-line per profesor pe ultima coloană
- **ProfessorCourseDetails** are 4 secțiuni mari verticale — propune **dashboard grid** cu 8-12 widget-uri rearanjabile (recomandare: layout 12-col cu widget-uri 4/6/12 col)
- **AdminControls** are 6 taburi cu form-uri lungi — propune **wizard cu progress** sau **saved sections**

### C. Microinteracțiuni & feedback

Acum tranzițiile sunt 150-300ms cu easing modern. Putem îmbogăți:

1. **Skeleton screens** — momentan folosim spinner generic. Propune skeleton specific per tip card (KPI / lista / chart)
2. **Optimistic UI** — la submit evaluare, la salvare guides, la accept acțiune profesor — feedback imediat fără să aștepți API
3. **Toast-uri contextuale** — momentan folosim doar `AccessibleModal` Alert. Propune sistem de toast-uri non-blocant (success / info / warning / error) cu queue
4. **Microcopy pe stări** — empty states, error states, loading states — fiecare ar trebui să aibă microcopy specific pentru context (NU „Loading..." generic)
5. **Achievements unlock animation** — când studentul deblochează un achievement, ar trebui să primească confetti / pulse / haptic-like feedback vizual
6. **Cursor follow** pe link-uri principale (sublinia care urmărește mouse-ul) — opțional, dar adds polish
7. **Page transitions** — momentan rutele se schimbă instant. Propune un fade subtle 150ms

### D. Personalitate & branding

Aplicația trebuie să se simtă FAIMA-UNSTPB, dar premium-modern. Acum e funcțională, dar puțin „rece":

1. **Easter eggs subtile** — pe achievement-uri (mini-animații), pe pagini goale (ilustrații proprii), pe completare 100% evaluări
2. **Onboarding gradat** — la prima logare a unui student, un tooltip-tour care explică sidebar + closing-the-loop banner (cu Headless UI Dialog)
3. **Branding emoțional** — pe LoginPage și empty states, propune ilustrații minimaliste line-art (nu stock photos, nu emoji)
4. **Dark mode design-first** — nu fac inversare, fac un design propriu navy-very-dark + accent foarte vizibil (acum aplicația e doar light)

### E. Pagini noi propuse (opțional dar valoros)

Pe baza ce există, ar putea avea sens:

1. **`/admin/analytics`** — overview executiv cu 6-8 charts esențiale pentru raportare la Senat / ARACIS
2. **`/admin/timeline`** — view cronologic al deciziilor (când s-a propus acțiune X, când s-a finalizat, când s-a publicat schimbare Y)
3. **`/professor/insights`** — AI-style insights bazat pe propriile evaluări (ex: „Studenții de la POO te apreciază pentru claritate, dar la AISD comentariile sugerează mai multe exemple practice")
4. **`/student/profile`** — profil propriu cu istoric, achievements, contribuții totale
5. **`/admin/calendar`** — calendar vizual cu ferestre de evaluare, deadlines, evenimente CEAC

## 5. Pagini concrete cu probleme cunoscute (de prioritizat)

### 5.1 AdminDashboard — tabelul de profesori
Acum: tabel cu 200 rânduri, sortabil. Probleme:
- Scroll lung obositor
- Nu poți filtra direct din coloane
- Lipsește mini-context (ex: trend ultima evaluare)

**Cere:** redesign cu **virtual scrolling** sau **paginare**, **filter chips** per coloană, mini-sparkline ultima coloană.

### 5.2 ProfessorCourseDetails — distribuția răspunsurilor
Acum: BarChart sau Pie (toggle). Probleme:
- Pierzi context — vezi „cât au votat 3" dar nu „dacă 3 e bun sau prost pentru această dimensiune"
- Nu poți compara cu media departamentului

**Cere:** stacked bar cu colorare semantică (1-2 roșu, 3 galben, 4-5 verde) + line orizontală pentru media departamentului ca referință.

### 5.3 AdminPlatformFeedback — raport
Acum: per întrebare, Bar + Pie + medie + interpretare text. Probleme:
- Nu agregezi trend (toate datele sunt cumulate)
- Nu segmentezi pe rol (student vs profesor) — important: ar trebui să vezi „studenții zic X, profesorii zic Y" pe aceeași întrebare

**Cere:** segmentare pe rol cu side-by-side comparison + filtru perioadă (ultima săptămână / luna / total).

### 5.4 StudentDashboard — radar facultate
Acum: SVG custom radar cu 5 dimensiuni. Probleme:
- E un singur snapshot
- Nu vezi cum stai TU vs. facultate

**Cere:** dual-radar (overlay) — tu vs. facultate + tooltip pe fiecare ax cu defalcare.

### 5.5 EvaluationForm — flow-ul completării
Acum: single-question-at-a-time cu progress bar + dot navigator. Probleme:
- Pentru un student care abandonează la jumătate, nu există nudge clar
- Lipsește „estimated time remaining" actualizat pe baza viteză proprie
- Lipsește o vizualizare de tip "filling up a glass" pentru progres

**Cere:** progres îmbunătățit cu time estimation dynamic + indicator visual progress satisfaction (gradient fill).

### 5.6 ProfessorStudents — listă anonimă
Acum: grid cu cartonașe colorate (verde dacă evaluat, galben dacă nu). Probleme:
- 100+ studenți pe ecran obosesc
- Nu există agregare vizuală instant (ce procent e completat)

**Cere:** **dot matrix** mai dense (10px squares) cu hover individual + sumar mare top-level cu "donut chart" rate de participare.

## 6. Output cerut — 4 deliverables concrete

### Deliverable 1: Data viz upgrade pack (6 vizualizări)
Pentru pagini țintă (5.1 → 5.6), propune **6 mockup-uri specifice** cu spec Tailwind/Recharts. Fiecare la 1440px desktop, light mode, cu date reale (preluate din secțiunea 2).

### Deliverable 2: Microinteractions library (4 patterns)
Cod TypeScript/React pentru:
1. **Toast system** (4 variante, queue, auto-dismiss, focus management)
2. **Skeleton components** (KPICard skeleton, CardList skeleton, Chart skeleton)
3. **Achievement unlock animation** (confetti light + scale-in + sound-disabled-by-default)
4. **Page transition** (fade 150ms + reduce-motion fallback)

### Deliverable 3: Empty/Error/Loading states (10 ilustrații + microcopy)
Pentru următoarele contexte, propune ilustrație SVG minimalistă (line art, paleta existentă) + microcopy specific (română):
1. Student fără evaluări active (toate completate)
2. Student fără evaluări de făcut (pre-platform)
3. Profesor fără cursuri
4. Profesor fără evaluări primite
5. Admin fără utilizatori (filtru gol)
6. Pagina Achievements fără achievements deblocate
7. ProfessorActions fără acțiuni propuse
8. PlatformFeedback fără răspunsuri încă
9. Error 500 (eroare server)
10. Network offline

### Deliverable 4: Dark mode design-first (paleta + 3 ecrane)
Propune paletă dark proprie (NU inversare):
- Background base
- Surface elevation 1/2/3
- Primary / Accent / Semantic dark variants
- Text on dark

Plus mockup pentru:
1. LoginPage dark
2. StudentDashboard dark
3. AdminDashboard dark (test density)

## 7. Constrângeri non-negociabile

1. **A11y WCAG 2.1 AA minimum** — contrast 4.5:1 pe text, focus visible 3px accent-400, keyboard nav completă
2. **Performance:** initial JS bundle gzip < 25 kB (acum 21 kB), lazy chunks per rută; nu introduce dependențe noi > 50 kB gzip per pachet
3. **Tehnologie:** Tailwind CSS 3, Recharts pentru charts (NU înlocui cu D3 sau Visx), Headless UI pentru componente interactive complexe, Heroicons
4. **Localizare:** RO cu diacritice corecte (ăâîșțĂÂÎȘȚ), formate românești (21 mai 2026, 3,58 nu 3.58)
5. **Mobile:** designul curent e desktop-first. Nu cere mobile încă — focus pe desktop polish
6. **Reduce-motion:** orice animație trebuie să aibă fallback `prefers-reduced-motion: reduce`
7. **NU folosi:**
   - Material UI / Ant Design / orice alt design system
   - Imagini stock generice (Unsplash etc.)
   - Emoji ca elemente de design (acceptabile doar în microcopy contextual)
   - Tailwind plugins necesare extra (rămâne în config existent)
   - Animații lungi (max 300ms; excepție: achievement unlock max 1.5s)

## 8. Format livrare

Pentru fiecare deliverable:
- **Mockup PNG @2x** pentru ecrane (1440×900 desktop)
- **Spec markdown** cu:
  - Clase Tailwind sugerate / cod TypeScript
  - Praguri pentru responsive (dacă necesar)
  - Reduce-motion fallback
  - Aria-labels & focus order
- **Implementation notes** — fișierele care necesită modificare în repo

## 9. Date și context organizațional

**Universitate:** UNSTPB · Facultate: FAIMA · Master: „Calitatea produselor și serviciilor industriale" · Coordonator: Conf. univ. dr. ing. Cătălin Alexe

**Mențiune importantă:** aplicația este suport pentru o teză de disertație despre îmbunătățirea evaluării didactice. Designul trebuie să fie suficient de polished încât să poată fi prezentat ca artefact academic + ca produs real.

**Profil utilizator real:**
- Studenți români 19-25 ani, generație nativă smartphone, comparație inconștientă cu Instagram/banking apps
- Profesori 30-65 ani, expertiză tehnică variabilă, sensibili la feedback negativ
- Admin CEAC 35-55 ani, power-user, sesiuni 30+ min, lucrează pe desktop Windows + Chrome/Edge

## 10. Definiția succesului v2

Designul tău e reușit dacă:
1. Un student care a folosit deja v1 a aplicației simte că „acum totul curge mai natural" (microinteracțiuni + storytelling)
2. Un profesor poate înțelege în < 15 secunde unde stă la propriile cursuri (data viz mai expresivă)
3. Un admin poate identifica în < 30 secunde un cluster de probleme (heatmap + drill-down)
4. Empty states fac platforma să se simtă „proiectată cu grijă", nu „a lipsit ceva"
5. Cineva care vede o captură pe LinkedIn se gândește „cum e făcută aplicația asta de la o universitate?" — surpriză pozitivă

=== END PROMPT ===

---

## Anexă: stack tehnic + repo structure (pentru implementare ulterioară)

După livrarea designului, implementarea va merge în:
- `frontend/src/components/ui/` — primitive (extinderi minimale: Toast, Skeleton)
- `frontend/src/components/charts/` — nou folder pentru viz complexă (Heatmap, Sankey, DualRadar)
- `frontend/src/components/illustrations/` — nou folder pentru ilustrații SVG empty/error states
- `frontend/src/contexts/ThemeContext.tsx` — pentru dark mode (de creat)
- `frontend/src/styles/tokens-dark.css` — pentru paleta dark first-class

**Token-uri CSS deja existente** (în `frontend/src/styles/tokens.css`):
```css
--ecd-primary-{50..900}    /* navy academic */
--ecd-accent-{50..900}     /* violet */
--ecd-neutral-{0,25,50..900}
--ecd-success / warning / danger / info (cu bg + fg)
--ecd-elev-{1..5}          /* shadows */
--ecd-r-{sm,md,lg,xl,2xl}  /* radii */
--ecd-dur-{fast,med,slow}  /* motion */
--ecd-ease                  /* cubic-bezier(0.16, 1, 0.3, 1) */
```
