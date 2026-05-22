import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { TERMS } from '../i18n/glossary';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Card, Badge, KPICard, Select, MultiSelect } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import DualRadar from '../components/charts/DualRadar';
import Heatmap from '../components/charts/Heatmap';
import GroupedBar from '../components/charts/GroupedBar';
import TopNList from '../components/charts/TopNList';
import PieWithToggle from '../components/charts/PieWithToggle';
import {
  AcademicCapIcon,
  PencilSquareIcon,
  PaperAirplaneIcon,
  LightBulbIcon,
  HandRaisedIcon,
  CheckBadgeIcon,
  ArrowTrendingUpIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LabelList,
  LineChart,
  Cell,
  Line,
} from 'recharts';

type HomeStats = Awaited<ReturnType<typeof api.getHomeStats>>;
type FilterOpts = Awaited<ReturnType<typeof api.getPublicFilterOptions>>;
type Heatmap = Awaited<ReturnType<typeof api.getHeatmap>>;
type Grouped = Awaited<ReturnType<typeof api.getGroupedBar>>;
type TopRank = Awaited<ReturnType<typeof api.getTopRankings>>;
type Monthly = Awaited<ReturnType<typeof api.getTimeSeriesMonthly>>;

const STAGE_ICONS: Record<string, any> = {
  invite: AcademicCapIcon,
  draft: PencilSquareIcon,
  submitted: PaperAirplaneIcon,
  actions_proposed: LightBulbIcon,
  actions_in_progress: HandRaisedIcon,
  actions_completed: CheckBadgeIcon,
};

const SCORE_COLORS = ['#EF4444', '#F59E0B', '#FCD34D', '#84CC16', '#10B981'];
const SCORE_LABELS: Record<number, string> = {
  1: 'Foarte slab',
  2: 'Slab',
  3: 'Mediu',
  4: 'Bun',
  5: 'Excelent',
};
const ROLE_COLORS = { student: '#7C3AED', professor: '#0E2233', admin: '#10B981' };

// Filtre relevante per rol — un student NU vede „departament" sau „rol"
const FILTERS_PER_ROLE: Record<string, string[]> = {
  student: ['facultyId', 'programId', 'programLevel', 'year', 'semester', 'courseType', 'category'],
  professor: ['facultyId', 'departmentId', 'year', 'semester', 'courseType', 'category'],
  admin: [
    'facultyId',
    'programId',
    'programLevel',
    'departmentId',
    'year',
    'semester',
    'courseType',
    'category',
  ],
};

type FilterState = {
  facultyId?: string;
  programId?: string;
  programLevel?: string;
  departmentId?: string;
  year?: string;
  semester?: string;
  courseType?: string;
  category?: string;
  days: string;
};

const DEFAULT_FILTERS: FilterState = { days: '730' };

