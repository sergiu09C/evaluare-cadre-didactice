import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { KeyboardShortcutsHelp } from './components/a11y';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

// Lazy-load less-frequent routes to keep initial JS small
const EvaluationForm = lazy(() => import('./pages/EvaluationForm'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminControls = lazy(() => import('./pages/AdminControls'));
const AdminReports = lazy(() => import('./pages/AdminReports'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminClosingLoop = lazy(() => import('./pages/AdminClosingLoop'));
const AdminGuides = lazy(() => import('./pages/AdminGuides'));
const AdminAchievements = lazy(() => import('./pages/AdminAchievements'));
const AdminActionTemplates = lazy(() => import('./pages/AdminActionTemplates'));
const AdminKPIs = lazy(() => import('./pages/AdminKPIs'));
const AdminPlatformFeedback = lazy(() => import('./pages/AdminPlatformFeedback'));
const PlatformFeedback = lazy(() => import('./pages/PlatformFeedback'));
const EvaluationLifecycle = lazy(() => import('./pages/EvaluationLifecycle'));
const ProfessorDetails = lazy(() => import('./pages/ProfessorDetails'));
const ProfessorDashboard = lazy(() => import('./pages/ProfessorDashboard'));
const ProfessorCourseDetails = lazy(() => import('./pages/ProfessorCourseDetails'));
const ProfessorReports = lazy(() => import('./pages/ProfessorReports'));
const ProfessorCourses = lazy(() => import('./pages/ProfessorCourses'));
const ProfessorStudents = lazy(() => import('./pages/ProfessorStudents'));
const ProfessorActions = lazy(() => import('./pages/ProfessorActions'));
const ProfessorEvaluationDetails = lazy(() => import('./pages/ProfessorEvaluationDetails'));
const Achievements = lazy(() => import('./pages/Achievements'));
const EvaluationHistory = lazy(() => import('./pages/EvaluationHistory'));
const AggregatedResults = lazy(() => import('./pages/AggregatedResults'));
const ActiveEvaluations = lazy(() => import('./pages/ActiveEvaluations'));
// Placeholder used to ensure the module is in graph (TS-friendly)
const StaticPages = lazy(() =>
  import('./pages/StaticPages').then(() => ({
    default: () => null,
  })),
);
const Terms = lazy(() => import('./pages/StaticPages').then((m) => ({ default: m.Terms })));
const Privacy = lazy(() => import('./pages/StaticPages').then((m) => ({ default: m.Privacy })));
// Guides citesc dinamic din DB (editabili de admin)
const DynamicGuideLazy = lazy(() => import('./pages/DynamicGuide'));
const Guide = () => <DynamicGuideLazy role="student" />;
const GuideProfessor = () => <DynamicGuideLazy role="professor" />;
const GuideAdmin = () => <DynamicGuideLazy role="admin" />;

void StaticPages; // keep TS happy if not used directly

function RouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-busy="true">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600" aria-hidden="true" />
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({
  children,
  requireAdmin = false,
  requireProfessor = false
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireProfessor?: boolean;
}) {
  const { isAuthenticated, isAdmin, isProfessor, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Se încarcă...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireProfessor && !isProfessor) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Router Component
function AppRoutes() {
  const { isAuthenticated, isAdmin, isProfessor, loading } = useAuth();
  const navigate = useNavigate();

  // Global keyboard shortcuts
  // Alt + H - Go to home page
  useKeyboardShortcut({
    key: 'h',
    altKey: true,
    onShortcut: () => {
      if (isAuthenticated) {
        if (isAdmin) {
          navigate('/admin');
        } else if (isProfessor) {
          navigate('/professor');
        } else {
          navigate('/');
        }
      }
    },
    enabled: isAuthenticated,
  });

  // Alt + C - Focus main content
  useKeyboardShortcut({
    key: 'c',
    altKey: true,
    onShortcut: () => {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Se încarcă...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global Keyboard Shortcuts Help - Triggered with ? key */}
      <KeyboardShortcutsHelp />

      <Suspense fallback={<RouteLoader />}>
      <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated
            ? isAdmin
              ? <Navigate to="/admin" replace />
              : isProfessor
              ? <Navigate to="/professor" replace />
              : <Navigate to="/" replace />
            : <LoginPage />
        }
      />

      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Home — Lifecycle pentru toate rolurile (decizie produs:
          studentul/profesorul/adminul vede întâi „călătoria evaluării"). */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              {isAdmin ? <Navigate to="/admin" replace /> : isProfessor ? <Navigate to="/professor" replace /> : <EvaluationLifecycle />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <StudentDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluation/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <EvaluationForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluations"
        element={
          <ProtectedRoute>
            <Layout>
              <ActiveEvaluations />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <Layout>
              <EvaluationHistory />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <Layout>
              <AggregatedResults />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/achievements"
        element={
          <ProtectedRoute>
            <Layout>
              <Achievements />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/guide"
        element={
          <ProtectedRoute>
            <Layout>
              <Guide />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/guide/professor"
        element={
          <ProtectedRoute requireProfessor>
            <Layout>
              <GuideProfessor />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/guide/admin"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <GuideAdmin />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Public static pages (no auth required) */}
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* Admin Routes — Acasă = Lifecycle */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <EvaluationLifecycle />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/controls"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminControls />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminReports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminUsers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/closing-loop"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminClosingLoop />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/guides"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminGuides />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/achievements"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminAchievements />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/action-templates"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminActionTemplates />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/kpis"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminKPIs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/platform-feedback"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminPlatformFeedback />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <Layout>
              <PlatformFeedback />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lifecycle"
        element={
          <ProtectedRoute>
            <Layout>
              <EvaluationLifecycle />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/professor/:id"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <ProfessorDetails />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Professor Routes — Acasă = Lifecycle */}
      <Route
        path="/professor"
        element={
          <ProtectedRoute requireProfessor>
            <Layout>
              <EvaluationLifecycle />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/dashboard"
        element={
          <ProtectedRoute requireProfessor>
            <Layout>
              <ProfessorDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/courses"
        element={
          <ProtectedRoute requireProfessor>
            <Layout>
              <ProfessorCourses />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/students"
        element={
          <ProtectedRoute requireProfessor>
            <Layout>
              <ProfessorStudents />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/actions"
        element={
          <ProtectedRoute requireProfessor>
            <Layout>
              <ProfessorActions />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/course/:id"
        element={
          <ProtectedRoute requireProfessor>
            <Layout>
              <ProfessorCourseDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/reports"
        element={
          <ProtectedRoute requireProfessor>
            <Layout>
              <ProfessorReports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/evaluations/:id"
        element={
          <ProtectedRoute requireProfessor>
            <Layout>
              <ProfessorEvaluationDetails />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AccessibilityProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AccessibilityProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
