import { Badge } from '../ui';
import { TrophyIcon } from '@heroicons/react/24/outline';

interface Item {
  id?: number;
  name: string;
  subtitle?: string;
  avg_score?: number | null;
  n_evals?: number;
}

interface Props {
  items: Item[];
  metric?: 'avg' | 'count';
  title?: string;
  emptyText?: string;
  onItemClick?: (item: Item) => void;
}

function rankColor(rank: number): string {
  if (rank === 0) return '#F59E0B'; // aur
  if (rank === 1) return '#94A3B8'; // argint
  if (rank === 2) return '#A16207'; // bronz
  return 'var(--ecd-neutral-300)';
}

function scoreTone(score: number | null | undefined): 'success' | 'warning' | 'danger' | 'neutral' {
  if (score == null) return 'neutral';
  if (score >= 4) return 'success';
  if (score >= 3) return 'warning';
  return 'danger';
}

export default function TopNList({
  items,
  metric = 'avg',
  emptyText = 'Niciun item în top',
  onItemClick,
}: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-neutral-500 py-6 text-center">{emptyText}</p>;
  }
  return (
    <ol className="flex flex-col gap-2">
      {items.map((item, idx) => {
        const interactive = !!onItemClick;
        const Tag: any = interactive ? 'button' : 'div';
        const value =
          metric === 'avg'
            ? item.avg_score != null
              ? item.avg_score.toFixed(2).replace('.', ',')
              : '—'
            : (item.n_evals ?? 0).toLocaleString('ro-RO');
        return (
          <li key={item.id ?? `${item.name}-${idx}`}>
            <Tag
              type={interactive ? 'button' : undefined}
              onClick={interactive ? () => onItemClick!(item) : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-neutral-100 ${interactive ? 'hover:border-accent-400 hover:bg-neutral-25 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40' : ''} text-left`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                style={{ background: rankColor(idx) }}
                aria-hidden="true"
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-neutral-800 truncate">{item.name}</div>
                {item.subtitle && (
                  <div className="text-[11px] text-neutral-500 truncate">{item.subtitle}</div>
                )}
              </div>
              <div className="flex flex-col items-end shrink-0">
                <Badge tone={metric === 'avg' ? scoreTone(item.avg_score ?? null) : 'accent'}>
                  {value}
                  {metric === 'avg' && item.avg_score != null && (
                    <span className="ml-1 opacity-70 text-[10px]">/ 5</span>
                  )}
                </Badge>
                {item.n_evals != null && metric === 'avg' && (
                  <span className="text-[10px] text-neutral-400 mt-0.5">
                    {item.n_evals.toLocaleString('ro-RO')} eval.
                  </span>
                )}
                {idx === 0 && (
                  <TrophyIcon
                    className="w-4 h-4 mt-1"
                    style={{ color: rankColor(0) }}
                    aria-hidden="true"
                  />
                )}
              </div>
            </Tag>
          </li>
        );
      })}
    </ol>
  );
}
