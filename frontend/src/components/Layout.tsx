import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingTaskWidget, useFloatingTaskEnabled } from './FloatingTaskWidget';
import type { User } from '../types';

/**
 * Layout Component - Combines Sidebar, Header, Footer
 * Requirements: 1.1, 2.1, 22.1, 22.2, 22.3, 22.4
 * 
 * Features:
 * - Responsive layout with collapsible sidebar
 * - Hide sidebar below 900px, show hamburger menu
 * - Sidebar as overlay on mobile
 * - Consistent header and footer across pages
 * - Main content area with proper spacing
 * - Light theme with white sidebar and header
 */

interface LayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
  headerActions?: React.ReactNode;
  footerLeftText?: string;
  footerRightText?: string;
  user: User | null;
  companyName?: string;
  onLogout?: () => void;
}

// Custom hook to track window width for responsive behavior
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

export function Layout({
  children,
  pageTitle,
  pageSubtitle,
  headerActions,
  footerLeftText = 'SnapFind Client ATS · Dashboard prototype for reference only',
  footerRightText = 'Time-to-fill (median): 24 days · Offer acceptance: 78%',
  user,
  companyName,
  onLogout,
}: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const windowWidth = useWindowWidth();
  const { enabled: floatingTaskEnabled } = useFloatingTaskEnabled();
  const location = useLocation();

  // Responsive breakpoints - Requirement 22.1
  const isMobile = windowWidth < 900;

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    // Light theme page background - Requirements 1.1, 6.2
    <div className="min-h-screen bg-[var(--color-bg-gray)]">
      {/* Sidebar - Desktop (900px+) - Requirement 22.1 */}
      {/* Light sidebar with white background - Requirement 1.1 */}
      {!isMobile && (
        <div className="sidebar-desktop">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            user={user}
            onLogout={onLogout}
            isMobile={false}
          />
        </div>
      )}

      {/* Sidebar - Mobile Overlay (below 900px) - Requirement 22.4 */}
      {isMobile && (
        <>
          <div
            className={`sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-hidden="true"
          />
          <div className={`sidebar-mobile ${mobileMenuOpen ? 'active' : ''}`}>
            <Sidebar
              collapsed={false}
              onToggle={toggleMobileMenu}
              user={user}
              onLogout={onLogout}
              isMobile={true}
            />
          </div>
        </>
      )}

      {/* Main Content Area - Light theme styling */}
      <div
        className={`
          min-h-screen flex flex-col transition-all duration-300
          main-content-with-sidebar bg-[var(--color-bg-gray)]
          ${!isMobile ? (sidebarCollapsed ? 'ml-[var(--sidebar-collapsed-width)]' : 'ml-[var(--sidebar-width)]') : 'ml-0'}
        `}
      >
        {/* Header - White background with bottom border - Requirement 2.1 */}
        <Header
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          onMenuToggle={toggleMobileMenu}
          actions={headerActions}
          user={user}
          companyName={companyName}
          showHamburger={isMobile}
        />

        {/* Main Content - Light gray background */}
        <main className="flex-1 p-4 sm:p-6 bg-[var(--color-bg-gray)]">
          {children}
        </main>

        {/* Footer */}
        <Footer
          leftText={footerLeftText}
          rightText={footerRightText}
        />
      </div>

      {/* Floating Task Widget - Shown when toggle is enabled */}
      {user && <FloatingTaskWidget enabled={floatingTaskEnabled} />}
    </div>
  );
}

export default Layout;
