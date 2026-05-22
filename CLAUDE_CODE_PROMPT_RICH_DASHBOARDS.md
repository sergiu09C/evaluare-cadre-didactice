# Prompt pentru Claude Code — Audit + grafice exhaustive ECD

Copy-paste blocul de mai jos într-o **sesiune nouă** de Claude Code (sau ca instrucțiune inițială într-un sub-agent). Prompt-ul îi cere să auditeze sistematic platforma ECD, să producă un raport + plan de implementare, apoi să livreze toate filtrele/graficele/pie/bar charts în toate combinațiile rezonabile per rol, fiecare validat E2E cu Playwright.

---

## PROMPT (paste-ready)

> Ești în rădăcina proiectului ECD (Evaluarea Cadrelor Didactice — FAIMA-UNSTPB). Stack: React 18 + TypeScript + Vite + Tailwind CSS + Headless UI + Recharts pe frontend; Node.js + Express + better-sqlite3 + JWT pe backend; Playwright pentru E2E.
>
> Sarcina ta are 3 etape obligatorii și NU vei trece de la una la alta fără să scrii artefacte concrete pentru fiecare. Lucrul se face în ordine.
>
> ---
>
> ### ETAPA 1 — AUDIT (output: `AUDIT_REPORT.md` în root)
>
> Investighează exhaustiv și documentează:
>
> 1. **Date disponibile în DB** — citește schema (`backend/src/db/schema.sql` + toate migrațiile `backend/src/db/migrations/`), listează fiecare tabel + coloane + cardinalități reale (rulează `sqlite3` queries pe `backend/src/db/evaluare.db`). Identifică:
>    - Toate dimensiunile filtrante posibile (facultate, departament, program, an academic, semestru, tip curs, rol, categorie întrebare, perioada submit, etc.)
>    - Toate metricile cuantitative (count, sum, avg, distribuții, time series)
>    - Relațiile între tabele utile pentru join-uri
> 2. **Endpoint-uri backend existente** — caută în `backend/src/routes/` și `backend/src/controllers/` toate endpoint-urile GET care întorc date agregabile. Pentru fiecare:
>    - Path, role required, parametri acceptați, formatul răspunsului
>    - Ce date deja serveste vs. ce ar trebui extins
> 3. **Pagini frontend existente** — caută `frontend/src/pages/` și listează:
>    - Ruta + rolul țintă
>    - Ce date afișează acum
>    - Ce grafice/filtre sunt deja prezente (Recharts components, slidere `<input type="range">`, etc.)
>    - **Important:** pagina `EvaluationLifecycle.tsx` (ruta `/`, `/professor`, `/admin`) e Acasă pentru toate rolurile și e principalul candidat pentru extindere.
> 4. **Pattern-uri vizuale și design system** — citește `frontend/src/styles/tokens.css` și `frontend/src/styles/tokens-dark.css`. Identifică:
>    - Variabilele CSS de culoare (toate `--ecd-*`)
>    - Paleta semantică (success/warning/danger/info)
>    - Componentele UI reutilizabile din `frontend/src/components/ui/` (Card, KPICard, Badge, Select, Input, etc.)
>    - Componente charts existente: `DualRadar`, `StackedSemanticBar`, etc.
> 5. **Conturi de test** — confirmă din `tests/e2e/*.spec.ts`:
>    - Student: `student1@univ.ro` / `password123`
>    - Profesor: `vasile.popescu.1@prof.univ.ro` / `password123`
>    - Admin: `admin@univ.ro` / `password123`
>
> Output `AUDIT_REPORT.md` are obligatoriu următoarele secțiuni cu informații concrete (nu placeholders):
>
> - `## 1. Date și dimensiuni`
> - `## 2. Endpoint-uri existente`
> - `## 3. Pagini frontend și ce afișează acum`
> - `## 4. Design system și componente reutilizabile`
> - `## 5. Conturi de test verificate`
> - `## 6. Lacune identificate` — ce date ar trebui expuse dar nu sunt; ce filtre lipsesc; ce combinații nu există încă.
>
> ---
>
> ### ETAPA 2 — PLAN DE IMPLEMENTARE (output: `IMPLEMENTATION_PLAN.md` în root)
>
> Pe baza auditului, produce un plan concret. Format obligatoriu:
>
> 1. **Matricea filtre × roluri** — tabel markdown care arată, pentru fiecare rol (student / profesor / admin), ce filtre se aplică pe care pagini. Filtre rezonabile (NU exhaustive în sensul produsului cartezian fără sens):
>    - Facultate (toate rolurile, peste tot)
>    - Departament (admin + profesor pe pagina lui)
>    - Program (student + admin)
>    - An academic (toate)
>    - Semestru (toate)
>    - Tip curs (curs / seminar / laborator / proiect)
>    - Categorie întrebare (didactică / conținut / evaluare / atmosferă / etc.)
>    - Interval temporal (slider: 30 zile → 2 ani)
>    - Status acțiune CEAC (propusă / acceptată / finalizată / respinsă)
>    - Rol (admin only — vede agregat per rol)
>
> 2. **Matricea grafice × pagini** — tabel cu cele 10-12 tipuri de vizualizări pe care le vei livra:
>    - KPI big-number cards
>    - Pie chart (distribuție categorică)
>    - Donut (pie cu inner radius, pentru comparații cu hole pentru total)
>    - Bar chart vertical (count per categorie)
>    - Bar chart horizontal (top-N rankings)
>    - Stacked bar (semantic: negativ/neutru/pozitiv din Likert)
>    - Grouped bar (comparație multi-serie, ex: scor mediu per facultate per semestru)
>    - Line chart (trend temporal)
>    - Area chart (volumul submisiilor în timp)
>    - Radar (multi-dimensional, ex: scoruri per categorie întrebare)
>    - Heatmap (program × an academic, sau facultate × categorie)
>    - Progress bar (rate, completare)
>
>    Fiecare grafic apare pe pagini relevante per rol. Specifică explicit unde și de ce.
>
> 3. **Lista endpoint-uri noi de creat** — pentru fiecare metric care nu poate fi calculat client-side eficient.
>
> 4. **Ordinea de implementare** (5-7 etape numerotate). Mark fiecare dependență.
>
> 5. **Plan de teste Playwright** — listă de scenarii care vor valida fiecare combinație de filtru × grafic × rol. Format:
>    - Per pagină per rol: navighează → aplică filtru → verifică grafic re-render → snapshot.
>    - Interactivitate: click pe element grafic → verifică selecție / filtru aplicat.
>    - Range sliders → verifică schimbarea time series.
>    - Reset filtre → revenire la starea inițială.
>
> ---
>
> ### ETAPA 3 — IMPLEMENTARE
>
> Lucrează strict în ordinea din `IMPLEMENTATION_PLAN.md`. Reguli obligatorii:
>
> 1. **Per etapă**: scrie cod → rulează `npx vite build` în `frontend/` pentru a prinde erori TS → execută testele Playwright relevante → marchează etapa complet doar dacă build + teste sunt verzi.
> 2. **Reutilizează design system-ul**: NU introduce librării noi (no Chart.js, ApexCharts, D3 standalone). Recharts deja există. Pentru radar customizat folosește `DualRadar`. Pentru pie semantic folosește `StackedSemanticBar` ca pattern.
> 3. **Dark mode**: toate culorile noi folosesc `var(--ecd-*)` din `tokens.css`. NU folosi clase Tailwind `dark:`. Pe `data-theme="dark"`, totul trebuie să arate corect.
> 4. **A11y**: fiecare control de filtru are `<label>` legat; fiecare grafic are `role="img"` sau `aria-label` descriptiv; range slider are `aria-valuenow/min/max`; click-targets minim 32×32px.
> 5. **Performanță**: lazy-load paginile noi via `React.lazy`. Endpoint-urile noi cache-uite client-side cu cheia derivată din filtre (TanStack Query e OK dacă deja există, altfel `useMemo` + state local). Refresh debounced 250ms pe slider.
> 6. **Reduced motion**: animațiile Recharts respectă `prefers-reduced-motion` (folosește `isAnimationActive={!prefersReducedMotion}`).
> 7. **Limba**: copy în română cu diacritice corecte (ă, â, î, ș, ț). Comentarii în cod în engleză.
>
> Layout-ul tipic per pagină (referință):
>
> 1. Hero KPI cards (4-6, grid responsive)
> 2. Filter bar (sticky sub header, cu chips active + buton reset)
> 3. Grid de grafice (1-2-3 coloane responsive)
> 4. Drill-down opțional (click pe element → modal/sub-pagină cu detalii)
> 5. Tabel detaliat opțional (pentru export CSV)
>
> Interactivitate obligatorie:
> - Hover pe orice element grafic → tooltip Recharts cu date precise
> - Click pe barră/segment → setează filtrul corespunzător (ex: click pe facultatea „FI" în bar chart → aplică `facultyId=1` global pe pagină)
> - Slidere → re-fetch debounced cu spinner discret
> - Toggle absolut/% pe pie charts
>
> ---
>
> ### ETAPA 4 — VALIDARE FINALĂ
>
> Output `VALIDATION_REPORT.md` cu:
>
> 1. Lista fișierelor noi/modificate (path + 1 linie descriere)
> 2. `npx tsc --noEmit` — output și status (verde sau lista erorilor care nu țin de fix-urile mele)
> 3. `npx vite build` — output și mărimi bundle
> 4. `npx playwright test` — output pe testele E2E adăugate; număr verzi / roșii / sărite
> 5. Screenshot-uri ale paginii Acasă pentru fiecare rol (3 fișiere PNG în `/tmp/`):
>    - `acasa-student.png`
>    - `acasa-profesor.png`
>    - `acasa-admin.png`
>    Fiecare cu măcar 2 filtre aplicate și grafice vizibile.
>
> ---
>
> ### REGULI GENERALE
>
> - Nu modifica schema DB existentă fără migrație. Migrațiile noi merg în `backend/src/db/migrations/01[N]-*.sql` și se înregistrează în `backend/src/db/init.js`.
> - Nu rula `--no-verify` la commit-uri.
> - Nu sări peste validare TypeScript. Dacă lovești o eroare TS în cod existent (nu cea introdusă de tine), notează în `VALIDATION_REPORT.md` și continuă; nu o rezolva colateral.
> - Nu introduce librării npm noi fără confirmare. Recharts + Heroicons + Headless UI + Tailwind sunt suficiente.
> - Estimează inițial 4-6 ore reale pentru toată sarcina. Dacă ajungi la 8h fără să fi terminat ETAPA 2, oprește-te și raportează blocajul.
>
> Începe acum cu ETAPA 1 — citește DB schema, listează tabelele, generează `AUDIT_REPORT.md`. Spune-mi când e gata și treci la ETAPA 2.

---

## Note pentru tine, owner-ul prompt-ului

- Promptul presupune că Claude Code rulează din `/Users/anosr/Desktop/test1/evaluare-cadre-didactice/`.
- Backend trebuie să fie pornit (`node backend/src/server.js`) pentru ca testele Playwright să treacă.
- Frontend dev server pe `localhost:3000` (`npx vite --port 3000`).
- Dacă vrei să rulezi prompt-ul ca sub-agent în paralel, recomand `general-purpose` (poate scrie cod) sau dedicat `Plan` (doar planificare).
- Promptul cere ~6h muncă autonomă. Pentru o estimare mai sigură, separă-l manual în 3 invocări (audit → plan → implementare).
