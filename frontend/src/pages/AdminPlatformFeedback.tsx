import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Badge, Button, Input, Select, Tabs, TabPanel, EmptyState } from '../components/ui';
import AccessibleModal from '../components/AccessibleModal';
import { PlusIcon, PencilIcon, TrashIcon, ChartBarIcon, ChatBubbleLeftRightIcon, InboxIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useToast } from '../components/Toast';

interface PFQuestionAdmin {
  id: number;
  text: string;
  type: 'likert' | 'text' | 'choice';
  category: string | null;
  options_json: string | null;
  order_index: number;
  is_required: number;
  target_roles: string;
  is_active: number;
}

const emptyForm = {
  text: '',
  type: 'likert' as 'likert' | 'text' | 'choice',
  category: '',
  options_json: '',
  order_index: 99,
  is_required: false,
  target_roles: 'student,professor',
  is_active: true,
};

const COLORS = ['#EF4444', '#F59E0B', '#8A92A3', '#10B981', '#0E2233'];

// Categorii standardizate pentru chestionarul de feedback al platformei,
// conform migration 011-platform-feedback.sql. Folosite la agregarea în rapoarte.
const PF_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'usability',   label: 'Usability — ușurința de utilizare' },
  { value: 'content',     label: 'Content — relevanța conținutului' },
  { value: 'design',      label: 'Design — aspect și ergonomie' },
  { value: 'suggestions', label: 'Suggestions — sugestii de îmbunătățire' },
  { value: 'praise',      label: 'Praise — feedback pozitiv' },
];

const MESSAGE_STATUS_META: Record<string, { label: string; tone: 'warning' | 'info' | 'success' | 'neutral' }> = {
  open: { label: 'Deschis', tone: 'warning' },
  in_progress: { label: 'În analiză', tone: 'info' },
  answered: { label: 'Cu răspuns', tone: 'success' },
  closed: { label: 'Închis', tone: 'neutral' },
};

