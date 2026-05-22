import { useEffect, useState } from 'react';

/** Returns true dacă userul are setat OS-level prefers-reduced-motion. */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if ((mq as any).addListener) (mq as any).addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else if ((mq as any).removeListener) (mq as any).removeListener(handler);
    };
  }, []);

  return prefersReduced;
}
