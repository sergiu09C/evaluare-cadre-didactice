# Ghid Accesibilitate - Platformă Evaluare Cadre Didactice

## 📖 Introducere

Această platformă a fost dezvoltată cu accent pe **accesibilitate universală**, respectând standardele **WCAG 2.1 Level AAA**. Toate funcționalitățile sunt disponibile studenților cu dizabilități, inclusiv:
- Utilizatori de screen readers (NVDA, JAWS, VoiceOver)
- Utilizatori care navighează doar cu tastatura
- Utilizatori cu deficiențe de vedere (culori, contrast)
- Utilizatori cu dislexie
- Utilizatori sensibili la mișcare/animații

---

## 🎨 Setări de Accesibilitate

### Accesarea Meniului

**Locație:** Butonul ⚙️ din colțul dreapta-sus al header-ului, lângă informațiile utilizatorului.

**Keyboard shortcut:** Tab până la butonul de setări, apoi Enter/Space

### Opțiuni Disponibile

#### 1. **Dimensiune Font**
- **Small (87.5%)** - Text mai mic
- **Normal (100%)** - Dimensiune standard
- **Large (112.5%)** - Text mărit
- **Extra Large (125%)** - Text foarte mare

**Cum schimbi:** Deschide meniul, selectează dimensiunea dorită din dropdown

#### 2. **Temă Culori**
- **Light** - Fundal deschis, text întunecat (implicit)
- **Dark** - Fundal întunecat, text deschis
- **System** - Se sincronizează cu setările sistemului de operare

**Cum schimbi:** Deschide meniul, selectează tema din dropdown

#### 3. **Contrast Ridicat** (Toggle)
- **Activat:** Culorile devin negru pur pe alb pur (filter: contrast(1.5))
- **Dezactivat:** Culori normale

**Beneficii:** Îmbunătățește vizibilitatea pentru utilizatori cu deficiențe de vedere

#### 4. **Reduce Motion** (Toggle)
- **Activat:** Oprește toate animațiile (transitions, spinners)
- **Dezactivat:** Animații normale

**Beneficii:** Reduce disconfortul pentru utilizatori sensibili la mișcare

#### 5. **Font pentru Dislexie** (Toggle)
- **Activat:** Folosește fontul **OpenDyslexic**, optimizat pentru citire
- **Dezactivat:** Font standard (system fonts)

**Beneficii:** Îmbunătățește lizibilitatea pentru persoane cu dislexie

### Persistența Setărilor

✅ Setările sunt salvate **automat** în:
1. **localStorage** - pentru acces instant la următoarea vizită
2. **Server (database)** - pentru sincronizare cross-device

Când te loghezi pe alt dispozitiv, setările tale sunt automat aplicate!

---

## ⌨️ Navigare cu Tastatura

### Taste de Bază

| Tastă | Funcție |
|-------|---------|
| **Tab** | Navighează la următorul element interactiv |
| **Shift + Tab** | Navighează la elementul anterior |
| **Enter / Space** | Activează butonul sau toggle-ul focalizat |
| **Escape** | Închide dialoguri, meniuri, modals |

### Comenzi Rapide Globale

| Shortcut | Funcție |
|----------|---------|
| **?** | Afișează lista completă de keyboard shortcuts |
| **Alt + H** | Înapoi la pagina principală (Home) |
| **Alt + C** | Focalizează conținutul principal (skip to content) |

### Navigare în Formular Evaluare

#### Likert Scale (Scale 1-5)
- **←/→** (Arrow Left/Right) - Navighează între opțiunile 1-5
- **1, 2, 3, 4, 5** (Number keys) - Selectează direct scorul respectiv
- **Home** - Sare la prima opțiune (1)
- **End** - Sare la ultima opțiune (5)
- **Space / Enter** - Confirmă selecția

**Exemplu:** Apasă tasta `3` pentru a selecta rapid "Neutru"

#### Textarea
- **Tab** - Mută focus la următoarea întrebare
- **Shift + Tab** - Înapoi la întrebarea anterioară

### Navigare în Panou Admin

#### Tab-uri (Setări Platformă, Mesaje, Filtre, etc.)
- **←/→** (Arrow Left/Right) - Navighează între tab-uri
- **Home** - Sare la primul tab
- **End** - Sare la ultimul tab

#### Toggle Switches
- **Space / Enter** - Activează/Dezactivează toggle-ul

#### Modals
- **Tab / Shift+Tab** - Navighează în interiorul modalului (focus trap activ)
- **Escape** - Închide modalul

### Skip Links

