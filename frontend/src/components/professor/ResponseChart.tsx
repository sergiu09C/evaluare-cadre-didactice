import React from 'react';
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
  Cell
} from 'recharts';

interface QuestionDistribution {
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
}

interface ResponseChartProps {
  data: QuestionDistribution[];
  chartType?: 'bar' | 'pie';
  showLegend?: boolean;
  height?: number;
}

const ResponseChart: React.FC<ResponseChartProps> = ({
  data,
  chartType = 'bar',
  showLegend = true,
  height = 400
}) => {
  // Transform data for charts
  const barChartData = data.map(item => ({
    question: item.questionText.length > 50
      ? item.questionText.substring(0, 47) + '...'
      : item.questionText,
    'Foarte nesatisfăcut (1)': item.distribution.score1,
    'Nesatisfăcut (2)': item.distribution.score2,
    'Neutru (3)': item.distribution.score3,
    'Satisfăcut (4)': item.distribution.score4,
    'Foarte satisfăcut (5)': item.distribution.score5,
    average: item.averageScore
  }));

  // Aggregate all scores for pie chart
  const aggregateScores = data.reduce(
    (acc, item) => ({
      score1: acc.score1 + item.distribution.score1,
      score2: acc.score2 + item.distribution.score2,
      score3: acc.score3 + item.distribution.score3,
      score4: acc.score4 + item.distribution.score4,
      score5: acc.score5 + item.distribution.score5
    }),
    { score1: 0, score2: 0, score3: 0, score4: 0, score5: 0 }
  );

  const pieChartData = [
    { name: 'Foarte nesatisfăcut (1)', value: aggregateScores.score1, color: '#ef4444' },
    { name: 'Nesatisfăcut (2)', value: aggregateScores.score2, color: '#f97316' },
    { name: 'Neutru (3)', value: aggregateScores.score3, color: '#eab308' },
    { name: 'Satisfăcut (4)', value: aggregateScores.score4, color: '#84cc16' },
    { name: 'Foarte satisfăcut (5)', value: aggregateScores.score5, color: '#22c55e' }
  ].filter(item => item.value > 0);

  const COLORS = {
    score1: '#ef4444',
    score2: '#f97316',
    score3: '#eab308',
    score4: '#84cc16',
    score5: '#22c55e'
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Nu există date disponibile</p>
      </div>
    );
  }

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieChartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {pieChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {showLegend && <Legend />}
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={barChartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="question"
          angle={-45}
          textAnchor="end"
          height={150}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis label={{ value: 'Număr răspunsuri', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        {showLegend && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
        <Bar dataKey="Foarte nesatisfăcut (1)" stackId="a" fill={COLORS.score1} />
        <Bar dataKey="Nesatisfăcut (2)" stackId="a" fill={COLORS.score2} />
        <Bar dataKey="Neutru (3)" stackId="a" fill={COLORS.score3} />
        <Bar dataKey="Satisfăcut (4)" stackId="a" fill={COLORS.score4} />
        <Bar dataKey="Foarte satisfăcut (5)" stackId="a" fill={COLORS.score5} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ResponseChart;
