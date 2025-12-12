import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  MdDashboard, 
  MdWork, 
  MdPeople, 
  MdEvent, 
  MdAnalytics, 
  MdSettings,
  MdMenu,
  MdLogout,
  MdAdd
} from 'react-icons/md';
import type { User } from '../types';
import type { IconType } from 'react-icons';

/**
 * Sidebar Component - Redesigned with React Icons
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 * 
 * Features:
 * - React Icons (Material Design) instead of emoji characters
 * - Full blue background (#0b6cf0) with white text on hover/active
 * - User profile section at bottom (above logout)
 * - Logout button below user profile
 * - Menu/hamburger icon at top for collapse/expand toggle
 * - No collapse arrow at bottom
 */

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  user: User | null;
  onLogout?: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: IconType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
      { path: '/roles', label: 'Roles & Pipelines', icon: MdWork },
      { path: '/candidates', label: 'Candidates', icon: MdPeople },
      { path: '/interviews', label: 'Interviews', icon: MdEvent },
    ],
  },
  {
    title: 'INSIGHTS',
    items: [
      { path: '/analytics', label: 'Analytics & Reports', icon: MdAnalytics },
    ],
  },
  {
    title: 'SETUP',
    items: [
      { path: '/settings', label: 'Settings', icon: MdSettings },
    ],
  },
];

export function Sidebar({ collapsed, onToggle, user, onLogout }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleCreateJob = () => {
    navigate('/jobs/new');
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-40
        bg-white text-[#374151]
        border-r border-[#e2e8f0]
        transition-all duration-300 ease-in-out
        flex flex-col
        ${collapsed ? 'w-[60px]' : 'w-[210px]'}
      `}
    >
      {/* Menu Toggle Icon at Top - Requirements 3.6, 3.7, 3.8 */}
      <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-[#f8fafc] transition-colors text-[#64748b] hover:text-[#374151]"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <MdMenu className="w-6 h-6" />
        </button>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0b6cf0] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              SF
            </div>
            <span className="text-[#111827] font-semibold text-sm whitespace-nowrap">
              SnapFind ATS
            </span>
          </div>
        )}
      </div>

      {/* Create Job Button - Requirements 4.1 */}
      <div className={`px-2 py-3 border-b border-[#e2e8f0] ${collapsed ? 'px-2' : 'px-3'}`}>
        <button
          onClick={handleCreateJob}
          className={`
            flex items-center justify-center gap-2 w-full
            bg-[#0b6cf0] text-white font-medium
            rounded-lg transition-all duration-200
            hover:bg-[#0956c4] active:bg-[#074299]
            ${collapsed ? 'p-2' : 'px-4 py-2.5'}
          `}
          title="Create Job"
          aria-label="Create Job"
        >
          <MdAdd className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Create Job</span>}
        </button>
      </div>

      {/* Navigation Sections - Requirements 3.1, 3.2, 3.3 */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {/* Section Title */}
            {!collapsed && (
              <div className="px-4 mb-2 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                {section.title}
              </div>
            )}
            
            {/* Navigation Items */}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg
                        transition-all duration-200
                        ${isActive(item.path)
                          ? 'bg-[#0b6cf0] text-white font-medium'
                          : 'hover:bg-[#0b6cf0] hover:text-white text-[#374151]'
                        }
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      <IconComponent className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm whitespace-nowrap">{item.label}</span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile Section at Bottom - Requirements 3.4, 3.5 */}
      <div className="border-t border-[#e2e8f0] mt-auto">
        {/* User Info - Requirement 3.4 */}
        <div className={`bg-[#f8fafc] ${collapsed ? 'p-2' : 'p-4'}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0b6cf0] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[#111827] truncate">
                  {user?.name || 'User'}
                </div>
                <div className="text-xs text-[#64748b] truncate">
                  {user?.email || 'user@example.com'}
                </div>
                <div className="text-xs text-[#64748b] mt-0.5">
                  Role: <span className="text-[#111827] font-medium capitalize">{user?.role?.replace('_', ' ') || 'Unknown'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#0b6cf0] flex items-center justify-center text-white text-xs font-bold mx-auto">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* Logout Button - Requirement 3.5 */}
        <div className={`bg-[#f8fafc] border-t border-[#e2e8f0] ${collapsed ? 'p-2' : 'px-4 pb-4'}`}>
          {!collapsed ? (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#64748b] hover:text-[#dc2626] hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <MdLogout className="w-5 h-5" />
              <span>Logout</span>
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="p-2 text-[#64748b] hover:text-[#dc2626] hover:bg-red-50 rounded-lg transition-colors mx-auto block"
              title="Logout"
            >
              <MdLogout className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
