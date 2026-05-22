# ✅ Checklist Testare Accesibilitate

## 🎯 Obiectiv
Verificarea conformității WCAG 2.1 Level AAA pentru platforma de evaluare cadre didactice.

---

## 1. ⌨️ Testare Keyboard Navigation

### Setup
- [ ] Disconnect mouse sau nu-l folosi
- [ ] Testează în Chrome, Firefox, și Safari

### Pagină Login
- [ ] Tab la câmpul Email
- [ ] Tab la câmpul Parolă
- [ ] Tab la butonul "Autentificare"
- [ ] Enter submitează formularul
- [ ] Mesajele de eroare sunt vizibile și focusabile

### Navigation Globală
- [ ] Tab afișează Skip Link ("Sari la conținut principal")
- [ ] Enter pe Skip Link duce la #main-content
- [ ] Alt + H merge la home page
- [ ] Alt + C focalizează main content
- [ ] ? deschide modal cu keyboard shortcuts
- [ ] Escape închide modalul de shortcuts

### Student Dashboard
- [ ] Tab navighează prin lista de profesori
- [ ] Enter pe profesor deschide formularul de evaluare
- [ ] Progress bar este accesibil cu Tab
- [ ] Mesajele colapsabile (↓) se activează cu Space/Enter

### Formular Evaluare - Likert Scale
- [ ] Tab ajunge la primul radiogroup
- [ ] ← / → navighează între opțiunile 1-5
- [ ] Tastele 1, 2, 3, 4, 5 selectează direct scorul
- [ ] Home sare la prima opțiune (1)
- [ ] End sare la ultima opțiune (5)
- [ ] Space / Enter confirmă selecția
- [ ] Focus indicator vizibil pe fiecare buton (border albastru 3px)

### Formular Evaluare - Text Questions
- [ ] Tab ajunge la textarea
- [ ] Typing funcționează normal
- [ ] Tab sare la următoarea întrebare

### Admin Dashboard
- [ ] Tab navighează prin filtre (Faculty, Level, Year)
- [ ] Tabelul este accesibil cu Tab (celule focusabile)
- [ ] Enter pe row duce la detalii profesor

### Admin Controls - Tab Navigation
- [ ] Tab ajunge la primul tab button
- [ ] ← / → navighează între tabs
- [ ] Home sare la primul tab
- [ ] End sare la ultimul tab
- [ ] Conținutul tab-ului se schimbă corect

### Admin Controls - Toggle Switches
- [ ] Tab ajunge la toggle "Status Platformă"
- [ ] Space / Enter activează/dezactivează
- [ ] Statusul vizual se schimbă
- [ ] Statusul este anunțat (vezi Screen Reader section)

### Admin Controls - Modals
- [ ] Deschide modal "Adaugă Întrebare"
- [ ] Tab loopează în interiorul modalului (focus trap)
- [ ] Shift + Tab merge înapoi în modal
- [ ] Tab NU iese din modal
- [ ] Escape închide modalul
- [ ] Focus revine la butonul care a deschis modalul

### Admin Reports
- [ ] Tab navighează între tab-uri (Panorama, Facultăți, etc.)
- [ ] ← / → schimbă tab-urile
- [ ] Filtrele sunt accesibile cu Tab

---

## 2. 🔊 Testare Screen Reader

### Setup
#### Windows
- [ ] Instalează NVDA (gratuit) de la nvaccess.org
- [ ] SAU activează Narrator (Win + Ctrl + Enter)

#### macOS
- [ ] Activează VoiceOver (Cmd + F5)
- [ ] SAU System Preferences > Accessibility > VoiceOver

### Comenzi de Bază
| Screen Reader | Citește tot | Citește element curent | Stop |
|---------------|-------------|------------------------|------|
| NVDA | Insert + ↓ | Insert + ↑ | Ctrl |
| VoiceOver | VO + A | VO + F3 | Ctrl |
| Narrator | Caps + M | Caps + I | Ctrl |

### Pagină Login
- [ ] Heading "Evaluare Cadre Didactice" este citit
- [ ] Label "Email" este asociat cu input
- [ ] Label "Parolă" este asociat cu input
- [ ] Butonul "Autentificare" este citit corect
- [ ] Loading state: "Se autentifică, vă rugăm așteptați"
- [ ] Eroare: Mesajul este anunțat automat (aria-live)

### Student Dashboard
- [ ] Heading "Dashboard Student" este citit
- [ ] Progress bar anunță: "Progres, X din Y profesori, Z procente"
- [ ] Status badges: "Status evaluare: Completată" / "Pending"
- [ ] Lista profesori: "Listă cu X profesori"
- [ ] Fiecare profesor: Nume, Departament, Status

