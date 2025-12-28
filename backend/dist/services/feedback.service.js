import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { interviewActivityService } from './interviewActivity.service.js';
export const DEFAULT_SCORECARD_CRITERIA = [
    { name: 'technical_skills', label: 'Technical Skills', description: 'Relevant technical knowledge and problem-solving', weight: 1 },
    { name: 'communication', label: 'Communication', description: 'Clarity, articulation, and listening skills', weight: 1 },
    { name: 'culture_fit', label: 'Culture Fit', description: 'Alignment with company values and team dynamics', weight: 1 },
    { name: 'experience', label: 'Relevant Experience', description: 'Past experience applicable to the role', weight: 1 },
    { name: 'motivation', label: 'Motivation & Interest', description: 'Enthusiasm for the role and company', weight: 1 },
];
/**
 * Feedback Service
 * Manages interview feedback and scorecards
 */
export const feedbackService = {
    async submitFeedback(data) {
        const errors = {};
        if (!data.interviewId)
            errors.interviewId = ['Interview ID is required'];
        if (!data.panelMemberId)
            errors.panelMemberId = ['Panel member ID is required'];
        if (!data.ratings || data.ratings.length === 0)
            errors.ratings = ['At least one rating is required'];
        if (!data.overallComments || data.overallComments.trim() === '')
            errors.overallComments = ['Overall comments are required'];
        if (!data.recommendation)
            errors.recommendation = ['Recommendation is required'];
        if (data.ratings) {
            for (const rating of data.ratings) {
                if (rating.score < 1 || rating.score > 5) {
                    errors.ratings = ['Rating scores must be between 1 and 5'];
                    break;
                }
            }
        }
        const validRecommendations = ['strong_hire', 'hire', 'no_hire', 'strong_no_hire'];
        if (data.recommendation && !validRecommendations.includes(data.recommendation)) {
            errors.recommendation = ['Invalid recommendation value'];
        }
        if (Object.keys(errors).length > 0) {
            throw new ValidationError(errors);
        }
        const interview = await prisma.interview.findUnique({
            where: { id: data.interviewId },
            include: {
                jobCandidate: { include: { candidate: true, job: true } },
                panelMembers: { include: { user: true } },
            },
        });
        if (!interview) {
            throw new NotFoundError('Interview');
        }
        const isPanelMember = interview.panelMembers.some(pm => pm.userId === data.panelMemberId);
        if (!isPanelMember) {
            throw new ValidationError({ panelMemberId: ['User is not a panel member for this interview'] });
        }
        const existingFeedback = await prisma.interviewFeedback.findUnique({
            where: { interviewId_panelMemberId: { interviewId: data.interviewId, panelMemberId: data.panelMemberId } },
        });
        if (existingFeedback) {
            throw new ValidationError({ feedback: ['Feedback has already been submitted for this interview'] });
        }
        const feedback = await prisma.interviewFeedback.create({
            data: {
                interviewId: data.interviewId,
                panelMemberId: data.panelMemberId,
                ratings: data.ratings,
                overallComments: data.overallComments,
                recommendation: data.recommendation,
            },
            include: { panelMember: true },
        });
        const mappedFeedback = this.mapToFeedback(feedback);
        try {
            const mappedInterview = this.mapToInterview(interview);
            await interviewActivityService.recordInterviewFeedback(mappedInterview, mappedFeedback);
        }
        catch (error) {
            console.error('Failed to record interview feedback activity:', error);
        }
        return mappedFeedback;
    },
    async getInterviewFeedback(interviewId) {
        const feedback = await prisma.interviewFeedback.findMany({
            where: { interviewId },
            include: { panelMember: true },
            orderBy: { submittedAt: 'asc' },
        });
        return feedback.map(f => this.mapToFeedback(f));
    },
    async isAllFeedbackComplete(interviewId) {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            include: { panelMembers: true, feedback: true },
        });
        if (!interview)
            return false;
        return interview.panelMembers.length === interview.feedback.length;
    },
    async getFeedbackCompletionStatus(interviewId) {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            include: { panelMembers: { include: { user: true } }, feedback: true },
        });
        if (!interview)
            throw new NotFoundError('Interview');
        const feedbackSubmittedBy = new Set(interview.feedback.map(f => f.panelMemberId));
        const pendingMembers = interview.panelMembers
            .filter(pm => !feedbackSubmittedBy.has(pm.userId))
            .map(pm => ({ userId: pm.userId, userName: pm.user.name }));
        return {
            total: interview.panelMembers.length,
            completed: interview.feedback.length,
            pending: pendingMembers.length,
            isComplete: pendingMembers.length === 0,
            pendingMembers,
        };
    },
    async getPendingFeedback(userId) {
        const interviews = await prisma.interview.findMany({
            where: {
                status: 'completed',
                panelMembers: { some: { userId } },
                feedback: { none: { panelMemberId: userId } },
            },
            include: {
                jobCandidate: { include: { candidate: true, job: true } },
                scheduler: true,
                panelMembers: { include: { user: true } },
                feedback: { include: { panelMember: true } },
            },
            orderBy: { scheduledAt: 'desc' },
        });
        return interviews.map(i => this.mapToInterview(i));
    },
    async getScorecardTemplates(companyId) {
        const templates = await prisma.scorecardTemplate.findMany({
            where: { companyId },
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        });
        return templates.map(t => ({
            id: t.id,
            companyId: t.companyId,
            name: t.name,
            criteria: t.criteria,
            isDefault: t.isDefault,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
        }));
    },
    getDefaultCriteria() {
        return DEFAULT_SCORECARD_CRITERIA;
    },
    async processAutoStageMovement(interviewId) {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                jobCandidate: {
                    include: {
                        candidate: true,
                        job: { include: { pipelineStages: { orderBy: { position: 'asc' } } } },
                        currentStage: true,
                    },
                },
                panelMembers: true,
                feedback: true,
            },
        });
        if (!interview || !interview.jobCandidate)
            return;
        if (interview.panelMembers.length !== interview.feedback.length)
            return;
        const companySettings = await prisma.companySettings.findUnique({
            where: { companyId: interview.jobCandidate.job.companyId },
        });
        if (companySettings && !companySettings.autoStageMovementEnabled)
            return;
        const recommendations = interview.feedback.map(f => f.recommendation);
        const hasStrongNoHire = recommendations.includes('strong_no_hire');
        const allPositive = recommendations.every(r => r === 'strong_hire' || r === 'hire');
        if (hasStrongNoHire) {
            await prisma.notification.create({
                data: {
                    userId: interview.scheduledBy,
                    type: 'feedback_pending',
                    title: 'Candidate Flagged for Review',
                    message: `Interview feedback for ${interview.jobCandidate.candidate?.name || 'candidate'} includes a "Strong No Hire" recommendation.`,
                    entityType: 'interview',
                    entityId: interviewId,
                },
            });
            return;
        }
        if (allPositive) {
            const stages = interview.jobCandidate.job.pipelineStages;
            const currentStageIndex = stages.findIndex(s => s.id === interview.jobCandidate.currentStageId);
            if (currentStageIndex >= 0 && currentStageIndex < stages.length - 1) {
                const nextStage = stages[currentStageIndex + 1];
                await prisma.$transaction(async (tx) => {
                    await tx.stageHistory.updateMany({
                        where: { jobCandidateId: interview.jobCandidateId, exitedAt: null },
                        data: { exitedAt: new Date() },
                    });
                    await tx.jobCandidate.update({
                        where: { id: interview.jobCandidateId },
                        data: { currentStageId: nextStage.id },
                    });
                    await tx.stageHistory.create({
                        data: {
                            jobCandidateId: interview.jobCandidateId,
                            stageId: nextStage.id,
                            stageName: nextStage.name,
                            comment: 'Auto-moved based on interview feedback',
                        },
                    });
                    await tx.candidateActivity.create({
                        data: {
                            candidateId: interview.jobCandidate.candidateId,
                            jobCandidateId: interview.jobCandidateId,
                            activityType: 'stage_change',
                            description: `Candidate auto-moved to ${nextStage.name} based on positive interview feedback`,
                            metadata: {
                                fromStageId: interview.jobCandidate.currentStageId,
                                fromStageName: interview.jobCandidate.currentStage.name,
                                toStageId: nextStage.id,
                                toStageName: nextStage.name,
                                reason: 'auto_stage_movement',
                                interviewId,
                            },
                        },
                    });
                });
            }
        }
        await prisma.interview.update({
            where: { id: interviewId },
            data: { status: 'completed' },
        });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapToFeedback(feedback) {
        return {
            id: feedback.id,
            interviewId: feedback.interviewId,
            panelMemberId: feedback.panelMemberId,
            ratings: feedback.ratings,
            overallComments: feedback.overallComments,
            recommendation: feedback.recommendation,
            submittedAt: feedback.submittedAt,
            panelMember: feedback.panelMember ? {
                id: feedback.panelMember.id,
                companyId: feedback.panelMember.companyId,
                name: feedback.panelMember.name,
                email: feedback.panelMember.email,
                role: feedback.panelMember.role,
                isActive: feedback.panelMember.isActive,
                createdAt: feedback.panelMember.createdAt,
                updatedAt: feedback.panelMember.updatedAt,
            } : undefined,
        };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapToInterview(interview) {
        return {
            id: interview.id,
            jobCandidateId: interview.jobCandidateId,
            scheduledAt: interview.scheduledAt,
            duration: interview.duration,
            timezone: interview.timezone,
            mode: interview.mode,
            meetingLink: interview.meetingLink ?? undefined,
            location: interview.location ?? undefined,
            status: interview.status,
            notes: interview.notes ?? undefined,
            cancelReason: interview.cancelReason ?? undefined,
            scheduledBy: interview.scheduledBy,
            createdAt: interview.createdAt,
            updatedAt: interview.updatedAt,
            jobCandidate: interview.jobCandidate ? {
                id: interview.jobCandidate.id,
                jobId: interview.jobCandidate.jobId,
                candidateId: interview.jobCandidate.candidateId,
                currentStageId: interview.jobCandidate.currentStageId,
                appliedAt: interview.jobCandidate.appliedAt,
                updatedAt: interview.jobCandidate.updatedAt,
                candidate: interview.jobCandidate.candidate ? {
                    id: interview.jobCandidate.candidate.id,
                    companyId: interview.jobCandidate.candidate.companyId,
                    name: interview.jobCandidate.candidate.name,
                    email: interview.jobCandidate.candidate.email,
                    phone: interview.jobCandidate.candidate.phone ?? undefined,
                    experienceYears: interview.jobCandidate.candidate.experienceYears,
                    currentCompany: interview.jobCandidate.candidate.currentCompany ?? undefined,
                    location: interview.jobCandidate.candidate.location,
                    source: interview.jobCandidate.candidate.source,
                    skills: Array.isArray(interview.jobCandidate.candidate.skills) ? interview.jobCandidate.candidate.skills : [],
                    resumeUrl: interview.jobCandidate.candidate.resumeUrl ?? undefined,
                    createdAt: interview.jobCandidate.candidate.createdAt,
                    updatedAt: interview.jobCandidate.candidate.updatedAt,
                } : undefined,
                job: interview.jobCandidate.job ? {
                    id: interview.jobCandidate.job.id,
                    companyId: interview.jobCandidate.job.companyId,
                    title: interview.jobCandidate.job.title,
                    department: interview.jobCandidate.job.department,
                    description: interview.jobCandidate.job.description ?? '',
                    status: interview.jobCandidate.job.status,
                    openings: interview.jobCandidate.job.openings,
                    skills: Array.isArray(interview.jobCandidate.job.skills) ? interview.jobCandidate.job.skills : [],
                    locations: Array.isArray(interview.jobCandidate.job.locations) ? interview.jobCandidate.job.locations : [],
                    createdAt: interview.jobCandidate.job.createdAt,
                    updatedAt: interview.jobCandidate.job.updatedAt,
                } : undefined,
            } : undefined,
            scheduler: interview.scheduler ? {
                id: interview.scheduler.id,
                companyId: interview.scheduler.companyId,
                name: interview.scheduler.name,
                email: interview.scheduler.email,
                role: interview.scheduler.role,
                isActive: interview.scheduler.isActive,
                createdAt: interview.scheduler.createdAt,
                updatedAt: interview.scheduler.updatedAt,
            } : undefined,
            panelMembers: interview.panelMembers?.map((pm) => ({
                id: pm.id,
                interviewId: pm.interviewId,
                userId: pm.userId,
                createdAt: pm.createdAt,
                user: pm.user ? {
                    id: pm.user.id,
                    companyId: pm.user.companyId,
                    name: pm.user.name,
                    email: pm.user.email,
                    role: pm.user.role,
                    isActive: pm.user.isActive,
                    createdAt: pm.user.createdAt,
                    updatedAt: pm.user.updatedAt,
                } : undefined,
            })),
            feedback: interview.feedback?.map((fb) => ({
                id: fb.id,
                interviewId: fb.interviewId,
                panelMemberId: fb.panelMemberId,
                ratings: fb.ratings,
                overallComments: fb.overallComments,
                recommendation: fb.recommendation,
                submittedAt: fb.submittedAt,
                panelMember: fb.panelMember ? {
                    id: fb.panelMember.id,
                    companyId: fb.panelMember.companyId,
                    name: fb.panelMember.name,
                    email: fb.panelMember.email,
                    role: fb.panelMember.role,
                    isActive: fb.panelMember.isActive,
                    createdAt: fb.panelMember.createdAt,
                    updatedAt: fb.panelMember.updatedAt,
                } : undefined,
            })),
        };
    },
};
export default feedbackService;
//# sourceMappingURL=feedback.service.js.map