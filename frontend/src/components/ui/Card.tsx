import type { HTMLAttributes, ReactNode } from 'react';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'primary';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  tone?: Tone;
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

const toneClasses: Record<Tone, string> = {
  default: 'bg-white border-neutral-100',
  success: 'bg-success-bg border-emerald-200',
  warning: 'bg-warning-bg border-amber-200',
  danger: 'bg-danger-bg border-red-200',
  info: 'bg-info-bg border-blue-200',
  accent: 'bg-accent-50 border-accent-200',
  primary: 'bg-primary-50 border-primary-200',
};

export function Card({
  children,
  interactive = false,
  padding = 'lg',
  tone = 'default',
  className = '',
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        'border rounded-xl shadow-elev-1',
        toneClasses[tone],
        paddingClasses[padding],
        interactive
          ? 'cursor-pointer hover:shadow-elev-3 hover:-translate-y-px transition-all duration-med ease-out-expo'
          : 'transition-shadow duration-med ease-out-expo',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
