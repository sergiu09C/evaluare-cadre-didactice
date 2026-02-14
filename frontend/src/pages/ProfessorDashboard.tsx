import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import StatCard from '../components/professor/StatCard';
import CourseCard from '../components/professor/CourseCard';

interface DashboardData {
  summary: {
    totalEvaluations: number;
    overallAverage: number | null;
    uniqueStudents: number;
  };
  courseEvaluations: Array<{
    courseId: number;
    courseName: string;
    courseType: string;
    semester: string;
    evaluationCount: number;
    averageScore: number | null;
  }>;
  trend: {
    current: number | null;
    previous: number | null;
    change: number | null;
  };
}

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

const ProfessorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard data and courses in parallel
        const [dashboardResponse, coursesResponse] = await Promise.all([
          api.getProfessorDashboard(),
          api.getProfessorCourses()
        ]);

        setDashboardData(dashboardResponse);
        setCourses(coursesResponse.courses);
      } catch (err: any) {
        console.error('Error fetching professor dashboard:', err);
        setError(err.response?.data?.error || 'A apărut o eroare la încărcarea datelor');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă datele...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-900">Eroare</h3>
          </div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (!dashboardData?.trend.change) return null;

    const isPositive = dashboardData.trend.change > 0;
    return (
      <svg className={`w-5 h-5 ${isPositive ? 'text-green-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
        {isPositive ? (
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        ) : (
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        )}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bine ai venit, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gray-600">
            Aici găsești statisticile tale și feedback-ul primit de la studenți
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Evaluări"
            value={dashboardData?.summary.totalEvaluations || 0}
            subtitle="evaluări primite"
            variant="primary"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />

          <StatCard
            title="Medie Generală"
            value={dashboardData?.summary.overallAverage
              ? dashboardData.summary.overallAverage.toFixed(2)
              : 'N/A'
            }
            subtitle="din 5.00"
            variant={
              dashboardData?.summary.overallAverage
                ? dashboardData.summary.overallAverage >= 4.5 ? 'success'
                : dashboardData.summary.overallAverage >= 4.0 ? 'primary'
                : dashboardData.summary.overallAverage >= 3.5 ? 'warning'
                : 'danger'
                : 'default'
            }
            trend={
              dashboardData?.trend.change
                ? {
                    value: Math.abs(dashboardData.trend.change),
                    isPositive: dashboardData.trend.change > 0
                  }
                : undefined
            }
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          />

          <StatCard
            title="Studenți Unici"
            value={dashboardData?.summary.uniqueStudents || 0}
            subtitle="studenți te-au evaluat"
            variant="default"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        </div>

        {/* Trend Information */}
        {dashboardData?.trend.change !== null && dashboardData?.trend.change !== undefined && (
          <div className={`mb-8 p-4 rounded-lg border-2 ${
            dashboardData.trend.change > 0
              ? 'bg-green-50 border-green-200'
              : dashboardData.trend.change < 0
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <p className="text-sm font-medium">
                {dashboardData.trend.change > 0 && (
                  <span className="text-green-700">
                    Felicitări! Media ta a crescut cu {Math.abs(dashboardData.trend.change).toFixed(2)} puncte față de semestrul anterior.
                  </span>
                )}
                {dashboardData.trend.change < 0 && (
                  <span className="text-red-700">
                    Media ta a scăzut cu {Math.abs(dashboardData.trend.change).toFixed(2)} puncte față de semestrul anterior.
                  </span>
                )}
                {dashboardData.trend.change === 0 && (
                  <span className="text-gray-700">
                    Media ta este aceeași ca în semestrul anterior.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Courses Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Cursurile Mele</h2>
            <span className="text-sm text-gray-600">
              {courses.length} {courses.length === 1 ? 'curs' : 'cursuri'}
            </span>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nu ai cursuri înregistrate</h3>
              <p className="text-gray-600">
                Momentan nu există cursuri asociate contului tău.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  name={course.name}
                  courseType={course.courseType}
                  semester={course.semester}
                  academicYear={course.academicYear}
                  statistics={course.statistics}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Acțiuni Rapide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/professor/reports"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Vezi Rapoarte Detaliate</p>
                <p className="text-sm text-gray-600">Analizează feedback-ul primit</p>
              </div>
            </a>

            <button
              onClick={async () => {
                try {
                  const blob = await api.exportProfessorData();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `evaluari-profesor-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (err) {
                  console.error('Export error:', err);
                  alert('Eroare la exportul datelor');
                }
              }}
              className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
            >
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Exportă Date (CSV)</p>
                <p className="text-sm text-gray-600">Descarcă toate evaluările</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboard;
