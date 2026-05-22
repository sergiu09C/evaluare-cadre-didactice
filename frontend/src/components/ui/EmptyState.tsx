import type { ReactNode } from 'react';
import { Card } from './Card';

interface EmptyStateProps {
  icon?: ReactNode;
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: 'default' | 'info' | 'success';
}

export function EmptyState({ icon, illustration, title, description, action, tone = 'default' }: EmptyStateProps) {
  return (
    <Card tone={tone} className="py-12 text-center flex flex-col items-center gap-4">
      {illustration && (
        <div className="w-60 h-44 flex items-center justify-center" aria-hidden="true">
          {illustration}
        </div>
      )}
      {!illustration && icon && (
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400" aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1.5 max-w-md">
        <h3 className="font-display text-base font-semibold text-neutral-800">{title}</h3>
        {description && <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}
