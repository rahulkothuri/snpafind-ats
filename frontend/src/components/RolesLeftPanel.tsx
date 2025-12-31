/**
 * RolesLeftPanel Component - Requirements 1.1, 1.4, 2.1, 5.1
 * 
 * Left panel of the split-panel layout containing:
 * - SearchInput for role search
 * - StatusToggle for Open/Closed filter
 * - Compact RolesListTable
 * - Empty state when no roles match search/filter (Requirement 1.4)
 * 
 * Styled with 40% width on desktop
 */

import { Badge, Table, SearchInput, StatusToggle, EmptyState } from './index';
import type { Column } from './Table';

// Role interface matching the RolesPage Role type
export interface Role {
  id: string;
  title: string;
  department: string;
  location: string;
  openings: number;
  applicants: number;
  interviews: number;
  sla: 'On track' | 'At risk' | 'Breached';
  priority: 'High' | 'Medium' | 'Low';
  recruiter: string;
  status: 'active' | 'paused' | 'closed';
}

export interface RolesLeftPanelProps {
  roles: Role[];
  selectedRole: Role | null;
  onSelectRole: (role: Role) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'open' | 'closed';
  onStatusFilterChange: (status: 'open' | 'closed') => void;
}

export function RolesLeftPanel({
  roles,
  selectedRole,
  onSelectRole,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: RolesLeftPanelProps) {
  const columns: Column<Role>[] = [
    {
      key: 'title',
      header: 'Role',
      sortable: true,
      width: '0%',
      render: (row) => (
        <div className="max-w-[140px]">
          <div className="font-semibold text-gray-900 text-[11px] truncate leading-tight">{row.title}</div>
          <div className="text-[9px] text-gray-500 truncate leading-tight">{row.department} · {row.location}</div>
        </div>
      ),
    },
    {
      key: 'applicants',
      header: 'Apps',
      sortable: true,
      align: 'center',
      width: '15%',
      render: (row) => (
        <span className="font-medium text-[#0b6cf0] text-xs">{row.applicants}</span>
      ),
    },
    {
      key: 'sla',
      header: 'SLA',
      sortable: true,
      width: '5%',
      render: (row) => {
        const variant = row.sla === 'On track' ? 'green' : row.sla === 'At risk' ? 'orange' : 'red';
        return <Badge text={row.sla} variant={variant} />;
      },
    },
    {
      key: 'priority',
      header: 'Pri',
      sortable: true,
      width: '5%',
      render: (row) => {
        const variant = row.priority === 'High' ? 'priority' : row.priority === 'Medium' ? 'orange' : 'gray';
        return <Badge text={row.priority} variant={variant} />;
      },
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col min-h-0">
      {/* Panel Header with Search and Toggle - Requirements 1.1, 2.1 */}
      <div className="px-3 py-2 border-b border-gray-100 space-y-2 bg-gray-50/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">Roles</h3>
            <p className="text-xs text-[#64748b]">Click a role to view pipeline</p>
          </div>
          <span className="px-2 py-1 bg-[#f8fafc] rounded-full text-xs text-[#64748b] border border-[#e2e8f0]">
            {roles.length} roles
          </span>
        </div>

        {/* Search Input - Requirement 1.1 */}
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search roles..."
        />

        {/* Status Toggle - Requirement 2.1 */}
        <StatusToggle
          value={statusFilter}
          onChange={onStatusFilterChange}
          className="w-full justify-center"
        />
      </div>

      {/* Roles Table - Compact version */}
      <div className="flex-1 overflow-auto">
        {roles.length > 0 ? (
          <Table
            columns={columns}
            data={roles}
            keyExtractor={(row) => row.id}
            onRowClick={onSelectRole}
            selectedRow={selectedRole || undefined}
          />
        ) : (
          /* Empty state for no matching roles - Requirement 1.4 */
          <div className="p-4">
            <EmptyState
              icon="🔍"
              title="No matching roles"
              description={searchQuery
                ? `No roles found matching "${searchQuery}"`
                : `No ${statusFilter} roles found`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default RolesLeftPanel;
