import { useEffect, useState } from 'react';
import { ClockIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface DeadlineTimerProps {
  deadline: string | null | undefined;
  /** Admin a oprit platforma din /admin/controls (is_active = 0).
   *  Când e true, afișăm „Platformă închisă" indiferent de deadline. */
  platformClosed?: boolean;
  variant?: 'inline' | 'card' | 'compact';
  className?: string;
}

function computeRemaining(deadline: string | null | undefined) {
  if (!deadline) return null;
  const target = new Date(deadline).getTime();
  if (isNaN(target)) return null;
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, expired: false };
}

export default function DeadlineTimer({
  deadline,
  platformClosed = false,
  variant = 'inline',
  className = '',
}: DeadlineTimerProps) {
  const [remaining, setRemaining] = useState(() => computeRemaining(deadline));

  useEffect(() => {
    setRemaining(computeRemaining(deadline));
    if (!deadline) return;
    const tick = setInterval(() => setRemaining(computeRemaining(deadline)), 60_000);
    return () => clearInterval(tick);
  }, [deadline]);

  // Dacă platforma e oprită manual, primează acest status — chiar și fără deadline.
  if (platformClosed) {
    if (variant === 'compact') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium text-danger-fg ${className}`}
          title="Platforma de evaluare este închisă din panoul de control"
        >
          <LockClosedIcon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Platformă închisă</span>
        </span>
      );
    }
    if (variant === 'card') {
      return (
        <div
          className={`rounded-xl border p-4 flex items-start gap-3 text-danger-fg bg-danger-bg border-red-200 ${className}`}
          role="status"
          aria-label="Platforma de evaluare este închisă"
        >
          <LockClosedIcon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wide mb-1">
              Platformă închisă
            </div>
            <div className="text-sm">
              Termenul-limită a trecut. Evaluările noi nu mai sunt acceptate.
            </div>
            {deadline && (
              <div className="text-xs opacity-80 mt-1">
                Deadline anunțat: {new Date(deadline).toLocaleString('ro-RO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>
        </div>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border text-danger-fg bg-danger-bg border-red-200 ${className}`}
        role="status"
        title="Termenul-limită a trecut și platforma este închisă"
      >
        <LockClosedIcon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Platformă închisă · termen trecut</span>
      </span>
    );
  }

  // Fără deadline și fără închidere manuală → nu afișăm nimic.
  if (!deadline || !remaining) return null;

  const isUrgent = !remaining.expired && remaining.days < 3;
  const tone = remaining.expired ? 'expired' : isUrgent ? 'urgent' : 'normal';
  const colorMap = {
    expired: 'text-danger-fg bg-danger-bg border-red-200',
    urgent: 'text-warning-fg bg-warning-bg border-amber-200',
    normal: 'text-info-fg bg-info-bg border-blue-200',
  };

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
          remaining.expired ? 'text-danger-fg' : isUrgent ? 'text-warning-fg' : 'text-neutral-500'
        } ${className}`}
        title={`Deadline: ${new Date(deadline).toLocaleString('ro-RO')}`}
      >
        <ClockIcon className="w-3.5 h-3.5" aria-hidden="true" />
        {remaining.expired ? (
          <span>Deadline expirat</span>
        ) : (
          <span>
            {remaining.days}z {remaining.hours}h {remaining.minutes}m
          </span>
        )}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`rounded-xl border p-4 flex items-start gap-3 ${colorMap[tone]} ${className}`}
        role="status"
        aria-label="Timp rămas până la deadline"
      >
        <ClockIcon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide mb-1">
            {remaining.expired ? 'Deadline expirat' : 'Timp rămas pentru evaluări'}
          </div>
          {!remaining.expired ? (
            <div className="font-display text-lg font-semibold">
              {remaining.days} {remaining.days === 1 ? 'zi' : 'zile'} · {remaining.hours}h · {remaining.minutes}m
            </div>
          ) : (
            <div className="text-sm">Termenul a trecut. Evaluările nu mai pot fi modificate.</div>
          )}
          <div className="text-xs opacity-80 mt-1">
            Deadline: {new Date(deadline).toLocaleString('ro-RO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorMap[tone]} ${className}`}
      role="status"
    >
      <ClockIcon className="w-3.5 h-3.5" aria-hidden="true" />
      {remaining.expired ? (
        <span>Deadline expirat</span>
      ) : (
        <span>
          Mai sunt <strong>{remaining.days}z {remaining.hours}h {remaining.minutes}m</strong>
        </span>
      )}
    </span>
  );
}
