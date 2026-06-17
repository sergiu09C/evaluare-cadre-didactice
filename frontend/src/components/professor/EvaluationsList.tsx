import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scoreTextColor, scoreBadgeClasses } from '../../utils/scoreFormatting';
import { formatDateTime } from '../../utils/dateFormatting';

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

interface EvaluationsListProps {
  evaluations: Evaluation[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  showFilters?: boolean;
  onFilterChange?: (filters: FilterState) => void;
}

interface FilterState {
  courseId?: number;
  semester?: string;
  academicYear?: string;
}

const EvaluationsList: React.FC<EvaluationsListProps> = ({
  evaluations,
  loading = false,
  onLoadMore,
  hasMore = false,
  showFilters = false,
  onFilterChange
}) => {
  const [filters, setFilters] = useState<FilterState>({});
  const navigate = useNavigate();

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="bg-neutral-25 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Semestru
            </label>
            <select
              className="w-full rounded-md border-neutral-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.semester || ''}
              onChange={(e) => handleFilterChange('semester', e.target.value)}
            >
              <option value="">Toate semestrele</option>
              <option value="Semestrul 1">Semestrul 1</option>
              <option value="Semestrul 2">Semestrul 2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              An academic
            </label>
            <select
              className="w-full rounded-md border-neutral-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.academicYear || ''}
              onChange={(e) => handleFilterChange('academicYear', e.target.value)}
            >
              <option value="">Toți anii</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
            </select>
          </div>
        </div>
      )}

      {/* Evaluations List */}
      {loading && evaluations.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : evaluations.length === 0 ? (
        <div className="text-center py-12 bg-neutral-25 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-800">Nu există evaluări</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Nu s-au găsit evaluări pentru filtrele selectate.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluations.map((evaluation) => (
            <button
              key={evaluation.id}
              type="button"
              onClick={() => navigate(`/professor/evaluations/${evaluation.id}`)}
              className="block w-full text-left bg-white rounded-lg border border-neutral-200 p-4 hover:border-accent-400 hover:shadow-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40"
              aria-label={`Deschide detaliile evaluării pentru ${evaluation.courseName}, ${evaluation.semester} ${evaluation.academicYear}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-neutral-800">
                      {evaluation.courseName}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${scoreBadgeClasses(evaluation.averageScore)}`}>
                      {evaluation.averageScore ? evaluation.averageScore.toFixed(2) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {evaluation.courseType}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {evaluation.semester}
                    </span>
                    <span>{evaluation.academicYear}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Trimis la: {formatDateTime(evaluation.submittedAt)}
                  </p>
                </div>
                <div className={`flex-shrink-0 text-right ${scoreTextColor(evaluation.averageScore)}`}>
                  <p className="text-3xl font-bold">
                    {evaluation.averageScore ? evaluation.averageScore.toFixed(1) : '-'}
                  </p>
                  <p className="text-xs text-neutral-500">din 5.0</p>
                  <p className="text-[11px] text-accent-600 mt-2 font-medium">
                    Vezi detalii →
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-2 bg-info text-white rounded-lg hover:bg-info-fg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Se încarcă...' : 'Încarcă mai multe'}
          </button>
        </div>
      )}
    </div>
  );
};

export default EvaluationsList;
