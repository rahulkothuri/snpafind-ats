import api from './api';
import type { Candidate, Job } from '../types';

// Search Query Interface
export interface SearchQuery {
  query: string;
  filters: SearchFilters;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search Filters Interface (Requirements 14.1, 14.2, 14.3)
export interface SearchFilters {
  // Candidate filters
  stage?: string[];
  dateRange?: { start: Date; end: Date };
  location?: string[];
  source?: string[];
  experienceMin?: number;
  experienceMax?: number;
  skills?: string[];
  
  // Job filters
  status?: string[];
  department?: string[];
  priority?: string[];
  slaStatus?: string[];
}

// Search Result Interface
export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  highlights: Map<string, string[]>;
  searchTime: number;
}

// Parsed Boolean Query Interface
export interface ParsedQuery {
  terms: string[];
  operators: ('AND' | 'OR' | 'NOT')[];
  isValid: boolean;
  error?: string;
}

// Search Suggestion Interface
export interface SearchSuggestion {
  type: 'term' | 'filter' | 'recent';
  value: string;
  label: string;
  count?: number;
}

// Search History Interface
export interface SearchHistoryEntry {
  id: string;
  query: string;
  filters: SearchFilters;
  timestamp: Date;
  resultCount: number;
}

// Search Service Class
export class SearchService {
  private searchHistory: SearchHistoryEntry[] = [];
  private readonly maxHistorySize = 10;

  /**
   * Search candidates with Boolean query support (Requirements 13.1, 13.2, 13.4, 13.5)
   */
  async searchCandidates(searchQuery: SearchQuery): Promise<SearchResult<Candidate>> {
    const params = this.buildSearchParams(searchQuery);
    const response = await api.get(`/search/candidates${params}`);
    
    // Add to search history
    this.addToHistory(searchQuery, response.data.total);
    
    return {
      ...response.data,
      highlights: new Map(Object.entries(response.data.highlights || {}))
    };
  }

  /**
   * Search jobs with advanced filtering (Requirements 14.1, 14.2)
   */
  async searchJobs(searchQuery: SearchQuery): Promise<SearchResult<Job>> {
    const params = this.buildSearchParams(searchQuery);
    const response = await api.get(`/search/jobs${params}`);
    
    // Add to search history
    this.addToHistory(searchQuery, response.data.total);
    
    return {
      ...response.data,
      highlights: new Map(Object.entries(response.data.highlights || {}))
    };
  }

  /**
   * Parse Boolean query string (Requirements 13.2)
   */
  parseBooleanQuery(queryString: string): ParsedQuery {
    try {
      // Remove extra whitespace and normalize
      const normalized = queryString.trim().replace(/\s+/g, ' ');
      
      if (!normalized) {
        return {
          terms: [],
          operators: [],
          isValid: true
        };
      }

      // Split by Boolean operators while preserving them
      const tokens = normalized.split(/\s+(AND|OR|NOT)\s+/i);
      const terms: string[] = [];
      const operators: ('AND' | 'OR' | 'NOT')[] = [];

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i].trim();
        
        if (!token) continue;
        
        if (['AND', 'OR', 'NOT'].includes(token.toUpperCase())) {
          operators.push(token.toUpperCase() as 'AND' | 'OR' | 'NOT');
        } else {
          // Handle quoted phrases
          if (token.startsWith('"') && token.endsWith('"')) {
            terms.push(token.slice(1, -1));
          } else {
            terms.push(token);
          }
        }
      }

      // Validate query structure
      if (terms.length === 0) {
        return {
          terms: [],
          operators: [],
          isValid: false,
          error: 'Query must contain at least one search term'
        };
      }

      // Check for consecutive operators
      if (operators.length > 0 && operators.length >= terms.length) {
        return {
          terms,
          operators,
          isValid: false,
          error: 'Invalid operator sequence'
        };
      }

