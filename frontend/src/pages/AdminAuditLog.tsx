import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Badge, LoadingState, Input } from '../components/ui';
import { ShieldCheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface AuditEntry {
  id: number;
  user_email: string | null;
  user_role: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: any;
  ip: string | null;
  created_at: string;
}

function actionTone(action: string): 'accent' | 'danger' | 'success' | 'warning' | 'neutral' {
  if (action.includes('delete') || action.includes('deactivate')) return 'danger';
  if (action.includes('create')) return 'success';
  if (action.includes('update') || action.includes('publish')) return 'accent';
  if (action.includes('reset') || action.includes('login')) return 'warning';
  return 'neutral';
}

export default function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api
        .getAuditLog({ action: search || undefined, limit: 100 })
        .then((d) => {
          setEntries(d.entries);
          setTotal(d.pagination.total);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="flex flex-col gap-7 max-w-[1280px]">
      <div>
        <h1 className="font-display text-[30px] font-semibold tracking-tight text-neutral-800 flex items-center gap-3">
          <ShieldCheckIcon className="w-8 h-8 text-accent-600" aria-hidden="true" />
          Audit log
        </h1>
        <p className="mt-1.5 text-neutral-500 text-[15px] max-w-[720px]">
          Înregistrarea acțiunilor administrative cu impact (creare/dezactivare utilizatori,
          publicare closing-loop, modificare configurări). Conform CF-14 dizertație + cerințe GDPR.
        </p>
      </div>

      <Card padding="md">
        <Input
          prefix={<MagnifyingGlassIcon className="w-4 h-4" />}
          placeholder="Caută acțiune (ex: user.create, user.deactivate)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {loading ? (
        <LoadingState />
      ) : (
        <Card padding="none">
          <div className="px-6 py-3 border-b border-neutral-100 text-xs text-neutral-500">
            {entries.length} din {total.toLocaleString('ro-RO')} intrări
          </div>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-sm text-neutral-500">
              Niciun audit înregistrat încă.
            </div>
          ) : (
            <ul>
              {entries.map((e, i) => (
                <li
                  key={e.id}
                  className={`px-6 py-3 flex items-start gap-3 ${
                    i < entries.length - 1 ? 'border-b border-neutral-100' : ''
                  }`}
                >
                  <Badge tone={actionTone(e.action)}>{e.action}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-neutral-800">
                      <strong>{e.user_email || 'sistem'}</strong>
                      {e.target_type && (
                        <span className="text-neutral-500">
                          {' → '}{e.target_type}#{e.target_id}
                        </span>
                      )}
                    </div>
                    {e.details && (
                      <pre className="text-[11px] text-neutral-500 mt-1 whitespace-pre-wrap font-mono">
                        {JSON.stringify(e.details, null, 0).substring(0, 150)}
                      </pre>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400 whitespace-nowrap text-right">
                    {new Date(e.created_at).toLocaleString('ro-RO')}
                    {e.ip && <div className="text-[10px]">{e.ip}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
