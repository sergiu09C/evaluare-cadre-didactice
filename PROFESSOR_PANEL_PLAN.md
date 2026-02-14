# Plan de Integrare - Panoul pentru Profesor

## Situația Actuală

### Structura Existentă
- **Roluri în sistem**: `student`, `admin` (în tabela `users`)
- **Tabela `professors`**: Există separat, fără autentificare
- **Panouri existente**:
  - StudentDashboard - studenții văd evaluările lor
  - AdminDashboard - adminul vede statistici globale
  - AdminControls - admin poate gestiona platforma
  - AdminReports - admin vede rapoarte detaliate
  - ProfessorDetails - admin vede detalii despre un profesor

### Problema
Profesorii nu se pot autentifica și nu au un panou propriu pentru a-și vizualiza evaluările primite de la studenți.

---

## Arhitectura Propusă

### 1. Modificări Backend

#### 1.1. Schema Bazei de Date
- **Adăugare rol `professor` în tabela `users`**
  - Modificare constraint: `CHECK(role IN ('student', 'admin', 'professor'))`
  - Adăugare coloană `professor_id` în `users` (FOREIGN KEY către `professors.id`)
  - Migration file: `backend/src/db/migrations/005-add-professor-role.sql`

#### 1.2. Seed Data
- Creare utilizatori pentru profesori existenți
- Link între `users` și `professors`
- Credențiale default: email bazat pe numele profesorului

#### 1.3. API Endpoints
Crearea următoarelor endpoint-uri:

**`/api/professor/dashboard`** (GET)
- Statistici generale pentru profesor autentificat
- Total evaluări primite
- Medie generală
- Evaluări pe cursuri

**`/api/professor/evaluations`** (GET)
- Lista evaluărilor primite (anonimizate)
- Filtrare: curs, semestru, an academic
- Paginare

**`/api/professor/courses`** (GET)
- Cursurile profesorului
- Statistici per curs

**`/api/professor/stats/:courseId`** (GET)
- Statistici detaliate per curs
- Distribuție răspunsuri
- Răspunsuri text (anonimizate)

**`/api/professor/export`** (GET)
- Export date în CSV/PDF
- Rapoarte pentru profesor

#### 1.4. Middleware & Controllers
- **Middleware**: `backend/src/middleware/authProfessor.js`
  - Verificare rol profesor
  - Extragere professor_id din token

- **Controller**: `backend/src/controllers/professorController.js`
  - Logică business pentru toate endpoint-urile profesor

- **Routes**: `backend/src/routes/professorRoutes.js`
  - Definirea rutelor protejate pentru profesori

---

### 2. Modificări Frontend

#### 2.1. Context & Auth
- **Modificare `AuthContext`**:
  - Adăugare `isProfessor` flag
  - Adăugare `professorId` în context
  - Update login logic pentru rol profesor

#### 2.2. Componente Noi

**`frontend/src/pages/ProfessorDashboard.tsx`**
- Dashboard principal profesor
- Carduri cu statistici: total evaluări, medie, trend
- Lista cursurilor cu evaluări
- Grafice: distribuție note, evoluție în timp

**`frontend/src/pages/ProfessorCourseDetails.tsx`**
- Detalii per curs
- Statistici detaliate
- Răspunsuri anonimizate
- Grafice per întrebare

**`frontend/src/pages/ProfessorReports.tsx`**
- Rapoarte exportabile
- Filtre avansate
- Comparații între cursuri/semestre

**`frontend/src/components/professor/`**
- `EvaluationCard.tsx` - Card pentru o evaluare
- `CourseStatsCard.tsx` - Statistici pe curs
- `ResponseDistribution.tsx` - Grafic distribuție răspunsuri
- `AnonymizedFeedback.tsx` - Feedback text anonim
- `ExportButton.tsx` - Buton export date

#### 2.3. Routing
- Adăugare rute protejate în `App.tsx`:
  - `/professor` - Dashboard
  - `/professor/course/:id` - Detalii curs
  - `/professor/reports` - Rapoarte

- Redirect logic:
  - Student → `/`
  - Admin → `/admin`
  - Professor → `/professor`

---

## Planificare Task-uri

### FAZA 1: Backend - Baza de Date & Auth (Prioritate: Critică)

