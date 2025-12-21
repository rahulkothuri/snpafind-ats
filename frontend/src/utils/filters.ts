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

// Advanced filter types - Requirements 4.3
export interface AdvancedFilterableCandidate extends FilterableCandidate {
  skills: string[];
  experience: number;
  source: string;
}

export interface AdvancedFilters {
  skills: string[];
  experienceMin: number | null;
  experienceMax: number | null;
  source: string | null;
}

/**
 * Filters candidates by skills (must have all selected skills)
 * Requirements: 4.3 - WHEN viewing the pipeline THEN the Pipeline_Module SHALL 
 * provide filters for skills
 * 
 * @param candidates - Array of candidates to filter
 * @param skills - Array of required skills
 * @returns Filtered array of candidates who have all the required skills
 */
export function filterCandidatesBySkills<T extends AdvancedFilterableCandidate>(
  candidates: T[],
  skills: string[]
): T[] {
  if (skills.length === 0) return candidates;
  return candidates.filter((candidate) =>
    skills.every((skill) =>
      candidate.skills.some((s) => s.toLowerCase() === skill.toLowerCase())
    )
  );
}

/**
 * Filters candidates by experience range
 * Requirements: 4.3 - WHEN viewing the pipeline THEN the Pipeline_Module SHALL 
 * provide filters for experience range
 * 
 * @param candidates - Array of candidates to filter
 * @param min - Minimum experience (null for no minimum)
 * @param max - Maximum experience (null for no maximum)
 * @returns Filtered array of candidates within the experience range
 */
export function filterCandidatesByExperience<T extends AdvancedFilterableCandidate>(
  candidates: T[],
  min: number | null,
  max: number | null
): T[] {
  if (min === null && max === null) return candidates;
  return candidates.filter((candidate) => {
    if (min !== null && candidate.experience < min) return false;
    if (max !== null && candidate.experience > max) return false;
    return true;
  });
}

/**
 * Filters candidates by source
 * Requirements: 4.3 - WHEN viewing the pipeline THEN the Pipeline_Module SHALL 
 * provide filters for source
 * 
 * @param candidates - Array of candidates to filter
 * @param source - Source to filter by (null for all sources)
 * @returns Filtered array of candidates from the specified source
 */
export function filterCandidatesBySource<T extends AdvancedFilterableCandidate>(
  candidates: T[],
  source: string | null
): T[] {
  if (!source) return candidates;
  return candidates.filter((candidate) =>
    candidate.source.toLowerCase() === source.toLowerCase()
  );
}

/**
 * Applies all advanced filters to candidates
 * Requirements: 4.3, 4.4 - WHEN applying filters THEN the Pipeline_Module SHALL 
 * update both stage counts and candidate list in real-time
 * 
 * @param candidates - Array of candidates to filter
 * @param filters - Advanced filter settings
 * @returns Filtered array of candidates matching all filter criteria
 */
export function applyAdvancedFilters<T extends AdvancedFilterableCandidate>(
  candidates: T[],
  filters: AdvancedFilters
): T[] {
  let result = candidates;
  result = filterCandidatesBySkills(result, filters.skills);
  result = filterCandidatesByExperience(result, filters.experienceMin, filters.experienceMax);
  result = filterCandidatesBySource(result, filters.source);
  return result;
}

/**
 * Extracts unique skills from a list of candidates
 * @param candidates - Array of candidates
 * @returns Array of unique skills sorted alphabetically
 */
export function extractUniqueSkills<T extends AdvancedFilterableCandidate>(
  candidates: T[]
): string[] {
  const skillSet = new Set<string>();
  candidates.forEach((candidate) => {
    candidate.skills.forEach((skill) => skillSet.add(skill));
  });
  return Array.from(skillSet).sort();
}

/**
 * Extracts unique sources from a list of candidates
 * @param candidates - Array of candidates
 * @returns Array of unique sources sorted alphabetically
 */
export function extractUniqueSources<T extends AdvancedFilterableCandidate>(
  candidates: T[]
): string[] {
  const sourceSet = new Set<string>();
  candidates.forEach((candidate) => {
    if (candidate.source) {
      sourceSet.add(candidate.source);
    }
  });
  return Array.from(sourceSet).sort();
}
