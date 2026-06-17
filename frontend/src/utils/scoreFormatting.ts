export type ScoreTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export function scoreTone(score: number | null | undefined): ScoreTone {
  if (score == null) return 'neutral';
  if (score >= 4.5) return 'success';
  if (score >= 4.0) return 'info';
  if (score >= 3.5) return 'warning';
  return 'danger';
}

export function scoreTextColor(score: number | null | undefined): string {
  if (score == null) return 'text-neutral-400';
  if (score >= 4.5) return 'text-green-600';
  if (score >= 4.0) return 'text-green-500';
  if (score >= 3.5) return 'text-yellow-500';
  if (score >= 3.0) return 'text-orange-500';
  return 'text-red-500';
}

export function scoreBgColor(score: number | null | undefined): string {
  if (score == null) return 'bg-neutral-25';
  if (score >= 4.5) return 'bg-green-50';
  if (score >= 4.0) return 'bg-green-50';
  if (score >= 3.5) return 'bg-yellow-50';
  if (score >= 3.0) return 'bg-orange-50';
  return 'bg-red-50';
}

export function scoreBadgeClasses(score: number | null | undefined): string {
  if (score == null) return 'bg-neutral-100 text-neutral-500';
  if (score >= 4.5) return 'bg-green-100 text-green-700';
  if (score >= 4.0) return 'bg-green-50 text-green-600';
  if (score >= 3.5) return 'bg-yellow-100 text-yellow-700';
  if (score >= 3.0) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}
