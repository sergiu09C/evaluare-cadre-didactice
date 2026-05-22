import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card, Badge, Avatar, Button, Progress } from '../components/ui';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { AlertDialog } from '../components/AccessibleModal';
import type { Professor } from '../types';

type Filter = 'all' | 'pending' | 'draft' | 'submitted';

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || '??'
  );
}

const avatarTones = ['primary', 'accent', 'mint', 'warm'] as const;

const statusMeta: Record<
  Professor['evaluation']['status'],
  { label: string; tone: 'success' | 'warning' | 'neutral' }
> = {
  submitted: { label: 'Completată', tone: 'success' },
  draft: { label: 'Draft salvat', tone: 'warning' },
  not_started: { label: 'Nedemarat', tone: 'neutral' },
};

export default function ActiveEvaluations() {
  const navigate = useNavigate();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [closedInfo, setClosedInfo] = useState<{ message: string; deadlinePassed: boolean } | null>(null);

  useEffect(() => {
    Promise.all([api.getProfessorsToEvaluate(), api.getPlatformStatus()])
      .then(([profs, status]) => {
        setProfessors(profs.professors);
        if (status.evaluations_accepted === false) {
          setClosedInfo({
            message: status.deadline_passed
              ? `Termenul-limită pentru evaluări (${status.deadline ?? ''}) a expirat. Mulțumim pentru participare! Feedbackul pentru platformă rămâne deschis.`
              : status.closure_message || 'Platforma de evaluare este momentan închisă.',
            deadlinePassed: !!status.deadline_passed,
          });
        }
      })
      .catch((e) => setError(e.response?.data?.error || 'Eroare la încărcarea evaluărilor.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return professors;
    if (filter === 'pending') return professors.filter((p) => p.evaluation.status === 'not_started');
    return professors.filter((p) => p.evaluation.status === filter);
  }, [professors, filter]);

  const counts = useMemo(() => {
    return {
      all: professors.length,
      pending: professors.filter((p) => p.evaluation.status === 'not_started').length,
      draft: professors.filter((p) => p.evaluation.status === 'draft').length,
      submitted: professors.filter((p) => p.evaluation.status === 'submitted').length,
    };
  }, [professors]);

  const handleStart = async (p: Professor) => {
    try {
      const r = await api.createEvaluation(p.course.id, p.id);
      navigate(`/evaluation/${r.evaluationId}`);
    } catch (e: any) {
      setAlertMsg(e.response?.data?.error || 'Eroare la creare evaluare');
      setAlertOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16" role="status" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4" aria-hidden="true" />
        <div className="text-neutral-500">Se încarcă evaluările...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-danger-bg">
        <p className="text-danger-fg" role="alert">{error}</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-7 max-w-[1280px]">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[30px] font-semibold tracking-tight text-neutral-800">
            Toate evaluările
          </h1>
          <p className="mt-1.5 text-neutral-500 text-[15px]">
            Lista completă a evaluărilor tale din acest semestru.
          </p>
        </div>
        <Badge tone="info">{counts.all} total · {counts.pending + counts.draft} de făcut</Badge>
      </div>

      {/* Closed banner — afișat când platforma nu mai acceptă evaluări */}
      {closedInfo && (
        <Card tone={closedInfo.deadlinePassed ? 'warning' : 'danger'} className="flex items-start gap-3">
          <div
            className="w-2 h-2 rounded-full mt-2"
            style={{ background: closedInfo.deadlinePassed ? 'var(--ecd-warning)' : 'var(--ecd-danger)' }}
            aria-hidden="true"
          />
          <div className="flex-1">
            <h2 className="text-sm font-semibold mb-1">
              {closedInfo.deadlinePassed ? 'Termen-limită depășit' : 'Platforma de evaluare este închisă'}
            </h2>
            <p className="text-sm leading-relaxed opacity-90">{closedInfo.message}</p>
          </div>
        </Card>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filtru evaluări">
        {(['all', 'pending', 'draft', 'submitted'] as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 ${
              filter === f
                ? 'bg-primary-800 text-white border-primary-800'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {f === 'all' ? 'Toate' : f === 'pending' ? 'De început' : f === 'draft' ? 'Draft' : 'Trimise'}
            <span className="ml-1.5 text-[11px] opacity-75">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-neutral-500">Nu există evaluări în această categorie.</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          {filtered.map((p, i) => {
            const meta = statusMeta[p.evaluation.status];
            const tone = avatarTones[i % avatarTones.length];
            const isDraft = p.evaluation.status === 'draft';
            const isSubmitted = p.evaluation.status === 'submitted';
            return (
              <div
                key={`${p.id}-${p.course.id}`}
                className={`px-6 py-[18px] flex items-center gap-4 transition-colors duration-fast ${
                  i < filtered.length - 1 ? 'border-b border-neutral-100' : ''
                }`}
              >
                <Avatar initials={initialsOf(p.name)} tone={tone} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-neutral-800 tracking-tight truncate">
                    {p.course.name}
                  </div>
                  <div className="text-[13px] text-neutral-500 mt-0.5">
                    {p.name}
                    {p.type ? ` · ${p.type}` : ''} · {p.department}
                  </div>
                  {isDraft && (
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={8} max={19} height={4} color="accent" className="max-w-[200px]" />
                      <span className="text-[11px] text-neutral-400">8/19 itemi</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  {p.evaluation.deadline && !isSubmitted && (
                    <span className="text-[11px] text-neutral-400">
                      până la{' '}
                      {new Date(p.evaluation.deadline).toLocaleDateString('ro-RO', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>
                <Button
                  variant={isSubmitted ? 'secondary' : isDraft ? 'primary' : 'accent'}
                  size="sm"
                  iconRight={<ArrowRightIcon />}
                  disabled={!isSubmitted && !!closedInfo}
                  onClick={() =>
                    isDraft || isSubmitted
                      ? navigate(`/evaluation/${p.evaluation.id}`)
                      : handleStart(p)
                  }
                  aria-label={`${isDraft ? 'Continuă' : isSubmitted ? 'Vizualizează' : 'Începe'} evaluarea pentru ${p.name}, ${p.course.name}`}
                >
                  {isSubmitted ? 'Vizualizează' : closedInfo ? 'Închis' : isDraft ? 'Continuă' : 'Începe'}
                </Button>
              </div>
            );
          })}
        </Card>
      )}

      <AlertDialog
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        title="Eroare"
        message={alertMsg}
        variant="error"
      />
    </div>
  );
}
