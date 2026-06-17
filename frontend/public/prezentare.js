// ── LIVE DATA — fetch from platform API ───────
(async function loadLiveData() {
  try {
    const res = await fetch('/api/public-stats');
    if (!res.ok) return;
    const d = await res.json();

    // KPI strip hero (slide 01)
    setKpi('kpi-participare',   Math.round(d.participation_rate));
    setKpi('kpi-scor',          Math.round(d.avg_score * 100));   // 3.80 → 380 (decimal mode)
    setKpi('kpi-completate',    d.submitted_count);
    setKpi('kpi-profesori',     d.professor_count);
    // kpi-timp-raportare rămâne static (indicator de cercetare)

    // KPI strip FAIMA (slide 07)
    setKpi('kpi-studenti',      d.total_students);
    setKpi('kpi-profesori-f',   d.professor_count);
    setKpi('kpi-cursuri',       d.course_count);
    setKpi('kpi-evaluari-pilot',d.total_evaluations);
  } catch {
    // date lipsă → animațiile rulează cu valorile hardcodate din HTML
  }

  function setKpi(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) {
      el.dataset.count = value;
    }
  }
})();

// ── CURSOR ────────────────────────────────────
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
});
(function animRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px';
  ring.style.top = ry + 'px';
  requestAnimationFrame(animRing);
})();

document.querySelectorAll('a,button,.btn,.inst-card,.contrib-card,.loop-step').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// ── PARTICLES ────────────────────────────────
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
const particles = [];
document.addEventListener('mousemove', e => {
  if (Math.random() > 0.6) return;
  particles.push({ x: e.clientX, y: e.clientY, vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2-1, life: 1, r: Math.random()*3+1 });
});
(function animParticles() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach((p,i) => {
    p.life -= 0.025; p.x += p.vx; p.y += p.vy; p.vy += 0.04;
    if (p.life <= 0) { particles.splice(i,1); return; }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI*2);
    ctx.fillStyle = `rgba(124,58,237,${p.life * 0.5})`;
    ctx.fill();
  });
  requestAnimationFrame(animParticles);
})();

// ── REVEAL ON SCROLL ─────────────────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── COUNT-UP ANIMATIONS ───────────────────────
function animCount(el) {
  const target = parseInt(el.dataset.count);
  const isDecimal = el.dataset.decimal === 'true';
  const suffix = el.dataset.suffix || '';
  const comma = el.dataset.comma === 'true';
  const dur = 1600;
  let start = null;
  function step(ts) {
    if (!start) start = ts;
    const prog = Math.min((ts - start) / dur, 1);
    const ease = 1 - Math.pow(1 - prog, 3);
    let val = Math.round(target * ease);
    if (isDecimal) {
      el.textContent = (target * ease / 100).toFixed(2) + suffix;
    } else if (comma) {
      el.textContent = val.toLocaleString('ro-RO') + suffix;
    } else {
      el.textContent = val + suffix;
    }
    if (prog < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const countObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && e.target.dataset.count) {
      animCount(e.target);
      countObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => countObs.observe(el));

// ── PARETO BARS ───────────────────────────────
const barObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.pbar-fill').forEach((bar, i) => {
        setTimeout(() => {
          bar.style.transition = 'width 0.9s cubic-bezier(.34,1.56,.64,1)';
          bar.style.width = bar.dataset.w;
        }, i * 120);
      });
      barObs.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.pareto-bars').forEach(el => barObs.observe(el));

// ── NAV ACTIVE TRACKING ───────────────────────
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');
const navObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
      if (active) {
        active.classList.add('active');
        active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  });
}, { threshold: 0.3 });
sections.forEach(s => navObs.observe(s));

// ── SPC CHARTS ────────────────────────────────
function drawSPC(canvasId, data, cl, ucl, lcl, color, yMin, yMax, labels) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement.offsetWidth - 56;
  canvas.width = W;
  canvas.height = 200;
  const PAD = { t: 16, r: 24, b: 32, l: 48 };
  const cw = W - PAD.l - PAD.r;
  const ch = 200 - PAD.t - PAD.b;
  const toX = i => PAD.l + (i / (data.length - 1)) * cw;
  const toY = v => PAD.t + ch - ((v - yMin) / (yMax - yMin)) * ch;

  ctx.clearRect(0, 0, W, 200);

  [yMin, (yMin+yMax)/2, yMax].forEach(v => {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    ctx.lineWidth = 1;
    ctx.moveTo(PAD.l, toY(v));
    ctx.lineTo(PAD.l + cw, toY(v));
    ctx.stroke();
    ctx.fillStyle = 'rgba(115,147,181,.6)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(v.toFixed(0) + (yMax > 10 ? '%' : ''), 2, toY(v) + 4);
  });

  ctx.beginPath(); ctx.strokeStyle = 'rgba(16,185,129,.5)'; ctx.lineWidth = 1; ctx.setLineDash([4,3]);
  ctx.moveTo(PAD.l, toY(ucl)); ctx.lineTo(PAD.l + cw, toY(ucl)); ctx.stroke();
  ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
  ctx.moveTo(PAD.l, toY(cl)); ctx.lineTo(PAD.l + cw, toY(cl)); ctx.stroke();
  if (lcl !== null) {
    ctx.beginPath(); ctx.strokeStyle = 'rgba(239,68,68,.4)'; ctx.lineWidth = 1;
    ctx.moveTo(PAD.l, toY(lcl)); ctx.lineTo(PAD.l + cw, toY(lcl)); ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.beginPath();
  data.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)));
  ctx.lineTo(toX(data.length-1), toY(yMin));
  ctx.lineTo(toX(0), toY(yMin));
  ctx.closePath();
  ctx.fillStyle = color.replace('1)', '0.08)');
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = color; ctx.lineWidth = 2.5;
  data.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)));
  ctx.stroke();

  data.forEach((v, i) => {
    const isSpecial = v > ucl || (lcl !== null && v < lcl);
    ctx.beginPath();
    ctx.arc(toX(i), toY(v), isSpecial ? 6 : 4, 0, Math.PI*2);
    ctx.fillStyle = isSpecial ? '#10B981' : color;
    ctx.fill();
    if (isSpecial) {
      ctx.beginPath(); ctx.arc(toX(i), toY(v), 10, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(16,185,129,.4)'; ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (labels && labels[i]) {
      ctx.fillStyle = 'rgba(115,147,181,.6)';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], toX(i), 200 - 8);
    }
  });
}

const spcObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const sem = ['S1\'22', 'S2\'22', 'S1\'23', 'S2\'23', 'S1\'24', 'S2\'24'];
      drawSPC('spcChart1', [28, 32, 38, 43, 47, 57], 44, 65, 23, 'rgba(124,58,237,1)', 0, 80, sem);
      drawSPC('spcChart2', [3.43, 3.48, 3.52, 3.55, 3.57, 3.71], 3.57, 4.20, null, 'rgba(245,158,11,1)', 3.0, 4.5, sem);
      spcObs.disconnect();
    }
  });
}, { threshold: 0.2 });
const spcSection = document.getElementById('tendinte');
if (spcSection) spcObs.observe(spcSection);
