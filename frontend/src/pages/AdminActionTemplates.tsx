import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Badge, Button, Input, Select, EmptyState, ConfirmDialog, LoadingState } from '../components/ui';
import AccessibleModal from '../components/AccessibleModal';
import { useToast } from '../components/Toast';
import { PlusIcon, TrashIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface Template {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  is_active: number;
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'didactic', label: 'Didactic' },
  { value: 'interaction', label: 'Interacțiune' },
  { value: 'content', label: 'Conținut' },
  { value: 'availability', label: 'Disponibilitate' },
  { value: 'general', label: 'General' },
];

// Tone-uri valide pe Badge: neutral | primary | accent | success | warning | danger | info
const CATEGORY_TONES: Record<string, 'accent' | 'info' | 'success' | 'warning' | 'neutral'> = {
  didactic: 'accent',
  interaction: 'info',
  content: 'success',
  availability: 'warning',
  general: 'neutral',
};

export default function AdminActionTemplates() {
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'general' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.listActionTemplates();
      setTemplates(r.templates);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.title.trim()) {
      toast.push({ tone: 'warning', title: 'Titlu obligatoriu' });
      return;
    }
    setSaving(true);
    try {
      await api.createActionTemplate({
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
      });
      toast.push({ tone: 'success', title: 'Șablon creat' });
      setShowModal(false);
      setForm({ title: '', description: '', category: 'general' });
      await load();
    } catch (e: any) {
      toast.push({ tone: 'error', title: 'Eroare', desc: e.response?.data?.error || 'Salvare eșuată' });
    } finally {
      setSaving(false);
    }
  };

  const [pendingDelete, setPendingDelete] = useState<Template | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const handleDelete = (t: Template) => setPendingDelete(t);
  const performDelete = async () => {
    if (!pendingDelete) return;
    setDeleteLoading(true);
    try {
      await api.deleteActionTemplate(pendingDelete.id);
      toast.push({ tone: 'success', title: 'Șablon șters' });
      setPendingDelete(null);
      await load();
    } catch (e: any) {
      toast.push({ tone: 'error', title: 'Eroare', desc: e.response?.data?.error || 'Ștergere eșuată' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-7 max-w-[1100px]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-[30px] font-semibold tracking-tight text-neutral-800 flex items-center gap-3">
            <ClipboardDocumentListIcon className="w-8 h-8 text-accent-600" aria-hidden="true" />
            Șabloane acțiuni CEAC
          </h1>
          <p className="mt-1.5 text-neutral-500 text-sm md:text-[15px] max-w-[640px]">
            Gestionează șabloanele standard din care propui acțiuni de îmbunătățire către profesori
            (din pagina detaliată a fiecărui profesor). Acțiunile deja propuse rămân chiar dacă
            ștergi șablonul.
          </p>
        </div>
        <Button variant="primary" icon={<PlusIcon />} onClick={() => setShowModal(true)}>
          Adaugă șablon
        </Button>
      </div>

      {loading ? (
        <LoadingState label="Se încarcă șabloanele..." />
      ) : templates.length === 0 ? (
        <EmptyState
          title="Niciun șablon"
          description="Adaugă primul șablon — apoi vei putea propune acțiuni pre-completate din pagina fiecărui profesor."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <ul>
            {templates.map((t, i) => (
              <li
                key={t.id}
                className={`px-6 py-4 flex items-start gap-4 ${
                  i < templates.length - 1 ? 'border-b border-neutral-100' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-semibold text-neutral-800">{t.title}</h3>
                    {t.category && (
                      <Badge tone={CATEGORY_TONES[t.category] ?? 'neutral'}>
                        {CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
                      </Badge>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-sm text-neutral-600 whitespace-pre-wrap">{t.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<TrashIcon />}
                  onClick={() => handleDelete(t)}
                  aria-label={`Șterge șablonul ${t.title}`}
                >
                  <span className="sr-only">Șterge</span>
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AccessibleModal isOpen={showModal} onClose={() => setShowModal(false)} title="Adaugă șablon de acțiune">
        <form onSubmit={handleCreate} className="flex flex-col gap-4 p-1">
          <Input
            label="Titlu"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            autoFocus
            placeholder="ex: Workshop didactic interactiv"
          />
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1" htmlFor="tpl-desc">
              Descriere (opțional)
            </label>
            <textarea
              id="tpl-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              placeholder="Detaliază pașii recomandați, resursele utile, durata estimată..."
              className="w-full p-3 text-sm rounded-md border border-neutral-200 shadow-elev-1 focus:outline-none focus:ring-[3px] focus:ring-accent-400/30 focus:border-accent-400"
            />
          </div>
          <Select
            label="Categorie"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Anulează
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              Salvează
            </Button>
          </div>
        </form>
      </AccessibleModal>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={performDelete}
        title="Șterge șablon"
        message={
          pendingDelete
            ? `Ștergi șablonul „${pendingDelete.title}"? Acțiunile deja propuse din acest șablon rămân neafectate.`
            : ''
        }
        confirmLabel="Șterge"
        loading={deleteLoading}
      />
    </div>
  );
}
