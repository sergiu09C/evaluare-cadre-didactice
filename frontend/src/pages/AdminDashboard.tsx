/**
 * AdminDashboard — varianta SLIM (post-audit R1).
 * Conținut UNIC: tabel profesori cu filtre + sortare. KPI-urile generale → Acasă.
 */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card, Badge, Select, Input, EmptyState } from '../components/ui';
import { HomeIcon, ChartBarIcon, MagnifyingGlassIcon, ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

interface Professor {
  id: number;
  name: string;
  title: string | null;
  department: string | null;
  faculty: string;
  stats: {
    totalEvaluations: number;
    completedEvaluations: number;
    averageScore: number | null;
    isCritical?: boolean;
  };
}

type SortKey = 'name' | 'faculty' | 'department' | 'evaluations' | 'avg' | 'completion';

function scoreTone(score: number | null): 'success' | 'warning' | 'danger' | 'neutral' {
  if (score == null) return 'neutral';
  if (score >= 4) return 'success';
  if (score >= 3) return 'warning';
  return 'danger';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [profs, setProfs] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('avg');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    api
      .getAllProfessors()
      .then((d: any) => setProfs(d.professors || []))
      .finally(() => setLoading(false));
  }, []);

  const faculties = useMemo(() => {
    return [...new Set(profs.map((p) => p.faculty))].sort();
  }, [profs]);

  const filtered = useMemo(() => {
    let out = profs;
    if (faculty) out = out.filter((p) => p.faculty === faculty);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.department ?? '').toLowerCase().includes(q),
      );
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    out = [...out].sort((a, b) => {
      let av: any, bv: any;
      const aStats = a.stats || {};
      const bStats = b.stats || {};
      switch (sortKey) {
        case 'name':
          av = a.name ?? '';
          bv = b.name ?? '';
          break;
        case 'faculty':
          av = a.faculty;
          bv = b.faculty;
          break;
        case 'department':
          av = a.department ?? '';
          bv = b.department ?? '';
          break;
        case 'evaluations':
          av = aStats.totalEvaluations ?? 0;
          bv = bStats.totalEvaluations ?? 0;
          break;
        case 'avg':
          av = aStats.averageScore ?? -1;
          bv = bStats.averageScore ?? -1;
          break;
        case 'completion': {
          const aC = aStats.totalEvaluations
            ? (aStats.completedEvaluations / aStats.totalEvaluations) * 100
            : 0;
          const bC = bStats.totalEvaluations
            ? (bStats.completedEvaluations / bStats.totalEvaluations) * 100
            : 0;
          av = aC;
          bv = bC;
          break;
        }
      }
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return out;
  }, [profs, faculty, search, sortKey, sortDir]);

  const setSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir(key === 'name' || key === 'faculty' || key === 'department' ? 'asc' : 'desc');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600 mx-auto" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1280px]">
      <button
        onClick={() => navigate('/admin')}
        className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-800 self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1"
      >
        <HomeIcon className="w-3.5 h-3.5" aria-hidden="true" />
        Înapoi la Acasă
      </button>

      <div>
        <h1 className="font-display text-2xl md:text-[30px] font-semibold tracking-tight text-neutral-800 flex items-center gap-3">
          <ChartBarIcon className="w-7 h-7 md:w-8 md:h-8 text-accent-600 shrink-0" aria-hidden="true" />
          Tabel profesori
        </h1>
        <p className="mt-1.5 text-neutral-500 text-sm md:text-[15px] max-w-[760px]">
          Lista completă a cadrelor didactice cu medii și rate de completare. Click pe un profesor
          pentru drill-down. Pentru KPI-uri agregate platformă → vezi pagina <button
            onClick={() => navigate('/admin')}
            className="text-accent-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-0.5"
          >
            Acasă
          </button>.
        </p>
      </div>

      <Card>
        <div className="flex items-end gap-3 flex-wrap">
          <Select label="Facultate" value={faculty} onChange={(e) => setFaculty(e.target.value)} wrapperClassName="w-full sm:w-auto sm:min-w-[260px]">
            <option value="">Toate facultățile</option>
            {faculties.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
          <div className="flex-1 w-full sm:w-auto sm:min-w-[240px]">
            <Input
              label="Caută profesor sau departament"
              prefix={<MagnifyingGlassIcon className="w-4 h-4" />}
              placeholder="Ex: Vasile Popescu sau Robotică"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="Niciun profesor" description="Modifică filtrele sau căutarea." />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-neutral-25">
                <tr>
                  {(
                    [
                      ['name', 'Nume'],
                      ['faculty', 'Facultate'],
                      ['department', 'Departament'],
                      ['evaluations', 'Evaluări'],
                      ['avg', 'Medie'],
                      ['completion', 'Completare'],
                    ] as Array<[SortKey, string]>
                  ).map(([k, label]) => (
                    <th key={k} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      <button
                        type="button"
                        onClick={() => setSort(k)}
                        className="inline-flex items-center gap-1 hover:text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1"
                      >
                        {label}
                        {sortKey === k && (sortDir === 'asc' ? (
                          <ArrowUpIcon className="w-3 h-3" aria-hidden="true" />
                        ) : (
                          <ArrowDownIcon className="w-3 h-3" aria-hidden="true" />
                        ))}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const stats = p.stats || ({} as any);
                  const completionRate = stats.totalEvaluations
                    ? Math.round((stats.completedEvaluations / stats.totalEvaluations) * 100)
                    : 0;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-neutral-25 cursor-pointer transition-colors ${i < filtered.length - 1 ? 'border-b border-neutral-100' : ''}`}
                      onClick={() => navigate(`/admin/professor/${p.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-neutral-800">{p.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500">{p.faculty}</td>
                      <td className="px-4 py-3 text-sm text-neutral-500">{p.department}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700 tabular-nums">
                        {(stats.totalEvaluations ?? 0).toLocaleString('ro-RO')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={scoreTone(stats.averageScore ?? null)}>
                          {stats.averageScore != null
                            ? stats.averageScore.toFixed(2).replace('.', ',')
                            : '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 tabular-nums">
                        {completionRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-neutral-100 text-xs text-neutral-500">
            {filtered.length} profesor{filtered.length === 1 ? '' : 'i'} afișați
            {profs.length !== filtered.length && ` din ${profs.length} total`}
          </div>
        </Card>
      )}
    </div>
  );
}
