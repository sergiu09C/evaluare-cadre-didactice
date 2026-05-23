import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

function StaticShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-7 max-w-[860px] mx-auto">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-800 mb-4 no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Înapoi la pagina principală
        </Link>
        <h1 className="font-display text-2xl md:text-[30px] font-semibold tracking-tight text-neutral-800">{title}</h1>
      </div>
      <Card className="prose prose-sm max-w-none">{children}</Card>
    </div>
  );
}

export function Terms() {
  return (
    <StaticShell title="Termenii de utilizare">
      <div className="space-y-4 text-neutral-700 text-[15px] leading-relaxed">
        <p className="text-xs text-neutral-400">
          Versiune pilot · ECD v1.0 · ultima actualizare: mai 2026
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          1. Acceptarea termenilor
        </h2>
        <p>
          Prin utilizarea platformei <strong>ECD — Evaluarea Cadrelor Didactice</strong>, accepți
          termenii descriși mai jos. Platforma este dezvoltată de FAIMA-UNSTPB în cadrul pilotului
          de îmbunătățire a procesului de evaluare a calității didactice.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          2. Cine poate folosi platforma
        </h2>
        <p>
          Acces este restricționat la studenții, cadrele didactice și personalul administrativ
          FAIMA-UNSTPB. Conturile sunt create de administratorii instituționali și nu pot fi
          partajate cu alți utilizatori.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          3. Anonimitatea răspunsurilor
        </h2>
        <p>
          Răspunsurile la evaluări sunt anonimizate înainte de a fi accesibile cadrelor didactice
          sau conducerii. Identitatea ta nu poate fi reconstituită din răspunsurile individuale.
          Pentru detalii tehnice, consultă <Link to="/privacy" className="text-accent-700">Politica de confidențialitate</Link>.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          4. Utilizare responsabilă
        </h2>
        <p>
          Comentariile libere trebuie să fie constructive și să nu conțină limbaj ofensator,
          discriminatoriu sau care identifică alte persoane fără consimțământul lor. CEAC își
          rezervă dreptul de a modera comentarii care încalcă aceste reguli.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          5. Disponibilitate și limitări
        </h2>
        <p>
          În perioada pilot, platforma poate fi temporar indisponibilă pentru mentenanță sau
          actualizări. Vom comunica eventualele perioade de neactivitate prin email și prin
          banner-ul platformei.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          6. Contact
        </h2>
        <p>
          Pentru întrebări sau probleme, scrie la{' '}
          <a href="mailto:ceac@faima.pub.ro" className="text-accent-700">ceac@faima.pub.ro</a>.
        </p>
      </div>
    </StaticShell>
  );
}

