/* eslint-disable react-refresh/only-export-components */
// Ilustrații minimaliste line-art, paleta navy + violet (CSS vars din tokens).
// Toate au viewBox 240×180 pentru consistență. Doar cele EFECTIV folosite.

type Props = { className?: string };

const STROKE = 'var(--ecd-accent-400)';
const STROKE_SOFT = 'var(--ecd-border)';
const FILL = 'rgba(124, 58, 237, 0.06)';

export function IllInbox({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 240 180" className={className} fill="none" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="60" y="50" width="120" height="90" rx="8" fill={FILL} />
      <path d="M60 100 L100 100 L110 115 L130 115 L140 100 L180 100" />
      <path d="M60 95 L60 130 a8 8 0 0 0 8 8 L172 138 a8 8 0 0 0 8 -8 L180 95" />
      <line x1="80" y1="40" x2="80" y2="50" stroke={STROKE_SOFT} />
      <line x1="120" y1="35" x2="120" y2="50" stroke={STROKE_SOFT} />
      <line x1="160" y1="40" x2="160" y2="50" stroke={STROKE_SOFT} />
    </svg>
  );
}

export function IllBooks({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 240 180" className={className} fill="none" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="70" y="55" width="30" height="85" rx="2" fill={FILL} />
      <rect x="105" y="40" width="30" height="100" rx="2" fill={FILL} />
      <rect x="140" y="60" width="30" height="80" rx="2" fill={FILL} />
      <line x1="78" y1="70" x2="92" y2="70" stroke={STROKE_SOFT} />
      <line x1="113" y1="55" x2="127" y2="55" stroke={STROKE_SOFT} />
      <line x1="148" y1="75" x2="162" y2="75" stroke={STROKE_SOFT} />
    </svg>
  );
}

export function IllUsers({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 240 180" className={className} fill="none" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="120" cy="70" r="22" fill={FILL} />
      <path d="M80 140 a40 40 0 0 1 80 0" fill={FILL} />
      <circle cx="80" cy="80" r="14" fill={FILL} />
      <path d="M55 130 a25 25 0 0 1 50 0" fill={FILL} opacity="0.5" />
      <circle cx="160" cy="80" r="14" fill={FILL} />
      <path d="M135 130 a25 25 0 0 1 50 0" fill={FILL} opacity="0.5" />
    </svg>
  );
}
