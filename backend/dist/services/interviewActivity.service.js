import prisma from '../lib/prisma.js';
import { ActivityType as PrismaActivityType } from '@prisma/client';
import { formatDateTimeWithZone } from './timezone.service.js';
/**
 * Format date/time for display in activity descriptions
 */
function formatForDisplay(date, timezone) {
    return {
        full: formatDateTimeWithZone(date, timezone),
    };
}
/**
 * Interview Activity Service
 * Records interview-related activities to the candidate's timeline
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */
export const interviewActivityService = {
    /**
     * Record interview_scheduled activity
     * Requirements: 15.1
     */
    async recordInterviewScheduled(interview) {
        if (!interview.jobCandidate) {
            throw new Error('Interview must include jobCandidate relation');
        }
        const candidateName = interview.jobCandidate.candidate?.name || 'Candidate';
        const jobTitle = interview.jobCandidate.job?.title || 'Position';
        const panelMemberNames = interview.panelMembers?.map(pm => pm.user?.name || 'Unknown').join(', ') || 'TBD';
        // Format the scheduled time in the interview's timezone
        const formattedDateTime = formatForDisplay(interview.scheduledAt, interview.timezone);
        const description = `Interview scheduled for ${candidateName} - ${jobTitle} on ${formattedDateTime.full} (${interview.duration} minutes, ${formatInterviewMode(interview.mode)})`;
        const activity = await prisma.candidateActivity.create({
            data: {
                candidateId: interview.jobCandidate.candidateId,
                jobCandidateId: interview.jobCandidateId,
                activityType: PrismaActivityType.interview_scheduled,
                description,
                metadata: {
                    interviewId: interview.id,
                    scheduledAt: interview.scheduledAt.toISOString(),
                    duration: interview.duration,
                    timezone: interview.timezone,
                    mode: interview.mode,
                    meetingLink: interview.meetingLink,
                    location: interview.location,
                    panelMemberIds: interview.panelMembers?.map(pm => pm.userId) || [],
                    panelMemberNames,
                    scheduledBy: interview.scheduledBy,
                    schedulerName: interview.scheduler?.name,
                    jobTitle,
                },
            },
        });
        return this.mapToActivity(activity);
    },
    /**
     * Record interview_rescheduled activity with old and new times
     * Requirements: 15.2
     */
    async recordInterviewRescheduled(interview, oldScheduledAt, oldTimezone, oldDuration, oldMode, oldLocation) {
        if (!interview.jobCandidate) {
            throw new Error('Interview must include jobCandidate relation');
        }
        const candidateName = interview.jobCandidate.candidate?.name || 'Candidate';
        const jobTitle = interview.jobCandidate.job?.title || 'Position';
        // Format old and new times
        const oldFormattedDateTime = formatForDisplay(oldScheduledAt, oldTimezone);
        const newFormattedDateTime = formatForDisplay(interview.scheduledAt, interview.timezone);
        const description = `Interview rescheduled for ${candidateName} - ${jobTitle} from ${oldFormattedDateTime.full} to ${newFormattedDateTime.full}`;
        const activity = await prisma.candidateActivity.create({
            data: {
                candidateId: interview.jobCandidate.candidateId,
                jobCandidateId: interview.jobCandidateId,
                activityType: PrismaActivityType.interview_rescheduled,
                description,
                metadata: {
                    interviewId: interview.id,
                    oldScheduledAt: oldScheduledAt.toISOString(),
                    oldTimezone,
                    oldDuration: oldDuration || interview.duration,
                    oldMode: oldMode || interview.mode,
                    oldLocation: oldLocation,
                    newScheduledAt: interview.scheduledAt.toISOString(),
                    newTimezone: interview.timezone,
                    newDuration: interview.duration,
                    newMode: interview.mode,
                    newLocation: interview.location,
                    meetingLink: interview.meetingLink,
                    panelMemberIds: interview.panelMembers?.map(pm => pm.userId) || [],
                    jobTitle,
                },
            },
        });
        return this.mapToActivity(activity);
    },
    /**
     * Record interview_cancelled activity with reason
     * Requirements: 15.3
     */
    async recordInterviewCancelled(interview, reason) {
        if (!interview.jobCandidate) {
            throw new Error('Interview must include jobCandidate relation');
        }
        const candidateName = interview.jobCandidate.candidate?.name || 'Candidate';
        const jobTitle = interview.jobCandidate.job?.title || 'Position';
        const formattedDateTime = formatForDisplay(interview.scheduledAt, interview.timezone);
        let description = `Interview cancelled for ${candidateName} - ${jobTitle} (was scheduled for ${formattedDateTime.full})`;
        if (reason) {
            description += `. Reason: ${reason}`;
        }
        const activity = await prisma.candidateActivity.create({
            data: {
                candidateId: interview.jobCandidate.candidateId,
                jobCandidateId: interview.jobCandidateId,
                activityType: PrismaActivityType.interview_cancelled,
                description,
                metadata: {
                    interviewId: interview.id,
                    scheduledAt: interview.scheduledAt.toISOString(),
                    timezone: interview.timezone,
                    duration: interview.duration,
                    mode: interview.mode,
                    cancelReason: reason,
                    panelMemberIds: interview.panelMembers?.map(pm => pm.userId) || [],
                    jobTitle,
                },
            },
        });
        return this.mapToActivity(activity);
    },
    /**
     * Record interview_feedback activity with recommendation
     * Requirements: 15.4
     */
    async recordInterviewFeedback(interview, feedback) {
        if (!interview.jobCandidate) {
            throw new Error('Interview must include jobCandidate relation');
        }
        const candidateName = interview.jobCandidate.candidate?.name || 'Candidate';
        const jobTitle = interview.jobCandidate.job?.title || 'Position';
        const reviewerName = feedback.panelMember?.name || 'Interviewer';
        const recommendationLabel = formatRecommendation(feedback.recommendation);
        const description = `Interview feedback submitted by ${reviewerName} for ${candidateName} - ${jobTitle}: ${recommendationLabel}`;
        const activity = await prisma.candidateActivity.create({
            data: {
                candidateId: interview.jobCandidate.candidateId,
                jobCandidateId: interview.jobCandidateId,
                activityType: PrismaActivityType.interview_feedback,
                description,
                metadata: {
                    interviewId: interview.id,
                    feedbackId: feedback.id,
                    panelMemberId: feedback.panelMemberId,
                    panelMemberName: reviewerName,
                    recommendation: feedback.recommendation,
                    recommendationLabel,
                    ratingsCount: feedback.ratings?.length || 0,
                    submittedAt: feedback.submittedAt.toISOString(),
                    jobTitle,
                },
            },
        });
        return this.mapToActivity(activity);
    },
    /**
     * Map Prisma activity to CandidateActivity type
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapToActivity(activity) {
        return {
            id: activity.id,
            candidateId: activity.candidateId,
            jobCandidateId: activity.jobCandidateId ?? undefined,
            activityType: activity.activityType,
            description: activity.description,
            metadata: activity.metadata,
            createdAt: activity.createdAt,
        };
    },
};
/**
 * Format interview mode for display
 */
function formatInterviewMode(mode) {
    switch (mode) {
        case 'google_meet':
            return 'Google Meet';
        case 'microsoft_teams':
            return 'Microsoft Teams';
        case 'in_person':
            return 'In-Person';
        default:
            return mode;
    }
}
/**
 * Format recommendation for display
 */
function formatRecommendation(recommendation) {
    switch (recommendation) {
        case 'strong_hire':
            return 'Strong Hire';
        case 'hire':
            return 'Hire';
        case 'no_hire':
            return 'No Hire';
        case 'strong_no_hire':
            return 'Strong No Hire';
        default:
            return recommendation;
    }
}
export default interviewActivityService;
//# sourceMappingURL=interviewActivity.service.js.map