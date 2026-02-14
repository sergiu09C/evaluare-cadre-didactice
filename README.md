# 📚 Platformă de Evaluare Cadre Didactice

Platformă web full-stack pentru evaluarea cadrelor didactice, construită cu React + TypeScript (frontend) și Node.js + Express + SQLite (backend).

## ✨ Funcționalități Principale

### Pentru Studenți
- ✅ Autentificare securizată (username/password)
- ✅ Dashboard cu listă profesori de evaluat
- ✅ Progress tracking (câte evaluări ai completat)
- ✅ Formular de evaluare interactiv:
  - Întrebări cantitative (Likert scale 1-5)
  - Întrebări calitative (răspunsuri text)
  - Auto-save draft la fiecare 30 secunde
  - Submit final cu confirmare
- ✅ Evaluări anonime (răspunsurile nu pot fi legate de identitate)
- ✅ Prevenire duplicate (1 evaluare/profesor/student)

### Pentru Administratori
- ✅ Dashboard cu statistici globale
- ✅ Rate de completare per facultate (grafice)
- ✅ Top 5 profesori performanți
- ✅ Identificare profesori cu scoruri critice (<2.5)
- ✅ Detalii complete per profesor:
  - Medii per categorie (didactică, comunicare, organizare, etc.)
  - Distribuție scoruri (1-5)
  - Feedback calitativ (răspunsuri text anonime)
- ✅ Export-friendly (date structurate pentru rapoarte)

---

## 🚀 Quick Start

### Cerințe Preliminare

