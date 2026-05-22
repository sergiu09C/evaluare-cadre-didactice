import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import EvaluationsList from '../components/professor/EvaluationsList';
import { Card, Badge, Button, KPICard, ListFilterBar } from '../components/ui';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Evaluation {
  id: number;
  courseId: number;
  courseName: string;
  courseType: string;
  semester: string;
  academicYear: string;
  submittedAt: string;
  averageScore: number | null;
}

interface Course {
  id: number;
  name: string;
  courseType: string;
  semester: string;
  academicYear: string;
}

interface Filters {
  courseId?: number;
  semester?: string;
  academicYear?: string;
}

export default function ProfessorReports() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ limit: 20, offset: 0, total: 0, hasMore: false });

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.getProfessorCourses();
        setCourses(resp.courses);
      } catch {
        /* noop */
      }
    })();
  }, []);

  useEffect(() => {
    fetchEvaluations(false);
  }, [filters]);

  async function fetchEvaluations(append: boolean) {
    try {
      setLoading(true);
      setError(null);
      const offset = append ? pagination.offset + pagination.limit : 0;
      const resp = await api.getProfessorEvaluations({
        ...filters,
        limit: pagination.limit,
        offset,
      });
      if (append) {
        setEvaluations((prev) => [...prev, ...resp.evaluations]);
      } else {
        setEvaluations(resp.evaluations);
      }
      setPagination({
        limit: resp.pagination.limit,
        offset: resp.pagination.offset,
        total: resp.pagination.total,
        hasMore: resp.pagination.hasMore,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare la încărcarea evaluărilor');
    } finally {
      setLoading(false);
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await api.exportProfessorData(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      let filename = 'evaluari-profesor';
      if (filters.courseId) {
        const c = courses.find((x) => x.id === filters.courseId);
        if (c) filename += `-${c.name.replace(/\s+/g, '-')}`;
      }
      if (filters.semester) filename += `-sem${filters.semester}`;
      if (filters.academicYear) filename += `-${filters.academicYear}`;
      filename += `-${new Date().toISOString().split('T')[0]}.csv`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => setFilters({});
  const hasActiveFilters = Object.values(filters).some((v) => v != null && v !== '');
  const semesters = [...new Set(courses.map((c) => c.semester))].sort();
  const academicYears = [...new Set(courses.map((c) => c.academicYear))].sort().reverse();

  return (
    <div className="flex flex-col gap-7 max-w-[1280px]">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/professor')}
        className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-800 self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" aria-hidden="true" />
        Înapoi la dashboard
      </button>

      {/* Header */}
      <div>
        <h1 className="font-display text-[30px] font-semibold tracking-tight text-neutral-800">
          Rapoarte evaluări
        </h1>
        <p className="mt-1.5 text-neutral-500 text-[15px]">
          Vizualizează și exportă toate evaluările primite cu filtrare avansată.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Total evaluări" value={pagination.total} footnote="în tot intervalul" />
        <KPICard label="Cursuri cu evaluări" value={courses.length} />
        <KPICard label="Evaluări filtrate" value={evaluations.length} footnote="afișate acum" />
      </div>

      <ListFilterBar
        selects={[
          {
            key: 'course',
            label: 'Disciplină',
            value: filters.courseId ? String(filters.courseId) : '',
            placeholder: 'Toate disciplinele',
            onChange: (v) => setFilters((f) => ({ ...f, courseId: v ? Number(v) : undefined })),
            options: courses.map((c) => ({ value: String(c.id), label: `${c.name} · ${c.courseType}` })),
          },
          {
            key: 'sem',
            label: 'Semestru',
            value: filters.semester ?? '',
            placeholder: 'Toate semestrele',
            onChange: (v) => setFilters((f) => ({ ...f, semester: v || undefined })),
            options: semesters.map((s) => ({ value: s, label: `Semestrul ${s}` })),
          },
          {
            key: 'year',
            label: 'An academic',
            value: filters.academicYear ?? '',
            placeholder: 'Toți anii',
            onChange: (v) => setFilters((f) => ({ ...f, academicYear: v || undefined })),
            options: academicYears.map((y) => ({ value: y, label: y })),
          },
        ]}
        chips={
          hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Filtre active:</span>
              {filters.courseId && (
                <Badge tone="accent">
                  Disciplină: {courses.find((c) => c.id === filters.courseId)?.name}
                  <button
                    onClick={() => setFilters((f) => ({ ...f, courseId: undefined }))}
                    className="ml-1 hover:bg-accent-200 rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                    aria-label="Elimină filtru disciplină"
                  >
                    <XMarkIcon className="w-3 h-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
              {filters.semester && (
                <Badge tone="info">
                  Semestrul {filters.semester}
                  <button
                    onClick={() => setFilters((f) => ({ ...f, semester: undefined }))}
                    className="ml-1 hover:bg-blue-200 rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                    aria-label="Elimină filtru semestru"
                  >
                    <XMarkIcon className="w-3 h-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
              {filters.academicYear && (
                <Badge tone="primary">
                  {filters.academicYear}
                  <button
                    onClick={() => setFilters((f) => ({ ...f, academicYear: undefined }))}
                    className="ml-1 hover:bg-primary-100 rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                    aria-label="Elimină filtru an"
                  >
                    <XMarkIcon className="w-3 h-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
            </div>
          )
        }
        resultCount={{ current: evaluations.length, total: pagination.total }}
        active={hasActiveFilters}
        onClearAll={clearFilters}
      />

      {/* Export */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="md"
          icon={<ArrowDownTrayIcon />}
          onClick={handleExport}
          loading={exporting}
          disabled={evaluations.length === 0}
        >
          {hasActiveFilters ? 'Exportă date filtrate (CSV)' : 'Exportă toate datele (CSV)'}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card tone="danger" className="flex gap-3 items-start">
          <ExclamationTriangleIcon className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-danger-fg">{error}</p>
        </Card>
      )}

      {/* Evaluations list */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-base font-semibold">Lista evaluări</h2>
          <span className="text-xs text-neutral-500">
            {evaluations.length} {evaluations.length === 1 ? 'evaluare' : 'evaluări'}
          </span>
        </div>
        <div className="p-4">
          <EvaluationsList
            evaluations={evaluations}
            loading={loading}
            onLoadMore={() => fetchEvaluations(true)}
            hasMore={pagination.hasMore}
            showFilters={false}
          />
        </div>
      </Card>

      {/* Info */}
      <Card tone="info" className="flex gap-3 items-start">
        <InformationCircleIcon className="w-5 h-5 text-info shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold text-info-fg mb-1">Despre rapoarte</h3>
          <p className="text-sm text-info-fg">
            Toate datele afișate sunt complet anonime. Nu poți identifica studenții care au completat
            evaluările. Poți exporta datele în format CSV pentru analiză în Excel sau alte aplicații.
          </p>
        </div>
      </Card>
    </div>
  );
}
