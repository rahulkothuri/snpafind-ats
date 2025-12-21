import prisma from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler.js';
import type { Candidate, CandidateActivity, JobCandidate } from '../types/index.js';

// Transaction client type
type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>;

// Type for Prisma candidate result
interface PrismaCandidateResult {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string | null;
  experienceYears: number;
  currentCompany: string | null;
  location: string;
  currentCtc: string | null;
  expectedCtc: string | null;
  noticePeriod: string | null;
  source: string;
  availability: string | null;
  skills: unknown;
  resumeUrl: string | null;
  score: number | null;
  createdAt: Date;
  updatedAt: Date;
  // Enhanced fields
  age: number | null;
  industry: string | null;
  jobDomain: string | null;
  candidateSummary: string | null;
  tags: unknown;
  title: string | null;
  department: string | null;
  internalMobility: boolean;
}

export interface CreateCandidateData {
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  experienceYears?: number;
  currentCompany?: string;
  location: string;
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string;
  source: string;
  availability?: string;
  skills?: string[];
  score?: number;
}

export interface UpdateCandidateData {
  name?: string;
  email?: string;
  phone?: string;
  experienceYears?: number;
  currentCompany?: string;
  location?: string;
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string;
  source?: string;
  availability?: string;
  skills?: string[];
  resumeUrl?: string;
  score?: number;
}


export interface CandidateSearchFilters {
  query?: string;
  department?: string;
  location?: string;
  experienceMin?: number;
  experienceMax?: number;
  source?: string;
  availability?: string;
  scoreMin?: number;
  scoreMax?: number;
  sortBy?: 'score_asc' | 'score_desc' | 'updated' | 'name';
}

export interface StageChangeData {
  jobCandidateId: string;
  newStageId: string;
  rejectionReason?: string;
}

export interface StageChangeResult {
  jobCandidate: JobCandidate;
  activity: CandidateActivity;
}

export interface ScoreUpdateResult {
  candidate: Candidate;
  activity: CandidateActivity;
}

function mapPrismaCandidateToCandidate(candidate: PrismaCandidateResult): Candidate {
  return {
    id: candidate.id,
    companyId: candidate.companyId,
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone ?? undefined,
    experienceYears: candidate.experienceYears,
    currentCompany: candidate.currentCompany ?? undefined,
    location: candidate.location,
    currentCtc: candidate.currentCtc ?? undefined,
    expectedCtc: candidate.expectedCtc ?? undefined,
    noticePeriod: candidate.noticePeriod ?? undefined,
    source: candidate.source,
    availability: candidate.availability ?? undefined,
    skills: Array.isArray(candidate.skills) ? candidate.skills as string[] : [],
    resumeUrl: candidate.resumeUrl ?? undefined,
    score: candidate.score ?? undefined,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
    // Enhanced fields
    age: candidate.age ?? undefined,
    industry: candidate.industry ?? undefined,
    jobDomain: candidate.jobDomain ?? undefined,
    candidateSummary: candidate.candidateSummary ?? undefined,
    tags: Array.isArray(candidate.tags) ? candidate.tags as string[] : [],
    title: candidate.title ?? undefined,
    department: candidate.department ?? undefined,
    internalMobility: candidate.internalMobility ?? false,
  };
}

