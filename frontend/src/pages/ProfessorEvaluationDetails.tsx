import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card, Badge, Button, KPICard } from '../components/ui';
import {
  ArrowLeftIcon,
  CalendarIcon,
  BookOpenIcon,
  ChatBubbleBottomCenterTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

type Eval = Awaited<ReturnType<typeof api.getEvaluationDetails>>['evaluation'];

function scoreTone(score: number | null): 'success' | 'warning' | 'danger' | 'neutral' {
  if (score == null) return 'neutral';
  if (score >= 4) return 'success';
  if (score >= 3) return 'warning';
  return 'danger';
}

export default function ProfessorEvaluationDetails() {
  const { id } = useParams<{ id: string }>();
  const evaluationId = Number(id);
  const navigate = useNavigate();
  const [data, setData] = useState<Eval | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!evaluationId) return;
    setLoading(true);
    api
      .getEvaluationDetails(evaluationId)
      .then((r) => setData(r.evaluation))
      .catch((e) => setError(e.response?.data?.error || 'Eroare la încărcare'))
      .finally(() => setLoading(false));
  }, [evaluationId]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600 mx-auto"
          aria-hidden="true"
        />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex flex-col gap-5 max-w-[860px]">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeftIcon />}
          onClick={() => navigate('/professor/reports')}
        >
          Înapoi la rapoarte
        </Button>
        <Card tone="danger">
          <p className="text-sm text-danger-fg">{error || 'Evaluare inexistentă.'}</p>
        </Card>
      </div>
    );
  }

  const textComments = data.responses.filter((r) => r.text && r.text.trim());
  const likertResponses = data.responses.filter((r) => r.likert != null);
  const noResponse = data.responses.filter((r) => r.likert == null && !r.text);

  return (
    <div className="flex flex-col gap-7 max-w-[960px]">
      <button
        onClick={() => navigate('/professor/reports')}
        className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-800 self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" aria-hidden="true" />
        Înapoi la rapoarte
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge tone="neutral">Evaluare individuală</Badge>
          <span className="font-mono text-[11px] text-neutral-400">{data.anon_id}</span>
        </div>
        <h1 className="font-display text-xl md:text-[28px] font-semibold tracking-tight text-neutral-800">
          {data.course.name}
        </h1>
        <p className="text-[13px] text-neutral-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <BookOpenIcon className="w-4 h-4" aria-hidden="true" />
            {data.course.code} · {data.course.courseType}
          </span>
          <span>{data.course.semester} · {data.course.academicYear}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarIcon className="w-4 h-4" aria-hidden="true" />
            Trimis: {new Date(data.submitted_at).toLocaleString('ro-RO')}
          </span>
        </p>
      </div>

      {/* KPIs sumar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          label="Medie evaluare"
          value={data.average != null ? data.average.toFixed(2).replace('.', ',') : '—'}
          suffix={data.average != null ? '/ 5,00' : ''}
        />
        <KPICard
          label="Notă echivalent (1-10)"
          value={data.average != null ? (data.average * 2).toFixed(2).replace('.', ',') : '—'}
          suffix={data.average != null ? '/ 10,00' : ''}
        />
        <KPICard
          label="Răspunsuri Likert"
          value={likertResponses.length}
          footnote={`din ${data.responses.length} întrebări`}
        />
        <KPICard
          label="Comentarii text"
          value={textComments.length}
          footnote="cu text liber"
        />
      </div>

      {/* Distribuție rapidă scoruri */}
      <Card>
        <h2 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-accent-600" aria-hidden="true" />
          Distribuție scoruri Likert
        </h2>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((s) => {
            const count = data.score_distribution[s] ?? 0;
            const pct = likertResponses.length > 0 ? (count / likertResponses.length) * 100 : 0;
            const palette: Record<number, string> = {
              5: 'var(--ecd-success)',
              4: '#84CC16',
              3: 'var(--ecd-warning)',
              2: '#F59E0B',
              1: 'var(--ecd-danger)',
            };
            return (
              <div key={s} className="flex items-center gap-3">
                <Badge tone={scoreTone(s)}>{s}</Badge>
                <div
                  className="flex-1 h-2.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--ecd-border-soft)' }}
                >
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: palette[s] }}
                  />
                </div>
                <span className="text-xs tabular-nums text-neutral-600 w-16 text-right">
                  {count} ({pct.toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Răspunsuri detaliate */}
      <Card>
        <h2 className="text-base font-semibold text-neutral-800 mb-1">
          Răspunsuri la fiecare întrebare
        </h2>
        <p className="text-xs text-neutral-500 mb-4">
          {data.responses.length} întrebări — atât scor Likert, cât și comentarii text liber.
        </p>
        <ul className="flex flex-col gap-4">
          {data.responses.map((r, idx) => (
            <li
              key={r.question_id}
              className="border-l-2 border-neutral-200 pl-4 hover:border-accent-400 transition-colors"
            >
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs text-neutral-400 font-mono">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <Badge tone="neutral">{r.category}</Badge>
                <span className="text-[11px] text-neutral-400">{r.question_type}</span>
              </div>
              <p className="text-sm font-medium text-neutral-800 mb-2">{r.question_text}</p>
              <div className="flex items-start gap-3 flex-wrap">
                {r.likert != null && (
                  <Badge tone={scoreTone(r.likert)}>{r.likert} / 5</Badge>
                )}
                {r.text && r.text.trim() && (
                  <div className="flex-1 min-w-[260px] flex items-start gap-2">
                    <ChatBubbleBottomCenterTextIcon
                      className="w-4 h-4 text-accent-600 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <p className="text-sm italic text-neutral-700 whitespace-pre-wrap">
                      „{r.text}"
                    </p>
                  </div>
                )}
                {r.likert == null && !r.text && (
                  <span className="text-xs text-neutral-400">— fără răspuns —</span>
                )}
              </div>
            </li>
          ))}
        </ul>
        {noResponse.length > 0 && (
          <p className="text-xs text-neutral-400 mt-4 italic">
            {noResponse.length} întrebar{noResponse.length === 1 ? 'e' : 'i'} fără răspuns.
          </p>
        )}
      </Card>
    </div>
  );
}
