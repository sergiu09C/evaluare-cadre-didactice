import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Badge, LoadingState } from '../components/ui';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface KPI {
  value: any;
  unit?: string;
  target?: number;
  targetMin?: number;
  targetMax?: number;
  targetDirection?: string;
  label: string;
}

interface KPIData {
  process: Record<string, KPI>;
  output: Record<string, KPI>;
  impact: Record<string, KPI>;
}

function evalStatus(kpi: KPI): 'ok' | 'warn' | 'fail' | 'na' {
  if (kpi.value == null) return 'na';
  if (kpi.targetMin != null && kpi.targetMax != null) {
    const v = Number(kpi.value);
    if (v >= kpi.targetMin && v <= kpi.targetMax) return 'ok';
    if (v >= kpi.targetMin * 0.7 && v <= kpi.targetMax * 1.3) return 'warn';
    return 'fail';
  }
  if (kpi.target != null) {
    const v = typeof kpi.value === 'number' ? kpi.value : Number(kpi.value);
    if (isNaN(v)) return 'na';
    if (kpi.targetDirection === 'less') {
      if (v <= kpi.target) return 'ok';
      if (v <= kpi.target * 1.5) return 'warn';
      return 'fail';
    }
    // default: target = minim de atins
    if (v >= kpi.target) return 'ok';
    if (v >= kpi.target * 0.7) return 'warn';
    return 'fail';
  }
  return 'na';
}

function StatusBadge({ status }: { status: 'ok' | 'warn' | 'fail' | 'na' }) {
  if (status === 'ok') return <Badge tone="success">✓ Target atins</Badge>;
  if (status === 'warn') return <Badge tone="warning">⚠ Sub țintă</Badge>;
  if (status === 'fail') return <Badge tone="danger">✗ Departe de țintă</Badge>;
  return <Badge tone="neutral">— Necalculabil</Badge>;
}

function KPICard({ code, kpi }: { code: string; kpi: KPI }) {
  const status = evalStatus(kpi);
  let displayValue: string;
  if (Array.isArray(kpi.value)) {
    displayValue = kpi.value
      .map((x: any) => `${x.dim}=${x.avg ?? '—'}`)
      .join(' · ');
  } else if (kpi.value == null) {
    displayValue = '—';
  } else {
    displayValue = `${kpi.value}${kpi.unit ? ' ' + kpi.unit : ''}`;
  }
  const targetTxt = kpi.targetMin != null
    ? `${kpi.targetMin}-${kpi.targetMax}${kpi.unit ?? ''}`
    : kpi.target != null
      ? `${kpi.targetDirection === 'less' ? '≤' : '≥'} ${kpi.target}${kpi.unit ?? ''}`
      : '—';
  return (
    <Card padding="md" className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <Badge tone="accent">{code}</Badge>
        <StatusBadge status={status} />
      </div>
      <div className="text-xs text-neutral-500">{kpi.label}</div>
      <div className="text-2xl font-bold text-neutral-800 tabular-nums">{displayValue}</div>
      <div className="text-[11px] text-neutral-400">Țintă: {targetTxt}</div>
    </Card>
  );
}

export default function AdminKPIs() {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getAdminKPIs()
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || 'Eroare la încărcarea KPI'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Calculez cei 15 KPI..." />;
  if (error || !data)
    return (
      <Card tone="danger">
        <p>{error || 'Date indisponibile'}</p>
      </Card>
    );

  return (
    <div className="flex flex-col gap-7 max-w-[1280px]">
      <div>
        <h1 className="font-display text-[30px] font-semibold tracking-tight text-neutral-800 flex items-center gap-3">
          <ChartBarIcon className="w-8 h-8 text-accent-600" aria-hidden="true" />
          15 KPI instituționali
        </h1>
        <p className="mt-1.5 text-neutral-500 text-[15px] max-w-[720px]">
          Setul complet de indicatori-cheie de performanță conform Tabelul 3.2 al dizertației.
          Structurat pe trei niveluri: <strong>Process</strong> (P1-P5), <strong>Output</strong> (O1-O5),
          <strong> Impact</strong> (I1-I5).
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-neutral-800 mb-3">P. Indicatori de proces</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(data.process).map(([k, v]) => (
            <KPICard key={k} code={k} kpi={v} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-800 mb-3">O. Indicatori de output</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(data.output).map(([k, v]) => (
            <KPICard key={k} code={k} kpi={v} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-800 mb-3">I. Indicatori de impact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(data.impact).map(([k, v]) => (
            <KPICard key={k} code={k} kpi={v} />
          ))}
        </div>
      </section>
    </div>
  );
}
