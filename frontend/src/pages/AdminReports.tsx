import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { generatePrintableReport } from '../utils/pdfExport';
import { useTabNavigation } from '../hooks/useTabNavigation';

type ReportTab = 'overview' | 'year' | 'courseType' | 'discipline';
type ChartKind = 'bar' | 'line' | 'pie' | 'table';

const CHART_KIND_LABELS: Record<ChartKind, string> = {
  bar: 'Bare',
  line: 'Linii',
  pie: 'Distribuție',
  table: 'Tabel',
};

const CHART_KIND_ICONS: Record<ChartKind, string> = {
  bar: '📊',
  line: '📈',
  pie: '🥧',
  table: '🗂️',
};

const PIE_COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#A78BFA', '#EC4899', '#14B8A6'];

function ChartKindToggle({
  value,
  onChange,
  allowed = ['bar', 'line', 'pie', 'table'] as ChartKind[],
}: {
  value: ChartKind;
  onChange: (k: ChartKind) => void;
  allowed?: ChartKind[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5" role="tablist" aria-label="Tip vizualizare">
      {allowed.map((k) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={value === k}
          onClick={() => onChange(k)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === k
              ? 'bg-primary-800 text-white'
              : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
          }`}
        >
          <span aria-hidden="true">{CHART_KIND_ICONS[k]}</span> {CHART_KIND_LABELS[k]}
        </button>
      ))}
    </div>
  );
}

export default function AdminReports() {
  const navigate = useNavigate();
  const reportContentRef = useRef<HTMLDivElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tab order for keyboard navigation
  const tabs = [
    { id: 'overview' as ReportTab, label: 'Panorama Generală', icon: '📊' },
    { id: 'year' as ReportTab, label: 'Pe Ani de Studiu', icon: '📅' },
    { id: 'courseType' as ReportTab, label: 'Pe Activitate', icon: '📚' },
    { id: 'discipline' as ReportTab, label: 'Comparație Discipline', icon: '🔍' },
  ];

  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  // Enable keyboard navigation for tabs
  useTabNavigation({
    tablistRef,
    activeTabIndex,
    onTabChange: (index) => setActiveTab(tabs[index].id),
    enabled: true,
    loop: true,
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState<{
    faculties: { id: number; name: string }[];
    levels: string[];
    years: number[];
    courseTypes: string[];
  } | null>(null);

  // Filters
  const [selectedFaculty, setSelectedFaculty] = useState<number | ''>('');
  const [selectedLevel, setSelectedLevel] = useState<string | ''>('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [selectedCourseType, setSelectedCourseType] = useState<string | ''>('');
  const [selectedSemester, setSelectedSemester] = useState<string | ''>('');

  // Data for different report types
  const [filteredStats, setFilteredStats] = useState<any>(null);
  const [yearStats, setYearStats] = useState<any>(null);
  const [courseTypeStats, setCourseTypeStats] = useState<any>(null);

  // Discipline comparison
  const [courseNames, setCourseNames] = useState<{ name: string; professorCount: number }[]>([]);
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');
  const [disciplineComparison, setDisciplineComparison] = useState<any>(null);

  // Chart type per tab — default smart per tab (line pentru trenduri pe ani, bare în rest)
  // Default tabel — cel mai lizibil când datele sunt multe; userul poate trece la chart vizual cu un click
  const [overviewChart, setOverviewChart] = useState<ChartKind>('table');
  const [yearChart, setYearChart] = useState<ChartKind>('table');
  const [courseTypeChart, setCourseTypeChart] = useState<ChartKind>('table');
  const [disciplineChart, setDisciplineChart] = useState<ChartKind>('table');

  // Strategy de agregare adaptivă:
  //  - Fără filtre → grupez per facultate (5 bare clare)
  //  - Cu facultate selectată → per program (~5-8 bare)
  //  - Cu program selectat → per an (3-4 bare)
  //  - Cu an selectat → per activitate (3 bare: curs/seminar/lab)
  // Astfel graficul are MAXIMUM ~10 bare lizibile în loc de 400 ilizibile.
  const overviewRows = useMemo(() => {
    const rows: any[] = filteredStats?.stats || [];

    // Determin nivelul de grupare în funcție de filtrele active
    const groupBy: 'faculty' | 'program' | 'year' | 'courseType' =
      selectedYear ? 'courseType' :
      selectedFaculty && selectedLevel ? 'year' :
      selectedFaculty ? 'program' :
      'faculty';

    // Aggregate raw rows după cheia de grupare.
    // Backend trimite: `total_evaluations` (numărul de evaluări CREATE) și
    // `completed` (subset, status=submitted). `completion_rate` e deja calculat
    // de backend (% completed / total_evaluations).
    const buckets = new Map<string, {
      key: string; label: string;
      completed: number; total: number; sum_score: number; count_with_score: number;
      faculty_short: string;
    }>();

    for (const s of rows) {
      const facShort = (s.faculty_name || '—').replace(/^Facultatea de\s+/i, '');
      let key: string, label: string;
      switch (groupBy) {
        case 'faculty':  key = facShort; label = facShort; break;
        case 'program':  key = s.program_name || '—'; label = s.program_name || '—'; break;
        case 'year':     key = `An ${s.year_number}`; label = `An ${s.year_number}`; break;
        case 'courseType': key = s.course_type || '—'; label = s.course_type || '—'; break;
      }
      const bucket = buckets.get(key) || {
        key, label, completed: 0, total: 0, sum_score: 0, count_with_score: 0,
        faculty_short: facShort,
      };
      bucket.completed += s.completed || 0;
      bucket.total += s.total_evaluations || 0;
      if (s.average_score != null) {
        bucket.sum_score += s.average_score;
        bucket.count_with_score++;
      }
      buckets.set(key, bucket);
    }

    return Array.from(buckets.values())
      .map((b, idx) => ({
        id: idx,
        display_label: b.label,
        faculty_short: b.faculty_short,
        completed: b.completed,
        total: b.total,
        completion_rate: b.total > 0 ? Math.round((b.completed / b.total) * 100 * 10) / 10 : 0,
        average_score: b.count_with_score > 0
          ? Math.round((b.sum_score / b.count_with_score) * 100) / 100
          : null,
      }))
      .sort((a, b) => b.completion_rate - a.completion_rate);
  }, [filteredStats, selectedYear, selectedFaculty, selectedLevel]);

  // Pentru pie: folosesc direct overviewRows (deja agregate inteligent) — fiecare felie e o grupă (facultate/program/an/activitate)
  const overviewPieData = useMemo(() => {
    return overviewRows
      .map((r: any) => ({ name: r.display_label, value: r.completed }))
      .filter((d: any) => d.value > 0);
  }, [overviewRows]);

  // Per-facultate cu detalii programe (folosit în vederea fără filtre)
  const facultyWidgets = useMemo(() => {
    const rows: any[] = filteredStats?.stats || [];
    const byFac = new Map<string, {
      faculty: string;
      completed: number;
      total: number;
      sum_score: number;
      count_score: number;
      programs: Map<string, { name: string; completed: number; total: number }>;
    }>();
    for (const s of rows) {
      const facShort = (s.faculty_name || '—').replace(/^Facultatea de\s+/i, '');
      const bucket = byFac.get(facShort) || {
        faculty: facShort,
        completed: 0, total: 0, sum_score: 0, count_score: 0,
        programs: new Map(),
      };
      bucket.completed += s.completed || 0;
      bucket.total += s.total_evaluations || 0;
      if (s.average_score != null) {
        bucket.sum_score += s.average_score;
        bucket.count_score++;
      }
      const progName = s.program_name || '—';
      const p = bucket.programs.get(progName) || { name: progName, completed: 0, total: 0 };
      p.completed += s.completed || 0;
      p.total += s.total_evaluations || 0;
      bucket.programs.set(progName, p);
      byFac.set(facShort, bucket);
    }
    return Array.from(byFac.values()).map((b) => ({
      faculty: b.faculty,
      completed: b.completed,
      total: b.total,
      completion_rate: b.total > 0 ? (b.completed / b.total) * 100 : 0,
      average_score: b.count_score > 0 ? b.sum_score / b.count_score : null,
      programs: Array.from(b.programs.values()).map((p) => ({
        ...p,
        rate: p.total > 0 ? (p.completed / p.total) * 100 : 0,
      })).sort((a, b) => b.rate - a.rate),
    })).sort((a, b) => b.completion_rate - a.completion_rate);
  }, [filteredStats]);

  // Vederea „widget per facultate" se aplică doar când nu există filtre active
  const showFacultyWidgets = !selectedFaculty && !selectedLevel && !selectedYear && !selectedCourseType && !selectedSemester;

  useEffect(() => {
    loadFilterOptions();
    loadCourseNames();
  }, []);

  useEffect(() => {
    loadReportData();
  }, [activeTab, selectedFaculty, selectedLevel, selectedYear, selectedCourseType, selectedSemester]);

  const loadFilterOptions = async () => {
    try {
      const options = await api.getAdminFilterOptions();
      setFilterOptions(options);
    } catch (err: any) {
      console.error('Error loading filter options:', err);
    }
  };

  const loadCourseNames = async () => {
    try {
      const data = await api.getCourseNames();
      setCourseNames(data.courses);
    } catch (err: any) {
      console.error('Error loading course names:', err);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError('');

      const filters: any = {};
      if (selectedFaculty) filters.facultyId = Number(selectedFaculty);
      if (selectedLevel) filters.level = selectedLevel;
      if (selectedYear) filters.yearNumber = Number(selectedYear);
      if (selectedCourseType) filters.courseType = selectedCourseType;
      if (selectedSemester) filters.semester = selectedSemester;

      switch (activeTab) {
        case 'overview':
          const data = await api.getFilteredStats(filters);
          setFilteredStats(data);
          break;

        case 'year':
          const yearData = await api.getYearStats({
            facultyId: selectedFaculty ? Number(selectedFaculty) : undefined,
            level: selectedLevel || undefined
          });
          setYearStats(yearData);
          break;

        case 'courseType':
          const courseData = await api.getCourseTypeStats({
            facultyId: selectedFaculty ? Number(selectedFaculty) : undefined,
            yearNumber: selectedYear ? Number(selectedYear) : undefined
          });
          setCourseTypeStats(courseData);
          break;

        case 'discipline':
          // Only load if course is selected
          if (selectedCourseName) {
            const disciplineData = await api.getDisciplineComparison(
              selectedCourseName,
              selectedFaculty ? Number(selectedFaculty) : undefined
            );
            setDisciplineComparison(disciplineData);
          }
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedFaculty('');
    setSelectedLevel('');
    setSelectedYear('');
    setSelectedCourseType('');
    setSelectedSemester('');
  };

  const handleExportPDF = () => {
    if (!reportContentRef.current) {
      alert('Nu există conținut de exportat.');
      return;
    }

    const reportTitle = tabs.find(t => t.id === activeTab)?.label || 'Raport';
    const fullTitle = `Raport Avansat - ${reportTitle}`;

    const activeFilters: Record<string, any> = {};
    if (selectedFaculty) {
      const facultyName = filterOptions?.faculties.find(f => f.id === selectedFaculty)?.name;
      activeFilters['Facultate'] = facultyName?.replace('Facultatea de ', '');
    }
    if (selectedLevel) activeFilters['Nivel'] = selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1);
    if (selectedYear) activeFilters['An'] = `Anul ${selectedYear}`;
    if (selectedCourseType) activeFilters['Activitate'] = selectedCourseType.charAt(0).toUpperCase() + selectedCourseType.slice(1);
    if (selectedSemester) activeFilters['Semestru'] = `Semestrul ${selectedSemester}`;
    if (selectedCourseName) activeFilters['Disciplină'] = selectedCourseName;

    generatePrintableReport(reportContentRef.current, fullTitle, activeFilters);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <button
            onClick={() => navigate('/admin')}
            className="text-sm text-neutral-500 hover:text-neutral-800 mb-2 flex items-center gap-1"
          >
            ← Înapoi la Dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800">Rapoarte Avansate</h1>
          <p className="text-neutral-500 mt-1 text-sm md:text-base">Analize detaliate și rapoarte personalizate</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-white border border-neutral-200 text-neutral-800 font-medium shadow-elev-1 hover:bg-neutral-50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📄 Export PDF
          </button>
          <button
            onClick={async () => {
              try {
                const blob = await api.exportAracis();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `export-evaluari-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (e) {
                console.error('export csv fail', e);
              }
            }}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-accent-600 text-white font-medium shadow-elev-1 hover:bg-accent-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40"
            title="Export agregat per facultate × program × an (CSV)"
          >
            📑 Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div ref={tablistRef} className="flex border-b border-neutral-200 overflow-x-auto" role="tablist" aria-label="Tipuri de rapoarte">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-800'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-200'
              }`}
            >
              <span aria-hidden="true">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {filterOptions && (
        <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-neutral-700">Filtre:</span>

            {/* Faculty Filter */}
            {activeTab !== 'discipline' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500">Facultate:</label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value ? Number(e.target.value) : '')}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm"
                >
                  <option value="">Toate</option>
                  {filterOptions.faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name.replace('Facultatea de ', '')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Level Filter */}
            {(activeTab === 'overview' || activeTab === 'year') && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500">Nivel:</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm"
                >
                  <option value="">Toate</option>
                  {filterOptions.levels.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Year Filter */}
            {(activeTab === 'overview' || activeTab === 'courseType') && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500">An:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm"
                >
                  <option value="">Toți</option>
                  {filterOptions.years.map((year) => (
                    <option key={year} value={year}>
                      Anul {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Course Type Filter */}
            {activeTab === 'overview' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500">Tip:</label>
                <select
                  value={selectedCourseType}
                  onChange={(e) => setSelectedCourseType(e.target.value)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm"
                >
                  <option value="">Toate</option>
                  {filterOptions.courseTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Semester Filter */}
            {activeTab === 'overview' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500">Semestru:</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm"
                >
                  <option value="">Toate</option>
                  <option value="1">Semestrul 1</option>
                  <option value="2">Semestrul 2</option>
                </select>
              </div>
            )}

            {/* Course Name Selection for Discipline Comparison */}
            {activeTab === 'discipline' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500">Disciplină:</label>
                <select
                  value={selectedCourseName}
                  onChange={(e) => {
                    setSelectedCourseName(e.target.value);
                    if (e.target.value) loadReportData();
                  }}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm w-full sm:min-w-[250px] sm:w-auto"
                >
                  <option value="">Selectează o disciplină...</option>
                  {courseNames.map((course) => (
                    <option key={course.name} value={course.name}>
                      {course.name} ({course.professorCount} profesori)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear Filters */}
            {(selectedFaculty || selectedLevel || selectedYear || selectedCourseType || selectedSemester || selectedCourseName) && (
              <button
                onClick={() => {
                  handleClearFilters();
                  setSelectedCourseName('');
                }}
                className="text-sm text-primary-800 hover:text-primary-800 font-medium"
              >
                ✕ Șterge filtre
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-neutral-500">Se încarcă...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Report Content */}
      {!loading && !error && (
        <div ref={reportContentRef}>
          {/* Overview & Faculty Tab */}
          {activeTab === 'overview' && filteredStats && (
            <div className="space-y-6">
              {/* Comparație rezumat — apare DOAR când nu există filtre, pentru
                  o privire de ansamblu rapidă pe toate facultățile. */}
              {showFacultyWidgets && facultyWidgets.length > 0 && (
                <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
                  <h3 className="text-lg font-semibold text-neutral-800 mb-1">
                    Comparație între facultăți
                  </h3>
                  <p className="text-xs text-neutral-500 mb-4">
                    Rata de completare per facultate, sortată descrescător.
                  </p>
                  <div className="space-y-3">
                    {facultyWidgets.map((f, i) => (
                      <div key={f.faculty} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-neutral-400 w-5">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <span className="text-sm font-medium text-neutral-800 truncate">{f.faculty}</span>
                            <span className={`text-sm font-mono font-semibold ${f.completion_rate >= 70 ? 'text-success-fg' : f.completion_rate >= 50 ? 'text-warning-fg' : 'text-danger-fg'}`}>
                              {f.completion_rate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, f.completion_rate)}%`,
                                background: f.completion_rate >= 70 ? '#10B981' : f.completion_rate >= 50 ? '#F59E0B' : '#EF4444',
                              }}
                            />
                          </div>
                          <div className="text-[11px] text-neutral-500 mt-1">
                            {f.completed.toLocaleString('ro-RO')} / {f.total.toLocaleString('ro-RO')} evaluări
                            {f.average_score != null && (
                              <span className="ml-2">· scor mediu: <strong>{f.average_score.toFixed(2)}/5</strong></span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Widget per facultate — cu drill-down pe programe. Apare doar fără filtre. */}
              {showFacultyWidgets && facultyWidgets.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {facultyWidgets.map((f) => (
                    <div key={f.faculty} className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h4 className="text-base font-semibold text-neutral-800 leading-tight">{f.faculty}</h4>
                        <span className={`text-2xl font-bold tabular-nums ${f.completion_rate >= 70 ? 'text-success-fg' : f.completion_rate >= 50 ? 'text-warning-fg' : 'text-danger-fg'}`}>
                          {f.completion_rate.toFixed(0)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                        <div>
                          <div className="text-[10px] text-neutral-400 uppercase tracking-wide">Completate</div>
                          <div className="text-base font-semibold text-neutral-800">{f.completed.toLocaleString('ro-RO')}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 uppercase tracking-wide">Total</div>
                          <div className="text-base font-semibold text-neutral-500">{f.total.toLocaleString('ro-RO')}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 uppercase tracking-wide">Scor mediu</div>
                          <div className="text-base font-semibold text-neutral-800">
                            {f.average_score != null ? f.average_score.toFixed(2) : '—'}
                          </div>
                        </div>
                      </div>
                      {f.programs.length > 0 && (
                        <div>
                          <div className="text-[11px] text-neutral-500 uppercase tracking-wide font-medium mb-2">
                            Programe ({f.programs.length})
                          </div>
                          <div className="space-y-1.5">
                            {f.programs.slice(0, 5).map((p) => (
                              <div key={p.name} className="flex items-center gap-2 text-xs">
                                <span className="flex-1 min-w-0 truncate text-neutral-700">{p.name}</span>
                                <span className="font-mono text-neutral-500 shrink-0">{p.completed}/{p.total}</span>
                                <span className={`font-mono font-medium w-12 text-right shrink-0 ${p.rate >= 70 ? 'text-success-fg' : p.rate >= 50 ? 'text-warning-fg' : 'text-danger-fg'}`}>
                                  {p.rate.toFixed(0)}%
                                </span>
                              </div>
                            ))}
                            {f.programs.length > 5 && (
                              <div className="text-[11px] text-neutral-400 italic">
                                +{f.programs.length - 5} alte programe — aplică filtre pentru vedere completă
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Chart agregat — apare DOAR când există filtre active (focus pe ce a filtrat user-ul) */}
              {!showFacultyWidgets && (
              <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-800">
                      Rata de Completare {filteredStats.filters && Object.keys(filteredStats.filters).length > 0 && '(Filtrate)'}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Grupare automată: {
                        selectedYear ? 'pe activitate (curs/seminar/lab)' :
                        selectedFaculty && selectedLevel ? 'pe an de studiu' :
                        selectedFaculty ? 'pe program' :
                        'pe facultate'
                      }. <strong>{overviewRows.length}</strong> rânduri afișate.
                      Aplică filtre suplimentare pentru detaliere.
                    </p>
                  </div>
                  <ChartKindToggle value={overviewChart} onChange={setOverviewChart} />
                </div>
                {overviewRows.length > 0 ? (
                  overviewChart === 'bar' ? (
                    <ResponsiveContainer width="100%" height={420}>
                      <BarChart data={overviewRows} margin={{ top: 10, right: 16, left: 8, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="display_label"
                          angle={overviewRows.length > 5 ? -25 : 0}
                          textAnchor={overviewRows.length > 5 ? 'end' : 'middle'}
                          height={overviewRows.length > 5 ? 90 : 40}
                          fontSize={12}
                          interval={0}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend wrapperStyle={{ paddingTop: 16 }} />
                        <Bar dataKey="completion_rate" fill="#3B82F6" name="Rata completare (%)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="average_score" fill="#10B981" name="Scor mediu (×20)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : overviewChart === 'line' ? (
                    <ResponsiveContainer width="100%" height={420}>
                      <LineChart data={overviewRows} margin={{ top: 10, right: 16, left: 8, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="display_label"
                          angle={overviewRows.length > 5 ? -25 : 0}
                          textAnchor={overviewRows.length > 5 ? 'end' : 'middle'}
                          height={overviewRows.length > 5 ? 90 : 40}
                          fontSize={12}
                          interval={0}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend wrapperStyle={{ paddingTop: 16 }} />
                        <Line type="monotone" dataKey="completion_rate" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5 }} name="Rata completare (%)" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : overviewChart === 'pie' ? (
                    overviewPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={420}>
                        <PieChart>
                          <Pie
                            data={overviewPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={140}
                            label={(d: any) => `${d.name}: ${d.value}`}
                          >
                            {overviewPieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => [`${v} evaluări`, 'Completate']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-neutral-500 text-center py-8">Nu există evaluări completate pentru filtrele selectate.</p>
                    )
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-200 text-sm">
                        <thead className="bg-neutral-25">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Grupă</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Completate</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Total</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Rata (%)</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Scor mediu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {overviewRows.map((r: any, i: number) => (
                            <tr key={i} className="hover:bg-neutral-25">
                              <td className="px-3 py-2 text-neutral-800 font-medium">{r.display_label}</td>
                              <td className="px-3 py-2 text-center font-mono">{r.completed.toLocaleString('ro-RO')}</td>
                              <td className="px-3 py-2 text-center font-mono text-neutral-500">{r.total.toLocaleString('ro-RO')}</td>
                              <td className="px-3 py-2 text-center font-mono">
                                <span className={r.completion_rate >= 70 ? 'text-success-fg' : r.completion_rate >= 50 ? 'text-warning-fg' : 'text-danger-fg'}>
                                  {r.completion_rate.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center font-mono">{r.average_score?.toFixed(2) ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <p className="text-neutral-500 text-center py-8">Nu există date pentru filtrele selectate</p>
                )}
              </div>
              )}

              {/* Detalii pe rândul brut — afișat doar când există filtre active.
                  Fără filtre, ar fi 240 rânduri și ar fi neclar; agregarea de sus le rezumă. */}
              {filteredStats.stats && filteredStats.stats.length > 0 &&
               filteredStats.stats.length <= 50 &&
               (selectedFaculty || selectedYear || selectedCourseType) && (
                <div className="card">
                  <div className="p-6 border-b border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-800">Detalii rând cu rând</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {filteredStats.stats.length} combinații facultate × program × an × activitate. Aplică filtre suplimentare pentru și mai puține rânduri.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200 text-sm">
                      <thead className="bg-neutral-25">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Facultate</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Program</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">An</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Activitate</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Completate</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Total</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Rata</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Scor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {filteredStats.stats.map((s: any, i: number) => (
                          <tr key={i} className="hover:bg-neutral-25">
                            <td className="px-4 py-2 text-neutral-800">{(s.faculty_name || '—').replace(/^Facultatea de\s+/i, '')}</td>
                            <td className="px-4 py-2 text-neutral-700">{s.program_name || '—'}</td>
                            <td className="px-4 py-2 text-center">{s.year_number ?? '—'}</td>
                            <td className="px-4 py-2 text-center">{s.course_type || '—'}</td>
                            <td className="px-4 py-2 text-center font-mono text-success-fg">{s.completed}</td>
                            <td className="px-4 py-2 text-center font-mono text-neutral-500">{s.total_evaluations}</td>
                            <td className="px-4 py-2 text-center font-mono">
                              <span className={s.completion_rate >= 70 ? 'text-success-fg' : s.completion_rate >= 50 ? 'text-warning-fg' : 'text-danger-fg'}>
                                {s.completion_rate?.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center font-mono">{s.average_score?.toFixed(2) ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Year Stats Tab */}
          {activeTab === 'year' && yearStats && (
            <div className="space-y-6">
              <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-neutral-800">Statistici pe Ani de Studiu</h3>
                  <ChartKindToggle value={yearChart} onChange={setYearChart} allowed={['line', 'bar', 'table']} />
                </div>
                {yearStats.stats && yearStats.stats.length > 0 ? (
                  yearChart === 'line' ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={yearStats.stats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year_number" label={{ value: 'An de studiu', position: 'insideBottom', offset: -5 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="completion_rate" stroke="#3B82F6" name="Rata completare (%)" strokeWidth={2} />
                        <Line type="monotone" dataKey="average_score" stroke="#10B981" name="Scor mediu" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : yearChart === 'bar' ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={yearStats.stats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year_number" label={{ value: 'An de studiu', position: 'insideBottom', offset: -5 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completion_rate" fill="#3B82F6" name="Rata completare (%)" />
                        <Bar dataKey="average_score" fill="#10B981" name="Scor mediu" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-200 text-sm">
                        <thead className="bg-neutral-25">
                          <tr>
                            <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase">An</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Rata completare (%)</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Scor mediu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {yearStats.stats.map((r: any, i: number) => (
                            <tr key={i}>
                              <td className="px-3 py-2 text-center">{r.year_number}</td>
                              <td className="px-3 py-2 text-center font-mono">{r.completion_rate?.toFixed(1) ?? '—'}</td>
                              <td className="px-3 py-2 text-center font-mono">{r.average_score?.toFixed(2) ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <p className="text-neutral-500 text-center py-8">Nu există date pentru filtrele selectate</p>
                )}
              </div>
            </div>
          )}

          {/* Course Type Stats Tab */}
          {activeTab === 'courseType' && courseTypeStats && (
            <div className="space-y-6">
              <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-neutral-800">Statistici pe Tip de Activitate</h3>
                  <ChartKindToggle value={courseTypeChart} onChange={setCourseTypeChart} allowed={['bar', 'pie', 'table']} />
                </div>
                {courseTypeStats.stats && courseTypeStats.stats.length > 0 ? (
                  courseTypeChart === 'bar' ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={courseTypeStats.stats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="course_type" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completion_rate" fill="#3B82F6" name="Rata completare (%)" />
                        <Bar dataKey="average_score" fill="#10B981" name="Scor mediu" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : courseTypeChart === 'pie' ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={courseTypeStats.stats.map((s: any) => ({ name: s.course_type, value: s.completed || 0 }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={140}
                          label={(d: any) => `${d.name}: ${d.value}`}
                        >
                          {courseTypeStats.stats.map((_: any, i: number) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-200 text-sm">
                        <thead className="bg-neutral-25">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Activitate</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Rata completare (%)</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Scor mediu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {courseTypeStats.stats.map((r: any, i: number) => (
                            <tr key={i}>
                              <td className="px-3 py-2 text-neutral-800">{r.course_type}</td>
                              <td className="px-3 py-2 text-center font-mono">{r.completion_rate?.toFixed(1) ?? '—'}</td>
                              <td className="px-3 py-2 text-center font-mono">{r.average_score?.toFixed(2) ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <p className="text-neutral-500 text-center py-8">Nu există date pentru filtrele selectate</p>
                )}
              </div>
            </div>
          )}

          {/* Discipline Comparison Tab */}
          {activeTab === 'discipline' && (
            <div className="space-y-6">
              {!selectedCourseName ? (
                <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6 md:p-12 text-center">
                  <p className="text-neutral-500 mb-2">Selectează o disciplină din filtrul de mai sus pentru a vedea comparația între profesori.</p>
                  <p className="text-sm text-neutral-500">Sunt afișate doar disciplinele predate de mai mulți profesori.</p>
                </div>
              ) : disciplineComparison && disciplineComparison.comparisons && disciplineComparison.comparisons.length > 0 ? (
                <>
                  <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <h3 className="text-lg font-semibold text-neutral-800">
                        Disciplina: <span className="text-primary-800">{disciplineComparison.courseName}</span> — comparație profesori
                      </h3>
                      <ChartKindToggle
                        value={disciplineChart}
                        onChange={setDisciplineChart}
                        allowed={['bar', 'line', 'pie', 'table']}
                      />
                    </div>
                    <div className="mb-4 p-3 rounded-md bg-accent-50 border border-accent-200 text-[13px] text-accent-800 leading-relaxed">
                      <strong>De ce apar profesori din departamente diferite?</strong>{' '}
                      Aceeași disciplină (ex. „{disciplineComparison.courseName}") poate fi predată
                      în paralel de mai multe cadre didactice din departamente diferite — fie pentru
                      că disciplina este interdisciplinară, fie pentru că diferite facultăți/programe
                      au incluse cursuri cu același nume. Coloana <em>Departament</em> indică
                      <strong> departamentul profesorului</strong> (apartenența organizațională),
                      nu departamentul care „deține" disciplina.
                    </div>
                    {disciplineChart === 'bar' ? (
                      <ResponsiveContainer width="100%" height={420}>
                        <BarChart data={disciplineComparison.comparisons} margin={{ bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="professor_name"
                            angle={-35}
                            textAnchor="end"
                            height={140}
                            fontSize={11}
                            interval={0}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="average_score" fill="#10B981" name="Scor mediu" />
                          <Bar dataKey="completion_rate" fill="#3B82F6" name="Rata completare (%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : disciplineChart === 'line' ? (
                      <ResponsiveContainer width="100%" height={420}>
                        <LineChart data={disciplineComparison.comparisons} margin={{ bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="professor_name"
                            angle={-35}
                            textAnchor="end"
                            height={140}
                            fontSize={11}
                            interval={0}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="average_score" stroke="#10B981" strokeWidth={2} name="Scor mediu" />
                          <Line type="monotone" dataKey="completion_rate" stroke="#3B82F6" strokeWidth={2} name="Rata completare (%)" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : disciplineChart === 'pie' ? (
                      <ResponsiveContainer width="100%" height={420}>
                        <PieChart>
                          <Pie
                            data={disciplineComparison.comparisons.map((c: any) => ({ name: c.professor_name, value: c.completed || 0 }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={140}
                            label={(d: any) => `${d.name}: ${d.value}`}
                          >
                            {disciplineComparison.comparisons.map((_: any, i: number) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 text-sm">
                          <thead className="bg-neutral-25">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Profesor</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Departamentul profesorului</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Rata (%)</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Scor mediu</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {disciplineComparison.comparisons.map((r: any, i: number) => (
                              <tr key={i}>
                                <td className="px-3 py-2 text-neutral-800">{r.professor_name}</td>
                                <td className="px-3 py-2 text-neutral-500">{r.department}</td>
                                <td className="px-3 py-2 text-center font-mono">{r.completion_rate?.toFixed(1) ?? '—'}</td>
                                <td className="px-3 py-2 text-center font-mono">{r.average_score?.toFixed(2) ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="card">
                    <div className="p-6 border-b border-neutral-200">
                      <h3 className="text-lg font-semibold text-neutral-800">Comparație Detaliată</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-25">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Profesor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Departament</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Evaluări</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Completate</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Rata (%)</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Scor Mediu</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                          {disciplineComparison.comparisons.map((comp: any, index: number) => (
                            <tr key={index} className="hover:bg-neutral-25">
                              <td className="px-6 py-4 text-sm font-medium text-neutral-800">{comp.professor_name}</td>
                              <td className="px-6 py-4 text-sm text-neutral-500">{comp.department}</td>
                              <td className="px-6 py-4 text-sm text-center text-neutral-800">{comp.total_evaluations}</td>
                              <td className="px-6 py-4 text-sm text-center text-green-600 font-medium">{comp.completed}</td>
                              <td className="px-6 py-4 text-sm text-center">
                                <span className={`font-semibold ${
                                  comp.completion_rate >= 80 ? 'text-green-600' :
                                  comp.completion_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {comp.completion_rate?.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-center">
                                {comp.average_score ? (
                                  <span className={`font-semibold ${
                                    comp.average_score >= 4 ? 'text-green-600' :
                                    comp.average_score >= 3 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {comp.average_score.toFixed(2)}
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6 md:p-12 text-center">
                  <p className="text-neutral-500">Nu există date pentru disciplina selectată.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
