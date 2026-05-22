import { useEffect, useState } from 'react';
import {
  TrophyIcon,
  CheckCircleIcon,
  CheckIcon,
  BoltIcon,
  SparklesIcon,
  FireIcon,
  FlagIcon,
  StarIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { Card, Badge, KPICard, Progress } from '../components/ui';
import type { Achievement, AchievementsResponse } from '../types';

type Tone = 'primary' | 'accent' | 'mint' | 'warm';

const TONE_GRADIENTS: Record<Tone, [string, string]> = {
  primary: ['#0E2233', '#1B3A57'],
  accent: ['#7C3AED', '#A78BFA'],
  mint: ['#10B981', '#34D399'],
  warm: ['#F59E0B', '#FBBF24'],
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: TrophyIcon,
  check: CheckIcon,
  bolt: BoltIcon,
  sparkle: SparklesIcon,
  fire: FireIcon,
  star: StarIcon,
  flag: FlagIcon,
};

function inferTone(_a: Achievement, index: number): Tone {
  // Cycle through tones based on index — design parity with mockup
  const cycle: Tone[] = ['accent', 'mint', 'warm', 'primary'];
  return cycle[index % cycle.length];
}

function inferIcon(a: Achievement): string {
  const id = a.id.toLowerCase();
  if (id.includes('streak') || id.includes('fire')) return 'fire';
  if (id.includes('complet')) return 'trophy';
  if (id.includes('fast') || id.includes('bolt')) return 'bolt';
  if (id.includes('detail') || id.includes('thoughtful')) return 'sparkle';
  if (id.includes('early') || id.includes('star')) return 'star';
  if (id.includes('flag') || id.includes('compass')) return 'flag';
  if (id.includes('first') || id.includes('check')) return 'check';
  return 'trophy';
}

function BadgeMedal({
  tone,
  iconKey,
  locked,
  large = false,
}: {
  tone: Tone;
  iconKey: string;
  locked: boolean;
  large?: boolean;
}) {
  const [c1, c2] = TONE_GRADIENTS[tone];
  const sz = large ? 84 : 56;
  const inner = large ? 28 : 22;
  const Icon = ICON_MAP[iconKey] || TrophyIcon;
  return (
    <div
      className="rounded-full flex items-center justify-center relative"
      style={{
        width: sz,
        height: sz,
        background: locked ? 'var(--ecd-neutral-100)' : `radial-gradient(circle at 30% 25%, ${c2}, ${c1})`,
        boxShadow: locked
          ? 'inset 0 0 0 1px var(--ecd-border)'
          : `inset 0 1px 0 rgba(255,255,255,.35), 0 8px 22px ${c1}40`,
        color: locked ? 'var(--ecd-neutral-400)' : '#fff',
        filter: locked ? 'grayscale(1)' : 'none',
      }}
      aria-hidden="true"
    >
      <span style={{ width: inner, height: inner }} className="inline-flex">
        <Icon className="w-full h-full" />
      </span>
      {locked && (
        <span
          className="absolute -right-1 -bottom-1 w-[22px] h-[22px] rounded-full bg-neutral-200 border-2 border-white flex items-center justify-center text-neutral-500"
        >
          <LockClosedIcon className="w-[11px] h-[11px]" />
        </span>
      )}
    </div>
  );
}

function AchievementCard({ a, index }: { a: Achievement; index: number }) {
  const locked = !a.earned;
  const tone = inferTone(a, index);
  const iconKey = inferIcon(a);
  return (
    <Card
      padding="md"
      className={`flex flex-col gap-3.5 relative overflow-hidden ${locked ? 'opacity-80' : ''}`}
    >
      <BadgeMedal tone={tone} iconKey={iconKey} locked={locked} />
      <div>
        <h4 className={`text-[15px] font-semibold ${locked ? 'text-neutral-500' : 'text-neutral-800'}`}>
          {a.title}
        </h4>
        <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">{a.description}</p>
      </div>
      <div className="mt-auto flex items-center justify-between text-[11px] text-neutral-400">
        {a.earned ? (
          <>
            <span className="inline-flex items-center gap-1 text-success-fg font-medium">
              <CheckCircleIcon className="w-3 h-3" aria-hidden="true" /> Deblocat
            </span>
            {a.earnedAt && (
              <span>
                {new Date(a.earnedAt).toLocaleDateString('ro-RO', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
          </>
        ) : (
          <span>În progres</span>
        )}
      </div>
    </Card>
  );
}

export default function Achievements() {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Folosim noul endpoint dinamic (dacă disponibil), cu fallback la cel vechi
    api
      .getDynamicAchievements()
      .then((d) =>
        setData({
          achievements: d.achievements.map((a) => ({
            id: a.key,
            title: a.title,
            description: a.description,
            icon: a.icon,
            earned: a.earned,
            earnedAt: a.earnedAt || undefined,
          })),
          progress: {
            allComplete: { current: d.totalBadges, total: d.totalPossible, percentage: d.totalPossible ? Math.round((d.totalBadges / d.totalPossible) * 100) : 0 },
            fastResponder: { current: 0, total: 1, percentage: 0 },
            detailedFeedback: { current: 0, total: 1, percentage: 0 },
          },
          totalBadges: d.totalBadges,
          totalPossible: d.totalPossible,
        } as any),
      )
      .catch(() =>
        api
          .getAchievements()
          .then(setData)
          .catch((e) => setError(e.response?.data?.error || 'Eroare la încărcare.')),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16" role="status" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4" aria-hidden="true" />
        <div className="text-neutral-500">Se încarcă...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-danger-bg">
        <p className="text-danger-fg" role="alert">
          {error || 'Date indisponibile.'}
        </p>
      </Card>
    );
  }

  const unlocked = data.achievements.filter((a) => a.earned);
  const locked = data.achievements.filter((a) => !a.earned);
  const latest = unlocked[0]; // most recent earned (API ordering)
  const latestTone = latest ? inferTone(latest, 0) : 'accent';
  const latestIcon = latest ? inferIcon(latest) : 'trophy';

  return (
    <div className="flex flex-col gap-7 max-w-[1280px]">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[30px] font-semibold tracking-tight text-neutral-800">
            Achievements
          </h1>
          <p className="mt-1.5 text-neutral-500 text-[15px]">
            Recunoaștere pentru participarea ta consistentă la procesul de evaluare.
          </p>
        </div>
      </div>

      {/* Hero — latest unlock */}
      {latest && (
        <Card
          padding="none"
          className="relative overflow-hidden text-white border-0"
          style={{ background: 'linear-gradient(135deg, #0E2233 0%, #1B3A57 50%, #4C1D95 100%)' }}
        >
          <svg
            className="absolute inset-0 opacity-15 pointer-events-none"
            viewBox="0 0 800 320"
            aria-hidden="true"
          >
            {Array.from({ length: 18 }).map((_, i) => (
              <circle key={i} cx={(i * 47) % 800} cy={(i * 91) % 320} r={1 + (i % 3)} fill="#C4B5FD" />
            ))}
          </svg>
          <div className="p-8 flex items-center gap-7 relative flex-wrap">
            <BadgeMedal tone={latestTone} iconKey={latestIcon} locked={false} large />
            <div className="flex-1 min-w-[280px]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#C4B5FD] mb-2">
                Cel mai recent deblocat
              </div>
              <h2 className="font-display text-[26px] font-semibold tracking-tight text-white">
                {latest.title}
              </h2>
              <p className="mt-1.5 text-sm max-w-[480px]" style={{ color: 'rgba(255,255,255,.72)' }}>
                {latest.description}
              </p>
              {latest.earnedAt && (
                <div className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,.6)' }}>
                  Deblocat{' '}
                  {new Date(latest.earnedAt).toLocaleDateString('ro-RO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className="text-[11px] uppercase tracking-[0.04em]"
                style={{ color: 'rgba(255,255,255,.55)' }}
              >
                Progres total
              </span>
              <div className="font-display text-4xl font-semibold tracking-tight">
                {unlocked.length}
                <span className="text-lg" style={{ color: 'rgba(255,255,255,.5)' }}>
                  /{data.totalPossible}
                </span>
              </div>
              <div className="w-[140px]">
                <Progress value={unlocked.length} max={data.totalPossible || 1} color="accent" height={6} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats row — derived from progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Toate complete"
          value={`${data.progress.allComplete.current}/${data.progress.allComplete.total}`}
          footnote={`${data.progress.allComplete.percentage}% progres`}
        />
        <KPICard
          label="Răspuns rapid"
          value={`${data.progress.fastResponder.current}/${data.progress.fastResponder.total}`}
          footnote={`${data.progress.fastResponder.percentage}% progres`}
        />
        <KPICard
          label="Feedback detaliat"
          value={`${data.progress.detailedFeedback.current}/${data.progress.detailedFeedback.total}`}
          footnote={`${data.progress.detailedFeedback.percentage}% progres`}
        />
        <KPICard
          label="Total badge-uri"
          value={`${data.totalBadges}/${data.totalPossible}`}
          delta={`${Math.round((data.totalBadges / Math.max(1, data.totalPossible)) * 100)}% deblocate`}
          trend="up"
        />
      </div>

      {/* Unlocked grid */}
      {unlocked.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-semibold text-neutral-800">Deblocate · {unlocked.length}</h2>
            <Badge tone="success" dot>
              Felicitări!
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map((a, i) => (
              <AchievementCard key={a.id} a={a} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Locked grid */}
      {locked.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-semibold text-neutral-800">În progres · {locked.length}</h2>
            <span className="text-[13px] text-neutral-500">
              Continuă să evaluezi pentru a le debloca
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((a, i) => (
              <AchievementCard key={a.id} a={a} index={unlocked.length + i} />
            ))}
          </div>
        </section>
      )}

      {/* Footer note */}
      <div className="p-4 rounded-xl bg-neutral-50 text-[13px] text-neutral-500 flex gap-3 items-start">
        <CheckCircleIcon className="w-[18px] h-[18px] mt-0.5 text-neutral-400 shrink-0" aria-hidden="true" />
        <span>
          <strong className="text-neutral-800">Despre achievements:</strong> sunt opționale și nu
          influențează evaluarea ta academică sau anonimitatea răspunsurilor.
        </span>
      </div>
    </div>
  );
}
