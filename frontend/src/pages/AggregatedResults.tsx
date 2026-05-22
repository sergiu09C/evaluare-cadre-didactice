import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Badge, KPICard, EmptyState } from '../components/ui';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import type { ClosingLoopEntry } from '../types';

// Hard-coded reference data for the pilot (matching design mockup).
// In production these would come from a /api/platform/aggregated-results endpoint.
const DIMENSIONS = ['Predare', 'Comunicare', 'Resurse', 'Evaluare', 'Disponibilitate'];
const CURRENT_SEM = [3.85, 3.6, 3.4, 3.52, 3.48];
const PREV_SEM = [3.41, 3.22, 3.18, 3.15, 3.27];


export default function AggregatedResults() {
  const [participationRate, setParticipationRate] = useState<number | null>(null);
  const [changes, setChanges] = useState<ClosingLoopEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [stats, loop] = await Promise.all([
          api.getFeedbackStats().catch(() => null),
          api.getClosingLoop().catch(() => ({ entries: [] })),
        ]);
        setParticipationRate(stats?.faculty?.completionRate ?? 57);
        setChanges(loop.entries || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const avgCurrent = (CURRENT_SEM.reduce((a, b) => a + b, 0) / CURRENT_SEM.length).toFixed(2).replace('.', ',');
  const avgPrev = (PREV_SEM.reduce((a, b) => a + b, 0) / PREV_SEM.length).toFixed(2).replace('.', ',');
  const deltaPct = participationRate != null ? participationRate - 28 : 29;

  if (loading) {
    return (
      <div className="text-center py-16" role="status" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4" aria-hidden="true" />
        <div className="text-neutral-500">Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 max-w-[1280px]">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[30px] font-semibold tracking-tight text-neutral-800">
            Rezultate agregate
          </h1>
          <p className="mt-1.5 text-neutral-500 text-[15px]">
            Scorurile facultății și schimbările concrete inițiate pe baza evaluărilor.
          </p>
        </div>
        <Badge tone="info">Sem. II 2025/2026 · FAIMA</Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Scor mediu"
          value={avgCurrent}
          suffix="/ 5,00"
          delta={`+${(parseFloat(avgCurrent.replace(',', '.')) - parseFloat(avgPrev.replace(',', '.'))).toFixed(2).replace('.', ',')}`}
          trend="up"
          footnote={`anterior: ${avgPrev}`}
        />
        <KPICard
          label="Rata de participare"
          value={participationRate ?? 57}
          suffix="%"
          delta={`+${deltaPct} pp`}
          trend="up"
        />
        <KPICard label="Evaluări complete" value="1 423" delta="+612 față de sem. trecut" trend="up" />
        <KPICard label="Schimbări implementate" value={changes.length} footnote="în acest semestru" />
      </div>

      {/* Two-column: radar + changes summary */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* Radar */}
        <Card>
          <h3 className="text-base font-semibold">Scor mediu pe dimensiuni</h3>
          <p className="text-xs text-neutral-500 mt-1">Sem. II 2025/2026 vs. sem. I 2025/2026</p>
          <svg
            viewBox="-110 -110 220 220"
            className="w-full h-[260px] mt-2"
            aria-label="Grafic radar comparare scoruri pe 5 dimensiuni"
          >
            {[0, 1, 2, 3, 4].map((i) => {
              const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
              return (
                <line
                  key={i}
                  x1="0"
                  y1="0"
                  x2={Math.cos(a) * 85}
                  y2={Math.sin(a) * 85}
                  stroke="#D9DDE4"
                  strokeWidth="1"
                />
              );
            })}
            {[0.25, 0.5, 0.75, 1].map((s, j) => (
              <polygon
                key={j}
                fill="none"
                stroke="#D9DDE4"
                strokeWidth="1"
                points={[0, 1, 2, 3, 4]
                  .map((i) => {
                    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    return `${Math.cos(a) * 85 * s},${Math.sin(a) * 85 * s}`;
                  })
                  .join(' ')}
              />
            ))}
            {/* Previous semester */}
            <polygon
              points={PREV_SEM.map((v, i) => {
                const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const r = (v / 5) * 85;
                return `${Math.cos(a) * r},${Math.sin(a) * r}`;
              }).join(' ')}
              fill="rgba(143, 146, 163, .15)"
              stroke="#8A92A3"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            {/* Current semester */}
            <polygon
              points={CURRENT_SEM.map((v, i) => {
                const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const r = (v / 5) * 85;
                return `${Math.cos(a) * r},${Math.sin(a) * r}`;
              }).join(' ')}
              fill="rgba(124,58,237,.18)"
              stroke="#7C3AED"
              strokeWidth="1.8"
            />
            {CURRENT_SEM.map((v, i) => {
              const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
              const r = (v / 5) * 85;
              return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r="3" fill="#7C3AED" />;
            })}
            {DIMENSIONS.map((lbl, i) => {
              const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
              return (
                <text
                  key={i}
                  x={Math.cos(a) * 102}
                  y={Math.sin(a) * 102}
                  fill="#5F6878"
                  fontSize="9"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="Geist, sans-serif"
                  fontWeight="500"
                >
                  {lbl}
                </text>
              );
            })}
          </svg>
          <div className="flex gap-6 mt-3 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-2 rounded-sm" style={{ background: '#7C3AED' }} aria-hidden="true" />
              Sem. curent
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="w-3 h-2 rounded-sm border border-dashed"
                style={{ borderColor: '#8A92A3' }}
                aria-hidden="true"
              />
              Sem. anterior
            </span>
          </div>

          {/* Table of scores */}
          <table className="w-full mt-5 text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-neutral-400 border-b border-neutral-100">
                <th className="text-left font-medium py-2">Dimensiune</th>
                <th className="text-right font-medium py-2">Anterior</th>
                <th className="text-right font-medium py-2">Curent</th>
                <th className="text-right font-medium py-2">Δ</th>
              </tr>
            </thead>
            <tbody>
              {DIMENSIONS.map((d, i) => {
                const delta = CURRENT_SEM[i] - PREV_SEM[i];
                return (
                  <tr key={d} className="border-b border-neutral-100 last:border-0">
                    <td className="py-2.5 text-neutral-800 font-medium">{d}</td>
                    <td className="py-2.5 text-right text-neutral-500 font-mono">
                      {PREV_SEM[i].toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-2.5 text-right text-neutral-800 font-mono font-semibold">
                      {CURRENT_SEM[i].toFixed(2).replace('.', ',')}
                    </td>
                    <td
                      className={`py-2.5 text-right font-mono font-medium ${delta >= 0 ? 'text-success-fg' : 'text-danger-fg'}`}
                    >
                      {delta >= 0 ? '+' : ''}
                      {delta.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Closing-the-loop hero */}
        <Card
          padding="none"
          className="relative overflow-hidden text-white border-0"
          style={{ background: 'linear-gradient(135deg, #0E2233 0%, #1B3A57 100%)' }}
        >
          <svg
            className="absolute -right-[60px] -top-[40px] opacity-[0.12] pointer-events-none"
            width="320"
            height="320"
            viewBox="0 0 320 320"
            fill="none"
            stroke="#A78BFA"
            strokeWidth="0.7"
            aria-hidden="true"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <circle key={i} cx="160" cy="160" r={30 + i * 22} />
            ))}
          </svg>
          <div className="p-7 relative h-full flex flex-col gap-4">
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.04em] w-fit"
              style={{ background: 'rgba(196,181,253,.18)', color: '#C4B5FD' }}
            >
              Ați evaluat, noi am acționat
            </span>
            <h2 className="font-display text-[22px] font-semibold tracking-tight">
              {changes.length} schimbări concrete bazate pe evaluările tale
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.72)' }}>
              Vocea ta nu rămâne fără ecou. Mai jos vezi exact ce s-a schimbat la FAIMA pe baza
              feedback-ului tău și al colegilor — și la ce dimensiune a chestionarului
              corespunde fiecare schimbare.
            </p>
            <div className="mt-auto text-xs" style={{ color: 'rgba(255,255,255,.5)' }}>
              Actualizat 19 mai 2026 · publicat de CEAC FAIMA
            </div>
          </div>
        </Card>
      </div>

      {/* Changes list */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-neutral-800">Schimbări implementate</h2>
        {changes.length === 0 ? (
          <EmptyState
            title="Nu există schimbări publicate momentan"
            description="CEAC va publica aici schimbările pe baza evaluărilor tale după închiderea acestui ciclu de evaluare."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {changes.map((c) => (
              <Card key={c.id} className="flex gap-4 items-start">
                <span
                  className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                  style={{ background: c.dot_color }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-neutral-800">{c.title}</h3>
                    {c.related_dimension && <Badge tone="accent">{c.related_dimension}</Badge>}
                  </div>
                  <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">{c.body}</p>
                  <div className="text-xs text-neutral-400 mt-2">
                    Actualizat: {new Date(c.updated_at).toLocaleDateString('ro-RO')}
                  </div>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-neutral-300 shrink-0 mt-1.5" aria-hidden="true" />
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
