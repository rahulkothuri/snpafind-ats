import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler.js';
function mapPrismaCandidateToCandidate(candidate) {
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
        skills: Array.isArray(candidate.skills) ? candidate.skills : [],
        resumeUrl: candidate.resumeUrl ?? undefined,
        score: candidate.score ?? undefined,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
    };
}
export const candidateService = {
    /**
     * Create a new candidate
     * Requirements: 8.1, 8.2, 8.4
     */
    async create(data) {
        // Validate required fields
        const errors = {};
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
        return mapPrismaCandidateToCandidate(candidate);
    },
    /**
     * Get a candidate by ID
     */
    async getById(id) {
        const candidate = await prisma.candidate.findUnique({
            where: { id },
        });
        if (!candidate) {
            throw new NotFoundError('Candidate');
        }
        return mapPrismaCandidateToCandidate(candidate);
    },
    /**
     * Get a candidate by email
     */
    async getByEmail(email) {
        const candidate = await prisma.candidate.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!candidate) {
            return null;
        }
        return mapPrismaCandidateToCandidate(candidate);
    },
    /**
     * Update a candidate
     * Requirements: 9.2
     */
    async update(id, data) {
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
        return mapPrismaCandidateToCandidate(candidate);
    },
    /**
     * Get all candidates for a company
     * Requirements: 8.3
     */
    async getAllByCompany(companyId) {
        const candidates = await prisma.candidate.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
        });
        return candidates.map((c) => mapPrismaCandidateToCandidate(c));
    },
    /**
     * Get all candidates
     */
    async getAll() {
        const candidates = await prisma.candidate.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return candidates.map((c) => mapPrismaCandidateToCandidate(c));
    },
    /**
     * Search candidates
     * Requirements: 11.1, 11.2, 11.3, 11.4
     */
    async search(companyId, filters) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where = { companyId };
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
        return candidates.map((c) => mapPrismaCandidateToCandidate(c));
    },
    /**
     * Update resume URL for a candidate
     * Requirements: 10.1
     */
    async updateResumeUrl(id, resumeUrl) {
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
        return mapPrismaCandidateToCandidate(candidate);
    },
    /**
     * Delete a candidate
     */
    async delete(id) {
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
    async changeStage(data) {
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
        const newStage = jobCandidate.job.pipelineStages.find((s) => s.id === data.newStageId);
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
        const result = await prisma.$transaction(async (tx) => {
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
                activityType: result.activity.activityType,
                description: result.activity.description,
                metadata: result.activity.metadata,
                createdAt: result.activity.createdAt,
            },
        };
    },
    /**
     * Get available stages for a job candidate
     * Requirements: 24.3
     */
    async getAvailableStages(jobCandidateId) {
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
        return jobCandidate.job.pipelineStages.map((s) => ({
            id: s.id,
            name: s.name,
            position: s.position,
        }));
    },
    /**
     * Update a candidate's score
     * Requirements: 25.1, 25.2
     */
    async updateScore(candidateId, score) {
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
        const result = await prisma.$transaction(async (tx) => {
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
            candidate: mapPrismaCandidateToCandidate(result.updatedCandidate),
            activity: {
                id: result.activity.id,
                candidateId: result.activity.candidateId,
                jobCandidateId: result.activity.jobCandidateId ?? undefined,
                activityType: result.activity.activityType,
                description: result.activity.description,
                metadata: result.activity.metadata,
                createdAt: result.activity.createdAt,
            },
        };
    },
    /**
     * Get candidate's activity timeline
     */
    async getActivityTimeline(candidateId) {
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
        return activities.map((a) => ({
            id: a.id,
            candidateId: a.candidateId,
            jobCandidateId: a.jobCandidateId ?? undefined,
            activityType: a.activityType,
            description: a.description,
            metadata: a.metadata,
            createdAt: a.createdAt,
        }));
    },
    /**
     * Search candidates with score filtering and sorting
     * Requirements: 25.3, 25.4
     */
    async searchWithScoring(companyId, filters) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where = { companyId };
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
        let orderBy = { updatedAt: 'desc' };
        if (filters.sortBy === 'score_asc') {
            orderBy = { score: 'asc' };
        }
        else if (filters.sortBy === 'score_desc') {
            orderBy = { score: 'desc' };
        }
        else if (filters.sortBy === 'name') {
            orderBy = { name: 'asc' };
        }
        const candidates = await prisma.candidate.findMany({
            where,
            orderBy,
        });
        return candidates.map((c) => mapPrismaCandidateToCandidate(c));
    },
};
export default candidateService;
//# sourceMappingURL=candidate.service.js.map