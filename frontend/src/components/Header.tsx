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
  const contextPills: ContextPill[] = [
    { label: 'Company', value: companyName },
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
            className="hamburger-menu p-2 rounded-lg hover:bg-[#f8fafc] transition-colors flex items-center justify-center text-[#374151]"
            aria-label="Toggle menu"
          >
            <span className="text-xl">☰</span>
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

      {/* Center Section: Search - Requirement 21.3, 2.2 */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search candidates, roles, tags..."
            className="w-full px-4 py-2 pl-10 bg-[#f3f4f6] border border-[#e2e8f0] rounded-full text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#0b6cf0] focus:ring-2 focus:ring-[rgba(11,108,240,0.2)]"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]">
            🔍
          </span>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9ca3af] hidden lg:block">
            Ctrl + K
          </span>
        </div>
      </div>

      {/* Right Section: Filters, Context Pills, User, Actions */}
      <div className="flex items-center gap-3">
        {/* Time Range Filter - Requirement 21.4 */}
        <select className="hidden sm:block px-3 py-1.5 bg-[#f3f4f6] border border-[#e2e8f0] rounded-lg text-sm text-[#374151] focus:outline-none focus:border-[#0b6cf0] focus:ring-2 focus:ring-[rgba(11,108,240,0.2)]">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>

        {/* Context Pills - Requirement 21.6 */}
        <div className="hidden lg:flex items-center gap-2">
          {contextPills.map((pill) => (
            <span
              key={pill.label}
              className="px-2.5 py-1 bg-[#f3f4f6] border border-[#e2e8f0] rounded-full text-xs text-[#64748b]"
            >
              {pill.label}: <span className="text-[#111827] font-medium">{pill.value}</span>
            </span>
          ))}
        </div>

        {/* Notification Icon - Requirement 2.4 */}
        <button className="p-2 rounded-full hover:bg-[#f3f4f6] transition-colors text-[#64748b] hover:text-[#374151]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* User Pill - Requirement 21.5, 2.4 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f3f4f6] border border-[#e2e8f0] rounded-full">
          <div className="w-7 h-7 rounded-full bg-[#0b6cf0] flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block text-xs">
            <div className="font-medium text-[#111827]">{user?.name || 'User'}</div>
            <div className="text-[#64748b] capitalize">
              {user?.role?.replace('_', ' ') || 'Role'}
            </div>
          </div>
        </div>

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
