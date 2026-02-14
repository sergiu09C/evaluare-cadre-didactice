import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import EvaluationsList from '../components/professor/EvaluationsList';
import ExportButton from '../components/professor/ExportButton';

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

const ProfessorReports: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.getProfessorCourses();
        setCourses(response.courses);
      } catch (err) {
        console.error('Error fetching courses:', err);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    fetchEvaluations();
  }, [filters]);

  const fetchEvaluations = async (append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const offset = append ? pagination.offset + pagination.limit : 0;

      const response = await api.getProfessorEvaluations({
        ...filters,
        limit: pagination.limit,
        offset
      });

      if (append) {
        setEvaluations(prev => [...prev, ...response.evaluations]);
      } else {
        setEvaluations(response.evaluations);
      }

      setPagination({
        limit: response.pagination.limit,
        offset: response.pagination.offset,
        total: response.pagination.total,
        hasMore: response.pagination.hasMore
      });
    } catch (err: any) {
      console.error('Error fetching evaluations:', err);
      setError(err.response?.data?.error || 'Eroare la încărcarea evaluărilor');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchEvaluations(true);
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handleExport = async () => {
    try {
      const blob = await api.exportProfessorData(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Generate filename based on filters
      let filename = 'evaluari-profesor';
      if (filters.courseId) {
        const course = courses.find(c => c.id === filters.courseId);
        if (course) {
          filename += `-${course.name.replace(/\s+/g, '-')}`;
        }
      }
      if (filters.semester) {
        filename += `-${filters.semester.replace(/\s+/g, '-')}`;
      }
      if (filters.academicYear) {
        filename += `-${filters.academicYear}`;
      }
      filename += `-${new Date().toISOString().split('T')[0]}.csv`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Eroare la exportul datelor');
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  // Get unique semesters and academic years from courses
  const semesters = [...new Set(courses.map(c => c.semester))].sort();
  const academicYears = [...new Set(courses.map(c => c.academicYear))].sort().reverse();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/professor"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
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
            Rapoarte Evaluări
          </h1>
          <p className="text-gray-600">
            Vizualizează și exportă toate evaluările primite cu filtrare avansată
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total evaluări</p>
                <p className="text-3xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Cursuri cu evaluări</p>
                <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
              </div>
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Evaluări filtrate</p>
                <p className="text-3xl font-bold text-gray-900">{evaluations.length}</p>
              </div>
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Filtre</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Resetează filtrele
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Course Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Curs
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.courseId || ''}
                onChange={(e) => handleFilterChange({
                  ...filters,
                  courseId: e.target.value ? Number(e.target.value) : undefined
                })}
              >
                <option value="">Toate cursurile</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name} - {course.courseType}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semestru
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.semester || ''}
                onChange={(e) => handleFilterChange({
                  ...filters,
                  semester: e.target.value || undefined
                })}
              >
                <option value="">Toate semestrele</option>
                {semesters.map(semester => (
                  <option key={semester} value={semester}>
                    Semestrul {semester}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                An academic
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.academicYear || ''}
                onChange={(e) => handleFilterChange({
                  ...filters,
                  academicYear: e.target.value || undefined
                })}
              >
                <option value="">Toți anii</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filtre active:</span>
              {filters.courseId && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  Curs: {courses.find(c => c.id === filters.courseId)?.name}
                  <button
                    onClick={() => handleFilterChange({ ...filters, courseId: undefined })}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filters.semester && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  Semestrul {filters.semester}
                  <button
                    onClick={() => handleFilterChange({ ...filters, semester: undefined })}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filters.academicYear && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {filters.academicYear}
                  <button
                    onClick={() => handleFilterChange({ ...filters, academicYear: undefined })}
                    className="hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="mb-6">
          <ExportButton
            onExport={handleExport}
            disabled={evaluations.length === 0}
            label={hasActiveFilters ? "Exportă date filtrate (CSV)" : "Exportă toate datele (CSV)"}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Evaluations List */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Lista Evaluări
            </h2>
            <span className="text-sm text-gray-600">
              {evaluations.length} {evaluations.length === 1 ? 'evaluare' : 'evaluări'}
            </span>
          </div>

          <EvaluationsList
            evaluations={evaluations}
            loading={loading}
            onLoadMore={handleLoadMore}
            hasMore={pagination.hasMore}
            showFilters={false}
          />
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Despre rapoarte</h3>
              <p className="text-sm text-blue-700">
                Toate datele afișate sunt complet anonime. Nu poți identifica studenții care au completat evaluările.
                Poți exporta datele în format CSV pentru analiză în Excel sau alte aplicații.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorReports;
