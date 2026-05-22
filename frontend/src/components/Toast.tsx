import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { CheckCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  desc?: string;
  action?: { label: string; onClick: () => void };
  duration?: number; // ms; 0 = no auto-dismiss
}

interface ToastContextValue {
  push: (t: Omit<Toast, 'id'>) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, { stripe: string; icon: ReactNode }> = {
  success: { stripe: 'var(--ecd-success)', icon: <CheckCircleIcon className="w-5 h-5" /> },
  info: { stripe: 'var(--ecd-info)', icon: <InformationCircleIcon className="w-5 h-5" /> },
  warning: { stripe: 'var(--ecd-warning)', icon: <ExclamationTriangleIcon className="w-5 h-5" /> },
  error: { stripe: 'var(--ecd-danger)', icon: <XCircleIcon className="w-5 h-5" /> },
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = nextId++;
      const duration = t.duration ?? 5000;
      setToasts((s) => [...s, { id, ...t }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div
        className="fixed right-5 bottom-5 z-50 flex flex-col gap-2.5 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const tone = TONE_STYLES[t.tone] || TONE_STYLES.info;
          return (
            <div
              key={t.id}
              role="status"
              className="relative flex items-start gap-3 px-4 py-3.5 pl-5 bg-white rounded-xl shadow-elev-3 border border-neutral-100 w-[380px] pointer-events-auto animate-[toast-in_250ms_cubic-bezier(0.16,1,0.3,1)]"
              style={{ overflow: 'hidden' }}
            >
              <span
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: tone.stripe }}
                aria-hidden="true"
              />
              <span style={{ color: tone.stripe }} className="flex-shrink-0 mt-0.5" aria-hidden="true">
                {tone.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold text-neutral-800">{t.title}</div>
                {t.desc && <div className="text-[12.5px] text-neutral-500 mt-0.5 leading-relaxed">{t.desc}</div>}
                {t.action && (
                  <button
                    onClick={() => {
                      t.action!.onClick();
                      dismiss(t.id);
                    }}
                    className="mt-2 text-[12.5px] font-semibold focus:outline-none focus-visible:underline"
                    style={{ color: tone.stripe }}
                  >
                    {t.action.label} →
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Închide notificarea"
                className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded"
              >
                <XMarkIcon className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
      <ToastKeyframes />
    </ToastContext.Provider>
  );
}

function ToastKeyframes() {
  useEffect(() => {
    if (document.getElementById('toast-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'toast-keyframes';
    style.textContent = `
      @keyframes toast-in {
        from { opacity: 0; transform: translateX(20px) scale(0.96); }
        to   { opacity: 1; transform: translateX(0) scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        @keyframes toast-in { from, to { opacity: 1; transform: none; } }
      }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback gracios — în loc să crape, returnează no-op (utilizatorii fără provider nu ar trebui să fie cazul standard)
    return {
      push: () => 0,
      dismiss: () => {},
    };
  }
  return ctx;
}
