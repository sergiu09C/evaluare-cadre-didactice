import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend } from 'recharts';

interface QuestionDistribution {
  questionId: number;
  questionText: string;
  category: string;
  averageScore: number | null;
  distribution: { score1: number; score2: number; score3: number; score4: number; score5: number };
}

interface Props {
  data: QuestionDistribution[];
  referenceScore?: number | null;
  referenceLabel?: string;
  height?: number;
}

/**
 * Stacked bar cu colorare semantică (1-2 roșu, 3 galben, 4-5 verde)
 * + linie referință pentru media departamentului.
 */
export default function StackedSemanticBar({ data, referenceScore, referenceLabel = 'Media dept.', height = 380 }: Props) {
  const chartData = data.map((q) => ({
    question: q.questionText.length > 40 ? q.questionText.slice(0, 37) + '...' : q.questionText,
    fullQuestion: q.questionText,
    category: q.category,
    'Negativ (1-2)': q.distribution.score1 + q.distribution.score2,
    'Neutru (3)': q.distribution.score3,
    'Pozitiv (4-5)': q.distribution.score4 + q.distribution.score5,
    averageScore: q.averageScore,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ecd-border-soft)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--ecd-text-soft)' }} />
        <YAxis
          type="category"
          dataKey="question"
          tick={{ fontSize: 11, fill: 'var(--ecd-text-soft)' }}
          width={220}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--ecd-surface)',
            border: '1px solid var(--ecd-border)',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: any, name: any) => [`${value} răspunsuri`, name]}
          labelFormatter={(_, payload: any) => {
            if (!payload?.[0]?.payload) return '';
            return payload[0].payload.fullQuestion;
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="Negativ (1-2)" stackId="a" fill="#EF4444" />
        <Bar dataKey="Neutru (3)" stackId="a" fill="#F59E0B" />
        <Bar dataKey="Pozitiv (4-5)" stackId="a" fill="#10B981" />
        {referenceScore != null && (
          <ReferenceLine
            x={referenceScore * 10}
            stroke="var(--ecd-accent-600)"
            strokeWidth={2}
            strokeDasharray="4 4"
            label={{
              value: `${referenceLabel}: ${referenceScore.toFixed(2).replace('.', ',')}`,
              position: 'top',
              fill: 'var(--ecd-accent-700)',
              fontSize: 11,
              fontWeight: 600,
            }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
