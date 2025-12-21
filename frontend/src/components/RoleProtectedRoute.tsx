/**
 * RoleProtectedRoute Component - Requirements 5.2, 5.4, 5.5
 * 
 * Route guard that validates user roles before allowing access to specific routes.
 * Used for protecting routes that require specific user roles.
 * 
 * Features:
 * - Role-based access control
 * - Redirect logic for unauthorized access
 * - Support for multiple allowed roles
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from './';
import type { UserRole } from '../types';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard' 
}: RoleProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}

export default RoleProtectedRoute;