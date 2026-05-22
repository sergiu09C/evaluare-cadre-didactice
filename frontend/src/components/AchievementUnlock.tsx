import { useEffect, useMemo } from 'react';
import { TrophyIcon } from '@heroicons/react/24/solid';
import { Button } from './ui';

interface Props {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
}

function injectKeyframes() {
  if (document.getElementById('achievement-unlock-kf')) return;
  const style = document.createElement('style');
  style.id = 'achievement-unlock-kf';
  style.textContent = `
    @keyframes ach-fade-in { from { opacity: 0 } to { opacity: 1 } }
    @keyframes ach-pop {
      0% { opacity: 0; transform: scale(0.7) translateY(20px); }
      55% { opacity: 1; transform: scale(1.04) translateY(-2px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes badge-pulse {
      0%, 100% { box-shadow: 0 12px 40px rgba(124,58,237,.4), inset 0 1px 0 rgba(255,255,255,.4); }
      50%     { box-shadow: 0 16px 56px rgba(124,58,237,.6), inset 0 1px 0 rgba(255,255,255,.5); }
    }
    @keyframes ach-confetti {
      0%   { opacity: 0; transform: translate(0, 0) rotate(0deg); }
      10%  { opacity: 1; }
      100% { opacity: 0; transform: var(--tr) rotate(720deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .ach-overlay, .ach-card, .ach-badge, .ach-confetti { animation: none !important; }
    }
  `;
  document.head.appendChild(style);
}

export default function AchievementUnlock({ visible, title, description, onClose }: Props) {
  useEffect(() => { injectKeyframes(); }, []);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onClose, 6500); // auto-dismiss
    return () => clearTimeout(t);
  }, [visible, onClose]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        x: (Math.random() - 0.5) * 360,
        y: -120 - Math.random() * 80,
        rot: Math.random() * 360,
        delay: Math.random() * 0.3,
        color: ['#7C3AED', '#A78BFA', '#10B981', '#FBBF24', '#60A5FA'][i % 5],
        size: 6 + Math.random() * 5,
      })),
    [visible],
  );

  if (!visible) return null;

  return (
    <div
      className="ach-overlay fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(14,34,51,0.55)] backdrop-blur-md"
      style={{ animation: 'ach-fade-in 200ms ease-out' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ach-title"
    >
      <div
        className="ach-card relative w-[360px] p-9 bg-white rounded-2xl shadow-elev-5 text-center"
        style={{ animation: 'ach-pop 600ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti */}
        {confetti.map((c, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="ach-confetti absolute left-1/2 top-[90px] pointer-events-none"
            style={{
              width: c.size,
              height: c.size,
              background: c.color,
              borderRadius: i % 2 ? '50%' : '2px',
              ['--tr' as any]: `translate(${c.x}px, ${c.y}px)`,
              animation: `ach-confetti 1.4s cubic-bezier(0.16, 1, 0.3, 1) ${c.delay}s both`,
            }}
          />
        ))}

        {/* Badge */}
        <div
          className="ach-badge w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-white"
          style={{
            background: 'radial-gradient(circle at 30% 25%, #C4B5FD, #7C3AED 60%, #5B21B6)',
            boxShadow: '0 12px 40px rgba(124,58,237,.4), inset 0 1px 0 rgba(255,255,255,.4)',
            animation: 'badge-pulse 2s ease-in-out infinite',
          }}
        >
          <TrophyIcon className="w-10 h-10" aria-hidden="true" />
        </div>

        <div className="text-xs font-semibold text-accent-700 uppercase tracking-[0.08em] mb-2">
          Achievement deblocat
        </div>
        <h2 id="ach-title" className="font-display text-[26px] font-semibold tracking-tight text-neutral-800">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-[13px] text-neutral-500 leading-relaxed">{description}</p>
        )}

        <Button variant="accent" size="md" onClick={onClose} className="mt-6">
          Continuă
        </Button>
      </div>
    </div>
  );
}
