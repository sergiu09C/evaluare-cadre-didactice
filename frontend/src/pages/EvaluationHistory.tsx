import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card, Badge, Avatar, Button, ListFilterBar } from '../components/ui';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { EvaluationHistoryItem, EvaluationHistoryResponse } from '../types';

type Filter = 'all' | 'recent' | 'older';

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

export default function EvaluationHistory() {
  const navigate = useNavigate();
  const [data, setData] = useState<EvaluationHistoryResponse | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getEvaluationHistory()
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || 'Eroare la încărcarea istoricului.'))
      .finally(() => setLoading(false));
  }, []);

  // În Istoric afișăm DOAR evaluările trimise. Draft-urile rămân în Evaluări active.
  const submittedItems = useMemo<EvaluationHistoryItem[]>(() => {
    if (!data) return [];
    return data.history
      .filter((i) => i.status === 'submitted' && i.submittedAt)
      .slice()
      .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
  }, [data]);

  const thirtyDaysAgo = useMemo(() => Date.now() - 30 * 24 * 60 * 60 * 1000, []);

  const items = useMemo<EvaluationHistoryItem[]>(() => {
    if (filter === 'all') return submittedItems;
    if (filter === 'recent')
      return submittedItems.filter(
        (i) => i.submittedAt && new Date(i.submittedAt).getTime() >= thirtyDaysAgo,
      );
    return submittedItems.filter(
      (i) => i.submittedAt && new Date(i.submittedAt).getTime() < thirtyDaysAgo,
    );
  }, [submittedItems, filter, thirtyDaysAgo]);

  const recentCount = submittedItems.filter(
    (i) => i.submittedAt && new Date(i.submittedAt).getTime() >= thirtyDaysAgo,
  ).length;
  const olderCount = submittedItems.length - recentCount;

  if (loading) {
    return (
      <div className="text-center py-16" role="status" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4" aria-hidden="true" />
        <div className="text-neutral-500">Se încarcă istoricul...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-danger-bg">
        <p className="text-danger-fg" role="alert">
          {error || 'Date indisponibile.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-7 max-w-[1280px]">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-[30px] font-semibold tracking-tight text-neutral-800">
          Istoric evaluări
        </h1>
        <p className="mt-1.5 text-neutral-500 text-sm md:text-[15px]">
          Evaluările trimise — cu data și ora trimiterii. Pentru cele aflate în lucru vezi{' '}
          <button
            type="button"
            onClick={() => navigate('/evaluations')}
            className="text-accent-700 hover:underline font-medium"
          >
            Evaluări active
          </button>
          .
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-[600px]">
        <Card padding="md">
          <div className="text-xs uppercase tracking-wide text-neutral-500 font-medium">Trimise total</div>
          <div className="font-display text-2xl font-semibold mt-1 text-success-fg">
            {submittedItems.length}
          </div>
        </Card>
        <Card padding="md">
          <div className="text-xs uppercase tracking-wide text-neutral-500 font-medium">Ultimele 30 zile</div>
          <div className="font-display text-2xl font-semibold mt-1 text-neutral-800">
            {recentCount}
          </div>
        </Card>
        <Card padding="md" className="col-span-2 sm:col-span-1">
          <div className="text-xs uppercase tracking-wide text-neutral-500 font-medium">Mai vechi</div>
          <div className="font-display text-2xl font-semibold mt-1 text-neutral-800">
            {olderCount}
          </div>
        </Card>
      </div>

      <ListFilterBar
        tabs={{
          items: [
            { key: 'all', label: 'Toate', count: submittedItems.length },
            { key: 'recent', label: 'Ultimele 30 zile', count: recentCount },
            { key: 'older', label: 'Mai vechi', count: olderCount },
          ],
          value: filter,
          onChange: (v) => setFilter(v as Filter),
        }}
        resultCount={{ current: items.length, total: submittedItems.length }}
        active={filter !== 'all'}
        onClearAll={() => setFilter('all')}
      />

      {/* List */}
      {items.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-neutral-500">
            {submittedItems.length === 0
              ? 'Nu ai nicio evaluare trimisă încă. După trimitere apare automat aici.'
              : 'Nu există evaluări în acest interval.'}
          </p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          {items.map((item, i) => {
            const tone = avatarTones[i % avatarTones.length];
            const submittedDate = item.submittedAt ? new Date(item.submittedAt) : null;
            const dateLabel = submittedDate?.toLocaleDateString('ro-RO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            const timeLabel = submittedDate?.toLocaleTimeString('ro-RO', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div
                key={item.id}
                className={`px-4 sm:px-6 py-4 sm:py-[18px] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-colors duration-fast ${
                  i < items.length - 1 ? 'border-b border-neutral-100' : ''
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto sm:flex-1 min-w-0">
                  <Avatar initials={initialsOf(item.professor.name)} tone={tone} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-neutral-800 tracking-tight truncate">
                      {item.course.name}{' '}
                      <span className="text-[13px] font-normal text-neutral-400">
                        · {item.course.code}
                      </span>
                    </div>
                    <div className="text-[13px] text-neutral-500 mt-0.5 break-words">
                      {item.professor.name}
                      {item.professor.type ? ` · ${item.professor.type}` : ''}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-1">
                      Trimisă {dateLabel} · ora {timeLabel} · {item.responsesCount} răspunsuri
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:shrink-0">
                  <Badge tone="success">
                    <CheckCircleIcon className="w-3 h-3" aria-hidden="true" /> Trimisă
                  </Badge>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  iconRight={<ArrowRightIcon />}
                  onClick={() => navigate(`/evaluation/${item.id}`)}
                  className="w-full sm:w-auto"
                >
                  Vizualizează
                </Button>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
