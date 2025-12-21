/**
 * Integration Test: Role-Based UI Behavior
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 * 
 * Tests the complete role-based UI workflow:
 * 1. Test dashboard job visibility for different roles
 * 2. Test job creation page with stage import functionality
 * 3. Test job detail page access controls
 * 4. Test route protection and redirects
 * 5. Test real-time permission updates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '../../pages/DashboardPage';
import { JobCreationPage } from '../../pages/JobCreationPage';
import { JobDetailsPage } from '../../pages/JobDetailsPage';
import { JobProtectedRoute } from '../../components/JobProtectedRoute';
import { StageImportModal } from '../../components/StageImportModal';
import * as authHook from '../../hooks/useAuth';
import * as dashboardHook from '../../hooks/useDashboard';
import * as usersHook from '../../hooks/useUsers';
import * as jobsHook from '../../hooks/useJobs';
import * as candidatesHook from '../../hooks/useCandidates';

// Mock all the hooks
const mockUseAuth = vi.spyOn(authHook, 'useAuth');
const mockUseDashboard = vi.spyOn(dashboardHook, 'useDashboard');
const mockUseUsers = vi.spyOn(usersHook, 'useUsers');
const mockUseJob = vi.spyOn(jobsHook, 'useJob');
const mockUseCandidates = vi.spyOn(candidatesHook, 'useCandidates');

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
const mockUseParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

// Mock API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Test data
const mockCompanyId = 'test-company-id';
const mockAdminUser = {
  id: 'admin-user-id',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'admin' as const,
  companyId: mockCompanyId,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockHiringManagerUser = {
  id: 'hm-user-id',
  name: 'Hiring Manager',
  email: 'hm@test.com',
  role: 'hiring_manager' as const,
  companyId: mockCompanyId,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockRecruiterUser = {
  id: 'recruiter-user-id',
  name: 'Recruiter User',
  email: 'recruiter@test.com',
  role: 'recruiter' as const,
  companyId: mockCompanyId,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockJobs = [
  {
    id: 'job-1',
    title: 'Software Engineer',
    department: 'Engineering',
    status: 'active',
    assignedRecruiterId: 'recruiter-user-id',
    companyId: mockCompanyId,
    createdAt: '2024-01-01T00:00:00Z',
    openings: 2,
  },
  {
    id: 'job-2',
    title: 'Product Manager',
    department: 'Product',
    status: 'active',
    assignedRecruiterId: null,
    companyId: mockCompanyId,
    createdAt: '2024-01-02T00:00:00Z',
    openings: 1,
  },
  {
    id: 'job-3',
    title: 'UX Designer',
    department: 'Design',
    status: 'active',
    assignedRecruiterId: 'other-recruiter-id',
    companyId: mockCompanyId,
    createdAt: '2024-01-03T00:00:00Z',
    openings: 1,
  },
];

const mockJobWithStages = {
  ...mockJobs[0],
  stages: [
    { id: 'stage-1', name: 'Applied', position: 0, isMandatory: true },
    { id: 'stage-2', name: 'Screening', position: 1, isMandatory: true },
    { id: 'stage-3', name: 'Interview', position: 2, isMandatory: false },
  ],
};

// Helper function to render components with router and query client
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Integration: Role-Based UI Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({ id: 'job-1' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test 1: Admin dashboard shows all jobs
   * Requirements: 5.1, 5.2
   */
  it('should show all jobs to admin user on dashboard', async () => {
    // Mock auth hook for admin user
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Mock dashboard hook
    mockUseDashboard.mockReturnValue({
      data: {
        metrics: {
          openRoles: 3,
          activeCandidates: 10,
          interviewsToday: 2,
          offersPending: 1,
          timeToFillMedian: 24,
          offerAcceptanceRate: 78,
        },
        rolePipeline: mockJobs.map(job => ({
          id: job.id,
          title: job.title,
          department: job.department,
          status: job.status,
          openings: job.openings,
          applied: 5,
          screening: 3,
          interview: 2,
          offer: 1,
          hired: 0,
        })),
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Admin should see all jobs in the role pipeline table
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Product Manager')).toBeInTheDocument();
    expect(screen.getByText('UX Designer')).toBeInTheDocument();
  });

  /**
   * Test 2: Hiring manager dashboard shows all jobs
   * Requirements: 5.1, 5.2
   */
  it('should show all jobs to hiring manager on dashboard', async () => {
    // Mock auth hook for hiring manager
    mockUseAuth.mockReturnValue({
      user: mockHiringManagerUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Mock dashboard hook
    mockUseDashboard.mockReturnValue({
      data: {
        metrics: {
          openRoles: 3,
          activeCandidates: 10,
          interviewsToday: 2,
          offersPending: 1,
          timeToFillMedian: 24,
          offerAcceptanceRate: 78,
        },
        rolePipeline: mockJobs.map(job => ({
          id: job.id,
          title: job.title,
          department: job.department,
          status: job.status,
          openings: job.openings,
          applied: 5,
          screening: 3,
          interview: 2,
          offer: 1,
          hired: 0,
        })),
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Hiring manager should see all jobs
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Product Manager')).toBeInTheDocument();
    expect(screen.getByText('UX Designer')).toBeInTheDocument();
  });

  /**
   * Test 3: Recruiter dashboard shows only assigned jobs
   * Requirements: 5.1, 5.2
   */
  it('should show only assigned jobs to recruiter on dashboard', async () => {
    // Mock auth hook for recruiter
    mockUseAuth.mockReturnValue({
      user: mockRecruiterUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Mock dashboard hook with filtered jobs for recruiter
    const recruiterJobs = mockJobs.filter(job => job.assignedRecruiterId === mockRecruiterUser.id);
    mockUseDashboard.mockReturnValue({
      data: {
        metrics: {
          openRoles: 1,
          activeCandidates: 5,
          interviewsToday: 1,
          offersPending: 0,
          timeToFillMedian: 24,
          offerAcceptanceRate: 78,
        },
        rolePipeline: recruiterJobs.map(job => ({
          id: job.id,
          title: job.title,
          department: job.department,
          status: job.status,
          openings: job.openings,
          applied: 5,
          screening: 3,
          interview: 2,
          offer: 1,
          hired: 0,
        })),
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should only see assigned job
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    
    // Should not see unassigned jobs
    expect(screen.queryByText('Product Manager')).not.toBeInTheDocument();
    expect(screen.queryByText('UX Designer')).not.toBeInTheDocument();
  });

  /**
   * Test 4: Job creation page with stage import functionality
   * Requirements: 5.3, 3.1, 3.4
   */
  it('should show stage import functionality on job creation page', async () => {
    // Mock auth hook for admin user
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Mock users hook
    mockUseUsers.mockReturnValue({
      data: [mockAdminUser],
      isLoading: false,
      error: null,
    });

    renderWithProviders(<JobCreationPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Create New Job Requisition')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Look for import stages button
    const importButton = screen.getByText('Import Stages');
    expect(importButton).toBeInTheDocument();
  });

  /**
   * Test 5: Stage import modal functionality
   * Requirements: 3.1, 3.2, 3.4
   */
  it('should handle stage import modal workflow', async () => {
    // Mock auth hook
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    const mockOnImport = vi.fn();
    const mockOnClose = vi.fn();

    renderWithProviders(
      <StageImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
        currentJobId="current-job-id"
      />
    );

    // Wait for modal to load
    await waitFor(() => {
      expect(screen.getByText('Import Pipeline Stages')).toBeInTheDocument();
    }, { timeout: 3000 });

    // The modal should show "No jobs available" initially since we're filtering out current job
    expect(screen.getByText('No jobs available for import.')).toBeInTheDocument();
  });

  /**
   * Test 6: Job protected route with valid access
   * Requirements: 5.4, 5.5
   */
  it('should allow access to job details for authorized users', async () => {
    // Mock auth hook for admin user
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Mock API to return job data
    const api = await import('../../services/api');
    vi.mocked(api.default.get).mockResolvedValue({
      data: mockJobWithStages,
    });

    const TestComponent = () => <div>Protected Content</div>;

    renderWithProviders(
      <JobProtectedRoute>
        <TestComponent />
      </JobProtectedRoute>
    );

    // Wait for permission validation
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  /**
   * Test 7: Job protected route with unauthorized access
   * Requirements: 5.4, 5.5
   */
  it('should deny access to job details for unauthorized users', async () => {
    // Mock auth hook for recruiter user
    mockUseAuth.mockReturnValue({
      user: mockRecruiterUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Mock API to reject with 403
    const api = await import('../../services/api');
    vi.mocked(api.default.get).mockRejectedValue({
      response: { status: 403 },
    });

    const TestComponent = () => <div>Protected Content</div>;

    renderWithProviders(
      <JobProtectedRoute>
        <TestComponent />
      </JobProtectedRoute>
    );

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('You do not have permission to access this job')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should not see protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  /**
   * Test 8: Job details page with role-based actions
   * Requirements: 5.2, 5.3
   */
  it('should show appropriate actions based on user role in job details', async () => {
    // Mock auth hook for recruiter user
    mockUseAuth.mockReturnValue({
      user: mockRecruiterUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Mock job hook
    mockUseJob.mockReturnValue({
      data: mockJobWithStages,
      isLoading: false,
      error: null,
    });

    // Mock candidates hook
    mockUseCandidates.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithProviders(<JobDetailsPage />);

    // Wait for job details to load
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should see pipeline stages
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Screening')).toBeInTheDocument();
  });

  /**
   * Test 9: Loading states during permission validation
   * Requirements: 5.4, 5.5
   */
  it('should show loading states during permission validation', async () => {
    // Mock auth hook
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Mock slow API response
    const api = await import('../../services/api');
    let resolvePromise: (value: any) => void;
    const slowPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(api.default.get).mockReturnValue(slowPromise);

    const TestComponent = () => <div>Protected Content</div>;

    renderWithProviders(
      <JobProtectedRoute>
        <TestComponent />
      </JobProtectedRoute>
    );

    // Should show loading state
    expect(screen.getByText('Validating permissions...')).toBeInTheDocument();

    // Resolve the promise
    resolvePromise!({ data: mockJobWithStages });

    // Wait for content to appear
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Loading state should be gone
    expect(screen.queryByText('Validating permissions...')).not.toBeInTheDocument();
  });

  /**
   * Test 10: Error handling in UI components
   * Requirements: 5.5
   */
  it('should handle API errors gracefully in UI components', async () => {
    // Mock auth hook
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Mock dashboard hook to return error
    const mockRefetch = vi.fn();
    mockUseDashboard.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    renderWithProviders(<DashboardPage />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show retry option
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();

    // Mock successful retry
    mockUseDashboard.mockReturnValue({
      data: {
        metrics: {
          openRoles: 3,
          activeCandidates: 10,
          interviewsToday: 2,
          offersPending: 1,
          timeToFillMedian: 24,
          offerAcceptanceRate: 78,
        },
        rolePipeline: mockJobs.map(job => ({
          id: job.id,
          title: job.title,
          department: job.department,
          status: job.status,
          openings: job.openings,
          applied: 5,
          screening: 3,
          interview: 2,
          offer: 1,
          hired: 0,
        })),
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    // Click retry
    fireEvent.click(retryButton);

    // Verify refetch was called
    expect(mockRefetch).toHaveBeenCalled();
  });
});