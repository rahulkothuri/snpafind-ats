import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import {
  MdDashboard,
  MdWork,
  MdPeople,
  MdEvent,
  MdAnalytics,
  MdSettings,
  MdMenu,
  MdLogout
} from 'react-icons/md';
import type { User } from '../types';
import type { IconType } from 'react-icons';

/**
 * Sidebar Component - "SaaS" Dark Theme
 * Refined for high density and premium look
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
  children?: { path: string; label: string }[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
      { path: '/analytics', label: 'Analytics', icon: MdAnalytics },
    ],
  },
  {
    title: 'Recruiting',
    items: [
      { path: '/roles', label: 'Jobs & Pipeline', icon: MdWork },
      { path: '/candidates', label: 'Candidates', icon: MdPeople },
      { path: '/interviews', label: 'Interviews', icon: MdEvent },
    ],
  },
  {
    title: 'System',
    items: [
      {
        path: '/settings',
        label: 'Settings',
        icon: MdSettings,
      },
    ],
  },
];

export function Sidebar({ collapsed, onToggle, user, onLogout }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer when component updates or collapsed state changes
  useEffect(() => {
    return () => {
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
      }
    };
  }, [collapsed]);

  const handleMouseEnter = () => {
    if (collapsed) {
      hoverTimer.current = setTimeout(() => {
        onToggle();
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const isActive = (path: string) => {
    if (path.includes('?')) {
      // For query params, check full match including search
      return location.pathname + location.search === path || (location.pathname === path.split('?')[0] && location.search === '' && path.includes('tab=company'));
    }
    return location.pathname === path;
  };

  const isParentActive = (item: NavItem) => {
    if (item.path === '/settings') {
      return location.pathname === '/settings';
    }
    return location.pathname.startsWith(item.path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        fixed left-0 top-0 h-full z-50
        bg-[#0f172a] text-[#94a3b8]
        border-r border-[#1e293b]
        transition-all duration-300 ease-in-out
        flex flex-col shadow-xl
        ${collapsed ? 'w-[64px]' : 'w-[240px]'}
      `}
    >
      <div className="flex items-center justify-between p-3 h-14 border-b border-[#1e293b]">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-lg shadow-blue-900/50">
              SF
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">
              SnapFind
            </span>
          </div>
        ) : (
          <div className="w-full flex justify-center cursor-pointer group-hover:bg-[#1e293b] rounded-lg p-1 transition-colors" onClick={onToggle}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-900/50">
              SF
            </div>
          </div>
        )}

        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-[#1e293b] text-[#64748b] hover:text-[#94a3b8] transition-colors"
          >
            <MdMenu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6 last:mb-0">
            {!collapsed && (
              <div className="px-3 mb-2 text-[10px] font-bold text-[#475569] uppercase tracking-wider">
                {section.title}
              </div>
            )}

            <ul className="space-y-1">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                const active = isParentActive(item);
                const hasChildren = item.children && item.children.length > 0;
                // Auto-expand if active or if user clicks header (though header navigates too)

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={hasChildren} // Only fuzzy match if children exist
                      className={({ isActive: linkActive }) => `
                        flex items-center gap-3 px-3 py-2 rounded-lg
                        transition-all duration-200 group relative
                        ${collapsed ? 'justify-center px-0 py-2.5' : ''}
                        ${active || linkActive
                          ? 'bg-[#1e293b] text-white font-medium'
                          : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/50'
                        }
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      {active && !collapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
                      )}

                      <IconComponent className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-blue-400' : 'group-hover:text-slate-200'}`} />

                      {!collapsed && (
                        <span className="text-[13px] flex-1">{item.label}</span>
                      )}
                    </NavLink>

                    {/* Nested Items */}
                    {!collapsed && hasChildren && active && (
                      <ul className="mt-1 ml-4 border-l border-[#334155] pl-2 space-y-0.5">
                        {item.children!.map((child) => {
                          const childActive = isActive(child.path);
                          return (
                            <li key={child.path}>
                              <NavLink
                                to={child.path}
                                className={`
                                  block px-3 py-1.5 rounded-md text-[12px] transition-colors
                                  ${childActive
                                    ? 'text-blue-400 font-medium bg-[#1e293b]/30'
                                    : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[#1e293b]/20'
                                  }
                                `}
                              >
                                {child.label}
                              </NavLink>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile - Bottom Fixed */}
      <div className="border-t border-[#1e293b] bg-[#0f172a] p-3">
        <div
          className={`
            flex items-center gap-3 rounded-lg p-2
            transition-colors hover:bg-[#1e293b] cursor-pointer group
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold border border-[#334155] ring-2 ring-[#1e293b]">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-slate-200 truncate group-hover:text-white">
                {user?.name || 'User'}
              </div>
              <div className="text-[11px] text-[#64748b] truncate">
                {user?.role?.replace('_', ' ') || 'Recruiter'}
              </div>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              className="p-1.5 text-[#64748b] hover:text-red-400 rounded transition-colors"
              title="Logout"
            >
              <MdLogout className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
