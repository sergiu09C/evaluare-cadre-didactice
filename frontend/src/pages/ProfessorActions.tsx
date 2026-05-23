import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Badge, Button, EmptyState } from '../components/ui';
import AccessibleModal from '../components/AccessibleModal';
import { CheckCircleIcon, XCircleIcon, ClockIcon, InboxIcon } from '@heroicons/react/24/outline';
import { IllInbox } from '../components/illustrations';

interface Action {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  status: 'proposed' | 'accepted' | 'completed' | 'rejected';
  proposed_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  proposed: 'Propusă',
  accepted: 'Acceptată',
  completed: 'Finalizată',
  rejected: 'Respinsă',
};
const STATUS_TONE: Record<string, 'warning' | 'info' | 'success' | 'neutral'> = {
  proposed: 'warning',
  accepted: 'info',
  completed: 'success',
  rejected: 'neutral',
};

export default function ProfessorActions() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [decision, setDecision] = useState<'accepted' | 'rejected' | 'completed'>('accepted');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { actions } = await api.professorListActions();
      setActions(actions);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Eroare la încărcare');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openRespond = (a: Action, def: 'accepted' | 'completed' | 'rejected') => {
    setActiveAction(a);
    setDecision(def);
    setNotes(a.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAction) return;
    setSaving(true);
    try {
      await api.professorRespondAction(activeAction.id, decision, notes);
      setShowModal(false);
      setActiveAction(null);
      setNotes('');
      await load();
    } finally { setSaving(false); }
  };

  const proposed = actions.filter((a) => a.status === 'proposed');
  const accepted = actions.filter((a) => a.status === 'accepted');
  const completed = actions.filter((a) => a.status === 'completed' || a.status === 'rejected');

  if (loading) return <div className="text-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600 mx-auto" /></div>;

  return (
    <div className="flex flex-col gap-7 max-w-[1080px]">
      <div>
        <h1 className="font-display text-2xl md:text-[30px] font-semibold tracking-tight text-neutral-800 flex items-center gap-3">
          <InboxIcon className="w-8 h-8 text-accent-600" aria-hidden="true" />
          Acțiuni propuse pentru tine
        </h1>
        <p className="mt-1.5 text-neutral-500 text-sm md:text-[15px]">
          CEAC îți propune acțiuni concrete pe baza evaluărilor. Acceptă-le, refuză-le sau marchează-le ca finalizate.
        </p>
      </div>

      {error && (
        <Card tone="danger"><p className="text-sm text-danger-fg">{error}</p></Card>
      )}

      {/* Propuse (necesită acțiune) */}
      {proposed.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-warning-fg" aria-hidden="true" />
            Necesită răspunsul tău ({proposed.length})
          </h2>
          <div className="flex flex-col gap-3">
            {proposed.map((a) => (
              <Card key={a.id} tone="warning">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-800">{a.title}</h3>
                    {a.category && <Badge tone="neutral">{a.category}</Badge>}
                  </div>
                  <Badge tone="warning">Propusă {new Date(a.proposed_at).toLocaleDateString('ro-RO')}</Badge>
                </div>
                {a.description && <p className="text-sm text-neutral-700 mb-3">{a.description}</p>}
                <div className="flex gap-2 flex-wrap">
                  <Button variant="accent" size="sm" icon={<CheckCircleIcon />} onClick={() => openRespond(a, 'accepted')}>Acceptă</Button>
                  <Button variant="secondary" size="sm" onClick={() => openRespond(a, 'completed')}>Marchează finalizată</Button>
                  <Button variant="ghost" size="sm" icon={<XCircleIcon />} onClick={() => openRespond(a, 'rejected')}>Respinge</Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Acceptate (în curs) */}
      {accepted.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-neutral-800 mb-3">În curs ({accepted.length})</h2>
          <div className="flex flex-col gap-3">
            {accepted.map((a) => (
              <Card key={a.id}>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-800">{a.title}</h3>
                    {a.category && <Badge tone="neutral">{a.category}</Badge>}
                    {a.description && <p className="text-sm text-neutral-600 mt-2">{a.description}</p>}
                    {a.notes && <p className="text-xs text-neutral-500 mt-2 italic">Note: {a.notes}</p>}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge tone="info">Acceptată {a.accepted_at && new Date(a.accepted_at).toLocaleDateString('ro-RO')}</Badge>
                    <Button variant="secondary" size="sm" onClick={() => openRespond(a, 'completed')}>Marchează finalizată</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Finalizate / respinse */}
      {completed.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-neutral-800 mb-3">Istoric ({completed.length})</h2>
          <Card padding="none" className="overflow-hidden">
            {completed.map((a, i) => (
              <div key={a.id} className={`px-6 py-4 ${i < completed.length - 1 ? 'border-b border-neutral-100' : ''}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-800">{a.title}</h3>
                    {a.notes && <p className="text-xs text-neutral-500 mt-1">{a.notes}</p>}
                  </div>
                  <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]} {a.completed_at && '· ' + new Date(a.completed_at).toLocaleDateString('ro-RO')}</Badge>
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}

      {actions.length === 0 && (
        <EmptyState illustration={<IllInbox className="w-full h-full" />} title="Nicio acțiune propusă" description="Când CEAC îți va propune acțiuni concrete pe baza feedback-ului, vor apărea aici. Le vei putea accepta, marca drept finalizate sau refuza cu explicații." />
      )}

      <AccessibleModal isOpen={showModal} onClose={() => setShowModal(false)} title={`${STATUS_LABEL[decision]} acțiunea`}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-1">
          <p className="text-sm text-neutral-700">
            <strong>{activeAction?.title}</strong>
          </p>
          <div>
            <label className="text-[13px] font-medium text-neutral-700">Note (opțional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-3 mt-1 text-sm rounded-md border border-neutral-200 shadow-elev-1 focus:outline-none focus:ring-[3px] focus:ring-accent-400/30 focus:border-accent-400"
              placeholder="Adaugă context, calendar, observații..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Anulează</Button>
            <Button variant={decision === 'rejected' ? 'destructive' : 'primary'} type="submit" loading={saving}>
              Confirmă
            </Button>
          </div>
        </form>
      </AccessibleModal>
    </div>
  );
}
