import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GhostModeProvider } from './context/GhostModeContext';
import { TypingProvider } from './context/TypingContext';
import ErrorBoundary from './components/UI/ErrorBoundary';
import AuthPortal from './pages/AuthPortal';
import InboxList from './pages/InboxList';
import ChatWindow from './pages/ChatWindow';
import ContactsList from './pages/ContactsList';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/inbox" replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <GhostModeProvider>
              <TypingProvider>
            <div className="h-screen w-screen bg-bg-void overflow-hidden">
              <Routes>
                <Route path="/" element={<PublicRoute><AuthPortal /></PublicRoute>} />
                <Route path="/inbox" element={<ProtectedRoute><InboxList /></ProtectedRoute>} />
                <Route path="/chat/:userId" element={<ProtectedRoute><ChatWindow /></ProtectedRoute>} />
                <Route path="/contacts" element={<ProtectedRoute><ContactsList /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
              </TypingProvider>
            </GhostModeProvider>
          </AuthProvider>
        </ThemeProvider>
    </ErrorBoundary>
  );
}
