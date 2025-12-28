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
 */
export declare const feedbackService: {
    submitFeedback(data: SubmitFeedbackInput): Promise<InterviewFeedback>;
    getInterviewFeedback(interviewId: string): Promise<InterviewFeedback[]>;
    isAllFeedbackComplete(interviewId: string): Promise<boolean>;
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
    getPendingFeedback(userId: string): Promise<Interview[]>;
    getScorecardTemplates(companyId: string): Promise<ScorecardTemplate[]>;
    getDefaultCriteria(): ScorecardCriterion[];
    processAutoStageMovement(interviewId: string): Promise<void>;
    mapToFeedback(feedback: any): InterviewFeedback;
    mapToInterview(interview: any): Interview;
};
export default feedbackService;
//# sourceMappingURL=feedback.service.d.ts.map