import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import StatCard from '../components/professor/StatCard';
import ResponseChart from '../components/professor/ResponseChart';
import AnonymizedFeedback from '../components/professor/AnonymizedFeedback';

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
    distribution: {
      score1: number;
      score2: number;
      score3: number;
      score4: number;
      score5: number;
    };
  }>;
  textFeedback: Array<{
    question: string;
    category: string;
    answer: string;
    submittedAt: string;
  }> | { message: string };
}

const ProfessorCourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);

  const [loading, setLoading] = useState(true);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchCourseStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getProfessorCourseStats(courseId);
        setCourseStats(data);
      } catch (err: any) {
        console.error('Error fetching course stats:', err);
        setError(err.response?.data?.error || 'Eroare la încărcarea statisticilor cursului');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseStats();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă statisticile cursului...</p>
        </div>
      </div>
    );
  }

  if (error || !courseStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-900">Eroare</h3>
          </div>
          <p className="text-red-700 mb-4">{error || 'Cursul nu a fost găsit'}</p>
          <Link
            to="/professor"
            className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Înapoi la dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Get unique categories
  const categories = ['all', ...new Set(courseStats.questionDistribution.map(q => q.category))];

  // Filter questions by category
  const filteredQuestions = selectedCategory === 'all'
    ? courseStats.questionDistribution
    : courseStats.questionDistribution.filter(q => q.category === selectedCategory);

  // Calculate category averages
  const categoryAverages = categories.slice(1).map(category => {
    const categoryQuestions = courseStats.questionDistribution.filter(q => q.category === category);
    const total = categoryQuestions.reduce((sum, q) => sum + (q.averageScore || 0), 0);
    const avg = categoryQuestions.length > 0 ? total / categoryQuestions.length : 0;
    return { category, average: avg, count: categoryQuestions.length };
  });

  const handleExport = async () => {
    try {
      const blob = await api.exportProfessorData({ courseId });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluari-${courseStats.course.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Eroare la exportul datelor');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/professor"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Înapoi la dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {courseStats.course.name}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {courseStats.course.courseType}
            </span>
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Semestrul {courseStats.course.semester}
            </span>
            <span>{courseStats.course.academicYear}</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="Total Evaluări"
            value={courseStats.statistics.totalEvaluations}
            subtitle="evaluări completate"
            variant="primary"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />

          <StatCard
            title="Scor Mediu"
            value={courseStats.statistics.averageScore
              ? courseStats.statistics.averageScore.toFixed(2)
              : 'N/A'
            }
            subtitle="din 5.00"
            variant={
              courseStats.statistics.averageScore
                ? courseStats.statistics.averageScore >= 4.5 ? 'success'
                : courseStats.statistics.averageScore >= 4.0 ? 'primary'
                : courseStats.statistics.averageScore >= 3.5 ? 'warning'
                : 'danger'
                : 'default'
            }
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          />
        </div>

        {/* Category Averages */}
        {categoryAverages.length > 0 && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Medii pe Categorii</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAverages.map((item) => (
                <div key={item.category} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">{item.category}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${
                      item.average >= 4.5 ? 'text-green-600' :
                      item.average >= 4.0 ? 'text-blue-600' :
                      item.average >= 3.5 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {item.average.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">/ 5.00</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.count} întrebări</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Distribution Chart */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Distribuție Răspunsuri</h2>
            <div className="flex items-center gap-4">
              {/* Category Filter */}
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Toate categoriile</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Chart Type Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    chartType === 'bar'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Bare
                </button>
                <button
                  onClick={() => setChartType('pie')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    chartType === 'pie'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pie
                </button>
              </div>
            </div>
          </div>

          <ResponseChart
            data={filteredQuestions}
            chartType={chartType}
            showLegend={true}
            height={500}
          />
        </div>

        {/* Question Details Table */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Detalii Întrebări</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Întrebare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categorie
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Răspunsuri
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medie
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuestions.map((question) => (
                  <tr key={question.questionId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {question.questionText}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {question.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-center">
                      {question.responseCount}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-center">
                      <span className={`${
                        question.averageScore && question.averageScore >= 4.5 ? 'text-green-600' :
                        question.averageScore && question.averageScore >= 4.0 ? 'text-blue-600' :
                        question.averageScore && question.averageScore >= 3.5 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {question.averageScore ? question.averageScore.toFixed(2) : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Text Feedback */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Feedback Text Anonim</h2>
          <AnonymizedFeedback
            responses={courseStats.textFeedback}
            courseId={courseStats.course.id}
            courseName={courseStats.course.name}
          />
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportă Date (CSV)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessorCourseDetails;
