import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';

export type SortDir = 'asc' | 'desc' | null;

interface SortHeaderProps<T extends string> {
  field: T;
  current: T | null;
  dir: SortDir;
  onSort: (field: T) => void;
  align?: 'left' | 'center' | 'right';
  children: ReactNode;
}

export function SortHeader<T extends string>({ field, current, dir, onSort, align = 'left', children }: SortHeaderProps<T>) {
  const isActive = current === field;
  const alignCls = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`w-full flex items-center gap-1 ${alignCls} text-xs font-semibold text-neutral-500 uppercase tracking-wide hover:text-neutral-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1 py-1`}
      aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {children}
      <span className="inline-flex flex-col leading-none -my-0.5" aria-hidden="true">
        <ChevronUpIcon className={`w-2.5 h-2.5 ${isActive && dir === 'asc' ? 'text-accent-600' : 'text-neutral-300'}`} />
        <ChevronDownIcon className={`w-2.5 h-2.5 -mt-0.5 ${isActive && dir === 'desc' ? 'text-accent-600' : 'text-neutral-300'}`} />
      </span>
    </button>
  );
}


export function sortBy<T>(items: T[], field: keyof T | string, dir: SortDir, accessor?: (item: T, field: string) => any): T[] {
  if (!dir || !field) return items;
  const get = accessor || ((it: T, f: string) => (it as any)[f]);
  const out = [...items].sort((a, b) => {
    const va = get(a, field as string);
    const vb = get(b, field as string);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'number' && typeof vb === 'number') return va - vb;
    return String(va).localeCompare(String(vb), 'ro');
  });
  return dir === 'desc' ? out.reverse() : out;
}
