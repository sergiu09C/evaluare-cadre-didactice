# Prompt pentru Claude Design — Animație Lifecycle ECD

Folosește acest prompt în Claude Design pentru a genera componenta animată ce va înlocui pagina statică `/lifecycle` din ECD.

---

## Prompt (paste-ready)

> Realizează o componentă React + TypeScript single-file ce arată **călătoria unei evaluări academice** într-o platformă universitară (ECD — Evaluarea Cadrelor Didactice, FAIMA-UNSTPB), cu studentul ca **principal factor de schimbare**. Componenta va fi încorporată într-o platformă existentă cu paletă navy (#0E2233) + violet accent (#7C3AED) + Geist font. Folosește variabilele CSS deja prezente: `var(--ecd-primary-800)`, `var(--ecd-accent-600)`, `var(--ecd-accent-400)`, `var(--ecd-success)`, `var(--ecd-warning)`, `var(--ecd-text)`, `var(--ecd-text-soft)`, `var(--ecd-border)`, `var(--ecd-surface)`, `var(--ecd-bg)`. Suportă dark mode prin atributul `data-theme="dark"` pe root (nu folosi clase Tailwind `dark:`).
>
> **Conceptul narativ — 6 etape**, fiecare un „capitol" care se dezvăluie progresiv pe măsură ce userul derulează (scroll-driven) sau apasă pe „Next":
>
> 1. **Invitația** — un email/notificare se materializează spre un avatar de student. Microcopy: „Tu primești invitația. Aici începe schimbarea."
> 2. **Reflecția** — studentul (silueta) deschide formularul; întrebări apar ca tile-uri care se aprind progresiv. Steluțe sau bare se umplu pe rând. Microcopy: „Răspunsurile tale construiesc imaginea."
> 3. **Trimiterea anonimă** — momentul-cheie: formularul devine un pachet care zboară spre un nor agregat, apoi datele sunt strivite/anonimizate (efect blur, simbolizând k-anonymity). Avatarul studentului dispare. Microcopy: „Identitatea ta rămâne aici. Vocea ta merge mai departe."
> 4. **Vizibilitatea profesorului** — pachetul aterizează la profesor: scoruri, comentarii anonime apar pe un card. Profesorul (silueta) le citește. Microcopy: „Profesorul vede ce ai spus, nu cine ești."
> 5. **Acțiunea CEAC** — comisia CEAC propune o acțiune (apare ca un bec sau o săgeată); profesorul o acceptă (handshake). Bara „acțiune în curs" se umple. Microcopy: „Decizii reale se formează din feedbackul tău."
> 6. **Schimbarea în curs** — un slide despre curs, syllabus, sau comportament se modifică vizibil (de ex. tile-urile se rearanjează). Apare un check-mark mare. Microcopy: „Cursul tău se schimbă. Următorul student beneficiază de vocea ta."
>
> **Cerințe tehnice obligatorii:**
> - Una sau două coloane responsive: pe desktop, narațiunea este vizuală în dreapta (canvas SVG ~720px) și textul cu indicator de progres în stânga; pe mobil totul este stivuit.
> - Folosește **doar SVG + CSS animations + Framer Motion** (poți presupune că `framer-motion` e disponibil). NU folosi librării de tip Lottie sau video.
> - **Reduced motion**: respectă `@media (prefers-reduced-motion: reduce)` — animațiile devin transitions fade rapid de 0.15s, fără mișcare spațială.
> - **A11y**: fiecare etapă are `role="region"` cu `aria-label` descriptiv; există butoane „Etapa anterioară" și „Etapa următoare" accesibile via tastatură; live region `aria-live="polite"` anunță schimbarea de etapă.
> - **Persistare**: când userul revine la pagină, ultima etapă vizitată este restaurată din `localStorage`.
> - **Personalizare**: componenta primește prop `userRole: "student" | "professor" | "admin"` și prop `personalImpact: { evaluations?: number; actions?: number; messages_answered?: number }`. Pe etapa finală, dacă userRole='student', afișează: „**Tu ai contribuit la {evaluations} evaluări** care au generat {actions} acțiuni concrete." Adaptează textul pentru profesor și admin.
> - **Tone**: empatic, încurajator, fără jargon administrativ. Limba română, dar fără diacritice doar în meniuri (textul narativ FOLOSEȘTE diacritice corecte: ă, â, î, ș, ț).
> - **Detaliu vizual important**: anonimizarea (etapa 3) trebuie să fie spectaculoasă — folosește un efect de „shred" / „pixelate" / sau cristal care se sparge și se recompune fără semnătură personală. Acesta e momentul-cheie al narațiunii.
>
> **Output dorit:** un singur fișier `EvaluationLifecycleAnimated.tsx` care exportă default componenta. Comentariile în cod sunt în engleză (paritate cu codul existent), dar copy-ul UI este în română.
>
> **Date contextuale pentru microcopy** (folosește când e relevant):
> - Granularitate: o evaluare = (student, disciplină, profesor) — adică un student evaluează același profesor separat la fiecare materie predată.
> - 19 întrebări per evaluare (15 Likert + 4 text liber).
> - K-anonymity threshold: drill-down per evaluare devine vizibil profesorului doar dacă există minim 5 evaluări complete per disciplină.
> - CEAC = Comisia pentru Evaluarea și Asigurarea Calității — organul care propune acțiuni profesorilor pe baza scorurilor agregate.
> - Closing the loop = ciclul complet: feedback → analiză → acțiune → schimbare → feedback nou.
>
> Returnează componenta completă, gata de copy-paste în `frontend/src/pages/EvaluationLifecycleAnimated.tsx`. Asigură-te că arată **fascinant la prima vedere**, dar rămâne ușor de înțeles. Studentul trebuie să se simtă important, nu un simplu „respondent".

---

## Note de integrare

După ce primești componenta din Claude Design:
1. Salveaz-o în `frontend/src/pages/EvaluationLifecycleAnimated.tsx`.
2. În `App.tsx`, swap-uiește `EvaluationLifecycle` cu `EvaluationLifecycleAnimated` pe ruta `/lifecycle` (sau adaugă o rută nouă `/lifecycle/animated` pentru side-by-side).
3. Pasează `userRole` din `useAuth()` și `personalImpact` din response-ul `api.getLifecycleSummary().personal`.

Pagina statică curentă (`EvaluationLifecycle.tsx`) rămâne disponibilă ca fallback și pentru utilizatori cu `prefers-reduced-motion`.
