import { useEffect } from 'react';

/**
 * Custom cursor (violet dot + lagged ring) + particle canvas trail.
 * Activat doar în dark mode și pe desktop (nu pe touch).
 * Se curăță automat la unmount.
 */
export function useCursorTrail(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    // Nu activăm pe touch devices
    if (window.matchMedia('(hover: none)').matches) return;

    // ── Cursor elements ────────────────────────────────────────
    const dot = document.createElement('div');
    dot.id = 'ecd-cursor-dot';
    const ring = document.createElement('div');
    ring.id = 'ecd-cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    // ── Canvas pentru particule ────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.id = 'ecd-cursor-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ── State ──────────────────────────────────────────────────
    let mx = -200, my = -200, rx = -200, ry = -200;
    let isHover = false;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      life: number; r: number;
    }
    const particles: Particle[] = [];

    // ── Mouse tracking ─────────────────────────────────────────
    function onMouseMove(e: MouseEvent) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';

      if (Math.random() > 0.55) return;
      particles.push({
        x: mx, y: my,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 0.8,
        life: 1,
        r: Math.random() * 3 + 1,
      });
    }

    // ── Hover detection ────────────────────────────────────────
    const hoverTargets = 'a,button,[role="button"],.inst-card,.contrib-card';
    function onMouseOver(e: Event) {
      if ((e.target as Element).closest(hoverTargets)) {
        isHover = true;
        dot.classList.add('ecd-cursor-hover');
        ring.classList.add('ecd-cursor-hover');
      }
    }
    function onMouseOut(e: Event) {
      if ((e.target as Element).closest(hoverTargets)) {
        isHover = false;
        dot.classList.remove('ecd-cursor-hover');
        ring.classList.remove('ecd-cursor-hover');
      }
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);

    // ── Animation loop ─────────────────────────────────────────
    let rafId: number;
    function tick() {
      // Ring follows with lag
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';

      // Particles
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 0.028;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124,58,237,${p.life * 0.45})`;
        ctx.fill();
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    // ── Cleanup ────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      dot.remove();
      ring.remove();
      canvas.remove();
    };
  }, [enabled]);
}
