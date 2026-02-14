import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Evaluation, Question, EvaluationResponse } from '../types';
import { ConfirmDialog, AlertDialog } from '../components/AccessibleModal';
import { SuccessNotification } from '../components/LiveRegion';
import ScreenReaderOnly from '../components/ScreenReaderOnly';
import LikertScale from '../components/LikertScale';

export default function EvaluationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<number, EvaluationResponse>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // Dialog states
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showMissingRequired, setShowMissingRequired] = useState(false);
  const [missingCount, setMissingCount] = useState(0);
  const [showSaveError, setShowSaveError] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [showSubmitError, setShowSubmitError] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  const isReadOnly = evaluation?.status === 'submitted';

  useEffect(() => {
    if (id) {
      loadEvaluation();
    }
  }, [id]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!isReadOnly && evaluation && Object.keys(responses).length > 0) {
      const timer = setInterval(() => {
        handleSave(true);
      }, 30000);

      return () => clearInterval(timer);
    }
  }, [responses, isReadOnly, evaluation]);

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      const data = await api.getEvaluation(parseInt(id!));
      setEvaluation(data.evaluation);
      setQuestions(data.questions);

      // Load existing responses
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare la încărcarea evaluării');
    } finally {
      setLoading(false);
    }
  };

  const handleLikertChange = (questionId: number, value: number) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        likert: value,
      },
    }));
  };

  const handleTextChange = (questionId: number, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        text: value,
      },
    }));
  };

  const handleSave = async (isAutoSave = false) => {
    if (isReadOnly) return;

    try {
      setSaving(true);
      const responsesArray = Object.values(responses);

      if (responsesArray.length > 0) {
        await api.saveResponses(parseInt(id!), responsesArray);
        setSaveMessage(isAutoSave ? 'Salvat automat' : 'Răspunsuri salvate cu succes');
        setTimeout(() => setSaveMessage(''), 3000);
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
    // Verify all required questions are answered
    const unansweredRequired = questions.filter(
      (q) =>
        q.isRequired &&
        (!responses[q.id] ||
          (q.type === 'likert' && !responses[q.id].likert) ||
          (q.type === 'text' && !responses[q.id].text))
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

      // Save final responses
      await handleSave();

      // Submit evaluation
      await api.submitEvaluation(parseInt(id!));

      setShowSubmitSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setDialogMessage(err.response?.data?.error || 'Eroare la trimiterea evaluării');
      setShowSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12" role="status" aria-busy="true" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" aria-hidden="true"></div>
        <div className="text-gray-600">Se încarcă evaluarea...</div>
        <ScreenReaderOnly>Vă rugăm așteptați în timp ce se încarcă formularul de evaluare.</ScreenReaderOnly>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="card p-6 bg-red-50 border-red-200" role="alert" aria-live="assertive">
        <p className="text-red-700">{error || 'Evaluare negăsită'}</p>
        <button onClick={() => navigate('/')} className="btn btn-primary mt-4" aria-label="Înapoi la pagina principală">
          Înapoi la dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" id="page-title">Evaluare Cadru Didactic</h1>
          <p className="text-lg text-gray-700 mt-2" aria-label={`Profesor: ${evaluation.professor.name}`}>{evaluation.professor.name}</p>
          <p className="text-sm text-gray-600" aria-label={`Curs: ${evaluation.course.name}`}>{evaluation.course.name}</p>
        </div>
        <button onClick={() => navigate('/')} className="btn btn-secondary" aria-label="Înapoi la pagina principală">
          ← Înapoi
        </button>
      </div>

      {/* Status Banner */}
      {isReadOnly ? (
        <div className="card p-4 bg-green-50 border-green-200">
          <p className="text-green-800 text-center font-medium">
            ✓ Evaluarea a fost trimisă la data de{' '}
            {new Date(evaluation.submittedAt!).toLocaleDateString('ro-RO')}
          </p>
        </div>
      ) : (
        <div className="card p-4 bg-blue-50 border-blue-200">
          <p className="text-blue-800 text-center">
            <strong>Evaluare anonimă</strong> - Răspunsurile tale sunt confidențiale și nu pot fi
            legate de identitatea ta.
          </p>
        </div>
      )}

      {/* Save Message */}
      {saveMessage && (
        <SuccessNotification message={saveMessage} visible={true} className="card p-3 bg-green-50 border-green-200 text-center text-green-700 text-sm" />
      )}

      {/* Questions */}
      <form aria-labelledby="page-title" className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="card p-6">
            <div className="mb-4">
              <span className="text-sm text-gray-500" aria-label={`Întrebarea ${index + 1} din ${questions.length}`}>
                Întrebarea {index + 1}
              </span>
              <h3
                id={`question-${question.id}`}
                className="text-lg font-medium text-gray-900 mt-1"
              >
                {question.text}
                {question.isRequired && <span className="text-red-500 ml-1" aria-label="obligatoriu">*</span>}
              </h3>
            </div>

            {/* Likert Scale with Keyboard Navigation */}
            {question.type === 'likert' && (
              <LikertScale
                questionId={question.id}
                questionText={question.text}
                value={responses[question.id]?.likert}
                onChange={(value) => handleLikertChange(question.id, value)}
                isRequired={question.isRequired}
                isReadOnly={isReadOnly}
              />
            )}

            {/* Text Response */}
            {question.type === 'text' && (
              <textarea
                id={`textarea-${question.id}`}
                value={responses[question.id]?.text || ''}
                onChange={(e) => !isReadOnly && handleTextChange(question.id, e.target.value)}
                disabled={isReadOnly}
                rows={4}
                aria-labelledby={`question-${question.id}`}
                aria-required={question.isRequired}
                aria-describedby={isReadOnly ? undefined : `textarea-hint-${question.id}`}
                className="input resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder={isReadOnly ? '' : 'Scrie răspunsul tău aici...'}
              />
            )}
            {question.type === 'text' && !isReadOnly && (
              <ScreenReaderOnly id={`textarea-hint-${question.id}`}>
                Răspuns text liber pentru: {question.text}
              </ScreenReaderOnly>
            )}
          </div>
        ))}
      </form>

      {/* Actions */}
      {!isReadOnly && (
        <div className="card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Răspunsurile sunt salvate automat la fiecare 30 de secunde
            </p>
            <p className="text-xs text-gray-500 mt-1">
              * Câmpurile marcate cu steluță sunt obligatorii
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              aria-busy={saving}
              aria-label={saving ? 'Se salvează răspunsurile' : 'Salvează răspunsurile ca draft'}
              className="btn btn-secondary"
            >
              {saving ? 'Se salvează...' : 'Salvează draft'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              aria-busy={submitting}
              aria-label={submitting ? 'Se trimite evaluarea' : 'Trimite evaluarea finală'}
              className="btn btn-primary"
            >
              {submitting ? 'Se trimite...' : 'Trimite evaluarea'}
            </button>
          </div>
        </div>
      )}

      {/* Accessible Dialogs */}
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
    </div>
  );
}