export function Privacy() {
  return (
    <StaticShell title="Politica de confidențialitate">
      <div className="space-y-4 text-neutral-700 text-[15px] leading-relaxed">
        <p className="text-xs text-neutral-400">
          Conform Regulamentului UE 2016/679 (GDPR) · ultima actualizare: mai 2026
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          1. Date colectate
        </h2>
        <p>
          Colectăm doar datele necesare funcționării platformei:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Email instituțional (pentru autentificare)</li>
          <li>Nume, prenume (pentru salutul personalizat)</li>
          <li>Programul de studii și anul (pentru contextualizarea evaluărilor)</li>
          <li>Răspunsurile la evaluări (anonimizate înainte de procesare)</li>
        </ul>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          2. Cum sunt protejate răspunsurile
        </h2>
        <p>
          Răspunsurile sunt stocate într-o tabelă separată de identitatea ta și agregate statistic
          înainte de a fi prezentate cadrelor didactice. Profesorii nu pot vedea cine a dat un
          răspuns specific.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          3. Cine are acces la date
        </h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Tu:</strong> propriile date de cont și istoricul evaluărilor tale</li>
          <li><strong>Cadre didactice:</strong> scoruri agregate ale propriilor evaluări</li>
          <li><strong>CEAC FAIMA:</strong> rapoarte agregate, fără identificarea respondenților</li>
          <li><strong>Administratorii IT:</strong> doar pentru mentenanță (audit logat)</li>
        </ul>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          4. Drepturile tale (GDPR)
        </h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Dreptul de acces la propriile date</li>
          <li>Dreptul la rectificare</li>
          <li>Dreptul la ștergere („dreptul de a fi uitat")</li>
          <li>Dreptul la portabilitate (export în format JSON)</li>
          <li>Dreptul de a depune plângere la ANSPDCP</li>
        </ul>
        <p>
          Pentru exercitarea drepturilor, scrie la{' '}
          <a href="mailto:dpo@unstpb.ro" className="text-accent-700">dpo@unstpb.ro</a>.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          5. Retenție
        </h2>
        <p>
          Datele de cont sunt păstrate cât timp ești afiliat la FAIMA. Răspunsurile anonimizate
          sunt păstrate pentru analize istorice și raportări ARACIS.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          6. Cookies & tracking
        </h2>
        <p>
          Folosim doar un cookie tehnic pentru menținerea sesiunii (JWT). Nu folosim tracking
          analitic terț (Google Analytics, Facebook Pixel etc.) în versiunea pilot.
        </p>
      </div>
    </StaticShell>
  );
}

export function GuideProfessor() {
  return (
    <StaticShell title="Ghid pentru profesori">
      <div className="space-y-4 text-neutral-700 text-[15px] leading-relaxed">
        <p>
          Bine ai venit la ghidul rapid pentru profesori. Mai jos găsești răspunsuri la întrebările
          frecvente despre cum citești și folosești feedback-ul primit de la studenți.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Ce vezi pe Dashboard?
        </h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Total evaluări</strong> primite pentru toate cursurile tale</li>
          <li><strong>Media generală</strong> pe toate dimensiunile chestionarului</li>
          <li><strong>Studenți unici</strong> care te-au evaluat (anonimizați)</li>
          <li><strong>Trend</strong> față de semestrul anterior</li>
        </ul>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Cum interpretezi scorul?
        </h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>4.5 – 5.0</strong> — Excelent · ești în topul facultății</li>
          <li><strong>4.0 – 4.5</strong> — Foarte bun · performanță solidă</li>
          <li><strong>3.5 – 4.0</strong> — Bun · zone de optimizare</li>
          <li><strong>sub 3.5</strong> — Atenție · CEAC poate iniția discuție de îmbunătățire</li>
        </ul>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Comentariile text — cum le citești?
        </h2>
        <p>
          Comentariile libere sunt strict anonimizate. Profesorul vede doar textul, fără numele
          studentului, data exactă sau alte date identificatoare. Recomandăm să citești toate
          comentariile, chiar și pe cele dure — feedback-ul constructiv este sursa principală de
          îmbunătățire.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Export CSV — când îl folosești?
        </h2>
        <p>
          Pentru analize personalizate, dosare de promovare, sau follow-up cu departamentul.
          Fișierul exportat este complet anonim — siguranță garantată GDPR.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Întrebări?
        </h2>
        <p>
          Scrie la <a href="mailto:ceac@faima.pub.ro" className="text-accent-700">ceac@faima.pub.ro</a>.
        </p>
      </div>
    </StaticShell>
  );
}

export function GuideAdmin() {
  return (
    <StaticShell title="Ghid pentru administratori">
      <div className="space-y-4 text-neutral-700 text-[15px] leading-relaxed">
        <p>
          Acest ghid acoperă funcționalitățile principale ale panoului de administrator ECD.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Dashboard administrator
        </h2>
        <p>
          Pagina principală afișează 4 indicatori cheie: total studenți, total profesori, evaluări
          completate și rata de completare. Folosește filtrele de sus pentru a îngusta datele pe
          facultate, nivel sau an.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Gestionare platformă (6 secțiuni)
        </h2>
        <ol className="list-decimal list-inside space-y-1.5 ml-2">
          <li><strong>Platformă</strong> — activează / dezactivează evaluările, setează deadline-ul</li>
          <li><strong>Mesaje</strong> — trimite anunțuri către studenți (cu target: facultate / an / nivel)</li>
          <li><strong>Filtre avansate</strong> — analize statistice complexe</li>
          <li><strong>Discipline</strong> — comparație profesori pe aceeași disciplină</li>
          <li><strong>Chestionar</strong> — CRUD pe întrebări (add / edit / reorder / delete)</li>
          <li><strong>Email</strong> — configurare SMTP pentru trimiterea automată de notificări</li>
        </ol>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Editor closing-the-loop
        </h2>
        <p>
          Tot din Gestionare platformă, poți edita textul „Ați evaluat, noi am acționat" pe care
          studenții îl văd pe dashboard. Asigură-te că schimbările sunt concrete și ușor de
          identificat (max. 3 elemente per ciclu de comunicare).
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Utilizatori
        </h2>
        <p>
          Pagina <strong>Utilizatori</strong> permite vizualizarea, editarea și dezactivarea
          conturilor de studenți și profesori. Important: dezactivarea unui cont NU șterge istoricul
          evaluărilor — datele rămân anonime pentru raportări.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Best practices
        </h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Activează platforma pentru fereastra de evaluare clar comunicată (recomandat: 2 săptămâni)</li>
          <li>Trimite cel puțin 1 mesaj de reminder la jumătate de fereastră</li>
          <li>Publică 3-5 schimbări concrete (closing-the-loop) după fiecare ciclu</li>
          <li>Folosește comparația pe discipline pentru a identifica practici excelente</li>
        </ul>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Suport tehnic
        </h2>
        <p>
          Pentru issues tehnice, contactează echipa IT FAIMA sau scrie la{' '}
          <a href="mailto:it@faima.pub.ro" className="text-accent-700">it@faima.pub.ro</a>.
        </p>
      </div>
    </StaticShell>
  );
}

export function Guide() {
  return (
    <StaticShell title="Ghid pentru studenți">
      <div className="space-y-4 text-neutral-700 text-[15px] leading-relaxed">
        <p>
          Bine ai venit la ghidul rapid ECD. Mai jos găsești răspunsuri la întrebările frecvente
          despre procesul de evaluare.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          De ce contează evaluarea ta?
        </h2>
        <p>
          Răspunsurile tale sunt analizate de CEAC FAIMA și folosite pentru a îmbunătăți concret
          calitatea predării. Vezi în secțiunea „Rezultate agregate" exemple de schimbări
          implementate în ultimele luni pe baza feedback-ului colegilor tăi.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Cum funcționează scala 1–5?
        </h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>1</strong> — Total dezacord</li>
          <li><strong>2</strong> — Dezacord</li>
          <li><strong>3</strong> — Neutru</li>
          <li><strong>4</strong> — Acord</li>
          <li><strong>5</strong> — Total acord</li>
        </ul>
        <p>
          Răspunde la fiecare item separat, gândindu-te la experiența ta concretă cu disciplina și
          cadrul didactic respectiv. Nu există răspunsuri „corecte" sau „greșite".
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Cum navighez prin chestionar?
        </h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Click direct pe o opțiune sau folosește tastele <kbd className="font-mono text-xs px-1 py-0.5 bg-neutral-100 rounded">1</kbd>–<kbd className="font-mono text-xs px-1 py-0.5 bg-neutral-100 rounded">5</kbd></li>
          <li>Folosește săgețile <kbd className="font-mono text-xs px-1 py-0.5 bg-neutral-100 rounded">←</kbd> <kbd className="font-mono text-xs px-1 py-0.5 bg-neutral-100 rounded">→</kbd> pentru a naviga între opțiuni</li>
          <li>Apasă <kbd className="font-mono text-xs px-1 py-0.5 bg-neutral-100 rounded">Continuă</kbd> pentru a trece la următoarea întrebare</li>
          <li>Poți reveni oricând la o întrebare anterioară fără a pierde răspunsurile</li>
        </ul>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Ce se întâmplă dacă închid platforma la jumătate?
        </h2>
        <p>
          Răspunsurile tale sunt salvate automat la fiecare 30 de secunde. Când revii, vei
          continua de unde ai rămas. Evaluarea apare ca „Draft salvat" în lista de evaluări active.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Pot fi identificat din răspunsuri?
        </h2>
        <p>
          Nu. Răspunsurile sunt anonimizate înainte de a fi văzute de profesor. ID-ul tău este
          șters din răspunsuri la finalul colectării. Pentru detalii tehnice vezi{' '}
          <Link to="/privacy" className="text-accent-700">Politica de confidențialitate</Link>.
        </p>

        <h2 className="font-display text-lg font-semibold text-neutral-800 mt-6">
          Întrebări?
        </h2>
        <p>
          Scrie la{' '}
          <a href="mailto:ceac@faima.pub.ro" className="text-accent-700">ceac@faima.pub.ro</a>{' '}
          sau folosește comanda <kbd className="font-mono text-xs px-1 py-0.5 bg-neutral-100 rounded">⌘ K</kbd> pentru a căuta rapid.
        </p>
      </div>
    </StaticShell>
  );
}
