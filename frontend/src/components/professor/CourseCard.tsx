import React from 'react';
import { Link } from 'react-router-dom';

interface CourseCardProps {
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

const CourseCard: React.FC<CourseCardProps> = ({
  id,
  name,
  courseType,
  semester,
  academicYear,
  statistics
}) => {
  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-neutral-400';
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-green-500';
    if (score >= 3.5) return 'text-yellow-500';
    if (score >= 3.0) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number | null) => {
    if (!score) return 'bg-neutral-25';
    if (score >= 4.5) return 'bg-green-50';
    if (score >= 4.0) return 'bg-green-50';
    if (score >= 3.5) return 'bg-yellow-50';
    if (score >= 3.0) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const completionRate = statistics.totalEvaluations > 0
    ? Math.round((statistics.completedEvaluations / statistics.totalEvaluations) * 100)
    : 0;

  return (
    <Link
      to={`/professor/course/${id}`}
      className="block bg-white rounded-lg border-2 border-neutral-200 p-6 hover:border-info hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-800 mb-1">{name}</h3>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {courseType}
            </span>
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {semester}
            </span>
            <span>{academicYear}</span>
          </div>
        </div>

        {/* Score Badge */}
        <div className={`flex-shrink-0 ${getScoreBgColor(statistics.averageScore)} rounded-lg px-4 py-2 text-center`}>
          <p className={`text-2xl font-bold ${getScoreColor(statistics.averageScore)}`}>
            {statistics.averageScore ? statistics.averageScore.toFixed(2) : 'N/A'}
          </p>
          <p className="text-xs text-neutral-500">Medie</p>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
        <div>
          <p className="text-xs text-neutral-500 mb-1">Total evaluări</p>
          <p className="text-lg font-semibold text-neutral-800">{statistics.totalEvaluations}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-1">Completate</p>
          <p className="text-lg font-semibold text-neutral-800">{statistics.completedEvaluations}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-1">Completare</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-neutral-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  completionRate >= 80 ? 'bg-green-500' :
                  completionRate >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="text-sm font-medium text-neutral-700">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* View Details Link */}
      <div className="mt-4 pt-4 border-t border-neutral-100">
        <span className="text-sm font-medium text-info-fg inline-flex items-center gap-1 hover:gap-2 transition-all">
          Vezi detalii
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
};

export default CourseCard;
