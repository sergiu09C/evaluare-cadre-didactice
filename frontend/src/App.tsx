import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { KeyboardShortcutsHelp } from './components/a11y';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import EvaluationForm from './pages/EvaluationForm';
import AdminDashboard from './pages/AdminDashboard';
import AdminControls from './pages/AdminControls';
import AdminReports from './pages/AdminReports';
import ProfessorDetails from './pages/ProfessorDetails';
import ProfessorDashboard from './pages/ProfessorDashboard';
import ProfessorCourseDetails from './pages/ProfessorCourseDetails';
import ProfessorReports from './pages/ProfessorReports';
import Layout from './components/Layout';

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

      {/* Student Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              {isAdmin ? <Navigate to="/admin" replace /> : isProfessor ? <Navigate to="/professor" replace /> : <StudentDashboard />}
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

      {/* Admin Routes */}
      <Route
        path="/admin"
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
        path="/admin/professor/:id"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <ProfessorDetails />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Professor Routes */}
      <Route
        path="/professor"
        element={
          <ProtectedRoute requireProfessor>
            <Layout>
              <ProfessorDashboard />
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

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <AppRoutes />
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
