# 📚 Platformă de Evaluare Cadre Didactice

[![GitHub](https://img.shields.io/badge/github-AntiGravity-blue?logo=github)](https://github.com/sergiu09C/AntiGravity)
[![License](https://img.shields.io/badge/license-Private-red)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.2.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![WCAG](https://img.shields.io/badge/WCAG-2.1%20AAA-green)](https://www.w3.org/WAI/WCAG21/quickref/)

Platformă web full-stack pentru evaluarea cadrelor didactice universitare, cu **suport complet pentru accesibilitate WCAG 2.1 Level AAA**, construită cu React + TypeScript (frontend) și Node.js + Express + SQLite (backend).

---

## 🌟 Caracteristici Unice

### ♿ Accesibilitate WCAG 2.1 Level AAA Compliant

Platforma oferă **suport complet pentru accesibilitate**, fiind conformă cu standardele **WCAG 2.1 Level AAA**:

#### 🎨 Teme Vizuale Adaptive
- **Light Mode** - temă luminoasă standard
- **Dark Mode** - temă întunecată pentru reducerea oboselii ochilor
- **High Contrast Mode** - contrast maxim pentru persoane cu deficiențe de vedere
- **Font Scaling** - 4 dimensiuni de font (Small, Normal, Large, Extra Large)
- **Dyslexia-Friendly Font** - font special pentru persoane cu dislexie

#### ⌨️ Navigare Completă cu Keyboard
- **Tab Navigation** - navigare între elemente interactive
- **Arrow Keys** - navigare în liste, griduri și scale Likert
- **Skip Links** - salt rapid la conținutul principal
- **Focus Indicators AAA** - indicatori de focus vizibili (3px solid, 3px offset)
- **Focus Trap** - în modale și dialoguri
- **Keyboard Shortcuts**:
  - `?` - Afișează ajutor keyboard shortcuts
  - `Alt + H` - Înapoi la Home
  - `Alt + C` - Focus pe conținut principal
  - `Esc` - Închide modale
  - `Enter/Space` - Activare butoane
  - `Arrow Keys` - Navigare în scale Likert

#### 🔊 Screen Reader Support
- **ARIA Labels** complete pe toate elementele interactive
- **Live Regions** pentru anunțuri dinamice
- **Semantic HTML** structurat (headings, landmarks, lists)
- **Screen Reader Only** content pentru context adițional
- **Alternative Text** pentru toate elementele vizuale
- **Form Labels** explicite cu error messages accesibile

#### 🎯 Focus Management
- **Auto-focus** pe primul element interactiv în pagini noi
- **Focus Return** la elementul anterior după închiderea modalelor
- **Focus Trap** în formulare și dialoguri
- **Visual Focus** indicators conformi AAA (3:1 contrast ratio)
- **Skip to Content** link vizibil la focus

#### ⚡ Reduce Motion Support
- **Respectă preferințele** `prefers-reduced-motion` din OS
- **Animații dezactivabile** pentru persoane cu tulburări vestibulare
- **Tranziții reduse** la minimum (0.01ms) când este activat

#### 🎛️ Accessibility Menu
- **Meniu dedicat** accesibilitate în header (iconiță universală)
- **Toggle-uri** pentru toate setările de accesibilitate
- **Persistență** - preferințele sunt salvate în backend per utilizator
- **Import/Export** - setări partajabile între dispozitive

---

## ✨ Funcționalități Principale

### Pentru Studenți
- ✅ Autentificare securizată (username/password)
- ✅ Dashboard cu listă profesori de evaluat
- ✅ Progress tracking (câte evaluări ai completat)
- ✅ Formular de evaluare interactiv:
  - Întrebări cantitative (Likert scale 1-5) cu navigare cu săgeți
  - Întrebări calitative (răspunsuri text)
  - Auto-save draft la fiecare 30 secunde
  - Submit final cu confirmare
- ✅ Evaluări anonime (răspunsurile nu pot fi legate de identitate)
- ✅ Prevenire duplicate (1 evaluare/profesor/student)
- ✅ **Accesibilitate completă** - navigare cu keyboard, screen reader support, teme vizuale

### Pentru Profesori 👨‍🏫
- ✅ **Dashboard personal** cu statistici proprii
- ✅ **Statistici per curs**:
  - Număr total evaluări primite
  - Scor mediu general
  - Distribuție scoruri per întrebare
  - Evoluție în timp
- ✅ **Feedback anonim** - vizualizare răspunsuri text (anonime)
- ✅ **Grafice interactive**:
  - Distribuție scoruri (bar charts)
  - Medii per categorie (radar charts)
  - Trend temporal (line charts)
- ✅ **Export date** - descărcare CSV cu statistici per curs/semestru
- ✅ **Comparare cursuri** - identificare puncte forte/slabe
- ✅ **Acces restricționat** - fiecare profesor vede doar propriile evaluări

### Pentru Administratori
- ✅ Dashboard cu statistici globale
- ✅ Rate de completare per facultate (grafice)
- ✅ Top 5 profesori performanți
- ✅ Identificare profesori cu scoruri critice (<2.5)
- ✅ Detalii complete per profesor:
  - Medii per categorie (didactică, comunicare, organizare, etc.)
  - Distribuție scoruri (1-5)
  - Feedback calitativ (răspunsuri text anonime)
- ✅ **Platformă Management**:
  - Activare/dezactivare platformă (cu mesaj closure)
  - Configurare email reminders (zile, frecvență)
  - Setări SMTP pentru trimitere emailuri
  - Test email functionality
- ✅ **Messaging System**:
  - Trimitere anunțuri către studenți (filtrabile)
  - Filtrare per facultate, an, serie, grupă
  - Istoric mesaje trimise
  - Opțiune email notify
- ✅ **Chestionar Management**:
  - Adăugare/editare/ștergere întrebări
  - Reordonare întrebări (drag & drop)
  - Categorii personalizabile
  - Preview în timp real
- ✅ Export-friendly (date structurate pentru rapoarte)

---

## 🚀 Quick Start

### Cerințe Preliminare

Asigură-te că ai instalat:
- **Node.js** (v18 sau mai nou) - [Download Node.js](https://nodejs.org/)
- **npm** (vine cu Node.js)
- **Git** - pentru clonare repository

**Verificare instalare:**
```bash
node --version   # ar trebui să afișeze v18.x.x sau mai nou
npm --version    # ar trebui să afișeze 9.x.x sau mai nou
git --version    # ar trebui să afișeze 2.x.x sau mai nou
```

---

## 📥 Instalare

### 1. Clonare Repository

```bash
git clone https://github.com/sergiu09C/AntiGravity.git
cd AntiGravity
```

### 2. Instalare Dependențe Backend

```bash
cd backend
npm install
```

### 3. Instalare Dependențe Frontend

```bash
cd ../frontend
npm install
```

---

## 🗄️ Inițializare Bază de Date

Înainte de prima rulare, trebuie să inițializezi baza de date SQLite cu schema și date mock:

```bash
cd backend
npm run init-db
```

**Ce face acest script:**
- ✅ Creează schema completă (tabele, indexuri, constrângeri)
- ✅ Populează cu date mock:
  - 3 facultăți
  - 5 programe de studiu
  - 50 studenți
  - 8 profesori
  - 5 cursuri
  - 13 întrebări în chestionar
  - 20 evaluări completate (demo)
- ✅ Afișează credențiale de test

**Output așteptat:**
```
✅ Database schema created successfully
✅ Database seeding complete!

📊 Database Statistics:
  - Facultăți: 3
  - Programe: 5
  - Utilizatori: 59 (50 studenți + 8 profesori + 1 admin)
  - Cursuri: 5
  - Întrebări: 13
  - Evaluări: 20

🔐 Test Credentials:
  Admin: admin@univ.ro / password123
  Student: student1@univ.ro / password123
  Professor: prof1@univ.ro / password123
```

---

## 🏃 Rulare Aplicație

### Opțiunea 1: Rulare Manuală (2 terminale)

**Terminal 1 - Backend (port 5001):**
```bash
cd backend
npm run dev
```

Ar trebui să vezi:
```
🚀 Server running on http://localhost:5001
📊 Environment: development
✅ Health check: http://localhost:5001/api/health
```

**Terminal 2 - Frontend (port 3000):**
```bash
cd frontend
npm run dev
```

Ar trebui să vezi:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Opțiunea 2: Script Automat (opțional)

Poți crea un script `start.sh` în directorul root:

```bash
#!/bin/bash

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "🚀 Backend running on http://localhost:5001"
echo "🚀 Frontend running on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
wait
```

Rulează cu:
```bash
chmod +x start.sh
./start.sh
```

---

## 🌐 Accesare Aplicație

Deschide browser-ul la: **http://localhost:3000**

### Credențiale de Test

**Student:**
- Email: `student1@univ.ro`
- Parolă: `password123`

**Profesor:**
- Email: `prof1@univ.ro`
- Parolă: `password123`

**Administrator:**
- Email: `admin@univ.ro`
- Parolă: `password123`

**Alte conturi:**
- Studenți: `student2@univ.ro` ... `student50@univ.ro`
- Profesori: `prof2@univ.ro` ... `prof8@univ.ro`
- Toate cu parola: `password123`

---

## 📁 Structura Proiectului

```
AntiGravity/
├── backend/                           # Backend Node.js + Express
│   ├── src/
│   │   ├── config/                   # Configurare database
│   │   ├── controllers/              # Logica de business
│   │   │   ├── authController.js
│   │   │   ├── evaluationsController.js
│   │   │   ├── adminController.js
│   │   │   ├── professorController.js
│   │   │   ├── platformController.js
│   │   │   ├── questionsController.js
│   │   │   └── userPreferencesController.js
│   │   ├── db/                       # Schema + seeding
│   │   │   ├── schema.sql           # Schema SQLite completo
│   │   │   ├── init.js              # Script inițializare
│   │   │   ├── seed-extended.js     # Date mock extinse
│   │   │   ├── migrations/          # Migrații database
│   │   │   └── evaluare.db          # Baza de date (generată)
│   │   ├── middleware/               # Auth, error handling
│   │   │   ├── auth.js              # JWT verification
│   │   │   ├── authProfessor.js     # Professor role check
│   │   │   ├── platformStatus.js    # Platform active check
│   │   │   └── errorHandler.js      # Global error handler
│   │   ├── routes/                   # Rute API
│   │   │   ├── auth.js              # /api/auth/*
│   │   │   ├── evaluations.js       # /api/evaluations/*
│   │   │   ├── admin.js             # /api/admin/*
│   │   │   ├── professorRoutes.js   # /api/professor/*
│   │   │   ├── platform.js          # /api/platform/*
│   │   │   ├── questions.js         # /api/questions/*
│   │   │   └── user.js              # /api/user/*
│   │   ├── services/                 # Business logic services
│   │   │   └── emailService.js      # Email sending
│   │   └── server.js                 # Entry point backend
│   ├── .env.example                  # Template variabile mediu
│   └── package.json
│
├── frontend/                          # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/               # Componente reutilizabile
│   │   │   ├── Layout.tsx           # Header + Footer + Nav
│   │   │   ├── AccessibilityMenu.tsx
│   │   │   ├── AccessibleModal.tsx
│   │   │   ├── DashboardCharts.tsx
│   │   │   ├── LikertScale.tsx      # Accessible Likert scale
│   │   │   ├── LiveRegion.tsx       # Screen reader announcements
│   │   │   ├── ScreenReaderOnly.tsx
│   │   │   ├── a11y/                # Accessibility components
│   │   │   │   ├── FocusTrap.tsx
│   │   │   │   ├── KeyboardShortcutsHelp.tsx
│   │   │   │   ├── SkipLink.tsx
│   │   │   │   └── index.ts
│   │   │   └── professor/           # Professor-specific components
│   │   │       ├── CourseCard.tsx
│   │   │       ├── EvaluationsList.tsx
│   │   │       ├── ExportButton.tsx
│   │   │       ├── ResponseChart.tsx
│   │   │       ├── StatCard.tsx
│   │   │       └── AnonymizedFeedback.tsx
│   │   ├── contexts/                 # Context API
│   │   │   ├── AuthContext.tsx      # Autentificare globală
│   │   │   └── AccessibilityContext.tsx # A11y settings
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useKeyboardShortcut.ts
│   │   │   ├── useFocusTrap.ts
│   │   │   ├── useFocusReturn.ts
│   │   │   ├── useTabNavigation.ts
│   │   │   ├── useArrowNavigation.ts
│   │   │   └── index.ts
│   │   ├── pages/                    # Pagini aplicație
│   │   │   ├── LoginPage.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── EvaluationForm.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminControls.tsx    # Platform settings
│   │   │   ├── AdminReports.tsx
│   │   │   ├── ProfessorDashboard.tsx
│   │   │   ├── ProfessorCourseDetails.tsx
│   │   │   ├── ProfessorReports.tsx
│   │   │   └── ProfessorDetails.tsx
│   │   ├── services/                 # API calls
│   │   │   └── api.ts               # Axios service class
│   │   ├── types/                    # TypeScript types
│   │   │   └── index.ts
│   │   ├── utils/                    # Utility functions
│   │   │   ├── focusManagement.ts
│   │   │   ├── keyboard.ts
│   │   │   └── pdfExport.ts
│   │   ├── styles/                   # CSS custom
│   │   │   └── focus.css            # AAA focus indicators
│   │   ├── App.tsx                   # Routing principal
│   │   ├── main.tsx                  # Entry point
│   │   └── index.css                 # Tailwind CSS + Custom CSS
│   ├── index.html
│   ├── vite.config.ts                # Config Vite
│   ├── tailwind.config.js            # Config Tailwind
│   ├── tsconfig.json                 # TypeScript config
│   └── package.json
│
├── .gitignore                         # Git ignore rules
├── ACCESSIBILITY_GUIDE.md             # Ghid accesibilitate detaliat
├── ACCESSIBILITY_README.md            # Documentație implementare a11y
├── PROFESSOR_API_TESTING.md           # Documentație API profesor
├── PROFESSOR_PANEL_PLAN.md            # Plan implementare profesor panel
├── PROFESSOR_TESTING_CHECKLIST.md     # Checklist testare profesor features
├── TESTING_CHECKLIST.md               # Checklist testare generală
├── PROJECT_STRUCTURE.txt              # Structură proiect text
├── PROJECT_STRUCTURE_TREE.txt         # Tree view structură
└── README.md                          # Acest fișier
```

---

## 🔧 API Endpoints

### Autentificare (`/api/auth`)
- `POST /api/auth/login` - Login utilizator (student/profesor/admin)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Utilizator curent (protected)

### Evaluări Student (`/api/evaluations`)
- `GET /api/evaluations/professors` - Listă profesori de evaluat
- `GET /api/evaluations/status` - Progres evaluări student
- `POST /api/evaluations` - Creare evaluare nouă (draft)
- `GET /api/evaluations/:id` - Detalii evaluare + întrebări
- `PUT /api/evaluations/:id/responses` - Salvare răspunsuri (auto-save)
- `POST /api/evaluations/:id/submit` - Trimite evaluare finală

### Admin (`/api/admin`)
- `GET /api/admin/dashboard` - Statistici globale dashboard
- `GET /api/admin/stats/completion` - Rate de completare (cu filtre)
- `GET /api/admin/professors` - Listă profesori cu statistici
- `GET /api/admin/stats/professor/:id` - Detalii profesor
- `GET /api/admin/filter-options` - Opțiuni filtrare (facultăți, ani, etc.)
- `GET /api/admin/stats/filtered` - Statistici filtrate
- `GET /api/admin/stats/discipline` - Comparație discipline
- `GET /api/admin/stats/by-year` - Statistici per an
- `GET /api/admin/stats/by-course-type` - Statistici per tip curs

### Profesor (`/api/professor`)
- `GET /api/professor/dashboard` - Dashboard personal profesor
- `GET /api/professor/courses` - Listă cursuri proprii
- `GET /api/professor/courses/:id/stats` - Statistici detaliate per curs
- `GET /api/professor/evaluations` - Listă evaluări primite (cu paginare)
- `GET /api/professor/export` - Export CSV statistici (cu filtre)

### Platform Management (`/api/platform`)
- `GET /api/platform/settings` - Setări platformă
- `PUT /api/platform/settings` - Update setări platformă
- `POST /api/platform/test-email` - Test configurare email
- `POST /api/platform/messages/send` - Trimitere anunț către studenți
- `GET /api/platform/messages/history` - Istoric mesaje trimise
- `GET /api/platform/messages/student` - Mesaje pentru student curent
- `GET /api/platform/filters/options` - Opțiuni filtrare pentru mesaje

### Chestionar Management (`/api/questions`)
- `GET /api/questions` - Listă întrebări
- `POST /api/questions` - Creare întrebare nouă (admin)
- `PUT /api/questions/:id` - Update întrebare (admin)
- `DELETE /api/questions/:id` - Ștergere întrebare (admin)
- `POST /api/questions/reorder` - Reordonare întrebări (admin)

### User Preferences (`/api/user`)
- `GET /api/user/preferences` - Preferințe accesibilitate utilizator
- `PUT /api/user/preferences` - Update preferințe accesibilitate

---

## 🗃️ Schema Bazei de Date

### Tabele Principale

#### Core Tables
- **users** - Studenți, profesori și administratori
- **professors** - Detalii cadre didactice (extinde users)
- **faculties** - Facultăți universitare
- **programs** - Programe de studiu (licență/master)
- **courses** - Discipline (leagă profesori de ani de studiu)
- **questions** - Întrebări din chestionar (Likert + text)
- **evaluations** - Tracking evaluări (student → profesor)
- **responses** - Răspunsuri ANONIME la întrebări

#### Supporting Tables
- **years** - Ani de studiu (1, 2, 3, Master 1, Master 2)
- **series** - Serii (A, B, C, etc.)
- **groups** - Grupe (1, 2, 3, etc.)
- **platform_settings** - Configurări platformă
- **messages** - Anunțuri către studenți
- **user_preferences** - Preferințe accesibilitate per utilizator

### Anonimizare Răspunsuri

**Cum funcționează:**
1. `evaluations` table leagă `student_id` → `professor_id` (tracking duplicate, deadline)
2. `responses` table conține doar `evaluation_id` → `question_id` → `answer`
3. **NU există link direct** între `student_id` și `answers` în queries
4. Adminii și profesorii văd **statistici agregate**, NU identități individuale
5. Răspunsurile text sunt afișate **fără autor** (anonim complet)

**Exemplu query sigur (profesor):**
```sql
-- ✅ SIGUR: Medie anonimă per curs
SELECT
  q.text,
  AVG(r.response_likert) as avg_score,
  COUNT(*) as response_count
FROM responses r
JOIN questions q ON q.id = r.question_id
WHERE r.evaluation_id IN (
  SELECT id FROM evaluations
  WHERE professor_id = ?
  AND course_id = ?
  AND status = 'submitted'
)
GROUP BY q.id;

-- ❌ NESIGUR: Expune identitate (NU EXISTĂ în cod)
SELECT u.name, r.response_text
FROM users u
JOIN evaluations e ON e.student_id = u.id
JOIN responses r ON r.evaluation_id = e.id;
```

### Migrații Database

Platforma suportă migrații pentru actualizări incremental:
- `003-add-user-preferences.sql` - Tabel preferințe accesibilitate
- `004-add-program-and-professor-type.sql` - Programe și tipuri profesori
- `005-add-professor-role.sql` - Rol profesor în users
- `add-course-type-and-platform-settings.sql` - Tipuri cursuri și setări
- `add-email-settings.sql` - Configurare SMTP
- `add-platform-deadline.sql` - Deadline evaluări

---

## 🧪 Testare Funcționalități

### Test Flow Student

1. **Login:** `student1@univ.ro` / `password123`
2. Dashboard: vezi lista de 5 profesori (unii deja evaluați pentru demo)
3. **Testare Accesibilitate:**
   - Click pe iconiță accesibilitate (top-right)
   - Activează **Dark Mode** → tema se schimbă instant
   - Activează **High Contrast** → contrast maxim
   - Schimbă **Font Size** → toate textele se ajustează
   - Activează **Dyslexia Font** → font Comic Sans
   - Dezactivează **Animations** → fără tranziții
   - Testează **Keyboard Navigation**:
     - Apasă `Tab` → focus pe primul profesor
     - Apasă `Arrow Down/Up` → navigare între profesori
     - Apasă `Enter` → deschide evaluare
4. **Început evaluare:**
   - Click "Începe evaluarea" la un profesor neevaluat
   - Formular se deschide cu 13 întrebări
5. **Completare chestionar:**
   - **Întrebări Likert (1-5):**
     - Click pe scor SAU
     - Navighează cu `Arrow Left/Right` și `Enter`
   - **Întrebări text:** Scrie feedback liber
6. **Auto-save:** Draft se salvează automat la 30 secunde
7. **Refresh pagină:** Răspunsurile sunt păstrate (draft recovery)
8. **Submit:** Click "Trimite evaluarea" → confirmare → finalizare
9. **Dashboard update:** Progresul este actualizat instant

### Test Flow Profesor

1. **Login:** `prof1@univ.ro` / `password123`
2. **Dashboard Profesor:**
   - Vezi statistici generale (total evaluări, scor mediu)
   - Card-uri per curs predat
   - Grafic trend temporal
3. **Click pe un curs:**
   - Statistici detaliate per curs
   - Distribuție scoruri per întrebare (bar chart)
   - Medii per categorie (radar chart)
   - Feedback anonim (răspunsuri text)
4. **Export date:**
   - Click "Export CSV"
   - Descarcă fișier cu toate statisticile
   - Filtrare opțională per semestru/an academic
5. **Navigare keyboard:**
   - `Alt + H` → înapoi la dashboard
   - `Tab` → navigare între carduri
   - `Enter` → deschide detalii curs

### Test Flow Admin

1. **Login:** `admin@univ.ro` / `password123`
2. **Dashboard Overview:**
   - Total studenți, profesori, evaluări
   - Grafic rate de completare per facultate
   - Top 5 profesori performanți
   - Profesori cu scoruri critice (<2.5)
3. **Click "Vezi detalii"** la un profesor
4. **Pagina Detalii Profesor:**
   - Scor mediu general
   - Grafic medii per categorie (radar)
   - Distribuție scoruri (pie chart)
   - Feedback text anonim
   - Export raport PDF (placeholder)
5. **Platform Management** (tab "Setări"):
   - Activare/Dezactivare platformă
   - Setare mesaj closure
   - Configurare email reminders
   - Test trimitere email
6. **Messaging System** (tab "Anunțuri"):
   - Compune anunț nou
   - Filtrare destinatari (facultate, an, serie, grupă)
   - Preview mesaj
   - Trimitere + opțional email notify
7. **Chestionar Management** (tab "Întrebări"):
   - Adăugare întrebare nouă
   - Editare întrebare existentă
   - Reordonare întrebări (drag & drop)
   - Ștergere întrebare (cu confirmare)

---

## 🔒 Securitate

### Implementat
- ✅ **JWT tokens** pentru autentificare (expires în 24h)
- ✅ **Protected routes** - middleware verificare token pe toate endpoint-urile sensibile
- ✅ **Role-based access control** - Student / Profesor / Admin cu permisiuni distincte
- ✅ **Anonimizare răspunsuri** - schema DB separată, fără link direct student → answers
- ✅ **Prevenire SQL injection** - prepared statements în toate queries
- ✅ **Helmet.js** security headers (XSS, clickjacking, etc.)
- ✅ **CORS configurat** - doar origin-uri permise
- ✅ **Password hashing** - bcrypt cu salt rounds 10
- ✅ **Input validation** - express-validator pe toate input-urile
- ✅ **Error handling** - global error handler, fără leak info sensibile
- ✅ **HTTPS ready** - configurabil pentru producție
- ✅ **Token expiration** - refresh mecanism (TODO pentru producție)

### Pentru Producție (TODO)
- 🔲 **Rate limiting** - express-rate-limit (100 requests/15min per IP)
- 🔲 **Session management** - Redis pentru scalabilitate
- 🔲 **Token refresh** mechanism - refresh tokens separate
- 🔲 **Audit logging** - log toate acțiunile admin/profesor
- 🔲 **Penetration testing** - teste securitate profesionale
- 🔲 **WAF** - Web Application Firewall (Cloudflare/AWS WAF)
- 🔲 **Database encryption** - encrypt at rest pentru date sensibile
- 🔲 **2FA** - two-factor authentication opțional

---

## 🚧 Limitări Curente (MVP)

Această este o versiune **MVP (Minimum Viable Product)** pentru demonstrație:

1. **Autentificare simplificată:** Username/password (nu Microsoft SSO/OAuth)
2. **Email reminders:** Funcționalitatea de trimitere email e implementată dar necesită configurare SMTP
3. **Export PDF:** Placeholder, necesită implementare Puppeteer/PDFKit
4. **SQLite (nu PostgreSQL):** Pentru simplitate development, în producție se recomandă PostgreSQL
5. **Fără deployment:** Rulează doar local, nu e deploiat pe cloud (ghid deployment mai jos)
6. **Fără Redis:** Session management cu JWT simplu, fără Redis cache

---

## 📊 Date Mock Generate

La rularea `npm run init-db` (sau `npm run seed`), se generează:

- **3 Facultăți:** Informatică, Matematică, Fizică
- **5 Programe:** Informatică (licență), CTI (licență), IA (master), Matematică (licență), Fizică (licență)
- **50 Studenți:** `student1@univ.ro` ... `student50@univ.ro`
- **8 Profesori:** Diverse departamente (cu rol `professor` în users)
- **1 Admin:** `admin@univ.ro` cu rol `admin`
- **5 Cursuri:** ASD, BD, POO, IA, RC (diverse tipuri: curs, seminar, laborator)
- **13 Întrebări:**
  - 10 cantitative (Likert 1-5) - categorii: didactica, comunicare, organizare, material, evaluare
  - 3 calitative (text liber) - puncte forte, puncte slabe, sugestii
- **20 Evaluări:** 10 completate (submitted), 10 draft
- **Platform Settings:** Configurări default (platformă activă, reminders dezactivate)

---

## 🐛 Troubleshooting

### Backend nu pornește

**Eroare:** `Error: EADDRINUSE: address already in use :::5001`

**Soluție:** Port-ul 5001 e ocupat. Oprește procesul sau schimbă port-ul în `backend/.env`:
```env
PORT=5002
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Găsește procesul care ocupă portul:**
```bash
# macOS/Linux
lsof -i :5001
kill -9 <PID>

# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

### Frontend nu se conectează la backend

**Eroare:** `Network Error` sau `Failed to fetch`

**Verificări:**
1. Backend-ul rulează? Verifică http://localhost:5001/api/health
   ```bash
   curl http://localhost:5001/api/health
   # Răspuns așteptat: {"status":"OK","timestamp":"..."}
   ```
2. Frontend proxy e configurat? Vezi `frontend/vite.config.ts`:
   ```ts
   export default defineConfig({
     server: {
       proxy: {
         '/api': {
           target: 'http://localhost:5001',
           changeOrigin: true,
         }
       }
     }
   });
   ```
3. Backend PORT în .env corespunde cu proxy? Dacă backend e pe alt port, update proxy target.

### Baza de date nu se creează

**Eroare:** `Error: unable to open database file`

**Soluție:**
```bash
cd backend/src/db
ls -la  # Verifică că directorul există
cd ../..
npm run init-db
```

**Sau reinitializează complet:**
```bash
rm backend/src/db/evaluare.db*  # Șterge DB existentă
npm run init-db  # Recrează de la zero
```

### Module not found

**Eroare:** `Cannot find module 'express'` sau `Cannot find module '@types/react'`

**Soluție:** Reinstalează dependențele:
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors în Frontend

**Eroare:** `TS2304: Cannot find name 'React'` sau similar

**Soluție:**
```bash
cd frontend
npm install --save-dev @types/react @types/react-dom @types/node
npm run dev
```

### Vite Build Errors

**Eroare:** `Could not resolve "./styles/focus.css"`

**Verificare:**
```bash
ls frontend/src/styles/focus.css  # Fișierul există?
```

**Soluție:** Asigură-te că toate import-urile au path-uri corecte relative la fișier.

---

## 📦 Build pentru Producție

### Backend

Backend-ul Node.js nu necesită build, rulează direct:

```bash
cd backend

# Setare variabile mediu producție
cp .env.example .env
nano .env  # Editează: PORT, JWT_SECRET, NODE_ENV=production

# Rulare producție
NODE_ENV=production node src/server.js

# Sau cu PM2 (recomandat)
npm install -g pm2
pm2 start src/server.js --name "antigravity-backend" -i max
pm2 save
pm2 startup  # Configurare auto-restart la reboot
```

### Frontend

```bash
cd frontend
npm run build
```

Fișierele optimizate vor fi în `frontend/dist/`.

**Servire build:**

Opțiunea 1 - Vite preview:
```bash
npm run preview
# Acces la http://localhost:4173
```

Opțiunea 2 - Serve static:
```bash
npx serve dist -p 3000
```

Opțiunea 3 - Nginx (producție):
```nginx
server {
  listen 80;
  server_name yourdomain.com;
  root /path/to/frontend/dist;
  index index.html;

  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
  }

  # API proxy
  location /api {
    proxy_pass http://localhost:5001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## 🚀 Deployment (Producție)

### Opțiunea 1: VPS/Server Dedicat (Recomandat)

**Stack recomandat:**
- **OS:** Ubuntu 22.04 LTS
- **Web Server:** Nginx (reverse proxy + static files)
- **Process Manager:** PM2 (Node.js)
- **Database:** PostgreSQL (în loc de SQLite)
- **SSL:** Certbot (Let's Encrypt)

**Pași deployment:**

1. **Setup server:**
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Instalare Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalare Nginx
sudo apt install -y nginx

# Instalare PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalare PM2
sudo npm install -g pm2
```

2. **Clone repository:**
```bash
cd /var/www
sudo git clone https://github.com/sergiu09C/AntiGravity.git
cd AntiGravity
sudo chown -R $USER:$USER .
```

3. **Setup backend:**
```bash
cd backend
npm install --production
cp .env.example .env
nano .env  # Configurează variabile producție

# Migrare la PostgreSQL (opțional)
# Adaptează schema.sql pentru PostgreSQL
# Update config/database.js pentru PostgreSQL

# Start cu PM2
pm2 start src/server.js --name antigravity-api -i max
pm2 save
pm2 startup
```

4. **Build frontend:**
```bash
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/html/antigravity/
```

5. **Configurare Nginx:**
```bash
sudo nano /etc/nginx/sites-available/antigravity
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/html/antigravity;
    index index.html;

    # Frontend (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/antigravity /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Setup SSL (Let's Encrypt):**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot renew --dry-run  # Test auto-renewal
```

### Opțiunea 2: Cloud Platforms

#### **Azure (recomandat pentru învățământ)**

```bash
# Azure CLI
az login
az group create --name AntiGravityRG --location eastus

# Backend - Azure App Service
az appservice plan create --name AntiGravityPlan --resource-group AntiGravityRG --sku B1 --is-linux
az webapp create --resource-group AntiGravityRG --plan AntiGravityPlan --name antigravity-api --runtime "NODE|18-lts"
az webapp deployment source config --name antigravity-api --resource-group AntiGravityRG --repo-url https://github.com/sergiu09C/AntiGravity --branch main --manual-integration

# Frontend - Azure Static Web Apps
az staticwebapp create --name antigravity-frontend --resource-group AntiGravityRG --source https://github.com/sergiu09C/AntiGravity --branch main --app-location "/frontend" --output-location "dist"

# Database - Azure Database for PostgreSQL
az postgres server create --resource-group AntiGravityRG --name antigravity-db --admin-user dbadmin --admin-password <password> --sku-name B_Gen5_1
```

#### **Heroku**

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create apps
heroku create antigravity-api
heroku create antigravity-frontend

# Backend
cd backend
git init
heroku git:remote -a antigravity-api
git push heroku main

# Frontend (buildpack Node.js)
cd ../frontend
heroku buildpacks:set heroku/nodejs -a antigravity-frontend
git push heroku main
```

#### **DigitalOcean App Platform**

1. Fork repository pe GitHub
2. Mergi la https://cloud.digitalocean.com/apps
3. Click "Create App" → Connect GitHub
4. Selectează repository `AntiGravity`
5. Configurează 2 componente:
   - **Backend:** Node.js, build command `cd backend && npm install`, run command `node src/server.js`
   - **Frontend:** Static Site, build command `cd frontend && npm install && npm run build`, output dir `frontend/dist`
6. Deploy

---

## 🎯 Roadmap (Extensii Viitoare)

### Faza 1: Autentificare Enterprise
- [ ] **Microsoft Azure AD (SSO)** - autentificare cu cont universitate
- [ ] **OAuth 2.0** - Google, GitHub
- [ ] **2FA** - two-factor authentication opțional
- [ ] **Password recovery** - reset parolă cu email

### Faza 2: Notificări & Email
- [ ] **Email reminders** - automate pentru studenți (cron jobs)
- [ ] **Email templates** - design profesional cu statistici live
- [ ] **In-app notifications** - notificări browser (Push API)
- [ ] **SMS reminders** - Twilio integration (opțional)

### Faza 3: AI & Analytics
- [ ] **AI rapoarte narative** - Azure OpenAI / GPT-4
- [ ] **Sentiment analysis** - analiza feedback-ului text
- [ ] **Trend prediction** - predicție scoruri viitoare
- [ ] **Anomaly detection** - identificare răspunsuri suspecte

### Faza 4: Export & Rapoarte
- [ ] **PDF generation** - rapoarte profesionale (Puppeteer)
- [ ] **Excel export** - statistici detaliate (ExcelJS)
- [ ] **PowerPoint export** - prezentări auto-generate
- [ ] **Custom templates** - template-uri personalizabile per facultate

### Faza 5: Features Avansate
- [ ] **Comparații inter-semestre** - evoluție temporală
- [ ] **Benchmark departamentale** - comparație între departamente
- [ ] **Dashboard profesori live** - actualizare în timp real
- [ ] **Gamification studenți** - puncte, badges, leaderboard
- [ ] **Multi-language** - Română, Engleză, Franceză
- [ ] **Mobile app** - React Native (iOS/Android)

### Faza 6: Integrare Sisteme
- [ ] **Integrare catalog studențesc** - import automat studenți/cursuri
- [ ] **Integrare Teams/Moodle** - link-uri directe în platforme educaționale
- [ ] **Calendar academic** - sincronizare cu evenimente universitare
- [ ] **API public** - pentru alte aplicații universitare

---

## 🤝 Contribuții

Contribuțiile sunt binevenite! Pentru a contribui:

1. **Fork repository-ul** pe GitHub
2. **Creează branch** pentru feature-ul tău:
   ```bash
   git checkout -b feature/NumeFeature
   ```
3. **Commit modificările**:
   ```bash
   git commit -m "Add: Descriere feature"
   ```
4. **Push pe branch**:
   ```bash
   git push origin feature/NumeFeature
   ```
5. **Deschide Pull Request** pe GitHub

### Guidelines Contribuții

- **Code Style:** Respectă ESLint/Prettier config-ul existent
- **Commits:** Mesaje clare în format conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- **Tests:** Adaugă teste pentru funcționalități noi (când există test framework)
- **Documentation:** Update README/documentație pentru modificări majore
- **Accesibilitate:** Asigură-te că toate componentele noi sunt WCAG 2.1 AAA compliant

---

## 📄 Licență

Acest proiect este dezvoltat pentru **uz intern universitar**.

Toate drepturile rezervate. Nu este permisă redistribuirea sau utilizarea comercială fără permisiune explicită.

---

## 👨‍💻 Echipa de Dezvoltare

**Dezvoltat cu ❤️ pentru îmbunătățirea calității educației în învățământul superior românesc.**

### Tehnologii Folosite

#### Backend
- **Node.js** v18+ - Runtime JavaScript server-side
- **Express.js** v4.18 - Web framework
- **SQLite** v3 - Database (better-sqlite3)
- **JWT** - JSON Web Tokens pentru autentificare
- **Bcrypt** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **Express Validator** - Input validation
- **Nodemailer** - Email sending (SMTP)

#### Frontend
- **React** v18.2 - UI library
- **TypeScript** v5.3 - Type-safe JavaScript
- **Vite** v5.0 - Build tool ultra-rapid
- **Tailwind CSS** v3.4 - Utility-first CSS framework
- **React Router** v6.21 - Client-side routing
- **Axios** v1.6 - HTTP client
- **Recharts** v2.10 - Data visualization
- **Headless UI** v1.7 - Unstyled accessible components
- **Heroicons** v2.1 - Icon library

#### Accesibilitate
- **WCAG 2.1 Level AAA** - Conformitate completă
- **ARIA** - Accessible Rich Internet Applications
- **Focus Management** - Custom hooks pentru focus trap/return
- **Keyboard Navigation** - Custom hooks pentru arrow/tab navigation
- **Screen Reader** optimization - Semantic HTML + ARIA labels
- **Reduce Motion** support - Respectă preferințe OS

#### Development Tools
- **Nodemon** - Auto-restart backend
- **ESLint** - Code linting
- **Prettier** - Code formatting (opțional)
- **Git** - Version control

---

## 📚 Documentație Suplimentară

- [ACCESSIBILITY_GUIDE.md](ACCESSIBILITY_GUIDE.md) - Ghid complet accesibilitate pentru utilizatori
- [ACCESSIBILITY_README.md](ACCESSIBILITY_README.md) - Documentație tehnică implementare a11y
- [PROFESSOR_API_TESTING.md](PROFESSOR_API_TESTING.md) - Documentație API profesor + exemple teste
- [PROFESSOR_PANEL_PLAN.md](PROFESSOR_PANEL_PLAN.md) - Plan detaliat implementare profesor features
- [PROFESSOR_TESTING_CHECKLIST.md](PROFESSOR_TESTING_CHECKLIST.md) - Checklist testare profesor panel
- [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) - Checklist testare generală platformă
- [PROJECT_STRUCTURE.txt](PROJECT_STRUCTURE.txt) - Structură proiect text simplu
- [PROJECT_STRUCTURE_TREE.txt](PROJECT_STRUCTURE_TREE.txt) - Tree view structură directoare

---

## 📞 Suport & Contact

Pentru întrebări, bug reports sau feature requests:

- **GitHub Issues:** https://github.com/sergiu09C/AntiGravity/issues
- **GitHub Discussions:** https://github.com/sergiu09C/AntiGravity/discussions
- **Email:** support@youruni.ro (placeholder)

---

## 🙏 Mulțumiri

Mulțumiri speciale:

- **Comunitatea React** - pentru framework-ul excelent și ecosistem
- **Tailwind Labs** - pentru Tailwind CSS și Headless UI
- **WCAG Contributors** - pentru ghidurile de accesibilitate
- **Open Source Community** - pentru toate library-urile folosite

---

**🎉 Succes cu platforma de evaluare!**

*Platforma este dezvoltată cu scopul de a îmbunătăți calitatea educației prin feedback constructiv și anonim. Respectă confidențialitatea studenților și profesorilor, și folosește datele responsabil.*

**Repository:** https://github.com/sergiu09C/AntiGravity

**Dezvoltat în:** 2025
**Ultima actualizare:** Februarie 2025
**Versiune:** 1.0.0 (MVP)

---

