import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  // Still loading — render nothing (App-level spinner handles this)
  if (user === undefined) return null;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
