# Raport Sprint S4 + S5 — polish + tech debt + security

> Continuare după `RAPORT_S1_S2_S3.md`. Tot ce mai era P3/opțional + tech debt + securitate.

---

## Sprint S4 — Polish final (3 sub-tasks)

| Sub-task | Status | Detaliu |
|---|---|---|
| S4.1 L2 Achievement icons explicit | ✅ | `inferIcon(a)` preferă acum `a.icon` (din `achievement_definitions.icon`) când e prezent. Heuristic-ul rămâne ca fallback pentru achievements legacy. AdminAchievements editor expune deja selector de icon (7 valori). |
| S4.2 Sanity check final | ✅ | Build vite OK · 21/21 unit tests · 17/17 spec-uri noi (console-clean + T2–T8) |
| S4.3 README update | ✅ | Adăugat secțiune „Status curent" cu migrations active, comenzi cheie, link-uri către rapoarte recente |

## Sprint S5 — Tech debt + Security (4 sub-tasks)

| Sub-task | Status | Detaliu |
|---|---|---|
| S5.1 Tech debt | ✅ | TypeScript: 2 erori reale fixate (Tone-uri invalide pentru Badge `'warm'/'mint'` → `'warning'/'success'`; `countAnswered` neutilizat în PlatformFeedback). Cleanup: director fantomă `/AntiGravity` șters (8K cache vite). `playwright-report.json` cu căi vechi șters. |
| S5.2 Rate limiting | ✅ | Middleware nou `rateLimit.js` zero-deps (in-memory per IP). Aplicat pe: login (10/min), forgot-password (5/h), reset-password (10/h). Verificat: a 6-a cerere consecutivă → 429 cu `Retry-After: 3600`. **Bonus fix descoperit:** suita Playwright făcea fals-pozitiv (>10 login-uri/min în paralel) → adăugat `relaxInNonProd: true` (default) care multiplică `max` cu 10 în dev. Limitele stricte se aplică doar cu `NODE_ENV=production`. Unit tests folosesc `relaxInNonProd: false` pentru a verifica logica strictă. |
| S5.3 Migration verify | ✅ | Script nou `verify-migrations.js` + comandă `npm run verify-db`. Verifică prezența a 13 tabele esențiale + sanity counts (1401 users, 200 profesori, 323 cursuri, 6515 evaluări). |
| S5.4 Final re-run | ✅ | Unit: **26/26 PASS** (21 + 5 rate limit) în 211ms; Vite build curat; **Playwright 151 PASS / 0 FAIL / 4 skipped în 7.7 min** (cu fix-ul `relaxInNonProd` integrat). |

---

## Livrabile concrete S4+S5

### Fișiere noi (4)
- `backend/src/middleware/rateLimit.js`
- `backend/src/db/verify-migrations.js`
- `backend/tests/rateLimit.test.js` (5 teste suplimentare)
- `RAPORT_S4_S5.md` (acest fișier)

### Modificări
- `backend/src/routes/auth.js` — 3 limiter-e per IP pe endpoint-uri sensibile
- `backend/package.json` — script `verify-db`
- `frontend/src/pages/Achievements.tsx` — fix inferIcon pentru a respecta a.icon
- `frontend/src/pages/AdminActionTemplates.tsx` — fix Tone Badge invalid
- `frontend/src/pages/PlatformFeedback.tsx` — remove dead code
- `README.md` — secțiune „Status curent"

### Șterse
- `/Users/anosr/Desktop/test1/AntiGravity/` (director fantomă, doar cache vite)
- `tests/playwright-report.json` (stale, căi vechi AntiGravity)

---

## Status absolut final (toate sprint-urile)

| Sprint | Items | Durată | Status |
|---|---|---|---|
| S1 | 6 | ~3h | ✅ |
| S2 | 5 | ~2h | ✅ |
| S3 | 4 | ~2h | ✅ |
| S4 | 3 | ~30min | ✅ |
| S5 | 4 | ~40min | ✅ |
| **TOTAL** | **22 items livrate** | **~8h** | ✅ |

vs PLAN_V2 estimare originală: 28h pentru S1+S2+S3 (executate în 7h) + ~3h pentru S4+S5 nice-to-have.

### Suite-uri în starea finală
- **Playwright**: 151 PASS / 0 FAIL / 4 skipped intenționat (confirmat în 7.7 min după fix rate limiter)
- **Unit tests (node:test)**: 26 PASS / 0 FAIL (21 existente + 5 noi pentru rate limit) în 211ms
- **Vite build**: clean, ~3s
- **tsc --noEmit**: 0 erori noi pe fișiere modificate
- **Migration verify**: 13/13 tabele OK, sanity counts în range

### Comenzi documentate
```bash
# Sanity rapidă (frontend + backend)
cd frontend && npx vite build      # 3s
cd backend && npm test              # 60ms
cd backend && npm run verify-db     # verifică schema
cd tests && npx playwright test e2e/console-clean.spec.ts  # 0 erori console pe 21 pagini × 3 roluri
```

---

## Definition of Done — verificare finală

| Criteriu | Status |
|---|---|
| `git grep "Tip curs"` → 0 user-facing | ✅ |
| Playwright ≥ 35 teste, 0 fail | ✅ (151 PASS) |
| Unit tests backend ≥ 3 fișiere | ✅ (21 tests) |
| Toate `window.confirm()` → `ConfirmDialog` | ✅ (3/3) |
| Map/filter safe-guarded pe input extern | ✅ |
| Migration 015+016 documentate + idempotent | ✅ (`verify-migrations.js`) |
| Auth endpoint-uri sensibile rate-limited | ✅ (3 limiter-e) |
| Director fantomă AntiGravity șters | ✅ |
| README cu status + comenzi curente | ✅ |

**0 items deschise. Toate sprint-urile (S1-S5) închise.**