La prima apăsare a tastei **Tab** pe orice pagină, apare un link vizibil:
**"Sari la conținut principal"**

- Apasă **Enter** pentru a sări peste header și a merge direct la conținut
- Util pentru utilizatori de screen reader sau keyboard

---

## 🔊 Screen Reader Support

### Screen Readers Suportate
- **NVDA** (Windows) - Gratuit
- **JAWS** (Windows) - Comercial
- **VoiceOver** (macOS/iOS) - Built-in
- **TalkBack** (Android) - Built-in

### Ce Anunță Screen Readerul

#### Pe Formular Evaluare
- Numărul întrebării și totalul (ex: "Întrebarea 3 din 10")
- Textul întrebării complet
- Tipul controlului (ex: "Radio group pentru scală Likert")
- Selecția curentă (ex: "Nivel 4 din 5: Acord parțial")
- Câmpuri obligatorii (anunțate cu "obligatoriu")
- Mesaje de eroare (anunțate automat cu `aria-live="assertive"`)
- Confirmări (ex: "Răspunsuri salvate cu succes")

#### Pe Dashboard
- Progress bar-uri (ex: "Progres: 7 din 10 profesori, 70 procente")
- Statusuri evaluări (ex: "Status: Completată")
- Grafice (versiune text tabelată pentru fiecare chart)

#### În Panou Admin
- Statusul platformei (ex: "Platforma este ACTIVĂ și accesibilă studenților")
- State ale toggle switches (ex: "Switch activat")
- Numărarea elementelor în liste (ex: "Listă cu 25 profesori")

### Grafice Accesibile

Toate graficele (bar charts, line charts, pie charts) au:
1. **aria-label** descriptiv cu datele cheie
2. **Tabel screen-reader-only** cu datele complete în format tabular

**Exemplu pentru VoiceOver:**
- Vizual: Grafic cu bare
- Screen reader: "Grafic cu bare: Rata de completare pe 5 facultăți. Informatică: 85%, Medicină: 72%, ..."
- Apoi citește tabel HTML cu datele detaliate

---

## 🧪 Testare Manuală

### Checklist pentru Testare Keyboard

1. **Disconnect mouse-ul** sau nu-l folosi deloc
2. **Navighează cu Tab** prin toată aplicația
3. **Verifică focus indicator** - trebuie vizibil pe toate elementele (border albastru de 3px)
4. **Testează Likert scale:**
   - Tab pentru a ajunge la radiogroup
   - Săgeți ←/→ pentru navigare
   - Tastele 1-5 pentru selecție directă
5. **Testează tab-uri în Admin:**
   - Săgeți pentru navigare între tabs
   - Home/End pentru primul/ultimul tab
6. **Testează modals:**
   - Focus trap activ (Tab nu iese din modal)
   - Escape închide modalul
   - Focus revine la elementul care a deschis modalul
7. **Testează skip links:**
   - Prima apăsare Tab afișează "Sari la conținut principal"
   - Enter sare direct la main content

### Checklist pentru Testare Screen Reader

#### Activare Screen Reader
- **Windows:** NVDA (Download gratuit) sau Narrator (Win+Ctrl+Enter)
- **macOS:** VoiceOver (Cmd+F5)

#### Ce să verifici:
1. **Toate textele sunt citite** (labels, butoane, heading-uri)
2. **Loading states sunt anunțate** ("Se încarcă, vă rugăm așteptați")
3. **Erorile sunt anunțate automat** (aria-live="assertive")
4. **Likert buttons anunță complet:** "Radio button, 3 din 5, Nivel 3: Neutru pentru întrebarea: Profesorul explică clar"
5. **Progress bar-uri:** "Progres, 7 din 10, 70 procente"
6. **Grafice:** Citește aria-label, apoi oferă acces la tabel

### Checklist pentru Testare Teme

1. **Light mode:** Fundal deschis, text întunecat - OK
2. **Dark mode:** Fundal întunecat, text deschis - OK
3. **High contrast:** Negru pe alb, filter contrast - OK
4. **Font sizes:** Toate 4 dimensiunile funcționează - OK
5. **Dyslexia font:** Font OpenDyslexic se aplică - OK
6. **Reduce motion:** Animații oprite (spinner static) - OK

### Checklist Cross-Browser

| Browser | Keyboard | Screen Reader | Themes | Focus Indicators |
|---------|----------|---------------|--------|------------------|
| Chrome | ✅ | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ VoiceOver | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ | ✅ |

---

## 📊 Conformitate WCAG 2.1 AAA

### Criterii Respectate

