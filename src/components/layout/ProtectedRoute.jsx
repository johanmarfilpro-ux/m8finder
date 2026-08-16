import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

export default function ProtectedRoute({ adminOnly = false }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center text-sm text-slate-500">
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/recherche" replace />;
  }

  return <Outlet />;
}
