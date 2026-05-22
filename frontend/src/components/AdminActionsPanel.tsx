import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Badge, Button, Input, Select, EmptyState } from './ui';
import AccessibleModal from './AccessibleModal';
import { PlusIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

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

interface Props {
  professorId: number;
  professorName: string;
}

export default function AdminActionsPanel({ professorId, professorName }: Props) {
  const [actions, setActions] = useState<Action[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [form, setForm] = useState({ title: '', description: '', category: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [a, s, t] = await Promise.all([
        api.adminListActions({ professor_id: professorId }),
        api.adminActionsSummary(professorId),
        api.listActionTemplates(),
      ]);
      setActions(a.actions);
      setSummary(s);
      setTemplates(t.templates);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [professorId]);

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api.proposeAction({
        professor_id: professorId,
        template_id: selectedTemplate === 'custom' ? null : Number(selectedTemplate),
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
      });
      setShowModal(false);
      setForm({ title: '', description: '', category: '' });
      setSelectedTemplate('custom');
      await load();
    } finally { setSaving(false); }
  };

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === 'custom') {
      setForm({ title: '', description: '', category: '' });
      return;
    }
    const t = templates.find((x) => String(x.id) === templateId);
    if (t) setForm({ title: t.title, description: t.description || '', category: t.category || '' });
  };

  if (loading) return null;

  return (
    <Card>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-5 h-5 text-accent-600" aria-hidden="true" />
            Acțiuni & intervenții
          </h2>
          <p className="text-xs text-neutral-500 mt-1">Propune acțiuni concrete, urmărește progresul lui {professorName.split(' ').slice(-1)[0]}.</p>
        </div>
        <Button variant="primary" size="sm" icon={<PlusIcon />} onClick={() => setShowModal(true)}>
          Propune acțiune
        </Button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="px-3 py-2 rounded-md bg-warning-bg text-warning-fg">
            <div className="text-xs font-medium">Propuse</div>
            <div className="font-display text-xl font-semibold">{summary.counts?.proposed || 0}</div>
          </div>
          <div className="px-3 py-2 rounded-md bg-info-bg text-info-fg">
            <div className="text-xs font-medium">Acceptate</div>
            <div className="font-display text-xl font-semibold">{summary.counts?.accepted || 0}</div>
          </div>
          <div className="px-3 py-2 rounded-md bg-success-bg text-success-fg">
            <div className="text-xs font-medium">Finalizate</div>
            <div className="font-display text-xl font-semibold">{summary.counts?.completed || 0}</div>
          </div>
          <div className="px-3 py-2 rounded-md bg-neutral-100 text-neutral-700">
            <div className="text-xs font-medium">Întâlniri</div>
            <div className="font-display text-xl font-semibold">{summary.meetings_completed || 0}</div>
          </div>
        </div>
      )}

      {actions.length === 0 ? (
        <EmptyState title="Nicio acțiune propusă încă" description="Propune o acțiune din template sau personalizată." />
      ) : (
        <div className="flex flex-col gap-2">
          {actions.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-3 border border-neutral-100 rounded-lg">
              <div className="shrink-0 mt-0.5">
                {a.status === 'completed' && <CheckCircleIcon className="w-5 h-5 text-success-fg" />}
                {a.status === 'accepted' && <ClockIcon className="w-5 h-5 text-info-fg" />}
                {a.status === 'proposed' && <ClockIcon className="w-5 h-5 text-warning-fg" />}
                {a.status === 'rejected' && <XCircleIcon className="w-5 h-5 text-danger-fg" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-neutral-800">{a.title}</h3>
                  {a.category && <Badge tone="neutral">{a.category}</Badge>}
                  <Badge tone={a.status === 'completed' ? 'success' : a.status === 'accepted' ? 'info' : a.status === 'rejected' ? 'danger' : 'warning'}>
                    {a.status === 'proposed' ? 'Așteaptă răspuns' : a.status === 'accepted' ? 'În curs' : a.status === 'completed' ? 'Finalizată' : 'Respinsă'}
                  </Badge>
                </div>
                {a.description && <p className="text-xs text-neutral-600 mt-1">{a.description}</p>}
                {a.notes && <p className="text-xs text-neutral-500 italic mt-1">Note profesor: {a.notes}</p>}
                <p className="text-[11px] text-neutral-400 mt-1">
                  Propusă: {new Date(a.proposed_at).toLocaleDateString('ro-RO')}
                  {a.completed_at && ` · Finalizată: ${new Date(a.completed_at).toLocaleDateString('ro-RO')}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <AccessibleModal isOpen={showModal} onClose={() => setShowModal(false)} title={`Propune acțiune pentru ${professorName}`}>
        <form onSubmit={handlePropose} className="flex flex-col gap-4 p-1">
          <Select
            label="Template (sau personalizat)"
            value={selectedTemplate}
            onChange={(e) => applyTemplate(e.target.value)}
          >
            <option value="custom">Personalizat — completează manual</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.title} ({t.category})</option>
            ))}
          </Select>
          <Input label="Titlu acțiune" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div>
            <label className="text-[13px] font-medium text-neutral-700">Descriere</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full p-3 mt-1 text-sm rounded-md border border-neutral-200 shadow-elev-1 focus:outline-none focus:ring-[3px] focus:ring-accent-400/30 focus:border-accent-400"
            />
          </div>
          <Input label="Categorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} hint="ex: meeting, training, mentoring, planning" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Anulează</Button>
            <Button variant="primary" type="submit" loading={saving}>Trimite propunere</Button>
          </div>
        </form>
      </AccessibleModal>
    </Card>
  );
}
