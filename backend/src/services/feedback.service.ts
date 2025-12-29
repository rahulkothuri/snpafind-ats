import prisma from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import type { InterviewFeedback, FeedbackRating, InterviewRecommendation, Interview } from '../types/index.js';
import { interviewActivityService } from './interviewActivity.service.js';

export interface SubmitFeedbackInput {
  interviewId: string;
  panelMemberId: string;
  ratings: FeedbackRating[];
  overallComments: string;
  recommendation: InterviewRecommendation;
}

export interface ScorecardCriterion {
  name: string;
  label: string;
  description: string;
  weight?: number;
}

export interface ScorecardTemplate {
  id: string;
  companyId: string;
  name: string;
  criteria: ScorecardCriterion[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SCORECARD_CRITERIA: ScorecardCriterion[] = [
  { name: 'technical_skills', label: 'Technical Skills', description: 'Relevant technical knowledge and problem-solving', weight: 1 },
  { name: 'communication', label: 'Communication', description: 'Clarity, articulation, and listening skills', weight: 1 },
  { name: 'culture_fit', label: 'Culture Fit', description: 'Alignment with company values and team dynamics', weight: 1 },
  { name: 'experience', label: 'Relevant Experience', description: 'Past experience applicable to the role', weight: 1 },
  { name: 'motivation', label: 'Motivation & Interest', description: 'Enthusiasm for the role and company', weight: 1 },
];

/**
 * Feedback Service
 * Manages interview feedback and scorecards
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5
 */
export const feedbackService = {
  /**
   * Submit feedback for an interview
   * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
   */
  async submitFeedback(data: SubmitFeedbackInput): Promise<InterviewFeedback> {
    // Validate required fields
    const errors: Record<string, string[]> = {};
    if (!data.interviewId) errors.interviewId = ['Interview ID is required'];
    if (!data.panelMemberId) errors.panelMemberId = ['Panel member ID is required'];
    if (!data.ratings || data.ratings.length === 0) errors.ratings = ['At least one rating is required'];
    if (!data.overallComments || data.overallComments.trim() === '') errors.overallComments = ['Overall comments are required'];
    if (!data.recommendation) errors.recommendation = ['Recommendation is required'];

    // Validate rating scores (1-5)
    if (data.ratings) {
      for (const rating of data.ratings) {
        if (rating.score < 1 || rating.score > 5) {
          errors.ratings = ['Rating scores must be between 1 and 5'];
          break;
        }
      }
    }

    // Validate recommendation value
    const validRecommendations: InterviewRecommendation[] = ['strong_hire', 'hire', 'no_hire', 'strong_no_hire'];
    if (data.recommendation && !validRecommendations.includes(data.recommendation)) {
      errors.recommendation = ['Invalid recommendation value'];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    // Verify interview exists
    const interview = await prisma.interview.findUnique({
      where: { id: data.interviewId },
      include: {
        jobCandidate: {
          include: {
            candidate: true,
            job: true,
          },
        },
        panelMembers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundError('Interview');
    }

    // Verify panel member is part of the interview
    const isPanelMember = interview.panelMembers.some(pm => pm.userId === data.panelMemberId);
    if (!isPanelMember) {
      throw new ValidationError({
        panelMemberId: ['User is not a panel member for this interview'],
      });
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.interviewFeedback.findUnique({
      where: {
        interviewId_panelMemberId: {
          interviewId: data.interviewId,
          panelMemberId: data.panelMemberId,
        },
      },
    });

    if (existingFeedback) {
      throw new ValidationError({
        feedback: ['Feedback has already been submitted for this interview'],
      });
    }

    // Create feedback
    const feedback = await prisma.interviewFeedback.create({
      data: {
        interviewId: data.interviewId,
        panelMemberId: data.panelMemberId,
        ratings: data.ratings as unknown as Prisma.InputJsonValue,
        overallComments: data.overallComments,
        recommendation: data.recommendation,
      },
      include: {
        panelMember: true,
      },
    });

    const mappedFeedback = this.mapToFeedback(feedback);

    // Record interview_feedback activity (Requirements 15.4)
    try {
      const mappedInterview = this.mapToInterview(interview);
      await interviewActivityService.recordInterviewFeedback(mappedInterview, mappedFeedback);
    } catch (error) {
      console.error('Failed to record interview feedback activity:', error);
    }

    return mappedFeedback;
  },

  /**
   * Get all feedback for an interview
   * Requirements: 14.5
   */
  async getInterviewFeedback(interviewId: string): Promise<InterviewFeedback[]> {
    const feedback = await prisma.interviewFeedback.findMany({
      where: { interviewId },
      include: {
        panelMember: true,
      },
      orderBy: { submittedAt: 'asc' },
    });

    return feedback.map(f => this.mapToFeedback(f));
  },

  /**
   * Check if all feedback is complete for an interview
   * Requirements: 10.1
   */
  async isAllFeedbackComplete(interviewId: string): Promise<boolean> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        panelMembers: true,
        feedback: true,
      },
    });

    if (!interview) {
      return false;
    }

    // All panel members must have submitted feedback
    return interview.panelMembers.length === interview.feedback.length;
  },

  /**
   * Get feedback completion status for an interview
   * Requirements: 14.5
   */
  async getFeedbackCompletionStatus(interviewId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    isComplete: boolean;
    pendingMembers: Array<{ userId: string; userName: string }>;
  }> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        panelMembers: {
          include: {
            user: true,
          },
        },
        feedback: true,
      },
    });

    if (!interview) {
      throw new NotFoundError('Interview');
    }

    const feedbackSubmittedBy = new Set(interview.feedback.map(f => f.panelMemberId));
    const pendingMembers = interview.panelMembers
      .filter(pm => !feedbackSubmittedBy.has(pm.userId))
      .map(pm => ({
        userId: pm.userId,
        userName: pm.user.name,
      }));

    return {
      total: interview.panelMembers.length,
      completed: interview.feedback.length,
      pending: pendingMembers.length,
      isComplete: pendingMembers.length === 0,
      pendingMembers,
    };
  },

  /**
   * Get interviews pending feedback for a user
   * Requirements: 14.2
   */
  async getPendingFeedback(userId: string): Promise<Interview[]> {
    const interviews = await prisma.interview.findMany({
      where: {
        status: 'completed',
        panelMembers: {
          some: {
            userId,
          },
        },
        feedback: {
          none: {
            panelMemberId: userId,
          },
        },
      },
      include: {
        jobCandidate: {
          include: {
            candidate: true,
            job: true,
          },
        },
        scheduler: true,
        panelMembers: {
          include: {
            user: true,
          },
        },
        feedback: {
          include: {
            panelMember: true,
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return interviews.map(i => this.mapToInterview(i));
  },

  /**
   * Process auto-stage movement based on feedback
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
   */
  async processAutoStageMovement(interviewId: string): Promise<void> {
    // Get interview with all feedback
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        jobCandidate: {
          include: {
            candidate: true,
            job: {
              include: {
                pipelineStages: {
                  orderBy: { position: 'asc' },
                },
              },
            },
            currentStage: true,
          },
        },
        panelMembers: true,
        feedback: true,
      },
    });

    if (!interview || !interview.jobCandidate) {
      return;
    }

    // Check if all feedback is complete
    if (interview.panelMembers.length !== interview.feedback.length) {
      return; // Not all feedback submitted yet
    }

    // Check company settings for auto-stage movement
    const companySettings = await prisma.companySettings.findUnique({
      where: { companyId: interview.jobCandidate.job.companyId },
    });

    if (companySettings && !companySettings.autoStageMovementEnabled) {
      return; // Auto-stage movement is disabled
    }

    // Evaluate recommendations
    const recommendations = interview.feedback.map(f => f.recommendation);
    const hasStrongNoHire = recommendations.includes('strong_no_hire');
    const allPositive = recommendations.every(r => r === 'strong_hire' || r === 'hire');

    // If any strong_no_hire, flag for review (don't auto-move)
    if (hasStrongNoHire) {
      // Create notification for review
      await prisma.notification.create({
        data: {
          userId: interview.scheduledBy,
          type: 'feedback_pending',
          title: 'Candidate Flagged for Review',
          message: `Interview feedback for ${interview.jobCandidate.candidate?.name || 'candidate'} includes a "Strong No Hire" recommendation. Please review.`,
          entityType: 'interview',
          entityId: interviewId,
        },
      });
      return;
    }

    // If all positive, move to next stage
    if (allPositive) {
      const stages = interview.jobCandidate.job.pipelineStages;
      const currentStageIndex = stages.findIndex(s => s.id === interview.jobCandidate!.currentStageId);
      
      if (currentStageIndex >= 0 && currentStageIndex < stages.length - 1) {
        const nextStage = stages[currentStageIndex + 1];
        
        // Update candidate's current stage
        await prisma.$transaction(async (tx) => {
          // Close current stage history
          await tx.stageHistory.updateMany({
            where: {
              jobCandidateId: interview.jobCandidateId,
              exitedAt: null,
            },
            data: {
              exitedAt: new Date(),
            },
          });

          // Update job candidate's current stage
          await tx.jobCandidate.update({
            where: { id: interview.jobCandidateId },
            data: { currentStageId: nextStage.id },
          });

          // Create new stage history record
          await tx.stageHistory.create({
            data: {
              jobCandidateId: interview.jobCandidateId,
              stageId: nextStage.id,
              stageName: nextStage.name,
              comment: 'Auto-moved based on interview feedback',
            },
          });

          // Create activity record
          await tx.candidateActivity.create({
            data: {
              candidateId: interview.jobCandidate!.candidateId,
              jobCandidateId: interview.jobCandidateId,
              activityType: 'stage_change',
              description: `Candidate auto-moved to ${nextStage.name} based on positive interview feedback`,
              metadata: {
                fromStageId: interview.jobCandidate!.currentStageId,
                fromStageName: interview.jobCandidate!.currentStage.name,
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

    // Mark interview as completed
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: 'completed' },
    });
  },

  /**
   * Get scorecard templates for a company
   * Requirements: 9.1
   */
  async getScorecardTemplates(companyId: string): Promise<ScorecardTemplate[]> {
    const templates = await prisma.scorecardTemplate.findMany({
      where: { companyId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return templates.map(t => ({
      id: t.id,
      companyId: t.companyId,
      name: t.name,
      criteria: t.criteria as unknown as ScorecardCriterion[],
      isDefault: t.isDefault,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  },

  /**
   * Get default scorecard criteria
   * Requirements: 9.1
   */
  getDefaultCriteria(): ScorecardCriterion[] {
    return DEFAULT_SCORECARD_CRITERIA;
  },

  /**
   * Map Prisma feedback to InterviewFeedback type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapToFeedback(feedback: any): InterviewFeedback {
    return {
      id: feedback.id,
      interviewId: feedback.interviewId,
      panelMemberId: feedback.panelMemberId,
      ratings: feedback.ratings as FeedbackRating[],
      overallComments: feedback.overallComments,
      recommendation: feedback.recommendation as InterviewRecommendation,
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

  /**
   * Map Prisma interview to Interview type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapToInterview(interview: any): Interview {
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
      panelMembers: interview.panelMembers?.map((pm: { id: string; interviewId: string; userId: string; createdAt: Date; user?: { id: string; companyId: string; name: string; email: string; role: string; isActive: boolean; createdAt: Date; updatedAt: Date } }) => ({
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
      feedback: interview.feedback?.map((fb: { id: string; interviewId: string; panelMemberId: string; ratings: unknown; overallComments: string; recommendation: string; submittedAt: Date; panelMember?: { id: string; companyId: string; name: string; email: string; role: string; isActive: boolean; createdAt: Date; updatedAt: Date } }) => ({
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
