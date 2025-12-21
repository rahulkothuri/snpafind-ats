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

// Mock all the hooks
const mockUseAuth = vi.spyOn(authHook, 'useAuth');
const mockUseDashboard = vi.spyOn(dashboardHook, 'useDashboard');

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

    // Mock dashboard hook with null data to use sample data
    mockUseDashboard.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Admin should see the Role-wise Pipeline section
    expect(screen.getByText('Role-wise Pipeline')).toBeInTheDocument();
    
    // Admin should see KPI cards
    expect(screen.getByText('Open Roles')).toBeInTheDocument();
    expect(screen.getByText('Active Candidates')).toBeInTheDocument();
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

    // Mock dashboard hook with null data to use sample data
    mockUseDashboard.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Hiring manager should see the Role-wise Pipeline section
    expect(screen.getByText('Role-wise Pipeline')).toBeInTheDocument();
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

    // Mock dashboard hook with null data to use sample data
    mockUseDashboard.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);

    // Wait for dashboard to render
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show hiring funnel section
    expect(screen.getByText('Hiring Funnel')).toBeInTheDocument();
    
    // Should show funnel stages
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Screened')).toBeInTheDocument();
  });
});
