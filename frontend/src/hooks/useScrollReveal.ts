import { useEffect, useRef } from 'react';

/**
 * Adaugă clasa ecd-visible elementelor cu ecd-reveal când intră în viewport.
 * Apelează o dată per mount; se curăță la unmount.
 */
export function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('ecd-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const observe = (el: Element) => {
      if (!el.classList.contains('ecd-visible')) io.observe(el);
    };

    document.querySelectorAll('.ecd-reveal').forEach(observe);

    // Observă și elementele .ecd-reveal adăugate dinamic (ex: după fetch async)
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const el = node as Element;
          if (el.classList?.contains('ecd-reveal')) observe(el);
          el.querySelectorAll?.('.ecd-reveal').forEach(observe);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
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
