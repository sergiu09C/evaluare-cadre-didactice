import { useEffect } from 'react';

interface SkelProps {
  w?: string | number;
  h?: string | number;
  r?: number;
  className?: string;
}

function injectKeyframes() {
  if (document.getElementById('skel-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'skel-keyframes';
  style.textContent = `
    @keyframes skel-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .ecd-skel {
      background: linear-gradient(90deg, var(--ecd-neutral-100) 0%, var(--ecd-neutral-50) 50%, var(--ecd-neutral-100) 100%);
      background-size: 200% 100%;
      animation: skel-shimmer 1.4s ease-in-out infinite;
    }
    [data-theme="dark"] .ecd-skel {
      background: linear-gradient(90deg, var(--ecd-neutral-200) 0%, var(--ecd-neutral-300) 50%, var(--ecd-neutral-200) 100%);
      background-size: 200% 100%;
    }
    @media (prefers-reduced-motion: reduce) {
      .ecd-skel { animation: none; background: var(--ecd-neutral-100); }
      [data-theme="dark"] .ecd-skel { background: var(--ecd-neutral-200); }
    }
  `;
  document.head.appendChild(style);
}

export function Skel({ w = '100%', h = 12, r = 4, className = '' }: SkelProps) {
  useEffect(() => { injectKeyframes(); }, []);
  return (
    <div
      className={`ecd-skel ${className}`}
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: typeof h === 'number' ? `${h}px` : h,
        borderRadius: r,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonKPI() {
  return (
    <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-5 flex flex-col gap-2.5">
      <Skel w={80} h={10} />
      <Skel w={120} h={28} r={6} />
      <Skel w={60} h={10} />
    </div>
  );
}

export function SkeletonKPIRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonKPI key={i} />
      ))}
    </div>
  );
}

export function SkeletonCardList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`px-6 py-4 flex items-center gap-4 ${i < rows - 1 ? 'border-b border-neutral-100' : ''}`}
        >
          <Skel w={44} h={44} r={999} />
          <div className="flex-1 flex flex-col gap-2">
            <Skel w="60%" h={14} />
            <Skel w="40%" h={11} />
          </div>
          <Skel w={80} h={32} r={6} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 240 }: { height?: number }) {
  return (
    <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
      <div className="flex flex-col gap-3 mb-4">
        <Skel w={180} h={16} />
        <Skel w={100} h={11} />
      </div>
      <div className="relative" style={{ height }}>
        <Skel w="100%" h="100%" r={8} />
      </div>
    </div>
  );
}

export function SkeletonRadar() {
  return (
    <div className="bg-white border border-neutral-100 rounded-xl shadow-elev-1 p-6">
      <Skel w={160} h={16} />
      <div className="flex justify-center my-6">
        <Skel w={200} h={200} r={9999} />
      </div>
      <Skel w="80%" h={11} />
    </div>
  );
}
