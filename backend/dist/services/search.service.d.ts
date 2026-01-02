import { Candidate, Job } from '@prisma/client';
export interface SearchQuery {
    query: string;
    filters: SearchFilters;
    page: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface SearchFilters {
    stage?: string[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    location?: string[];
    source?: string[];
    experienceMin?: number;
    experienceMax?: number;
    skills?: string[];
    status?: string[];
    department?: string[];
    priority?: string[];
    slaStatus?: string[];
}
export interface SearchResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    highlights: Map<string, string[]>;
}
export interface ParsedQuery {
    terms: string[];
    operators: ('AND' | 'OR' | 'NOT')[];
    isValid: boolean;
    error?: string;
}
export declare class SearchService {
    private prisma;
    constructor();
    /**
     * Parse Boolean query string into structured format
     * Supports AND, OR, NOT operators with parentheses
     * Requirements: 13.2
     */
    parseBooleanQuery(queryString: string): ParsedQuery;
    /**
     * Tokenize query string into tokens
     */
    private tokenizeQuery;
    /**
     * Parse tokens into terms and operators
     */
    private parseTokens;
    /**
     * Search candidates with Boolean query support
     * Requirements: 13.1, 13.4, 13.5
     */
    searchCandidates(companyId: string, searchQuery: SearchQuery): Promise<SearchResult<Candidate>>;
    /**
     * Search jobs with filtering
     * Requirements: 14.1, 14.2
     */
    searchJobs(companyId: string, searchQuery: SearchQuery): Promise<SearchResult<Job>>;
    /**
     * Build candidate search conditions from parsed query
     * Requirements: 13.1, 13.5 - Support partial matching for name and email
     */
    private buildCandidateSearchConditions;
    /**
     * Build job search conditions from parsed query
     */
    private buildJobSearchConditions;
    /**
     * Build candidate filters
     * Requirements: 14.1 - Filter candidates by stage, date range, location, source, experience, skills
     */
    private buildCandidateFilters;
    /**
     * Build job filters
     * Requirements: 14.2 - Filter jobs by status, department, location, priority, SLA status
     */
    private buildJobFilters;
    /**
     * Generate highlights for matching terms in candidate results
     * Requirements: 13.4 - Highlight matching terms in search results
     */
    private generateHighlights;
    /**
     * Generate highlights for matching terms in job results
     */
    private generateJobHighlights;
    /**
     * Count active filters for display
     * Requirements: 14.5 - Display count of active filters
     */
    countActiveFilters(filters: SearchFilters): number;
    /**
     * Clear all filters
     * Requirements: 14.6 - Provide clear all filters action
     */
    clearAllFilters(): SearchFilters;
}
export declare const searchService: SearchService;
//# sourceMappingURL=search.service.d.ts.map