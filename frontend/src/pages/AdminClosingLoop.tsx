import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Badge, Button, Input, Select, EmptyState } from '../components/ui';
import AccessibleModal from '../components/AccessibleModal';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import type { ClosingLoopEntryAdmin } from '../types';

const DOT_COLORS = [
  { value: '#7C3AED', label: 'Violet (default)' },
  { value: '#A78BFA', label: 'Violet deschis' },
  { value: '#C4B5FD', label: 'Lavandă' },
  { value: '#10B981', label: 'Verde (succes)' },
  { value: '#F59E0B', label: 'Galben (atenție)' },
  { value: '#EF4444', label: 'Roșu (alertă)' },
];

const DIMENSIONS = ['Predare', 'Comunicare', 'Resurse', 'Evaluare', 'Disponibilitate'];

interface FormState {
  title: string;
  body: string;
  dot_color: string;
  related_dimension: string;
  sort_order: number;
  is_published: boolean;
}

const emptyForm: FormState = {
  title: '',
  body: '',
  dot_color: '#7C3AED',
  related_dimension: '',
  sort_order: 99,
  is_published: true,
};

export default function AdminClosingLoop() {
  const [entries, setEntries] = useState<ClosingLoopEntryAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const { entries } = await api.getClosingLoopAdmin();
      setEntries(entries);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Eroare la încărcare');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (e: ClosingLoopEntryAdmin) => {
    setEditingId(e.id);
    setForm({
      title: e.title,
      body: e.body,
      dot_color: e.dot_color || '#7C3AED',
      related_dimension: e.related_dimension || '',
      sort_order: e.sort_order ?? 99,
      is_published: !!e.is_published,
    });
    setShowModal(true);
  };

  const togglePublish = async (e: ClosingLoopEntryAdmin) => {
    await api.updateClosingLoop(e.id, { is_published: !e.is_published });
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sigur vrei să ștergi această intrare?')) return;
    await api.deleteClosingLoop(id);
    await load();
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    try {
      setSaving(true);
      if (editingId) {
        await api.updateClosingLoop(editingId, form);
      } else {
        await api.createClosingLoop(form);
      }
      setShowModal(false);
      await load();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Eroare la salvare');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16" role="status" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4" aria-hidden="true" />
        <div className="text-neutral-500">Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 max-w-[1280px]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-[30px] font-semibold tracking-tight text-neutral-800">
            Editor „Ați evaluat, noi am acționat"
          </h1>
          <p className="mt-1.5 text-neutral-500 text-sm md:text-[15px]">
            Schimbările concrete pe care studenții le văd pe dashboard ca rezultat al evaluărilor lor.
          </p>
        </div>
        <Button variant="primary" icon={<PlusIcon />} onClick={openCreate}>
          Adaugă schimbare
        </Button>
      </div>

      {error && (
        <Card tone="danger">
          <p className="text-sm text-danger-fg">{error}</p>
        </Card>
      )}

      {entries.length === 0 ? (
        <EmptyState
          title="Niciun item publicat încă"
          description="Adaugă schimbări concrete bazate pe evaluările studenților din semestrul trecut."
          action={
            <Button variant="primary" icon={<PlusIcon />} onClick={openCreate}>
              Adaugă prima schimbare
            </Button>
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={`px-6 py-5 flex items-start gap-4 ${i < entries.length - 1 ? 'border-b border-neutral-100' : ''}`}
            >
              <span
                className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                style={{ background: entry.dot_color }}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-base font-semibold text-neutral-800">{entry.title}</h3>
                  {entry.related_dimension && <Badge tone="accent">{entry.related_dimension}</Badge>}
                  {!entry.is_published && <Badge tone="warning">Nepublicat</Badge>}
                  <Badge tone="neutral">
                    <ArrowsUpDownIcon className="w-3 h-3" aria-hidden="true" />
                    Ordine: {entry.sort_order}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-500 leading-relaxed">{entry.body}</p>
                <p className="text-xs text-neutral-400 mt-2">Actualizat {new Date(entry.updated_at).toLocaleDateString('ro-RO')}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={entry.is_published ? <EyeIcon /> : <EyeSlashIcon />}
                  onClick={() => togglePublish(entry)}
                  aria-label={entry.is_published ? 'Ascunde' : 'Publică'}
                >
                  {entry.is_published ? 'Publicat' : 'Ascuns'}
                </Button>
                <Button variant="secondary" size="sm" icon={<PencilIcon />} onClick={() => openEdit(entry)}>
                  Editează
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<TrashIcon />}
                  onClick={() => handleDelete(entry.id)}
                  aria-label="Șterge"
                >
                  <span className="sr-only">Șterge</span>
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card tone="info">
        <h3 className="text-sm font-semibold text-info-fg mb-2">Despre această secțiune</h3>
        <p className="text-sm text-info-fg leading-relaxed">
          Schimbările publicate aici apar imediat pe Dashboard-ul tuturor studenților în banner-ul
          „Ați evaluat, noi am acționat" și pe pagina de Rezultate agregate. Recomandare: publică
          3–5 schimbări concrete per ciclu de evaluare, fiecare legată de o dimensiune a chestionarului.
        </p>
      </Card>

      <AccessibleModal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editează schimbarea' : 'Adaugă schimbare nouă'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4 p-1">
          <Input
            label="Titlu"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            placeholder="Ex: Materiale actualizate"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-neutral-700">Descriere</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={4}
              required
              placeholder="Descrie schimbarea concret, cu numere și date."
              className="w-full p-3 text-sm rounded-md border border-neutral-200 shadow-elev-1 resize-y focus:outline-none focus:ring-[3px] focus:ring-accent-400/30 focus:border-accent-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Culoare punct"
              value={form.dot_color}
              onChange={(e) => setForm((f) => ({ ...f, dot_color: e.target.value }))}
            >
              {DOT_COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
            <Select
              label="Dimensiune legată"
              value={form.related_dimension}
              onChange={(e) => setForm((f) => ({ ...f, related_dimension: e.target.value }))}
            >
              <option value="">— niciuna —</option>
              {DIMENSIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Ordine sortare"
            type="number"
            value={String(form.sort_order)}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
            hint="Numerele mai mici apar primele"
          />
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
              className="w-4 h-4 rounded"
              style={{ accentColor: '#7C3AED' }}
            />
            <span className="text-sm text-neutral-800">Publicat (vizibil pentru studenți)</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Anulează
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {editingId ? 'Salvează modificări' : 'Adaugă'}
            </Button>
          </div>
        </form>
      </AccessibleModal>
    </div>
  );
}
