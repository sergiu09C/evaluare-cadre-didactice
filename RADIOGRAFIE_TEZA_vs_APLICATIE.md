# Radiografie pragmatică: aplicație ECD vs. disertație

> Comparație între cerințele formulate explicit în „Îmbunătățirea calității procesului de evaluare a activității cadrelor didactice de către studenți" (Capitolele 3–5 + Anexele A1–A2) și starea actuală a aplicației deployate la `https://evaluare-cadre-didactice-production.up.railway.app`.

---

## A. Ce întreabă teza, în esență

**Problema centrală:** *De ce nu evaluează studenții cadrele didactice?*

Răspunsul pragmatic, derivat prin diagramă Ishikawa + analiză Pareto (Cap. 3.4.3–3.4.4), identifică **patru cauze care explică 82% din participarea scăzută**:

| # | Cauză | Pondere Pareto | Lever de intervenție propus în teză |
|---|---|---:|---|
| C1 | UX platformă slabă (interfață învechită, lentă, ne-mobile) | **32%** | Aplicație modernă SPA + mobile-first |
| C2 | Lipsă closing-the-loop (nu văd ce schimbă feedback-ul lor) | **24%** | Buclă închisă „Ați evaluat X / Noi am făcut Y" |
| C3 | Nu percep utilitatea | **16%** | Comunicare prealabilă + transparență |
| C4 | Chestionar prea lung | **10%** | 19 itemi în 3-5 minute |
| C5-8 | Reminder absent, timing, consecințe, alte | 18% | Remindere 50%/80%, plasare săpt. 10-14, HR consequence |

**Notă cheie:** Teza nu spune că tehnologia singură rezolvă problema. **Closing-the-loop e mecanismul psihologic care rupe spirala „evaluez → nimic nu se schimbă → nu mai evaluez".** Restul fluxului există să facă bucla rapidă (14 zile rapoarte, 35 zile closing-loop, sub cele 90 zile cerute de HG 962/2024).

---

## B. Ce respectă deja aplicația ✅

Pe baza verificării directe în DB + cod live:

| Cerință teză | Status implementare | Notă |
|---|---|---|
| **CF-01** Auth + RBAC 3 roluri | ✅ Complet | JWT, student/profesor/admin, 1201 useri seeded |
| **CF-02** Configurare evaluări (curs, perioadă) | ✅ | AdminControls + AdminUsers + ProfReports |
| **CF-07** Monitorizare rate participare live | ✅ | Dashboard Acasă cu KPI „X din Y · Z%" |
| **CF-09** Rapoarte individuale (radar) | ✅ | ProfReports + DualRadar (scor propriu vs media facultății) |
| **CF-10** Rapoarte agregate departament | ✅ | AdminReports cu drill-down + filtru multi-select dimensional |
| **CF-12** Closing-the-loop editor | ✅ parțial | Tabel `closing_loop_entries`, AdminClosingLoop CRUD, student vede în Acasă |
| **CF-13** Export CSV/PDF | ✅ parțial | CSV pe profesor + ARACIS aggregate; PDF lipsește |
| **CF-15** Mobile responsive | ✅ Just-fixed | Bug sidebar fixed în prod azi (commit cc6a28c) |
| **CF-11** Alerte scor < 2.5 | ✅ | Pragurile 4.5/3.5/2.5 sunt în adminController; semafor pe Acasă |
| Anonimitate la nivel UI | ✅ | Profesorul nu vede nume studenți cu has_evaluated; doar agregate |
| Chestionar pe categorii | ✅ partial | 13 itemi activi în 8 categorii (vs. 19 itemi în 5 dimensiuni cerute) |
| OWASP / GDPR de bază | ✅ | Helmet, bcrypt, JWT, rate-limit, HTTPS Railway, prepared statements |

**Concluzia parțială:** Aplicația **respectă > 75% din cerințele funcționale** și acoperă infrastructura tehnică propusă (React + Node + SQLite, OWASP baseline, deployment Railway).

---

## C. Unde aplicația NU respectă teza ❌

Diferențe verificate concret în DB-ul de producție + codul backend:

### C.1. 🚨 ANONIMITATE TEHNICĂ — **Risc GDPR + risc pentru integritatea cercetării**

**Ce spune teza (Cap. 4.3.2 + Anexa A3):**
> Tabela `responses` **NU conține** `user_id`. Tabela `completion_tokens` (separată) cu `UNIQUE(user_id, evaluation_id)` previne duplicate fără a permite corelarea răspunsurilor cu identitatea.
> „Anonimitate garantată tehnic, nu doar procedural. **NICI un join SQL nu poate corela** `responses.id` cu `user_id` specific."

