/**
 * ProfessorDashboard — varianta SLIM (post-audit R1).
 * Conținut UNIC: listă „Cursurile mele" cu navigare + export CSV + 2 KPI personale (Media ta + Evaluări primite).
 * Restul (distribuție scoruri, radar dimensiuni, trend) → vezi Acasă.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Card, Badge, Button, KPICard, EmptyState } from '../components/ui';
import { TERMS } from '../i18n/glossary';
import {
  BookOpenIcon,
  ArrowDownTrayIcon,
  ArrowRightIcon,
  DocumentChartBarIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { IllBooks } from '../components/illustrations';

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

function scoreTone(score: number | null): 'success' | 'warning' | 'danger' | 'neutral' {
  if (score == null) return 'neutral';
  if (score >= 4) return 'success';
  if (score >= 3) return 'warning';
  return 'danger';
}

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [summary, setSummary] = useState<{
    totalEvaluations: number;
    overallAverage: number | null;
    uniqueStudents?: number;
    gradeOutOf10?: number | null;
  } | null>(null);
  const [homeStats, setHomeStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getProfessorCourses(),
      api.getProfessorDashboard(),
      api.getHomeStats().catch(() => null),
    ])
      .then(([c, d, hs]) => {
        setCourses(c.courses || []);
        setSummary(d.summary ?? null);
        setHomeStats(hs);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await api.exportProfessorData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluari-profesor-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setExporting(false);
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
    <div className="flex flex-col gap-7 max-w-[1100px]">
      <button
        onClick={() => navigate('/professor')}
        className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-800 self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1"
      >
        <HomeIcon className="w-3.5 h-3.5" aria-hidden="true" />
        Înapoi la Acasă
      </button>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-[30px] font-semibold tracking-tight text-neutral-800">
            Dashboard profesor — {user?.firstName} {user?.lastName}
          </h1>
          <p className="mt-1.5 text-neutral-500 text-sm md:text-[15px] max-w-[640px]">
            Lista cursurilor tale cu acces rapid la detalii și export. Pentru grafice și
            comparații platformă, vezi pagina <button
              type="button"
              onClick={() => navigate('/professor')}
              className="text-accent-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-0.5"
            >
              Acasă
            </button>.
          </p>
        </div>
        <Button variant="secondary" size="md" icon={<ArrowDownTrayIcon />} onClick={handleExport} loading={exporting}>
          Exportă date (CSV)
        </Button>
      </div>

      {/* KPI personale */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ecd-reveal">
        <KPICard
          label={TERMS.evaluationsReceived}
          value={summary?.totalEvaluations?.toLocaleString('ro-RO') ?? 0}
          footnote="cumulat pe toate cursurile"
        />
        <KPICard
          label="Media ta"
          value={summary?.overallAverage != null ? summary.overallAverage.toFixed(2).replace('.', ',') : '—'}
          suffix={summary?.overallAverage != null ? '/ 5,00' : ''}
          footnote={`${TERMS.scoreAvg} pe toate evaluările`}
        />
        <KPICard
          label="Discipline asignate"
          value={courses.length}
          footnote={
            courses.length === 0
              ? 'Niciuna încă'
              : `${courses.filter((c) => c.statistics.completedEvaluations > 0).length} cu evaluări primite`
          }
        />
        <KPICard
          label="Notă /10"
          value={summary?.gradeOutOf10 != null ? summary.gradeOutOf10.toFixed(2).replace('.', ',') : '—'}
          suffix={summary?.gradeOutOf10 != null ? '/ 10' : ''}
          footnote="echivalent academic"
        />
      </div>

      {/* Pipeline personal — etape evaluare proprie */}
      {homeStats?.pipeline && Array.isArray(homeStats.pipeline) && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-800 mb-1">Călătoria evaluării tale</h2>
          <p className="text-[13px] text-neutral-500 mb-3">
            Cum se transformă studenții tăi eligibili în feedback acționabil pentru tine.
          </p>
          <Card padding="md" className="ecd-reveal">
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {homeStats.pipeline.map((s: any, i: number) => (
                <li key={s.stage} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-full bg-accent-50 text-accent-700 text-sm font-bold flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] text-neutral-500 leading-tight">{s.label}</div>
                    <div className="text-xl font-semibold text-neutral-800 leading-tight mt-0.5">
                      {Number(s.value).toLocaleString('ro-RO')}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}

      {/* Cursurile mele — listă unică */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-800 mb-3 flex items-center gap-2">
          <BookOpenIcon className="w-5 h-5 text-accent-600" aria-hidden="true" />
          Cursurile mele ({courses.length})
        </h2>
        {courses.length === 0 ? (
          <EmptyState
            illustration={<IllBooks className="w-full h-full" />}
            title="Niciun curs încă"
            description="Cursurile asignate îți vor apărea aici după ce vor fi configurate de administrator."
          />
        ) : (
          <Card padding="none" className="overflow-hidden ecd-reveal">
            {courses.map((c, i) => (
              <button
                key={c.id}
                onClick={() => navigate(`/professor/course/${c.id}`)}
                className={`w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-neutral-25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 ${
                  i < courses.length - 1 ? 'border-b border-neutral-100' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-semibold text-neutral-800">{c.name}</h3>
                    <Badge tone="accent">{c.courseType}</Badge>
                    <Badge tone="neutral">Sem {c.semester}</Badge>
                  </div>
                  <p className="text-[12px] text-neutral-500">
                    {c.statistics.completedEvaluations} / {c.statistics.totalEvaluations} evaluări trimise · {c.academicYear}
                  </p>
                </div>
                <Badge tone={scoreTone(c.statistics.averageScore)}>
                  {c.statistics.averageScore != null
                    ? c.statistics.averageScore.toFixed(2).replace('.', ',')
                    : '—'}
                  <span className="ml-1 opacity-70 text-[10px]">/ 5</span>
                </Badge>
                <ArrowRightIcon className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </Card>
        )}
      </div>

      {/* Shortcut-uri */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ecd-reveal">
        <Button variant="secondary" icon={<DocumentChartBarIcon />} iconRight={<ArrowRightIcon />} onClick={() => navigate('/professor/reports')}>
          Rapoarte detaliate
        </Button>
        <Button variant="secondary" iconRight={<ArrowRightIcon />} onClick={() => navigate('/professor/students')}>
          Studenții mei
        </Button>
        <Button variant="secondary" iconRight={<ArrowRightIcon />} onClick={() => navigate('/professor/actions')}>
          Acțiuni CEAC
        </Button>
      </div>
    </div>
  );
}
