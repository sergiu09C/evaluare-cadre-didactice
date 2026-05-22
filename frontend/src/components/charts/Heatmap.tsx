import { useMemo } from 'react';

interface Cell {
  row: string;
  col: string;
  n: number;
  avg: number | null;
}

interface Props {
  rowDim: string;
  colDim: string;
  rows: string[];
  cols: string[];
  cells: Cell[];
  /** Click handler — primește (rowValue, colValue, cell) */
  onCellClick?: (row: string, col: string, cell: Cell | null) => void;
  /** Modul de colorare: 'avg' (1=roșu, 5=verde) sau 'count' (gradient violet) */
  metric?: 'avg' | 'count';
  title?: string;
}

function colorForAvg(avg: number | null): string {
  if (avg == null) return 'var(--ecd-neutral-100)';
  // 1-2 roșu, 3 ambră, 4-5 verde — gradient continuu pe HSL
  if (avg < 2.5) return 'rgba(239, 68, 68, ' + Math.min(1, (3 - avg) / 2) + ')';
  if (avg < 3.5) return 'rgba(245, 158, 11, ' + Math.min(1, Math.abs(3 - avg) / 1.5 + 0.3) + ')';
  return 'rgba(16, 185, 129, ' + Math.min(1, (avg - 3) / 2) + ')';
}

function colorForCount(n: number, max: number): string {
  if (n === 0 || max === 0) return 'var(--ecd-neutral-100)';
  const t = Math.sqrt(n / max);
  return `rgba(124, 58, 237, ${0.1 + t * 0.85})`;
}

/**
 * Heatmap 2D — pure CSS grid, fără librării externe.
 * Suportă click pe celulă; tooltip nativ via `title`.
 */
export default function Heatmap({
  rowDim,
  colDim,
  rows,
  cols,
  cells,
  onCellClick,
  metric = 'avg',
  title,
}: Props) {
  const grid = useMemo(() => {
    const map = new Map<string, Cell>();
    for (const c of cells) map.set(`${c.row}|${c.col}`, c);
    return map;
  }, [cells]);

  const maxCount = useMemo(() => {
    return cells.reduce((m, c) => Math.max(m, c.n), 0);
  }, [cells]);

  if (rows.length === 0 || cols.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-neutral-500">
        Nu există date pentru combinația selectată.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" role="img" aria-label={title ?? `Heatmap ${rowDim} × ${colDim}`}>
      <table className="border-separate" style={{ borderSpacing: 4 }}>
        <thead>
          <tr>
            <th
              className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 text-right pr-2"
              style={{ minWidth: 120 }}
            >
              {rowDim} ↓ · {colDim} →
            </th>
            {cols.map((c) => (
              <th
                key={c}
                className="text-[11px] font-medium text-neutral-600 px-2 py-1 text-center"
                style={{ minWidth: 60 }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <th
                scope="row"
                className="text-[11px] font-medium text-neutral-600 text-right pr-2 truncate"
                style={{ maxWidth: 200 }}
                title={r}
              >
                {r.length > 22 ? r.slice(0, 20) + '...' : r}
              </th>
              {cols.map((c) => {
                const cell = grid.get(`${r}|${c}`) ?? null;
                const bg =
                  metric === 'avg' ? colorForAvg(cell?.avg ?? null) : colorForCount(cell?.n ?? 0, maxCount);
                const labelTxt =
                  metric === 'avg'
                    ? cell?.avg != null
                      ? cell.avg.toFixed(2).replace('.', ',')
                      : '—'
                    : cell != null
                      ? cell.n.toLocaleString('ro-RO')
                      : '—';
                return (
                  <td key={c} className="p-0">
                    <button
                      type="button"
                      onClick={() => onCellClick?.(r, c, cell)}
                      disabled={!cell || !onCellClick}
                      title={`${r} · ${c}\n${cell ? `${cell.n.toLocaleString('ro-RO')} evaluări · avg ${cell.avg?.toFixed(2).replace('.', ',') ?? '—'}` : 'fără date'}`}
                      className="w-full h-12 rounded-md text-[12px] font-semibold tabular-nums transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 disabled:cursor-default disabled:hover:scale-100"
                      style={{
                        background: bg,
                        color: cell?.avg != null && cell.avg < 2.5 ? 'white' : 'var(--ecd-text)',
                        minWidth: 60,
                      }}
                      aria-label={`${r}, ${c}: ${labelTxt}`}
                    >
                      {labelTxt}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-500">
        <span>Scală {metric === 'avg' ? 'medie 1-5' : 'număr evaluări'}:</span>
        {metric === 'avg' ? (
          <>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: 'rgba(239, 68, 68, 0.8)' }} aria-hidden="true" />
              slab
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: 'rgba(245, 158, 11, 0.7)' }} aria-hidden="true" />
              mediu
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: 'rgba(16, 185, 129, 0.9)' }} aria-hidden="true" />
              bun
            </span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: 'rgba(124, 58, 237, 0.15)' }} aria-hidden="true" />
              puține
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: 'rgba(124, 58, 237, 0.95)' }} aria-hidden="true" />
              multe
            </span>
          </>
        )}
      </div>
    </div>
  );
}
