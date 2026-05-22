import { Card } from './Card';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface KPICardProps {
  label: string;
  value: string | number;
  suffix?: string;
  delta?: string;
  trend?: 'up' | 'down';
  footnote?: string;
  spark?: string;
}

export function KPICard({ label, value, suffix, delta, trend = 'up', footnote, spark }: KPICardProps) {
  const positive = trend === 'up';
  return (
    <Card padding="md" className="flex flex-col gap-2.5">
      <span className="text-xs font-medium text-neutral-500 uppercase tracking-[0.04em]">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold tracking-tight text-neutral-800">{value}</span>
        {suffix && <span className="text-sm text-neutral-500">{suffix}</span>}
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        {delta != null && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              positive ? 'text-success-fg' : 'text-danger-fg'
            }`}
          >
            {positive ? (
              <ArrowTrendingUpIcon className="w-3 h-3" aria-hidden="true" />
            ) : (
              <ArrowTrendingDownIcon className="w-3 h-3" aria-hidden="true" />
            )}
            {delta}
          </span>
        )}
        {footnote && <span className="text-xs text-neutral-500">{footnote}</span>}
      </div>
      {spark && (
        <svg viewBox="0 0 120 32" className="w-full h-9 mt-1">
          <defs>
            <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={spark} fill="none" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`${spark} L120 32 L0 32 Z`} fill="url(#spark-grad)" />
        </svg>
      )}
    </Card>
  );
}
