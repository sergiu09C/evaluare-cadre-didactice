import { Tab } from '@headlessui/react';
import type { ReactNode } from 'react';

interface TabsProps {
  tabs: { id: string; label: string; icon?: ReactNode; badge?: number }[];
  selectedIndex: number;
  onChange: (index: number) => void;
  children: ReactNode;
  variant?: 'underline' | 'segmented';
  ariaLabel?: string;
}

export function Tabs({ tabs, selectedIndex, onChange, children, variant = 'underline', ariaLabel }: TabsProps) {
  return (
    <Tab.Group selectedIndex={selectedIndex} onChange={onChange}>
      {variant === 'underline' ? (
        <Tab.List
          className="flex gap-1 border-b border-neutral-200 mb-6 overflow-x-auto"
          aria-label={ariaLabel}
        >
          {tabs.map((t) => (
            <Tab
              key={t.id}
              className={({ selected }) =>
                [
                  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded-t-md',
                  selected
                    ? 'border-accent-600 text-accent-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300',
                  'flex items-center gap-2',
                ].join(' ')
              }
            >
              {t.icon && <span className="w-4 h-4 inline-flex">{t.icon}</span>}
              {t.label}
              {t.badge != null && (
                <span className="text-[11px] font-semibold rounded-full px-1.5 py-0.5 bg-neutral-100 text-neutral-700">
                  {t.badge}
                </span>
              )}
            </Tab>
          ))}
        </Tab.List>
      ) : (
        <Tab.List
          className="inline-flex p-1 bg-neutral-100 rounded-lg mb-6"
          aria-label={ariaLabel}
        >
          {tabs.map((t) => (
            <Tab
              key={t.id}
              className={({ selected }) =>
                [
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40',
                  selected ? 'bg-white text-neutral-800 shadow-elev-1' : 'text-neutral-500 hover:text-neutral-800',
                  'flex items-center gap-2',
                ].join(' ')
              }
            >
              {t.icon && <span className="w-4 h-4 inline-flex">{t.icon}</span>}
              {t.label}
            </Tab>
          ))}
        </Tab.List>
      )}
      <Tab.Panels>{children}</Tab.Panels>
    </Tab.Group>
  );
}

export const TabPanel = Tab.Panel;
