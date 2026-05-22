import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Badge, Button, Input, Select, Avatar, EmptyState, ListFilterBar, ConfirmDialog } from '../components/ui';
import { IllUsers } from '../components/illustrations';
import AccessibleModal from '../components/AccessibleModal';
import {
  PlusIcon,
  PencilIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { AdminUser } from '../types';

type Activity = 'curs' | 'seminar' | 'laborator';
interface Assignment {
  course_id: number;
  course_name: string;
  program: string;
  year: number;
  activity: Activity;
}

type Role = 'all' | 'student' | 'professor' | 'admin';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'professor' | 'admin';
  password: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'student',
  password: '',
  is_active: true,
};

function initialsOf(u: AdminUser): string {
  return `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || '??';
}

function roleTone(role: string): 'primary' | 'accent' | 'mint' {
  if (role === 'admin') return 'primary';
  if (role === 'professor') return 'accent';
  return 'mint';
}

const PAGE_SIZE = 25;

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [counts, setCounts] = useState<{ all: number; student: number; professor: number; admin: number }>({
    all: 0,
    student: 0,
    professor: 0,
    admin: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Role>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Editor profil profesor
  const [profFacultyId, setProfFacultyId] = useState<number | null>(null);
  const [profDepartment, setProfDepartment] = useState('');
  const [profAssignments, setProfAssignments] = useState<Assignment[]>([]);
  const [profCourseSearch, setProfCourseSearch] = useState('');
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [availableFaculties, setAvailableFaculties] = useState<{ id: number; name: string }[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);

  // Încarc facultățile o singură dată
  useEffect(() => {
    api.getFilterOptions().then((opts) => setAvailableFaculties(opts.faculties || [])).catch(() => {});
  }, []);

  // Reîncarcă cursuri/departments când se schimbă facultatea sau searchul în modal
  useEffect(() => {
    if (form.role !== 'professor' || !showModal) return;
    api.lookupDepartments({ facultyId: profFacultyId || undefined }).then((r) => setAvailableDepartments(r.departments)).catch(() => {});
    const t = setTimeout(() => {
      api.lookupCourses({ facultyId: profFacultyId || undefined, search: profCourseSearch || undefined })
        .then((r) => setAvailableCourses(r.courses))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [form.role, profFacultyId, profCourseSearch, showModal]);

  const load = async () => {
    try {
      setLoading(true);
      const listParams: any = { page, pageSize: PAGE_SIZE };
      if (filter !== 'all') listParams.role = filter;
      if (search.trim()) listParams.search = search.trim();
      const countsParams: any = {};
      if (search.trim()) countsParams.search = search.trim();
      const [listRes, countsRes] = await Promise.all([
        api.getAdminUsers(listParams),
        api.getAdminUserCounts(countsParams),
      ]);
      setUsers(listRes.users);
      setCounts(countsRes.counts);
      if ((listRes as any).pagination) setPagination((listRes as any).pagination);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Eroare la încărcare');
    } finally {
      setLoading(false);
    }
  };

  // reset la pagina 1 când filtrul/search se schimbă
  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
  }, [filter, search, page]);

  const resetProfForm = () => {
    setProfFacultyId(null);
    setProfDepartment('');
    setProfAssignments([]);
    setProfCourseSearch('');
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    resetProfForm();
    setShowModal(true);
  };

  const openEdit = async (u: AdminUser) => {
    setEditingId(u.id);
    setForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email,
      role: u.role,
      password: '',
      is_active: !!u.is_active,
    });
    resetProfForm();
    if (u.role === 'professor') {
      try {
        const pp = await api.getProfessorProfile(u.id);
        if (pp.professor) {
          setProfFacultyId(pp.professor.facultyId);
          setProfDepartment(pp.professor.department || '');
        }
        setProfAssignments(
          (pp.courses ?? []).map((c) => ({
            course_id: c.id,
            course_name: c.name,
            program: c.program,
            year: c.year,
            activity: c.activity,
          })),
        );
      } catch {
        /* ignore */
      }
    }
    setShowModal(true);
  };

  const [confirmDeactivate, setConfirmDeactivate] = useState<AdminUser | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleDeactivate = (u: AdminUser) => {
    setConfirmDeactivate(u);
  };

  const performDeactivate = async () => {
    if (!confirmDeactivate) return;
    setConfirmLoading(true);
    try {
      await api.deactivateAdminUser(confirmDeactivate.id);
      setConfirmDeactivate(null);
      await load();
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleActivate = async (u: AdminUser) => {
    await api.updateAdminUser(u.id, { is_active: 1 });
    await load();
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    try {
      setSaving(true);
      setError('');
      const profExtras = form.role === 'professor'
        ? {
            facultyId: profFacultyId,
            department: profDepartment || null,
            assignments: profAssignments.map((a) => ({ course_id: a.course_id, activity: a.activity })),
          }
        : {};
      if (editingId) {
        const payload: any = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          role: form.role,
          is_active: form.is_active ? 1 : 0,
          ...profExtras,
        };
        if (form.password) payload.password = form.password;
        await api.updateAdminUser(editingId, payload);
      } else {
        if (!form.password) {
          setError('Parola este obligatorie la creare');
          setSaving(false);
          return;
        }
        if (form.role === 'professor' && !profFacultyId) {
          setError('Selectează facultatea pentru profesor');
          setSaving(false);
          return;
        }
        await api.createAdminUser({ ...form, ...profExtras } as any);
      }
      setShowModal(false);
      await load();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Eroare la salvare');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-7 max-w-[1280px]">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[30px] font-semibold tracking-tight text-neutral-800">
            Utilizatori
          </h1>
          <p className="mt-1.5 text-neutral-500 text-[15px]">
            Gestionează conturile de studenți, profesori și administratori.
          </p>
        </div>
        <Button variant="primary" icon={<PlusIcon />} onClick={openCreate}>
          Adaugă utilizator
        </Button>
      </div>

      <ListFilterBar
        tabs={{
          items: [
            { key: 'all', label: 'Toți', count: counts.all },
            { key: 'student', label: 'Studenți', count: counts.student },
            { key: 'professor', label: 'Profesori', count: counts.professor },
            { key: 'admin', label: 'Administratori', count: counts.admin },
          ],
          value: filter,
          onChange: (v) => setFilter(v as Role),
        }}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Caută după nume sau email...',
        }}
        resultCount={{ current: users.length, total: pagination.total }}
        active={filter !== 'all' || search.trim() !== ''}
        onClearAll={() => {
          setFilter('all');
          setSearch('');
        }}
      />

      {error && (
        <Card tone="danger">
          <p className="text-sm text-danger-fg">{error}</p>
        </Card>
      )}

      {/* Users table */}
      {loading ? (
        <div className="text-center py-12" role="status" aria-busy="true">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600 mx-auto mb-3" aria-hidden="true" />
          <div className="text-neutral-500 text-sm">Se încarcă...</div>
        </div>
      ) : users.length === 0 ? (
        <EmptyState illustration={<IllUsers className="w-full h-full" />} title="Niciun utilizator" description="Modifică filtrele sau adaugă un utilizator nou folosind butonul de mai sus." />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-neutral-25">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Utilizator</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Detalii</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-neutral-25 transition-colors ${i < users.length - 1 ? 'border-b border-neutral-100' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={initialsOf(u)} tone={roleTone(u.role)} size={36} />
                        <div className="text-sm font-medium text-neutral-800">
                          {u.firstName} {u.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <Badge tone={u.role === 'admin' ? 'primary' : u.role === 'professor' ? 'accent' : 'success'}>
                        {u.role === 'admin' ? 'Administrator' : u.role === 'professor' ? 'Profesor' : 'Student'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-500">
                      {u.role === 'student' && u.program_id ? `Anul ${u.year ?? '?'}` : ''}
                      {u.role === 'professor' && u.department ? u.department : ''}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u.is_active ? <Badge tone="success">Activ</Badge> : <Badge tone="neutral">Dezactivat</Badge>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="sm" icon={<PencilIcon />} onClick={() => openEdit(u)}>
                          Editează
                        </Button>
                        {u.is_active ? (
                          <Button variant="ghost" size="sm" icon={<NoSymbolIcon />} onClick={() => handleDeactivate(u)} aria-label="Dezactivează">
                            <span className="sr-only">Dezactivează</span>
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" icon={<CheckCircleIcon />} onClick={() => handleActivate(u)} aria-label="Activează">
                            <span className="sr-only">Activează</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Paginare */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-3 border-t border-neutral-100 flex items-center justify-between text-sm flex-wrap gap-2">
              <span className="text-neutral-500">
                Pagina <strong>{pagination.page}</strong> din <strong>{pagination.totalPages}</strong> ·{' '}
                {pagination.total.toLocaleString('ro-RO')} utilizatori
              </span>
              <div className="inline-flex gap-1">
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2.5 py-1.5 rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40"
                  aria-label="Prima pagină"
                >
                  «
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40"
                >
                  Următor →
                </button>
                <button
                  type="button"
                  onClick={() => setPage(pagination.totalPages)}
                  disabled={page >= pagination.totalPages}
                  className="px-2.5 py-1.5 rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40"
                  aria-label="Ultima pagină"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Modal */}
      <AccessibleModal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editează utilizator' : 'Adaugă utilizator nou'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4 p-1">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prenume" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required />
            <Input label="Nume" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <Select label="Rol" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))}>
            <option value="student">Student</option>
            <option value="professor">Profesor</option>
            <option value="admin">Administrator</option>
          </Select>
          <Input
            label={editingId ? 'Parolă nouă (lasă gol pentru a păstra)' : 'Parolă'}
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required={!editingId}
          />
          {editingId && (
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#7C3AED' }}
              />
              <span className="text-sm text-neutral-800">Cont activ</span>
            </label>
          )}

          {/* ===== Profil profesor: facultate + departament + discipline ===== */}
          {form.role === 'professor' && (
            <div className="mt-2 border-t border-neutral-100 pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-neutral-800">Profil profesor</h3>
                <Badge tone="accent">{profAssignments.length} discipline</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Facultate"
                  value={profFacultyId ?? ''}
                  onChange={(e) => setProfFacultyId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">— alege facultatea —</option>
                  {availableFaculties.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </Select>
                <Input
                  label="Departament"
                  list="dept-list"
                  value={profDepartment}
                  onChange={(e) => setProfDepartment(e.target.value)}
                  placeholder="ex: Informatică Aplicată"
                />
                <datalist id="dept-list">
                  {availableDepartments.map((d) => <option key={d} value={d} />)}
                </datalist>
              </div>

              <div className="text-xs text-neutral-500 leading-snug">
                Asignează profesorul la una sau mai multe <strong>discipline</strong>. Pentru fiecare disciplină alege
                <strong> activitatea</strong> pe care o predă (curs, seminar sau laborator).
              </div>

              {/* Discipline atribuite */}
              {profAssignments.length > 0 && (
                <ul className="flex flex-col gap-1.5 border border-neutral-100 rounded-md p-2 max-h-44 overflow-y-auto">
                  {profAssignments.map((a) => (
                    <li key={a.course_id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 min-w-0 truncate">
                        <strong className="text-neutral-800">{a.course_name}</strong>
                        <span className="text-neutral-500 text-xs ml-1">· {a.program} · an {a.year}</span>
                      </span>
                      <Select
                        value={a.activity}
                        onChange={(e) =>
                          setProfAssignments((prev) =>
                            prev.map((x) =>
                              x.course_id === a.course_id ? { ...x, activity: e.target.value as Activity } : x,
                            ),
                          )
                        }
                        className="!w-28 !py-1 !text-xs"
                      >
                        <option value="curs">Curs</option>
                        <option value="seminar">Seminar</option>
                        <option value="laborator">Laborator</option>
                      </Select>
                      <button
                        type="button"
                        onClick={() =>
                          setProfAssignments((prev) => prev.filter((x) => x.course_id !== a.course_id))
                        }
                        className="p-1 text-neutral-400 hover:text-danger-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded"
                        aria-label="Detașează disciplina"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Adăugare discipline */}
              <details className="border border-neutral-100 rounded-md">
                <summary className="cursor-pointer px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-25 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded-md">
                  + Adaugă discipline
                </summary>
                <div className="p-3 flex flex-col gap-2">
                  <Input
                    prefix={<MagnifyingGlassIcon className="w-4 h-4" />}
                    placeholder="caută disciplină după nume sau program..."
                    value={profCourseSearch}
                    onChange={(e) => setProfCourseSearch(e.target.value)}
                  />
                  <div className="max-h-48 overflow-y-auto border border-neutral-100 rounded">
                    {availableCourses
                      .filter((c) => !profAssignments.find((a) => a.course_id === c.id))
                      .slice(0, 50)
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setProfAssignments((prev) => [
                              ...prev,
                              {
                                course_id: c.id,
                                course_name: c.name,
                                program: c.program,
                                year: c.year,
                                activity: c.activity,
                              },
                            ])
                          }
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent-50 focus:bg-accent-50 border-b border-neutral-100 last:border-b-0 focus:outline-none"
                        >
                          <div className="font-medium text-neutral-800">{c.name}</div>
                          <div className="text-[11px] text-neutral-500">
                            {c.program} · an {c.year} · sem {c.semester} · {c.activity}
                            {c.currentProfessor ? ` · acum: ${c.currentProfessor}` : ''}
                          </div>
                        </button>
                      ))}
                    {availableCourses.length === 0 && (
                      <div className="text-xs text-neutral-400 px-3 py-2">Nicio disciplină disponibilă.</div>
                    )}
                  </div>
                </div>
              </details>
            </div>
          )}

          {error && (
            <div className="text-sm text-danger-fg bg-danger-bg p-2 rounded">{error}</div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Anulează
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {editingId ? 'Salvează' : 'Creează'}
            </Button>
          </div>
        </form>
      </AccessibleModal>

      <ConfirmDialog
        isOpen={confirmDeactivate !== null}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={performDeactivate}
        title="Dezactivează cont"
        message={
          confirmDeactivate
            ? `Dezactivezi contul lui ${confirmDeactivate.firstName} ${confirmDeactivate.lastName}? Utilizatorul nu va mai putea autentifica până când îl reactivezi.`
            : ''
        }
        confirmLabel="Dezactivează"
        loading={confirmLoading}
      />
    </div>
  );
}
