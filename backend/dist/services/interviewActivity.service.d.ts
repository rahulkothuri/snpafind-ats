import type { Interview, InterviewFeedback, CandidateActivity } from '../types/index.js';
/**
 * Interview Activity Service
 * Records interview-related activities to the candidate's timeline
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */
export declare const interviewActivityService: {
    /**
     * Record interview_scheduled activity
     * Requirements: 15.1
     */
    recordInterviewScheduled(interview: Interview): Promise<CandidateActivity>;
    /**
     * Record interview_rescheduled activity with old and new times
     * Requirements: 15.2
     */
    recordInterviewRescheduled(interview: Interview, oldScheduledAt: Date, oldTimezone: string, oldDuration?: number, oldMode?: string, oldLocation?: string): Promise<CandidateActivity>;
    /**
     * Record interview_cancelled activity with reason
     * Requirements: 15.3
     */
    recordInterviewCancelled(interview: Interview, reason?: string): Promise<CandidateActivity>;
    /**
     * Record interview_feedback activity with recommendation
     * Requirements: 15.4
     */
    recordInterviewFeedback(interview: Interview, feedback: InterviewFeedback): Promise<CandidateActivity>;
    /**
     * Map Prisma activity to CandidateActivity type
     */
    mapToActivity(activity: any): CandidateActivity;
};
export default interviewActivityService;
//# sourceMappingURL=interviewActivity.service.d.ts.map