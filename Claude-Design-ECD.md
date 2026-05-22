# Claude Design Prompt — ECD (Evaluarea Cadrelor Didactice)

> **Instrucțiuni de utilizare:** Acest fișier conține promptul integral pentru Claude Design. Copiază tot conținutul dintre delimitatorii `=== START PROMPT ===` și `=== END PROMPT ===` și transmite-l către Claude Design. La final, designul rezultat va fi implementat în aplicația existentă (React 18 + TypeScript + Vite + Tailwind CSS).

---

## Context fișier

- **Proiect:** ECD — sistem digital de evaluare a cadrelor didactice de către studenți
- **Localizare cod sursă:** `/Users/anosr/Desktop/test1/evaluare-cadre-didactice/`
- **Stack actual:** React 18 + TypeScript + Vite + Tailwind CSS 3 + Recharts + Headless UI + Heroicons
- **Scop lucrare:** Aplicația este implementarea practică a tezei de disertație "Îmbunătățirea calității procesului de evaluare a activității cadrelor didactice de către studenți" (FAIMA-UNSTPB, 2026)

---

=== START PROMPT ===

# Brief de design — ECD (Evaluarea Cadrelor Didactice)

## 1. Cine ești și ce ai de făcut

Ești designer UI/UX senior pentru o platformă universitară academică din România. Ai de proiectat un sistem de design complet și ecranele cheie pentru o aplicație web care permite studenților să își evalueze cadrele didactice, profesorilor să își vadă rezultatele, iar administratorilor (CEAC) să gestioneze procesul și să publice rezultate agregate.

**Output cerut:**
1. Sistem de design (paletă, tipografie, spacing, elevation, componente atomice) — exportabil ca tokens compatibile Tailwind CSS
2. Mockup-uri high-fidelity pentru toate ecranele listate la secțiunea 7
3. Specificații per componentă (state-uri: default / hover / focus / active / disabled / error / loading)
4. Versiuni desktop (≥1280px) și mobile (≤640px) pentru fiecare ecran
5. Note de implementare cu clase Tailwind sugerate sau valori CSS exacte

## 2. Cine sunt utilizatorii

### Studentul (audiență primară, ~80% din trafic)
- Vârstă 19–25 ani, generație născută cu smartphone-ul în mână
- Folosește platforma sporadic (de 2–4 ori pe semestru, ~3 minute per sesiune)
- Acces preponderent de pe mobile (iPhone / Android), uneori de pe laptop
- Vrea să termine cât mai repede, nu citește text inutil
- Nu se va întoarce dacă experiența e frustrantă → fricțiune mare = rată de participare mică
- Compară inconștient cu Instagram, TikTok, banking apps — așteaptă UX modern

### Cadrul didactic (audiență secundară, ~15% din trafic)
- Vârstă 30–65 ani, expertiză tehnică variabilă
- Vrea să înțeleagă RAPID cum este evaluat — fără să facă matematică pe ecran
- Are nevoie de context: "scorul meu e mare sau mic?", "e mai bun decât semestrul trecut?"
- Sensibilitate ridicată la date negative — designul trebuie să fie obiectiv, nu acuzator
- Va folosi platforma 1–2 ori pe semestru, ~10 minute per sesiune

### Administratorul CEAC (audiență terțiară, ~5% din trafic)
- Vârstă 35–55 ani, responsabil cu calitatea instituțională
- Power user — petrece 30+ minute per sesiune
- Are nevoie de dashboards dense în informație, filtrare avansată, export
- Lucrează predominant de pe desktop (Windows + Edge/Chrome)

## 3. Tonul și personalitatea designului

Tonul vizual trebuie să comunice simultan:

| Atribut | Exprimat prin |
|---------|--------------|
| **Academic dar nu corporate-formal** | Tipografie cu personalitate (nu doar Inter / Helvetica), accente colorate punctuale |
| **Modern dar de încredere** | Glassmorphism subtil, dar nu efecte care distrag |
| **Calm dar nu plictisitor** | Paletă predominant albastră-neutră, cu un accent vibrant |
| **Românesc dar internațional** | Suport perfect pentru diacritice (ăâîșțĂÂÎȘȚ), spațiere generoasă |
| **Serios dar uman** | Microcopy prietenos, ilustrații discrete, animații subtile |

**Inspirație stilistică:**
- Linear.app — claritate, ierarhie excelentă
- Stripe Dashboard — densitate informațională în control
- Notion — sentiment de spațiu și calm
- Vercel Dashboard — modernism funcțional
- Apple Health — vizualizări de date prietenoase

