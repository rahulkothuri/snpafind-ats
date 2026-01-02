/**
 * Integration Test: Role-Based UI Behavior
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 * 
 * Tests the complete role-based UI workflow:
 * 1. Test dashboard rendering for different roles
 * 2. Test stage import modal functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '../../pages/DashboardPage';
import { StageImportModal } from '../../components/StageImportModal';
import * as authHook from '../../hooks/useAuth';
import * as dashboardHook from '../../hooks/useDashboard';
import * as tasksHook from '../../hooks/useTasks';
import api from '../../services/api';

// Mock all the hooks
const mockUseAuth = vi.spyOn(authHook, 'useAuth');
const mockUseDashboard = vi.spyOn(dashboardHook, 'useDashboard');
const mockUseTasks = vi.spyOn(tasksHook, 'useTasks');

// Mock the API module
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

// Mock dashboard data
const mockDashboardData = {
  metrics: {
    openRoles: 5,
    activeCandidates: 120,
    interviewsThisWeek: 15,
    interviewsToday: 3,
    offersPending: 2,
    totalHires: 10,
    timeToFillMedian: 25,
  },
  rolePipeline: [
    { id: '1', role: 'Software Engineer', location: 'Remote', applicants: 50, interview: 10, offer: 2, sla: 'On Track' },
    { id: '2', role: 'Product Manager', location: 'NYC', applicants: 30, interview: 5, offer: 1, sla: 'At risk' },
  ],
  funnel: [
    { name: 'Applied', count: 100 },
    { name: 'Screened', count: 60 },
    { name: 'Interview', count: 30 },
    { name: 'Offer', count: 10 },
    { name: 'Hired', count: 5 },
  ],
  sources: [
    { source: 'LinkedIn', percentage: 40 },
    { source: 'Referral', percentage: 30 },
    { source: 'Indeed', percentage: 20 },
  ],
  interviews: [
    { id: '1', candidateName: 'John Doe', role: 'Software Engineer', time: '10:00 AM', meetingType: 'Google Meet' },
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
    
    // Re-setup spies before each test since restoreAllMocks removes them
    mockUseAuth.mockReset();
    mockUseDashboard.mockReset();
    mockUseTasks.mockReset();
  });

  afterEach(() => {
    // Don't restore all mocks - just clear them
    vi.clearAllMocks();
  });

  /**
   * Test 1: Admin dashboard renders correctly
   * Requirements: 5.1, 5.2
   */
  it('should render dashboard for admin user', async () => {
    // Mock auth hook for admin user
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Mock dashboard hook with actual data
    mockUseDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Mock tasks hook
    mockUseTasks.mockReturnValue({
      tasks: [],
      isLoading: false,
      createTask: { mutate: vi.fn() },
      toggleTask: { mutate: vi.fn() },
      deleteTask: { mutate: vi.fn() },
    });

    renderWithProviders(<DashboardPage />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Admin should see the Active Role Pipelines section
    expect(screen.getByText('Active Role Pipelines')).toBeInTheDocument();
    
    // Admin should see KPI cards
    expect(screen.getByText('Active Jobs')).toBeInTheDocument();
    expect(screen.getByText('Total Candidates')).toBeInTheDocument();
  });

  /**
   * Test 2: Hiring manager dashboard renders correctly
   * Requirements: 5.1, 5.2
   */
  it('should render dashboard for hiring manager', async () => {
    // Mock auth hook for hiring manager
    mockUseAuth.mockReturnValue({
      user: mockHiringManagerUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Mock dashboard hook with actual data
    mockUseDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Mock tasks hook
    mockUseTasks.mockReturnValue({
      tasks: [],
      isLoading: false,
      createTask: { mutate: vi.fn() },
      toggleTask: { mutate: vi.fn() },
      deleteTask: { mutate: vi.fn() },
    });

    renderWithProviders(<DashboardPage />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Hiring manager should see the Active Role Pipelines section
    expect(screen.getByText('Active Role Pipelines')).toBeInTheDocument();
  });

  /**
   * Test 3: Stage import modal functionality
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

    // Mock API to return empty jobs array (all jobs filtered out because current job is excluded)
    vi.mocked(api.get).mockResolvedValue({ data: [] });

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

    // Wait for loading to complete and show "No jobs available" message
    await waitFor(() => {
      expect(screen.getByText('No jobs available for import.')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  /**
   * Test 4: Dashboard shows hiring funnel
   * Requirements: 5.5
   */
  it('should show hiring funnel on dashboard', async () => {
    // Mock auth hook
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Mock dashboard hook with actual data
    mockUseDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Mock tasks hook
    mockUseTasks.mockReturnValue({
      tasks: [],
      isLoading: false,
      createTask: { mutate: vi.fn() },
      toggleTask: { mutate: vi.fn() },
      deleteTask: { mutate: vi.fn() },
    });

    renderWithProviders(<DashboardPage />);

    // Wait for dashboard to render
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show hiring funnel section
    expect(screen.getByText('Hiring Funnel')).toBeInTheDocument();
    
    // Should show funnel stages from mock data
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Screened')).toBeInTheDocument();
  });
});
