import React, { useState } from 'react';
import { api } from '../../services/api';

interface ExportButtonProps {
  courseId?: number;
  semester?: string;
  academicYear?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  courseId,
  semester,
  academicYear,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId.toString());
      if (semester) params.append('semester', semester);
      if (academicYear) params.append('academicYear', academicYear);

      // Make API call
      const response = await api.get(`/professor/export?${params.toString()}`, {
        responseType: 'blob' // Important for file download
      });

      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = courseId
        ? `evaluari-curs-${courseId}-${timestamp}.csv`
        : `evaluari-profesor-${timestamp}.csv`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.response?.data?.error || 'Eroare la exportul datelor. Te rugăm să încerci din nou.');
    } finally {
      setIsExporting(false);
    }
  };

  const variantStyles = {
    primary: 'bg-info hover:bg-info-fg text-white border-transparent',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-transparent',
    outline: 'bg-white hover:bg-neutral-25 text-neutral-700 border-neutral-200 hover:border-gray-400'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={widthClass}>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`
          inline-flex items-center justify-center gap-2
          border rounded-lg font-medium
          transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${widthClass}
          ${className}
        `}
      >
        {isExporting ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Se exportă...</span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Export CSV</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Închide
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
