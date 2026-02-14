import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Professor, EvaluationStatus } from '../types';
import { AlertDialog } from '../components/AccessibleModal';
import ScreenReaderOnly from '../components/ScreenReaderOnly';

export default function StudentDashboard() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [status, setStatus] = useState<EvaluationStatus | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [showMessages, setShowMessages] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog state
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [professorsData, statusData, messagesData] = await Promise.all([
        api.getProfessorsToEvaluate(),
        api.getEvaluationStatus(),
        api.getStudentMessages().catch(() => ({ messages: [] })), // Fail silently if messages not available
      ]);

      setProfessors(professorsData.professors);
      setStatus(statusData);
      setMessages(messagesData.messages || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEvaluation = async (professor: Professor) => {
    try {
      // Creăm evaluare sau obținem cea existentă
      const result = await api.createEvaluation(professor.course.id, professor.id);
      navigate(`/evaluation/${result.evaluationId}`);
    } catch (err: any) {
      setAlertMessage(err.response?.data?.error || 'Eroare la creare evaluare');
      setShowAlert(true);
    }
  };

  const handleContinueEvaluation = (evaluationId: number) => {
    navigate(`/evaluation/${evaluationId}`);
  };

  const getStatusBadge = (evalStatus: string) => {
    switch (evalStatus) {
      case 'submitted':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800" role="status" aria-label="Status evaluare: Completată">
            ✓ Completat
          </span>
        );
      case 'draft':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800" role="status" aria-label="Status evaluare: În progres">
            ⏳ În progres
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800" role="status" aria-label="Status evaluare: Neevaluată">
            ○ Neevaluat
          </span>
        );
    }
  };

  const getActionButton = (professor: Professor) => {
    const { evaluation } = professor;

    if (evaluation.status === 'submitted') {
      return (
        <button
          onClick={() => handleContinueEvaluation(evaluation.id!)}
          className="btn btn-secondary text-sm"
          aria-label={`Vizualizează evaluarea completată pentru ${professor.name}, ${professor.course.name}`}
        >
          Vizualizare
        </button>
      );
    }

    if (evaluation.status === 'draft') {
      return (
        <button
          onClick={() => handleContinueEvaluation(evaluation.id!)}
          className="btn btn-primary text-sm"
          aria-label={`Continuă evaluarea în progres pentru ${professor.name}, ${professor.course.name}`}
        >
          Continuă
        </button>
      );
    }

    return (
      <button
        onClick={() => handleStartEvaluation(professor)}
        className="btn btn-primary text-sm"
        aria-label={`Începe evaluarea pentru ${professor.name}, ${professor.course.name}`}
      >
        Începe evaluarea
      </button>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12" role="status" aria-busy="true" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" aria-hidden="true"></div>
        <div className="text-gray-600">Se încarcă datele...</div>
        <ScreenReaderOnly>Vă rugăm așteptați în timp ce se încarcă informațiile despre evaluări.</ScreenReaderOnly>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 bg-red-50 border-red-200" role="alert" aria-live="assertive">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" id="page-title">Dashboard Student</h1>
        <p className="text-gray-600 mt-1">Evaluează cadrele didactice la care ai participat</p>
      </div>

      {/* Student Info Card */}
      {user?.program && (
        <div className="card p-6 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Informații Student</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Facultate</p>
              <p className="font-medium text-gray-900">{user.program.faculty}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Program de studii</p>
              <p className="font-medium text-gray-900">{user.program.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {user.program.level === 'licenta' && 'Licență'}
                {user.program.level === 'master' && 'Master'}
                {user.program.level === 'doctorat' && 'Doctorat'}
                {' - '}Cod: {user.program.code}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">An de studiu</p>
              <p className="font-medium text-gray-900">Anul {user.program.year}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Section */}
      {messages.length > 0 && (
        <div className="card border-l-4 border-primary-500">
          <button
            className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 w-full text-left"
            onClick={() => setShowMessages(!showMessages)}
            aria-expanded={showMessages}
            aria-controls="messages-content"
            aria-label={`${showMessages ? 'Ascunde' : 'Arată'} mesaje importante, ${messages.length} mesaje`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-xl" aria-hidden="true">📧</span>
              <h2 className="text-lg font-semibold text-gray-900" id="messages-heading">
                Mesaje importante ({messages.length})
              </h2>
            </div>
            <span className="text-gray-500" aria-hidden="true">
              {showMessages ? '▼' : '▶'}
            </span>
          </button>

          {showMessages && (
            <div className="border-t border-gray-200" id="messages-content" role="region" aria-labelledby="messages-heading">
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{msg.title}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.sent_at).toLocaleDateString('ro-RO')}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.message_type === 'reminder' && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                        ⏰ Reminder
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Card */}
      {status && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" id="progress-label">Progresul tău</h2>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span id="progress-text">
                {status.completed} din {status.total} profesori evaluați
              </span>
              <span className="font-semibold">{status.completionRate}%</span>
            </div>
            <div
              className="w-full bg-gray-200 rounded-full h-3"
              role="progressbar"
              aria-valuenow={status.completionRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-labelledby="progress-label"
              aria-valuetext={`${status.completed} din ${status.total} profesori evaluați, ${status.completionRate} procente completat`}
            >
              <div
                className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${status.completionRate}%` }}
                aria-hidden="true"
              ></div>
            </div>
            <ScreenReaderOnly>
              Progres evaluări: {status.completed} din {status.total} profesori evaluați, rata de completare {status.completionRate} procente
            </ScreenReaderOnly>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div role="region" aria-label="Evaluări completate">
              <div className="text-2xl font-bold text-green-600" aria-label={`${status.completed} evaluări completate`}>{status.completed}</div>
              <div className="text-xs text-gray-600">Completate</div>
            </div>
            <div role="region" aria-label="Evaluări în progres">
              <div className="text-2xl font-bold text-yellow-600" aria-label={`${status.draft} evaluări în progres`}>{status.draft}</div>
              <div className="text-xs text-gray-600">În progres</div>
            </div>
            <div role="region" aria-label="Evaluări neevaluate">
              <div className="text-2xl font-bold text-gray-600" aria-label={`${status.notStarted} evaluări neevaluate`}>{status.notStarted}</div>
              <div className="text-xs text-gray-600">Neevaluate</div>
            </div>
          </div>
        </div>
      )}

      {/* Professors List */}
      <section aria-labelledby="professors-heading">
        <h2 className="text-xl font-semibold text-gray-900 mb-4" id="professors-heading">
          Profesori de evaluat ({professors.length})
        </h2>

        {professors.length === 0 ? (
          <div className="card p-8 text-center text-gray-500" role="status">
            <p>Nu ai profesori de evaluat momentan</p>
          </div>
        ) : (
          <div className="grid gap-4" role="list">
            {professors.map((professor) => (
              <div key={professor.id} className="card p-6 hover:shadow-md transition-shadow" role="listitem">
                <div className="flex items-start justify-between">
                  {/* Professor Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900" id={`prof-${professor.id}-name`}>{professor.name}</h3>
                      {professor.type && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {professor.type === 'curs' && 'Curs'}
                          {professor.type === 'laborator' && 'Laborator'}
                          {professor.type === 'seminar' && 'Seminar'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{professor.department}</p>
                    <p className="text-sm text-primary-600 font-medium">
                      {professor.course.name} ({professor.course.code})
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Semestrul {professor.course.semester}, {professor.course.academicYear}
                    </p>
                  </div>

                  {/* Status & Action */}
                  <div className="flex flex-col items-end space-y-3">
                    {getStatusBadge(professor.evaluation.status)}
                    {getActionButton(professor)}
                  </div>
                </div>

                {/* Deadline (if draft or not started) */}
                {professor.evaluation.deadline && professor.evaluation.status !== 'submitted' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Termen limită:</span>{' '}
                      {new Date(professor.evaluation.deadline).toLocaleDateString('ro-RO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Motivational Message */}
      {status && status.completionRate < 100 && (
        <div className="card p-6 bg-primary-50 border-primary-200" role="region" aria-label="Mesaj motivațional">
          <p className="text-primary-800 text-center">
            <strong>Ajută-ne să îmbunătățim calitatea educației!</strong>
            <br />
            Feedback-ul tău este esențial pentru dezvoltarea cadrelor didactice.
          </p>
        </div>
      )}

      {/* All Complete Message */}
      {status && status.completionRate === 100 && (
        <div className="card p-6 bg-green-50 border-green-200" role="status" aria-live="polite">
          <p className="text-green-800 text-center text-lg font-semibold">
            🎉 Felicitări! Ai completat toate evaluările!
            <br />
            <span className="text-sm font-normal">
              Mulțumim pentru contribuția ta la îmbunătățirea calității educației.
            </span>
          </p>
        </div>
      )}

      {/* Accessible Dialog */}
      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="Eroare"
        message={alertMessage}
        variant="error"
      />
    </div>
  );
}
