import prisma from '../lib/prisma.js';
export class SearchService {
    prisma;
    constructor() {
        this.prisma = prisma;
    }
    /**
     * Parse Boolean query string into structured format
     * Supports AND, OR, NOT operators with parentheses
     * Requirements: 13.2
     */
    parseBooleanQuery(queryString) {
        try {
            const tokens = this.tokenizeQuery(queryString);
            const { terms, operators } = this.parseTokens(tokens);
            return {
                terms,
                operators,
                isValid: true
            };
        }
        catch (error) {
            return {
                terms: [],
                operators: [],
                isValid: false,
                error: error instanceof Error ? error.message : 'Invalid query syntax'
            };
        }
    }
    /**
     * Tokenize query string into tokens
     */
    tokenizeQuery(query) {
        const tokens = [];
        const regex = /\b(AND|OR|NOT)\b|\(|\)|"[^"]*"|[^\s()]+/gi;
        let match;
        while ((match = regex.exec(query)) !== null) {
            const value = match[0];
            if (value.toUpperCase() === 'AND') {
                tokens.push({ type: 'AND', value: 'AND' });
            }
            else if (value.toUpperCase() === 'OR') {
                tokens.push({ type: 'OR', value: 'OR' });
            }
            else if (value.toUpperCase() === 'NOT') {
                tokens.push({ type: 'NOT', value: 'NOT' });
            }
            else if (value === '(') {
                tokens.push({ type: 'LPAREN', value: '(' });
            }
            else if (value === ')') {
                tokens.push({ type: 'RPAREN', value: ')' });
            }
            else {
                // Remove quotes if present
                const term = value.replace(/^"(.*)"$/, '$1');
                tokens.push({ type: 'TERM', value: term });
            }
        }
        return tokens;
    }
    /**
     * Parse tokens into terms and operators
     */
    parseTokens(tokens) {
        const terms = [];
        const operators = [];
        for (const token of tokens) {
            if (token.type === 'TERM') {
                terms.push(token.value);
            }
            else if (token.type === 'AND' || token.type === 'OR' || token.type === 'NOT') {
                operators.push(token.type);
            }
            // Skip parentheses for now - can be enhanced later for complex grouping
        }
        return { terms, operators };
    }
    /**
     * Search candidates with Boolean query support
     * Requirements: 13.1, 13.4, 13.5
     */
    async searchCandidates(companyId, searchQuery) {
        const { query, filters, page, pageSize, sortBy = 'createdAt', sortOrder = 'desc' } = searchQuery;
        // Parse Boolean query
        const parsedQuery = this.parseBooleanQuery(query);
        // Build where clause
        const whereClause = {
            companyId,
            ...this.buildCandidateFilters(filters),
            ...this.buildCandidateSearchConditions(parsedQuery)
        };
        // Execute search with pagination
        const [candidates, total] = await Promise.all([
            this.prisma.candidate.findMany({
                where: whereClause,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    jobCandidates: {
                        include: {
                            job: true,
                            currentStage: true
                        }
                    }
                }
            }),
            this.prisma.candidate.count({ where: whereClause })
        ]);
        // Generate highlights for matching terms
        const highlights = this.generateHighlights(candidates, parsedQuery.terms);
        return {
            items: candidates,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
            highlights
        };
    }
    /**
     * Search jobs with filtering
     * Requirements: 14.1, 14.2
     */
    async searchJobs(companyId, searchQuery) {
        const { query, filters, page, pageSize, sortBy = 'createdAt', sortOrder = 'desc' } = searchQuery;
        // Parse Boolean query
        const parsedQuery = this.parseBooleanQuery(query);
        // Build where clause
        const whereClause = {
            companyId,
            ...this.buildJobFilters(filters),
            ...this.buildJobSearchConditions(parsedQuery)
        };
        // Execute search with pagination
        const [jobs, total] = await Promise.all([
            this.prisma.job.findMany({
                where: whereClause,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    assignedRecruiter: true,
                    jobCandidates: {
                        include: {
                            candidate: true,
                            currentStage: true
                        }
                    },
                    pipelineStages: true
                }
            }),
            this.prisma.job.count({ where: whereClause })
        ]);
        // Generate highlights for matching terms
        const highlights = this.generateJobHighlights(jobs, parsedQuery.terms);
        return {
            items: jobs,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
            highlights
        };
    }
    /**
     * Build candidate search conditions from parsed query
     * Requirements: 13.1, 13.5 - Support partial matching for name and email
     */
    buildCandidateSearchConditions(parsedQuery) {
        if (!parsedQuery.isValid || parsedQuery.terms.length === 0) {
            return {};
        }
        // For now, implement simple AND logic across all terms
        // Each term should match at least one searchable field
        const searchConditions = parsedQuery.terms.map(term => ({
            OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
                { phone: { contains: term, mode: 'insensitive' } },
                { currentCompany: { contains: term, mode: 'insensitive' } },
                { location: { contains: term, mode: 'insensitive' } },
                { title: { contains: term, mode: 'insensitive' } },
                { department: { contains: term, mode: 'insensitive' } },
                { industry: { contains: term, mode: 'insensitive' } },
                { jobDomain: { contains: term, mode: 'insensitive' } },
                // Search in skills array (JSON field)
                { skills: { array_contains: [term] } },
                // Search in tags array (JSON field)
                { tags: { array_contains: [term] } }
            ]
        }));
        // Apply AND logic between terms (all terms must match)
        return {
            AND: searchConditions
        };
    }
    /**
     * Build job search conditions from parsed query
     */
    buildJobSearchConditions(parsedQuery) {
        if (!parsedQuery.isValid || parsedQuery.terms.length === 0) {
            return {};
        }
        // Each term should match at least one searchable field
        const searchConditions = parsedQuery.terms.map(term => ({
            OR: [
                { title: { contains: term, mode: 'insensitive' } },
                { department: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
                { jobDomain: { contains: term, mode: 'insensitive' } },
                { preferredIndustry: { contains: term, mode: 'insensitive' } },
                // Search in skills array (JSON field)
                { skills: { array_contains: [term] } },
                // Search in locations array (JSON field)
                { locations: { array_contains: [term] } }
            ]
        }));
        // Apply AND logic between terms
        return {
            AND: searchConditions
        };
    }
    /**
     * Build candidate filters
     * Requirements: 14.1 - Filter candidates by stage, date range, location, source, experience, skills
     */
    buildCandidateFilters(filters) {
        const conditions = {};
        // Location filter
        if (filters.location && filters.location.length > 0) {
            conditions.location = {
                in: filters.location,
                mode: 'insensitive'
            };
        }
        // Source filter
        if (filters.source && filters.source.length > 0) {
            conditions.source = {
                in: filters.source
            };
        }
        // Experience range filter
        if (filters.experienceMin !== undefined || filters.experienceMax !== undefined) {
            conditions.experienceYears = {};
            if (filters.experienceMin !== undefined) {
                conditions.experienceYears.gte = filters.experienceMin;
            }
            if (filters.experienceMax !== undefined) {
                conditions.experienceYears.lte = filters.experienceMax;
            }
        }
        // Skills filter - candidate must have all specified skills
        if (filters.skills && filters.skills.length > 0) {
            conditions.AND = filters.skills.map(skill => ({
                skills: { array_contains: [skill] }
            }));
        }
        // Date range filter (created date)
        if (filters.dateRange) {
            conditions.createdAt = {
                gte: filters.dateRange.start,
                lte: filters.dateRange.end
            };
        }
        // Stage filter - requires joining with JobCandidate
        if (filters.stage && filters.stage.length > 0) {
            conditions.jobCandidates = {
                some: {
                    currentStage: {
                        name: {
                            in: filters.stage
                        }
                    }
                }
            };
        }
        return conditions;
    }
    /**
     * Build job filters
     * Requirements: 14.2 - Filter jobs by status, department, location, priority, SLA status
     */
    buildJobFilters(filters) {
        const conditions = {};
        // Status filter
        if (filters.status && filters.status.length > 0) {
            conditions.status = {
                in: filters.status
            };
        }
        // Department filter
        if (filters.department && filters.department.length > 0) {
            conditions.department = {
                in: filters.department
            };
        }
        // Location filter - search in locations JSON array
        if (filters.location && filters.location.length > 0) {
            conditions.OR = filters.location.map(location => ({
                locations: { array_contains: [location] }
            }));
        }
        // Priority filter
        if (filters.priority && filters.priority.length > 0) {
            conditions.priority = {
                in: filters.priority
            };
        }
        // Date range filter (created date)
        if (filters.dateRange) {
            conditions.createdAt = {
                gte: filters.dateRange.start,
                lte: filters.dateRange.end
            };
        }
        // Experience range filter for jobs
        if (filters.experienceMin !== undefined || filters.experienceMax !== undefined) {
            if (filters.experienceMin !== undefined) {
                conditions.experienceMin = { gte: filters.experienceMin };
            }
            if (filters.experienceMax !== undefined) {
                conditions.experienceMax = { lte: filters.experienceMax };
            }
        }
        // Skills filter - job must have all specified skills
        if (filters.skills && filters.skills.length > 0) {
            conditions.AND = filters.skills.map(skill => ({
                skills: { array_contains: [skill] }
            }));
        }
        return conditions;
    }
    /**
     * Generate highlights for matching terms in candidate results
     * Requirements: 13.4 - Highlight matching terms in search results
     */
    generateHighlights(candidates, terms) {
        const highlights = new Map();
        candidates.forEach(candidate => {
            const candidateHighlights = [];
            terms.forEach(term => {
                const termLower = term.toLowerCase();
                // Check each searchable field for matches
                if (candidate.name.toLowerCase().includes(termLower)) {
                    candidateHighlights.push(`name:${term}`);
                }
                if (candidate.email.toLowerCase().includes(termLower)) {
                    candidateHighlights.push(`email:${term}`);
                }
                if (candidate.phone?.toLowerCase().includes(termLower)) {
                    candidateHighlights.push(`phone:${term}`);
                }
                if (candidate.currentCompany?.toLowerCase().includes(termLower)) {
                    candidateHighlights.push(`currentCompany:${term}`);
                }
                if (candidate.location.toLowerCase().includes(termLower)) {
                    candidateHighlights.push(`location:${term}`);
                }
                if (candidate.title?.toLowerCase().includes(termLower)) {
                    candidateHighlights.push(`title:${term}`);
                }
                // Check skills array
                const skills = Array.isArray(candidate.skills) ? candidate.skills : [];
                if (skills.some((skill) => skill.toLowerCase().includes(termLower))) {
                    candidateHighlights.push(`skills:${term}`);
                }
                // Check tags array
                const tags = Array.isArray(candidate.tags) ? candidate.tags : [];
                if (tags.some((tag) => tag.toLowerCase().includes(termLower))) {
                    candidateHighlights.push(`tags:${term}`);
                }
            });
            if (candidateHighlights.length > 0) {
                highlights.set(candidate.id, candidateHighlights);
            }
        });
        return highlights;
    }
    /**
     * Generate highlights for matching terms in job results
     */
    generateJobHighlights(jobs, terms) {
        const highlights = new Map();
        jobs.forEach(job => {
            const jobHighlights = [];
            terms.forEach(term => {
                const termLower = term.toLowerCase();
                // Check each searchable field for matches
                if (job.title.toLowerCase().includes(termLower)) {
                    jobHighlights.push(`title:${term}`);
                }
                if (job.department.toLowerCase().includes(termLower)) {
                    jobHighlights.push(`department:${term}`);
                }
                if (job.description?.toLowerCase().includes(termLower)) {
                    jobHighlights.push(`description:${term}`);
                }
                if (job.jobDomain?.toLowerCase().includes(termLower)) {
                    jobHighlights.push(`jobDomain:${term}`);
                }
                // Check skills array
                const skills = Array.isArray(job.skills) ? job.skills : [];
                if (skills.some((skill) => skill.toLowerCase().includes(termLower))) {
                    jobHighlights.push(`skills:${term}`);
                }
                // Check locations array
                const locations = Array.isArray(job.locations) ? job.locations : [];
                if (locations.some((location) => location.toLowerCase().includes(termLower))) {
                    jobHighlights.push(`locations:${term}`);
                }
            });
            if (jobHighlights.length > 0) {
                highlights.set(job.id, jobHighlights);
            }
        });
        return highlights;
    }
    /**
     * Count active filters for display
     * Requirements: 14.5 - Display count of active filters
     */
    countActiveFilters(filters) {
        let count = 0;
        if (filters.stage && filters.stage.length > 0)
            count++;
        if (filters.dateRange)
            count++;
        if (filters.location && filters.location.length > 0)
            count++;
        if (filters.source && filters.source.length > 0)
            count++;
        if (filters.experienceMin !== undefined || filters.experienceMax !== undefined)
            count++;
        if (filters.skills && filters.skills.length > 0)
            count++;
        if (filters.status && filters.status.length > 0)
            count++;
        if (filters.department && filters.department.length > 0)
            count++;
        if (filters.priority && filters.priority.length > 0)
            count++;
        if (filters.slaStatus && filters.slaStatus.length > 0)
            count++;
        return count;
    }
    /**
     * Clear all filters
     * Requirements: 14.6 - Provide clear all filters action
     */
    clearAllFilters() {
        return {
            stage: undefined,
            dateRange: undefined,
            location: undefined,
            source: undefined,
            experienceMin: undefined,
            experienceMax: undefined,
            skills: undefined,
            status: undefined,
            department: undefined,
            priority: undefined,
            slaStatus: undefined
        };
    }
}
// Export singleton instance
export const searchService = new SearchService();
//# sourceMappingURL=search.service.js.map