Asigură-te că ai instalat:
- **Node.js** (v18 sau mai nou) - [Download Node.js](https://nodejs.org/)
- **npm** (vine cu Node.js)

**Verificare instalare:**
```bash
node --version   # ar trebui să afișeze v18.x.x sau mai nou
npm --version    # ar trebui să afișeze 9.x.x sau mai nou
```

---

## 📥 Instalare

### 1. Instalare Dependențe Backend

```bash
cd backend
npm install
```

### 2. Instalare Dependențe Frontend

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
  - 10 evaluări completate (demo)
- ✅ Afișează credențiale de test

**Output așteptat:**
```
✅ Database schema created successfully
✅ Database seeding complete!

📊 Database Statistics:
  - Facultăți: 3
  - Programe: 5
  - Utilizatori: 51
  - Profesori: 8
  - Cursuri: 5
  - Întrebări: 13
  - Evaluări: 20

🔐 Test Credentials:
  Admin: admin@univ.ro / password123
  Student: student1@univ.ro / password123
```

---

## 🏃 Rulare Aplicație

### Opțiunea 1: Rulare Manuală (2 terminale)

**Terminal 1 - Backend (port 5000):**
```bash
cd backend
npm run dev
```

Ar trebui să vezi:
```
🚀 Server running on http://localhost:5000
📊 Environment: development
✅ Health check: http://localhost:5000/api/health
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

Poți crea un script `start.sh`:

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

echo "🚀 Backend running on http://localhost:5000"
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

**Administrator:**
- Email: `admin@univ.ro`
- Parolă: `password123`

**Alte conturi student:** `student2@univ.ro`, `student3@univ.ro`, ..., `student50@univ.ro` (toate cu parola `password123`)

---

## 📁 Structura Proiectului

```
antigravity-platform/
├── backend/                      # Backend Node.js + Express
│   ├── src/
│   │   ├── config/              # Configurare database
│   │   ├── controllers/         # Logica de business
│   │   ├── db/                  # Schema + seeding
│   │   │   ├── schema.sql       # Schema SQLite
│   │   │   ├── init.js          # Script inițializare
│   │   │   └── evaluare.db      # Baza de date (generată)
│   │   ├── middleware/          # Auth, error handling
│   │   ├── models/              # (rezervat pentru extensii)
│   │   ├── routes/              # Rute API
│   │   │   ├── auth.js          # /api/auth/*
│   │   │   ├── evaluations.js  # /api/evaluations/*
│   │   │   └── admin.js         # /api/admin/*
│   │   └── server.js            # Entry point backend
│   ├── .env                     # Variabile de mediu
│   ├── package.json
│   └── README.md
│
├── frontend/                     # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/          # Componente reutilizabile
│   │   │   └── Layout.tsx       # Header + Footer
│   │   ├── contexts/            # Context API
│   │   │   └── AuthContext.tsx  # Autentificare globală
│   │   ├── pages/               # Pagini aplicație
│   │   │   ├── LoginPage.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── EvaluationForm.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── ProfessorDetails.tsx
│   │   ├── services/            # API calls
│   │   │   └── api.ts           # Axios service
│   │   ├── types/               # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx              # Routing principal
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Tailwind CSS
│   ├── index.html
│   ├── vite.config.ts           # Config Vite
│   ├── tailwind.config.js       # Config Tailwind
│   └── package.json
│
└── README.md                     # Acest fișier
```

---

## 🔧 API Endpoints

### Autentificare (`/api/auth`)
- `POST /api/auth/login` - Login utilizator
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

---

## 🗃️ Schema Bazei de Date

### Tabele Principale

- **users** - Studenți și administratori
- **professors** - Cadre didactice
- **courses** - Discipline (leagă profesori de ani de studiu)
- **questions** - Întrebări din chestionar (Likert + text)
- **evaluations** - Tracking cine evaluează pe cine (fără răspunsuri)
- **responses** - Răspunsuri ANONIME (separate de identitatea studentului)

### Anonimizare

**Cum funcționează:**
1. `evaluations` table leagă `student_id` → `professor_id` (tracking duplicate)
2. `responses` table conține doar `evaluation_id` → `question_id` → `answer`
3. Nu există link direct între `student_id` și `answers` în queries
4. Adminii văd statistici agregate, NU identități individuale

**Exemplu query sigur (admin):**
```sql
-- ✅ SIGUR: Medie anonimă
SELECT AVG(response_likert) FROM responses
WHERE evaluation_id IN (
  SELECT id FROM evaluations WHERE professor_id = ?
);

-- ❌ NESIGUR: Expune identitate (nu există în cod)
SELECT u.name, r.response_text FROM users u
JOIN evaluations e ON e.student_id = u.id
JOIN responses r ON r.evaluation_id = e.id;
```

---

## 🧪 Testare Funcționalități

### Test Flow Student

1. **Login:** `student1@univ.ro` / `password123`
2. Vei vedea dashboard cu 5 profesori (unii deja evaluați pentru demo)
3. **Începe evaluare nouă** la un profesor neevaluat
4. **Completează chestionarul:**
   - Alege scoruri Likert (1-5) pentru cele 10 întrebări cantitative
   - Scrie răspunsuri text pentru cele 3 întrebări calitative
5. **Salvează draft** → refresh pagina → răspunsurile sunt păstrate
6. **Trimite evaluarea** → nu mai poți edita răspunsurile
7. **Înapoi la dashboard** → progresul este actualizat

### Test Flow Admin

1. **Login:** `admin@univ.ro` / `password123`
2. **Dashboard overview:**
   - Vezi total studenți, profesori, evaluări
   - Grafic cu rate de completare per facultate
   - Top 5 profesori performanți
   - Profesori cu scoruri critice (<2.5)
3. **Click pe "Vezi detalii"** la un profesor
4. **Pagina detalii profesor:**
   - Scor mediu general
   - Grafic medii per categorie
   - Distribuție scoruri (pie chart)
   - Feedback text anonim

---

## 🔒 Securitate

### Implementat
- ✅ JWT tokens pentru autentificare
- ✅ Protected routes (middleware verificare token)
- ✅ Role-based access control (Student vs Admin)
- ✅ Anonimizare răspunsuri (schema DB separată)
- ✅ Prevenire SQL injection (prepared statements)
- ✅ Helmet.js security headers
- ✅ CORS configurat
- ✅ Password hashing (bcrypt)
- ✅ Input validation
- ✅ Rate limiting (recomandat pentru producție - TODO)

### Pentru Producție (TODO)
- 🔲 HTTPS/SSL certificates
- 🔲 Rate limiting (express-rate-limit)
- 🔲 Session management cu Redis
- 🔲 Token refresh mechanism
- 🔲 Audit logging
- 🔲 Penetration testing

---

## 🚧 Limitări Curente (MVP)

Această este o versiune **MVP (Minimum Viable Product)** pentru demonstrație:

1. **Autentificare simplificată:** Username/password (nu Microsoft SSO)
2. **Fără email remindere:** Funcționalitatea de trimitere email nu e implementată
3. **Fără AI rapoarte:** Integrarea cu OpenAI pentru rapoarte narative este placeholder
4. **Fără export PDF/Excel:** Trebuie implementat separat
5. **SQLite (nu PostgreSQL):** Pentru simplitate, în producție folosește PostgreSQL
6. **Fără deployment:** Rulează doar local, nu e deploiat pe cloud

---

## 📊 Date Mock Generate

La rularea `npm run init-db`, se generează:

- **3 Facultăți:** Informatică, Matematică, Fizică
- **5 Programe:** Informatică, CTI, IA (master), Matematică, Fizică
- **50 Studenți:** `student1@univ.ro` ... `student50@univ.ro`
- **8 Profesori:** Diverse departamente
- **5 Cursuri:** ASD, BD, POO, IA, RC
- **13 Întrebări:**
  - 10 cantitative (Likert 1-5)
  - 3 calitative (text liber)
- **20 Evaluări:** 10 completate (submitted), 10 draft

---

## 🐛 Troubleshooting

### Backend nu pornește

**Eroare:** `Error: EADDRINUSE: address already in use :::5000`

**Soluție:** Port-ul 5000 e ocupat. Oprește procesul sau schimbă port-ul în `backend/.env`:
```env
PORT=5001
```

### Frontend nu se conectează la backend

**Eroare:** `Network Error` sau `Failed to fetch`

**Verificări:**
1. Backend-ul rulează? Verifică http://localhost:5000/api/health
2. Frontend proxy e configurat? Vezi `frontend/vite.config.ts`:
   ```ts
   proxy: {
     '/api': {
       target: 'http://localhost:5000',
       changeOrigin: true,
     }
   }
   ```

### Baza de date nu se creează

**Eroare:** `Error: unable to open database file`

**Soluție:**
```bash
cd backend/src/db
mkdir -p .   # Asigură-te că directorul există
cd ../..
npm run init-db
```

### Module not found

**Eroare:** `Cannot find module 'express'`

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

---

## 📦 Build pentru Producție

### Backend

```bash
cd backend
# Nu necesită build, rulează direct cu Node.js
node src/server.js
```

### Frontend

```bash
cd frontend
npm run build
```

Fișierele optimizate vor fi în `frontend/dist/`. Poți servi cu:
```bash
npm run preview
# sau
npx serve dist
```

---

## 🎯 Pași Următori (Extensii Viitoare)

1. **Autentificare Microsoft (Azure AD):**
   - Setup Azure App Registration
   - Integrare MSAL.js frontend
   - Validare token backend

2. **Email Remindere:**
   - Integrare SendGrid/AWS SES
   - Template-uri email cu statistici live
   - Programare remindere automate

3. **AI Rapoarte Narative:**
   - Integrare Azure OpenAI Service
   - Prompt engineering pentru rapoarte profesionale
   - Identificare automată situații critice

4. **Export Rapoarte:**
   - PDF generation (Puppeteer/PDFKit)
   - Excel export (ExcelJS)
   - Template-uri personalizate

5. **Deployment Cloud:**
   - Azure App Service (backend)
   - Azure Static Web Apps (frontend)
   - Azure Database for PostgreSQL
   - CI/CD cu GitHub Actions

6. **Features Avansate:**
   - Comparații inter-semestre
   - Dashboard pentru profesori (self-review)
   - Benchmark-uri departamentale
   - Gamification pentru studenți

---

## 🤝 Contribuții

Pentru contribuții sau raportare bug-uri, contactează echipa de dezvoltare.

---

## 📄 Licență

Acest proiect este dezvoltat pentru uz intern universitar.

---

## 👨‍💻 Autor

Dezvoltat cu ❤️ pentru îmbunătățirea calității educației în învățământul superior.

**Tehnologii folosite:**
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Recharts
- Backend: Node.js, Express, SQLite, JWT, Bcrypt
- Development: Nodemon, Axios, React Router

---

**🎉 Succes cu platforma de evaluare!**

Pentru întrebări sau suport tehnic, consultă documentația sau contactează administratorul de sistem.