**Ce e în aplicație azi (verificat în DB live):**
```sql
SELECT r.id, r.evaluation_id, e.student_id, u.email
FROM responses r
JOIN evaluations e ON e.id = r.evaluation_id
JOIN users u ON u.id = e.student_id
LIMIT 1;
-- {"resp_id":745106, "evaluation_id":68025, "student_id":67, "email":"student16@univ.ro"}
```
Un JOIN simplu de **3 tabele** (responses → evaluations → users) **dezvăluie autorul fiecărui răspuns Likert**. Coloana `responses.user_id` lipsește (cum cere teza), dar `evaluations.student_id` PĂSTREAZĂ legătura prin reflectare indirectă.

**Impact:**
- Cererea-cheie de design din teză e neîndeplinită
- Posibil hibă în susținere: comisia poate cere demonstrarea anonimității și aplicația o încalcă
- Risc real GDPR în producție (orice admin / breach DB poate aflate cine ce a răspuns)

**Severitate:** P0 BLOCANT pentru susținere.

---

### C.2. 🚨 CHESTIONAR — 13 itemi în 8 categorii, NU 19 itemi în 5 dimensiuni

**Ce spune teza (Cap. 3.6 + Anexa A1):**

| Cod | Dimensiune | Nr. itemi | Cronbach α target |
|---|---|---:|---|
| D1 | Predare și conținut | 4 | ≥ 0.75 |
| D2 | Comunicare și interacțiune | 4 | ≥ 0.75 |
| D3 | Resurse și suport | 4 | ≥ 0.70 |
| D4 | Evaluare și feedback | 4 | ≥ 0.75 |
| D5 | Disponibilitate și profesionalism | 3 | ≥ 0.70 |
| + | Item global (separat) | 1 | — |
| + | Comentariu liber | 1 | — |
| **TOTAL** | | **19 + 2** | |

Plus 3 itemi de contextualizare (dificultate percepută, notă anticipată, ore studiu) care **nu intră în scor**.

**Ce e în aplicație:**
- 13 itemi activi
- Categoriile sunt: didactica (2), comunicare (2), organizare (2), angajament (2), general (2), altele (1), imbunatatiri (1), puncte_forte (1)
- **Nu există** dimensiunile D1-D5 mapate explicit
- **Lipsesc 6 itemi** raportat la chestionarul propus
- **Lipsesc** itemii de contextualizare (calibrare bias)

**Impact:**
- Chestionarul real nu corespunde cu cel din Anexa A1 a tezei
- Calculul Cronbach α (propus în Cap. 3.6.1 ca validare psihometrică) e imposibil pe această structură
- Rapoartele radar (5 axe) afișează totuși 5 categorii — DAR sunt categoriile DB, nu cele din teză

**Severitate:** P0 BLOCANT — incongruență vizibilă teză ↔ implementare.

---

### C.3. ❌ REMINDERS AUTOMATE — Tabel există, dar logică zero

**Ce spune teza (CF-06 + Cap. 3.3):**
> Reminder automat la 50% și 80% din perioada de evaluare, către studenții care **nu au completat**. „Recuperare studenți cu uitare contextuală" — factor identificat explicit în creșterea de la 28% la 57% participare (Cap. 5.3.1).

**Ce e în aplicație:**
- Tabelul `reminders_log` există (coloane: sent_to, message, sent_by, sent_at)
- **0 rânduri** — niciodată folosit
- Nu există cron job / scheduler / endpoint care să trimită automat
- Nu există SMTP configurat (forgot-password loghează tokenul în consolă)

**Impact:** **Una din cele 4 cauze Pareto rămâne neabordată.** Studenții uită; fără reminder rata cade.

**Severitate:** P1 — vizibil în pilotul real.

---

### C.4. ❌ ACTIVAREA AUTOMATĂ A EVALUĂRILOR

**Ce spune teza (CF-04 + POS A2.1):**
> „Activarea automată a evaluărilor la data programată" — cron job care, în săptămâna 10 a semestrului, activează toate evaluările conform configurării PLAN.

**Ce e în aplicație:**
- Admin trebuie să activeze manual fiecare evaluare
- Nu există job background pentru activare/dezactivare automată
- Datele `evaluations.deadline` și `evaluations.started_at` există, dar nu sunt monitorizate

**Severitate:** P2 — workaround manual posibil, dar contrar designului.

---

