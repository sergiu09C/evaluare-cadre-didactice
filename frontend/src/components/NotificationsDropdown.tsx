import { useEffect, useState, useRef } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Notification } from '../types';

const typeAccent: Record<Notification['type'], string> = {
  info: 'bg-info-bg text-info-fg',
  success: 'bg-success-bg text-success-fg',
  warning: 'bg-warning-bg text-warning-fg',
  error: 'bg-danger-bg text-danger-fg',
};

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'acum';
    if (m < 60) return `acum ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `acum ${h}h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `acum ${days}z`;
    return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export default function NotificationsDropdown() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();
  const refreshTimer = useRef<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setItems(data.notifications.slice(0, 5));
      setUnread(data.unreadCount);
      setLoaded(true);
    } catch {
      // Fail silently — bell still works as link to placeholder
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    refreshTimer.current = window.setInterval(load, 60_000); // refresh every minute
    return () => {
      if (refreshTimer.current) window.clearInterval(refreshTimer.current);
    };
  }, []);

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            aria-label={`Notificări${unread > 0 ? ` (${unread} necitite)` : ''}`}
            className="relative w-9 h-9 rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-neutral-600 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 transition-colors"
          >
            <BellIcon className="w-[18px] h-[18px]" aria-hidden="true" />
            {unread > 0 && (
              <span
                className="absolute top-[7px] right-[7px] w-2 h-2 rounded-full bg-accent-600 border-2 border-white"
                aria-hidden="true"
              />
            )}
          </Popover.Button>
          <Transition
            show={open}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Panel className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-xl shadow-elev-3 border border-neutral-100 z-50">
              <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-neutral-800">Notificări</h3>
                {unread > 0 && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-100 text-accent-700">
                    {unread} necitite
                  </span>
                )}
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {loading && !loaded ? (
                  <div className="px-4 py-8 text-center text-sm text-neutral-500">
                    Se încarcă...
                  </div>
                ) : items.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-neutral-500">
                    Nicio notificare nouă.
                  </div>
                ) : (
                  items.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (n.actionUrl) navigate(n.actionUrl);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 flex gap-3 items-start focus:outline-none focus-visible:bg-neutral-50"
                    >
                      <span
                        className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${typeAccent[n.type]}`}
                        aria-hidden="true"
                      >
                        {n.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-neutral-800 truncate">
                          {n.title}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{n.message}</div>
                        {n.actionText && (
                          <div className="text-[11px] text-accent-700 mt-1 font-medium">
                            {n.actionText} →
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 shrink-0">
                        {formatRelative(n.createdAt)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
