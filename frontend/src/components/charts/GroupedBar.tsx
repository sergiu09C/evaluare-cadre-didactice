import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  groupBy: string;
  splitBy: string;
  splits: string[]; // ex: ['1', '2'] pentru semestre
  data: Array<{ group: string; [k: string]: any }>;
  /** Ce să afișeze pe Y: 'avg' (default) sau 'n' (count) */
  metric?: 'avg' | 'n';
  height?: number;
  onBarClick?: (group: string, split: string) => void;
}

const PALETTE = ['#7C3AED', '#0E2233', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function GroupedBar({
  splitBy,
  splits,
  data,
  metric = 'avg',
  height = 280,
  onBarClick,
}: Props) {
  const chartData = useMemo(() => {
    return data.map((row) => {
      const out: any = { group: row.group };
      for (const s of splits) {
        out[`${splitBy} ${s}`] = row[`${metric}_${s}`] ?? 0;
        out[`__count_${s}`] = row[`n_${s}`] ?? 0;
      }
      return out;
    });
  }, [data, splits, splitBy, metric]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-neutral-500">
        Nu există date pentru combinația selectată.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
        onClick={(e: any) => {
          if (!onBarClick || !e?.activePayload?.[0]) return;
          const g = e.activePayload[0].payload.group;
          const series = e.activePayload[0].name;
          const split = String(series).replace(`${splitBy} `, '');
          onBarClick(g, split);
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ecd-border-soft)" />
        <XAxis dataKey="group" tick={{ fontSize: 11, fill: 'var(--ecd-text-soft)' }} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--ecd-text-soft)' }} domain={metric === 'avg' ? [0, 5] : ['auto', 'auto']} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--ecd-surface)',
            border: '1px solid var(--ecd-border)',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: any, name: any) => {
            const v = typeof value === 'number' ? (metric === 'avg' ? value.toFixed(2).replace('.', ',') : value.toLocaleString('ro-RO')) : value;
            return [v, name];
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        {splits.map((s, i) => (
          <Bar
            key={s}
            dataKey={`${splitBy} ${s}`}
            fill={PALETTE[i % PALETTE.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