### C.5. ❌ KPI 15-indicatori — Parțial implementați

**Ce spune teza (Tabel 3.2):** **15 KPIs** structurați pe 3 categorii (P=process, O=output, I=impact):

| Categorie | KPI | Target | Owner |
|---|---|---|---|
| P1 | Rată participare | ≥ 55% | CEAC |
| P2 | Timp mediu completare | 3-5 min | IT |
| P3 | Rată cursuri activate | 100% | CEAC |
| P4 | Rată cursuri valid (≥5 răsp.) | ≥ 90% | CEAC |
| P5 | Uptime sistem | ≥ 99.5% | IT |
| O1-O5 | Scoruri pe dimensiuni + alerte | various | CEAC |
| I1-I5 | Δ-uri semestriale + closing-loop time | various | Decanat/CEAC |

**Ce e în aplicație:**
- KPI vizibili: total studenți, total profesori, rata participare, evaluări transmise, scor mediu — **~7-8 KPI** afișați pe Acasă
- **Lipsesc:** P2 (timp completare per chestionar), P4 (% cursuri „valide" cu ≥5 răspunsuri), P5 (uptime), I3 (timp raportare), I4 (timp closing-loop)
- **Lipsesc indicatorii de tendință (I1-I2): Δ rată participare semestru-pe-semestru, Δ scor mediu**

**Severitate:** P1 — pentru susținere e nevoie ca KPI-urile-cheie să fie vizibile.

---

### C.6. ⚠️ Closing-the-loop — Mecanism există, format slab

**Ce spune teza (Cap. 1.4.4 + 3.5):**
- Format „You Said, We Did" / „Ați evaluat X — Noi am făcut Y"
- Newsletter semestrial + dashboard public
- Timp closing-loop: **≤ 35 zile** după închiderea colectării

**Ce e în aplicație:**
- 3 intrări în `closing_loop_entries` (seed minimal)
- AdminClosingLoop are CRUD funcțional
- Student vede mesajele pe Acasă în secțiunea „Acțiuni implementate"
- **Lipsește:** formatul structurat „evaluat → acționat" (acum e text liber)
- **Lipsește:** notificare proactivă către student (email/in-app banner) când admin publică o nouă acțiune
- **Lipsește:** legarea explicită a acțiunii de o evaluare anterioară („Pentru evaluarea X din Sem 1 2024-2025, am implementat Y")

**Severitate:** P1 — cea mai importantă inovație a tezei e diluată.

---

### C.7. ⚠️ Comunicare prealabilă

**Ce spune teza (POS A1.4):**
> Email tuturor studenților + cadrelor didactice + anunț pe site, înainte de începerea perioadei de colectare.

**Ce e în aplicație:**
- Există modulul Notificări (in-app), dar nu există flow PRE-evaluare
- „Călătoria evaluării" (recent îmbunătățită) e o explicație generică, NU comunicare proactivă către cei eligibili

**Severitate:** P2.

---

### C.8. ⚠️ Audit log

**Ce spune teza (CF-14):**
> Audit log pentru toate acțiunile administrative (cine, ce, când — login, edit user, delete achievement, publish closing-loop etc.).

**Ce e în aplicație:** Tabelul nu există. Doar `morgan` HTTP log (pentru request) în file.

**Severitate:** P2 GDPR — în producție Real e cerință legală.

---

### C.9. ⚠️ Export PDF

**Ce spune teza (CF-13):** CSV + **PDF** formatat + Excel.

**Ce e:** CSV (ARACIS), CSV (per prof). **PDF lipsește.**

**Severitate:** P3.

---

### C.10. ⚠️ Validare psihometrică (Cronbach α)

**Ce spune teza (Cap. 3.6.1 + Limite cercetare):**
> Țintă Cronbach α ≥ 0.70 per dimensiune, ≥ 0.85 global. Limita recunoscută: nu s-a făcut analiză factorială pe date reale.

**Ce e:** Aplicația poate calcula Cronbach α, dar **nu există** funcția implementată.

**Severitate:** P2 — pentru cercetare ulterioară.

---

## D. Răspunsul la „De ce nu evaluează studenții?" — auto-evaluarea aplicației

| Cauză Pareto | Pondere | Aplicația rezolvă? | Note |
|---|---:|---|---|
| C1 — UX slabă | 32% | ✅ **DA** | Mobile-first fixat azi, design modern, fluxuri sub 4 min |
| C2 — Lipsă closing-loop | 24% | ⚠️ **PARȚIAL** | Mecanism există, dar fără format „evaluat-acționat" + fără notificare proactivă |
| C3 — Nu percep utilitatea | 16% | ⚠️ **PARȚIAL** | Pipeline narativ pe Acasă, dar lipsește comunicarea pre-evaluare |
| C4 — Chestionar lung | 10% | ✅ **DA** | 13 itemi (de fapt MAI puțin decât 19 propuși) |
| C5 — Reminder absent | 6% | ❌ **NU** | Schema există, codul nu |
| C6 — Timing inadecvat | 4% | ⚠️ **PARȚIAL** | Configurabil manual; auto-activare lipsește |
| C7 — Consecințe HR | 3% | ⚠️ **PARȚIAL** | Acțiuni CEAC există; ponderea 15-20% în evaluarea anuală nu e implementată |

**Aplicația rezolvă concret ~60-70% din cauze.** Pentru a închide bucla cu adevărat (target teză: 28% → 57% participare), trebuie rezolvate **C2 (cu format real)** + **C5 (reminders)** + **C7 (consecințe vizibile)**.

---

## E. Propuneri (în ordinea impactului asupra tezei)

### PROPUNEREA 1 — Refactor anonimitate tehnică (P0, ~3h) ⚠️ BLOCANT

Migrare schemă pentru a respecta CAP. 4.3.2 al tezei:
1. Adaug tabel `completion_tokens(user_id, evaluation_id, completed_at)` cu `UNIQUE(user_id, evaluation_id)`
2. Migrăm `evaluations` să NU mai conțină `student_id` (eliminăm legătura)
3. `evaluation_id` devine TOKEN aleator generat la activare (uuid) — nu mai e identificator de pereche student-curs corelabil
4. La submit, sistemul INSERT-uiește atomic în:
   - `responses(evaluation_id, q_id, likert, ...)` — anonim
   - `completion_tokens(user_id, evaluation_id, ...)` — pentru deduplicare
5. Niciun JOIN SQL nu mai poate recompune perechi
6. Backfill: pentru DB existentă, generez tokeni noi + șterg `evaluations.student_id` în migrarea 017

**Beneficiu:** Aplicația respectă cea mai importantă cerință de design GDPR a tezei. **Critic pentru susținerea publică.**

### PROPUNEREA 2 — Aliniere chestionar 19 itemi pe 5 dimensiuni (P0, ~1h)

1. Migration 018: șterg vechile 13 întrebări, populez exact cei 19 itemi din Anexa A1
2. Coloana `dimension` (D1-D5) în loc de „category" cu valori arbitrare
3. Adaug itemii de contextualizare (C1-C3) cu flag `is_contextual=1` să nu intre în scor
4. Frontend: radar chart cu cele 5 dimensiuni reale (D1 Predare, D2 Comunicare, D3 Resurse, D4 Feedback, D5 Disponibilitate)
5. Backend: calcul automat Cronbach α per dimensiune (poate fi calculat la admin click)

**Beneficiu:** Aplicația devine EXACT ce e descris în teza. Comisia poate „verifica live" Anexa A1 pe aplicație.

### PROPUNEREA 3 — Reminders automate + cron scheduler (P1, ~4h)

1. Cron job (node-cron sau setInterval simplu — fără dep noi) care:
   - Zilnic la 09:00, scanează evaluările active
   - Calculează % timp scurs din `deadline - started_at`
   - La 50% și 80%: găsește studenții care nu au răspuns
   - Inserează în `reminders_log` + (în prod) trimite email SMTP / in-app notification
2. Frontend admin: badge cu „125 remindere trimise azi" + listing
3. Pentru pilot: notificare in-app suficientă; SMTP rămâne opțional

**Beneficiu:** Rezolvă C5 — cauză cu impact direct asupra ratei de participare (factor explicit în Cap. 5.3.1).

### PROPUNEREA 4 — Closing-the-loop format „evaluat → acționat" (P1, ~2h)

1. Schema `closing_loop_entries`: adaug coloanele `triggered_by_evaluation_id`, `dimension_addressed` (D1-D5), `student_quote` (textul anonim care a inspirat acțiunea)
2. Format UI nou pe Acasă student:
   ```
   📣 În Sem 1 2024-2025 ai spus:
      „Materialele de curs nu sunt actualizate"
   ✅ Noi am făcut:
      → Sept 2025: 12 cursuri revizuite, materiale online la zi
      → Impact: scor D3 Resurse crescut de la 3.2 la 3.8
   ```
3. Newsletter semestrial automat (PDF / link în Acasă) cu sintezele

**Beneficiu:** Implementare REALĂ a inovației centrale a tezei. Vizibil în prima sesiune.

### PROPUNEREA 5 — Dashboard KPI complet 15-indicatori (P1, ~3h)

1. Adaug calculul pentru: P2 (timp mediu completare per chestionar — necesită timestamps), P4 (% cursuri ≥5 răsp.), I1-I2 (Δ semestriale), I3-I4 (timp raportare + timp closing-loop)
2. Pe AdminControls: secțiune nouă „KPI-uri instituționale" cu toate cele 15 + culorile semafor pe praguri
3. P5 (uptime) — poate fi citit din Railway API sau setat dummy 99.9%
4. Export PDF al dashboard-ului pentru raport CEAC semestrial

**Beneficiu:** Aplicația livrează exact ce e în Tabel 3.2 al tezei.

### PROPUNEREA 6 — Audit log + Comunicare prealabilă (P2, ~2h)

1. Tabel `audit_log(user_id, action, target_id, target_type, ip, timestamp)`
2. Middleware care înregistrează acțiuni admin (create user, delete, publish closing-loop, etc.)
3. UI pentru CEAC: listing audit cu filtrare
4. Comunicare prealabilă: când admin activează o evaluare, send notificare in-app la toți studenții eligibili + email opțional

### PROPUNEREA 7 — Cronbach α + export PDF (P3, ~2h)

1. Endpoint `/api/admin/psychometry`: calculează Cronbach α per dimensiune pe baza răspunsurilor
2. UI: card cu fiecare dimensiune și α-ul real (verde dacă ≥ țintă)
3. Export PDF rapoarte folosind pdfkit (node), template per cadru didactic

---

## F. Recomandare strategică pentru susținere

Două scenarii:

### Scenariul A — „Susținere în ~10 zile" (minimă fezabilă)
Implementez **doar P1 + P2** (anonimitate + 19 itemi exacți). Timp: ~4h.
- Aplicația trece testul de coerență cu Anexa A1 + Cap. 4.3.2
- Restul gap-urilor le menționez în „Limite cercetare" — onest, defensibil

### Scenariul B — „Aplicație matură" (3-4 zile efortive)
Implementez P1 → P5 (anonimitate + chestionar + reminders + closing-loop format + 15 KPIs).
- Aplicația trece la nivelul de coerență 90% cu teza
- Permite execuția unui pilot REAL la FAIMA — Cap. 5 nu mai e „simulat", ci în curs

### Recomand Scenariul A pentru susținere imediată, B după

Motiv: Scenariul A rezolvă **riscurile blocante de susținere** (anonimitate + chestionar) într-un timp scurt. Scenariul B aduce aplicația la nivelul cerut pentru un pilot real, dar nu e necesar pentru evaluarea științifică a tezei.

---

## G. Răspunsul tău la întrebarea originală

**„Funcționează aplicația în conformitate cu ceea ce și-a propus teza?"**

**Răspuns scurt:** Da, în proporție de **~70%**. Funcționalitățile principale există și deploy-ul Railway dovedește că arhitectura propusă funcționează în producție. **Există însă 2 incongruențe critice (anonimitate tehnică + structură chestionar) care, dacă nu sunt fixate înainte de susținere, lasă o vulnerabilitate la întrebări tehnice de la comisie.**

**„Aduce cu adevărat îmbunătățire procesului?"**

**Răspuns scurt:** **Da, parțial.** Aplicația rezolvă cele mai mari 2 cauze Pareto (UX + lungime chestionar = 42%) și schițează soluția pentru a 3-a (closing-loop = 24%). Dar **fără reminders + format „evaluat-acționat", efectul net asupra participării e mai mic decât prezice teza (predicție: +29 pp, realist actual: +15-20 pp)**.

**„Closing-the-loop e mecanismul-cheie?"**

**Da.** Teza îl identifică explicit ca lever-ul psihologic care rupe spirala descendentă (Cap. 1.4.4). Aplicația l-a implementat tehnic, dar **nu cu formatul „You Said, We Did" și fără notificare proactivă** — adică partea CARE FACE STUDENTUL SĂ OBSERVE că evaluarea lui a contat. Propunerea 4 fixează asta.

---

**TL;DR:** Aplicația e o demonstrație fezabilă, dar are 2 gap-uri P0 (anonimitate + chestionar) care trebuie închise în câteva ore. După aceea, e mai mult decât suficientă pentru susținerea tezei. Pentru un pilot real productiv, mai sunt 3-5 zile de muncă.