**NU vrem:**
- Aspect generic "universitate românească" (tabele dense, contrast slab, butoane de tip Windows 95)
- Festival de gradient-uri sau efecte 3D
- Skeumorfism
- Iconuri ilustrate excesive (3D rendered)

## 4. Sistem de design — Cerințe

### 4.1 Paleta de culori

Propune o paletă completă, cu:
- **Primary:** ton albastru-academic (înlocuiește albastrul Tailwind sky/cyan curent — trebuie să fie distinctiv, nu un default). 9 trepte (50–900).
- **Accent:** un singur ton complementar (verde sau violet) — folosit punctual pentru CTA-uri și succes
- **Semantic:** success / warning / danger / info — fiecare cu 3 trepte (light bg / main / dark text)
- **Neutral:** 11 trepte de gri (de la #FAFAFB la #0A0B0E), warm-neutral preferabil rece-neutral
- **Background:** alb pur evitat — folosește un off-white subtil (#FAFAFB sau similar)

Specifică pentru fiecare culoare:
- Valoarea HEX
- Contrast minim cu textul aplicat (WCAG AA = 4.5:1; AAA = 7:1)
- Modul light și modul dark (paleta dark trebuie să fie design-first, nu inversare automată)

### 4.2 Tipografie

- **Font heading:** alege un sans-serif cu personalitate ușoară (sugestii: Geist, Söhne, General Sans, Cabinet Grotesk) — distinctiv dar legibil
- **Font body:** Inter sau echivalent — variabil, optimizat pentru text dens
- **Font monospaced:** pentru cod / valori numerice — JetBrains Mono sau Geist Mono
- Scala tipografică (modular scale 1.25 sau 1.333) cu 8–10 trepte
- Line-height tuning pentru română (diacriticele sub linia de bază au nevoie de mai mult breathing room)
- Font weights: 400 / 500 / 600 / 700 (evită extra-light și black)

### 4.3 Spacing și layout

- Sistem 4px base (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128)
- Container max-width: 1280px (desktop), padding 24px (mobile) → 48px (desktop)
- Grid: 12 coloane desktop, 4 coloane mobile, gutter 24px
- Border radius scale: 4 / 8 / 12 / 16 / 24 (preferă valori mai mari decât default Tailwind — modernism)
- Shadow scale: 5 trepte, soft & layered (NU box-shadow-uri grele)

### 4.4 Iconuri și ilustrații

- Iconuri: Heroicons (Outline pentru navigare, Solid pentru status și emphasis) — stroke width 1.5
- Ilustrații: minimaliste, line-art sau flat 2D, în paleta proprie (nu folosi unDraw, prea generic)
- Empty states necesită ilustrație proprie + 1 frază scurtă + buton CTA

### 4.5 Animații și microinteracțiuni

- Durata standard: 150ms (small) / 200ms (medium) / 300ms (large)
- Easing: cubic-bezier(0.16, 1, 0.3, 1) — easeOutExpo (modern, "Apple-like")
- Tranziții pentru: hover butoane, deschidere modal, încărcare date, comutare tab, schimbare rută
- Animație de progres care comunică progres real, nu doar "spin"
- **Respectă `prefers-reduced-motion`** (regula non-negociabilă)

## 5. Componente atomice de proiectat

Pentru fiecare componentă: state-uri (default / hover / focus / active / disabled / loading / error), variante (size: sm/md/lg; variant: primary/secondary/ghost/destructive), versiuni light + dark.

1. **Button** (primary, secondary, ghost, destructive, icon-only)
2. **Input** (text, email, password) + cu icon prefix/suffix + cu label flotant
3. **Textarea** cu contor de caractere
4. **Select / Dropdown** (single + multi-select)
5. **Checkbox / Radio / Switch**
6. **Likert Scale** (5 puncte — **componentă critică**, vezi secțiunea 6.1)
7. **Card** (default + interactive + hover-elevate)
8. **Badge / Tag / Pill** (variante semantice)
9. **Avatar** (cu inițiale fallback, cu status indicator)
10. **Tabs** (underline style + segmented control)
11. **Modal / Dialog** (cu focus trap, escape close)
12. **Toast / Notification** (4 variante: success/info/warning/error)
13. **Tooltip** (cu săgeată, poziționare automată)
14. **Progress bar** (linear + circular)
15. **Skeleton loaders** (pentru fiecare tip de card)
16. **Empty state** template
17. **Error state** template (cu retry CTA)
18. **Data table** (sortabil, paginat, cu acțiuni pe rând)
19. **Sidebar navigation** (cu collapse pe mobile)
20. **Top bar** (cu user menu, notificări, search command-K)

## 6. Pattern-uri și componente complexe

### 6.1 Likert Scale (5 puncte) — CRITIC

Aceasta este componenta cu cel mai mare impact asupra ratei de participare. Studenții o vor folosi de 19 ori per evaluare. Trebuie să fie:
- **Tactilă pe mobile:** target tap ≥ 44×44px
- **Vizual diferențiată:** nu doar 5 cercuri identice (ușor de "click-spam" 3-3-3-3-3); folosește culoare progresivă (roșu → galben → verde) SAU dimensiune progresivă SAU emoji subtile, dar **fără a influența răspunsul** (problemă etică — sondajul trebuie să fie neutru)
- **Etichete explicite:** "Total dezacord ←→ Total acord" — la mobile, lăbele pot fi afișate sub răspuns
- **Feedback de selecție:** animație ușoară de confirmare la tap
- **Stare nedoselectată vs. selectată** clar distinctă

Propune **trei variante** și recomandă-o pe cea mai bună pentru context-ul nostru (evaluare academică, neutralitate, mobile-first).

### 6.2 Score Radar Chart (5 dimensiuni)

Vizualizare cheie pentru raportul individual al profesorului. Trebuie să arate:
- 5 axe (D1: Predare, D2: Comunicare, D3: Resurse, D4: Evaluare, D5: Disponibilitate)
- Scor propriu (linie/area solid, primary color)
- Media departamentului (linie dashed, neutral)
- Etichete cu valoare numerică pe fiecare ax
- Legendă jos
- Mobile: simplificat — radar mai mic + valori în tabel sub el

### 6.3 Heatmap departamente

Pentru admin dashboard — grid 2D (departamente × dimensiuni) cu celule colorate (gradient roșu→galben→verde). Trebuie să fie:
- Citibil chiar și cu daltonism (folosește pattern + culoare, nu doar culoare)
- Cu tooltip detaliat la hover (valoare exactă, nr. răspunsuri)
- Cu drill-down la click pe celulă

### 6.4 Trend line (evoluție temporală)

Grafic linie pentru ultimele 4–6 semestre:
- Punctul curent evidențiat
- Tooltip cu valoare exactă la hover
- Anotări pentru evenimente notabile (ex: "Plan de îmbunătățire activat")
- Mobile: pinch-to-zoom optional, dar minim swipe-to-pan

### 6.5 Card-uri statistice (KPI Cards)

Pentru dashboard-uri — card-uri compacte cu:
- Valoarea principală (mare, bold)
- Etichetă (mică, neutral)
- Delta față de perioada anterioară (▲ verde / ▼ roșu)
- Mini sparkline opțional
- Click → drill-down la raport detaliat

### 6.6 Progress indicator pentru chestionar (19 itemi)

În timpul completării chestionarului, studentul trebuie să vadă:
- Câte întrebări a completat din total (ex: "12 din 19")
- Bara de progres vizuală
- Posibilitatea de a sări înapoi la o întrebare anterioară (fără a pierde date)
- Indicator de "draft salvat automat" (subtil, ca în Google Docs)

### 6.7 Closing-the-loop banner / section

Pe dashboard-ul studentului, secțiunea "Ați evaluat, noi am acționat" — trebuie să fie:
- Vizibilă imediat după login (above the fold)
- Conțin 2–3 schimbări concrete cu iconuri și descriere scurtă
- Link "Vezi toate schimbările"
- Posibil prima dată afișată: tooltip onboarding "Aceasta e secțiunea unde vezi rezultatele evaluărilor tale"

## 7. Ecrane de proiectat (high-fidelity mockups)

### 7.1 Autentificare
- **A.1 Login** — formular elegant, centrat, cu branding ECD discret în partea de sus; mesaj de eroare clar; link recover password (chiar dacă nu e funcțional în pilot)
- **A.2 Logout confirmation** (modal mic)

### 7.2 Student
- **S.1 Dashboard** — overview cu: card evaluări active (cu CTA "Începe acum"), card evaluări completate, secțiunea closing-the-loop, achievement badges (opțional, gamification light), grafic de progres global facultate
- **S.2 Lista evaluărilor active** — card-uri pe profesor + disciplină, cu deadline vizibil, status (Not started / Draft / Submitted)
- **S.3 Formular evaluare (chestionar 19 itemi)** — flux principal, mobile-first; cu progress bar, save draft, navigate prev/next, scala Likert (vezi 6.1), câmp text liber la final
- **S.4 Pagina "Rezultate Agregate"** — radar chart facultate (5 dim), comparare cu sem. anterior, text editorial "Ce s-a schimbat"
- **S.5 Pagina "Achievements"** — badges câștigate (ex: Completionist, Fast Responder, Detailed Feedback)
- **S.6 Empty state** — când nu există evaluări active

### 7.3 Profesor
- **P.1 Dashboard profesor** — listă discipline evaluate per semestru, status colectare, scor global vizibil
- **P.2 Raport individual per disciplină** — secțiunile descrise în Anexa 4 (kb): scor global, radar 5 dim, distribuții itemi, evoluție temporală, comentarii anonimizate
- **P.3 Lista comentarii anonimizate** — card-uri cu text, filtru sentiment (pos/neg/neutru)
- **P.4 Export raport PDF** — preview cu opțiuni de personalizare

### 7.4 Administrator (CEAC)
- **AD.1 Dashboard instituțional** — KPI cards (4–6 metrici), heatmap departamente×dimensiuni, lista alerte active (roșu/galben), trend rată participare
- **AD.2 Gestionare evaluări** — tabel cursuri × profesori cu acțiuni (activate / dezactivate / vezi rezultate), filtre avansate (facultate, departament, an, tip activitate)
- **AD.3 Gestionare utilizatori** — tabel studenți + profesori cu căutare, import CSV, reset password
- **AD.4 Editor "Closing-the-loop"** — rich text editor pentru textul publicat studenților
- **AD.5 Rapoarte instituționale** — multi-tab cu rapoarte filtrabile (Panoramă, Pe facultăți, Pe ani, Pe tip curs, Comparație discipline)
- **AD.6 Detalii profesor** — view individual cu toate datele cadrului didactic + istoricul evaluărilor + plan de îmbunătățire

### 7.5 Sistem
- **SYS.1 Pagină 404**
- **SYS.2 Pagină 500 / Eroare conexiune**
- **SYS.3 Maintenance mode**
- **SYS.4 Toast notifications stack**
- **SYS.5 Modal confirmare destructive action**

## 8. Constrângeri și cerințe non-funcționale

### 8.1 Accesibilitate (non-negociabil)
- **WCAG 2.1 AA minimum**, idealUL AAA pentru text body
- Contrast text/background ≥ 4.5:1 (AA), 7:1 (AAA)
- Focus visible: outline 2px sau 3px, offset 2px, culoare contrastantă (NU folosi `outline: none` niciodată)
- Keyboard navigation completă (Tab, Shift+Tab, Enter, Escape, Arrow keys în grupuri)
- Screen reader: toate iconurile au aria-label, regiunile au aria-labelledby, formularele au erori asociate cu aria-describedby
- Componenta `LikertScale` trebuie să funcționeze 100% cu tastatura (Arrow Left/Right pentru navigare, Space pentru selectare)
- Suport pentru `prefers-reduced-motion` (dezactivează animații non-esențiale)
- Suport pentru `prefers-color-scheme: dark` cu paletă proprie design-first
- Suport pentru "high contrast" mode (override variant)
- Mărime font ajustabilă: 4 trepte (small / normal / large / extra-large) — păstrează layout-ul fără orizontal scroll
- Font OpenDyslexic ca opțiune în setări accesibilitate

### 8.2 Localizare
- Toate textele în română, cu diacritice corecte (ăâîșțĂÂÎȘȚ)
- Datele formatate românește (ex: "21 mai 2026" nu "May 21, 2026")
- Numerele cu separator zecimal "," nu "."
- Pluralizare corectă ("1 evaluare" / "2 evaluări" / "12 evaluări")

### 8.3 Responsive
- Mobile-first design (≤640px) — toate ecranele DESIGNATE pentru mobile primar
- Tablet (641–1024px) — adaptare la layout 2-coloane
- Desktop (≥1280px) — adaptare la 3-coloane / dashboard dens
- Touch targets ≥ 44×44px pe mobile
- Niciun element critic să nu necesite hover pentru funcționalitate (mobile n-are hover)

### 8.4 Performanță vizuală
- Font loading optimizat (font-display: swap, preload pentru cele 2 fonturi critice)
- Imagini: format AVIF/WebP cu fallback, lazy loading
- Skeleton screens pentru toate ecranele care fac fetch (NU spinner global)
- First contentful paint < 1.5s pe 4G

### 8.5 Branding instituțional
- Logo: text "ECD" + subtitle "Evaluarea Cadrelor Didactice"
- Mențiune discretă "FAIMA · UNSTPB" în footer / sidebar
- Culoare instituțională UNSTPB poate fi încorporată ca accent (nu domina), dar NU folosi logo-ul oficial UNSTPB încă (drepturi)
- Fără steme, fără simboluri heraldice — modernism academic, nu tradiționalism instituțional

## 9. Date și flow-uri ce trebuie reflectate în mockup-uri

Mockup-urile trebuie să folosească date REALE (nu lorem ipsum) — extrase din knowledge base-ul disertației:

**Profesori exemple:**
- Conf. dr. ing. Cătălin Alexe (Departamentul Antreprenoriat, Management)
- Prof. dr. ing. Vasile Popescu (Inginerie Industrială)
- Lector dr. Maria Ionescu (Calitate și Standardizare)

**Cursuri exemple:**
- "Managementul calității produselor și serviciilor"
- "Sisteme integrate de management"
- "Statistică aplicată în controlul calității"
- "Auditul calității"

**Itemi chestionar exemple (alege 3 reprezentativi):**
- "Cadrul didactic prezintă materialul clar și structurat."
- "Cadrul didactic furnizează feedback constructiv după evaluări."
- "Cadrul didactic este accesibil și disponibil în afara orelor de curs."

**Scoruri exemple (realiste):**
- Scor mediu instituțional: 3.57 / 5.00
- Rată participare pilot: 57% (creștere de la 28%)
- Distribuție: 17.8% excelent, 48.9% bun, 24.4% atenție, 8.9% alertă

**Comentarii anonimizate (realiste, români):**
- "Profesorul explică foarte bine, dar materialele de curs nu sunt actualizate."
- "Feedback la examene foarte util, multumesc!"
- "S-ar putea mai multă interacțiune la curs."
- "Disponibilitatea pentru consultații a fost excelentă."

## 10. Deliverables și format

Vreau să primesc:

1. **Design tokens JSON** — paletă, tipografie, spacing, radii, shadows, durations — gata de transformat în `tailwind.config.js`
2. **Component library** — fiecare componentă cu specificații exacte (vezi 5)
3. **Screen designs** — toate ecranele de la secțiunea 7, în două breakpoints (mobile + desktop), light + dark
4. **Interaction notes** — ce se întâmplă la click/hover/focus/error/loading pentru fiecare flux principal
5. **Accessibility annotations** — pe fiecare ecran, mark-up cu aria-labels, focus order, keyboard shortcuts
6. **Implementation guide** — markdown cu mapping de la design la Tailwind classes (ex: "Card primary → bg-white dark:bg-neutral-900 rounded-2xl shadow-elevation-2 p-6")

Formatul de livrare poate fi:
- Figma file cu structură curată (Pages: 1.Foundations / 2.Components / 3.Screens)
- SAU set de imagini PNG la 2x + JSON tokens + markdown spec

## 11. Ce să NU faci

- Nu crea iar și iar variante de butoane — alege 4 variante, justifică-le, oprește-te
- Nu propune "AI features" inexistente (chatbot, generative summaries) — domeniul este sensibil, datele sunt anonime, nu vrem complexitate AI în pilot
- Nu folosi imagini stock generice cu studenți care zâmbesc privind un laptop
- Nu propune dark mode ca "inversare automată" — designează-l first-class
- Nu uita că aplicația este folosită în România — diacritice perfecte, formatare româneasă
- Nu propune flow-uri care necesită multi-page wizard pentru taskuri simple (ex: nu transforma login-ul în 3 pași)
- Nu folosi efecte care fac aplicația să se simtă "lentă" (parallax la scroll, animații lungi, blur greu)

## 12. Definiția succesului

Acest design este reușit dacă:
1. Un student pe iPhone poate completa o evaluare de 19 itemi în < 4 minute fără frustrare
2. Un profesor poate înțelege în < 30 secunde cum a fost evaluat la o disciplină (scor, comparație, trend)
3. Un admin CEAC poate identifica în < 1 minut profesorii din zona "alertă roșie"
4. Designul rezistă la imprimare PDF (rapoartele instituționale se imprimă pentru Senat)
5. O persoană cu deficiență de vedere poate naviga complet aplicația cu screen reader (NVDA / VoiceOver)
6. Aplicația arată la fel de bine pe Chrome desktop ca pe Safari iOS
7. Cineva care vede dashboard-ul peste umărul administratorului se gândește "wow, asta nu pare o aplicație de universitate"

---

## 13. Context tehnic suplimentar (pentru când designul intră în implementare)

Aplicația care va implementa designul rulează deja:

- **Frontend (React 18 + TypeScript + Vite + Tailwind 3):**
  - Pagini existente (vor fi redesignate): `LoginPage`, `StudentDashboard`, `EvaluationForm`, `ProfessorDashboard`, `ProfessorCourseDetails`, `ProfessorReports`, `AdminDashboard`, `AdminControls`, `AdminReports`, `ProfessorDetails`
  - Componente actuale (vor fi rescrise/refactorizate): `Layout`, `DashboardCharts`, `LikertScale`, `AccessibilityMenu`, `AccessibleModal`, `LiveRegion`, `ScreenReaderOnly`
  - Componente profesor existente: `CourseCard`, `StatCard`, `ResponseChart`, `AnonymizedFeedback`, `ExportButton`, `EvaluationsList`
  - Componente a11y: `SkipLink`, `FocusTrap`, `KeyboardShortcutsHelp`
  - Contexte: `AuthContext`, `AccessibilityContext`
  - Hooks custom: `useTabNavigation`, `useArrowNavigation`, `useFocusReturn`, `useKeyboardShortcut`, `useFocusTrap`

- **Backend (Express + SQLite):**
  - Rute: `/api/auth`, `/api/evaluations`, `/api/admin`, `/api/platform`, `/api/questions`, `/api/user`, `/api/student`, `/api/professor`
  - Modelul de date este definit; UI-ul nou trebuie să mapeze pe tipurile existente din `frontend/src/types/index.ts`

- **Constrângeri de migrare:**
  - Designul trebuie implementabil progresiv (page-by-page), fără a sparge state-ul aplicației
  - Tailwind CSS rămâne — preferă tokens compatibile peste CSS variabile
  - Headless UI rămâne pentru componente complexe (Dialog, Listbox, Tabs)
  - Recharts rămâne pentru vizualizări de date (rad chart, bar, line)
  - Heroicons rămâne pentru iconuri

=== END PROMPT ===

---

## Anexă: Note pentru implementare după ce primesc designul

După ce designul este livrat de Claude Design, pașii de implementare în aplicația Evaluarea Cadrelor Didactice:

1. **Setup foundations:**
   - Actualizează `frontend/tailwind.config.js` cu tokens primiți (culori, fonturi, spacing, radii)
   - Adaugă fonturi noi în `frontend/index.html` (preload + link tags) sau via `@fontsource/*`
   - Creează `frontend/src/styles/tokens.css` pentru CSS variables (dacă designul folosește vars pentru theming dark/light)

2. **Refactor componente atomice:**
   - Începe cu `Button`, `Input`, `Card` — atomii cei mai folosiți
   - Apoi `Badge`, `Avatar`, `Tabs`, `Modal`
   - În final componenta CRITICĂ — `LikertScale` (vezi `frontend/src/components/LikertScale.tsx`)

3. **Refactor pagini, în ordinea impactului:**
   - `LoginPage` — prima impresie
   - `StudentDashboard` + `EvaluationForm` — flow-ul cu cel mai mare volum de trafic
   - `ProfessorCourseDetails` (raportul individual) — flow-ul cu cel mai mare impact pentru cadre didactice
   - `AdminDashboard` + `AdminReports` — pentru CEAC

4. **Validare accesibilitate:**
   - Rulează axe DevTools pe fiecare pagină
   - Testează cu VoiceOver (macOS) și NVDA (dacă există acces la Windows)
   - Verifică toate flow-urile cu tastatura only

5. **Testare cross-browser:**
   - Chrome desktop + mobile
   - Safari desktop + iOS
   - Firefox desktop
   - Edge desktop

6. **Documentare în lucrarea de disertație:**
   - Capturile de ecran ale UI-ului final intră în Capitolul 4 (Sistemul digital) și Anexa 4 (Rapoarte și Dashboards)
   - Decizia de design și justificarea pot fi argumentate pe baza acestui prompt