export default function EvaluationLifecycle() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const animate = !prefersReducedMotion;
  const [opts, setOpts] = useState<FilterOpts | null>(null);
  const [data, setData] = useState<HomeStats | null>(null);
  const [heatmap, setHeatmap] = useState<Heatmap | null>(null);
  const [grouped, setGrouped] = useState<Grouped | null>(null);
  const [topRank, setTopRank] = useState<TopRank | null>(null);
  const [bottomRank, setBottomRank] = useState<TopRank | null>(null);
  const [monthly, setMonthly] = useState<Monthly | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [heatmapRow, setHeatmapRow] = useState<'faculty' | 'program' | 'department'>('faculty');
  const [heatmapCol, setHeatmapCol] = useState<'category' | 'semester' | 'year' | 'courseType'>('category');
  // GDPR — student vede doar agregate (departamente); profesor vede dept + propriile cursuri
  const defaultTopEntity: 'professors' | 'courses' | 'departments' =
    user?.role === 'admin' ? 'professors' : user?.role === 'professor' ? 'courses' : 'departments';
  const [topEntity, setTopEntity] = useState<'professors' | 'courses' | 'departments'>(defaultTopEntity);
  const [topMetric, setTopMetric] = useState<'avg' | 'count'>('avg');

  const filters: FilterState = useMemo(() => {
    const out: FilterState = { days: searchParams.get('days') || DEFAULT_FILTERS.days };
    for (const k of ['facultyId', 'programId', 'programLevel', 'departmentId', 'year', 'semester', 'courseType', 'category'] as const) {
      const v = searchParams.get(k);
      if (v) out[k] = v;
    }
    return out;
  }, [searchParams]);

  // Tab activ: persistat în URL via ?tab=...
  type TabId = 'summary' | 'explore' | 'trend';
  const activeTab: TabId = ((): TabId => {
    const v = searchParams.get('tab');
    if (v === 'explore' || v === 'trend') return v;
    return 'summary';
  })();
  const setActiveTab = (t: TabId) => {
    const next = new URLSearchParams(searchParams);
    if (t === 'summary') next.delete('tab');
    else next.set('tab', t);
    setSearchParams(next, { replace: true });
  };

  const setFilter = useCallback(
    (k: keyof FilterState, v: string | undefined) => {
      const next = new URLSearchParams(searchParams);
      if (v && v !== '') next.set(k, v);
      else next.delete(k);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  /** Set multiple filtre atomic — pentru butoane care setează 2+ deodată. */
  const setFiltersBulk = useCallback(
    (changes: Partial<Record<keyof FilterState, string | undefined>>) => {
      const next = new URLSearchParams(searchParams);
      for (const [k, v] of Object.entries(changes)) {
        if (v && v !== '') next.set(k, v);
        else next.delete(k);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams({ days: DEFAULT_FILTERS.days }), { replace: true });
  }, [setSearchParams]);

  // load filter options once
  useEffect(() => {
    api.getPublicFilterOptions().then(setOpts);
  }, []);

  // load all charts when filters change
  useEffect(() => {
    let mounted = true;
    setRefreshing(true);
    const apiParams: any = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== '') {
        // year poate fi multi-value (CSV) — păstrez ca string dacă conține virgulă,
        // ca să nu producă NaN din Number("1,2")
        if (['facultyId', 'programId', 'days'].includes(k)) {
          const n = Number(v);
          if (!Number.isNaN(n)) apiParams[k] = n;
        } else if (k === 'year') {
          apiParams[k] = String(v).includes(',') ? v : Number(v);
        } else {
          apiParams[k] = v;
        }
      }
    }
    const isAdmin = user?.role === 'admin';
    Promise.all([
      api.getHomeStats(apiParams),
      api.getHeatmap({ ...apiParams, rowDim: heatmapRow, colDim: heatmapCol }),
      api.getGroupedBar({ ...apiParams, groupBy: 'faculty', splitBy: 'semester' }),
      api.getTopRankings({ ...apiParams, entity: topEntity, metric: topMetric, limit: 10, order: 'desc' }),
      api.getTimeSeriesMonthly({ ...apiParams, months: 36 }),
      // Pentru admin + entity=professors: și lista cu cei mai slabi (avg asc)
      isAdmin && topEntity === 'professors' && topMetric === 'avg'
        ? api.getTopRankings({ ...apiParams, entity: 'professors', metric: 'avg', limit: 10, order: 'asc' })
        : Promise.resolve(null),
    ])
      .then(([h, hm, gb, tr, ms, br]) => {
        if (!mounted) return;
        setData(h);
        setHeatmap(hm);
        setGrouped(gb);
        setTopRank(tr);
        setMonthly(ms);
        setBottomRank(br as TopRank | null);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [filters, heatmapRow, heatmapCol, topEntity, topMetric]);

  // derived data for charts
  const scoreData = useMemo(() => {
    if (!data) return [];
    return [1, 2, 3, 4, 5].map((s) => ({
      name: `${s} · ${SCORE_LABELS[s]}`,
      value: data.scoreDistribution[s] || 0,
      fill: SCORE_COLORS[s - 1],
    }));
  }, [data]);

  const facultyBarData = useMemo(() => {
    if (!data) return [];
    return data.facultyBreakdown.map((f) => ({
      name: f.code,
      fullName: f.faculty_name,
      faculty_id: f.faculty_id,
      evaluări: f.evaluations,
      medie: f.avg_score ?? 0,
    }));
  }, [data]);

  const timeSeriesData = useMemo(() => {
    if (!data) return [];
    return data.timeSeries.map((t) => ({
      day: t.day,
      shortDay: new Date(t.day).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' }),
      submissions: t.n,
    }));
  }, [data]);

  const monthlyData = useMemo(() => {
    if (!monthly?.data) return [];
    return monthly.data.map((m) => ({
      month: m.month,
      shortMonth: new Date(m.month + '-15').toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' }),
      submissions: m.submissions,
      medie: m.avg_score ?? 0,
    }));
  }, [monthly]);

  const roleData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Studenți', value: data.roleDistribution.student, fill: ROLE_COLORS.student },
      { name: 'Profesori', value: data.roleDistribution.professor, fill: ROLE_COLORS.professor },
      { name: 'Administratori', value: data.roleDistribution.admin, fill: ROLE_COLORS.admin },
    ];
  }, [data]);

  const myRole = user?.role ?? 'student';
  const relevantFilters = FILTERS_PER_ROLE[myRole] ?? FILTERS_PER_ROLE.student;

  // active chips — fără 'days' (e mereu setat)
  const activeChips = useMemo(() => {
    const chips: Array<{ key: keyof FilterState; label: string }> = [];
    if (filters.facultyId) {
      const f = opts?.faculties.find((x) => String(x.id) === filters.facultyId);
      chips.push({ key: 'facultyId', label: `Facultatea: ${f?.code ?? filters.facultyId}` });
    }
    if (filters.programId) {
      const p = opts?.programs.find((x) => String(x.id) === filters.programId);
      chips.push({ key: 'programId', label: `Program: ${p?.code ?? filters.programId}` });
    }
    if (filters.programLevel) chips.push({ key: 'programLevel', label: `Nivel: ${filters.programLevel}` });
    if (filters.departmentId) chips.push({ key: 'departmentId', label: `Departament: ${filters.departmentId}` });
    if (filters.year) chips.push({ key: 'year', label: `An: ${filters.year}` });
    if (filters.semester) chips.push({ key: 'semester', label: `Sem: ${filters.semester}` });
    if (filters.courseType) chips.push({ key: 'courseType', label: `Activitate: ${filters.courseType}` });
    if (filters.category) chips.push({ key: 'category', label: `Categorie: ${filters.category}` });
    return chips;
  }, [filters, opts]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600 mx-auto" aria-hidden="true" />
      </div>
    );
  }
  if (!data) return null;

  const totalPipeline = data.pipeline.reduce((s, p) => s + p.value, 0);
  // closing-loop = mesaje cu acțiune (answered + closed) / total mesaje
  const closingPct = (() => {
    const cl = data.closing_loop;
    const resolved = cl.messages_answered + (cl.messages_closed ?? 0);
    const total = cl.messages_total ?? cl.messages_open + cl.messages_answered;
    return total > 0 ? Math.round((resolved / total) * 100) : 0;
  })();

  return (
    <div className="flex flex-col gap-7 max-w-[1280px]">
      {/* HEADER */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[30px] font-semibold tracking-tight text-neutral-800">
            Acasă · Călătoria evaluării
          </h1>
          <p className="mt-1.5 text-neutral-500 text-[15px] max-w-[760px]">
            Dashboard complet: cifre platformă, distribuții, heatmap-uri, top-N rankings, trend
            lunar și impact personal. Folosește filtrele pentru a explora orice combinație.
          </p>
        </div>
        {refreshing && (
          <Badge tone="info">
            <span className="inline-block w-2 h-2 rounded-full bg-info animate-pulse mr-1.5" aria-hidden="true" />
            Actualizare...
          </Badge>
        )}
      </div>

      {/* STICKY FILTER BAR */}
      <div
        className="sticky z-20 -mx-10 px-10 py-3 border-b border-neutral-100 backdrop-blur"
        style={{ top: -32, background: 'rgba(255,255,255,0.92)' }}
      >
        <div className="flex items-end gap-3 flex-wrap">
          <FunnelIcon className="w-5 h-5 text-accent-600 mb-2.5" aria-hidden="true" />

          {relevantFilters.includes('facultyId') && opts && (
            <Select
              label="Facultate"
              value={filters.facultyId ?? ''}
              onChange={(e) => {
                const newFac = e.target.value || undefined;
                // Cascading: curăță program/department dacă nu aparțin facultății noi
                const changes: Partial<typeof filters> = { facultyId: newFac };
                if (newFac) {
                  if (filters.programId) {
                    const prog = opts.programs.find((p) => String(p.id) === filters.programId);
                    if (prog && String(prog.faculty_id) !== newFac) changes.programId = undefined;
                  }
                  if (filters.departmentId) {
                    const dept = opts.departments.find((d) => d.name === filters.departmentId);
                    if (dept && String(dept.faculty_id) !== newFac) changes.departmentId = undefined;
                  }
                }
                setFiltersBulk(changes);
              }}
              wrapperClassName="min-w-[160px]"
            >
              <option value="">Toate</option>
              {opts.faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code}
                </option>
              ))}
            </Select>
          )}

          {relevantFilters.includes('programId') && opts && (
            <Select
              label="Program"
              value={filters.programId ?? ''}
              onChange={(e) => {
                const newProgId = e.target.value || undefined;
                if (!newProgId) {
                  setFilter('programId', undefined);
                  return;
                }
                // Cascading predictibil: când selectez un program, sincronizez ÎNTOTDEAUNA
                // programLevel cu nivelul programului ales. Așa user-ul nu mai trebuie să
                // și-l potrivească manual și se elimină starea inconsistentă
                // (ex: programId=AIA-licenta + programLevel=master).
                const prog = opts.programs.find((p) => String(p.id) === newProgId);
                if (prog) {
                  setFiltersBulk({ programId: newProgId, programLevel: prog.level });
                } else {
                  setFilter('programId', newProgId);
                }
              }}
              wrapperClassName="min-w-[160px]"
            >
              <option value="">Toate</option>
              {opts.programs
                .filter((p) => !filters.facultyId || String(p.faculty_id) === filters.facultyId)
                .filter((p) => !filters.programLevel || p.level === filters.programLevel)
                .filter(
                  (p) =>
                    !filters.departmentId ||
                    (p.departments && p.departments.includes(filters.departmentId)),
                )
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} ({p.level})
                  </option>
                ))}
            </Select>
          )}

          {relevantFilters.includes('programLevel') && opts && (
            <Select
              label="Nivel"
              value={filters.programLevel ?? ''}
              onChange={(e) => {
                const newLvl = e.target.value || undefined;
                if (!newLvl) {
                  setFilter('programLevel', undefined);
                  return;
                }
                // Cascading: dacă programId curent are alt nivel, curăță-l.
                // Plus year=3 e invalid pentru master (master are doar 1-2).
                const conflicts: Partial<typeof filters> = { programLevel: newLvl };
                if (filters.programId) {
                  const prog = opts.programs.find((p) => String(p.id) === filters.programId);
                  if (prog && prog.level !== newLvl) conflicts.programId = undefined;
                }
                if (newLvl === 'master' && filters.year === '3') {
                  conflicts.year = undefined;
                }
                setFiltersBulk(conflicts);
              }}
              wrapperClassName="min-w-[120px]"
            >
              <option value="">Toate</option>
              {opts.levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          )}

          {relevantFilters.includes('departmentId') && opts && (
            <Select
              label="Departament"
              value={filters.departmentId ?? ''}
              onChange={(e) => {
                const newDept = e.target.value || undefined;
                if (!newDept) {
                  setFilter('departmentId', undefined);
                  return;
                }
                // Cascading: dacă programId curent nu e servit de acest departament, curăță-l
                if (filters.programId) {
                  const dept = opts.departments.find((d) => d.name === newDept);
                  if (
                    dept &&
                    dept.programs &&
                    !dept.programs.includes(Number(filters.programId))
                  ) {
                    setFiltersBulk({ departmentId: newDept, programId: undefined });
                    return;
                  }
                }
                setFilter('departmentId', newDept);
              }}
              wrapperClassName="min-w-[160px]"
            >
              <option value="">Toate</option>
              {opts.departments
                .filter((d) => !filters.facultyId || String(d.faculty_id) === filters.facultyId)
                .filter(
                  (d) =>
                    !filters.programId ||
                    (d.programs && d.programs.includes(Number(filters.programId))),
                )
                .map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
            </Select>
          )}

          {relevantFilters.includes('year') && opts && (
            <MultiSelect
              label="Anul"
              wrapperClassName="min-w-[140px]"
              placeholder="Toți anii"
              value={(filters.year ?? '').split(',').filter(Boolean)}
              onChange={(arr) => setFilter('year', arr.length ? arr.join(',') : undefined)}
              options={opts.years
                .filter((y) => !(filters.programLevel === 'master' && y === 3))
                .map((y) => ({ value: String(y), label: `Anul ${y}` }))}
            />
          )}

          {relevantFilters.includes('semester') && opts && (
            <MultiSelect
              label="Sem"
              wrapperClassName="min-w-[120px]"
              placeholder="Toate semestrele"
              value={(filters.semester ?? '').split(',').filter(Boolean)}
              onChange={(arr) => setFilter('semester', arr.length ? arr.join(',') : undefined)}
              options={opts.semesters.map((s) => ({ value: String(s), label: `Sem ${s}` }))}
            />
          )}

          {relevantFilters.includes('courseType') && opts && (
            <MultiSelect
              label="Activitate"
              wrapperClassName="min-w-[150px]"
              placeholder="Toate activitățile"
              value={(filters.courseType ?? '').split(',').filter(Boolean)}
              onChange={(arr) => setFilter('courseType', arr.length ? arr.join(',') : undefined)}
              options={opts.courseTypes.map((t) => ({ value: t, label: t }))}
            />
          )}

          {relevantFilters.includes('category') && opts && (
            <Select
              label="Categorie"
              value={filters.category ?? ''}
              onChange={(e) => setFilter('category', e.target.value || undefined)}
              wrapperClassName="min-w-[140px]"
            >
              <option value="">Toate</option>
              {opts.categories
                .filter((c) => !['puncte_forte', 'imbunatatiri', 'altele'].includes(c))
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </Select>
          )}

        </div>

        {activeChips.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wide text-neutral-400 mr-1">Active:</span>
            {activeChips.map((ch) => (
              <Badge key={ch.key} tone="accent">
                {ch.label}
                <button
                  onClick={() => setFilter(ch.key, undefined)}
                  className="ml-1 hover:bg-accent-100 rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                  aria-label={`Elimină filtrul ${ch.label}`}
                >
                  <XMarkIcon className="w-3 h-3" aria-hidden="true" />
                </button>
              </Badge>
            ))}
            <button
              type="button"
              onClick={resetFilters}
              className="text-[12px] text-accent-600 font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1 ml-1"
            >
              Resetează tot
            </button>
          </div>
        )}
      </div>

      {/* Warning empty-result când filtrele dau 0 evaluări */}
      {activeChips.length > 0 && data.hero.totalEvaluations === 0 && (
        <div className="bg-warning-bg border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <span
            className="w-2 h-2 rounded-full mt-2 shrink-0"
            style={{ background: 'var(--ecd-warning)' }}
            aria-hidden="true"
          />
          <div className="flex-1 text-sm">
            <strong className="text-warning-fg">Combinație fără date.</strong>{' '}
            <span className="text-neutral-700">
              Nicio evaluare nu match-uiește toate filtrele aplicate. Verifică că combinația e
              posibilă (ex: nivel <em>master</em> + anul <em>3</em> nu există — master e 1-2 ani).
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="ml-2 text-accent-600 hover:underline font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1"
            >
              Resetează filtrele →
            </button>
          </div>
        </div>
      )}

      {/* Butoane context: „Situația facultății mele" + „Situația mea" (profesor) */}
      {(data.myFacultyId != null || data.myDepartment != null) && (
        <div className="flex items-center gap-2 flex-wrap -mb-3">
          {data.myFacultyId != null && String(filters.facultyId) !== String(data.myFacultyId) && (
            <button
              type="button"
              onClick={() =>
                setFiltersBulk({
                  facultyId: String(data.myFacultyId),
                  // pentru profesor curăț și departamentul ca să nu rămână din altă facultate;
                  // pentru student/admin nu schimb departamentul (poate filtra după el deja)
                  ...(myRole === 'professor' ? { departmentId: undefined } : {}),
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-accent-400/40 bg-accent-50 text-accent-700 font-semibold text-sm hover:bg-accent-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40"
            >
              <AcademicCapIcon className="w-4 h-4" aria-hidden="true" />
              Situația facultății mele — {data.myFacultyName}
            </button>
          )}
          {/* Profesor: buton „Situația mea" navighează la pagina dedicată /professor/dashboard
              (filtrele de pe Acasă nu pot acoperi toate scenariile — ex. studenții din 2 ani diferiți).
              Pagina dedicată are pipeline + KPI + cursuri personale. */}
          {myRole === 'professor' && data.myDepartment != null && (
            <button
              type="button"
              onClick={() => navigate('/professor/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-300 bg-primary-50 text-primary-800 font-semibold text-sm hover:bg-primary-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40"
            >
              <FunnelIcon className="w-4 h-4" aria-hidden="true" />
              Situația mea completă →
            </button>
          )}
          {(filters.facultyId || filters.departmentId) && (
            <div className="inline-flex items-center gap-2 text-sm text-neutral-600">
              <button
                type="button"
                onClick={() => setFiltersBulk({ facultyId: undefined, departmentId: undefined })}
                className="text-[12px] text-accent-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1"
              >
                Vezi întreaga platformă →
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB NAV — 3 secțiuni: Sumar / Explorează / Trend */}
      <div
        role="tablist"
        aria-label="Secțiuni dashboard"
        className="flex gap-1 border-b border-neutral-100 -mb-2"
      >
        {(
          [
            ['summary', 'Sumar', 'Cifre platformă + impact personal'],
            ['explore', 'Explorează', 'Filtre + grafice + heatmap + top-N'],
            ['trend', 'Trend', 'Evoluție în timp + radar'],
          ] as Array<[TabId, string, string]>
        ).map(([id, label, desc]) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${id}`}
              id={`tab-${id}`}
              onClick={() => setActiveTab(id)}
              title={desc}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 ${
                isActive
                  ? 'border-accent-600 text-accent-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* TAB PANEL: SUMAR */}
      {activeTab === 'summary' && (
      <>
      {/* HERO KPIs — rândul 1 (cifre platformă); responsive break-uri progresive */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8 gap-3" id="panel-summary" role="tabpanel" aria-labelledby="tab-summary">
        <KPICard
          label="Studenți activi pe platformă"
          value={(data.hero.studentsWithRemaining ?? data.hero.eligibleStudents).toLocaleString('ro-RO')}
          footnote={(() => {
            const total = data.hero.eligibleStudents;
            const remaining = data.hero.studentsWithRemaining ?? total;
            const completed = data.hero.studentsCompletedAll ?? 0;
            const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
            return `${remaining} din ${total} eligibili (${pct}%) · ${completed} au completat tot`;
          })()}
        />
        <KPICard
          label="Cadre didactice"
          value={data.hero.totalProfessors.toLocaleString('ro-RO')}
          footnote={
            activeChips.length > 0
              ? 'predau în scope-ul filtrelor'
              : 'cu discipline asignate în an academic'
          }
        />
        <KPICard
          label="Max. evaluări posibile"
          value={data.hero.maxPossibleEvaluations.toLocaleString('ro-RO')}
          footnote="activități × studenți/grupă"
        />
        <KPICard
          label="Evaluări transmise"
          value={data.hero.totalEvaluations.toLocaleString('ro-RO')}
          footnote={`din ${data.hero.maxPossibleEvaluations.toLocaleString('ro-RO')} posibile (${
            data.hero.maxPossibleEvaluations > 0
              ? Math.round((data.hero.totalEvaluations / data.hero.maxPossibleEvaluations) * 100)
              : 0
          }%)`}
        />
        <KPICard
          label="Scor mediu"
          value={data.hero.overallAvg != null ? data.hero.overallAvg.toFixed(2).replace('.', ',') : '—'}
          suffix={data.hero.overallAvg != null ? '/ 5' : ''}
          footnote={
            data.hero.overallAvg != null
              ? `notă echivalent ${(data.hero.overallAvg * 2).toFixed(2).replace('.', ',')}/10`
              : undefined
          }
        />
        <KPICard
          label="Participare evaluări"
          value={`${data.participation.university.rate}%`}
          footnote={`${data.participation.university.evaluated.toLocaleString('ro-RO')} din ${data.participation.university.eligible.toLocaleString('ro-RO')} evaluări transmise`}
        />
        <KPICard
          label="Acțiuni CEAC"
          value={(
            (data.actionsTotal.proposed || 0) +
            (data.actionsTotal.accepted || 0) +
            (data.actionsTotal.completed || 0) +
            (data.actionsTotal.rejected || 0)
          ).toLocaleString('ro-RO')}
          footnote={`${data.actionsTotal.completed} finalizate · ${data.actionsTotal.proposed} de aprobat`}
        />
        <KPICard
          label="Mesaje closing-loop"
          value={data.closing_loop.messages_total ?? data.closing_loop.messages_open + data.closing_loop.messages_answered}
          footnote={`${data.closing_loop.messages_answered + (data.closing_loop.messages_closed ?? 0)} rezolvate · ${data.closing_loop.messages_open} deschise`}
        />
      </div>

      {/* RATE PARTICIPARE — 3 niveluri (universitate / facultate / personal pentru profesor) */}
      <Card>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-neutral-800">Rate de participare</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Câți studenți au transmis cel puțin o evaluare, raportat la cei care puteau evalua.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Universitate */}
          {(() => {
            const u = data.participation.university;
            const tone =
              u.rate >= 80 ? 'var(--ecd-success)' : u.rate >= 50 ? 'var(--ecd-warning)' : 'var(--ecd-danger)';
            return (
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-semibold text-neutral-700">Universitate</span>
                  <span className="text-2xl font-bold text-neutral-800 tabular-nums">{u.rate}%</span>
                </div>
                <div
                  className="w-full h-2.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--ecd-border-soft)' }}
                  role="progressbar"
                  aria-valuenow={u.rate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full transition-all duration-700" style={{ width: `${u.rate}%`, background: tone }} />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1.5">
                  <strong>{u.evaluated.toLocaleString('ro-RO')}</strong> studenți au evaluat din{' '}
                  <strong>{u.eligible.toLocaleString('ro-RO')}</strong> eligibili (total platformă)
                </p>
              </div>
            );
          })()}

          {/* Facultate (a userului sau selectată via filtru) */}
          {data.participation.faculty &&
            (() => {
              const f = data.participation.faculty!;
              const tone =
                f.rate >= 80 ? 'var(--ecd-success)' : f.rate >= 50 ? 'var(--ecd-warning)' : 'var(--ecd-danger)';
              return (
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm font-semibold text-neutral-700 truncate" title={f.faculty_name}>
                      {f.faculty_name.replace('Facultatea de ', '')}
                    </span>
                    <span className="text-2xl font-bold text-neutral-800 tabular-nums">{f.rate}%</span>
                  </div>
                  <div
                    className="w-full h-2.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--ecd-border-soft)' }}
                    role="progressbar"
                    aria-valuenow={f.rate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="h-full transition-all duration-700" style={{ width: `${f.rate}%`, background: tone }} />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1.5">
                    <strong>{f.evaluated.toLocaleString('ro-RO')}</strong> au evaluat din{' '}
                    <strong>{f.eligible.toLocaleString('ro-RO')}</strong> eligibili (facultate)
                  </p>
                </div>
              );
            })()}

          {/* Personal — doar profesor */}
          {data.participation.me &&
            (() => {
              const m = data.participation.me!;
              const tone =
                m.rate >= 80 ? 'var(--ecd-success)' : m.rate >= 50 ? 'var(--ecd-warning)' : 'var(--ecd-danger)';
              return (
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm font-semibold text-neutral-700">Te-au evaluat pe tine</span>
                    <span className="text-2xl font-bold text-neutral-800 tabular-nums">{m.rate}%</span>
                  </div>
                  <div
                    className="w-full h-2.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--ecd-border-soft)' }}
                    role="progressbar"
                    aria-valuenow={m.rate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="h-full transition-all duration-700" style={{ width: `${m.rate}%`, background: tone }} />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1.5">
                    <strong>{m.evaluated.toLocaleString('ro-RO')}</strong> studenți te-au evaluat din{' '}
                    <strong>{m.eligible.toLocaleString('ro-RO')}</strong> care puteau (cursurile tale)
                  </p>
                </div>
              );
            })()}
        </div>
      </Card>
      </>
      )}

      {/* TAB PANEL: EXPLOREAZĂ */}
      {activeTab === 'explore' && (
      <div id="panel-explore" role="tabpanel" aria-labelledby="tab-explore" className="flex flex-col gap-7">
      {/* PIE + DONUT + BAR FACULTATE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-neutral-800">Distribuție scoruri</h2>
            <Badge tone="neutral">{scoreData.reduce((s, d) => s + d.value, 0).toLocaleString('ro-RO')} răsp.</Badge>
          </div>
          <PieWithToggle data={scoreData} height={240} labelMode="value" />
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-neutral-800 mb-3">Roluri active</h2>
          <PieWithToggle data={roleData} height={240} innerRadius={45} outerRadius={80} labelMode="value" />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-neutral-800">Evaluări per facultate</h2>
            <Badge tone="neutral">click → filtru</Badge>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={facultyBarData}
              margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
              onClick={(e: any) => {
                if (e?.activePayload?.[0]?.payload) {
                  const fid = e.activePayload[0].payload.faculty_id;
                  setFilter('facultyId', String(fid));
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ecd-border-soft)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ecd-text-soft)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--ecd-text-soft)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--ecd-surface)',
                  border: '1px solid var(--ecd-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(_, payload: any) => payload?.[0]?.payload?.fullName ?? ''}
              />
              <Bar dataKey="evaluări" fill="#7C3AED" radius={[4, 4, 0, 0]} cursor="pointer" isAnimationActive={animate}>
                <LabelList dataKey="evaluări" position="top" style={{ fontSize: 10, fill: 'var(--ecd-text-soft)' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      </div>
      )}

      {/* TAB PANEL: TREND */}
      {activeTab === 'trend' && (
      <div id="panel-trend" role="tabpanel" aria-labelledby="tab-trend" className="flex flex-col gap-7">
      {/* TIME SERIES + MONTHLY LINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-accent-600" aria-hidden="true" />
              Submisii zilnice — {filters.days} zile
            </h2>
            <Badge tone="accent">{timeSeriesData.length} zile cu activitate</Badge>
          </div>
          {timeSeriesData.length === 0 ? (
            <p className="text-sm text-neutral-500 py-12 text-center">
              Nu există submisii în intervalul selectat. Mărește slider-ul.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={timeSeriesData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ecd-border-soft)" />
                <XAxis dataKey="shortDay" tick={{ fontSize: 10, fill: 'var(--ecd-text-soft)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--ecd-text-soft)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--ecd-surface)',
                    border: '1px solid var(--ecd-border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(_, payload: any) => payload?.[0]?.payload?.day ?? ''}
                />
                <Area isAnimationActive={animate} type="monotone" dataKey="submissions" stroke="#7C3AED" strokeWidth={2} fill="url(#colorSubmissions)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-neutral-800">Trend lunar — submisii & medie</h2>
            <Badge tone="neutral">{monthlyData.length} luni</Badge>
          </div>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-neutral-500 py-12 text-center">Nu există date lunare.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ecd-border-soft)" />
                <XAxis dataKey="shortMonth" tick={{ fontSize: 10, fill: 'var(--ecd-text-soft)' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'var(--ecd-text-soft)' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 10, fill: 'var(--ecd-text-soft)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--ecd-surface)',
                    border: '1px solid var(--ecd-border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line isAnimationActive={animate} yAxisId="left" type="monotone" dataKey="submissions" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} name="Submisii" />
                <Line isAnimationActive={animate} yAxisId="right" type="monotone" dataKey="medie" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Medie (1-5)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* GROUPED BAR + RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-neutral-800">Comparație sem1 vs sem2 per facultate</h2>
            <Badge tone="neutral">grouped bar</Badge>
          </div>
          {grouped && (
            <GroupedBar
              groupBy={grouped.groupBy}
              splitBy={grouped.splitBy}
              splits={grouped.splits}
              data={grouped.data}
              metric="avg"
              height={240}
            />
          )}
        </Card>

        {data.categoryAverages.length >= 3 && (
          <Card>
            <h2 className="text-base font-semibold text-neutral-800 mb-1">Radar pe dimensiuni</h2>
            <p className="text-xs text-neutral-500 mb-3">
              Performanță agregată pe categoriile de întrebări Likert.
            </p>
            <DualRadar
              dimensions={data.categoryAverages.map((c) => c.category)}
              primary={data.categoryAverages.map((c) => c.avg ?? 0)}
              primaryLabel={activeChips.length > 0 ? 'Filtrat' : 'Platformă'}
              size={280}
            />
          </Card>
        )}
      </div>
      </div>
      )}

      {/* TAB PANEL: EXPLOREAZĂ (partea 2 — breakdowns + heatmap + top-N) */}
      {activeTab === 'explore' && (
      <div role="tabpanel" aria-labelledby="tab-explore" className="flex flex-col gap-7">
      {/* Breakdowns: evaluări per an, per ciclu, acțiuni */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Evaluări per an */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-neutral-800">Evaluări per an de studiu</h2>
            <Badge tone="neutral">{data.evalsByYear.reduce((s, e) => s + e.n, 0).toLocaleString('ro-RO')} total</Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.evalsByYear.map((e) => ({ year: `Anul ${e.year}`, n: e.n, year_value: e.year }))}
              margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
              onClick={(e: any) => {
                const y = e?.activePayload?.[0]?.payload?.year_value;
                if (y) setFilter('year', String(y));
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ecd-border-soft)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--ecd-text-soft)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--ecd-text-soft)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--ecd-surface)',
                  border: '1px solid var(--ecd-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="n" fill="#7C3AED" radius={[4, 4, 0, 0]} cursor="pointer" isAnimationActive={animate}>
                <LabelList dataKey="n" position="top" style={{ fontSize: 10, fill: 'var(--ecd-text-soft)' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Evaluări per ciclu */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-neutral-800">Evaluări per ciclu studii</h2>
            <Badge tone="neutral">licență vs master</Badge>
          </div>
          <PieWithToggle
            data={data.evalsByLevel.map((l) => ({
              name: l.level === 'licenta' ? 'Licență' : l.level === 'master' ? 'Master' : l.level,
              value: l.n,
              fill: l.level === 'licenta' ? '#7C3AED' : '#10B981',
              meta: l,
            }))}
            height={220}
            innerRadius={45}
            outerRadius={80}
            labelMode="percent"
            onSliceClick={(slice: any) => {
              const lvl = slice.meta?.level;
              if (lvl) setFilter('programLevel', lvl);
            }}
          />
          <div className="flex justify-center gap-4 text-[11px] text-neutral-500 mt-2">
            {data.evalsByLevel.map((l) => (
              <span key={l.level}>
                {l.level === 'licenta' ? 'Licență' : 'Master'}: medie{' '}
                <strong>{l.avg != null ? l.avg.toFixed(2).replace('.', ',') : '—'}</strong>
              </span>
            ))}
          </div>
        </Card>

        {/* Acțiuni breakdown */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-neutral-800">Acțiuni CEAC</h2>
            <Badge tone="accent">
              {(
                (data.actionsTotal.proposed || 0) +
                (data.actionsTotal.accepted || 0) +
                (data.actionsTotal.completed || 0) +
                (data.actionsTotal.rejected || 0)
              ).toLocaleString('ro-RO')}{' '}
              total
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[
                { status: 'Propuse', n: data.actionsTotal.proposed, fill: '#F59E0B' },
                { status: 'Acceptate', n: data.actionsTotal.accepted, fill: '#3B82F6' },
                { status: 'Finalizate', n: data.actionsTotal.completed, fill: '#10B981' },
                { status: 'Respinse', n: data.actionsTotal.rejected, fill: '#EF4444' },
              ]}
              margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ecd-border-soft)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--ecd-text-soft)' }} />
              <YAxis dataKey="status" type="category" tick={{ fontSize: 11, fill: 'var(--ecd-text-soft)' }} width={90} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--ecd-surface)',
                  border: '1px solid var(--ecd-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="n" radius={[0, 4, 4, 0]} isAnimationActive={animate}>
                {[
                  { status: 'Propuse', fill: '#F59E0B' },
                  { status: 'Acceptate', fill: '#3B82F6' },
                  { status: 'Finalizate', fill: '#10B981' },
                  { status: 'Respinse', fill: '#EF4444' },
                ].map((d) => (
                  <Cell key={d.status} fill={d.fill} />
                ))}
                <LabelList dataKey="n" position="right" style={{ fontSize: 10, fill: 'var(--ecd-text-soft)' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* HEATMAP — controls + grid */}
      <Card>
        <div className="flex items-end justify-between mb-3 flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-800">Heatmap 2D — explorare cross-dimensiune</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Selectează rândul și coloana pentru a vedea medii și volume în orice combinație.
            </p>
          </div>
          <div className="flex gap-2">
            <Select label="Rânduri" value={heatmapRow} onChange={(e) => setHeatmapRow(e.target.value as any)} wrapperClassName="min-w-[140px]">
              <option value="faculty">Facultate</option>
              <option value="program">Program</option>
              <option value="department">Departament</option>
            </Select>
            <Select label="Coloane" value={heatmapCol} onChange={(e) => setHeatmapCol(e.target.value as any)} wrapperClassName="min-w-[140px]">
              <option value="category">Categorie</option>
              <option value="semester">Semestru</option>
              <option value="year">An</option>
              <option value="courseType">Activitate</option>
            </Select>
          </div>
        </div>
        {heatmap && (
          <Heatmap
            rowDim={heatmap.rowDim}
            colDim={heatmap.colDim}
            rows={heatmap.rows}
            cols={heatmap.cols}
            cells={heatmap.cells}
            metric="avg"
          />
        )}
      </Card>

      {/* TOP-N + ranking controls */}
      <Card>
        <div className="flex items-end justify-between mb-3 flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-800">Top 10 rankings</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {topMetric === 'avg' ? 'Cei mai bine evaluați' : 'Cei cu cele mai multe evaluări'} —{' '}
              {topEntity === 'professors' ? 'profesori' : topEntity === 'courses' ? 'discipline' : 'departamente'}.
            </p>
          </div>
          <div className="flex gap-2">
            <Select label="Categorie" value={topEntity} onChange={(e) => setTopEntity(e.target.value as any)} wrapperClassName="min-w-[140px]">
              {myRole === 'admin' && <option value="professors">Profesori</option>}
              {(myRole === 'admin' || myRole === 'professor') && (
                <option value="courses">{myRole === 'professor' ? 'Disciplinele mele' : 'Discipline'}</option>
              )}
              <option value="departments">Departamente</option>
            </Select>
            <Select label="Metric" value={topMetric} onChange={(e) => setTopMetric(e.target.value as any)} wrapperClassName="min-w-[140px]">
              <option value="avg">Scor mediu</option>
              <option value="count">Număr evaluări</option>
            </Select>
          </div>
        </div>
        {myRole === 'student' && (
          <p className="text-[11px] text-neutral-400 mb-3 -mt-1 italic">
            🔒 GDPR — Studenții văd doar agregate pe departamente. Rankingurile individuale ale
            profesorilor și disciplinelor sunt vizibile doar profesorilor (pentru propriile date)
            și administratorilor.
          </p>
        )}
        {(() => {
          const mapItems = (it: any) => ({
            id: it.id,
            name: it.name,
            subtitle:
              topEntity === 'professors'
                ? `${it.title ?? ''} · ${it.department ?? ''} · ${it.faculty ?? ''}${
                    it.programs_taught && it.programs_taught.length
                      ? ` · ${it.programs_taught.join(', ')}`
                      : ''
                  }`
                : topEntity === 'courses'
                  ? `${it.code} · ${it.course_type} · sem ${it.semester} · ${it.professor}`
                  : `${it.faculty}`,
            avg_score: it.avg_score,
            n_evals: it.n_evals,
          });
          const clickHandler = (item: any) => {
            if (topEntity === 'professors' && myRole === 'admin' && item.id) {
              navigate(`/admin/professor/${item.id}`);
            }
          };
          // Admin + entity=professors + avg → split top vs bottom
          if (bottomRank && topRank && topEntity === 'professors' && topMetric === 'avg' && myRole === 'admin') {
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-success-fg mb-2 flex items-center gap-1.5">
                    🏆 Top 10 cei mai bine evaluați
                  </h3>
                  <TopNList items={topRank.items.map(mapItems)} metric="avg" onItemClick={clickHandler} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-danger-fg mb-2 flex items-center gap-1.5">
                    ⚠️ Top 10 sub minim (necesită atenție CEAC)
                  </h3>
                  <TopNList items={bottomRank.items.map(mapItems)} metric="avg" onItemClick={clickHandler} />
                </div>
              </div>
            );
          }
          // default single list
          return topRank ? (
            <TopNList items={topRank.items.map(mapItems)} metric={topMetric} onItemClick={clickHandler} />
          ) : null;
        })()}
      </Card>
      </div>
      )}

      {/* TAB PANEL: SUMAR (partea 2 — pipeline + personal + closing-loop) */}
      {activeTab === 'summary' && (
      <div role="tabpanel" aria-labelledby="tab-summary" className="flex flex-col gap-7">
      {/* PIPELINE LIFECYCLE — narativ + cifre */}
      <Card>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-neutral-800 mb-1">
            Călătoria unei evaluări — de la invitație la schimbare reală
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Fiecare evaluare trece prin 6 etape. Ce începe ca un email către student devine, prin
            ciclul „closing the loop", o decizie concretă care îmbunătățește experiența la curs.{' '}
            <strong>{totalPipeline.toLocaleString('ro-RO')}</strong> elemente sunt acum în pipeline.
          </p>
        </div>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.pipeline.map((stage, idx) => {
            const Icon = STAGE_ICONS[stage.stage] ?? AcademicCapIcon;
            const STAGE_NARRATIVE: Record<string, string> = {
              invite:
                'Platforma identifică studenții cu cursuri active și le activează evaluările. Aici începe ciclul.',
              draft:
                'Studentul deschide chestionarul, răspunde la 19 întrebări (15 Likert + 4 text). Auto-save la 30s.',
              submitted:
                'Evaluarea e transmisă, anonimizată și agregată. Studentul nu mai poate edita; profesorul vede doar agregat.',
              actions_proposed:
                'CEAC analizează scorurile sub minim și propune acțiuni concrete: workshop, mentorat, peer review.',
              actions_in_progress:
                'Profesorul acceptă propunerea și o pune în practică (training, plan de îmbunătățire).',
              actions_completed:
                'Acțiunea e finalizată — feedback-ul tău a generat o schimbare reală la curs.',
            };
            return (
              <li key={stage.stage}>
                <div
                  className="rounded-lg border border-neutral-200 bg-white p-4 h-full flex flex-col gap-2 hover:border-accent-400 transition-colors"
                  style={{ boxShadow: '0 1px 2px rgba(14, 34, 51, 0.04)' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(124, 58, 237, 0.08)', color: 'var(--ecd-accent-600)' }}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <Badge tone="neutral">Pasul {idx + 1}</Badge>
                  </div>
                  <div className="text-2xl font-bold text-neutral-800 tabular-nums">
                    {stage.value.toLocaleString('ro-RO')}
                  </div>
                  <div className="text-sm font-semibold text-neutral-700">{stage.label}</div>
                  <p className="text-[12px] text-neutral-500 leading-relaxed mt-1">
                    {STAGE_NARRATIVE[stage.stage] ?? ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-5 text-xs text-neutral-500 italic">
          Sub fiecare etapă: descrierea procesului. Cifrele se actualizează live în funcție de
          filtrele aplicate (sau, dacă ești profesor, sunt cifrele tale personale).
        </p>
      </Card>

      {/* PERSONAL */}
      {data.personal && (
        <Card tone="info">
          <h2 className="text-base font-semibold text-info-fg mb-3">
            {data.role === 'student' && 'Impactul tău direct'}
            {data.role === 'professor' && 'Cifrele tale ca profesor'}
            {data.role === 'admin' && 'În responsabilitatea ta'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.role === 'student' && (
              <>
                <KPICard label={TERMS.evaluationsSent} value={data.personal.my_submitted ?? 0} />
                <KPICard label={TERMS.evaluationsDraft} value={data.personal.my_draft ?? 0} />
                <KPICard
                  label="Scor mediu acordat"
                  value={
                    data.personal.my_avg_given != null
                      ? Number(data.personal.my_avg_given).toFixed(2).replace('.', ',')
                      : '—'
                  }
                  suffix={data.personal.my_avg_given != null ? '/ 5' : ''}
                />
                <KPICard
                  label="Mesaje cu răspuns"
                  value={data.personal.my_messages_answered ?? 0}
                  footnote={`${data.personal.my_messages_open ?? 0} încă deschise`}
                />
              </>
            )}
            {data.role === 'professor' && (
              <>
                <KPICard label="Evaluări primite" value={data.personal.my_evaluations_received ?? 0} />
                <KPICard
                  label="Media ta"
                  value={
                    data.personal.my_avg != null ? Number(data.personal.my_avg).toFixed(2).replace('.', ',') : '—'
                  }
                  suffix={data.personal.my_avg != null ? '/ 5' : ''}
                />
                <KPICard label="Acțiuni acceptate" value={data.personal.my_actions_accepted ?? 0} />
                <KPICard label="Acțiuni finalizate" value={data.personal.my_actions_completed ?? 0} />
              </>
            )}
            {data.role === 'admin' && (
              <>
                <KPICard label="Mesaje de răspuns" value={data.personal.pending_replies ?? 0} />
                <KPICard label="Acțiuni în curs" value={data.personal.actions_in_progress ?? 0} />
                <KPICard label="Acțiuni finalizate" value={data.personal.completed_actions ?? 0} />
                <KPICard label="Utilizatori totali" value={data.personal.total_users ?? 0} />
              </>
            )}
          </div>
        </Card>
      )}

      {/* CLOSING THE LOOP */}
      <Card>
        <h2 className="text-base font-semibold text-neutral-800 mb-2">Closing the loop</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Cât de aproape de 100% e raportul „răspunsuri admin / mesaje primite".
        </p>
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl font-bold text-neutral-800 tabular-nums">{closingPct}%</span>
          <span className="text-sm text-neutral-500">
            {(data.closing_loop.messages_answered + (data.closing_loop.messages_closed ?? 0)).toLocaleString('ro-RO')}{' '}
            rezolvate din{' '}
            {(data.closing_loop.messages_total ?? data.closing_loop.messages_open + data.closing_loop.messages_answered).toLocaleString('ro-RO')}{' '}
            mesaje primite ·{' '}
            {data.closing_loop.messages_open} deschise,{' '}
            {data.closing_loop.messages_in_progress ?? 0} în analiză
          </span>
        </div>
        <div
          className="w-full h-3 rounded-full overflow-hidden"
          style={{ background: 'var(--ecd-border-soft)' }}
          role="progressbar"
          aria-valuenow={closingPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${closingPct}%`,
              background:
                closingPct >= 80
                  ? 'var(--ecd-success)'
                  : closingPct >= 50
                    ? 'var(--ecd-warning)'
                    : 'var(--ecd-danger)',
            }}
          />
        </div>
      </Card>
      </div>
      )}
    </div>
  );
}
