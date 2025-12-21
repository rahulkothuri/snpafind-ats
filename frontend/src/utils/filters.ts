/**
 * Filter utility functions for Roles & Pipeline page
 * Requirements: 1.2, 2.2, 2.3, 3.2
 */

// Types for filter parameters
export type RoleStatus = 'active' | 'paused' | 'closed';
export type StatusFilter = 'open' | 'closed';

export interface FilterableRole {
  id: string;
  title: string;
  status: RoleStatus;
}

export interface FilterableCandidate {
  id: string;
  name: string;
}

/**
 * Filters roles by search query (case-insensitive title match)
 * Requirements: 1.2 - WHEN a user types in the search input THEN the Roles_Page 
 * SHALL filter the roles list to show only roles whose title contains the search text
 * 
 * @param roles - Array of roles to filter
 * @param query - Search query string
 * @returns Filtered array of roles whose title contains the query
 */
export function filterRolesBySearch<T extends FilterableRole>(
  roles: T[],
  query: string
): T[] {
  if (!query.trim()) return roles;
  const lowerQuery = query.toLowerCase();
  return roles.filter((role) =>
    role.title.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filters roles by status (open = active, closed = closed or paused)
 * Requirements: 2.2 - WHEN the toggle is set to "Open" THEN the Roles_Page SHALL 
 * display only roles with status 'active'
 * Requirements: 2.3 - WHEN the toggle is set to "Closed" THEN the Roles_Page SHALL 
 * display only roles with status 'closed' or 'paused'
 * 
 * @param roles - Array of roles to filter
 * @param status - Status filter ('open' or 'closed')
 * @returns Filtered array of roles matching the status filter
 */
export function filterRolesByStatus<T extends FilterableRole>(
  roles: T[],
  status: StatusFilter
): T[] {
  if (status === 'open') {
    return roles.filter((role) => role.status === 'active');
  }
  return roles.filter((role) => role.status === 'closed' || role.status === 'paused');
}

/**
 * Filters candidates by search query (case-insensitive name match)
 * Requirements: 3.2 - WHEN a user types in the candidate search input THEN the 
 * Roles_Page SHALL filter the candidates list to show only candidates whose name 
 * contains the search text
 * 
 * @param candidates - Array of candidates to filter
 * @param query - Search query string
 * @returns Filtered array of candidates whose name contains the query
 */
export function filterCandidatesBySearch<T extends FilterableCandidate>(
  candidates: T[],
  query: string
): T[] {
  if (!query.trim()) return candidates;
  const lowerQuery = query.toLowerCase();
  return candidates.filter((candidate) =>
    candidate.name.toLowerCase().includes(lowerQuery)
  );
}
