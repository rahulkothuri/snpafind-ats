import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler.js';
import { stageHistoryService } from './stageHistory.service.js';
import { notificationService } from './notification.service.js';
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
        // Score breakdown fields (Requirements 8.2)
        domainScore: candidate.domainScore ?? undefined,
        industryScore: candidate.industryScore ?? undefined,
        keyResponsibilitiesScore: candidate.keyResponsibilitiesScore ?? undefined,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
        // Enhanced fields
        age: candidate.age ?? undefined,
        industry: candidate.industry ?? undefined,
        jobDomain: candidate.jobDomain ?? undefined,
        candidateSummary: candidate.candidateSummary ?? undefined,
        tags: Array.isArray(candidate.tags) ? candidate.tags : [],
        title: candidate.title ?? undefined,
        department: candidate.department ?? undefined,
        internalMobility: candidate.internalMobility ?? false,
    };
}
/**
 * Calculate overall score as the average of non-null sub-scores
 * Requirements: 8.3, 8.4
 * @param domainScore - Domain score (0-100 or null)
 * @param industryScore - Industry score (0-100 or null)
 * @param keyResponsibilitiesScore - Key responsibilities score (0-100 or null)
 * @returns The average of non-null scores, or null if all scores are null
 */
export function calculateOverallScore(domainScore, industryScore, keyResponsibilitiesScore) {
    const scores = [domainScore, industryScore, keyResponsibilitiesScore].filter((score) => score !== null && score !== undefined);
    if (scores.length === 0) {
        return null;
    }
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Math.round(sum / scores.length);
}
export const candidateService = {
    /**
     * Create a new candidate
     * Requirements: 8.1, 8.2, 8.4, 8.5
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
        // Validate score breakdown fields (0-100 range)
        if (data.domainScore !== undefined && (data.domainScore < 0 || data.domainScore > 100)) {
            errors.domainScore = ['Domain score must be between 0 and 100'];
        }
        if (data.industryScore !== undefined && (data.industryScore < 0 || data.industryScore > 100)) {
            errors.industryScore = ['Industry score must be between 0 and 100'];
        }
        if (data.keyResponsibilitiesScore !== undefined && (data.keyResponsibilitiesScore < 0 || data.keyResponsibilitiesScore > 100)) {
            errors.keyResponsibilitiesScore = ['Key responsibilities score must be between 0 and 100'];
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
        // Calculate overall score from sub-scores if not provided (Requirements 8.3)
        const calculatedScore = data.score ?? calculateOverallScore(data.domainScore, data.industryScore, data.keyResponsibilitiesScore);
        // Create candidate (Requirements 8.1, 8.2, 8.5)
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
                score: calculatedScore,
                // Score breakdown fields
                domainScore: data.domainScore,
                industryScore: data.industryScore,
                keyResponsibilitiesScore: data.keyResponsibilitiesScore,
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
     * Requirements: 9.2, 8.5
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
        // Validate score breakdown fields (0-100 range)
        const errors = {};
        if (data.domainScore !== undefined && (data.domainScore < 0 || data.domainScore > 100)) {
            errors.domainScore = ['Domain score must be between 0 and 100'];
        }
        if (data.industryScore !== undefined && (data.industryScore < 0 || data.industryScore > 100)) {
            errors.industryScore = ['Industry score must be between 0 and 100'];
        }
        if (data.keyResponsibilitiesScore !== undefined && (data.keyResponsibilitiesScore < 0 || data.keyResponsibilitiesScore > 100)) {
            errors.keyResponsibilitiesScore = ['Key responsibilities score must be between 0 and 100'];
        }
        if (Object.keys(errors).length > 0) {
            throw new ValidationError(errors);
        }
        // Determine the final sub-scores (use new values if provided, otherwise keep existing)
        const finalDomainScore = data.domainScore !== undefined ? data.domainScore : existing.domainScore;
        const finalIndustryScore = data.industryScore !== undefined ? data.industryScore : existing.industryScore;
        const finalKeyResponsibilitiesScore = data.keyResponsibilitiesScore !== undefined
            ? data.keyResponsibilitiesScore
            : existing.keyResponsibilitiesScore;
        // Recalculate overall score if any sub-score is being updated and score is not explicitly provided
        // Requirements: 8.3
        let finalScore = data.score;
        if (finalScore === undefined && (data.domainScore !== undefined ||
            data.industryScore !== undefined ||
            data.keyResponsibilitiesScore !== undefined)) {
            finalScore = calculateOverallScore(finalDomainScore, finalIndustryScore, finalKeyResponsibilitiesScore) ?? undefined;
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
                score: finalScore,
                // Score breakdown fields (Requirements 8.5)
                domainScore: data.domainScore,
                industryScore: data.industryScore,
                keyResponsibilitiesScore: data.keyResponsibilitiesScore,
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
     * Requirements: 24.1, 24.2, 24.3, 24.4, 2.1, 2.2
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
        const isRejectionStage = newStage.name.toLowerCase().includes('reject') ||
            newStage.name.toLowerCase().includes('declined') ||
            newStage.name.toLowerCase().includes('not selected');
        if (isRejectionStage && !data.rejectionReason && !data.comment) {
            throw new ValidationError({
                rejectionReason: ['Rejection reason is required when moving to Rejected stage']
            });
        }
        const oldStageName = jobCandidate.currentStage.name;
        const oldStageId = jobCandidate.currentStageId;
        const newStageName = newStage.name;
        const comment = data.comment || data.rejectionReason;
        // Update stage and create activity in a transaction (Requirements 24.1, 24.2, 2.1, 2.2)
        const result = await prisma.$transaction(async (tx) => {
            // Close the previous stage history entry (Requirements 2.2)
            await stageHistoryService.closeStageEntry({
                jobCandidateId: data.jobCandidateId,
                stageId: oldStageId,
            }, tx);
            // Create new stage history entry (Requirements 2.1)
            await stageHistoryService.createStageEntry({
                jobCandidateId: data.jobCandidateId,
                stageId: data.newStageId,
                stageName: newStageName,
                comment,
                movedBy: data.movedBy,
            }, tx);
            // Update the job candidate's current stage
            const updatedJobCandidate = await tx.jobCandidate.update({
                where: { id: data.jobCandidateId },
                data: { currentStageId: data.newStageId },
            });
            // Create activity entry for the stage change
            const activityDescription = comment
                ? `Moved from ${oldStageName} to ${newStageName}. Reason: ${comment}`
                : `Moved from ${oldStageName} to ${newStageName}`;
            const activity = await tx.candidateActivity.create({
                data: {
                    candidateId: jobCandidate.candidateId,
                    jobCandidateId: data.jobCandidateId,
                    activityType: 'stage_change',
                    description: activityDescription,
                    metadata: {
                        fromStageId: oldStageId,
                        fromStageName: oldStageName,
                        toStageId: data.newStageId,
                        toStageName: newStageName,
                        rejectionReason: data.rejectionReason,
                        comment,
                    },
                },
            });
            return { updatedJobCandidate, activity };
        });
        // Create notifications for stage change (Requirements 8.1)
        // This is done outside the transaction to not block the main operation
        try {
            await notificationService.createStageChangeNotifications({
                candidateId: jobCandidate.candidateId,
                candidateName: jobCandidate.candidate.name,
                jobId: jobCandidate.jobId,
                jobTitle: jobCandidate.job.title,
                fromStageName: oldStageName,
                toStageName: newStageName,
                movedByUserId: data.movedBy,
            });
        }
        catch (notificationError) {
            // Log but don't fail the stage change if notification fails
            console.error('Failed to create stage change notifications:', notificationError);
        }
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
     * Update a candidate's score breakdown (individual sub-scores)
     * Requirements: 8.3, 8.4, 8.5
     */
    async updateScoreBreakdown(candidateId, scoreBreakdown) {
        // Validate score ranges
        const errors = {};
        if (scoreBreakdown.domainScore !== undefined && (scoreBreakdown.domainScore < 0 || scoreBreakdown.domainScore > 100)) {
            errors.domainScore = ['Domain score must be between 0 and 100'];
        }
        if (scoreBreakdown.industryScore !== undefined && (scoreBreakdown.industryScore < 0 || scoreBreakdown.industryScore > 100)) {
            errors.industryScore = ['Industry score must be between 0 and 100'];
        }
        if (scoreBreakdown.keyResponsibilitiesScore !== undefined && (scoreBreakdown.keyResponsibilitiesScore < 0 || scoreBreakdown.keyResponsibilitiesScore > 100)) {
            errors.keyResponsibilitiesScore = ['Key responsibilities score must be between 0 and 100'];
        }
        if (Object.keys(errors).length > 0) {
            throw new ValidationError(errors);
        }
        const existing = await prisma.candidate.findUnique({
            where: { id: candidateId },
        });
        if (!existing) {
            throw new NotFoundError('Candidate');
        }
        // Determine final sub-scores (use new values if provided, otherwise keep existing)
        const finalDomainScore = scoreBreakdown.domainScore !== undefined
            ? scoreBreakdown.domainScore
            : existing.domainScore;
        const finalIndustryScore = scoreBreakdown.industryScore !== undefined
            ? scoreBreakdown.industryScore
            : existing.industryScore;
        const finalKeyResponsibilitiesScore = scoreBreakdown.keyResponsibilitiesScore !== undefined
            ? scoreBreakdown.keyResponsibilitiesScore
            : existing.keyResponsibilitiesScore;
        // Calculate new overall score (Requirements 8.3)
        const newOverallScore = calculateOverallScore(finalDomainScore, finalIndustryScore, finalKeyResponsibilitiesScore);
        const oldScores = {
            score: existing.score,
            domainScore: existing.domainScore,
            industryScore: existing.industryScore,
            keyResponsibilitiesScore: existing.keyResponsibilitiesScore,
        };
        // Update scores and create activity in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const updatedCandidate = await tx.candidate.update({
                where: { id: candidateId },
                data: {
                    domainScore: scoreBreakdown.domainScore,
                    industryScore: scoreBreakdown.industryScore,
                    keyResponsibilitiesScore: scoreBreakdown.keyResponsibilitiesScore,
                    score: newOverallScore,
                },
            });
            const activity = await tx.candidateActivity.create({
                data: {
                    candidateId,
                    activityType: 'score_updated',
                    description: `Score breakdown updated. Overall score: ${oldScores.score ?? 'unset'} → ${newOverallScore ?? 'unset'}`,
                    metadata: {
                        oldScores,
                        newScores: {
                            score: newOverallScore,
                            domainScore: updatedCandidate.domainScore,
                            industryScore: updatedCandidate.industryScore,
                            keyResponsibilitiesScore: updatedCandidate.keyResponsibilitiesScore,
                        },
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
     * Requirements: 25.3, 25.4, 7.3
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
        // Get all candidates first, then filter by tags in memory
        // (PostgreSQL JSON array filtering requires raw queries for complex operations)
        const candidates = await prisma.candidate.findMany({
            where,
            orderBy,
        });
        let result = candidates.map((c) => mapPrismaCandidateToCandidate(c));
        // Filter by tags (Requirements 7.3)
        if (filters.tags && filters.tags.length > 0) {
            result = result.filter((candidate) => {
                const candidateTags = candidate.tags || [];
                // Check if candidate has ALL the specified tags
                return filters.tags.every((tag) => candidateTags.includes(tag));
            });
        }
        return result;
    },
    /**
     * Add a tag to a candidate
     * Requirements: 7.2
     */
    async addTag(candidateId, tag) {
        const existing = await prisma.candidate.findUnique({
            where: { id: candidateId },
        });
        if (!existing) {
            throw new NotFoundError('Candidate');
        }
        // Validate tag
        const trimmedTag = tag.trim();
        if (!trimmedTag) {
            throw new ValidationError({ tag: ['Tag cannot be empty'] });
        }
        // Get current tags
        const currentTags = Array.isArray(existing.tags) ? existing.tags : [];
        // Check if tag already exists (case-insensitive)
        const tagExists = currentTags.some((t) => t.toLowerCase() === trimmedTag.toLowerCase());
        if (tagExists) {
            // Return candidate as-is if tag already exists
            return mapPrismaCandidateToCandidate(existing);
        }
        // Add the new tag
        const updatedTags = [...currentTags, trimmedTag];
        const candidate = await prisma.candidate.update({
            where: { id: candidateId },
            data: { tags: updatedTags },
        });
        return mapPrismaCandidateToCandidate(candidate);
    },
    /**
     * Remove a tag from a candidate
     * Requirements: 7.5
     */
    async removeTag(candidateId, tag) {
        const existing = await prisma.candidate.findUnique({
            where: { id: candidateId },
        });
        if (!existing) {
            throw new NotFoundError('Candidate');
        }
        // Get current tags
        const currentTags = Array.isArray(existing.tags) ? existing.tags : [];
        // Remove the tag (case-insensitive match)
        const trimmedTag = tag.trim();
        const updatedTags = currentTags.filter((t) => t.toLowerCase() !== trimmedTag.toLowerCase());
        const candidate = await prisma.candidate.update({
            where: { id: candidateId },
            data: { tags: updatedTags },
        });
        return mapPrismaCandidateToCandidate(candidate);
    },
    /**
     * Get all unique tags used across candidates in a company
     * Requirements: 7.2 (for autocomplete/selection)
     */
    async getAllTags(companyId) {
        const candidates = await prisma.candidate.findMany({
            where: { companyId },
            select: { tags: true },
        });
        const allTags = new Set();
        for (const candidate of candidates) {
            const tags = Array.isArray(candidate.tags) ? candidate.tags : [];
            tags.forEach((tag) => allTags.add(tag));
        }
        return Array.from(allTags).sort();
    },
    /**
     * Add an existing candidate to a job's Applied stage
     * Used by the candidate master database "Add to Job" feature
     */
    async addToJob(candidateId, jobId, companyId) {
        // Verify candidate exists and belongs to the company
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
        });
        if (!candidate) {
            throw new NotFoundError('Candidate');
        }
        if (candidate.companyId !== companyId) {
            throw new ValidationError({ candidateId: ['Candidate does not belong to your company'] });
        }
        // Find the job and its Applied stage (usually the first stage, position 0)
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: {
                pipelineStages: {
                    where: { parentId: null },
                    orderBy: { position: 'asc' },
                },
            },
        });
        if (!job) {
            throw new NotFoundError('Job');
        }
        if (job.companyId !== companyId) {
            throw new ValidationError({ jobId: ['Job does not belong to your company'] });
        }
        // Find the "Applied" stage (position 0 or first stage)
        const appliedStage = job.pipelineStages.find(s => s.name.toLowerCase() === 'applied') || job.pipelineStages[0];
        if (!appliedStage) {
            throw new ValidationError({ jobId: ['Job has no pipeline stages configured'] });
        }
        // Check if candidate is already assigned to this job
        const existingAssignment = await prisma.jobCandidate.findFirst({
            where: {
                jobId,
                candidateId,
            },
        });
        if (existingAssignment) {
            throw new ConflictError('Candidate is already added to this job', {
                code: 'ALREADY_IN_JOB',
                existingId: existingAssignment.id,
            });
        }
        // Create job candidate assignment and activity in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create job candidate assignment
            const jobCandidate = await tx.jobCandidate.create({
                data: {
                    jobId,
                    candidateId,
                    currentStageId: appliedStage.id,
                },
            });
            // Create stage history entry for the initial assignment
            await stageHistoryService.createStageEntry({
                jobCandidateId: jobCandidate.id,
                stageId: appliedStage.id,
                stageName: appliedStage.name,
                comment: 'Added from candidate database',
            }, tx);
            // Create activity entry
            await tx.candidateActivity.create({
                data: {
                    candidateId,
                    jobCandidateId: jobCandidate.id,
                    activityType: 'stage_change',
                    description: `Added to job "${job.title}" in ${appliedStage.name} stage`,
                    metadata: {
                        jobId,
                        jobTitle: job.title,
                        stageId: appliedStage.id,
                        stageName: appliedStage.name,
                        source: 'candidate_database',
                    },
                },
            });
            return jobCandidate;
        });
        return {
            message: `Candidate successfully added to ${job.title}`,
            jobCandidate: {
                id: result.id,
                jobId: result.jobId,
                candidateId: result.candidateId,
                currentStageId: result.currentStageId,
                appliedAt: result.appliedAt,
                updatedAt: result.updatedAt,
            },
        };
    },
    /**
     * Create a new candidate and assign them to a job
     * Used by the AddCandidateModal
     */
    async createAndAssignToJob(data) {
        // Check if candidate with this email already exists
        const existingCandidate = await prisma.candidate.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        // Use transaction to create candidate and job assignment
        const result = await prisma.$transaction(async (tx) => {
            let candidate;
            if (existingCandidate) {
                // Use existing candidate
                candidate = existingCandidate;
            }
            else {
                // Create new candidate
                candidate = await tx.candidate.create({
                    data: {
                        companyId: data.companyId,
                        name: data.name.trim(),
                        email: data.email.trim().toLowerCase(),
                        phone: data.phone?.trim(),
                        experienceYears: data.experienceYears || 0,
                        currentCompany: data.currentCompany?.trim(),
                        location: data.location.trim(),
                        currentCtc: data.currentCtc?.trim(),
                        expectedCtc: data.expectedCtc?.trim(),
                        noticePeriod: data.noticePeriod?.trim(),
                        source: data.source.trim(),
                        skills: data.skills || [],
                        resumeUrl: data.resumeUrl,
                        score: 0,
                    },
                });
            }
            // Find the job and its first pipeline stage
            const job = await tx.job.findUnique({
                where: { id: data.jobId },
                include: {
                    pipelineStages: {
                        where: { parentId: null },
                        orderBy: { position: 'asc' },
                        take: 1,
                    },
                },
            });
            if (!job) {
                throw new NotFoundError('Job');
            }
            if (job.pipelineStages.length === 0) {
                throw new ValidationError({ jobId: ['Job has no pipeline stages configured'] });
            }
            const firstStage = job.pipelineStages[0];
            // Check if candidate is already assigned to this job
            const existingAssignment = await tx.jobCandidate.findFirst({
                where: {
                    jobId: data.jobId,
                    candidateId: candidate.id,
                },
            });
            if (existingAssignment) {
                throw new ConflictError('Candidate is already assigned to this job', {
                    existingId: existingAssignment.id,
                });
            }
            // Create job candidate assignment
            await tx.jobCandidate.create({
                data: {
                    jobId: data.jobId,
                    candidateId: candidate.id,
                    currentStageId: firstStage.id,
                },
            });
            // Create activity entry
            await tx.candidateActivity.create({
                data: {
                    candidateId: candidate.id,
                    activityType: 'stage_change',
                    description: `Added to job: ${job.title}`,
                    metadata: {
                        jobId: data.jobId,
                        jobTitle: job.title,
                        source: data.source,
                    },
                },
            });
            return candidate;
        });
        return mapPrismaCandidateToCandidate(result);
    },
};
export default candidateService;
//# sourceMappingURL=candidate.service.js.map