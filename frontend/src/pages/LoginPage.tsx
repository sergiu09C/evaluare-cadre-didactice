import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      // Redirect bazat pe rol utilizator va fi făcut în useEffect
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare la autentificare. Verificați credențialele.');
    } finally {
      setLoading(false);
    }
  };

  // Redirect după autentificare bazat pe rol
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'professor') {
        navigate('/professor');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            Evaluare Cadre Didactice
          </h1>
          <p className="text-gray-600">Autentifică-te pentru a continua</p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6" aria-label="Formular autentificare">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="student@univ.ro"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">
                Parolă
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              aria-label={loading ? 'Se autentifică, vă rugăm așteptați' : 'Autentificare în cont'}
              className="w-full btn btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Se autentifică...' : 'Autentificare'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Credențiale demo:</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>Student:</strong> student1@univ.ro / password123
              </p>
              <p>
                <strong>Admin:</strong> admin@univ.ro / password123
              </p>
              <p>
                <strong>Profesor:</strong> ion.popescu@prof.univ.ro / password123
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Platformă securizată pentru evaluarea cadrelor didactice
        </p>
      </div>
    </div>
  );
}
