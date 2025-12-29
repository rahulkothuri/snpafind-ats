import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { searchService } from '../services/search.service.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const candidateSearchSchema = z.object({
  query: z.string().optional().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Candidate-specific filters
  stage: z.array(z.string()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.array(z.string()).optional(),
  source: z.array(z.string()).optional(),
  experienceMin: z.coerce.number().int().min(0).optional(),
  experienceMax: z.coerce.number().int().min(0).optional(),
  skills: z.array(z.string()).optional(),
});

const jobSearchSchema = z.object({
  query: z.string().optional().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Job-specific filters
  status: z.array(z.string()).optional(),
  department: z.array(z.string()).optional(),
  location: z.array(z.string()).optional(),
  priority: z.array(z.string()).optional(),
  slaStatus: z.array(z.string()).optional(),
});

/**
 * Helper function to parse query parameters into arrays
 */
function parseArrayParam(param: any): string[] | undefined {
  if (!param) return undefined;
  if (Array.isArray(param)) return param;
  return [param];
}

/**
 * GET /api/search/candidates
 * Search candidates with Boolean query support and advanced filtering
 * Requirements: 13.1, 13.2, 13.4, 13.5, 14.1, 14.3
 */
router.get(
  '/candidates',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Parse array parameters
      const queryParams = {
        ...req.query,
        stage: parseArrayParam(req.query.stage),
        location: parseArrayParam(req.query.location),
        source: parseArrayParam(req.query.source),
        skills: parseArrayParam(req.query.skills),
      };

      const searchParamsResult = candidateSearchSchema.safeParse(queryParams);
      if (!searchParamsResult.success) {
        throw new ValidationError({
          search: searchParamsResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
        });
      }

      const searchParams = searchParamsResult.data;

      // Build search query
      const searchQuery = {
        query: searchParams.query,
        page: searchParams.page,
        pageSize: searchParams.pageSize,
        sortBy: searchParams.sortBy,
        sortOrder: searchParams.sortOrder,
        filters: {
          stage: searchParams.stage,
          dateRange: searchParams.startDate && searchParams.endDate ? {
            start: new Date(searchParams.startDate),
            end: new Date(searchParams.endDate)
          } : undefined,
          location: searchParams.location,
          source: searchParams.source,
          experienceMin: searchParams.experienceMin,
          experienceMax: searchParams.experienceMax,
          skills: searchParams.skills,
        }
      };

      // Perform search with company filtering
      const searchResults = await searchService.searchCandidates(
        req.user!.companyId,
        searchQuery
      );

      // Parse Boolean query for debugging/validation
      const parsedQuery = searchService.parseBooleanQuery(searchParams.query);

      res.json({
        ...searchResults,
        query: {
          original: searchParams.query,
          parsed: parsedQuery,
        },
        filters: searchQuery.filters,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/search/jobs
 * Search jobs with advanced filtering
 * Requirements: 14.1, 14.2
 */
router.get(
  '/jobs',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Parse array parameters
      const queryParams = {
        ...req.query,
        status: parseArrayParam(req.query.status),
        department: parseArrayParam(req.query.department),
        location: parseArrayParam(req.query.location),
        priority: parseArrayParam(req.query.priority),
        slaStatus: parseArrayParam(req.query.slaStatus),
      };

      const searchParamsResult = jobSearchSchema.safeParse(queryParams);
      if (!searchParamsResult.success) {
        throw new ValidationError({
          search: searchParamsResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
        });
      }

      const searchParams = searchParamsResult.data;

      // Build search query
      const searchQuery = {
        query: searchParams.query,
        page: searchParams.page,
        pageSize: searchParams.pageSize,
        sortBy: searchParams.sortBy,
        sortOrder: searchParams.sortOrder,
        filters: {
          status: searchParams.status,
          department: searchParams.department,
          location: searchParams.location,
          priority: searchParams.priority,
          slaStatus: searchParams.slaStatus,
        }
      };

      // Perform search with company and role-based filtering
      const searchResults = await searchService.searchJobs(
        req.user!.companyId,
        searchQuery
      );

      // Parse Boolean query for debugging/validation
      const parsedQuery = searchService.parseBooleanQuery(searchParams.query);

      res.json({
        ...searchResults,
        query: {
          original: searchParams.query,
          parsed: parsedQuery,
        },
        filters: searchQuery.filters,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/search/suggestions
 * Get search suggestions based on query
 * Requirements: 13.7
 */
router.get(
  '/suggestions',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { query, type = 'candidates' } = req.query;

      if (!query || typeof query !== 'string') {
        return res.json({ suggestions: [] });
      }

      // Get search suggestions based on type
      const suggestions = await getSearchSuggestions(
        req.user!.companyId,
        query,
        type as 'candidates' | 'jobs'
      );

      res.json({ suggestions });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/search/filters
 * Get available filter options for search
 * Requirements: 14.5, 14.6
 */
router.get(
  '/filters',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { type = 'candidates' } = req.query;

      const filterOptions = await getFilterOptions(
        req.user!.companyId,
        type as 'candidates' | 'jobs'
      );

      res.json(filterOptions);
    } catch (error) {
      next(error);
    }
  }
);

// Helper functions

/**
 * Get search suggestions based on existing data
 */
async function getSearchSuggestions(
  companyId: string,
  query: string,
  type: 'candidates' | 'jobs'
): Promise<string[]> {
  const suggestions: string[] = [];
  const queryLower = query.toLowerCase();

  if (type === 'candidates') {
    // Get candidate name suggestions
    const { prisma } = await import('../lib/prisma.js');
    const candidates = await prisma.candidate.findMany({
      where: {
        companyId,
        OR: [
          { name: { contains: queryLower, mode: 'insensitive' } },
          { email: { contains: queryLower, mode: 'insensitive' } },
          { currentCompany: { contains: queryLower, mode: 'insensitive' } },
        ]
      },
      select: {
        name: true,
        email: true,
        currentCompany: true,
      },
      take: 10,
    });

    candidates.forEach(candidate => {
      if (candidate.name.toLowerCase().includes(queryLower)) {
        suggestions.push(candidate.name);
      }
      if (candidate.email?.toLowerCase().includes(queryLower)) {
        suggestions.push(candidate.email);
      }
      if (candidate.currentCompany?.toLowerCase().includes(queryLower)) {
        suggestions.push(candidate.currentCompany);
      }
    });
  } else {
    // Get job title suggestions
    const { prisma } = await import('../lib/prisma.js');
    const jobs = await prisma.job.findMany({
      where: {
        companyId,
        title: { contains: queryLower, mode: 'insensitive' }
      },
      select: {
        title: true,
      },
      take: 10,
    });

    jobs.forEach(job => {
      if (job.title.toLowerCase().includes(queryLower)) {
        suggestions.push(job.title);
      }
    });
  }

  // Remove duplicates and return
  return [...new Set(suggestions)].slice(0, 5);
}

/**
 * Get available filter options
 */
async function getFilterOptions(
  companyId: string,
  type: 'candidates' | 'jobs'
) {
  const { prisma } = await import('../lib/prisma.js');

  if (type === 'candidates') {
    // Get unique values for candidate filters
    const [locations, sources, skills] = await Promise.all([
      prisma.candidate.findMany({
        where: { companyId },
        select: { location: true },
        distinct: ['location'],
      }),
      prisma.candidate.findMany({
        where: { companyId },
        select: { source: true },
        distinct: ['source'],
      }),
      prisma.candidate.findMany({
        where: { 
          companyId, 
          skills: { 
            not: Prisma.JsonNull 
          } 
        },
        select: { skills: true },
      }),
    ]);

    // Extract unique skills
    const allSkills = skills.flatMap(c => c.skills || []);
    const uniqueSkills = [...new Set(allSkills)];

    return {
      locations: locations.map(l => l.location).filter(Boolean),
      sources: sources.map(s => s.source).filter(Boolean),
      skills: uniqueSkills,
      experienceRanges: [
        { label: '0-2 years', min: 0, max: 2 },
        { label: '3-5 years', min: 3, max: 5 },
        { label: '6-10 years', min: 6, max: 10 },
        { label: '10+ years', min: 10, max: null },
      ],
    };
  } else {
    // Get unique values for job filters
    const [departments, locations, priorities] = await Promise.all([
      prisma.job.findMany({
        where: { companyId },
        select: { jobDomain: true },
        distinct: ['jobDomain'],
      }),
      prisma.job.findMany({
        where: { companyId },
        select: { locations: true },
      }),
      prisma.job.findMany({
        where: { companyId },
        select: { priority: true },
        distinct: ['priority'],
      }),
    ]);

    // Extract unique locations from arrays
    const allLocations = locations.flatMap(j => j.locations || []);
    const uniqueLocations = [...new Set(allLocations)];

    return {
      statuses: ['active', 'paused', 'closed'],
      departments: departments.map(d => d.jobDomain).filter(Boolean),
      locations: uniqueLocations,
      priorities: priorities.map(p => p.priority).filter(Boolean),
      slaStatuses: ['On track', 'At risk', 'Breached'],
    };
  }
}

export default router;