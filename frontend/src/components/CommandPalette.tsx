import { Fragment, useEffect, useMemo, useState } from 'react';
import { Combobox, Dialog, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

type CommandItem = {
  id: string;
  label: string;
  meta?: string;
  group: 'Navigare' | 'Profesori' | 'Cursuri' | 'Acțiuni';
  action: () => void;
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<CommandItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, isProfessor } = useAuth();

  // Open with Cmd/Ctrl + K
  useKeyboardShortcut({
    key: 'k',
    metaKey: true,
    onShortcut: () => setOpen(true),
    enabled: true,
  });
  useKeyboardShortcut({
    key: 'k',
    ctrlKey: true,
    onShortcut: () => setOpen(true),
    enabled: true,
  });

  // Build command list lazily when opened
  useEffect(() => {
    if (!open || loaded) return;

    const navItems: CommandItem[] = [
      { id: 'nav-home', label: 'Acasă', group: 'Navigare', action: () => navigate(isAdmin ? '/admin' : isProfessor ? '/professor' : '/') },
    ];
    if (!isAdmin && !isProfessor) {
      navItems.push(
        { id: 'nav-evals', label: 'Evaluări active', group: 'Navigare', action: () => navigate('/evaluations') },
        { id: 'nav-history', label: 'Istoric evaluări', group: 'Navigare', action: () => navigate('/history') },
        { id: 'nav-results', label: 'Rezultate agregate', group: 'Navigare', action: () => navigate('/results') },
        { id: 'nav-achievements', label: 'Achievements', group: 'Navigare', action: () => navigate('/achievements') },
        { id: 'nav-guide', label: 'Ghid pentru studenți', group: 'Navigare', action: () => navigate('/guide') },
      );
    }
    if (isAdmin) {
      navItems.push(
        { id: 'nav-admin-controls', label: 'Gestionare platformă', group: 'Navigare', action: () => navigate('/admin/controls') },
        { id: 'nav-admin-reports', label: 'Rapoarte instituționale', group: 'Navigare', action: () => navigate('/admin/reports') },
      );
    }
    if (isProfessor) {
      navItems.push(
        { id: 'nav-prof-reports', label: 'Rapoartele mele', group: 'Navigare', action: () => navigate('/professor/reports') },
      );
    }

    const built: CommandItem[] = [...navItems];

    // Load professors and courses for student role only (others have private data)
    if (!isAdmin && !isProfessor) {
      api
        .getProfessorsToEvaluate()
        .then((data) => {
          data.professors.forEach((p) => {
            built.push({
              id: `prof-${p.id}-${p.course.id}`,
              label: p.name,
              meta: `${p.course.name} · ${p.department}`,
              group: 'Profesori',
              action: async () => {
                try {
                  if (p.evaluation.id) {
                    navigate(`/evaluation/${p.evaluation.id}`);
                  } else {
                    const result = await api.createEvaluation(p.course.id, p.id);
                    navigate(`/evaluation/${result.evaluationId}`);
                  }
                } catch {
                  navigate('/');
                }
              },
            });
            built.push({
              id: `course-${p.course.id}-${p.id}`,
              label: p.course.name,
              meta: p.course.code,
              group: 'Cursuri',
              action: () => navigate('/evaluations'),
            });
          });
          setItems([...built]);
        })
        .catch(() => setItems([...built]));
    } else {
      setItems(built);
    }
    setLoaded(true);
  }, [open, loaded, isAdmin, isProfessor, navigate]);

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.meta?.toLowerCase().includes(q) ?? false) ||
        i.group.toLowerCase().includes(q),
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((i) => {
      const arr = map.get(i.group) || [];
      arr.push(i);
      map.set(i.group, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const handleSelect = (item: CommandItem) => {
    setOpen(false);
    setQuery('');
    setTimeout(() => item.action(), 50);
  };

  return (
    <>
      {/* Trigger button rendered inline by Layout via "CommandPaletteTrigger" — see export below */}

      <Transition show={open} as={Fragment}>
        <Dialog
          onClose={() => setOpen(false)}
          className="relative z-50"
          aria-label="Paletă de comenzi"
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-neutral-900/40" aria-hidden="true" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-start justify-center p-4 pt-[12vh]">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl bg-white rounded-2xl shadow-elev-4 border border-neutral-100 overflow-hidden">
                <Combobox<CommandItem | null> value={null} onChange={(v) => v && handleSelect(v)}>
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
                    <MagnifyingGlassIcon className="w-5 h-5 text-neutral-400 shrink-0" aria-hidden="true" />
                    <Combobox.Input
                      autoFocus
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Caută o disciplină, un profesor sau o pagină..."
                      className="flex-1 border-0 outline-none bg-transparent text-base placeholder:text-neutral-400 font-sans"
                    />
                    <kbd className="font-mono text-[11px] px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded">
                      ESC
                    </kbd>
                  </div>
                  <Combobox.Options static className="max-h-[420px] overflow-y-auto py-2">
                    {grouped.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-neutral-500">
                        Nimic găsit pentru „{query}"
                      </div>
                    ) : (
                      grouped.map(([group, list]) => (
                        <div key={group}>
                          <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                            {group}
                          </div>
                          {list.map((item) => (
                            <Combobox.Option
                              key={item.id}
                              value={item}
                              className={({ active }) =>
                                `px-4 py-2.5 cursor-pointer flex items-center gap-3 ${
                                  active ? 'bg-accent-50' : ''
                                }`
                              }
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-neutral-800 truncate">
                                  {item.label}
                                </div>
                                {item.meta && (
                                  <div className="text-xs text-neutral-500 truncate">{item.meta}</div>
                                )}
                              </div>
                              <span className="text-[11px] text-accent-700 font-medium opacity-0 group-hover:opacity-100">
                                ↵
                              </span>
                            </Combobox.Option>
                          ))}
                        </div>
                      ))
                    )}
                  </Combobox.Options>
                  <div className="px-4 py-2 border-t border-neutral-100 text-[11px] text-neutral-500 flex justify-between bg-neutral-25">
                    <span>
                      <kbd className="font-mono px-1 py-0.5 bg-neutral-100 rounded mr-1">↑</kbd>
                      <kbd className="font-mono px-1 py-0.5 bg-neutral-100 rounded">↓</kbd> Navigare
                    </span>
                    <span>
                      <kbd className="font-mono px-1 py-0.5 bg-neutral-100 rounded">↵</kbd> Selectează
                    </span>
                  </div>
                </Combobox>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Expose opener via window for the Layout trigger button to call */}
      <CommandPaletteOpener setOpen={setOpen} />
    </>
  );
}

function CommandPaletteOpener({ setOpen }: { setOpen: (v: boolean) => void }) {
  useEffect(() => {
    (window as any).__openCommandPalette = () => setOpen(true);
    return () => {
      delete (window as any).__openCommandPalette;
    };
  }, [setOpen]);
  return null;
}
