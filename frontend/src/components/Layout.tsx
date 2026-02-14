import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import AccessibilityMenu from './AccessibilityMenu';
import { SkipLink } from './a11y';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin, isProfessor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleGoHome = () => {
    if (isAdmin) {
      navigate('/admin');
    } else if (isProfessor) {
      navigate('/professor');
    } else {
      navigate('/');
    }
  };

  const isOnHomePage = location.pathname === (isAdmin ? '/admin' : isProfessor ? '/professor' : '/');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Links */}
      <SkipLink href="#main-content">Sari la conținut principal</SkipLink>

      {/* Header */}
      <header role="banner" className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Title */}
            <div className="flex items-center space-x-6">
              <button
                onClick={handleGoHome}
                className="text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer focus:outline-none"
                aria-label="Mergi la pagina principală - Evaluare Cadre Didactice"
              >
                Evaluare Cadre Didactice
              </button>

              {/* Professor Navigation Menu */}
              {isProfessor && (
                <nav aria-label="Meniu principal profesor" className="flex items-center space-x-4">
                  <button
                    onClick={() => navigate('/professor')}
                    className={`flex items-center text-sm font-medium transition-colors ${
                      location.pathname === '/professor'
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-primary-600'
                    }`}
                    aria-current={location.pathname === '/professor' ? 'page' : undefined}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/professor/reports')}
                    className={`flex items-center text-sm font-medium transition-colors ${
                      location.pathname === '/professor/reports'
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-primary-600'
                    }`}
                    aria-current={location.pathname === '/professor/reports' ? 'page' : undefined}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Rapoarte
                  </button>
                </nav>
              )}

              {/* Quick Home Link for non-professor pages */}
              {!isProfessor && !isOnHomePage && (
                <nav aria-label="Navigare rapidă">
                  <button
                    onClick={handleGoHome}
                    className="flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
                    aria-label="Înapoi la pagina principală"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Acasă
                  </button>
                </nav>
              )}
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              {/* Accessibility Menu */}
              <AccessibilityMenu />

              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {isAdmin ? 'Administrator' : isProfessor ? 'Profesor' : 'Student'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary text-sm"
                aria-label="Deconectare din cont"
              >
                Deconectare
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {children}
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="mt-auto py-6 text-center text-sm text-gray-500">
        <p>&copy; 2024 Universitatea. Toate drepturile rezervate.</p>
      </footer>
    </div>
  );
}
