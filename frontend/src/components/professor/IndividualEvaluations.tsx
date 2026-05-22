import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Card, Badge, EmptyState } from '../ui';
import { ChevronDownIcon, ChevronRightIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface Props {
  courseId: number;
}

interface EvaluationItem {
  anon_id: string;
  submitted_month: string;
  average: number | null;
  responses: Array<{
    question_id: number;
    question_text: string;
    category: string;
    likert: number | null;
    text: string | null;
  }>;
}

function scoreTone(score: number | null): 'success' | 'warning' | 'danger' | 'neutral' {
  if (score == null) return 'neutral';
  if (score >= 4) return 'success';
  if (score >= 3) return 'warning';
  return 'danger';
}

export default function IndividualEvaluations({ courseId }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    threshold_met: boolean;
    min_required: number;
    total_evaluations: number;
    evaluations: EvaluationItem[];
    message?: string;
  } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    api
      .getCourseEvaluations(courseId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-accent-600 mx-auto" aria-hidden="true" />
      </div>
    );
  }

  if (!data) return null;

  if (!data.threshold_met) {
    return (
      <EmptyState
        icon={<LockClosedIcon className="w-7 h-7" />}
        title="Drill-down indisponibil"
        description={data.message ?? `Sunt necesare minim ${data.min_required} evaluări pentru a păstra anonimitatea.`}
      />
    );
  }

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1.5">
        <LockClosedIcon className="w-3.5 h-3.5" aria-hidden="true" />
        {data.total_evaluations} evaluări anonime · ordine randomizată · fără dată exactă (doar luna)
      </p>
      {data.evaluations.map((ev) => {
        const isOpen = expanded.has(ev.anon_id);
        return (
          <Card key={ev.anon_id} padding="none" className="overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(ev.anon_id)}
              className="w-full px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-neutral-25 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isOpen ? (
                  <ChevronDownIcon className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden="true" />
                )}
                <span className="font-mono text-xs text-neutral-500 tabular-nums">{ev.anon_id}</span>
                <span className="text-[11px] text-neutral-400">{ev.submitted_month}</span>
                <span className="text-xs text-neutral-500 ml-2">
                  {ev.responses.length} răspunsuri
                </span>
                <span className="text-xs text-neutral-500">
                  ·{' '}
                  {ev.responses.filter((r) => r.text && r.text.trim()).length} comentarii text
                </span>
              </div>
              {ev.average != null && (
                <Badge tone={scoreTone(ev.average)}>
                  Medie {ev.average.toFixed(2).replace('.', ',')}
                </Badge>
              )}
            </button>
            {isOpen && (
              <div className="border-t border-neutral-100 bg-neutral-25 px-5 py-4">
                <ul className="flex flex-col gap-3">
                  {ev.responses.map((r) => (
                    <li key={r.question_id} className="border-l-2 border-neutral-200 pl-3">
                      <div className="text-xs text-neutral-400 mb-1">
                        {r.category} · Q{r.question_id}
                      </div>
                      <div className="text-sm text-neutral-700 mb-1.5">{r.question_text}</div>
                      <div className="flex items-start gap-3 flex-wrap">
                        {r.likert != null && (
                          <Badge tone={scoreTone(r.likert)}>{r.likert} / 5</Badge>
                        )}
                        {r.text && r.text.trim() && (
                          <p className="text-sm italic text-neutral-600 flex-1 min-w-[200px]">
                            „{r.text}"
                          </p>
                        )}
                        {r.likert == null && !r.text && (
                          <span className="text-xs text-neutral-400">— fără răspuns —</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
