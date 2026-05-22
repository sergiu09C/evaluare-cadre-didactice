import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, Card } from '../components/ui';
import { api } from '../services/api';
import { LockClosedIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-25">
        <Card className="max-w-[480px] w-full">
          <div className="flex flex-col items-center text-center gap-3 py-6">
            <ExclamationTriangleIcon className="w-12 h-12 text-warning-fg" aria-hidden="true" />
            <h1 className="font-display text-xl font-semibold text-neutral-800">Link invalid</h1>
            <p className="text-sm text-neutral-600">
              Linkul de resetare nu conține un token. Solicită un link nou de pe pagina de autentificare.
            </p>
            <Link to="/login">
              <Button variant="primary">Înapoi la autentificare</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }
    if (password !== confirm) {
      setError('Parolele nu coincid.');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Eroare la resetarea parolei.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-25">
      <Card className="max-w-[480px] w-full">
        {done ? (
          <div className="flex flex-col items-center text-center gap-3 py-6">
            <CheckCircleIcon className="w-14 h-14 text-success-fg" aria-hidden="true" />
            <h1 className="font-display text-xl font-semibold text-neutral-800">Parolă schimbată</h1>
            <p className="text-sm text-neutral-600">Te redirecționăm către pagina de autentificare...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'var(--ecd-accent-50, #F3E8FF)' }}
              >
                <LockClosedIcon className="w-5 h-5 text-accent-700" aria-hidden="true" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-neutral-800">Setează o parolă nouă</h1>
                <p className="text-xs text-neutral-500">Linkul e valabil 1 oră de la generare.</p>
              </div>
            </div>
            <Input
              label="Parolă nouă"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <Input
              label="Confirmă parola"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            {error && (
              <div role="alert" className="bg-danger-bg text-danger-fg text-sm p-3 rounded">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Link to="/login">
                <Button variant="secondary" type="button">Anulează</Button>
              </Link>
              <Button variant="primary" type="submit" loading={loading}>
                Schimbă parola
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
