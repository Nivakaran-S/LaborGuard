import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// FIX: Standardized all role checks to 'lawyer' to match the backend User model enum:
// enum: ['worker', 'lawyer', 'ngo', 'employer', 'admin']
// generateAccessToken(user._id, user.email, user.role) embeds user.role from the DB.
// The JWT therefore always carries 'lawyer', never 'legal_officer'.
// Previous comment "backend uses 'legal_officer'" was incorrect.

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to the correct dashboard based on the user's actual role
    if (user?.role === 'admin')    return <Navigate to="/admin/dashboard"    replace />;
    if (user?.role === 'worker')   return <Navigate to="/worker/dashboard"   replace />;
    if (user?.role === 'employer') return <Navigate to="/employer/dashboard" replace />;
    if (user?.role === 'lawyer')   return <Navigate to="/legal/dashboard"    replace />; // FIX: was 'legal_officer'
    if (user?.role === 'ngo')      return <Navigate to="/ngo/dashboard"      replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    if (user?.role === 'admin')    return <Navigate to="/admin/dashboard"    replace />;
    if (user?.role === 'worker')   return <Navigate to="/worker/dashboard"   replace />;
    if (user?.role === 'employer') return <Navigate to="/employer/dashboard" replace />;
    if (user?.role === 'lawyer')   return <Navigate to="/legal/dashboard"    replace />; // FIX: was 'legal_officer'
    if (user?.role === 'ngo')      return <Navigate to="/ngo/dashboard"      replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};