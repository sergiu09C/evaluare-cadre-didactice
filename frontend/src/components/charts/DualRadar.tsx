import { useState } from 'react';

interface DualRadarProps {
  dimensions: string[];
  primary: number[];
  primaryLabel?: string;
  secondary?: number[];
  secondaryLabel?: string;
  size?: number;
  max?: number;
}

/**
 * Dual radar chart — suprapune două serii pe aceleași axe.
 * Folosit pentru comparație „tu vs. facultate" (Student) sau „curs vs. departament" (Profesor).
 */
export default function DualRadar({
  dimensions,
  primary,
  primaryLabel = 'Tu',
  secondary,
  secondaryLabel = 'Media facultății',
  size = 280,
  max = 5,
}: DualRadarProps) {
  const [hover, setHover] = useState<number | null>(null);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const labelR = size * 0.46;

  const pointAt = (value: number, angleRad: number) => {
    const radius = (value / max) * r;
    return [cx + Math.cos(angleRad) * radius, cy + Math.sin(angleRad) * radius];
  };

  const polygonPoints = (values: number[]) =>
    values
      .map((v, i) => {
        const a = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
        const [x, y] = pointAt(v, a);
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div style={{ width: size, height: size + 50 }} className="mx-auto">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Comparație scoruri pe 5 dimensiuni">
        {/* Concentric pentagons */}
        {[0.25, 0.5, 0.75, 1].map((s, idx) => (
          <polygon
            key={idx}
            fill="none"
            stroke="var(--ecd-border-soft)"
            strokeWidth="1"
            points={dimensions
              .map((_, i) => {
                const a = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
                return `${cx + Math.cos(a) * r * s},${cy + Math.sin(a) * r * s}`;
              })
              .join(' ')}
          />
        ))}

        {/* Axes */}
        {dimensions.map((_, i) => {
          const a = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + Math.cos(a) * r}
              y2={cy + Math.sin(a) * r}
              stroke="var(--ecd-border)"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Secondary polygon (background) */}
        {secondary && (
          <polygon
            points={polygonPoints(secondary)}
            fill="rgba(138, 146, 163, 0.18)"
            stroke="var(--ecd-neutral-400)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}
        {/* Primary polygon (front) */}
        <polygon
          points={polygonPoints(primary)}
          fill="rgba(124, 58, 237, 0.22)"
          stroke="var(--ecd-accent-600)"
          strokeWidth="1.8"
        />

        {/* Data points + hover targets */}
        {dimensions.map((_, i) => {
          const a = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
          const [px, py] = pointAt(primary[i], a);
          const [sx, sy] = secondary ? pointAt(secondary[i], a) : [0, 0];
          return (
            <g key={i}>
              {secondary && <circle cx={sx} cy={sy} r="3" fill="var(--ecd-neutral-400)" />}
              <circle cx={px} cy={py} r="3.5" fill="var(--ecd-accent-600)" />
              {/* Hover target */}
              <circle
                cx={cx + Math.cos(a) * r * 1.05}
                cy={cy + Math.sin(a) * r * 1.05}
                r="14"
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              />
            </g>
          );
        })}

        {/* Labels */}
        {dimensions.map((label, i) => {
          const a = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
          const lx = cx + Math.cos(a) * labelR;
          const ly = cy + Math.sin(a) * labelR;
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              fill="var(--ecd-text-soft)"
              fontSize="10"
              fontWeight="500"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="Geist, sans-serif"
            >
              {label}
            </text>
          );
        })}

        {/* Tooltip */}
        {hover != null && (
          <g>
            <rect
              x={cx - 60}
              y={cy + r + 20}
              width="120"
              height="40"
              rx="6"
              fill="var(--ecd-surface)"
              stroke="var(--ecd-border)"
            />
            <text x={cx} y={cy + r + 35} fill="var(--ecd-text)" fontSize="11" fontWeight="600" textAnchor="middle">
              {dimensions[hover]}
            </text>
            <text x={cx} y={cy + r + 50} fill="var(--ecd-text-soft)" fontSize="10" textAnchor="middle">
              {primaryLabel}: <tspan fill="var(--ecd-accent-600)" fontWeight="600">{primary[hover].toFixed(2).replace('.', ',')}</tspan>
              {secondary != null && (
                <>
                  {' · '}
                  {secondaryLabel}: {secondary[hover].toFixed(2).replace('.', ',')}
                </>
              )}
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-5 mt-2 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm" style={{ background: 'var(--ecd-accent-600)' }} aria-hidden="true" />
          {primaryLabel}
        </span>
        {secondary && (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-2 rounded-sm border border-dashed"
              style={{ borderColor: 'var(--ecd-neutral-400)' }}
              aria-hidden="true"
            />
            {secondaryLabel}
          </span>
        )}
      </div>
    </div>
  );
}
