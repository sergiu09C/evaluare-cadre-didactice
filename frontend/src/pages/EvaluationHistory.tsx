import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card, Badge, Avatar, Button, ListFilterBar } from '../components/ui';
import { ArrowRightIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { EvaluationHistoryItem, EvaluationHistoryResponse } from '../types';

type Filter = 'all' | 'submitted' | 'draft';

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

  const items = useMemo<EvaluationHistoryItem[]>(() => {
    if (!data) return [];
    if (filter === 'all') return data.history;
    return data.history.filter((i) => i.status === filter);
  }, [data, filter]);

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
          Toate evaluările tale completate și în progres.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-[600px]">
        <Card padding="md">
          <div className="text-xs uppercase tracking-wide text-neutral-500 font-medium">Total</div>
          <div className="font-display text-2xl font-semibold mt-1 text-neutral-800">
            {data.summary.total}
          </div>
        </Card>
        <Card padding="md">
          <div className="text-xs uppercase tracking-wide text-neutral-500 font-medium">Trimise</div>
          <div className="font-display text-2xl font-semibold mt-1 text-success-fg">
            {data.summary.submitted}
          </div>
        </Card>
        <Card padding="md">
          <div className="text-xs uppercase tracking-wide text-neutral-500 font-medium">Draft</div>
          <div className="font-display text-2xl font-semibold mt-1 text-warning-fg">
            {data.summary.draft}
          </div>
        </Card>
      </div>

      <ListFilterBar
        tabs={{
          items: [
            { key: 'all', label: 'Toate', count: data.summary.total },
            { key: 'submitted', label: 'Trimise', count: data.summary.submitted },
            { key: 'draft', label: 'Draft', count: data.summary.draft },
          ],
          value: filter,
          onChange: (v) => setFilter(v as Filter),
        }}
        resultCount={{ current: items.length, total: data.summary.total }}
        active={filter !== 'all'}
        onClearAll={() => setFilter('all')}
      />

      {/* List */}
      {items.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-neutral-500">
            {filter === 'all'
              ? 'Nu ai nicio evaluare în istoric. Începe prima evaluare din Acasă!'
              : 'Nu există evaluări în această categorie.'}
          </p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          {items.map((item, i) => {
            const submitted = item.status === 'submitted';
            const tone = avatarTones[i % avatarTones.length];
            return (
              <div
                key={item.id}
                className={`px-6 py-[18px] flex items-center gap-4 transition-colors duration-fast ${
                  i < items.length - 1 ? 'border-b border-neutral-100' : ''
                }`}
              >
                <Avatar initials={initialsOf(item.professor.name)} tone={tone} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-neutral-800 tracking-tight truncate">
                    {item.course.name}{' '}
                    <span className="text-[13px] font-normal text-neutral-400">
                      · {item.course.code}
                    </span>
                  </div>
                  <div className="text-[13px] text-neutral-500 mt-0.5">
                    {item.professor.name}
                    {item.professor.type ? ` · ${item.professor.type}` : ''}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    {submitted ? (
                      <>
                        Trimisă{' '}
                        {item.submittedAt &&
                          new Date(item.submittedAt).toLocaleDateString('ro-RO', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}{' '}
                        · {item.responsesCount} răspunsuri
                      </>
                    ) : (
                      <>
                        Început{' '}
                        {new Date(item.startedAt).toLocaleDateString('ro-RO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}{' '}
                        · {item.responsesCount} răspunsuri salvate
                      </>
                    )}
                  </div>
                </div>
                <Badge tone={submitted ? 'success' : 'warning'}>
                  {submitted ? (
                    <>
                      <CheckCircleIcon className="w-3 h-3" aria-hidden="true" /> Trimisă
                    </>
                  ) : (
                    <>
                      <ClockIcon className="w-3 h-3" aria-hidden="true" /> Draft
                    </>
                  )}
                </Badge>
                <Button
                  variant={submitted ? 'secondary' : 'accent'}
                  size="sm"
                  iconRight={<ArrowRightIcon />}
                  onClick={() => navigate(`/evaluation/${item.id}`)}
                >
                  {submitted ? 'Vizualizează' : 'Continuă'}
                </Button>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
