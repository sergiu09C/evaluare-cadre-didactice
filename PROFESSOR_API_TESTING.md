# Testing API Profesor - FAZA 2

## Rezumat Implementare

FAZA 2 a fost implementată cu succes și include:
- Middleware autentificare profesor
- Controller complet cu toate funcțiile
- Rute protejate
- Anonimizare garantată
- Export CSV funcțional

---

## Endpoint-uri Implementate

### 1. GET /api/professor/dashboard
Statistici generale pentru profesor autentificat.

**Autentificare**: Bearer Token (rol = professor)

**Răspuns**:
```json
{
  "summary": {
    "totalEvaluations": 3,
    "overallAverage": 4.4,
    "uniqueStudents": 3
  },
  "courseEvaluations": [
    {
      "courseId": 33,
      "courseName": "Algoritmi și Structuri de Date",
      "courseType": "curs",
      "semester": "1",
      "evaluationCount": 15,
      "averageScore": 4.4
    }
  ],
  "trend": {
    "current": 4.4,
    "previous": null,
    "change": null
  }
}
```

**Curl Test**:
```bash
TOKEN="your_professor_jwt_token"
curl -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/professor/dashboard
```

---

### 2. GET /api/professor/evaluations
Lista evaluărilor ANONIMIZATE cu filtre și paginare.

**Autentificare**: Bearer Token (rol = professor)

**Query Parameters**:
- `courseId` (optional): Filtrare după curs
- `semester` (optional): Filtrare după semestru (1 sau 2)
- `academicYear` (optional): Filtrare după an academic (ex: 2023-2024)
- `limit` (optional, default: 50): Limită rezultate
- `offset` (optional, default: 0): Offset pentru paginare

**Răspuns**:
```json
{
  "evaluations": [
    {
      "id": 3,
      "courseId": 33,
      "courseName": "Algoritmi și Structuri de Date",
      "courseType": "curs",
      "semester": "1",
      "academicYear": "2023-2024",
      "submittedAt": "2026-02-04 20:02:52",
      "averageScore": 5
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

**Curl Test**:
```bash
TOKEN="your_professor_jwt_token"

# Toate evaluările
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/professor/evaluations"

# Cu filtre și paginare
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/professor/evaluations?courseId=33&limit=2&offset=0"
```

---

### 3. GET /api/professor/courses
Cursurile profesorului cu statistici sumare.

**Autentificare**: Bearer Token (rol = professor)

**Răspuns**:
```json
{
  "courses": [
    {
      "id": 33,
      "name": "Algoritmi și Structuri de Date",
      "courseType": "curs",
      "semester": "1",
      "academicYear": "2023-2024",
      "statistics": {
        "totalEvaluations": 3,
        "completedEvaluations": 3,
        "averageScore": 4.4
      }
    }
  ]
}
```

**Curl Test**:
```bash
TOKEN="your_professor_jwt_token"
curl -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/professor/courses
```

---

### 4. GET /api/professor/courses/:courseId/stats
Statistici detaliate pentru un curs specific, inclusiv distribuție răspunsuri per întrebare și comentarii text ANONIMIZATE.

**Autentificare**: Bearer Token (rol = professor)

**Path Parameter**:
- `courseId`: ID-ul cursului

**Răspuns**:
```json
{
  "course": {
    "id": 33,
    "name": "Algoritmi și Structuri de Date",
    "courseType": "curs",
    "semester": "1",
    "academicYear": "2023-2024"
  },
  "statistics": {
    "totalEvaluations": 15,
    "averageScore": 4.4
  },
  "questionDistribution": [
    {
      "questionId": 1,
      "questionText": "Cadrul didactic prezintă informația într-un mod clar și structurat",
      "category": "didactica",
      "type": "likert",
      "averageScore": 4.67,
      "responseCount": 3,
      "distribution": {
        "score1": 0,
        "score2": 0,
        "score3": 0,
        "score4": 1,
        "score5": 2
      }
    }
  ],
  "textFeedback": [
    {
      "question": "Atmosfera la curs/seminar este propice învățării",
      "category": "comunicare",
      "answer": "Excelent! Profesorul explică foarte clar conceptele complexe.",
      "submittedAt": "2026-02-04 20:02:52"
    }
  ]
}
```

**Note**:
- Comentariile text sunt afișate DOAR dacă există >= 3 evaluări pentru acel curs (pentru anonimizare)
- Dacă sunt < 3 evaluări, `textFeedback` va fi un obiect cu mesaj explicativ

**Curl Test**:
```bash
TOKEN="your_professor_jwt_token"
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/professor/courses/33/stats"
```

---

### 5. GET /api/professor/export
Export date în format CSV pentru analiză.

**Autentificare**: Bearer Token (rol = professor)

**Query Parameters**:
- `courseId` (optional): Export doar pentru un curs
- `semester` (optional): Export doar pentru un semestru
- `academicYear` (optional): Export doar pentru un an academic

**Răspuns**: Fișier CSV cu header UTF-8 BOM

**Format CSV**:
```csv
Curs,Tip Curs,Semestru,An Academic,Întrebare,Categorie,Medie,Total Răspunsuri,Scor 1,Scor 2,Scor 3,Scor 4,Scor 5
"Algoritmi și Structuri de Date","curs","1","2023-2024","Cadrul didactic prezintă informația într-un mod clar și structurat","didactica",4.67,3,0,0,0,1,2
```

**Curl Test**:
```bash
TOKEN="your_professor_jwt_token"