export const candidateService = {
  /**
   * Create a new candidate
   * Requirements: 8.1, 8.2, 8.4
   */
  async create(data: CreateCandidateData): Promise<Candidate> {
    // Validate required fields
    const errors: Record<string, string[]> = {};
    if (!data.name || data.name.trim() === '') {
      errors.name = ['Name is required'];
    }
    if (!data.email || data.email.trim() === '') {
      errors.email = ['Email is required'];
    }
    if (!data.location || data.location.trim() === '') {
      errors.location = ['Location is required'];
    }
    if (!data.source || data.source.trim() === '') {
      errors.source = ['Source is required'];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    // Check for duplicate email (Requirements 8.4)
    const existingCandidate = await prisma.candidate.findUnique({
      where: { email: data.email.trim().toLowerCase() },
    });

    if (existingCandidate) {
      throw new ConflictError('Candidate with this email already exists', {
        existingId: existingCandidate.id,
      });
    }

    // Create candidate (Requirements 8.1, 8.2)
    const candidate = await prisma.candidate.create({
      data: {
        companyId: data.companyId,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim(),
        experienceYears: data.experienceYears ?? 0,
        currentCompany: data.currentCompany?.trim(),
        location: data.location.trim(),
        currentCtc: data.currentCtc?.trim(),
        expectedCtc: data.expectedCtc?.trim(),
        noticePeriod: data.noticePeriod?.trim(),
        source: data.source.trim(),
        availability: data.availability?.trim(),
        skills: data.skills ?? [],
        score: data.score,
      },
    });

    return mapPrismaCandidateToCandidate(candidate as PrismaCandidateResult);
  },

  /**
   * Get a candidate by ID
   */
  async getById(id: string): Promise<Candidate> {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      throw new NotFoundError('Candidate');
    }

    return mapPrismaCandidateToCandidate(candidate as PrismaCandidateResult);
  },

  /**
   * Get a candidate by email
   */
  async getByEmail(email: string): Promise<Candidate | null> {
    const candidate = await prisma.candidate.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!candidate) {
      return null;
    }

    return mapPrismaCandidateToCandidate(candidate as PrismaCandidateResult);
  },


  /**
   * Update a candidate
   * Requirements: 9.2
   */
  async update(id: string, data: UpdateCandidateData): Promise<Candidate> {
    const existing = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Candidate');
    }

    // If email is being updated, check for duplicates
    if (data.email && data.email.toLowerCase() !== existing.email) {
      const emailExists = await prisma.candidate.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      if (emailExists) {
        throw new ConflictError('Candidate with this email already exists', {
          existingId: emailExists.id,
        });
      }
    }

    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        email: data.email?.trim().toLowerCase(),
        phone: data.phone?.trim(),
        experienceYears: data.experienceYears,
        currentCompany: data.currentCompany?.trim(),
        location: data.location?.trim(),
        currentCtc: data.currentCtc?.trim(),
        expectedCtc: data.expectedCtc?.trim(),
        noticePeriod: data.noticePeriod?.trim(),
        source: data.source?.trim(),
        availability: data.availability?.trim(),
        skills: data.skills,
        resumeUrl: data.resumeUrl,
        score: data.score,
      },
    });

    return mapPrismaCandidateToCandidate(candidate as PrismaCandidateResult);
  },

  /**
   * Get all candidates for a company
   * Requirements: 8.3
   */
  async getAllByCompany(companyId: string): Promise<Candidate[]> {
    const candidates = await prisma.candidate.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return candidates.map((c: PrismaCandidateResult) => mapPrismaCandidateToCandidate(c));
  },

  /**
   * Get all candidates
   */
  async getAll(): Promise<Candidate[]> {
    const candidates = await prisma.candidate.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return candidates.map((c: PrismaCandidateResult) => mapPrismaCandidateToCandidate(c));
  },

  /**
   * Search candidates
   * Requirements: 11.1, 11.2, 11.3, 11.4
   */
  async search(companyId: string, filters: CandidateSearchFilters): Promise<Candidate[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { companyId };

    // Text search on name, email, phone (Requirements 11.1)
    if (filters.query) {
      const query = filters.query.trim();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ];
    }

    // Filter by location (Requirements 11.2)
    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    // Filter by experience range (Requirements 11.2)
    if (filters.experienceMin !== undefined || filters.experienceMax !== undefined) {
      where.experienceYears = {};
      if (filters.experienceMin !== undefined) {
        where.experienceYears.gte = filters.experienceMin;
      }
      if (filters.experienceMax !== undefined) {
        where.experienceYears.lte = filters.experienceMax;
      }
    }

    // Filter by source (Requirements 11.2)
    if (filters.source) {
      where.source = { contains: filters.source, mode: 'insensitive' };
    }

    // Filter by availability (Requirements 11.2)
    if (filters.availability) {
      where.availability = { contains: filters.availability, mode: 'insensitive' };
    }

    const candidates = await prisma.candidate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return candidates.map((c: PrismaCandidateResult) => mapPrismaCandidateToCandidate(c));
  },

  /**
   * Update resume URL for a candidate
   * Requirements: 10.1
   */
  async updateResumeUrl(id: string, resumeUrl: string): Promise<Candidate> {
    const existing = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Candidate');
    }

    const candidate = await prisma.candidate.update({
      where: { id },
      data: { resumeUrl },
    });

    return mapPrismaCandidateToCandidate(candidate as PrismaCandidateResult);
  },

  /**
   * Delete a candidate
   */
  async delete(id: string): Promise<void> {
    const existing = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Candidate');
    }

    await prisma.candidate.delete({
      where: { id },
    });
  },

  /**
   * Change a candidate's stage in a job pipeline
   * Requirements: 24.1, 24.2, 24.3, 24.4
   */
  async changeStage(data: StageChangeData): Promise<StageChangeResult> {
    // Validate required fields
    if (!data.jobCandidateId) {
      throw new ValidationError({ jobCandidateId: ['Job candidate ID is required'] });
    }
    if (!data.newStageId) {
      throw new ValidationError({ newStageId: ['New stage ID is required'] });
    }

    // Find the job candidate record
    const jobCandidate = await prisma.jobCandidate.findUnique({
      where: { id: data.jobCandidateId },
      include: {
        currentStage: true,
        candidate: true,
        job: {
          include: {
            pipelineStages: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (!jobCandidate) {
      throw new NotFoundError('Job candidate');
    }

    // Verify the new stage exists and belongs to the same job
    const newStage = jobCandidate.job.pipelineStages.find(
      (s: { id: string }) => s.id === data.newStageId
    );

    if (!newStage) {
      throw new ValidationError({ 
        newStageId: ['Stage not found in this job pipeline'] 
      });
    }

    // Check if moving to Rejected stage requires a reason (Requirements 24.4)
    if (newStage.name.toLowerCase() === 'rejected' && !data.rejectionReason) {
      throw new ValidationError({ 
        rejectionReason: ['Rejection reason is required when moving to Rejected stage'] 
      });
    }

    const oldStageName = jobCandidate.currentStage.name;
    const newStageName = newStage.name;

    // Update stage and create activity in a transaction (Requirements 24.1, 24.2)
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Update the job candidate's current stage
      const updatedJobCandidate = await tx.jobCandidate.update({
        where: { id: data.jobCandidateId },
        data: { currentStageId: data.newStageId },
      });

      // Create activity entry for the stage change
      const activityDescription = data.rejectionReason
        ? `Moved from ${oldStageName} to ${newStageName}. Reason: ${data.rejectionReason}`
        : `Moved from ${oldStageName} to ${newStageName}`;

      const activity = await tx.candidateActivity.create({
        data: {
          candidateId: jobCandidate.candidateId,
          jobCandidateId: data.jobCandidateId,
          activityType: 'stage_change',
          description: activityDescription,
          metadata: {
            fromStageId: jobCandidate.currentStageId,
            fromStageName: oldStageName,
            toStageId: data.newStageId,
            toStageName: newStageName,
            rejectionReason: data.rejectionReason,
          },
        },
      });

      return { updatedJobCandidate, activity };
    });

    return {
      jobCandidate: {
        id: result.updatedJobCandidate.id,
        jobId: result.updatedJobCandidate.jobId,
        candidateId: result.updatedJobCandidate.candidateId,
        currentStageId: result.updatedJobCandidate.currentStageId,
        appliedAt: result.updatedJobCandidate.appliedAt,
        updatedAt: result.updatedJobCandidate.updatedAt,
      },
      activity: {
        id: result.activity.id,
        candidateId: result.activity.candidateId,
        jobCandidateId: result.activity.jobCandidateId ?? undefined,
        activityType: result.activity.activityType as 'stage_change',
        description: result.activity.description,
        metadata: result.activity.metadata as Record<string, unknown> | undefined,
        createdAt: result.activity.createdAt,
      },
    };
  },

  /**
   * Get available stages for a job candidate
   * Requirements: 24.3
   */
  async getAvailableStages(jobCandidateId: string): Promise<{ id: string; name: string; position: number }[]> {
    const jobCandidate = await prisma.jobCandidate.findUnique({
      where: { id: jobCandidateId },
      include: {
        job: {
          include: {
            pipelineStages: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (!jobCandidate) {
      throw new NotFoundError('Job candidate');
    }

    return jobCandidate.job.pipelineStages.map((s: { id: string; name: string; position: number }) => ({
      id: s.id,
      name: s.name,
      position: s.position,
    }));
  },

  /**
   * Update a candidate's score
   * Requirements: 25.1, 25.2
   */
  async updateScore(candidateId: string, score: number): Promise<ScoreUpdateResult> {
    // Validate score range
    if (score < 0 || score > 100) {
      throw new ValidationError({ score: ['Score must be between 0 and 100'] });
    }

    const existing = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!existing) {
      throw new NotFoundError('Candidate');
    }

    const oldScore = existing.score;

    // Update score and create activity in a transaction
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const updatedCandidate = await tx.candidate.update({
        where: { id: candidateId },
        data: { score },
      });

      const activity = await tx.candidateActivity.create({
        data: {
          candidateId,
          activityType: 'score_updated',
          description: `Score updated from ${oldScore ?? 'unset'} to ${score}`,
          metadata: {
            oldScore,
            newScore: score,
          },
        },
      });

      return { updatedCandidate, activity };
    });

    return {
      candidate: mapPrismaCandidateToCandidate(result.updatedCandidate as PrismaCandidateResult),
      activity: {
        id: result.activity.id,
        candidateId: result.activity.candidateId,
        jobCandidateId: result.activity.jobCandidateId ?? undefined,
        activityType: result.activity.activityType as 'score_updated',
        description: result.activity.description,
        metadata: result.activity.metadata as Record<string, unknown> | undefined,
        createdAt: result.activity.createdAt,
      },
    };
  },

  /**
   * Get candidate's activity timeline
   */
  async getActivityTimeline(candidateId: string): Promise<CandidateActivity[]> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundError('Candidate');
    }

    const activities = await prisma.candidateActivity.findMany({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
    });

    return activities.map((a: {
      id: string;
      candidateId: string;
      jobCandidateId: string | null;
      activityType: string;
      description: string;
      metadata: unknown;
      createdAt: Date;
    }) => ({
      id: a.id,
      candidateId: a.candidateId,
      jobCandidateId: a.jobCandidateId ?? undefined,
      activityType: a.activityType as CandidateActivity['activityType'],
      description: a.description,
      metadata: a.metadata as Record<string, unknown> | undefined,
      createdAt: a.createdAt,
    }));
  },

  /**
   * Search candidates with score filtering and sorting
   * Requirements: 25.3, 25.4
   */
  async searchWithScoring(companyId: string, filters: CandidateSearchFilters): Promise<Candidate[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { companyId };

    // Text search on name, email, phone (Requirements 11.1)
    if (filters.query) {
      const query = filters.query.trim();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ];
    }

    // Filter by location
    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    // Filter by experience range
    if (filters.experienceMin !== undefined || filters.experienceMax !== undefined) {
      where.experienceYears = {};
      if (filters.experienceMin !== undefined) {
        where.experienceYears.gte = filters.experienceMin;
      }
      if (filters.experienceMax !== undefined) {
        where.experienceYears.lte = filters.experienceMax;
      }
    }

    // Filter by source
    if (filters.source) {
      where.source = { contains: filters.source, mode: 'insensitive' };
    }

    // Filter by availability
    if (filters.availability) {
      where.availability = { contains: filters.availability, mode: 'insensitive' };
    }

    // Filter by score range (Requirements 25.4)
    if (filters.scoreMin !== undefined || filters.scoreMax !== undefined) {
      where.score = {};
      if (filters.scoreMin !== undefined) {
        where.score.gte = filters.scoreMin;
      }
      if (filters.scoreMax !== undefined) {
        where.score.lte = filters.scoreMax;
      }
    }

    // Determine sort order (Requirements 25.3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { updatedAt: 'desc' };
    if (filters.sortBy === 'score_asc') {
      orderBy = { score: 'asc' };
    } else if (filters.sortBy === 'score_desc') {
      orderBy = { score: 'desc' };
    } else if (filters.sortBy === 'name') {
      orderBy = { name: 'asc' };
    }

    const candidates = await prisma.candidate.findMany({
      where,
      orderBy,
    });

    return candidates.map((c: PrismaCandidateResult) => mapPrismaCandidateToCandidate(c));
  },
};

export default candidateService;
