import { ReactNode } from 'react';
import { Card } from './Card';
import { Input } from './Input';
import { Select } from './Select';
import { Badge } from './Badge';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface ListFilterSelect {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}

export interface ListFilterTab {
  key: string;
  label: string;
  count?: number;
}

interface ListFilterBarProps {
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  selects?: ListFilterSelect[];
  tabs?: {
    items: ListFilterTab[];
    value: string;
    onChange: (v: string) => void;
  };
  chips?: ReactNode;
  resultCount?: { current: number; total: number };
  onClearAll?: () => void;
  active?: boolean;
}

/**
 * Bar reutilizabil de filtre pentru paginile cu liste.
 *
 * Suportă tab-uri (chips), search text, dropdown-uri și un slot pentru chips
 * custom (ex. chip-ul de filtre globale URL-driven). Afișează numărul de
 * rezultate și un buton „Resetează" când există filtre active.
 */
export function ListFilterBar({
  search,
  selects,
  tabs,
  chips,
  resultCount,
  onClearAll,
  active,
}: ListFilterBarProps) {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        {tabs && tabs.items.length > 0 && (
          <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filtrare după categorie">
            {tabs.items.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tabs.value === t.key}
                onClick={() => tabs.onChange(t.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 ${
                  tabs.value === t.key
                    ? 'bg-primary-800 dark:bg-[#7C3AED] text-white border-primary-800 dark:border-[#7C3AED]'
                    : 'bg-white dark:bg-[#162638] text-neutral-700 dark:text-[#A6BCD3] border-neutral-200 dark:border-[rgba(124,58,237,0.25)] hover:bg-neutral-50 dark:hover:bg-[#1E3248]'
                }`}
              >
                {t.label}
                {t.count != null && <span className="ml-1.5 text-[11px] opacity-75">{t.count}</span>}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
          {search && (
            <div className="flex-1 min-w-[220px]">
              <Input
                prefix={<MagnifyingGlassIcon className="w-4 h-4" aria-hidden="true" />}
                placeholder={search.placeholder || 'Caută...'}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                aria-label={search.placeholder || 'Caută'}
              />
            </div>
          )}
          {selects?.map((s) => (
            <div key={s.key} className="min-w-[180px]">
              <Select
                label={s.label}
                value={s.value}
                onChange={(e) => s.onChange(e.target.value)}
              >
                <option value="">{s.placeholder || 'Toate'}</option>
                {s.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>

        {chips}

        {(resultCount || (active && onClearAll)) && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            {resultCount && (
              <div className="text-xs text-neutral-500">
                <Badge tone="neutral">
                  {resultCount.current.toLocaleString('ro-RO')} din {resultCount.total.toLocaleString('ro-RO')}
                </Badge>
              </div>
            )}
            {active && onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center gap-1 text-xs text-accent-700 hover:text-accent-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1 py-0.5"
              >
                <XMarkIcon className="w-3.5 h-3.5" aria-hidden="true" />
                Resetează filtrele
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
