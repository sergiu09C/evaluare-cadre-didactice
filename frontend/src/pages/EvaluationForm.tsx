import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Evaluation, Question, EvaluationResponse } from '../types';
import { ConfirmDialog, AlertDialog } from '../components/AccessibleModal';
import ScreenReaderOnly from '../components/ScreenReaderOnly';
import LikertScale, { LIKERT_OPTIONS } from '../components/LikertScale';
import AchievementUnlock from '../components/AchievementUnlock';
import { Button, Card, Badge, Progress } from '../components/ui';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CheckCircleIcon,
  LockClosedIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';

export default function EvaluationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<number, EvaluationResponse>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [savedAgoSec, setSavedAgoSec] = useState<number | null>(null);

  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showMissingRequired, setShowMissingRequired] = useState(false);
  const [missingCount, setMissingCount] = useState(0);
  const [showSaveError, setShowSaveError] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<{ title: string; description: string } | null>(null);
  const [showSubmitError, setShowSubmitError] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  const isReadOnly = evaluation?.status === 'submitted';

  useEffect(() => {
    if (id) loadEvaluation();
  }, [id]);

  // Auto-save every 30s
  useEffect(() => {
    if (isReadOnly || !evaluation || Object.keys(responses).length === 0) return;
    const timer = setInterval(() => handleSave(true), 30000);
    return () => clearInterval(timer);
  }, [responses, isReadOnly, evaluation]);

  // Ticker for "saved Xs ago"
  useEffect(() => {
    if (savedAgoSec == null) return;
    const t = setInterval(() => setSavedAgoSec((s) => (s == null ? null : s + 1)), 1000);
    return () => clearInterval(t);
  }, [savedAgoSec]);

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      const data = await api.getEvaluation(parseInt(id!));
      setEvaluation(data.evaluation);
      setQuestions(data.questions);

      const existingResponses: Record<number, EvaluationResponse> = {};
      data.questions.forEach((q) => {
        if (q.response) {
          existingResponses[q.id] = {
            questionId: q.id,
            likert: q.response.likert,
            text: q.response.text,
          };
        }
      });
      setResponses(existingResponses);

      // Resume on first unanswered question
      const firstUnansweredIdx = data.questions.findIndex((q) => {
        const r = existingResponses[q.id];
        if (q.type === 'likert') return !r?.likert;
        return !r?.text;
      });
      if (firstUnansweredIdx >= 0) setCurrentIndex(firstUnansweredIdx);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare la încărcarea evaluării');
      setErrorReason(err.response?.data?.reason || null);
    } finally {
      setLoading(false);
    }
  };

  const total = questions.length;
  const currentQ = questions[currentIndex];
  const currentValue = currentQ ? responses[currentQ.id]?.likert : undefined;
  const currentText = currentQ ? responses[currentQ.id]?.text || '' : '';

  const completedCount = useMemo(
    () =>
      questions.reduce((acc, q) => {
        const r = responses[q.id];
        if (q.type === 'likert' && r?.likert) return acc + 1;
        if (q.type === 'text' && r?.text) return acc + 1;
        return acc;
      }, 0),
    [questions, responses],
  );

  const handleLikertChange = (value: number) => {
    if (!currentQ) return;
    setResponses((prev) => ({
      ...prev,
      [currentQ.id]: { ...prev[currentQ.id], questionId: currentQ.id, likert: value },
    }));
  };

  const handleTextChange = (value: string) => {
    if (!currentQ) return;
    setResponses((prev) => ({
      ...prev,
      [currentQ.id]: { ...prev[currentQ.id], questionId: currentQ.id, text: value },
    }));
  };

  const handleSave = async (isAutoSave = false) => {
    if (isReadOnly) return;
    try {
      setSaving(true);
      const responsesArray = Object.values(responses);
      if (responsesArray.length > 0) {
        await api.saveResponses(parseInt(id!), responsesArray);
        setSavedAgoSec(0);
      }
    } catch (err: any) {
      if (!isAutoSave) {
        setDialogMessage(err.response?.data?.error || 'Eroare la salvarea răspunsurilor');
        setShowSaveError(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const unansweredRequired = questions.filter(
      (q) =>
        q.isRequired &&
        (!responses[q.id] ||
          (q.type === 'likert' && !responses[q.id].likert) ||
          (q.type === 'text' && !responses[q.id].text)),
    );
    if (unansweredRequired.length > 0) {
      setMissingCount(unansweredRequired.length);
      setShowMissingRequired(true);
      return;
    }
    setShowConfirmSubmit(true);
  };

  const confirmSubmit = async () => {
    try {
      setSubmitting(true);
      // Snapshot achievements înainte
      let before: Set<number> = new Set();
      try {
        const b = await api.getDynamicAchievements();
        before = new Set(b.achievements.filter((a) => a.earned).map((a) => a.id));
      } catch {}

      await handleSave();
      await api.submitEvaluation(parseInt(id!));

      // Snapshot achievements după
      try {
        const a = await api.getDynamicAchievements();
        const newly = a.achievements.find((x) => x.earned && !before.has(x.id));
        if (newly) {
          setUnlockedAchievement({ title: newly.title, description: newly.description });
        }
      } catch {}

      setShowSubmitSuccess(true);
      setTimeout(() => {
        if (!unlockedAchievement) navigate('/');
      }, 2500);
    } catch (err: any) {
      setDialogMessage(err.response?.data?.error || 'Eroare la trimiterea evaluării');
      setShowSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(total - 1, i + 1));
  const goTo = (idx: number) => setCurrentIndex(Math.max(0, Math.min(total - 1, idx)));

  const isLast = currentIndex === total - 1;
  const hasCurrentValue = currentQ?.type === 'likert' ? !!currentValue : !!currentText;

  if (loading) {
    return (
      <div className="text-center py-16" role="status" aria-busy="true" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4" aria-hidden="true" />
        <div className="text-neutral-500">Se încarcă evaluarea...</div>
        <ScreenReaderOnly>Vă rugăm așteptați.</ScreenReaderOnly>
      </div>
    );
  }

  if (error || !evaluation || !currentQ) {
    const isPlatformLocked = errorReason === 'platform_closed' || errorReason === 'deadline_passed';
    if (isPlatformLocked) {
      return (
        <Card
          tone={errorReason === 'deadline_passed' ? 'warning' : 'danger'}
          className="flex flex-col items-start gap-3 max-w-[760px]"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background:
                  errorReason === 'deadline_passed' ? 'var(--ecd-warning)' : 'var(--ecd-danger)',
              }}
              aria-hidden="true"
            />
            {errorReason === 'deadline_passed'
              ? 'Termenul-limită pentru evaluări a expirat'
              : 'Platforma de evaluare este închisă · termen-limită trecut'}
          </div>
          <p className="text-sm leading-relaxed">{error}</p>
          <p className="text-sm leading-relaxed text-neutral-600">
            {errorReason === 'platform_closed'
              ? 'Administratorul a închis platforma. Evaluările transmise rămân vizibile în istoric, iar feedbackul pentru platformă rămâne deschis.'
              : 'Evaluările transmise rămân vizibile în istoric. Feedbackul pentru platformă rămâne deschis.'}
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => navigate('/')} variant="primary">
              Înapoi la dashboard
            </Button>
            <Button onClick={() => navigate('/history')} variant="secondary">
              Vezi istoricul evaluărilor
            </Button>
            <Button onClick={() => navigate('/feedback')} variant="ghost">
              Feedback platformă
            </Button>
          </div>
        </Card>
      );
    }
    return (
      <Card className="border-red-200 bg-danger-bg">
        <p className="text-danger-fg" role="alert">
          {error || 'Evaluare negăsită'}
        </p>
        <Button onClick={() => navigate('/')} variant="primary" className="mt-4">
          Înapoi la dashboard
        </Button>
      </Card>
    );
  }

  const minutesRemaining = Math.max(1, Math.ceil(((total - completedCount) * 12) / 60));

  return (
    <div className="-mx-10 -mt-8 flex flex-col bg-neutral-25 min-h-[calc(100vh-64px)]">
      {/* Sticky sub-header */}
      <header className="px-12 pt-5 pb-[18px] bg-white border-b border-neutral-100 sticky top-0 z-[5] flex flex-col gap-3.5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3.5 flex-wrap">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" aria-hidden="true" />
              Înapoi la evaluări
            </button>
            <span className="w-px h-4 bg-neutral-200" aria-hidden="true" />
            <div className="text-[13px]">
              <span className="text-neutral-400">Evaluez: </span>
              <strong className="text-neutral-800 font-semibold">{evaluation.course.name}</strong>
              <span className="text-neutral-400"> · {evaluation.professor.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            {isReadOnly ? (
              <Badge tone="success">
                Trimisă{' '}
                {evaluation.submittedAt &&
                  new Date(evaluation.submittedAt).toLocaleDateString('ro-RO', {
                    day: 'numeric',
                    month: 'long',
                  })}
              </Badge>
            ) : savedAgoSec != null ? (
              <div className="inline-flex items-center gap-1.5 text-xs text-success-fg">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" aria-hidden="true" />
                {savedAgoSec < 60
                  ? `Salvat automat acum ${savedAgoSec}s`
                  : `Salvat acum ${Math.floor(savedAgoSec / 60)}m`}
              </div>
            ) : saving ? (
              <span className="text-xs text-neutral-400">Se salvează...</span>
            ) : null}
            {!isReadOnly && (
              <Button
                variant="ghost"
                size="sm"
                icon={<BookmarkIcon />}
                onClick={() => handleSave(false).then(() => navigate('/'))}
              >
                Salvează și ieși
              </Button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between items-baseline mb-2 flex-wrap gap-2">
            <span className="text-[13px] text-neutral-500">
              Întrebarea <strong className="text-neutral-800">{currentIndex + 1}</strong> din {total}
              {currentQ.category && (
                <span className="ml-3 text-neutral-400">
                  · dimensiunea <strong className="text-accent-700">{currentQ.category}</strong>
                </span>
              )}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              {completedCount}/{total} răspunse · ~{minutesRemaining} min rămase
            </span>
          </div>
          <Progress value={completedCount} max={total} color="accent" height={6} />

          {/* Dot navigator */}
          <div className="flex gap-1 mt-3 flex-wrap" role="navigation" aria-label="Navigare rapidă întrebări">
            {questions.map((q, i) => {
              const answered = q.type === 'likert' ? !!responses[q.id]?.likert : !!responses[q.id]?.text;
              const isCur = i === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => goTo(i)}
                  title={`Întrebarea ${i + 1}${q.category ? ` · ${q.category}` : ''}`}
                  aria-label={`Mergi la întrebarea ${i + 1}${answered ? ', răspuns' : ', fără răspuns'}${isCur ? ', curentă' : ''}`}
                  aria-current={isCur ? 'true' : undefined}
                  className={`flex-1 min-w-[24px] h-1.5 p-0 border-none cursor-pointer rounded-full transition-colors duration-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-1 ${
                    isCur ? 'bg-primary-800' : answered ? 'bg-accent-400' : 'bg-neutral-200'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </header>

      {/* Question card */}
      <div className="flex-1 overflow-auto flex justify-center px-12 py-10">
        <div className="w-full max-w-[720px] flex flex-col gap-7">
          <div>
            {currentQ.category && (
              <Badge tone="accent" className="mb-4">
                {currentQ.category}
              </Badge>
            )}
            <h1
              id={`question-${currentQ.id}`}
              className="font-display text-[28px] font-semibold tracking-tight leading-[1.3] text-neutral-800"
            >
              {currentQ.text}
              {currentQ.isRequired && (
                <span className="text-danger ml-1" aria-label="obligatoriu">
                  *
                </span>
              )}
            </h1>
            <p className="mt-2.5 text-sm text-neutral-500">
              {currentQ.type === 'likert'
                ? 'Selectează poziția care reflectă cel mai bine experiența ta. Răspunsul este complet anonim.'
                : 'Răspunde liber. Datele tale sunt automat anonimizate înainte de publicare.'}
            </p>
          </div>

          {currentQ.type === 'likert' ? (
            <Card padding="lg">
              <LikertScale
                questionId={currentQ.id}
                questionText={currentQ.text}
                value={currentValue}
                onChange={handleLikertChange}
                isRequired={currentQ.isRequired}
                isReadOnly={isReadOnly}
              />
              <div className="mt-6 flex items-center gap-2.5 px-4 py-3 rounded-lg bg-info-bg text-info-fg text-[13px]">
                <CheckCircleIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  Folosește săgețile{' '}
                  <kbd className="font-mono text-[11px] px-1.5 py-px bg-blue-100 rounded">←</kbd>{' '}
                  <kbd className="font-mono text-[11px] px-1.5 py-px bg-blue-100 rounded">→</kbd> pentru a naviga rapid
                  între opțiuni.
                </span>
              </div>
            </Card>
          ) : (
            <Card padding="md">
              <label htmlFor={`textarea-${currentQ.id}`} className="block text-sm font-medium mb-1.5">
                Răspuns text liber{currentQ.isRequired ? ' (obligatoriu)' : ' (opțional)'}
              </label>
              <p className="text-xs text-neutral-500 mb-3">
                Datele tale sunt automat anonimizate înainte de publicare către cadrul didactic.
              </p>
              <textarea
                id={`textarea-${currentQ.id}`}
                value={currentText}
                onChange={(e) => !isReadOnly && handleTextChange(e.target.value)}
                disabled={isReadOnly}
                maxLength={500}
                rows={5}
                aria-labelledby={`question-${currentQ.id}`}
                aria-required={currentQ.isRequired}
                placeholder={isReadOnly ? '' : 'Ce a funcționat bine? Ce ar putea fi îmbunătățit?'}
                className="w-full p-3.5 font-sans text-sm border border-neutral-200 rounded-lg bg-neutral-25 resize-y outline-none text-neutral-800 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-400/30 disabled:bg-neutral-100 disabled:cursor-not-allowed transition-all duration-fast"
              />
              <div className="mt-1.5 text-right text-[11px] text-neutral-400 font-mono">
                {currentText.length}/500
              </div>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
            <Button
              variant="secondary"
              size="lg"
              icon={<ArrowLeftIcon />}
              disabled={currentIndex === 0}
              onClick={goPrev}
            >
              Înapoi
            </Button>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[13px] text-neutral-500">
                {currentQ.type === 'likert' && currentValue ? (
                  <>
                    Răspuns: <strong className="text-neutral-800">{LIKERT_OPTIONS[currentValue - 1].label}</strong>
                  </>
                ) : currentQ.type === 'text' && currentText ? (
                  <>{currentText.length} caractere</>
                ) : (
                  'Selectează o opțiune pentru a continua'
                )}
              </span>
              {isLast ? (
                <Button
                  variant="accent"
                  size="lg"
                  iconRight={<CheckIcon />}
                  disabled={isReadOnly || submitting}
                  loading={submitting}
                  onClick={handleSubmit}
                >
                  Trimite evaluarea
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  iconRight={<ArrowRightIcon />}
                  disabled={currentQ.isRequired && !hasCurrentValue}
                  onClick={goNext}
                >
                  Continuă
                </Button>
              )}
            </div>
          </div>

          {/* Privacy reminder */}
          <div className="flex gap-3 items-start p-3.5 bg-neutral-50 rounded-lg text-xs text-neutral-500">
            <LockClosedIcon className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong className="text-neutral-800">Confidențialitate:</strong> răspunsurile sunt agregate statistic.
              Profesorul nu poate identifica autorii. ID-ul tău este șters din răspunsuri la finalul colectării.
            </span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmSubmit}
        onClose={() => setShowConfirmSubmit(false)}
        onConfirm={confirmSubmit}
        title="Confirmă trimiterea evaluării"
        message="Ești sigur că vrei să trimiți evaluarea? După trimitere, nu vei mai putea modifica răspunsurile."
        confirmText="Trimite evaluarea"
        cancelText="Anulează"
        variant="warning"
      />
      <AlertDialog
        isOpen={showMissingRequired}
        onClose={() => setShowMissingRequired(false)}
        title="Răspunsuri obligatorii lipsă"
        message={`Te rugăm să răspunzi la toate întrebările obligatorii. Mai ai ${missingCount} răspunsuri lipsă.`}
        variant="error"
        closeText="Am înțeles"
      />
      <AlertDialog
        isOpen={showSaveError}
        onClose={() => setShowSaveError(false)}
        title="Eroare la salvare"
        message={dialogMessage}
        variant="error"
      />
      <AlertDialog
        isOpen={showSubmitSuccess}
        onClose={() => setShowSubmitSuccess(false)}
        title="Evaluare trimisă cu succes"
        message="Mulțumim pentru feedback! Vei fi redirecționat către pagina principală."
        variant="success"
      />
      <AlertDialog
        isOpen={showSubmitError}
        onClose={() => setShowSubmitError(false)}
        title="Eroare la trimitere"
        message={dialogMessage}
        variant="error"
      />

      <AchievementUnlock
        visible={!!unlockedAchievement}
        title={unlockedAchievement?.title || ''}
        description={unlockedAchievement?.description}
        onClose={() => {
          setUnlockedAchievement(null);
          navigate('/');
        }}
      />
    </div>
  );
}
