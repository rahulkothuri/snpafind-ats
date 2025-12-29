import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage, SignupPage, DashboardPage, RolesPage, CandidateDatabasePage, SettingsPage, JobCreationPage, JobDetailsPage, ApplicationPage, CandidateProfilePage, InterviewDashboardPage, AnalyticsPage, GoogleOAuthCallbackPage, MicrosoftOAuthCallbackPage } from './pages';
import ChartDemoPage from './pages/ChartDemoPage';
import { useAuth } from './hooks/useAuth';
import { JobProtectedRoute, RoleProtectedRoute } from './components';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b6cf0]"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/roles" element={
            <ProtectedRoute>
              <RolesPage />
            </ProtectedRoute>
          } />
          <Route path="/candidates" element={
            <ProtectedRoute>
              <CandidateDatabasePage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/jobs/new" element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['admin', 'hiring_manager']}>
                <JobCreationPage />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="/jobs/:id" element={
            <ProtectedRoute>
              <JobProtectedRoute>
                <JobDetailsPage />
              </JobProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="/jobs/:id/edit" element={
            <ProtectedRoute>
              <JobProtectedRoute requireEdit={true}>
                <JobCreationPage />
              </JobProtectedRoute>
            </ProtectedRoute>
          } />
          {/* Public route - no auth required */}
          <Route path="/apply/:jobId" element={<ApplicationPage />} />
          {/* Candidate Profile Page - Requirements 5.1 */}
          <Route path="/candidates/:id" element={
            <ProtectedRoute>
              <CandidateProfilePage />
            </ProtectedRoute>
          } />
          {/* Interview Dashboard Page - Requirements 11.1-11.5, 12.1-12.5, 13.1-13.4 */}
          <Route path="/interviews" element={
            <ProtectedRoute>
              <InterviewDashboardPage />
            </ProtectedRoute>
          } />
          {/* Analytics Page - Requirements 17.1 */}
          <Route path="/analytics" element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          {/* OAuth Callback Pages - Requirements 4.1, 5.1 */}
          <Route path="/oauth/google/callback" element={<GoogleOAuthCallbackPage />} />
          <Route path="/oauth/microsoft/callback" element={<MicrosoftOAuthCallbackPage />} />
          {/* Chart Demo Page - Task 15: Frontend Components Checkpoint */}
          <Route path="/chart-demo" element={
            <ProtectedRoute>
              <ChartDemoPage />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
