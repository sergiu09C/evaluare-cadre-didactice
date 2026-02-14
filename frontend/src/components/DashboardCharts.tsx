import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ScreenReaderOnly from './ScreenReaderOnly';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface DashboardChartsProps {
  facultyData: any[];
  completionTrend?: any[];
  scoreDistribution?: any[];
}

export default function DashboardCharts({ facultyData, completionTrend, scoreDistribution }: DashboardChartsProps) {
  return (
    <div className="space-y-6">
      {/* Faculty Completion Rate */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4" id="faculty-chart-title">Rata de Completare pe Facultăți</h3>
        <div aria-labelledby="faculty-chart-title" role="img" aria-label={`Grafic cu bare: Rata de completare pe ${facultyData.length} facultăți. ${facultyData.map(d => `${d.faculty}: ${d.completionRate}%`).join(', ')}`}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={facultyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="faculty" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completionRate" fill="#3B82F6" name="Rata (%)" />
            </BarChart>
          </ResponsiveContainer>
          <ScreenReaderOnly>
            <table>
              <caption>Date tabelate pentru rata de completare pe facultăți</caption>
              <thead>
                <tr>
                  <th>Facultate</th>
                  <th>Rata de completare (%)</th>
                </tr>
              </thead>
              <tbody>
                {facultyData.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.faculty}</td>
                    <td>{item.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScreenReaderOnly>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Trend */}
        {completionTrend && completionTrend.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4" id="trend-chart-title">Trend Completare</h3>
            <div aria-labelledby="trend-chart-title" role="img" aria-label={`Grafic cu linii: Trendul de completare în timp, cu ${completionTrend.length} puncte de date`}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completate" />
                  <Line type="monotone" dataKey="total" stroke="#3B82F6" name="Total" />
                </LineChart>
              </ResponsiveContainer>
              <ScreenReaderOnly>
                <table>
                  <caption>Date tabelate pentru trendul de completare</caption>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Completate</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completionTrend.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.date}</td>
                        <td>{item.completed}</td>
                        <td>{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScreenReaderOnly>
            </div>
          </div>
        )}

        {/* Score Distribution */}
        {scoreDistribution && scoreDistribution.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4" id="score-chart-title">Distribuție Scoruri</h3>
            <div aria-labelledby="score-chart-title" role="img" aria-label={`Grafic circular: Distribuția scorurilor. ${scoreDistribution.map(d => `${d.name}: ${d.value}`).join(', ')}`}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {scoreDistribution.map((entry, index) => (
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
                      <th>Categorie</th>
                      <th>Valoare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreDistribution.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td>{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScreenReaderOnly>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
