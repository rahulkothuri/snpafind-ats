import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { searchService, type SearchQuery, type SearchFilters, type SearchResult, type SearchSuggestion, type SearchHistoryEntry, type ParsedQuery, SearchService } from '../services/search.service';
import type { Candidate, Job } from '../types';

// Query keys for React Query caching
export const searchKeys = {
  all: ['search'] as const,
  candidates: (query: SearchQuery) => [...searchKeys.all, 'candidates', query] as const,
  jobs: (query: SearchQuery) => [...searchKeys.all, 'jobs', query] as const,
  suggestions: (input: string, type: 'candidates' | 'jobs') => [...searchKeys.all, 'suggestions', input, type] as const,
  filterOptions: (type: 'candidates' | 'jobs') => [...searchKeys.all, 'filter-options', type] as const,
};

// Default search query
const defaultSearchQuery: SearchQuery = {
  query: '',
  filters: {},
  page: 1,
  pageSize: 20,
  sortBy: 'relevance',
  sortOrder: 'desc',
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for candidate search with debouncing
 * Requirements: 13.1, 14.1 - Implement search with debouncing and filter state management
 */
export function useCandidateSearch(
  initialQuery: Partial<SearchQuery> = {},
  debounceMs: number = 300,
  options?: Omit<UseQueryOptions<SearchResult<Candidate>>, 'queryKey' | 'queryFn'>
) {
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({
    ...defaultSearchQuery,
    ...initialQuery,
  });

  // Debounce the search query to avoid excessive API calls
  const debouncedQuery = useDebounce(searchQuery, debounceMs);

  // Only search if there's a query or filters applied
  const shouldSearch = useMemo(() => {
    return debouncedQuery.query.trim().length > 0 || 
           Object.keys(debouncedQuery.filters).some(key => {
             const value = debouncedQuery.filters[key as keyof SearchFilters];
             return Array.isArray(value) ? value.length > 0 : value !== undefined;
           });
  }, [debouncedQuery]);

  const queryResult = useQuery({
    queryKey: searchKeys.candidates(debouncedQuery),
    queryFn: () => searchService.searchCandidates(debouncedQuery),
    enabled: shouldSearch,
    staleTime: 30000, // 30 seconds
    ...options,
  });

  // Update search query functions
  const updateQuery = useCallback((query: string) => {
    setSearchQuery(prev => ({ ...prev, query, page: 1 }));
  }, []);

  const updateFilters = useCallback((filters: Partial<SearchFilters>) => {
    setSearchQuery(prev => ({ 
      ...prev, 
      filters: { ...prev.filters, ...filters },
      page: 1 
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery(prev => ({ ...prev, filters: {}, page: 1 }));
  }, []);

  const updatePagination = useCallback((page: number, pageSize?: number) => {
    setSearchQuery(prev => ({ 
      ...prev, 
      page,
      ...(pageSize && { pageSize })
    }));
  }, []);

  const updateSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    setSearchQuery(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  }, []);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(searchQuery.filters).reduce((count, value) => {
      if (Array.isArray(value)) {
        return count + (value.length > 0 ? 1 : 0);
      }
      return count + (value !== undefined ? 1 : 0);
    }, 0);
  }, [searchQuery.filters]);

  return {
    ...queryResult,
    searchQuery,
    updateQuery,
    updateFilters,
    clearFilters,
    updatePagination,
    updateSort,
    activeFilterCount,
    isSearching: shouldSearch && queryResult.isLoading,
  };
}

/**
 * Hook for job search with debouncing
 * Requirements: 13.1, 14.1 - Implement search with debouncing and filter state management
 */
export function useJobSearch(
  initialQuery: Partial<SearchQuery> = {},
  debounceMs: number = 300,
  options?: Omit<UseQueryOptions<SearchResult<Job>>, 'queryKey' | 'queryFn'>
) {
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({
    ...defaultSearchQuery,
    ...initialQuery,
  });

  // Debounce the search query to avoid excessive API calls
  const debouncedQuery = useDebounce(searchQuery, debounceMs);

  // Only search if there's a query or filters applied
  const shouldSearch = useMemo(() => {
    return debouncedQuery.query.trim().length > 0 || 
           Object.keys(debouncedQuery.filters).some(key => {
             const value = debouncedQuery.filters[key as keyof SearchFilters];
             return Array.isArray(value) ? value.length > 0 : value !== undefined;
           });
  }, [debouncedQuery]);

  const queryResult = useQuery({
    queryKey: searchKeys.jobs(debouncedQuery),
    queryFn: () => searchService.searchJobs(debouncedQuery),
    enabled: shouldSearch,
    staleTime: 30000, // 30 seconds
    ...options,
  });

  // Update search query functions
  const updateQuery = useCallback((query: string) => {
    setSearchQuery(prev => ({ ...prev, query, page: 1 }));
  }, []);

  const updateFilters = useCallback((filters: Partial<SearchFilters>) => {
    setSearchQuery(prev => ({ 
      ...prev, 
      filters: { ...prev.filters, ...filters },
      page: 1 
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery(prev => ({ ...prev, filters: {}, page: 1 }));
  }, []);

  const updatePagination = useCallback((page: number, pageSize?: number) => {
    setSearchQuery(prev => ({ 
      ...prev, 
      page,
      ...(pageSize && { pageSize })
    }));
  }, []);

  const updateSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    setSearchQuery(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  }, []);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(searchQuery.filters).reduce((count, value) => {
      if (Array.isArray(value)) {
        return count + (value.length > 0 ? 1 : 0);
      }
      return count + (value !== undefined ? 1 : 0);
    }, 0);
  }, [searchQuery.filters]);

  return {
    ...queryResult,
    searchQuery,
    updateQuery,
    updateFilters,
    clearFilters,
    updatePagination,
    updateSort,
    activeFilterCount,
    isSearching: shouldSearch && queryResult.isLoading,
  };
}

/**
 * Hook for search suggestions with debouncing
 * Requirements: 13.1 - Support search suggestions
 */
export function useSearchSuggestions(
  input: string,
  type: 'candidates' | 'jobs',
  debounceMs: number = 200,
  options?: Omit<UseQueryOptions<SearchSuggestion[]>, 'queryKey' | 'queryFn'>
) {
  const debouncedInput = useDebounce(input, debounceMs);

  return useQuery({
    queryKey: searchKeys.suggestions(debouncedInput, type),
    queryFn: () => searchService.getSearchSuggestions(debouncedInput, type),
    enabled: debouncedInput.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook for filter options
 * Requirements: 14.1 - Support filter state management
 */
export function useFilterOptions(
  type: 'candidates' | 'jobs',
  options?: Omit<UseQueryOptions<{
    locations: { value: string; label: string; count: number }[];
    sources: { value: string; label: string; count: number }[];
    skills: { value: string; label: string; count: number }[];
    departments: { value: string; label: string; count: number }[];
    stages: { value: string; label: string; count: number }[];
  }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: searchKeys.filterOptions(type),
    queryFn: () => searchService.getFilterOptions(type),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook for Boolean query parsing
 * Requirements: 13.1 - Boolean query support
 */
export function useBooleanQueryParser() {
  const [query, setQuery] = useState('');
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery>({
    terms: [],
    operators: [],
    isValid: true,
  });

  useEffect(() => {
    const parsed = searchService.parseBooleanQuery(query);
    setParsedQuery(parsed);
  }, [query]);

  const buildQuery = useCallback((terms: string[], operators: ('AND' | 'OR' | 'NOT')[]) => {
    const built = searchService.buildBooleanQuery(terms, operators);
    setQuery(built);
    return built;
  }, []);

  const getHelpText = useCallback(() => {
    return SearchService.getBooleanQueryHelp();
  }, []);

  return {
    query,
    setQuery,
    parsedQuery,
    buildQuery,
    getHelpText,
    isValid: parsedQuery.isValid,
    error: parsedQuery.error,
  };
}

/**
 * Hook for search history management
 * Requirements: 13.1 - Search history support
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  useEffect(() => {
    // Load initial history
    setHistory(searchService.getSearchHistory());
  }, []);

  const refreshHistory = useCallback(() => {
    setHistory(searchService.getSearchHistory());
  }, []);

  const clearHistory = useCallback(() => {
    searchService.clearSearchHistory();
    setHistory([]);
  }, []);

  return {
    history,
    refreshHistory,
    clearHistory,
  };
}

/**
 * Hook for filter validation
 * Requirements: 14.1 - Filter state management with validation
 */
export function useFilterValidation() {
  const validateFilters = useCallback((filters: SearchFilters) => {
    return SearchService.validateFilters(filters);
  }, []);

  return {
    validateFilters,
  };
}

/**
 * Combined search hook that provides both candidate and job search
 * Requirements: 13.1, 14.1 - Unified search interface
 */
export function useUnifiedSearch(
  type: 'candidates' | 'jobs' = 'candidates',
  initialQuery: Partial<SearchQuery> = {},
  debounceMs: number = 300
) {
  const candidateSearch = useCandidateSearch(
    type === 'candidates' ? initialQuery : {},
    debounceMs,
    { enabled: type === 'candidates' }
  );

  const jobSearch = useJobSearch(
    type === 'jobs' ? initialQuery : {},
    debounceMs,
    { enabled: type === 'jobs' }
  );

  const activeSearch = type === 'candidates' ? candidateSearch : jobSearch;

  return {
    ...activeSearch,
    type,
  };
}

/**
 * Hook for advanced search state management
 * Requirements: 14.1 - Advanced filtering with state persistence
 */
export function useAdvancedSearchState() {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [savedSearches, setSavedSearches] = useState<{
    id: string;
    name: string;
    query: SearchQuery;
    createdAt: Date;
  }[]>([]);

  const toggleAdvancedMode = useCallback(() => {
    setIsAdvancedMode(prev => !prev);
  }, []);

  const saveSearch = useCallback((name: string, query: SearchQuery) => {
    const savedSearch = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      query: { ...query },
      createdAt: new Date(),
    };

    setSavedSearches(prev => [...prev, savedSearch]);
    return savedSearch.id;
  }, []);

  const deleteSavedSearch = useCallback((id: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== id));
  }, []);

  const loadSavedSearch = useCallback((id: string) => {
    return savedSearches.find(search => search.id === id)?.query;
  }, [savedSearches]);

  return {
    isAdvancedMode,
    toggleAdvancedMode,
    savedSearches,
    saveSearch,
    deleteSavedSearch,
    loadSavedSearch,
  };
}