export default function AdminPlatformFeedback() {
  const toast = useToast();
  const [tabIdx, setTabIdx] = useState(0);
  const [questions, setQuestions] = useState<PFQuestionAdmin[]>([]);
  const [report, setReport] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'answered' | 'in_progress' | 'closed'>('answered');
  const [replying, setReplying] = useState(false);

  const loadMessages = async () => {
    const r = await api.adminListPlatformFeedbackMessages(
      statusFilter !== 'all' ? { status: statusFilter } : undefined,
    );
    setMessages(r.messages || []);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [q, r] = await Promise.all([
        api.adminListPlatformFeedbackQuestions(),
        api.adminPlatformFeedbackReport(),
      ]);
      setQuestions(q.questions);
      setReport(r);
      await loadMessages();
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { loadMessages(); }, [statusFilter]);

  const openReply = (m: any) => {
    setReplyTo(m);
    setReplyText(m.admin_response || '');
    setReplyStatus((m.admin_response ? 'answered' : 'in_progress') as any);
  };

  const handleReply = async () => {
    if (!replyTo || !replyText.trim()) {
      toast.push({ tone: 'warning', title: 'Răspuns gol', desc: 'Scrie un răspuns înainte de a transmite.' });
      return;
    }
    setReplying(true);
    try {
      await api.adminRespondPlatformFeedbackMessage(replyTo.id, replyText.trim(), replyStatus);
      toast.push({
        tone: 'success',
        title: 'Răspuns trimis',
        desc: 'Utilizatorul va vedea răspunsul în secțiunea „Mesajele mele".',
      });
      setReplyTo(null);
      setReplyText('');
      await loadMessages();
    } catch (e: any) {
      toast.push({
        tone: 'error',
        title: 'Eroare',
        desc: e.response?.data?.error || 'Răspunsul nu a putut fi trimis.',
      });
    } finally {
      setReplying(false);
    }
  };

  const handleQuickStatus = async (m: any, status: 'open' | 'in_progress' | 'closed') => {
    try {
      await api.adminUpdatePlatformFeedbackMessageStatus(m.id, status);
      await loadMessages();
      toast.push({ tone: 'info', title: 'Status actualizat', desc: `Mesaj #${m.id} → ${MESSAGE_STATUS_META[status]?.label || status}` });
    } catch (e: any) {
      toast.push({ tone: 'error', title: 'Eroare', desc: e.response?.data?.error || 'Nu s-a putut actualiza.' });
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };
  const openEdit = (q: PFQuestionAdmin) => {
    setEditingId(q.id);
    setForm({
      text: q.text,
      type: q.type,
      category: q.category || '',
      options_json: q.options_json || '',
      order_index: q.order_index,
      is_required: !!q.is_required,
      target_roles: q.target_roles || 'student,professor',
      is_active: !!q.is_active,
    });
    setShowModal(true);
  };
  const handleDelete = async (id: number) => {
    if (!confirm('Ștergi întrebarea? Răspunsurile vor fi șterse.')) return;
    await api.adminDeletePlatformFeedbackQuestion(id);
    await load();
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let options: string[] | undefined;
      if (form.type === 'choice') {
        try { options = JSON.parse(form.options_json); } catch { options = form.options_json.split(',').map((s) => s.trim()).filter(Boolean); }
      }
      const payload: any = { ...form, options };
      delete payload.options_json;
      if (editingId) await api.adminUpdatePlatformFeedbackQuestion(editingId, payload);
      else await api.adminCreatePlatformFeedbackQuestion(payload);
      setShowModal(false);
      await load();
    } finally { setSaving(false); }
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
            Feedback despre platformă
          </h1>
          <p className="mt-1.5 text-neutral-500 text-sm md:text-[15px]">
            Chestionar separat de evaluarea profesorilor — pentru a colecta feedback despre platforma însăși.
          </p>
        </div>
      </div>

      <Tabs
        ariaLabel="Tabs feedback"
        tabs={[
          { id: 'editor', label: 'Editor întrebări', icon: <PencilIcon className="w-4 h-4" /> },
          { id: 'report', label: 'Rapoarte & insights', icon: <ChartBarIcon className="w-4 h-4" /> },
          {
            id: 'messages',
            label: `Mesaje (${messages.filter((m: any) => m.status === 'open').length})`,
            icon: <InboxIcon className="w-4 h-4" />,
          },
        ]}
        selectedIndex={tabIdx}
        onChange={setTabIdx}
      >
        {/* TAB 1: Editor */}
        <TabPanel>
          <div className="flex justify-end mb-4">
            <Button variant="primary" icon={<PlusIcon />} onClick={openCreate}>Adaugă întrebare</Button>
          </div>
          {questions.length === 0 ? (
            <EmptyState icon={<ChatBubbleLeftRightIcon className="w-7 h-7" />} title="Nicio întrebare" />
          ) : (
            <Card padding="none" className="overflow-hidden">
              {questions.map((q, i) => (
                <div key={q.id} className={`px-6 py-4 flex items-center gap-4 ${i < questions.length - 1 ? 'border-b border-neutral-100' : ''}`}>
                  <Badge tone="neutral">#{q.order_index}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-neutral-800">{q.text}</h3>
                      <Badge tone="accent">{q.type}</Badge>
                      {q.category && <Badge tone="neutral">{q.category}</Badge>}
                      {q.is_required ? <Badge tone="warning">Obligatoriu</Badge> : null}
                      {!q.is_active && <Badge tone="neutral">Inactiv</Badge>}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Pentru: {q.target_roles}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" icon={<PencilIcon />} onClick={() => openEdit(q)}>Editează</Button>
                    <Button variant="ghost" size="sm" icon={<TrashIcon />} onClick={() => handleDelete(q.id)} aria-label="Șterge">
                      <span className="sr-only">Șterge</span>
                    </Button>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </TabPanel>

        {/* TAB 2: Reports */}
        <TabPanel>
          {!report || report.report.length === 0 ? (
            <EmptyState icon={<ChartBarIcon className="w-7 h-7" />} title="Niciun răspuns încă" description="Va apărea după ce utilizatorii vor completa chestionarul." />
          ) : (
            <div className="flex flex-col gap-6">
              <Card tone="info">
                <p className="text-sm text-info-fg">
                  <strong>{report.total_respondents}</strong> respondenți unici au completat cel puțin o întrebare.
                </p>
              </Card>
              {report.report.map((r: any) => (
                <Card key={r.question_id}>
                  <div className="mb-3 flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-800">{r.text}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge tone="accent">{r.type}</Badge>
                        {r.category && <Badge tone="neutral">{r.category}</Badge>}
                      </div>
                    </div>
                    <Badge tone="primary">{r.total_responses} răspunsuri</Badge>
                  </div>

                  {r.type === 'likert' && r.total_responses > 0 && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={r.distribution}>
                            <XAxis dataKey="score" tick={{ fontSize: 12, fill: '#5F6878' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#5F6878' }} />
                            <Tooltip />
                            <Bar dataKey="count" name="Răspunsuri">
                              {r.distribution.map((_: any, idx: number) => (
                                <Cell key={idx} fill={COLORS[idx]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={r.distribution.filter((d: any) => d.count > 0)}
                              dataKey="count"
                              nameKey="score"
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              label={(entry: any) => `${entry.score}: ${entry.count}`}
                            >
                              {r.distribution.map((_: any, idx: number) => (
                                <Cell key={idx} fill={COLORS[idx]} />
                              ))}
                            </Pie>
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <span className="text-xs text-neutral-500 uppercase">Medie</span>
                          <div className="font-display text-2xl font-semibold text-neutral-800">{r.average?.toFixed(2)}</div>
                        </div>
                        <div className="flex-1 text-sm text-neutral-700 italic">{r.interpretation}</div>
                      </div>
                    </>
                  )}

                  {r.type === 'text' && r.recent_responses?.length > 0 && (
                    <div className="space-y-2">
                      {r.recent_responses.slice(0, 5).map((rr: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-md bg-neutral-25 border border-neutral-100">
                          <p className="text-sm text-neutral-700 leading-relaxed">„{rr.response_text}"</p>
                          <p className="text-xs text-neutral-400 mt-1">{new Date(rr.submitted_at).toLocaleDateString('ro-RO')}</p>
                        </div>
                      ))}
                      {r.recent_responses.length > 5 && (
                        <p className="text-xs text-neutral-500">+ încă {r.recent_responses.length - 5} răspunsuri</p>
                      )}
                    </div>
                  )}

                  {r.type === 'choice' && r.distribution?.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={r.distribution} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis dataKey="choice" type="category" tick={{ fontSize: 11 }} width={140} />
                        <Tooltip />
                        <Bar dataKey="n" fill="#7C3AED" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabPanel>

        {/* TAB 3: Messages cu closing-loop */}
        <TabPanel>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <p className="text-sm text-neutral-500 max-w-[640px]">
              Mesaje libere transmise de studenți și profesori. Răspunsul aici face „closing the loop":
              utilizatorul îl vede în secțiunea sa de feedback.
            </p>
            <Select
              label="Filtrează"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              wrapperClassName="min-w-[180px]"
            >
              <option value="all">Toate</option>
              <option value="open">Deschise</option>
              <option value="in_progress">În analiză</option>
              <option value="answered">Cu răspuns</option>
              <option value="closed">Închise</option>
            </Select>
          </div>

          {messages.length === 0 ? (
            <EmptyState
              icon={<InboxIcon className="w-7 h-7" />}
              title="Niciun mesaj"
              description="Mesajele transmise de utilizatori vor apărea aici."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {messages.map((m: any) => {
                const sm = MESSAGE_STATUS_META[m.status] ?? MESSAGE_STATUS_META.open;
                const isReplying = replyTo?.id === m.id;
                return (
                  <li key={m.id}>
                    <Card>
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {m.subject && (
                              <h3 className="text-base font-semibold text-neutral-800">{m.subject}</h3>
                            )}
                            <Badge tone={sm.tone}>{sm.label}</Badge>
                            <Badge tone="neutral">{m.user_role}</Badge>
                            <span className="text-xs text-neutral-500">
                              {m.user_first_name} {m.user_last_name} · {m.user_email}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400">
                            Trimis {new Date(m.created_at).toLocaleString('ro-RO')}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap bg-neutral-25 rounded-md p-3 mb-3">
                        {m.message}
                      </p>

                      {m.admin_response && (
                        <div className="border-l-2 border-success pl-3 mb-3">
                          <p className="text-xs font-semibold text-success-fg mb-1">
                            Răspuns trimis
                            {m.admin_response_at && ` · ${new Date(m.admin_response_at).toLocaleString('ro-RO')}`}
                          </p>
                          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{m.admin_response}</p>
                        </div>
                      )}

                      {!isReplying && (
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="primary" size="sm" icon={<PaperAirplaneIcon />} onClick={() => openReply(m)}>
                            {m.admin_response ? 'Editează răspunsul' : 'Răspunde'}
                          </Button>
                          {m.status !== 'in_progress' && (
                            <Button variant="ghost" size="sm" onClick={() => handleQuickStatus(m, 'in_progress')}>
                              Marchează în analiză
                            </Button>
                          )}
                          {m.status !== 'closed' && (
                            <Button variant="ghost" size="sm" onClick={() => handleQuickStatus(m, 'closed')}>
                              Închide
                            </Button>
                          )}
                        </div>
                      )}

                      {isReplying && (
                        <div className="border-t border-neutral-100 pt-3 mt-2 flex flex-col gap-3">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={4}
                            placeholder="Scrie răspunsul tău aici..."
                            className="w-full p-3 text-sm rounded-md border border-neutral-200 shadow-elev-1 focus:outline-none focus:ring-[3px] focus:ring-accent-400/30 focus:border-accent-400"
                          />
                          <div className="flex flex-wrap items-center gap-3">
                            <Select
                              label="Status la trimitere"
                              value={replyStatus}
                              onChange={(e) => setReplyStatus(e.target.value as any)}
                              wrapperClassName="min-w-[200px]"
                            >
                              <option value="answered">Cu răspuns</option>
                              <option value="in_progress">În analiză</option>
                              <option value="closed">Închis</option>
                            </Select>
                            <div className="flex gap-2 ml-auto">
                              <Button variant="secondary" onClick={() => setReplyTo(null)}>
                                Anulează
                              </Button>
                              <Button
                                variant="primary"
                                loading={replying}
                                icon={<PaperAirplaneIcon />}
                                onClick={handleReply}
                              >
                                Trimite răspunsul
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </TabPanel>
      </Tabs>

      <AccessibleModal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editează întrebare' : 'Adaugă întrebare'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4 p-1">
          <Input label="Text întrebare" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tip" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
              <option value="likert">Likert (1-5)</option>
              <option value="text">Text liber</option>
              <option value="choice">Multi-choice</option>
            </Select>
            <Select
              label="Categorie"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              hint="Categorie standardizată — agregă răspunsurile în rapoarte."
            >
              <option value="">Selectează o categorie...</option>
              {PF_CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          {form.type === 'choice' && (
            <Input
              label="Opțiuni (separate prin virgulă)"
              value={form.options_json}
              onChange={(e) => setForm({ ...form, options_json: e.target.value })}
              hint='Ex: "Foarte ușor, Ușor, Mediu, Greu, Foarte greu"'
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ordine" type="number" value={String(form.order_index)} onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) || 0 })} />
            <Select label="Roluri vizate" value={form.target_roles} onChange={(e) => setForm({ ...form, target_roles: e.target.value })}>
              <option value="student,professor">Studenți + Profesori</option>
              <option value="student">Doar studenți</option>
              <option value="professor">Doar profesori</option>
              <option value="student,professor,admin">Toate (incl. admin)</option>
            </Select>
          </div>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_required} onChange={(e) => setForm({ ...form, is_required: e.target.checked })} style={{ accentColor: '#7C3AED' }} />
              <span className="text-sm">Obligatoriu</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} style={{ accentColor: '#7C3AED' }} />
              <span className="text-sm">Activ</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Anulează</Button>
            <Button variant="primary" type="submit" loading={saving}>{editingId ? 'Salvează' : 'Creează'}</Button>
          </div>
        </form>
      </AccessibleModal>
    </div>
  );
}