      return {
        terms,
        operators,
        isValid: true
      };
    } catch (error) {
      return {
        terms: [],
        operators: [],
        isValid: false,
        error: 'Failed to parse query'
      };
    }
  }

  /**
   * Get search suggestions based on input (Requirements 13.7)
   */
  async getSearchSuggestions(input: string, type: 'candidates' | 'jobs'): Promise<SearchSuggestion[]> {
    if (input.length < 2) {
      return this.getRecentSearches();
    }

    try {
      const params = new URLSearchParams();
      params.append('input', input);
      params.append('type', type);
      
      const response = await api.get(`/search/suggestions?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch search suggestions:', error);
      return [];
    }
  }

  /**
   * Get available filter options for advanced search
   */
  async getFilterOptions(type: 'candidates' | 'jobs'): Promise<{
    locations: { value: string; label: string; count: number }[];
    sources: { value: string; label: string; count: number }[];
    skills: { value: string; label: string; count: number }[];
    departments: { value: string; label: string; count: number }[];
    stages: { value: string; label: string; count: number }[];
  }> {
    const response = await api.get(`/search/filter-options?type=${type}`);
    return response.data;
  }

  /**
   * Build Boolean query string from terms and operators
   */
  buildBooleanQuery(terms: string[], operators: ('AND' | 'OR' | 'NOT')[]): string {
    if (terms.length === 0) return '';
    if (terms.length === 1) return terms[0];

    let query = terms[0];
    for (let i = 0; i < operators.length && i + 1 < terms.length; i++) {
      query += ` ${operators[i]} ${terms[i + 1]}`;
    }

    return query;
  }

  /**
   * Get search history for current session (Requirements 13.6)
   */
  getSearchHistory(): SearchHistoryEntry[] {
    return [...this.searchHistory].reverse(); // Most recent first
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
  }

  /**
   * Get recent searches as suggestions
   */
  private getRecentSearches(): SearchSuggestion[] {
    return this.searchHistory
      .slice(-5) // Last 5 searches
      .reverse()
      .map(entry => ({
        type: 'recent' as const,
        value: entry.query,
        label: `${entry.query} (${entry.resultCount} results)`,
        count: entry.resultCount
      }));
  }

  /**
   * Add search to history
   */
  private addToHistory(searchQuery: SearchQuery, resultCount: number): void {
    if (!searchQuery.query.trim()) return;

    const entry: SearchHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query: searchQuery.query,
      filters: { ...searchQuery.filters },
      timestamp: new Date(),
      resultCount
    };

    // Remove duplicate queries
    this.searchHistory = this.searchHistory.filter(h => h.query !== entry.query);
    
    // Add new entry
    this.searchHistory.push(entry);
    
    // Limit history size
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Build search parameters for API calls
   */
  private buildSearchParams(searchQuery: SearchQuery): string {
    const params = new URLSearchParams();

    // Basic search parameters
    if (searchQuery.query) {
      params.append('q', searchQuery.query);
    }

    params.append('page', searchQuery.page.toString());
    params.append('pageSize', searchQuery.pageSize.toString());

    if (searchQuery.sortBy) {
      params.append('sortBy', searchQuery.sortBy);
    }

    if (searchQuery.sortOrder) {
      params.append('sortOrder', searchQuery.sortOrder);
    }

    // Filter parameters
    const filters = searchQuery.filters;

    if (filters.stage && filters.stage.length > 0) {
      filters.stage.forEach(stage => params.append('stage', stage));
    }

    if (filters.location && filters.location.length > 0) {
      filters.location.forEach(location => params.append('location', location));
    }

    if (filters.source && filters.source.length > 0) {
      filters.source.forEach(source => params.append('source', source));
    }

    if (filters.skills && filters.skills.length > 0) {
      filters.skills.forEach(skill => params.append('skills', skill));
    }

    if (filters.status && filters.status.length > 0) {
      filters.status.forEach(status => params.append('status', status));
    }

    if (filters.department && filters.department.length > 0) {
      filters.department.forEach(dept => params.append('department', dept));
    }

    if (filters.priority && filters.priority.length > 0) {
      filters.priority.forEach(priority => params.append('priority', priority));
    }

    if (filters.slaStatus && filters.slaStatus.length > 0) {
      filters.slaStatus.forEach(sla => params.append('slaStatus', sla));
    }

    if (filters.experienceMin !== undefined) {
      params.append('experienceMin', filters.experienceMin.toString());
    }

    if (filters.experienceMax !== undefined) {
      params.append('experienceMax', filters.experienceMax.toString());
    }

    if (filters.dateRange) {
      params.append('startDate', filters.dateRange.start.toISOString());
      params.append('endDate', filters.dateRange.end.toISOString());
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Validate search filters (Requirements 14.5)
   */
  static validateFilters(filters: SearchFilters): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate experience range
    if (filters.experienceMin !== undefined && filters.experienceMax !== undefined) {
      if (filters.experienceMin > filters.experienceMax) {
        errors.push('Minimum experience cannot be greater than maximum experience');
      }
    }

    if (filters.experienceMin !== undefined && filters.experienceMin < 0) {
      errors.push('Minimum experience cannot be negative');
    }

    if (filters.experienceMax !== undefined && filters.experienceMax > 50) {
      errors.push('Maximum experience cannot exceed 50 years');
    }

    // Validate date range
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      
      if (start > end) {
        errors.push('Start date must be before end date');
      }

      const now = new Date();
      if (start > now) {
        errors.push('Start date cannot be in the future');
      }

      // Check for reasonable date range (not more than 5 years)
      const maxRangeMs = 5 * 365 * 24 * 60 * 60 * 1000;
      if (end.getTime() - start.getTime() > maxRangeMs) {
        errors.push('Date range cannot exceed 5 years');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get Boolean query help text
   */
  static getBooleanQueryHelp(): string {
    return `
Boolean Search Help:
• Use AND to find results containing all terms: "javascript AND react"
• Use OR to find results containing any term: "python OR java"
• Use NOT to exclude terms: "developer NOT junior"
• Use quotes for exact phrases: "senior developer"
• Combine operators: "react AND (typescript OR javascript)"

Examples:
• "senior developer" AND (react OR angular)
• python AND NOT junior
• "full stack" OR "backend developer"
    `.trim();
  }
}

// Export singleton instance
export const searchService = new SearchService();
export default searchService;