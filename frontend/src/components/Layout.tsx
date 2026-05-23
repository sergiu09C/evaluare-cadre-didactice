import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AccessibilityMenu from './AccessibilityMenu';
import { SkipLink } from './a11y';
import { Avatar } from './ui';
import NotificationsDropdown from './NotificationsDropdown';
import CommandPalette from './CommandPalette';
import { ConfirmDialog } from './AccessibleModal';
import DeadlineTimer from './DeadlineTimer';
import { api } from '../services/api';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  FlagIcon,
  TrophyIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  DocumentChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

type NavItem = {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin, isProfessor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [platformStatus, setPlatformStatus] = useState<{ is_active: boolean; closure_message: string | null; deadline: string | null } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Închide drawer-ul mobile când navigăm
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;
    api
      .getPlatformStatus()
      .then((s) => {
        if (mounted) setPlatformStatus(s);
      })
      .catch(() => {
        /* silent */
      });
    const t = setInterval(() => {
      api
        .getPlatformStatus()
        .then((s) => {
          if (mounted) setPlatformStatus(s);
        })
        .catch(() => {
          /* silent */
        });
    }, 60_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const studentNav: NavItem[] = [
    { label: 'Acasă · Călătoria evaluării', path: '/', icon: HomeIcon },
    { label: 'Dashboard student', path: '/dashboard', icon: ChartBarIcon },
    { label: 'Evaluări active', path: '/evaluations', icon: ClipboardDocumentListIcon },
    { label: 'Istoric', path: '/history', icon: ChartBarIcon },
    { label: 'Rezultate agregate', path: '/results', icon: FlagIcon },
    { label: 'Achievements', path: '/achievements', icon: TrophyIcon },
    { label: 'Feedback platformă', path: '/feedback', icon: ClipboardDocumentListIcon },
  ];

  const professorNav: NavItem[] = [
    { label: 'Acasă · Călătoria evaluării', path: '/professor', icon: HomeIcon },
    { label: 'Dashboard profesor', path: '/professor/dashboard', icon: ChartBarIcon },
    { label: 'Cursurile mele', path: '/professor/courses', icon: ClipboardDocumentListIcon },
    { label: 'Studenți', path: '/professor/students', icon: UsersIcon },
    { label: 'Acțiuni propuse', path: '/professor/actions', icon: FlagIcon },
    { label: 'Rapoarte', path: '/professor/reports', icon: DocumentChartBarIcon },
    { label: 'Feedback platformă', path: '/feedback', icon: ClipboardDocumentListIcon },
    { label: 'Ghid pentru profesori', path: '/guide/professor', icon: FlagIcon },
  ];

  const adminNav: NavItem[] = [
    { label: 'Acasă · Călătoria evaluării', path: '/admin', icon: HomeIcon },
    { label: 'Dashboard admin', path: '/admin/dashboard', icon: ChartBarIcon },
    { label: 'Gestionare platformă', path: '/admin/controls', icon: Cog6ToothIcon },
    { label: 'Closing-the-loop', path: '/admin/closing-loop', icon: FlagIcon },
    { label: 'Editor ghiduri', path: '/admin/guides', icon: ChartBarIcon },
    { label: 'Editor achievements', path: '/admin/achievements', icon: TrophyIcon },
    { label: 'Șabloane acțiuni', path: '/admin/action-templates', icon: ClipboardDocumentListIcon },
    { label: 'Feedback platformă', path: '/admin/platform-feedback', icon: ChartBarIcon },
    { label: 'KPI instituționali', path: '/admin/kpis', icon: ChartBarIcon },
    { label: 'Rapoarte', path: '/admin/reports', icon: DocumentChartBarIcon },
    { label: 'Utilizatori', path: '/admin/users', icon: UsersIcon },
    { label: 'Ghid pentru admin', path: '/guide/admin', icon: TrophyIcon },
  ];

  const nav: NavItem[] = isAdmin ? adminNav : isProfessor ? professorNav : studentNav;

  const userInitials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '?';
  const roleLabel = isAdmin ? 'Administrator' : isProfessor ? 'Profesor' : 'Student';
  const roleMeta = isAdmin
    ? 'CEAC'
    : isProfessor
      ? user?.program?.faculty || 'Cadru didactic'
      : user?.program
        ? `Anul ${user.program.year} · ${user.program.code}`
        : 'Student';

  const isActiveRoute = (path: string) => {
    const cleanPath = path.split('?')[0];
    if (cleanPath === '/' || cleanPath === '/admin' || cleanPath === '/professor') {
      return location.pathname === cleanPath;
    }
    return location.pathname.startsWith(cleanPath);
  };

  return (
    <div className="min-h-screen flex bg-neutral-25 font-sans text-neutral-800">
      <SkipLink href="#main-content">Sari la conținut principal</SkipLink>
      <CommandPalette />

      {/* Backdrop pentru drawer mobil */}
      {mobileNavOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <nav
        aria-label="Navigare principală"
        className={`w-[248px] shrink-0 bg-white border-r border-neutral-100 flex flex-col gap-1 px-3.5 py-5 h-screen z-40 transition-transform duration-200 fixed md:sticky inset-y-0 left-0 top-0 md:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <button
          onClick={() => navigate(isAdmin ? '/admin' : isProfessor ? '/professor' : '/')}
          className="flex items-center gap-3 px-2 pb-[18px] pt-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded-md"
          aria-label="Mergi la pagina principală"
        >
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-display font-bold text-sm tracking-tight"
            style={{ background: 'linear-gradient(135deg, #0E2233, #1B3A57)' }}
            aria-hidden="true"
          >
            E
          </span>
          <span>
            <span className="block font-display font-bold text-[15px] tracking-tight text-neutral-800">ECD</span>
            <span className="block text-[10.5px] text-neutral-400 -mt-px">FAIMA · UNSTPB</span>
          </span>
        </button>

        {/* Nav items */}
        <div className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = isActiveRoute(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path + item.label}
                onClick={() => navigate(item.path)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-fast text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 ${
                  active
                    ? 'bg-primary-50 text-primary-800 font-semibold'
                    : 'text-neutral-700 font-medium hover:bg-neutral-50'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-primary-800' : 'text-neutral-500'}`} aria-hidden={true} />
                <span className="flex-1">{item.label}</span>
                {item.badge != null && (
                  <span
                    className={`text-[11px] font-semibold rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
                      active ? 'bg-accent-600 text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Help card per rol */}
        <div className="p-3.5 rounded-xl bg-primary-50 text-primary-700 text-xs flex flex-col gap-1.5">
          <strong className="font-semibold">Ai întrebări?</strong>
          <span className="text-primary-600">
            {isAdmin
              ? 'Verifică ghidul administrativ sau scrie pe Teams.'
              : isProfessor
                ? 'Vezi ghidul rapid pentru profesori sau scrie pe Teams.'
                : 'Scrie-ne pe Teams sau citește ghidul rapid.'}
          </span>
          <Link
            to={isAdmin ? '/guide/admin' : isProfessor ? '/guide/professor' : '/guide'}
            className="mt-1 text-accent-700 font-semibold no-underline hover:underline"
          >
            {isAdmin ? 'Ghid admin →' : isProfessor ? 'Ghid profesori →' : 'Ghid pentru studenți →'}
          </Link>
        </div>

        {/* Settings + logout */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 mt-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 text-left"
          aria-label="Deconectare din cont"
        >
          <ArrowRightOnRectangleIcon className="w-[18px] h-[18px] text-neutral-500" aria-hidden={true} />
          Deconectare
        </button>
        <ConfirmDialog
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={async () => {
            setShowLogoutConfirm(false);
            await handleLogout();
          }}
          title="Confirmă deconectarea"
          message="Sigur vrei să te deconectezi? Va trebui să te autentifici din nou pentru a accesa platforma."
          confirmText="Deconectare"
          cancelText="Anulează"
          variant="warning"
        />
      </nav>

      {/* ── Main column ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          role="banner"
          className="h-16 px-4 md:px-8 flex items-center gap-3 md:gap-4 bg-white border-b border-neutral-100 sticky top-0 z-10"
        >
          {/* Hamburger pe mobile */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Deschide meniul"
            aria-expanded={mobileNavOpen}
            className="md:hidden p-2 -ml-2 rounded-md hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40"
          >
            <Bars3Icon className="w-5 h-5 text-neutral-700" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => (window as any).__openCommandPalette?.()}
            aria-label="Deschide paleta de comenzi"
            className="flex-1 max-w-[440px] h-9 flex items-center gap-2.5 px-3.5 bg-neutral-50 rounded-md text-[13px] text-neutral-400 hover:bg-neutral-100 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40"
          >
            <MagnifyingGlassIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate text-left hidden sm:inline">Caută o disciplină sau un profesor...</span>
            <span className="flex-1 truncate text-left sm:hidden">Caută...</span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 bg-white border border-neutral-200 rounded hidden sm:inline">⌘ K</span>
          </button>

          <div className="flex-1 hidden md:block" />

          {(platformStatus?.deadline || (platformStatus && !platformStatus.is_active)) && (
            <div className="hidden lg:block">
              <DeadlineTimer
                deadline={platformStatus.deadline}
                platformClosed={!platformStatus.is_active}
                variant="inline"
              />
            </div>
          )}

          <AccessibilityMenu />

          <NotificationsDropdown />

          <div className="flex items-center gap-2.5 pl-1 pr-1 md:pr-3 py-1 rounded-full bg-neutral-50">
            <Avatar
              initials={userInitials}
              tone={isAdmin ? 'primary' : isProfessor ? 'mint' : 'accent'}
              size={28}
            />
            <div className="hidden md:block text-[13px] leading-tight">
              <div className="font-medium text-neutral-800">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[11px] text-neutral-400">
                {roleLabel} · {roleMeta}
              </div>
            </div>
          </div>
        </header>

        {platformStatus && !platformStatus.is_active && (
          <div
            role="alert"
            className="bg-warning-bg border-b border-amber-200 px-4 md:px-10 py-3 flex items-start gap-3"
          >
            <ExclamationCircleIcon className="w-5 h-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <strong className="text-sm font-semibold text-warning-fg">
                Platforma de evaluare este {isAdmin ? 'DEZACTIVATĂ' : 'închisă'}
              </strong>
              <p className="text-sm text-warning-fg mt-0.5">
                {platformStatus.closure_message ||
                  (isAdmin
                    ? 'Studenții nu pot completa evaluări momentan. Activează din panoul de control.'
                    : 'Vei putea relua completarea când platforma va fi redeschisă.')}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin/controls')}
                className="text-sm font-semibold text-warning-fg underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-warning rounded px-1"
              >
                Activează →
              </button>
            )}
          </div>
        )}

        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          className="flex-1 overflow-auto px-4 md:px-10 pt-6 md:pt-8 pb-16 focus:outline-none"
        >
          <div key={location.pathname} className="ecd-page-transition">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
