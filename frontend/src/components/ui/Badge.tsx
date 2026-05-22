import type { HTMLAttributes, ReactNode } from 'react';

type Tone = 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-primary-50 text-primary-700',
  accent: 'bg-accent-100 text-accent-700',
  success: 'bg-success-bg text-success-fg',
  warning: 'bg-warning-bg text-warning-fg',
  danger: 'bg-danger-bg text-danger-fg',
  info: 'bg-info-bg text-info-fg',
};

export function Badge({ tone = 'neutral', dot = false, children, className = '', ...rest }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full',
        'text-xs font-medium leading-[1.4]',
        toneClasses[tone],
        className,
      ].join(' ')}
      {...rest}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}
