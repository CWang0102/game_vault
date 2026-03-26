import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-text">LOADING...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-text">LOADING...</div>
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : children;
}

function RootRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-text">LOADING...</div>
      </div>
    );
  }

  return user?.role === 'root' ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <>
      <style>{`
        .loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-deep);
        }
        .loading-text {
          font-family: var(--font-display);
          font-size: 14px;
          color: var(--amber-glow);
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RootRoute>
                <Admin />
              </RootRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
