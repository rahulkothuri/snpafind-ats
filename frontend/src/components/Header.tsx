import type { User } from '../types';

/**
 * Header Component - Requirements 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 22.1
 * 
 * Features:
 * - Dark background (#020617) with page title and subtitle
 * - Hamburger menu button to toggle sidebar (shown below 900px)
 * - Global search input with rounded pill style
 * - Time range filter dropdown
 * - User pill with avatar, name, role, company
 * - Contextual pills and action buttons
 */

interface HeaderProps {
  pageTitle: string;
  pageSubtitle?: string;
  onMenuToggle: () => void;
  actions?: React.ReactNode;
  user: User | null;
  companyName?: string;
  showHamburger?: boolean;
}

interface ContextPill {
  label: string;
  value: string;
}

export function Header({
  pageTitle,
  pageSubtitle,
  onMenuToggle,
  actions,
  user,
  companyName = 'Acme Technologies',
  showHamburger = false,
}: HeaderProps) {
  // Note: user and companyName are currently not used in the UI but are kept for future features
  void user; // Suppress unused variable warning
  void companyName; // Suppress unused variable warning
  const contextPills: ContextPill[] = [
    { label: 'Time zone', value: 'IST' },
  ];

  return (
    <header className="bg-white text-[#111827] h-16 flex items-center justify-between px-4 gap-4 border-b border-[#e2e8f0]">
      {/* Left Section: Menu Toggle + Title */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Hamburger Menu - Requirement 21.2, 22.1 - shown below 900px */}
        {showHamburger && (
          <button
            onClick={onMenuToggle}
            className="hamburger-menu px-3 py-1.5 rounded-full hover:bg-[#f8fafc] transition-colors flex items-center justify-center text-[#374151] text-xs"
            aria-label="Toggle menu"
          >
            <span className="text-lg">☰</span>
          </button>
        )}

        {/* Page Title - Requirement 21.1 */}
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate text-[#111827]">{pageTitle}</h1>
          {pageSubtitle && (
            <p className="text-xs text-[#64748b] truncate">{pageSubtitle}</p>
          )}
        </div>
      </div>

      {/* Spacer for layout balance */}
      <div className="flex-1" />

      {/* Right Section: Filters, Context Pills, User, Actions */}
      <div className="flex items-center gap-3">
        {/* Time Range Filter - Requirement 21.4 */}
        <div className="hidden sm:block relative">
          <select className="appearance-none bg-[#f1f5f9] border border-[#e2e8f0] rounded-full px-3 py-1.5 pr-8 text-xs text-[#374151] font-medium focus:outline-none focus:border-[#0b6cf0] focus:ring-2 focus:ring-[rgba(11,108,240,0.2)] cursor-pointer min-w-[120px] text-center">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            <svg className="w-3 h-3 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Context Pills - Requirement 21.6 */}
        <div className="hidden lg:flex items-center gap-2">
          {contextPills.map((pill) => (
            <span
              key={pill.label}
              className="px-3 py-1.5 bg-[#f3f4f6] border border-[#e2e8f0] rounded-full text-xs text-[#64748b]"
            >
              {pill.label}: <span className="text-[#111827] font-medium">{pill.value}</span>
            </span>
          ))}
        </div>

        {/* Notification Icon - Requirement 2.4 */}
        <button className="px-3 py-1.5 rounded-full hover:bg-[#f3f4f6] transition-colors text-[#64748b] hover:text-[#374151]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>



        {/* Action Buttons - Requirement 21.7, 2.3 */}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
