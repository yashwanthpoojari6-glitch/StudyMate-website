// components/PrivateRoute.jsx — Guard component for authenticated routes
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PageSkeleton = () => (
  <div className="flex-1 p-6 space-y-4">
    <div className="skeleton h-8 w-64 mb-6" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton h-32 rounded-xl" />
      ))}
    </div>
    <div className="skeleton h-64 rounded-xl" />
  </div>
);

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  return user ? children : <Navigate to="/login" replace />;
}
