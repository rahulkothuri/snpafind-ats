/**
 * JobProtectedRoute Component - Requirements 5.4, 5.5
 * 
 * Route guard for job-specific pages that validates user permissions
 * before allowing access to job details, editing, or management.
 * 
 * Features:
 * - Permission validation for job access
 * - Loading states during permission checks
 * - Redirect logic for unauthorized access
 * - Role-based access control
 */

import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner, ErrorMessage } from './';
import api from '../services/api';

interface JobProtectedRouteProps {
  children: React.ReactNode;
  requireEdit?: boolean; // Whether the route requires edit permissions
}

interface JobAccessResponse {
  hasAccess: boolean;
  canEdit: boolean;
  job?: {
    id: string;
    title: string;
    assignedRecruiterId?: string;
  };
}

export function JobProtectedRoute({ children, requireEdit = false }: JobProtectedRouteProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { id: jobId } = useParams<{ id: string }>();
  const [isValidating, setIsValidating] = useState(true);
  const [accessData, setAccessData] = useState<JobAccessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && jobId) {
      validateJobAccess();
    }
  }, [authLoading, isAuthenticated, user, jobId]);

  const validateJobAccess = async () => {
    if (!jobId || !user) return;

    setIsValidating(true);
    setError(null);

    try {
      // First, try to fetch the job to check if it exists and if user has access
      const response = await api.get(`/jobs/${jobId}`);
      const job = response.data;

      // Determine access permissions based on user role
      let hasAccess = false;
      let canEdit = false;

      if (user.role === 'admin') {
        // Admins have full access to all jobs
        hasAccess = true;
        canEdit = true;
      } else if (user.role === 'hiring_manager') {
        // Hiring managers have full access to all jobs in their company
        hasAccess = true;
        canEdit = true;
      } else if (user.role === 'recruiter') {
        // Recruiters can only access jobs assigned to them
        hasAccess = job.assignedRecruiterId === user.id;
        canEdit = hasAccess; // Recruiters can edit jobs assigned to them
      }

      setAccessData({
        hasAccess,
        canEdit,
        job: {
          id: job.id,
          title: job.title,
          assignedRecruiterId: job.assignedRecruiterId,
        },
      });
    } catch (err: any) {
      console.error('Failed to validate job access:', err);
      
      if (err.response?.status === 404) {
        setError('Job not found');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access this job');
      } else {
        setError('Failed to validate job access. Please try again.');
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Show loading spinner while auth is loading
  if (authLoading) {
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

  // Show loading spinner while validating job access
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Validating permissions...</p>
        </div>
      </div>
    );
  }

  // Show error if validation failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <ErrorMessage
            message={error}
            onRetry={() => validateJobAccess()}
          />
          {(error.includes('not found') || error.includes('permission')) && (
            <div className="mt-4 text-center">
              <button
                onClick={() => window.history.back()}
                className="text-[#0b6cf0] hover:text-[#0952b8] text-sm font-medium"
              >
                ← Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check if user has access to the job
  if (!accessData?.hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if route requires edit permissions and user doesn't have them
  if (requireEdit && !accessData.canEdit) {
    return <Navigate to={`/jobs/${jobId}`} replace />;
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}

export default JobProtectedRoute;