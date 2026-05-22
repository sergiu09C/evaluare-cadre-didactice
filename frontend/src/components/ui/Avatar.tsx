import type { HTMLAttributes } from 'react';

type Tone = 'primary' | 'accent' | 'neutral' | 'warm' | 'mint';

interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  initials: string;
  size?: number;
  tone?: Tone;
  status?: 'online' | 'offline';
}

const tonePalette: Record<Tone, [string, string]> = {
  primary: ['bg-primary-100', 'text-primary-700'],
  accent: ['bg-accent-100', 'text-accent-700'],
  neutral: ['bg-neutral-100', 'text-neutral-700'],
  warm: ['bg-[#FDE68A]', 'text-[#92400E]'],
  mint: ['bg-[#D1FAE5]', 'text-[#065F46]'],
};

export function Avatar({ initials, size = 36, tone = 'primary', status, className = '', ...rest }: AvatarProps) {
  const [bg, fg] = tonePalette[tone];
  const fontSize = Math.round(size * 0.4);
  const statusSize = Math.round(size * 0.3);
  return (
    <span
      className={`relative inline-flex shrink-0 ${className}`}
      style={{ width: size, height: size }}
      {...rest}
    >
      <span
        className={`inline-flex items-center justify-center rounded-full font-semibold tracking-tight font-display ${bg} ${fg}`}
        style={{ width: size, height: size, fontSize }}
        aria-hidden="true"
      >
        {initials}
      </span>
      {status && (
        <span
          className={`absolute -right-px -bottom-px rounded-full border-2 border-white ${
            status === 'online' ? 'bg-success' : 'bg-neutral-400'
          }`}
          style={{ width: statusSize, height: statusSize }}
        />
      )}
    </span>
  );
}
