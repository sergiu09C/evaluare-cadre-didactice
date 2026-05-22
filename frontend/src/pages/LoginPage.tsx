import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import DeadlineTimer from '../components/DeadlineTimer';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface PublicStats {
  participation_rate: number;
  avg_score: number;
  submitted_count: number;
  total_students: number;
  is_active: boolean;
  deadline: string | null;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PublicStats | null>(null);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchStats = () => {
      axios
        .get<PublicStats>('/api/public-stats')
        .then((r) => mounted && setStats(r.data))
        .catch(() => { /* silent */ });
    };
    fetchStats();
    const t = setInterval(fetchStats, 30_000); // refresh la 30s
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare la autentificare. Verificați credențialele.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'professor') navigate('/professor');
      else navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex bg-neutral-25 font-sans">
      {/* ── LEFT · Brand panel ──────────────────────────────────── */}
      <aside
        className="relative overflow-hidden text-white px-16 py-14 flex flex-col justify-between hidden md:flex"
        style={{
          flex: '0 0 46%',
          background: 'linear-gradient(165deg, #0E2233 0%, #143049 55%, #1B3A57 100%)',
        }}
      >
        {/* Decorative circles */}
        <svg
          className="absolute -right-[180px] -top-[180px] opacity-[0.18] pointer-events-none"
          width="600"
          height="600"
          viewBox="0 0 600 600"
          fill="none"
          stroke="#A78BFA"
          strokeWidth="0.6"
          aria-hidden="true"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <circle key={i} cx="300" cy="300" r={50 + i * 28} />
          ))}
        </svg>
        <svg
          className="absolute -left-[120px] -bottom-[160px] opacity-10 pointer-events-none"
          width="500"
          height="500"
          viewBox="0 0 500 500"
          fill="none"
          stroke="#A78BFA"
          strokeWidth="0.6"
          aria-hidden="true"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx="250" cy="250" r={60 + i * 28} />
          ))}
        </svg>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-xl tracking-tighter"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                boxShadow: '0 8px 24px rgba(124,58,237,.4)',
              }}
              aria-hidden="true"
            >
              E
            </div>
            <div>
              <div className="font-display font-bold text-[22px] tracking-tight">ECD</div>
              <div className="text-xs opacity-65 mt-0.5">Evaluarea Cadrelor Didactice</div>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10">
          <h1
            className="font-display font-semibold leading-[1.1] tracking-tight max-w-[520px]"
            style={{ fontSize: 44 }}
          >
            Vocea ta contează.
            <br />
            <span style={{ color: '#C4B5FD' }}>Anonim. Sigur. Util.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed max-w-[480px]" style={{ color: 'rgba(255,255,255,.72)' }}>
            Sistem digital de evaluare a activității cadrelor didactice de către studenți. Datele sunt complet
            anonimizate și folosite exclusiv pentru îmbunătățirea procesului didactic.
          </p>

          {/* Stat row — LIVE din /api/public-stats */}
          <div className="mt-9 grid grid-cols-3 gap-6 max-w-[480px]">
            {[
              [`${stats?.participation_rate ?? '—'}%`, 'rată de participare'],
              [stats ? stats.avg_score.toFixed(2).replace('.', ',') : '—', 'scor mediu / 5,00'],
              [stats ? stats.submitted_count.toLocaleString('ro-RO') : '—', 'evaluări completate'],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="font-display text-[28px] font-semibold text-white tracking-tight">{v}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,.55)' }}>
                  {l}
                </div>
              </div>
            ))}
          </div>

          {/* Timer deadline LIVE — afișează și starea „închis manual" */}
          {(stats?.deadline || (stats && !stats.is_active)) && (
            <div className="mt-6 max-w-[480px]">
              <DeadlineTimer
                deadline={stats?.deadline ?? null}
                platformClosed={!stats?.is_active}
                variant="card"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="relative z-10 text-xs flex justify-between"
          style={{ color: 'rgba(255,255,255,.45)' }}
        >
          <span>FAIMA · UNSTPB · 2026</span>
          <span>v1.0 · pilot semestrul II {stats?.is_active === false && '· INACTIV'}</span>
        </div>
      </aside>

      {/* ── RIGHT · Form ────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center p-12 relative">
        <div className="w-full max-w-[400px] flex flex-col gap-7">
          <div>
            <h2 className="text-[30px] font-semibold tracking-tight font-display text-neutral-800">
              Bun venit înapoi
            </h2>
            <p className="mt-2 text-neutral-500 text-sm">
              Autentifică-te cu adresa instituțională pentru a continua.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-label="Formular autentificare">
            <Input
              label="Email instituțional"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              prefix={<EnvelopeIcon className="w-[18px] h-[18px]" aria-hidden="true" />}
              placeholder="nume.prenume@stud.unstpb.ro"
              required
              autoComplete="email"
            />

            <div>
              <Input
                label="Parolă"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                prefix={<LockClosedIcon className="w-[18px] h-[18px]" aria-hidden="true" />}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded-sm"
                    aria-label={showPassword ? 'Ascunde parola' : 'Afișează parola'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-[18px] h-[18px]" />
                    ) : (
                      <EyeIcon className="w-[18px] h-[18px]" />
                    )}
                  </button>
                }
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <div className="flex justify-between items-center mt-2.5">
                <label className="inline-flex items-center gap-2 text-[13px] text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: '#7C3AED' }}
                  />
                  Ține-mă conectat
                </label>
                <a
                  href="mailto:ceac@faima.pub.ro?subject=Reset%20parol%C4%83%20ECD"
                  className="text-[13px] text-accent-700 font-medium no-underline hover:underline"
                  title="Pentru reset parolă, scrie la CEAC FAIMA"
                >
                  Am uitat parola
                </a>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="bg-danger-bg border border-red-200 text-danger-fg px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              iconRight={!loading && <ArrowRightIcon />}
              className="w-full mt-1"
              aria-label={loading ? 'Se autentifică, vă rugăm așteptați' : 'Autentificare în cont'}
            >
              {loading ? 'Se autentifică...' : 'Autentificare'}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="pt-6 border-t border-neutral-100">
            <p className="text-[13px] text-neutral-500 mb-2 font-medium">Credențiale demo:</p>
            <div className="text-xs text-neutral-500 space-y-1 font-mono">
              <p>
                <strong className="text-neutral-700">Student:</strong> student1@univ.ro / password123
              </p>
              <p>
                <strong className="text-neutral-700">Admin:</strong> admin@univ.ro / password123
              </p>
              <p>
                <strong className="text-neutral-700">Profesor:</strong> vasile.popescu.1@prof.univ.ro / password123
              </p>
            </div>
          </div>

          <p className="text-xs text-neutral-400 text-center">
            Prin autentificare accepți{' '}
            <Link to="/terms" className="text-accent-700 no-underline hover:underline">
              Termenii de utilizare
            </Link>{' '}
            și{' '}
            <Link to="/privacy" className="text-accent-700 no-underline hover:underline">
              Politica de confidențialitate
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
