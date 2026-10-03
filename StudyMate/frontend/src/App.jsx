// App.jsx — Root application with routing, auth context, and global providers
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Suspense, lazy } from 'react';

// Layout components
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import PrivateRoute, { PageSkeleton } from './components/PrivateRoute';

// Page components — lazily loaded for performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NotesStudio = lazy(() => import('./pages/NotesStudio'));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'));
const TaskBoard = lazy(() => import('./pages/TaskBoard'));
const FocusRoom = lazy(() => import('./pages/FocusRoom'));
const FlashcardPage = lazy(() => import('./pages/FlashcardPage'));
const PublicNoteView = lazy(() => import('./pages/PublicNoteView'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

// ── App shell with sidebar + main content ──────────────────────────────────────
const AppShell = ({ children }) => {
  const { user } = useAuth();
  if (!user) return children; // Auth pages don't use the shell

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
};

// ── Root App ──────────────────────────────────────────────────────────────────
function AppInner() {
  return (
    <Router>
      <AppShell>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/note/public/:shareToken" element={<PublicNoteView />} />

            {/* Protected routes */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/notes" element={<PrivateRoute><NotesStudio /></PrivateRoute>} />
            <Route path="/notes/:id" element={<PrivateRoute><NotesStudio /></PrivateRoute>} />
            <Route path="/subjects" element={<PrivateRoute><SubjectsPage /></PrivateRoute>} />
            <Route path="/tasks" element={<PrivateRoute><TaskBoard /></PrivateRoute>} />
            <Route path="/focus" element={<PrivateRoute><FocusRoom /></PrivateRoute>} />
            <Route path="/flashcards" element={<PrivateRoute><FlashcardPage /></PrivateRoute>} />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>

      {/* Global toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#151C2C',
            color: '#F1F5F9',
            border: '1px solid #1E293B',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#0B0F17' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#0B0F17' } },
          duration: 4000,
        }}
      />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
