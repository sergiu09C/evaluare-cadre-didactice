import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card, Badge, Button, Avatar, EmptyState, KPICard } from '../components/ui';
import { TERMS } from '../i18n/glossary';
import { ArrowRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { scoreTone } from '../utils/scoreFormatting';

interface CourseData {
  id: number;
  name: string;
  courseType: string;
  semester: string;
  academicYear: string;
  statistics: {
    totalEvaluations: number;
    completedEvaluations: number;
    averageScore: number | null;
  };
}

type Filter = 'all' | 'curs' | 'laborator' | 'seminar';

function avatarTone(idx: number): 'primary' | 'accent' | 'mint' | 'warm' {
  return (['primary', 'accent', 'mint', 'warm'] as const)[idx % 4];
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || '??'
  );
}

export default function ProfessorCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.getProfessorCourses();
        setCourses(resp.courses);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? courses
        : courses.filter((c) => c.courseType.toLowerCase() === filter),
    [courses, filter],
  );

  const counts = useMemo(
    () => ({
      all: courses.length,
      curs: courses.filter((c) => c.courseType.toLowerCase() === 'curs').length,
      laborator: courses.filter((c) => c.courseType.toLowerCase() === 'laborator').length,
      seminar: courses.filter((c) => c.courseType.toLowerCase() === 'seminar').length,
    }),
    [courses],
  );

  const totalEvals = courses.reduce((s, c) => s + c.statistics.totalEvaluations, 0);
  const overallAvg =
    courses.length === 0
      ? null
      : courses
          .filter((c) => c.statistics.averageScore != null)
          .reduce((s, c, _, arr) => s + (c.statistics.averageScore || 0) / arr.length, 0);

  if (loading) {
    return (
      <div className="text-center py-16" role="status" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4" aria-hidden="true" />
        <div className="text-neutral-500">Se încarcă cursurile...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 max-w-[1280px]">
      <div>
        <h1 className="font-display text-2xl md:text-[30px] font-semibold tracking-tight text-neutral-800">
          Cursurile mele
        </h1>
        <p className="mt-1.5 text-neutral-500 text-sm md:text-[15px]">
          Toate disciplinele pe care le predai în semestrul curent.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Total discipline" value={courses.length} />
        <KPICard label={TERMS.evaluationsReceived} value={totalEvals} footnote="cumulat" />
        <KPICard
          label={TERMS.scoreAvgShort}
          value={overallAvg != null ? overallAvg.toFixed(2).replace('.', ',') : '—'}
          suffix={overallAvg != null ? '/ 5,00' : ''}
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filtru tipuri curs">
        {(['all', 'curs', 'laborator', 'seminar'] as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 ${
              filter === f
                ? 'bg-primary-800 text-white border-primary-800'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {f === 'all' ? 'Toate' : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-[11px] opacity-75">{counts[f]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpenIcon className="w-7 h-7" />}
          title="Nu există cursuri în această categorie"
          description="Schimbă filtrul pentru a vedea celelalte cursuri."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          {filtered.map((c, i) => (
            <div
              key={c.id}
              className={`px-6 py-[18px] flex items-center gap-4 transition-colors duration-fast hover:bg-neutral-25 ${
                i < filtered.length - 1 ? 'border-b border-neutral-100' : ''
              }`}
            >
              <Avatar initials={initialsOf(c.name)} tone={avatarTone(i)} size={44} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-neutral-800 tracking-tight truncate">{c.name}</div>
                <div className="text-[13px] text-neutral-500 mt-0.5">
                  {c.courseType} · Sem. {c.semester} · {c.academicYear}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  {c.statistics.totalEvaluations} evaluări totale · {c.statistics.completedEvaluations} complete
                </div>
              </div>
              {c.statistics.averageScore != null && (
                <div className="text-right">
                  <div className="font-display text-lg font-semibold text-neutral-800">
                    {c.statistics.averageScore.toFixed(2).replace('.', ',')}
                  </div>
                  <Badge tone={scoreTone(c.statistics.averageScore)}>
                    {c.statistics.averageScore >= 4.5
                      ? 'Excelent'
                      : c.statistics.averageScore >= 4.0
                        ? 'Foarte bun'
                        : c.statistics.averageScore >= 3.5
                          ? 'Bun'
                          : 'Atenție'}
                  </Badge>
                </div>
              )}
              <Button
                variant="secondary"
                size="sm"
                iconRight={<ArrowRightIcon />}
                onClick={() => navigate(`/professor/course/${c.id}`)}
              >
                Detalii
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