# Export toate datele
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/professor/export" \
  -o evaluari-profesor.csv

# Export cu filtre
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/professor/export?courseId=33&semester=1" \
  -o evaluari-algoritmi.csv
```

---

## Securitate și Anonimizare

### Verificări Securitate

1. **Middleware autentificare**: Toate rutele necesită token JWT valid
2. **Middleware rol profesor**: Verifică că utilizatorul are rol = 'professor'
3. **Verificare proprietate**: Profesorul poate accesa doar cursurile sale

**Test Securitate**:
```bash
# Test cu token de student (trebuie să eșueze cu 403)
STUDENT_TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@univ.ro","password":"password123"}' | jq -r '.token')

curl -H "Authorization: Bearer $STUDENT_TOKEN" \
  "http://localhost:5001/api/professor/dashboard"
# Răspuns: {"error": "Professor access required"}

# Test acces la curs care nu aparține profesorului (404/403)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/professor/courses/999/stats"
# Răspuns: {"error": "Course not found or access denied"}
```

### Anonimizare Garantată

**Datele NU includ NICIODATĂ**:
- `student_id`
- `student_name`
- `first_name` / `last_name` al studentului
- Orice informație care poate identifica studentul

**Protecție comentarii text**:
- Comentariile text sunt afișate DOAR dacă există >= 3 evaluări pentru acel curs
- Dacă sunt < 3 evaluări, se afișează mesaj că feedback-ul nu este disponibil

---

## Autentificare Profesor

### Obținere Token JWT

```bash
# Login ca profesor
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vasile.popescu.1@prof.univ.ro",
    "password": "password123"
  }'

# Răspuns:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "vasile.popescu.1@prof.univ.ro",
    "role": "professor",
    "firstName": "Vasile",
    "lastName": "Popescu"
  }
}
```

### Profesori Disponibili pentru Test

Din seed-ul existent (`backend/src/db/seed-extended.js`):
- Email: `vasile.popescu.1@prof.univ.ro` / Password: `password123`
- Email: `maria.popescu.2@prof.univ.ro` / Password: `password123`
- Email: `ion.popescu.3@prof.univ.ro` / Password: `password123`
- ... (toți profesorii au parola `password123`)

---

## Script de Test Complet

```bash
#!/bin/bash

# Culori pentru output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Testing Professor API - FAZA 2"
echo "=========================================="

# 1. Login ca profesor
echo -e "\n${GREEN}[1] Login ca profesor...${NC}"
RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vasile.popescu.1@prof.univ.ro","password":"password123"}')

TOKEN=$(echo $RESPONSE | jq -r '.token')

if [ "$TOKEN" = "null" ]; then
  echo -e "${RED}FAILED: Login failed${NC}"
  exit 1
fi
echo -e "${GREEN}SUCCESS: Token obtained${NC}"

# 2. Test Dashboard
echo -e "\n${GREEN}[2] Testing /api/professor/dashboard...${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/professor/dashboard" | jq .

# 3. Test Evaluations
echo -e "\n${GREEN}[3] Testing /api/professor/evaluations...${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/professor/evaluations?limit=2" | jq .

# 4. Test Courses
echo -e "\n${GREEN}[4] Testing /api/professor/courses...${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/professor/courses" | jq .

# 5. Test Course Stats
echo -e "\n${GREEN}[5] Testing /api/professor/courses/33/stats...${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/professor/courses/33/stats" | jq .

# 6. Test Export
echo -e "\n${GREEN}[6] Testing /api/professor/export...${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/professor/export" > /tmp/export-test.csv
echo "First 5 lines of CSV:"
head -5 /tmp/export-test.csv

# 7. Test Security - Student trying to access
echo -e "\n${GREEN}[7] Testing security - Student access (should fail)...${NC}"
STUDENT_TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@univ.ro","password":"password123"}' | jq -r '.token')

RESULT=$(curl -s -H "Authorization: Bearer $STUDENT_TOKEN" \
  "http://localhost:5001/api/professor/dashboard")
echo $RESULT | jq .

if echo "$RESULT" | grep -q "Professor access required"; then
  echo -e "${GREEN}SUCCESS: Security works - student denied access${NC}"
else
  echo -e "${RED}FAILED: Security breach - student can access professor data${NC}"
fi

echo -e "\n=========================================="
echo -e "${GREEN}All tests completed!${NC}"
echo "=========================================="
```

---

## Fișiere Create/Modificate

### Fișiere Noi
1. `/Users/anosr/Desktop/AntiGravity/backend/src/middleware/authProfessor.js`
2. `/Users/anosr/Desktop/AntiGravity/backend/src/controllers/professorController.js`
3. `/Users/anosr/Desktop/AntiGravity/backend/src/routes/professorRoutes.js`

### Fișiere Modificate
1. `/Users/anosr/Desktop/AntiGravity/backend/src/server.js` (adăugat ruta `/api/professor`)

---

## Next Steps (FAZA 3)

După ce FAZA 2 este completă, următorul pas este FAZA 3: Frontend - Auth & Context
- Update AuthContext pentru rol profesor
- Update Login Page pentru redirect profesor
- Update Layout cu meniu pentru profesor

---

**Status FAZA 2**: ✅ COMPLETAT
**Data**: 2026-02-05
**Testat**: DA
**Anonimizare verificată**: DA
**Securitate verificată**: DA
