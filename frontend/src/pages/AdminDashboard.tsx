import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { DashboardStats, ProfessorSummary } from '../types';
import DashboardCharts from '../components/DashboardCharts';
import ScreenReaderOnly from '../components/ScreenReaderOnly';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [professors, setProfessors] = useState<ProfessorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [filterOptions, setFilterOptions] = useState<{
    faculties: { id: number; name: string }[];
    levels: string[];
    years: number[];
  } | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<number | ''>('');
  const [selectedLevel, setSelectedLevel] = useState<string | ''>('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');

  const navigate = useNavigate();

  useEffect(() => {
    loadFilterOptions();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedFaculty, selectedLevel, selectedYear]);

  const loadFilterOptions = async () => {
    try {
      const options = await api.getAdminFilterOptions();
      setFilterOptions(options);
    } catch (err: any) {
      console.error('Error loading filter options:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const filters: { facultyId?: number; level?: string; yearNumber?: number } = {};

      if (selectedFaculty) filters.facultyId = Number(selectedFaculty);
      if (selectedLevel) filters.level = selectedLevel;
      if (selectedYear) filters.yearNumber = Number(selectedYear);

      const [dashboardData, professorsData] = await Promise.all([
        api.getDashboardStats(filters),
        api.getAllProfessors(),
      ]);

      setStats(dashboardData);
      setProfessors(professorsData.professors);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedFaculty('');
    setSelectedLevel('');
    setSelectedYear('');
  };

  if (loading) {
    return (
      <div className="text-center py-12" role="status" aria-busy="true" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" aria-hidden="true"></div>
        <div className="text-gray-600">Se încarcă datele dashboard...</div>
        <ScreenReaderOnly>Vă rugăm așteptați în timp ce se încarcă statisticile și informațiile despre evaluări.</ScreenReaderOnly>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card p-6 bg-red-50 border-red-200" role="alert" aria-live="assertive">
        <p className="text-red-700">{error || 'Eroare la încărcarea datelor'}</p>
      </div>
    );
  }

  const facultyChartData = stats.facultyCompletion.map((f) => ({
    faculty: f.faculty.replace('Facultatea de ', ''),
    completionRate: f.completionRate,
  }));

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" id="page-title">Dashboard Administrator</h1>
          <p className="text-gray-600 mt-1">Panorama evaluărilor cadrelor didactice</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/reports')}
            className="btn btn-secondary"
            aria-label="Mergi la pagina de rapoarte avansate"
          >
            <span aria-hidden="true">📊</span> Rapoarte Avansate
          </button>
          <button
            onClick={() => navigate('/admin/controls')}
            className="btn btn-primary"
            aria-label="Mergi la panoul de control"
          >
            <span aria-hidden="true">⚙️</span> Panou Control
          </button>
        </div>
      </div>

      {/* Filters */}
      {filterOptions && (
        <div className="card p-4" role="search" aria-label="Filtrare date dashboard">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filtre:</span>
            </div>

            {/* Faculty Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-faculty" className="text-sm text-gray-600">Facultate:</label>
              <select
                id="filter-faculty"
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value ? Number(e.target.value) : '')}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                aria-label="Filtrare după facultate"
              >
                <option value="">Toate</option>
                {filterOptions.faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name.replace('Facultatea de ', '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-level" className="text-sm text-gray-600">Nivel:</label>
              <select
                id="filter-level"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                aria-label="Filtrare după nivel studii"
              >
                <option value="">Toate</option>
                {filterOptions.levels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-year" className="text-sm text-gray-600">An:</label>
              <select
                id="filter-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                aria-label="Filtrare după an de studiu"
              >
                <option value="">Toți</option>
                {filterOptions.years.map((year) => (
                  <option key={year} value={year}>
                    Anul {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(selectedFaculty || selectedLevel || selectedYear) && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                aria-label="Șterge toate filtrele aplicate"
              >
                <span aria-hidden="true">✕</span> Șterge filtre
              </button>
            )}
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" role="region" aria-labelledby="stats-heading">
        <ScreenReaderOnly id="stats-heading">Statistici generale</ScreenReaderOnly>
        <div className="card p-6" role="region" aria-labelledby="stat-students">
          <div className="text-sm text-gray-600 mb-1" id="stat-students">Total Studenți</div>
          <div className="text-3xl font-bold text-primary-600" aria-label={`${stats.overview.totalStudents} studenți în total`}>{stats.overview.totalStudents}</div>
        </div>
        <div className="card p-6" role="region" aria-labelledby="stat-professors">
          <div className="text-sm text-gray-600 mb-1" id="stat-professors">Total Profesori</div>
          <div className="text-3xl font-bold text-primary-600" aria-label={`${stats.overview.totalProfessors} profesori în total`}>{stats.overview.totalProfessors}</div>
        </div>
        <div className="card p-6" role="region" aria-labelledby="stat-completed">
          <div className="text-sm text-gray-600 mb-1" id="stat-completed">Evaluări Completate</div>
          <div className="text-3xl font-bold text-green-600" aria-label={`${stats.overview.completedEvaluations} evaluări completate din ${stats.overview.totalEvaluations} total`}>
            {stats.overview.completedEvaluations} / {stats.overview.totalEvaluations}
          </div>
        </div>
        <div className="card p-6" role="region" aria-labelledby="stat-rate">
          <div className="text-sm text-gray-600 mb-1" id="stat-rate">Rată de Completare</div>
          <div className="text-3xl font-bold text-blue-600" aria-label={`${stats.overview.completionRate} procente rată de completare`}>{stats.overview.completionRate}%</div>
        </div>
      </div>

      {/* Interactive Charts */}
      <DashboardCharts
        facultyData={facultyChartData}
        completionTrend={stats.completionTrend}
        scoreDistribution={stats.scoreDistribution}
      />

      {/* Top Performers & Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <section className="card p-6" aria-labelledby="top-performers-heading">
          <h2 className="text-lg font-semibold text-green-700 mb-3" id="top-performers-heading">
            <span aria-hidden="true">🏆</span> Top 5 Profesori (scoruri cele mai mari)
          </h2>
          {stats.topPerformers.length > 0 ? (
            <div className="space-y-2">
              {stats.topPerformers.map((prof, index) => (
                <div
                  key={prof.id}
                  className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium">
                    {index + 1}. {prof.name}
                  </span>
                  <span className="text-green-600 font-bold">{prof.averageScore?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nu există date suficiente</p>
          )}
        </section>

        {/* Needs Attention */}
        <section className="card p-6" aria-labelledby="needs-attention-heading">
          <h2 className="text-lg font-semibold text-red-700 mb-3" id="needs-attention-heading">
            <span aria-hidden="true">⚠️</span> Necesită atenție (scoruri {'<'} 2.5)
          </h2>
          {stats.needsAttention.length > 0 ? (
            <div className="space-y-2">
              {stats.needsAttention.map((prof) => (
                <div
                  key={prof.id}
                  className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium">{prof.name}</span>
                  <span className="text-red-600 font-bold">{prof.averageScore?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-600 text-sm"><span aria-hidden="true">✓</span> Nu există profesori cu scoruri critice</p>
          )}
        </section>
      </div>

      {/* Professors Table */}
      <section className="card" aria-labelledby="professors-table-heading">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900" id="professors-table-heading">
            Lista tuturor profesorilor ({professors.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Tabel cu lista tuturor profesorilor">
            <caption className="sr-only">
              Tabel cu {professors.length} profesori, afișând nume, departament, facultate, număr evaluări, scor mediu, status și acțiuni disponibile
            </caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nume
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Departament
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Facultate
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Evaluări
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Scor mediu
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acțiuni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {professors.map((prof) => (
                <tr key={prof.id} className="hover:bg-gray-50">
                  <th scope="row" className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{prof.name}</div>
                  </th>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{prof.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{prof.faculty}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {prof.stats?.completedEvaluations || 0} / {prof.stats?.totalEvaluations || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {prof.stats?.averageScore ? (
                      <span
                        className={`text-sm font-semibold ${
                          prof.stats.averageScore >= 4
                            ? 'text-green-600'
                            : prof.stats.averageScore >= 3
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {prof.stats.averageScore.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {prof.stats?.isCritical ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800" role="status" aria-label="Status critic">
                        <span aria-hidden="true">⚠️</span> Critic
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800" role="status" aria-label="Status OK">
                        <span aria-hidden="true">✓</span> OK
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => navigate(`/admin/professor/${prof.id}`)}
                      className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                      aria-label={`Vezi detalii despre ${prof.name}`}
                    >
                      Vezi detalii <span aria-hidden="true">→</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