### Formular Evaluare - Likert Scale
- [ ] Heading întrebare este citit
- [ ] Radiogroup anunță: "Scală de evaluare de la 1 la 5..."
- [ ] Fiecare buton:
  ```
  "Radio button, 3 din 5, Nivel 3: Neutru pentru întrebarea: [text întrebare]"
  ```
- [ ] Selecție anunță: "Selectat, Nivel 4: Acord parțial"
- [ ] Câmpuri obligatorii: "obligatoriu" este citit după întrebare

### Formular Evaluare - Validare
- [ ] Eroare "Răspunsuri obligatorii lipsă" este anunțată automat
- [ ] Numărul răspunsurilor lipsă este citit
- [ ] Succes "Evaluare trimisă cu succes" este anunțat

### Admin Dashboard - Grafice
- [ ] Chart 1: "Grafic cu bare: Rata de completare pe X facultăți..."
- [ ] Date detaliate disponibile (tabel screen-reader-only)
- [ ] Chart 2: "Grafic cu linii: Trendul de completare..."
- [ ] Chart 3: "Grafic circular: Distribuția scorurilor..."

### Admin Controls - Toggle Switches
- [ ] Label: "Status Platformă"
- [ ] State: "Switch, activat" / "Switch, dezactivat"
- [ ] Descriere: "Platforma este ACTIVĂ..." este citită

### Admin Controls - Modals
- [ ] Modal se anunță: "Dialog, Confirmă trimiterea evaluării"
- [ ] Conținut modal este citit
- [ ] Butoane: "Trimite evaluarea", "Anulează"
- [ ] Închidere: Focus revine corect

### Professor Details - Stats Cards
- [ ] "Evaluări primite: X din Y atribuite"
- [ ] "Rată completare: Z procente"
- [ ] "Scor mediu general: N din 5"
- [ ] "Status: Satisfăcător" / "Necesită atenție"

---

## 3. 🎨 Testare Teme și Stiluri

### Accesare Meniu Accesibilitate
- [ ] Click pe butonul ⚙️ (Settings) din header
- [ ] Meniul se deschide cu 5 opțiuni

### Font Size
- [ ] Selectează "Small" → Textul se micșorează (87.5%)
- [ ] Selectează "Normal" → Textul revine la dimensiune standard
- [ ] Selectează "Large" → Textul se mărește (112.5%)
- [ ] Selectează "Extra Large" → Textul se mărește semnificativ (125%)
- [ ] Toate elementele (butoane, inputs, labels) scalează proportional
- [ ] Layout-ul nu se strică (no overflow)

