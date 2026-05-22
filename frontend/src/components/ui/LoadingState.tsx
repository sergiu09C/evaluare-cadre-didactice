interface LoadingStateProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Stare de încărcare standardizată cu spinner accesibil.
 * Folosește `role="status"` și `aria-busy` pentru screen readers.
 */
export function LoadingState({ label = 'Se încarcă...', size = 'md', className = '' }: LoadingStateProps) {
  const sizeClass = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-14 w-14' : 'h-10 w-10';
  const padding = size === 'sm' ? 'py-4' : size === 'lg' ? 'py-20' : 'py-12';
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`text-center ${padding} ${className}`}
    >
      <div
        className={`animate-spin rounded-full border-b-2 border-accent-600 mx-auto mb-3 ${sizeClass}`}
        aria-hidden="true"
      />
      <span className="text-neutral-500 text-sm">{label}</span>
    </div>
  );
}
