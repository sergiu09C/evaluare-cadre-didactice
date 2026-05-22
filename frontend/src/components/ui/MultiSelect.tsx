import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  wrapperClassName?: string;
  id?: string;
}

/**
 * MultiSelect cu chip-uri vizibile. Click pe trigger → deschide listă cu checkbox-uri.
 * Selecția se persistă ca array; părintele convertește la CSV pentru URL/API dacă vrea.
 *
 * Predictibil:
 * - chip-urile selectate sunt vizibile în trigger (max 2 + "+N")
 * - dropdown-ul include „Toate" / „Niciuna" rapid
 * - Escape sau click-outside închide
 */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Toate',
  wrapperClassName,
  id,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const uid = id || `ms-${label?.toLowerCase().replace(/\W+/g, '-') ?? 'select'}`;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  const labelMap = new Map(options.map((o) => [o.value, o.label]));
  const visibleChips = value.slice(0, 2);
  const extraCount = value.length - visibleChips.length;

  return (
    <div ref={rootRef} className={`relative ${wrapperClassName ?? ''}`}>
      {label && (
        <label htmlFor={uid} className="block text-[12px] font-medium text-neutral-600 mb-1">
          {label}
        </label>
      )}
      <button
        id={uid}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-md shadow-elev-1 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 hover:border-neutral-300"
      >
        <span className="flex-1 flex flex-wrap items-center gap-1 min-w-0">
          {value.length === 0 ? (
            <span className="text-neutral-400">{placeholder}</span>
          ) : (
            <>
              {visibleChips.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent-50 text-accent-800 text-[11px] font-medium"
                >
                  {labelMap.get(v) ?? v}
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(v);
                    }}
                    className="hover:bg-accent-100 rounded p-0.5 cursor-pointer"
                    aria-label={`Elimină ${labelMap.get(v) ?? v}`}
                  >
                    <XMarkIcon className="w-3 h-3" aria-hidden="true" />
                  </span>
                </span>
              ))}
              {extraCount > 0 && (
                <span className="text-[11px] font-medium text-neutral-500">+{extraCount}</span>
              )}
            </>
          )}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-30 mt-1 w-full bg-white border border-neutral-200 rounded-md shadow-elev-3 py-1 max-h-64 overflow-y-auto"
        >
          {options.length > 1 && (
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-100 text-[11px]">
              <button
                type="button"
                onClick={() => onChange(options.map((o) => o.value))}
                className="text-accent-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1"
              >
                Selectează tot
              </button>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-neutral-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1"
              >
                Niciuna
              </button>
            </div>
          )}
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-neutral-400">Nicio opțiune disponibilă.</div>
          ) : (
            options.map((opt) => {
              const selected = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => toggle(opt.value)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent-25 focus:bg-accent-50 focus:outline-none ${
                    selected ? 'bg-accent-25 text-accent-900' : 'text-neutral-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selected ? 'bg-accent-600 border-accent-600' : 'border-neutral-300'
                    }`}
                    aria-hidden="true"
                  >
                    {selected && <CheckIcon className="w-3 h-3 text-white" />}
                  </span>
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
