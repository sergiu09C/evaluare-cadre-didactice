-- Migration 009: ghiduri editabile de admin
-- 3 entry-uri: student, professor, admin — fiecare cu titlu + body (markdown).

CREATE TABLE IF NOT EXISTS guides (
  role TEXT PRIMARY KEY CHECK(role IN ('student', 'professor', 'admin')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO guides (role, title, body) VALUES
  ('student',
   'Ghid pentru studenți',
   '## De ce contează evaluarea ta?

Răspunsurile tale sunt analizate de CEAC FAIMA și folosite pentru a îmbunătăți concret calitatea predării.

## Cum funcționează scala 1–5?

- **1** — Total dezacord
- **2** — Dezacord
- **3** — Neutru
- **4** — Acord
- **5** — Total acord

## Cum navighez prin chestionar?

- Click direct pe o opțiune sau folosește tastele 1–5
- Folosește săgețile ← → pentru a naviga între opțiuni
- Apasă "Continuă" pentru a trece la următoarea întrebare

## Ce se întâmplă dacă închid platforma la jumătate?

Răspunsurile sunt salvate automat la fiecare 30 de secunde.

## Pot fi identificat din răspunsuri?

Nu. Răspunsurile sunt anonimizate înainte de a fi văzute de profesor.

## Întrebări?

Scrie la ceac@faima.pub.ro.'),
  ('professor',
   'Ghid pentru profesori',
   '## Ce vezi pe Dashboard?

- **Total evaluări** primite pentru toate cursurile tale
- **Media generală** pe toate dimensiunile chestionarului
- **Studenți unici** care te-au evaluat (anonimizați)
- **Trend** față de semestrul anterior

## Cum interpretezi scorul?

- **4.5 – 5.0** — Excelent
- **4.0 – 4.5** — Foarte bun
- **3.5 – 4.0** — Bun
- **sub 3.5** — Atenție · CEAC poate iniția discuție

## Comentariile text — cum le citești?

Comentariile libere sunt strict anonimizate. Recomandăm să citești toate comentariile, chiar și pe cele dure.

## Export CSV — când îl folosești?

Pentru analize personalizate, dosare de promovare, sau follow-up cu departamentul.

## Întrebări?

Scrie la ceac@faima.pub.ro.'),
  ('admin',
   'Ghid pentru administratori',
   '## Dashboard administrator

Pagina principală afișează 4 indicatori cheie: total studenți, total profesori, evaluări completate și rata de completare.

## Gestionare platformă (6 secțiuni)

1. **Platformă** — activează / dezactivează evaluările, setează deadline-ul
2. **Mesaje** — trimite anunțuri către studenți
3. **Filtre avansate** — analize statistice complexe
4. **Discipline** — comparație profesori pe aceeași disciplină
5. **Chestionar** — CRUD pe întrebări
6. **Email** — configurare SMTP

## Editor closing-the-loop

Editează textul „Ați evaluat, noi am acționat" pe care studenții îl văd pe dashboard.

## Utilizatori

Vizualizarea, editarea și dezactivarea conturilor.

## Best practices

- Activează platforma pentru fereastra de evaluare clar comunicată
- Trimite mesaje de reminder
- Publică 3-5 schimbări concrete după fiecare ciclu

## Suport tehnic

Pentru issues tehnice: it@faima.pub.ro.');
