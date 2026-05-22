import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import ResponseChart from '../components/professor/ResponseChart';
import StackedSemanticBar from '../components/charts/StackedSemanticBar';
import AnonymizedFeedback from '../components/professor/AnonymizedFeedback';
import IndividualEvaluations from '../components/professor/IndividualEvaluations';
import { Card, Badge, Button, KPICard, Select, EmptyState } from '../components/ui';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  BookOpenIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface CourseStats {
  course: {
    id: number;
    name: string;
    courseType: string;
    semester: string;
    academicYear: string;
  };
  statistics: {
    totalEvaluations: number;
    averageScore: number | null;
  };
  questionDistribution: Array<{
    questionId: number;
    questionText: string;
    category: string;
    type: string;
    averageScore: number | null;
    responseCount: number;
    distribution: { score1: number; score2: number; score3: number; score4: number; score5: number };
  }>;
  textFeedback:
    | Array<{ question: string; category: string; answer: string; submittedAt: string }>
    | { message: string };
}

function scoreColor(score: number | null): string {
  if (score == null) return 'text-neutral-500';
  if (score >= 4.5) return 'text-success-fg';
  if (score >= 4.0) return 'text-info-fg';
  if (score >= 3.5) return 'text-warning-fg';
  return 'text-danger-fg';
}

function scoreTone(score: number | null): 'success' | 'info' | 'warning' | 'danger' | 'neutral' {
  if (score == null) return 'neutral';
  if (score >= 4.5) return 'success';
  if (score >= 4.0) return 'info';
  if (score >= 3.5) return 'warning';
  return 'danger';
}

export default function ProfessorCourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const courseId = Number(id);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'stacked'>('stacked');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await api.getProfessorCourseStats(courseId);
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Eroare la încărcarea statisticilor cursului');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const handleExport = async () => {
    if (!stats) return;
    try {
      setExporting(true);
      const blob = await api.exportProfessorData({ courseId });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluari-${stats.course.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
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
      <div className="text-center py-16" role="status" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4" aria-hidden="true" />
        <div className="text-neutral-500">Se încarcă statisticile cursului...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card tone="danger" className="flex gap-3 items-start max-w-2xl">
        <ExclamationTriangleIcon className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="font-semibold text-danger-fg">Eroare</h3>
          <p className="text-sm text-danger-fg mt-1">{error || 'Cursul nu a fost găsit'}</p>
          <Button variant="secondary" size="sm" className="mt-3" icon={<ArrowLeftIcon />} onClick={() => navigate('/professor')}>
            Înapoi la dashboard
          </Button>
        </div>
      </Card>
    );
  }

  const categories = ['all', ...new Set(stats.questionDistribution.map((q) => q.category))];
  const filteredQuestions =
    selectedCategory === 'all'
      ? stats.questionDistribution
      : stats.questionDistribution.filter((q) => q.category === selectedCategory);

  const categoryAverages = categories.slice(1).map((category) => {
    const qs = stats.questionDistribution.filter((q) => q.category === category);
    const total = qs.reduce((sum, q) => sum + (q.averageScore || 0), 0);
    const avg = qs.length > 0 ? total / qs.length : 0;
    return { category, average: avg, count: qs.length };
  });

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
          {stats.course.name}
        </h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <BookOpenIcon className="w-4 h-4" aria-hidden="true" />
            {stats.course.courseType}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4" aria-hidden="true" />
            Semestrul {stats.course.semester} · {stats.course.academicYear}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard
          label="Total evaluări"
          value={stats.statistics.totalEvaluations}
          footnote="evaluări completate"
        />
        <KPICard
          label="Scor mediu"
          value={stats.statistics.averageScore != null ? stats.statistics.averageScore.toFixed(2).replace('.', ',') : '—'}
          suffix={stats.statistics.averageScore != null ? '/ 5,00' : ''}
        />
      </div>

      {/* Category averages */}
      {categoryAverages.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">Medii pe dimensiuni</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAverages.map((item) => (
              <Card key={item.category} padding="md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {item.category}
                  </h3>
                  <Badge tone={scoreTone(item.average)}>
                    {item.average >= 4.5
                      ? 'Excelent'
                      : item.average >= 4.0
                        ? 'Foarte bun'
                        : item.average >= 3.5
                          ? 'Bun'
                          : 'Atenție'}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`font-display text-3xl font-semibold ${scoreColor(item.average)}`}>
                    {item.average.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm text-neutral-500">/ 5,00</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1.5">{item.count} întrebări</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Distribution chart */}
      <Card>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-xl font-semibold text-neutral-800">Distribuție răspunsuri</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              wrapperClassName="min-w-[160px]"
            >
              <option value="all">Toate categoriile</option>
              {categories.slice(1).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <div className="inline-flex p-1 bg-neutral-100 rounded-lg">
              {[
                { id: 'stacked' as const, label: 'Semantic' },
                { id: 'bar' as const, label: 'Bare' },
                { id: 'pie' as const, label: 'Pie' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setChartType(opt.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 ${
                    chartType === opt.id ? 'bg-white text-neutral-800 shadow-elev-1' : 'text-neutral-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {chartType === 'stacked' ? (
          <StackedSemanticBar
            data={filteredQuestions as any}
            referenceScore={stats.statistics.averageScore}
            referenceLabel="Media curs"
            height={500}
          />
        ) : (
          <ResponseChart data={filteredQuestions} chartType={chartType} showLegend height={500} />
        )}
      </Card>

      {/* Question detail table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-semibold">Detalii întrebări</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-25">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Întrebare
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Categorie
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Răspunsuri
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Medie
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q, i) => (
                <tr
                  key={q.questionId}
                  className={`hover:bg-neutral-25 ${i < filteredQuestions.length - 1 ? 'border-b border-neutral-100' : ''}`}
                >
                  <td className="px-6 py-4 text-sm text-neutral-800">{q.questionText}</td>
                  <td className="px-6 py-4">
                    <Badge tone="accent">{q.category}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-800 text-center font-mono">
                    {q.responseCount}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-display font-semibold ${scoreColor(q.averageScore)}`}>
                      {q.averageScore != null ? q.averageScore.toFixed(2).replace('.', ',') : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Text feedback */}
      <Card>
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">Feedback text anonim</h2>
        {Array.isArray(stats.textFeedback) && stats.textFeedback.length === 0 ? (
          <EmptyState
            title="Niciun comentariu text încă"
            description="Comentariile vor apărea aici după ce mai mulți studenți completează evaluarea cu texte deschise."
          />
        ) : (
          <AnonymizedFeedback
            responses={stats.textFeedback as any}
            courseId={stats.course.id}
            courseName={stats.course.name}
          />
        )}
      </Card>

      {/* Drill-down: evaluări individuale anonime (k≥5) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[18px] font-semibold text-neutral-800">
            Evaluări individuale (anonime)
          </h2>
        </div>
        <IndividualEvaluations courseId={stats.course.id} />
      </Card>

      {/* Export */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="lg"
          icon={<ArrowDownTrayIcon />}
          onClick={handleExport}
          loading={exporting}
        >
          Exportă date (CSV)
        </Button>
      </div>
    </div>
  );
}
