import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Badge, Button, Input } from '../components/ui';
import LikertScale from '../components/LikertScale';
import AccessibleModal from '../components/AccessibleModal';
import { useToast } from '../components/Toast';
import {
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  PlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface PFQuestion {
  id: number;
  text: string;
  type: 'likert' | 'text' | 'choice';
  category: string | null;
  options: string[];
  is_required: boolean;
  response: { likert?: number; text?: string; choice?: string } | null;
}

const STATUS_META: Record<string, { label: string; tone: 'warning' | 'info' | 'success' | 'neutral' }> = {
  open: { label: 'Deschis', tone: 'warning' },
  in_progress: { label: 'În analiză', tone: 'info' },
  answered: { label: 'Cu răspuns', tone: 'success' },
  closed: { label: 'Închis', tone: 'neutral' },
};

export default function PlatformFeedback() {
  const toast = useToast();
  const [questions, setQuestions] = useState<PFQuestion[]>([]);
  const [responses, setResponses] = useState<Record<number, { likert?: number; text?: string; choice?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [lastSubmittedCount, setLastSubmittedCount] = useState(0);
  const [myMessages, setMyMessages] = useState<any[]>([]);
  const [showNewMessage, setShowNewMessage] = useState(false);
  // Numărul EXACT de submisii anterioare ale userului (din DB) — crește după fiecare trimitere.
  const [submissionCount, setSubmissionCount] = useState(0);
  const [formExpanded, setFormExpanded] = useState(false);
  // Istoric submisii (listă + detaliu pentru modal)
  const [history, setHistory] = useState<Array<{ id: number; submitted_at: string; responseCount: number }>>([]);
  const [viewingSubmission, setViewingSubmission] = useState<null | {
    submission: { id: number; submittedAt: string };
    items: Array<any>;
  }>(null);
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const loadMessages = () => {
    api.listMyPlatformFeedbackMessages().then((d) => setMyMessages(d.messages || []));
  };

  useEffect(() => {
    Promise.all([api.getPlatformFeedbackQuestions(), api.listMyPlatformFeedbackSubmissions()])
      .then(([d, hist]) => {
        setQuestions(d.questions);
        setResponses({}); // FORMULAR CURAT — niciodată pre-completat cu trecut
        setSubmissionCount(d.submissionCount);
        setHistory(hist.submissions);
        // dacă există cel puțin o submisie → ascunde formularul, arată CTA
        setFormExpanded(d.submissionCount === 0);
      })
      .catch((e) => setError(e.response?.data?.error || 'Eroare la încărcare'))
      .finally(() => setLoading(false));
    loadMessages();
  }, []);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(responses).map(([qid, v]) => ({
        questionId: Number(qid),
        likert: v.likert,
        text: v.text,
        choice: v.choice,
      }));
      const submitResult = await api.submitPlatformFeedback(payload);
      toast.push({
        tone: 'success',
        title: 'Mulțumim pentru feedback!',
        desc: 'Răspunsurile tale au fost transmise echipei platformei.',
      });
      setLastSubmittedCount(submitResult.count);
      setSubmittedAt(new Date());
      setSubmissionCount(submitResult.submissionCount);
      setFormExpanded(false);
      setResponses({}); // resetez formularul după trimitere
      // reîncarc istoricul ca să vadă noua submisie
      api.listMyPlatformFeedbackSubmissions().then((h) => setHistory(h.submissions));
      // scroll spre top ca să vadă imediat confirmarea
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      const errMsg = e.response?.data?.error || 'Eroare la salvare';
      toast.push({ tone: 'error', title: 'Eroare la trimitere', desc: errMsg });
      setError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetForNewSubmission = () => {
    setSubmittedAt(null);
    setError('');
    setFormExpanded(true);
    setResponses({}); // formular curat la fiecare reluare
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openSubmission = async (id: number) => {
    try {
      const d = await api.getMyPlatformFeedbackSubmission(id);
      setViewingSubmission(d);
    } catch (e: any) {
      toast.push({ tone: 'error', title: 'Eroare', desc: 'Nu pot încărca submisia.' });
    }
  };

  const handleSendNewMessage = async () => {
    if (!newMessage.trim()) {
      toast.push({ tone: 'warning', title: 'Mesaj gol', desc: 'Scrie un mesaj înainte de a-l trimite.' });
      return;
    }
    setSendingMessage(true);
    try {
      await api.createPlatformFeedbackMessage({
        subject: newMessageSubject.trim() || undefined,
        message: newMessage.trim(),
      });
      toast.push({
        tone: 'success',
        title: 'Mesaj transmis',
        desc: 'Administratorul îți va răspunde aici în secțiunea „Mesajele mele".',
      });
      setNewMessage('');
      setNewMessageSubject('');
      setShowNewMessage(false);
      loadMessages();
    } catch (e: any) {
      toast.push({
        tone: 'error',
        title: 'Eroare',
        desc: e.response?.data?.error || 'Mesajul nu a putut fi transmis.',
      });
    } finally {
      setSendingMessage(false);
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
    <div className="flex flex-col gap-7 max-w-[860px]">
      <div>
        <h1 className="font-display text-2xl md:text-[30px] font-semibold tracking-tight text-neutral-800 flex items-center gap-3">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-accent-600" aria-hidden="true" />
          Feedback despre platformă
        </h1>
        <p className="mt-1.5 text-neutral-500 text-sm md:text-[15px]">
          Ne ajuți să îmbunătățim platforma — răspunsurile tale sunt agregate anonim și ne ghidează în deciziile de produs.
        </p>
      </div>

      {error && (
        <Card tone="danger">
          <p className="text-sm text-danger-fg">{error}</p>
        </Card>
      )}

      {/* Ecran de confirmare — afișat după submit cu succes */}
      {submittedAt && (
        <Card
          tone="success"
          className="border-2"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--ecd-success-bg)' }}
            >
              <CheckCircleIcon className="w-12 h-12 text-success-fg" aria-hidden="true" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-success-fg">
              Feedbackul a fost trimis cu succes!
            </h2>
            <p className="text-sm text-neutral-700 max-w-[520px]">
              Mulțumim! Răspunsurile tale ({lastSubmittedCount} din {questions.length} întrebări) au
              fost înregistrate la <strong>{submittedAt.toLocaleString('ro-RO')}</strong>.
              Aceasta este evaluarea ta cu numărul <strong>{submissionCount}</strong>.
              Echipa platformei le va analiza ca parte din decizia de produs.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <Button
                variant="primary"
                icon={<PaperAirplaneIcon />}
                onClick={handleResetForNewSubmission}
              >
                Trimite din nou feedback
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  // Ascund mai întâi card-ul de confirmare ca să fie vizibilă lista de mesaje
                  setSubmittedAt(null);
                  // Apoi scroll smooth către secțiunea de mesaje, cu un mic delay ca DOM-ul să re-render-eze
                  setTimeout(() => {
                    const el = document.getElementById('my-messages-heading');
                    if (el) {
                      const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
                      window.scrollTo({ top, behavior: 'smooth' });
                    }
                  }, 100);
                }}
              >
                Vezi mesajele tale către admin
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Card-colaps când userul a mai trimis feedback înainte */}
      {!submittedAt && submissionCount > 0 && !formExpanded && questions.length > 0 && (
        <Card tone="info" className="border-2">
          <div className="flex flex-col items-center text-center gap-3 py-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'var(--ecd-info-bg, #DBEAFE)' }}
            >
              <CheckCircleIcon className="w-10 h-10 text-info" aria-hidden="true" />
            </div>
            <h2 className="font-display text-xl font-semibold text-neutral-800">
              Ai trimis deja {submissionCount}{' '}
              {submissionCount === 1 ? 'evaluare de feedback' : 'evaluări de feedback'}
            </h2>
            <p className="text-sm text-neutral-600 max-w-[520px]">
              Dorești să mai transmiți ceva? Poți să trimiți o evaluare nouă (formular curat),
              să trimiți un mesaj liber către admin sau să vezi istoricul evaluărilor anterioare.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              <Button
                variant="primary"
                icon={<PaperAirplaneIcon />}
                onClick={() => {
                  setResponses({});
                  setFormExpanded(true);
                  setTimeout(() => {
                    const el = document.querySelector('[data-pf-form-start]');
                    if (el) {
                      const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
                      window.scrollTo({ top, behavior: 'smooth' });
                    }
                  }, 80);
                }}
              >
                Trimite o evaluare nouă
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNewMessage(true);
                  setTimeout(() => {
                    const el = document.getElementById('my-messages-heading');
                    if (el) {
                      const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
                      window.scrollTo({ top, behavior: 'smooth' });
                    }
                  }, 80);
                }}
              >
                Trimite un mesaj liber
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Istoric submisii — vizibil când există cel puțin una */}
      {!submittedAt && submissionCount > 0 && history.length > 0 && (
        <section aria-labelledby="pf-history-heading">
          <h2 id="pf-history-heading" className="text-lg font-semibold text-neutral-800 mb-3">
            Istoricul evaluărilor tale
          </h2>
          <Card padding="none" className="overflow-hidden">
            {history.map((h, i) => (
              <button
                key={h.id}
                type="button"
                onClick={() => openSubmission(h.id)}
                className={`w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-neutral-25 focus:bg-neutral-25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 ${
                  i < history.length - 1 ? 'border-b border-neutral-100' : ''
                }`}
              >
                <Badge tone="neutral">#{history.length - i}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-neutral-800">
                    Evaluare din {new Date(h.submitted_at).toLocaleString('ro-RO')}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {h.responseCount} {h.responseCount === 1 ? 'răspuns' : 'răspunsuri'}
                  </div>
                </div>
                <span className="text-xs text-accent-700 font-medium">Vezi →</span>
              </button>
            ))}
          </Card>
        </section>
      )}

      {/* Lista de întrebări — ascunsă cât timp afișăm confirmarea SAU card-colaps */}
      {!submittedAt && formExpanded && (questions.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-500">Nu există întrebări de feedback active momentan.</p>
        </Card>
      ) : (
        <div data-pf-form-start>
        {questions.map((q, i) => (
          <Card key={q.id}>
            <div className="flex items-start gap-3 mb-4">
              <Badge tone="neutral">{i + 1}</Badge>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-neutral-800">
                  {q.text}
                  {q.is_required && <span className="text-danger ml-1">*</span>}
                </h3>
                {q.category && <p className="text-xs text-neutral-400 mt-0.5">categorie: {q.category}</p>}
              </div>
            </div>

            {q.type === 'likert' && (
              <LikertScale
                questionId={q.id}
                questionText={q.text}
                value={responses[q.id]?.likert}
                onChange={(v) =>
                  setResponses((r) => ({ ...r, [q.id]: { ...r[q.id], likert: v } }))
                }
                isRequired={q.is_required}
              />
            )}
            {q.type === 'text' && (
              <textarea
                value={responses[q.id]?.text || ''}
                onChange={(e) =>
                  setResponses((r) => ({ ...r, [q.id]: { ...r[q.id], text: e.target.value } }))
                }
                rows={4}
                placeholder="Răspunsul tău..."
                className="w-full p-3 text-sm rounded-md border border-neutral-200 shadow-elev-1 focus:outline-none focus:ring-[3px] focus:ring-accent-400/30 focus:border-accent-400"
              />
            )}
            {q.type === 'choice' && q.options.length > 0 && (
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700">
                    <input
                      type="radio"
                      name={`choice-${q.id}`}
                      value={opt}
                      checked={responses[q.id]?.choice === opt}
                      onChange={(e) =>
                        setResponses((r) => ({ ...r, [q.id]: { ...r[q.id], choice: e.target.value } }))
                      }
                      style={{ accentColor: '#7C3AED' }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
          </Card>
        ))}
        </div>
      ))}

      {!submittedAt && formExpanded && questions.length > 0 && (
        <div className="flex justify-end gap-2">
          {submissionCount > 0 && (
            <Button
              variant="secondary"
              onClick={() => {
                setResponses({});
                setFormExpanded(false);
              }}
            >
              Renunță
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            loading={saving}
            onClick={handleSubmit}
            icon={<PaperAirplaneIcon />}
          >
            Trimite feedback
          </Button>
        </div>
      )}

      {/* Separator vizual */}
      <div className="border-t border-neutral-100 my-4" />

      {/* Free-form messages — istoric + nou */}
      <section aria-labelledby="my-messages-heading">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2
              id="my-messages-heading"
              className="font-display text-[22px] font-semibold tracking-tight text-neutral-800"
            >
              Mesajele mele către administrator
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Mesaje libere, idei, probleme — fiecare primește răspuns direct de la admin.
            </p>
          </div>
          <Button
            variant="accent"
            size="md"
            icon={<PlusIcon />}
            onClick={() => setShowNewMessage((v) => !v)}
            aria-expanded={showNewMessage}
          >
            {showNewMessage ? 'Anulează' : myMessages.length > 0 ? 'Mai trimite un mesaj' : 'Trimite primul mesaj'}
          </Button>
        </div>

        {showNewMessage && (
          <Card className="mb-4">
            <div className="flex flex-col gap-3">
              <Input
                label="Subiect (opțional)"
                placeholder="Ex: Sugestie pentru filtrul de evaluări"
                value={newMessageSubject}
                onChange={(e) => setNewMessageSubject(e.target.value)}
              />
              <div>
                <label htmlFor="pf-new-message" className="text-[13px] font-medium text-neutral-700 block mb-1.5">
                  Mesajul tău <span className="text-danger">*</span>
                </label>
                <textarea
                  id="pf-new-message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={5}
                  maxLength={4000}
                  placeholder="Descrie pe scurt observația, ideea sau problema..."
                  className="w-full p-3 text-sm rounded-md border border-neutral-200 shadow-elev-1 focus:outline-none focus:ring-[3px] focus:ring-accent-400/30 focus:border-accent-400"
                />
                <div className="text-[11px] text-neutral-400 text-right mt-1">{newMessage.length} / 4000</div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowNewMessage(false)}>
                  Renunță
                </Button>
                <Button
                  variant="primary"
                  loading={sendingMessage}
                  icon={<PaperAirplaneIcon />}
                  onClick={handleSendNewMessage}
                >
                  Trimite mesajul
                </Button>
              </div>
            </div>
          </Card>
        )}

        {myMessages.length === 0 ? (
          <Card>
            <p className="text-sm text-neutral-500">
              Nu ai transmis încă niciun mesaj liber. Apasă pe „Trimite primul mesaj" pentru a începe un dialog cu administratorul.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {myMessages.map((m) => {
              const sm = STATUS_META[m.status] ?? STATUS_META.open;
              return (
                <li key={m.id}>
                  <Card>
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                      <div className="flex-1 min-w-0">
                        {m.subject && (
                          <h3 className="text-base font-semibold text-neutral-800">{m.subject}</h3>
                        )}
                        <p className="text-[12px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5" aria-hidden="true" />
                          Trimis {new Date(m.created_at).toLocaleString('ro-RO')}
                        </p>
                      </div>
                      <Badge tone={sm.tone}>{sm.label}</Badge>
                    </div>
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap mb-3">{m.message}</p>

                    {m.admin_response ? (
                      <div className="border-t border-neutral-100 pt-3 mt-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-success-fg mb-1.5">
                          <CheckCircleIcon className="w-4 h-4" aria-hidden="true" />
                          Răspuns administrator
                          {m.admin_first_name && (
                            <span className="text-neutral-400 font-normal">
                              · {m.admin_first_name} {m.admin_last_name}
                            </span>
                          )}
                          {m.admin_response_at && (
                            <span className="text-neutral-400 font-normal">
                              · {new Date(m.admin_response_at).toLocaleString('ro-RO')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-700 whitespace-pre-wrap bg-neutral-25 rounded-md p-3">
                          {m.admin_response}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 italic">
                        Aștept răspuns de la administrator...
                      </p>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Modal vizualizare submisie anterioară (READ-ONLY) */}
      <AccessibleModal
        isOpen={viewingSubmission !== null}
        onClose={() => setViewingSubmission(null)}
        title={
          viewingSubmission
            ? `Evaluare din ${new Date(viewingSubmission.submission.submittedAt).toLocaleString('ro-RO')}`
            : ''
        }
      >
        {viewingSubmission && (
          <div className="flex flex-col gap-4 p-1 max-h-[70vh] overflow-y-auto">
            {viewingSubmission.items.length === 0 ? (
              <p className="text-sm text-neutral-500">Această submisie nu conține răspunsuri.</p>
            ) : (
              viewingSubmission.items.map((it, idx) => (
                <Card key={it.questionId} padding="md">
                  <div className="flex items-start gap-3 mb-2">
                    <Badge tone="neutral">{idx + 1}</Badge>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-800">{it.text}</p>
                      {it.category && (
                        <p className="text-[11px] text-neutral-400 mt-0.5">categorie: {it.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-neutral-700 pl-1">
                    {it.type === 'likert' && it.response.likert != null && (
                      <Badge tone="accent">Scor: {it.response.likert} / 5</Badge>
                    )}
                    {it.type === 'text' && it.response.text && (
                      <p className="whitespace-pre-wrap bg-neutral-25 rounded-md p-2">
                        {it.response.text}
                      </p>
                    )}
                    {it.type === 'choice' && it.response.choice && (
                      <Badge tone="info">{it.response.choice}</Badge>
                    )}
                    {!it.response.likert && !it.response.text && !it.response.choice && (
                      <span className="text-neutral-400 italic text-xs">— fără răspuns —</span>
                    )}
                  </div>
                </Card>
              ))
            )}
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewingSubmission(null)}>
                Închide
              </Button>
            </div>
          </div>
        )}
      </AccessibleModal>
    </div>
  );
}
