import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Badge, Button, Tabs, TabPanel, Input } from '../components/ui';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../components/Toast';

type Role = 'student' | 'professor' | 'admin';
const ROLES: Role[] = ['student', 'professor', 'admin'];
const ROLE_LABELS: Record<Role, string> = {
  student: 'Studenți',
  professor: 'Profesori',
  admin: 'Administratori',
};

interface GuideData {
  role: Role;
  title: string;
  body: string;
  updated_at: string;
}

export default function AdminGuides() {
  const [guides, setGuides] = useState<Record<Role, GuideData | null>>({
    student: null, professor: null, admin: null,
  });
  const [tabIdx, setTabIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');

  // Form state per role
  const [forms, setForms] = useState<Record<Role, { title: string; body: string }>>({
    student: { title: '', body: '' },
    professor: { title: '', body: '' },
    admin: { title: '', body: '' },
  });

  const load = async () => {
    try {
      const { guides } = await api.getAllGuides();
      const next = { student: null, professor: null, admin: null } as Record<Role, GuideData | null>;
      const nextForms = { ...forms };
      for (const g of guides as GuideData[]) {
        next[g.role] = g;
        nextForms[g.role] = { title: g.title, body: g.body };
      }
      setGuides(next);
      setForms(nextForms);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Eroare la încărcare');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toast = useToast();
  const handleSave = async (role: Role) => {
    setSaving(true);
    setSavedMsg('');
    try {
      await api.updateGuide(role, forms[role]);
      toast.push({
        tone: 'success',
        title: `Ghidul „${ROLE_LABELS[role]}" salvat`,
        desc: 'Utilizatorii vor vedea conținutul actualizat la următoarea accesare.',
      });
      await load();
    } catch (e: any) {
      const err = e.response?.data?.error || 'Eroare la salvare';
      setError(err);
      toast.push({ tone: 'error', title: 'Salvare eșuată', desc: err });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600 mx-auto mb-4" aria-hidden="true" />
        <div className="text-neutral-500 text-sm">Se încarcă ghidurile...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1280px]">
      <div>
        <h1 className="font-display text-[30px] font-semibold tracking-tight text-neutral-800">
          Editor ghiduri
        </h1>
        <p className="mt-1.5 text-neutral-500 text-[15px]">
          Editează cele 3 ghiduri (studenți, profesori, admin) — markdown simplu cu <code className="font-mono text-xs px-1 bg-neutral-100 rounded">## titlu</code>, <code className="font-mono text-xs px-1 bg-neutral-100 rounded">- item</code>, <code className="font-mono text-xs px-1 bg-neutral-100 rounded">**bold**</code>.
        </p>
      </div>

      {error && (
        <Card tone="danger">
          <p className="text-sm text-danger-fg">{error}</p>
        </Card>
      )}

      {savedMsg && (
        <Card tone="success" className="flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-success-fg" aria-hidden="true" />
          <p className="text-sm text-success-fg">{savedMsg}</p>
        </Card>
      )}

      <Tabs
        ariaLabel="Selectează ghid"
        tabs={ROLES.map((r) => ({ id: r, label: ROLE_LABELS[r] }))}
        selectedIndex={tabIdx}
        onChange={setTabIdx}
      >
        {ROLES.map((role) => (
          <TabPanel key={role}>
            <Card>
              <div className="flex flex-col gap-4">
                <Input
                  label="Titlu ghid"
                  value={forms[role].title}
                  onChange={(e) => setForms((f) => ({ ...f, [role]: { ...f[role], title: e.target.value } }))}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-neutral-700">Conținut (markdown)</label>
                  <textarea
                    value={forms[role].body}
                    onChange={(e) => setForms((f) => ({ ...f, [role]: { ...f[role], body: e.target.value } }))}
                    rows={20}
                    className="w-full p-3 text-sm font-mono rounded-md border border-neutral-200 shadow-elev-1 focus:outline-none focus:ring-[3px] focus:ring-accent-400/30 focus:border-accent-400"
                  />
                  <p className="text-xs text-neutral-500">
                    Suportă: <code className="font-mono">## Titlu</code>, <code className="font-mono">### Sub</code>,{' '}
                    <code className="font-mono">- item</code>, <code className="font-mono">**bold**</code>,{' '}
                    <code className="font-mono">`cod`</code>.
                  </p>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Badge tone="neutral">
                    Actualizat:{' '}
                    {guides[role]?.updated_at
                      ? new Date(guides[role]!.updated_at).toLocaleString('ro-RO')
                      : '—'}
                  </Badge>
                  <Button variant="primary" loading={saving} onClick={() => handleSave(role)}>
                    Salvează modificările
                  </Button>
                </div>
              </div>
            </Card>
          </TabPanel>
        ))}
      </Tabs>

      <Card tone="info">
        <p className="text-sm text-info-fg">
          <strong>Notă:</strong> Studenții, profesorii și administratorii vor vedea conținutul actualizat
          imediat după salvare (la următoarea accesare a paginii „Ghid").
        </p>
      </Card>
    </div>
  );
}
