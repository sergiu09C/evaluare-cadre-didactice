import { useEffect, useRef } from 'react';

/**
 * Adaugă clasa ecd-visible elementelor cu ecd-reveal când intră în viewport.
 * Apelează o dată per mount; se curăță la unmount.
 */
export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('ecd-visible');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.ecd-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/**
 * Observă un singur ref și returnează dacă e vizibil.
 */
export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('ecd-visible');
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return ref;
}