**Task 1.1**: Creare migrație bază de date
- Fișier: `backend/src/db/migrations/005-add-professor-role.sql`
- Adăugare rol `professor` în users
- Adăugare coloană `professor_id` în users (FK)
- Adăugare coloană `email` și `password_hash` în professors (opțional, pentru flexibilitate)

**Task 1.2**: Update seed data
- Modificare `backend/src/db/seed-extended.js`
- Creare utilizatori pentru profesori existenți
- Link users cu professors
- Email format: `{prenume}.{nume}@prof.univ.ro`

**Task 1.3**: Rulare migrații și seed
- Executare migrație
- Test conexiuni FK
- Verificare date seed

### FAZA 2: Backend - API & Logică Business (Prioritate: Critică)

**Task 2.1**: Middleware autentificare profesor
- Fișier: `backend/src/middleware/authProfessor.js`
- Verificare rol = 'professor'
- Extragere professorId

**Task 2.2**: Controller profesor - Dashboard
- Fișier: `backend/src/controllers/professorController.js`
- Implementare `getDashboard()`:
  - Total evaluări
  - Medie generală
  - Evaluări per curs
  - Trend (comparație cu semestrul anterior)

**Task 2.3**: Controller profesor - Evaluări
- Implementare `getEvaluations()`:
  - Lista evaluări anonimizate
  - Filtre: curs, semestru, an
  - Paginare

**Task 2.4**: Controller profesor - Statistici Curs
- Implementare `getCourseStats(courseId)`:
  - Statistici detaliate per întrebare
  - Distribuție răspunsuri
  - Comentarii anonimizate

**Task 2.5**: Controller profesor - Export
- Implementare `exportData()`:
  - Export CSV
  - Format structurat pentru analiză

**Task 2.6**: Rute profesor
- Fișier: `backend/src/routes/professorRoutes.js`
- Definire toate rutele
- Aplicare middleware authProfessor
- Integrare în `backend/src/server.js`

**Task 2.7**: Testing API
- Test manual cu Postman/curl
- Verificare anonimizare
- Verificare permisiuni

### FAZA 3: Frontend - Auth & Context (Prioritate: Critică)

**Task 3.1**: Update AuthContext
- Fișier: `frontend/src/contexts/AuthContext.tsx`
- Adăugare `isProfessor` flag
- Adăugare `professorId` în state
- Update login logic

**Task 3.2**: Update Login Page
- Fișier: `frontend/src/pages/LoginPage.tsx`
- Gestionare redirect pentru rol profesor

**Task 3.3**: Update Layout
- Fișier: `frontend/src/components/Layout.tsx`
- Adăugare meniu pentru profesor
- Link-uri: Dashboard, Cursuri, Rapoarte

### FAZA 4: Frontend - Componente Reutilizabile (Prioritate: Înaltă)

**Task 4.1**: Componente de bază
- `frontend/src/components/professor/StatCard.tsx` - Card statistică
- `frontend/src/components/professor/CourseCard.tsx` - Card curs
- `frontend/src/components/professor/ResponseChart.tsx` - Grafic răspunsuri

**Task 4.2**: Componente complexe
- `frontend/src/components/professor/EvaluationsList.tsx` - Listă evaluări
- `frontend/src/components/professor/AnonymizedFeedback.tsx` - Feedback anonim
- `frontend/src/components/professor/ExportButton.tsx` - Export date

### FAZA 5: Frontend - Pagini Principale (Prioritate: Înaltă)

**Task 5.1**: Professor Dashboard
- Fișier: `frontend/src/pages/ProfessorDashboard.tsx`
- Statistici generale
- Lista cursurilor
- Grafice overview

**Task 5.2**: Detalii Curs
- Fișier: `frontend/src/pages/ProfessorCourseDetails.tsx`
- Statistici per curs
- Evaluări pe curs
- Răspunsuri detaliate

**Task 5.3**: Rapoarte Profesor
- Fișier: `frontend/src/pages/ProfessorReports.tsx`
- Filtre avansate
- Comparații
- Export funcționalitate

**Task 5.4**: Integrare routing
- Fișier: `frontend/src/App.tsx`
- Adăugare rute profesor
- Protected routes
- Redirect logic

### FAZA 6: Testing & Refinement (Prioritate: Medie)

**Task 6.1**: Testing integrare completă
- Login ca profesor
- Navigare prin dashboard
- Verificare date afișate corect
- Test export

**Task 6.2**: Responsive design
- Test pe mobile/tablet
- Ajustări CSS dacă necesar

