import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { ProfessorDetailedStats } from '../types';
import ScreenReaderOnly from '../components/ScreenReaderOnly';
import AdminActionsPanel from '../components/AdminActionsPanel';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export default function ProfessorDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ProfessorDetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadProfessorStats();
    }
  }, [id]);

  const loadProfessorStats = async () => {
    try {
      setLoading(true);
      const stats = await api.getProfessorStats(parseInt(id!));
      setData(stats);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12" role="status" aria-busy="true" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" aria-hidden="true"></div>
        <div className="text-neutral-500">Se încarcă statisticile profesorului...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6 bg-red-50 border-red-200" role="alert" aria-live="assertive">
        <p className="text-red-700">{error || 'Date negăsite'}</p>
        <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-primary-800 text-white font-medium shadow-elev-1 hover:bg-primary-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 disabled:opacity-50 disabled:cursor-not-allowed mt-4" aria-label="Înapoi la dashboard administrare">
          ← Înapoi la dashboard
        </button>
      </div>
    );
  }

  const categoryChartData = data.statistics.categoryAverages.map((c) => ({
    name: c.category,
    Medie: c.average,
  }));

  const distributionChartData = data.statistics.scoreDistribution.map((s) => ({
    name: `${s.score} ⭐`,
    count: s.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">{data.professor.name}</h1>
          <p className="text-lg text-neutral-500 mt-1">{data.professor.department}</p>
          <p className="text-sm text-neutral-500">{data.professor.faculty}</p>
        </div>
        <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-white border border-neutral-200 text-neutral-800 font-medium shadow-elev-1 hover:bg-neutral-50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 disabled:opacity-50 disabled:cursor-not-allowed">
          ← Înapoi
        </button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6" role="region" aria-labelledby="stat-evaluations">
          <div id="stat-evaluations" className="text-sm text-neutral-500 mb-1">Evaluări primite</div>
          <div className="text-3xl font-bold text-primary-800" aria-label={`${data.statistics.evaluations.completed} evaluări completate din ${data.statistics.evaluations.total_assigned} atribuite`}>
            {data.statistics.evaluations.completed} / {data.statistics.evaluations.total_assigned}
          </div>
        </div>
        <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6" role="region" aria-labelledby="stat-completion">
          <div id="stat-completion" className="text-sm text-neutral-500 mb-1">Rată completare</div>
          <div className="text-3xl font-bold text-info-fg" aria-label={`Rată de completare: ${data.statistics.evaluations.completion_rate} procente`}>
            {data.statistics.evaluations.completion_rate}%
          </div>
        </div>
        <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6" role="region" aria-labelledby="stat-average">
          <div id="stat-average" className="text-sm text-neutral-500 mb-1">Scor mediu general</div>
          <div
            className={`text-3xl font-bold ${
              data.statistics.overallAverage
                ? data.statistics.overallAverage >= 4
                  ? 'text-green-600'
                  : data.statistics.overallAverage >= 3
                  ? 'text-yellow-600'
                  : 'text-red-600'
                : 'text-neutral-400'
            }`}
            aria-label={`Scor mediu general: ${data.statistics.overallAverage ? data.statistics.overallAverage.toFixed(2) : 'nedisponibil'}`}
          >
            {data.statistics.overallAverage ? data.statistics.overallAverage.toFixed(2) : '-'}
          </div>
        </div>
        <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6" role="region" aria-labelledby="stat-status">
          <div id="stat-status" className="text-sm text-neutral-500 mb-1">Status</div>
          <div className="text-2xl font-bold">
            {data.statistics.overallAverage && data.statistics.overallAverage < 2.5 ? (
              <span className="text-red-600" role="status" aria-label="Necesită atenție - scor mediu sub 2.5">⚠️ Necesită atenție</span>
            ) : (
              <span className="text-green-600" role="status" aria-label="Status satisfăcător">✓ Satisfăcător</span>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Averages */}
        <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4" id="category-chart-title">Medii per categorie</h2>
          <div aria-labelledby="category-chart-title" role="img" aria-label={`Grafic cu bare: Mediile pe categorii pentru ${data.professor.name}. ${categoryChartData.map(d => `${d.name}: ${d.Medie.toFixed(2)}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" height={80} />
                <YAxis domain={[0, 5]} fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Medie" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
            <ScreenReaderOnly>
              <table>
                <caption>Date tabelate pentru mediile per categorie</caption>
                <thead>
                  <tr>
                    <th>Categorie</th>
                    <th>Medie</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryChartData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.Medie.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScreenReaderOnly>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4" id="distribution-chart-title">Distribuție scoruri</h2>
          <div aria-labelledby="distribution-chart-title" role="img" aria-label={`Grafic circular: Distribuția scorurilor pentru ${data.professor.name}. ${distributionChartData.map(d => `${d.name}: ${d.count} evaluări`).join(', ')}`}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count }) => `${name}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {distributionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <ScreenReaderOnly>
              <table>
                <caption>Date tabelate pentru distribuția scorurilor</caption>
                <thead>
                  <tr>
                    <th>Scor</th>
                    <th>Număr evaluări</th>
                  </tr>
                </thead>
                <tbody>
                  {distributionChartData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScreenReaderOnly>
          </div>
        </div>
      </div>

      {/* Acțiuni admin → profesor */}
      <AdminActionsPanel
        professorId={data.professor.id}
        professorName={data.professor.name}
      />

      {/* Text Feedback */}
      <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">
          Feedback calitativ (răspunsuri text - anonime)
        </h2>

        {data.feedback.textResponses.length > 0 ? (
          <div className="space-y-4">
            {data.feedback.textResponses.map((response, index) => (
              <div key={index} className="border-l-4 border-primary-400 pl-4 py-2 bg-neutral-25">
                <p className="text-sm font-medium text-neutral-700 mb-1">{response.question}</p>
                <p className="text-neutral-800">{response.answer}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {new Date(response.date).toLocaleDateString('ro-RO')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 text-center py-8">Nu există feedback text momentan</p>
        )}
      </div>

      {/* Detailed Category Stats */}
      <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Statistici detaliate per categorie</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Lista statistici detaliate per categorii de evaluare">
          {data.statistics.categoryAverages.map((category) => (
            <div key={category.category} className="border border-neutral-200 rounded-lg p-4" role="listitem">
              <h3 className="text-sm font-medium text-neutral-700 mb-2 capitalize" id={`category-${category.category}`}>
                {category.category.replace('_', ' ')}
              </h3>
              <div className="flex items-end justify-between" aria-labelledby={`category-${category.category}`}>
                <div className="text-3xl font-bold text-primary-800" aria-label={`Medie: ${category.average.toFixed(2)}`}>
                  {category.average.toFixed(2)}
                </div>
                <div className="text-sm text-neutral-500" aria-label={`Bazat pe ${category.responseCount} răspunsuri`}>{category.responseCount} răspunsuri</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
