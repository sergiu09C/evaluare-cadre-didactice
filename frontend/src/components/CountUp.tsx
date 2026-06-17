import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  to: number;
  duration?: number;         // ms
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

/**
 * Animează un număr de la 0 la `to` când intră în viewport.
 */
export default function CountUp({
  to,
  duration = 1400,
  decimals = 0,
  suffix = '',
  prefix = '',
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          obs.disconnect();

          let startTs: number | null = null;
          function step(ts: number) {
            if (!startTs) startTs = ts;
            const progress = Math.min((ts - startTs) / duration, 1);
            // ease-out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            setVal(parseFloat((to * ease).toFixed(decimals)));
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration, decimals]);

  const display = val.toLocaleString('ro-RO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}
