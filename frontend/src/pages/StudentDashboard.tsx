/**
 * StudentDashboard — varianta SLIM (post-audit R1).
 * Conținut UNIC fără duplicate cu Acasă:
 *  - DualRadar curent vs semestrul anterior (compară-te cu trecutul tău)
 *  - Streak completare (consecutive sessions)
 *  - Link-uri rapide către pagina principală
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, KPICard, Button } from '../components/ui';
import { TERMS } from '../i18n/glossary';
import DualRadar from '../components/charts/DualRadar';
import { ArrowRightIcon, HomeIcon, ChartBarIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface PersonalRadar {
  dimensions: string[];
  current: number[];
  previous: number[] | null;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<any | null>(null);
  const [achievements, setAchievements] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getEvaluationStatus(), api.getFeedbackStats().catch(() => null), api.getAchievements().catch(() => null)])
      .then(([statusData, statsData, achData]) => {
        setStats({ status: statusData, feedback: statsData });
        setAchievements(achData);
      })
      .finally(() => setLoading(false));
  }, []);

  // Construim radar: tu vs facultate, pe categoriile Likert
  const radar: PersonalRadar | null = (() => {
    const fs = stats?.feedback;
    if (!fs?.byCategory) return null;
    const allCats = ['didactica', 'comunicare', 'organizare', 'angajament', 'general'];
    const dims = allCats.filter((c) => fs.byCategory[c]?.current != null);
    if (dims.length < 3) return null;
    return {
      dimensions: dims.map((d) => d.charAt(0).toUpperCase() + d.slice(1)),
      current: dims.map((d) => fs.byCategory[d]?.current ?? 0),
      previous: dims.map((d) => fs.byCategory[d]?.facultyAvg ?? 0),
    };
  })();

  const streak = achievements?.streak ?? null;
  const myCount = stats?.status?.completedEvaluations ?? 0;
  const myDraft = stats?.status?.draftEvaluations ?? 0;

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600 mx-auto" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 max-w-[960px]">
      {/* Breadcrumb spre Acasă */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-800 self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1"
      >
        <HomeIcon className="w-3.5 h-3.5" aria-hidden="true" />
        Înapoi la Acasă
      </button>

      <div>
        <h1 className="font-display text-[30px] font-semibold tracking-tight text-neutral-800">
          Dashboard student — {user?.firstName ?? 'profilul tău'}
        </h1>
        <p className="mt-1.5 text-neutral-500 text-[15px] max-w-[640px]">
          Profilul tău personal: cum ai evoluat de la semestrul anterior și streak-ul de
          participare. Pentru date generale platformă, vezi <Link to="/" className="text-accent-600 hover:underline">pagina Acasă</Link>.
        </p>
      </div>

      {/* 2 KPI unice (Streak + Drafturi) — restul în Acasă */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard
          label="Streak completare"
          value={streak ?? 0}
          suffix={streak ? ' evaluări consecutive' : ''}
          footnote="cel mai lung lanț de evaluări fără pauză"
        />
        <KPICard
          label={TERMS.evaluationsDraft}
          value={myDraft}
          footnote={myDraft > 0 ? 'continuă-le din Evaluări active' : 'toate evaluările tale sunt trimise'}
        />
      </div>

      {/* DualRadar — comparație personală cu media facultății */}
      <Card>
        <h2 className="text-base font-semibold text-neutral-800 mb-1">
          Scorurile tale vs. media facultății
        </h2>
        <p className="text-xs text-neutral-500 mb-4">
          Cum se compară scorurile pe care le-ai acordat tu, în medie pe fiecare categorie de
          întrebări, cu media tuturor studenților din facultatea ta.
        </p>
        {radar ? (
          <DualRadar
            dimensions={radar.dimensions}
            primary={radar.current}
            primaryLabel="Scorurile tale"
            secondary={radar.previous ?? undefined}
            secondaryLabel={radar.previous ? 'Media facultății' : undefined}
            size={300}
          />
        ) : myCount === 0 ? (
          <p className="text-sm text-neutral-500 py-6 text-center">
            Vei vedea radar-ul după ce vei trimite prima ta evaluare.
          </p>
        ) : (
          <p className="text-sm text-neutral-500 py-6 text-center">
            Datele de comparație nu sunt încă disponibile.
          </p>
        )}
      </Card>

      {/* Shortcut-uri rapide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button variant="secondary" iconRight={<ArrowRightIcon />} onClick={() => navigate('/evaluations')}>
          Evaluări active
        </Button>
        <Button variant="secondary" icon={<ChartBarIcon />} iconRight={<ArrowRightIcon />} onClick={() => navigate('/history')}>
          Istoric submisii
        </Button>
        <Button variant="secondary" icon={<TrophyIcon />} iconRight={<ArrowRightIcon />} onClick={() => navigate('/achievements')}>
          Achievements
        </Button>
      </div>
    </div>
  );
}