### Temă Culori
- [ ] Selectează "Light":
  - [ ] Fundal: deschis (#f9fafb)
  - [ ] Text: întunecat (#111827)
- [ ] Selectează "Dark":
  - [ ] Fundal: întunecat (#111827)
  - [ ] Text: deschis (#f9fafb)
  - [ ] Butoane: contrast inversat
- [ ] Selectează "System":
  - [ ] Se sincronizează cu OS theme
  - [ ] Schimbă OS theme → Pagina se actualizează

### High Contrast Mode
- [ ] Activează toggle "High Contrast"
- [ ] Fundal devine alb pur (#ffffff)
- [ ] Text devine negru pur (#000000)
- [ ] Filter contrast(1.5) este aplicat
- [ ] Toate elementele sunt vizibile
- [ ] Dezactivează → Revin culorile normale

### Reduce Motion
- [ ] Activează toggle "Reduce Motion"
- [ ] Toate animațiile se opresc:
  - [ ] Spinners (loading) sunt statice
  - [ ] Transitions pe butoane sunt instant
  - [ ] No smooth scroll
- [ ] Dezactivează → Animațiile revin

### Dyslexia Font
- [ ] Activează toggle "Font pentru Dislexie"
- [ ] Fontul se schimbă în OpenDyslexic
- [ ] Toate textele folosesc noul font
- [ ] Lizibilitatea este îmbunătățită
- [ ] Dezactivează → Font standard

### Persistență Setări
- [ ] Schimbă 2-3 setări
- [ ] Refresh pagina (F5)
- [ ] Setările persistă (localStorage)
- [ ] Logout → Login
- [ ] Setările persistă (database sync)
- [ ] Login pe alt dispozitiv/browser
- [ ] Setările sunt sincronizate

---

## 4. 🌐 Testare Cross-Browser

### Chrome (Chromium)
- [ ] Keyboard navigation funcționează
- [ ] Focus indicators vizibili (3px border)
- [ ] Toate temele funcționează
- [ ] Dyslexia font se aplică
- [ ] NVDA/Narrator funcționează

### Firefox
- [ ] Keyboard navigation funcționează
- [ ] Focus indicators vizibili
- [ ] Toate temele funcționează
- [ ] Dyslexia font se aplică
- [ ] NVDA funcționează

### Safari (macOS)
- [ ] Keyboard navigation funcționează
  - [ ] Activează "Tab highlights each item" în Settings > Advanced
- [ ] Focus indicators vizibili
- [ ] Toate temele funcționează
- [ ] VoiceOver funcționează perfect
- [ ] Dark mode system sync funcționează

### Edge
- [ ] Keyboard navigation funcționează
- [ ] Focus indicators vizibili
- [ ] Toate temele funcționează
- [ ] Narrator funcționează

---

## 5. 📱 Testare Mobile (Bonus)

### iOS (Safari)
- [ ] VoiceOver funcționează
- [ ] Swipe left/right navighează
- [ ] Double-tap activează elemente
- [ ] Zoom în/out funcționează (pinch)
- [ ] Teme se aplică corect

### Android (Chrome)
- [ ] TalkBack funcționează
- [ ] Swipe navighează
- [ ] Double-tap activează
- [ ] Zoom funcționează
- [ ] Teme se aplică corect

---

## 6. 🔍 Automated Testing

### axe DevTools (Chrome Extension)
- [ ] Instalează axe DevTools
- [ ] Rulează scan pe Login page
  - [ ] 0 violations (target)
- [ ] Rulează scan pe Student Dashboard
  - [ ] 0 violations
- [ ] Rulează scan pe Evaluation Form
  - [ ] 0 violations
- [ ] Rulează scan pe Admin Dashboard
  - [ ] 0 violations

### WAVE Tool
- [ ] Vizitează wave.webaim.org
- [ ] Testează Login page
  - [ ] 0 errors
  - [ ] Alerts acceptabile (review)
- [ ] Testează Dashboard pages
  - [ ] 0 errors

### Lighthouse (Chrome DevTools)
- [ ] Deschide DevTools (F12)
- [ ] Lighthouse tab
- [ ] Run Accessibility audit
- [ ] Target: **Accessibility Score: 100**

---

## 7. ⚡ Performance Testing

### Lighthouse Performance
- [ ] Performance score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] No layout shifts (CLS < 0.1)

### Accessibility Features Performance
- [ ] Schimbare temă: instant (< 100ms)
- [ ] Schimbare font size: instant
- [ ] Skip link activare: instant
- [ ] Modal focus trap: no lag
- [ ] Keyboard navigation: responsive

---

## 8. 📋 Bug Reporting Template

Când găsești o problemă:

```markdown
**Pagină:** [URL sau nume pagină]
**Browser:** [Chrome 120 / Firefox 115 / Safari 17]
**Screen Reader:** [NVDA 2023 / VoiceOver / None]
**KeyboardOnly:** [Yes / No]

**Pași de reproducere:**
1. ...
2. ...
3. ...

**Comportament așteptat:**
[Ce ar trebui să se întâmple]

**Comportament actual:**
[Ce se întâmplă de fapt]

**Screenshot/Video:** [Optional]

**Severitate:**
- [ ] Critical (Blocker pentru utilizatori cu dizabilități)
- [ ] High (Afectează experiența majoră)
- [ ] Medium (Inconvenient)
- [ ] Low (Minor cosmetic)
```

---

## 9. ✅ Sign-off Final

### Toate testele completate:
- [ ] Keyboard Navigation (Section 1)
- [ ] Screen Reader (Section 2)
- [ ] Teme și Stiluri (Section 3)
- [ ] Cross-Browser (Section 4)
- [ ] Automated Testing (Section 6)
- [ ] Performance (Section 7)

### Conformitate WCAG:
- [ ] Level A - 100% compliance
- [ ] Level AA - 100% compliance
- [ ] Level AAA - 100% compliance

### Issues găsite: **[Number]**
### Issues critice: **[Number]**
### Issues rezolvate: **[Number]**

**Data testării:** __________
**Tester:** __________
**Semnătură:** __________

---

**Platformă:** Evaluarea Cadrelor Didactice - Evaluare Cadre Didactice
**Versiune:** 2.0.0 (Accessibility-first)
**Ultima actualizare checklist:** Februarie 2026
