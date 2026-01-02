import type { InterviewFeedback, FeedbackRating, InterviewRecommendation, Interview } from '../types/index.js';
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
export declare const DEFAULT_SCORECARD_CRITERIA: ScorecardCriterion[];
/**
 * Feedback Service
 * Manages interview feedback and scorecards
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5
 */
export declare const feedbackService: {
    /**
     * Submit feedback for an interview
     * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
     */
    submitFeedback(data: SubmitFeedbackInput): Promise<InterviewFeedback>;
    /**
     * Get all feedback for an interview
     * Requirements: 14.5
     */
    getInterviewFeedback(interviewId: string): Promise<InterviewFeedback[]>;
    /**
     * Check if all feedback is complete for an interview
     * Requirements: 10.1
     */
    isAllFeedbackComplete(interviewId: string): Promise<boolean>;
    /**
     * Get feedback completion status for an interview
     * Requirements: 14.5
     */
    getFeedbackCompletionStatus(interviewId: string): Promise<{
        total: number;
        completed: number;
        pending: number;
        isComplete: boolean;
        pendingMembers: Array<{
            userId: string;
            userName: string;
        }>;
    }>;
    /**
     * Get interviews pending feedback for a user
     * Requirements: 14.2
     */
    getPendingFeedback(userId: string): Promise<Interview[]>;
    /**
     * Process auto-stage movement based on feedback
     * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
     */
    processAutoStageMovement(interviewId: string): Promise<void>;
    /**
     * Get scorecard templates for a company
     * Requirements: 9.1
     */
    getScorecardTemplates(companyId: string): Promise<ScorecardTemplate[]>;
    /**
     * Get default scorecard criteria
     * Requirements: 9.1
     */
    getDefaultCriteria(): ScorecardCriterion[];
    /**
     * Map Prisma feedback to InterviewFeedback type
     */
    mapToFeedback(feedback: any): InterviewFeedback;
    /**
     * Map Prisma interview to Interview type
     */
    mapToInterview(interview: any): Interview;
};
export default feedbackService;
//# sourceMappingURL=feedback.service.d.ts.map