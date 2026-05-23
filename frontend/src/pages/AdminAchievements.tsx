import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Badge, Button, Input, Select, EmptyState, ConfirmDialog } from '../components/ui';
import AccessibleModal from '../components/AccessibleModal';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface Definition {
  id: number;
  key: string;
  title: string;
  description: string;
  icon: string;
  tone: string;
  criteria_type: string;
  threshold: number;
  is_active: number;
}

const CRITERIA_LABELS: Record<string, string> = {
  count_submitted: 'Număr evaluări trimise',
  streak_semesters: 'Semestre consecutive cu activitate',
  comments_with_text: 'Comentarii text (>10 caractere)',
  first_in_program: 'Primul din program (cel puțin 1 evaluare)',
  fast_responder: 'Răspuns în primele 72h',
};

const TONES = ['accent', 'primary', 'mint', 'warm'];
const ICONS = ['trophy', 'check', 'bolt', 'sparkle', 'fire', 'star', 'flag'];

const emptyForm = {
  key: '',
  title: '',
  description: '',
  icon: 'trophy',
  tone: 'accent',
  criteria_type: 'count_submitted',
  threshold: 1,
  is_active: true,
};

export default function AdminAchievements() {
  const [defs, setDefs] = useState<Definition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { definitions } = await api.getAchievementDefinitions();
      setDefs(definitions);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Eroare la încărcare');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };
  const openEdit = (d: Definition) => {
    setEditingId(d.id);
    setForm({
      key: d.key,
      title: d.title,
      description: d.description,
      icon: d.icon,
      tone: d.tone,
      criteria_type: d.criteria_type,
      threshold: d.threshold,
      is_active: !!d.is_active,
    });
    setShowModal(true);
  };
  const toggleActive = async (d: Definition) => {
    await api.updateAchievementDef(d.id, { is_active: !d.is_active });
    await load();
  };
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const handleDelete = (id: number) => setPendingDeleteId(id);
  const performDelete = async () => {
    if (pendingDeleteId == null) return;
    setDeleteLoading(true);
    try {
      await api.deleteAchievementDef(pendingDeleteId);
      setPendingDeleteId(null);
      await load();
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.updateAchievementDef(editingId, form);
      } else {
        await api.createAchievementDef(form);
      }
      setShowModal(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare la salvare');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600 mx-auto mb-4" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 max-w-[1280px]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-[30px] font-semibold tracking-tight text-neutral-800">
            Editor achievements
          </h1>
          <p className="mt-1.5 text-neutral-500 text-sm md:text-[15px]">
            Definițiile sunt re-evaluate la fiecare submit de evaluare; pragurile se aplică dinamic la toți utilizatorii.
          </p>
        </div>
        <Button variant="primary" icon={<PlusIcon />} onClick={openCreate}>
          Adaugă achievement
        </Button>
      </div>

      {error && (
        <Card tone="danger">
          <p className="text-sm text-danger-fg">{error}</p>
        </Card>
      )}

      {defs.length === 0 ? (
        <EmptyState icon={<TrophyIcon className="w-7 h-7" />} title="Niciun achievement definit" />
      ) : (
        <Card padding="none" className="overflow-hidden">
          {defs.map((d, i) => (
            <div
              key={d.id}
              className={`px-6 py-4 flex items-center gap-4 ${i < defs.length - 1 ? 'border-b border-neutral-100' : ''}`}
            >
              <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center text-accent-700 shrink-0">
                <TrophyIcon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-neutral-800">{d.title}</h3>
                  <Badge tone="neutral">{d.key}</Badge>
                  {!d.is_active && <Badge tone="warning">Inactiv</Badge>}
                </div>
                <p className="text-sm text-neutral-500 mt-1">{d.description}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  {CRITERIA_LABELS[d.criteria_type] || d.criteria_type} ≥ <strong>{d.threshold}</strong>
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="sm" icon={d.is_active ? <EyeIcon /> : <EyeSlashIcon />} onClick={() => toggleActive(d)}>
                  {d.is_active ? 'Activ' : 'Inactiv'}
                </Button>
                <Button variant="secondary" size="sm" icon={<PencilIcon />} onClick={() => openEdit(d)}>
                  Editează
                </Button>
                <Button variant="ghost" size="sm" icon={<TrashIcon />} onClick={() => handleDelete(d.id)} aria-label="Șterge">
                  <span className="sr-only">Șterge</span>
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card tone="info">
        <p className="text-sm text-info-fg">
          <strong>Recalculul:</strong> la fiecare submit, engine-ul recalculează automat care achievement-uri sunt
          deblocate. Dacă schimbi pragul, schimbarea se va aplica imediat la următoarea acțiune a userilor.
        </p>
      </Card>

      <AccessibleModal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editează achievement' : 'Adaugă achievement'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4 p-1">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Key (identifier unic)"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              required
              disabled={!!editingId}
              hint={editingId ? 'Nu poate fi modificat după creare' : 'Ex: completionist, first_eval'}
            />
            <Input
              label="Titlu vizibil"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-neutral-700">Descriere</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full p-3 text-sm rounded-md border border-neutral-200 shadow-elev-1 focus:outline-none focus:ring-[3px] focus:ring-accent-400/30 focus:border-accent-400"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
              {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </Select>
            <Select label="Tonul (culoare)" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}>
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input
              label="Prag"
              type="number"
              value={String(form.threshold)}
              onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) || 1 })}
              required
            />
          </div>
          <Select
            label="Tip criteriu (algoritm de calcul)"
            value={form.criteria_type}
            onChange={(e) => setForm({ ...form, criteria_type: e.target.value })}
          >
            {Object.entries(CRITERIA_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4"
              style={{ accentColor: '#7C3AED' }}
            />
            <span className="text-sm text-neutral-800">Activ (vizibil pentru utilizatori)</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Anulează</Button>
            <Button variant="primary" type="submit" loading={saving}>{editingId ? 'Salvează' : 'Creează'}</Button>
          </div>
        </form>
      </AccessibleModal>

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={performDelete}
        title="Șterge achievement"
        message="Ștergi această definiție? Achievement-urile deja câștigate de utilizatori nu sunt afectate, dar definiția nu va mai fi disponibilă."
        confirmLabel="Șterge"
        loading={deleteLoading}
      />
    </div>
  );
}