**Task 6.3**: Accessibility
- Verificare navegare cu tastatură
- Screen reader compatibility
- ARIA labels

**Task 6.4**: Performance
- Verificare timp de încărcare
- Optimizare query-uri dacă necesar
- Lazy loading pentru grafice

### FAZA 7: Documentație & Deploy (Prioritate: Scăzută)

**Task 7.1**: Documentație utilizare
- Ghid pentru profesori
- Screenshots
- FAQ

**Task 7.2**: Documentație tehnică
- Update README.md
- API documentation
- Schema bazei de date actualizată

---

## Estimări & Dependencies

### Dependencies Task-uri
```
Task 1.1 → Task 1.2 → Task 1.3
                         ↓
Task 2.1 → Task 2.2, 2.3, 2.4, 2.5 → Task 2.6 → Task 2.7
                                                    ↓
Task 3.1 → Task 3.2, 3.3
              ↓
Task 4.1 → Task 4.2
              ↓
Task 5.1, 5.2, 5.3 → Task 5.4
                       ↓
Task 6.1 → Task 6.2, 6.3, 6.4
              ↓
Task 7.1, 7.2
```

### Ordine Recomandată de Implementare
1. **Săptămâna 1**: FAZA 1 + FAZA 2 (Backend complet)
2. **Săptămâna 2**: FAZA 3 + FAZA 4 (Auth + Componente)
3. **Săptămâna 3**: FAZA 5 (Pagini principale)
4. **Săptămâna 4**: FAZA 6 + FAZA 7 (Testing + Documentație)

---

## Considerații Importante

### Securitate
- Anonimizarea evaluărilor trebuie să fie garantată
- Profesorii nu trebuie să vadă:
  - Numele studenților care au evaluat
  - ID-uri de studenți
  - Informații de identificare

### Privacy
- Afișare răspunsuri text doar dacă sunt >= 3 evaluări pentru acel curs
- Agregare statistici pentru a preveni identificarea

### UX/UI
- Design consistent cu panourile existente (Admin, Student)
- Grafice intuitive (Recharts)
- Filtre ușor de folosit
- Export simplu și rapid

### Performance
- Paginare pentru liste lungi
- Lazy loading pentru grafice complexe
- Cache pentru statistici calculate frecvent

---

## Fișiere de Creat/Modificat

### Backend (13 fișiere)
- `backend/src/db/migrations/005-add-professor-role.sql` ✨ NOU
- `backend/src/db/seed-extended.js` 📝 MODIFICAT
- `backend/src/middleware/authProfessor.js` ✨ NOU
- `backend/src/controllers/professorController.js` ✨ NOU
- `backend/src/routes/professorRoutes.js` ✨ NOU
- `backend/src/server.js` 📝 MODIFICAT

### Frontend (15+ fișiere)
- `frontend/src/contexts/AuthContext.tsx` 📝 MODIFICAT
- `frontend/src/pages/LoginPage.tsx` 📝 MODIFICAT
- `frontend/src/components/Layout.tsx` 📝 MODIFICAT
- `frontend/src/App.tsx` 📝 MODIFICAT
- `frontend/src/pages/ProfessorDashboard.tsx` ✨ NOU
- `frontend/src/pages/ProfessorCourseDetails.tsx` ✨ NOU
- `frontend/src/pages/ProfessorReports.tsx` ✨ NOU
- `frontend/src/components/professor/StatCard.tsx` ✨ NOU
- `frontend/src/components/professor/CourseCard.tsx` ✨ NOU
- `frontend/src/components/professor/ResponseChart.tsx` ✨ NOU
- `frontend/src/components/professor/EvaluationsList.tsx` ✨ NOU
- `frontend/src/components/professor/AnonymizedFeedback.tsx` ✨ NOU
- `frontend/src/components/professor/ExportButton.tsx` ✨ NOU

### Documentație
- `PROFESSOR_PANEL_PLAN.md` ✨ NOU (acest fișier)
- `README.md` 📝 MODIFICAT
- `backend/API_DOCUMENTATION.md` 📝 MODIFICAT

---

## Next Steps

1. ✅ Aprobare plan de către echipă
2. ⏳ Începere implementare FAZA 1 (Backend - DB)
3. ⏳ Setup environment de development
4. ⏳ Creare branch git: `feature/professor-panel`

---

**Data creării**: 2026-02-05
**Status**: 📋 În planificare
**Versiune**: 1.0
