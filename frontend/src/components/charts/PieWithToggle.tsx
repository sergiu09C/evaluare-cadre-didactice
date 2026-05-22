import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Slice {
  name: string;
  value: number;
  fill: string;
  meta?: any;
}

interface Props {
  data: Slice[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  onSliceClick?: (slice: Slice) => void;
  /** Toggle absolut/% — afișat ca buton mic în colț */
  showToggle?: boolean;
  /** Label pe slice — 'value', 'percent' sau 'name' */
  labelMode?: 'value' | 'percent' | 'name' | 'none';
}

export default function PieWithToggle({
  data,
  height = 240,
  innerRadius = 0,
  outerRadius = 90,
  onSliceClick,
  showToggle = true,
  labelMode = 'value',
}: Props) {
  const [mode, setMode] = useState<'abs' | 'pct'>('abs');
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  if (total === 0) {
    return (
      <div className="text-center py-6 text-sm text-neutral-500">
        Nu există date pentru această distribuție.
      </div>
    );
  }

  return (
    <div className="relative">
      {showToggle && (
        <div className="absolute right-0 top-0 z-10 inline-flex rounded-md border border-neutral-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setMode('abs')}
            aria-pressed={mode === 'abs'}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 ${
              mode === 'abs' ? 'bg-primary-800 text-white' : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            #
          </button>
          <button
            type="button"
            onClick={() => setMode('pct')}
            aria-pressed={mode === 'pct'}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 ${
              mode === 'pct' ? 'bg-primary-800 text-white' : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            %
          </button>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            onClick={(d: any) => onSliceClick?.(d as Slice)}
            label={(d: any) => {
              if (labelMode === 'none') return '';
              if (labelMode === 'name') return d.name;
              if (mode === 'pct') return `${Math.round((d.value / total) * 100)}%`;
              if (labelMode === 'percent') return `${Math.round((d.value / total) * 100)}%`;
              return d.value.toLocaleString('ro-RO');
            }}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} cursor={onSliceClick ? 'pointer' : 'default'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--ecd-surface)',
              border: '1px solid var(--ecd-border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: any, name: any) => {
              const n = typeof value === 'number' ? value : Number(value);
              if (mode === 'pct') return [`${((n / total) * 100).toFixed(1)}% (${n.toLocaleString('ro-RO')})`, name];
              return [`${n.toLocaleString('ro-RO')} (${((n / total) * 100).toFixed(1)}%)`, name];
            }}
          />
          <Legend verticalAlign="bottom" iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
