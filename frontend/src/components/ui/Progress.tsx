import type { HTMLAttributes } from 'react';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  color?: 'primary' | 'accent' | 'success';
  height?: number;
}

const colorMap = {
  primary: 'bg-primary-800',
  accent: 'bg-accent-600',
  success: 'bg-success',
};

export function Progress({
  value,
  max = 100,
  color = 'primary',
  height = 6,
  className = '',
  ...rest
}: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={`w-full bg-neutral-100 rounded-full overflow-hidden ${className}`}
      style={{ height }}
      {...rest}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-slow ease-out-expo ${colorMap[color]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