#### Perceivable (Perceptibil)
- ✅ **1.1.1 Non-text Content (A)** - Alt text pe imagini, aria-label pe grafice
- ✅ **1.3.1 Info and Relationships (A)** - Semantic HTML + ARIA roles
- ✅ **1.4.3 Contrast (Minimum) (AA)** - 4.5:1 pentru text normal
- ✅ **1.4.6 Contrast (Enhanced) (AAA)** - 7:1 în high contrast mode
- ✅ **1.4.8 Visual Presentation (AAA)** - Font ajustabil, dyslexia font

#### Operable (Operabil)
- ✅ **2.1.1 Keyboard (A)** - Toate funcțiile cu tastatura
- ✅ **2.1.2 No Keyboard Trap (A)** - Fără capcane (modals au Escape)
- ✅ **2.1.3 Keyboard (No Exception) (AAA)** - 100% keyboard accessible
- ✅ **2.4.1 Bypass Blocks (A)** - Skip links
- ✅ **2.4.3 Focus Order (A)** - Ordine logică
- ✅ **2.4.7 Focus Visible (AA)** - Focus indicator 3px, 3:1 contrast

#### Understandable (Comprehensibil)
- ✅ **3.1.1 Language of Page (A)** - `<html lang="ro">`
- ✅ **3.2.1 On Focus (A)** - Fără acțiuni automate la focus
- ✅ **3.2.2 On Input (A)** - Fără submit automat
- ✅ **3.3.1 Error Identification (A)** - Erori cu role="alert"
- ✅ **3.3.2 Labels or Instructions (A)** - Toate inputs cu label

#### Robust (Robust)
- ✅ **4.1.2 Name, Role, Value (A)** - ARIA corect pe toate controalele
- ✅ **4.1.3 Status Messages (AA)** - aria-live pentru notificări

---

## 💡 Sfaturi pentru Utilizare

### Pentru Studenți

1. **Prima dată când intri:** Explorează meniul de accesibilitate (⚙️) și setează preferințele
2. **Navigare rapidă:** Folosește **Tab** pentru a sări între secțiuni
3. **Evaluări rapide:** Folosește tastele **1-5** pentru a selecta rapid scoruri Likert
4. **Ajutor:** Apasă **?** oricând pentru lista de comenzi rapide

### Pentru Administratori

1. **Tab navigation în Admin Controls:** Folosește săgețile pentru a naviga rapid între secțiuni
2. **Toggle switches:** Space/Enter pentru activare rapidă
3. **Exportare rapoarte:** Accesibilă cu tastatura (Tab + Enter)

### Pentru Dezvoltatori

Vezi [DEVELOPER_DOCS.md](./DEVELOPER_DOCS.md) pentru:
- Arhitectura sistemului de accesibilitate
- Custom hooks disponibile
- Best practices pentru ARIA
- Cum să extinzi funcționalitățile

---

## 🆘 Probleme Cunoscute & Soluții

### "Focus indicator nu este vizibil în Safari"
**Soluție:** Safari necesită uneori `:focus-visible` polyfill. Focus indicators funcționează, dar pot fi mai subtile.

### "VoiceOver citește de două ori unele elemente"
**Cauză:** Duplicate ARIA labels. Raportează issue-ul specific.

### "Animațiile nu se opresc cu Reduce Motion"
**Verifică:**
1. Toggle-ul "Reduce Motion" din meniul de accesibilitate este activat?
2. Refresh pagina după activare

### "Setările nu se sincronizează pe alt dispozitiv"
**Verifică:**
1. Ești logat cu același cont?
2. Conexiunea la internet este activă?
3. Try logout + login

---

## 📞 Contact & Feedback

Pentru raportare probleme de accesibilitate sau sugestii:
- **Email:** accessibility@univ.ro
- **GitHub Issues:** [Link to repo]

**Prioritate ridicată pentru:**
- Bug-uri care blochează screen reader users
- Probleme de keyboard navigation
- Contrast insuficient

---

## 📚 Resurse Externe

### Ghiduri Screen Readers
- [NVDA User Guide](https://www.nvaccess.org/documentation/)
- [VoiceOver Tutorial (Apple)](https://support.apple.com/guide/voiceover/welcome/mac)
- [JAWS Documentation](https://www.freedomscientific.com/training/jaws/)

### Standardele WCAG
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Articles](https://webaim.org/articles/)

### Testare Accesibilitate
- [axe DevTools (Chrome Extension)](https://www.deque.com/axe/devtools/)
- [WAVE Tool](https://wave.webaim.org/)

---

**Ultima actualizare:** Februarie 2026
**Versiune platformă:** 2.0.0 (Accessibility-first)
