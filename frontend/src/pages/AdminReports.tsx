import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generatePrintableReport } from '../utils/pdfExport';
import { useTabNavigation } from '../hooks/useTabNavigation';

type ReportTab = 'overview' | 'faculty' | 'year' | 'courseType' | 'discipline';

export default function AdminReports() {
  const navigate = useNavigate();
  const reportContentRef = useRef<HTMLDivElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tab order for keyboard navigation
  const tabs = [
    { id: 'overview' as ReportTab, label: 'Panorama Generală', icon: '📊' },
    { id: 'faculty' as ReportTab, label: 'Pe Facultăți', icon: '🏛️' },
    { id: 'year' as ReportTab, label: 'Pe Ani de Studiu', icon: '📅' },
    { id: 'courseType' as ReportTab, label: 'Pe Tip Curs', icon: '📚' },
    { id: 'discipline' as ReportTab, label: 'Comparație Discipline', icon: '🔍' },
  ];

  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  // Enable keyboard navigation for tabs
  useTabNavigation({
    tablistRef,
    activeTabIndex,
    onTabChange: (index) => setActiveTab(tabs[index].id),
    enabled: true,
    loop: true,
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState<{
    faculties: { id: number; name: string }[];
    levels: string[];
    years: number[];
    courseTypes: string[];
  } | null>(null);

  // Filters
  const [selectedFaculty, setSelectedFaculty] = useState<number | ''>('');
  const [selectedLevel, setSelectedLevel] = useState<string | ''>('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [selectedCourseType, setSelectedCourseType] = useState<string | ''>('');
  const [selectedSemester, setSelectedSemester] = useState<string | ''>('');

  // Data for different report types
  const [filteredStats, setFilteredStats] = useState<any>(null);
  const [yearStats, setYearStats] = useState<any>(null);
  const [courseTypeStats, setCourseTypeStats] = useState<any>(null);

  // Discipline comparison
  const [courseNames, setCourseNames] = useState<{ name: string; professorCount: number }[]>([]);
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');
  const [disciplineComparison, setDisciplineComparison] = useState<any>(null);

  useEffect(() => {
    loadFilterOptions();
    loadCourseNames();
  }, []);

  useEffect(() => {
    loadReportData();
  }, [activeTab, selectedFaculty, selectedLevel, selectedYear, selectedCourseType, selectedSemester]);

  const loadFilterOptions = async () => {
    try {
      const options = await api.getAdminFilterOptions();
      setFilterOptions(options);
    } catch (err: any) {
      console.error('Error loading filter options:', err);
    }
  };

  const loadCourseNames = async () => {
    try {
      const data = await api.getCourseNames();
      setCourseNames(data.courses);
    } catch (err: any) {
      console.error('Error loading course names:', err);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError('');

      const filters: any = {};
      if (selectedFaculty) filters.facultyId = Number(selectedFaculty);
      if (selectedLevel) filters.level = selectedLevel;
      if (selectedYear) filters.yearNumber = Number(selectedYear);
      if (selectedCourseType) filters.courseType = selectedCourseType;
      if (selectedSemester) filters.semester = selectedSemester;

      switch (activeTab) {
        case 'overview':
        case 'faculty':
          const data = await api.getFilteredStats(filters);
          setFilteredStats(data);
          break;

        case 'year':
          const yearData = await api.getYearStats({
            facultyId: selectedFaculty ? Number(selectedFaculty) : undefined,
            level: selectedLevel || undefined
          });
          setYearStats(yearData);
          break;

        case 'courseType':
          const courseData = await api.getCourseTypeStats({
            facultyId: selectedFaculty ? Number(selectedFaculty) : undefined,
            yearNumber: selectedYear ? Number(selectedYear) : undefined
          });
          setCourseTypeStats(courseData);
          break;

        case 'discipline':
          // Only load if course is selected
          if (selectedCourseName) {
            const disciplineData = await api.getDisciplineComparison(
              selectedCourseName,
              selectedFaculty ? Number(selectedFaculty) : undefined
            );
            setDisciplineComparison(disciplineData);
          }
          break;
      }
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
    setSelectedCourseType('');
    setSelectedSemester('');
  };

  const handleExportPDF = () => {
    if (!reportContentRef.current) {
      alert('Nu există conținut de exportat.');
      return;
    }

    const reportTitle = tabs.find(t => t.id === activeTab)?.label || 'Raport';
    const fullTitle = `Raport Avansat - ${reportTitle}`;

    const activeFilters: Record<string, any> = {};
    if (selectedFaculty) {
      const facultyName = filterOptions?.faculties.find(f => f.id === selectedFaculty)?.name;
      activeFilters['Facultate'] = facultyName?.replace('Facultatea de ', '');
    }
    if (selectedLevel) activeFilters['Nivel'] = selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1);
    if (selectedYear) activeFilters['An'] = `Anul ${selectedYear}`;
    if (selectedCourseType) activeFilters['Activitate'] = selectedCourseType.charAt(0).toUpperCase() + selectedCourseType.slice(1);
    if (selectedSemester) activeFilters['Semestru'] = `Semestrul ${selectedSemester}`;
    if (selectedCourseName) activeFilters['Disciplină'] = selectedCourseName;

    generatePrintableReport(reportContentRef.current, fullTitle, activeFilters);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={() => navigate('/admin')}
            className="text-sm text-neutral-500 hover:text-neutral-800 mb-2 flex items-center gap-1"
          >
            ← Înapoi la Dashboard
          </button>
          <h1 className="text-3xl font-bold text-neutral-800">Rapoarte Avansate</h1>
          <p className="text-neutral-500 mt-1">Analize detaliate și rapoarte personalizate</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-white border border-neutral-200 text-neutral-800 font-medium shadow-elev-1 hover:bg-neutral-50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📄 Export PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="card">
        <div ref={tablistRef} className="flex border-b border-neutral-200 overflow-x-auto" role="tablist" aria-label="Tipuri de rapoarte">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-800'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-200'
              }`}
            >
              <span aria-hidden="true">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {filterOptions && (
        <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-neutral-700">Filtre:</span>

            {/* Faculty Filter */}
            {activeTab !== 'discipline' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500">Facultate:</label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value ? Number(e.target.value) : '')}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm"
                >
                  <option value="">Toate</option>
                  {filterOptions.faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name.replace('Facultatea de ', '')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Level Filter */}
            {(activeTab === 'overview' || activeTab === 'faculty' || activeTab === 'year') && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500">Nivel:</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm"
                >
                  <option value="">Toate</option>
                  {filterOptions.levels.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Year Filter */}
            {(activeTab === 'overview' || activeTab === 'faculty' || activeTab === 'courseType') && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500">An:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm"
                >
                  <option value="">Toți</option>
                  {filterOptions.years.map((year) => (
                    <option key={year} value={year}>
                      Anul {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Course Type Filter */}
            {(activeTab === 'overview' || activeTab === 'faculty') && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500">Tip:</label>
                <select
                  value={selectedCourseType}
                  onChange={(e) => setSelectedCourseType(e.target.value)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm"
                >
                  <option value="">Toate</option>
                  {filterOptions.courseTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Semester Filter */}
            {(activeTab === 'overview' || activeTab === 'faculty') && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500">Semestru:</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm"
                >
                  <option value="">Toate</option>
                  <option value="1">Semestrul 1</option>
                  <option value="2">Semestrul 2</option>
                </select>
              </div>
            )}

            {/* Course Name Selection for Discipline Comparison */}
            {activeTab === 'discipline' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500">Disciplină:</label>
                <select
                  value={selectedCourseName}
                  onChange={(e) => {
                    setSelectedCourseName(e.target.value);
                    if (e.target.value) loadReportData();
                  }}
                  className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm min-w-[250px]"
                >
                  <option value="">Selectează o disciplină...</option>
                  {courseNames.map((course) => (
                    <option key={course.name} value={course.name}>
                      {course.name} ({course.professorCount} profesori)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear Filters */}
            {(selectedFaculty || selectedLevel || selectedYear || selectedCourseType || selectedSemester || selectedCourseName) && (
              <button
                onClick={() => {
                  handleClearFilters();
                  setSelectedCourseName('');
                }}
                className="text-sm text-primary-800 hover:text-primary-800 font-medium"
              >
                ✕ Șterge filtre
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-neutral-500">Se încarcă...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Report Content */}
      {!loading && !error && (
        <div ref={reportContentRef}>
          {/* Overview & Faculty Tab */}
          {(activeTab === 'overview' || activeTab === 'faculty') && filteredStats && (
            <div className="space-y-6">
              {/* Chart */}
              <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                  Rata de Completare {filteredStats.filters && Object.keys(filteredStats.filters).length > 0 && '(Filtrate)'}
                </h3>
                {filteredStats.stats && filteredStats.stats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={filteredStats.stats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="faculty_name"
                        angle={-45}
                        textAnchor="end"
                        height={120}
                        fontSize={11}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completion_rate" fill="#3B82F6" name="Rata completare (%)" />
                      <Bar dataKey="average_score" fill="#10B981" name="Scor mediu" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-neutral-500 text-center py-8">Nu există date pentru filtrele selectate</p>
                )}
              </div>

              {/* Data Table */}
              {filteredStats.stats && filteredStats.stats.length > 0 && (
                <div className="card">
                  <div className="p-6 border-b border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-800">Date Detaliate</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <thead className="bg-neutral-25">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Facultate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nivel</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">An</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Total</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Completate</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Rata (%)</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Scor Mediu</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-200">
                        {filteredStats.stats.map((stat: any, index: number) => (
                          <tr key={index} className="hover:bg-neutral-25">
                            <td className="px-6 py-4 text-sm text-neutral-800">{stat.faculty_name}</td>
                            <td className="px-6 py-4 text-sm text-neutral-500">{stat.level || '-'}</td>
                            <td className="px-6 py-4 text-sm text-center text-neutral-500">{stat.year_number || '-'}</td>
                            <td className="px-6 py-4 text-sm text-center text-neutral-800">{stat.total_evaluations}</td>
                            <td className="px-6 py-4 text-sm text-center text-green-600 font-medium">{stat.completed}</td>
                            <td className="px-6 py-4 text-sm text-center">
                              <span className={`font-semibold ${
                                stat.completion_rate >= 80 ? 'text-green-600' :
                                stat.completion_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {stat.completion_rate?.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-center">
                              {stat.average_score ? (
                                <span className={`font-semibold ${
                                  stat.average_score >= 4 ? 'text-green-600' :
                                  stat.average_score >= 3 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {stat.average_score.toFixed(2)}
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Year Stats Tab */}
          {activeTab === 'year' && yearStats && (
            <div className="space-y-6">
              <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Statistici pe Ani de Studiu</h3>
                {yearStats.stats && yearStats.stats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={yearStats.stats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year_number" label={{ value: 'An de studiu', position: 'insideBottom', offset: -5 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="completion_rate" stroke="#3B82F6" name="Rata completare (%)" strokeWidth={2} />
                      <Line type="monotone" dataKey="average_score" stroke="#10B981" name="Scor mediu" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-neutral-500 text-center py-8">Nu există date pentru filtrele selectate</p>
                )}
              </div>
            </div>
          )}

          {/* Course Type Stats Tab */}
          {activeTab === 'courseType' && courseTypeStats && (
            <div className="space-y-6">
              <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Statistici pe Tip de Curs</h3>
                {courseTypeStats.stats && courseTypeStats.stats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={courseTypeStats.stats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="course_type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completion_rate" fill="#3B82F6" name="Rata completare (%)" />
                      <Bar dataKey="average_score" fill="#10B981" name="Scor mediu" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-neutral-500 text-center py-8">Nu există date pentru filtrele selectate</p>
                )}
              </div>
            </div>
          )}

          {/* Discipline Comparison Tab */}
          {activeTab === 'discipline' && (
            <div className="space-y-6">
              {!selectedCourseName ? (
                <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-12 text-center">
                  <p className="text-neutral-500 mb-2">Selectează o disciplină din filtrul de mai sus pentru a vedea comparația între profesori.</p>
                  <p className="text-sm text-neutral-500">Sunt afișate doar disciplinele predate de mai mulți profesori.</p>
                </div>
              ) : disciplineComparison && disciplineComparison.comparisons && disciplineComparison.comparisons.length > 0 ? (
                <>
                  <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                      Comparație Profesori - {disciplineComparison.courseName}
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={disciplineComparison.comparisons}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="professor_name"
                          angle={-45}
                          textAnchor="end"
                          height={120}
                          fontSize={11}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="average_score" fill="#10B981" name="Scor mediu" />
                        <Bar dataKey="completion_rate" fill="#3B82F6" name="Rata completare (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card">
                    <div className="p-6 border-b border-neutral-200">
                      <h3 className="text-lg font-semibold text-neutral-800">Comparație Detaliată</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-25">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Profesor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Departament</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Evaluări</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Completate</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Rata (%)</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Scor Mediu</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                          {disciplineComparison.comparisons.map((comp: any, index: number) => (
                            <tr key={index} className="hover:bg-neutral-25">
                              <td className="px-6 py-4 text-sm font-medium text-neutral-800">{comp.professor_name}</td>
                              <td className="px-6 py-4 text-sm text-neutral-500">{comp.department}</td>
                              <td className="px-6 py-4 text-sm text-center text-neutral-800">{comp.total_evaluations}</td>
                              <td className="px-6 py-4 text-sm text-center text-green-600 font-medium">{comp.completed}</td>
                              <td className="px-6 py-4 text-sm text-center">
                                <span className={`font-semibold ${
                                  comp.completion_rate >= 80 ? 'text-green-600' :
                                  comp.completion_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {comp.completion_rate?.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-center">
                                {comp.average_score ? (
                                  <span className={`font-semibold ${
                                    comp.average_score >= 4 ? 'text-green-600' :
                                    comp.average_score >= 3 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {comp.average_score.toFixed(2)}
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-12 text-center">
                  <p className="text-neutral-500">Nu există date pentru disciplina selectată.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
