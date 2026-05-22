import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { LoadingSpinner } from '../ui/loading-spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner size="lg" label="Checking authentication..." className="mt-32" />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
