/**
 * **Feature: ats-enhancements-phase2, Property 5: Sidebar toggle state**
 * **Validates: Requirements 3.8**
 * 
 * For any initial sidebar state (expanded or collapsed), clicking the menu toggle icon 
 * should change the state to the opposite value (expanded becomes collapsed, collapsed becomes expanded).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';

// Mock user for testing
const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin' as const,
  companyId: 'company-1',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Helper to render Sidebar with router context
function renderSidebar(collapsed: boolean, onToggle: () => void) {
  cleanup(); // Ensure clean DOM before each render
  return render(
    <BrowserRouter>
      <Sidebar
        collapsed={collapsed}
        onToggle={onToggle}
        user={mockUser}
        onLogout={() => {}}
      />
    </BrowserRouter>
  );
}

describe('Property 5: Sidebar toggle state', () => {
  /**
   * Property: For any initial sidebar state (expanded or collapsed), 
   * clicking the menu toggle icon should trigger the toggle callback.
   */
  it('should call onToggle when menu icon is clicked for any initial state', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Initial collapsed state
        (initialCollapsed) => {
          const onToggle = vi.fn();
          
          renderSidebar(initialCollapsed, onToggle);
          
          // Find and click the menu toggle button
          const toggleButton = screen.getByRole('button', { 
            name: initialCollapsed ? 'Expand sidebar' : 'Collapse sidebar' 
          });
          
          fireEvent.click(toggleButton);
          
          // Verify onToggle was called exactly once
          expect(onToggle).toHaveBeenCalledTimes(1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The toggle function should be idempotent in terms of call count -
   * each click should result in exactly one toggle call.
   */
  it('should call onToggle exactly once per click regardless of state', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Initial collapsed state
        fc.integer({ min: 1, max: 5 }), // Number of clicks
        (initialCollapsed, clickCount) => {
          const onToggle = vi.fn();
          
          renderSidebar(initialCollapsed, onToggle);
          
          const toggleButton = screen.getByRole('button', { 
            name: initialCollapsed ? 'Expand sidebar' : 'Collapse sidebar' 
          });
          
          // Click multiple times
          for (let i = 0; i < clickCount; i++) {
            fireEvent.click(toggleButton);
          }
          
          // Verify onToggle was called exactly clickCount times
          expect(onToggle).toHaveBeenCalledTimes(clickCount);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sidebar width should reflect collapsed state correctly.
   * Expanded = 210px, Collapsed = 60px
   */
  it('should have correct width class based on collapsed state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (collapsed) => {
          const { container } = renderSidebar(collapsed, vi.fn());
          
          const sidebar = container.querySelector('aside');
          expect(sidebar).toBeTruthy();
          
          if (collapsed) {
            expect(sidebar?.className).toContain('w-[60px]');
            expect(sidebar?.className).not.toContain('w-[210px]');
          } else {
            expect(sidebar?.className).toContain('w-[210px]');
            expect(sidebar?.className).not.toContain('w-[60px]');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Navigation labels should only be visible when sidebar is expanded.
   */
  it('should show navigation labels only when expanded', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (collapsed) => {
          const { container } = renderSidebar(collapsed, vi.fn());
          
          // Find the Dashboard link by href
          const dashboardLink = container.querySelector('a[href="/dashboard"]');
          expect(dashboardLink).toBeTruthy();
          
          // Check for the span with "Dashboard" text
          const labelSpan = dashboardLink?.querySelector('span.text-sm');
          
          if (collapsed) {
            // In collapsed state, the label span should not exist
            expect(labelSpan).toBeNull();
          } else {
            // In expanded state, the label span should exist with text
            expect(labelSpan).toBeTruthy();
            expect(labelSpan?.textContent).toContain('Dashboard');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
