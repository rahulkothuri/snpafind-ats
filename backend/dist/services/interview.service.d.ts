import type { Interview, CreateInterviewInput, UpdateInterviewInput, InterviewFilters, DashboardInterviews, PanelLoad, InterviewMode } from '../types/index.js';
/**
 * Interview Service
 * Handles CRUD operations for interview scheduling and management
 * Requirements: 1.3, 1.4, 8.3, 8.5, 17.1, 17.2
 */
export declare const interviewService: {
    /**
     * Create a new interview
     * Requirements: 1.3, 1.4, 17.1
     */
    createInterview(data: CreateInterviewInput): Promise<Interview>;
    /**
     * Build event description for calendar events
     */
    buildEventDescription(interview: Interview): string;
    /**
     * Format interview mode for display
     */
    formatInterviewMode(mode: InterviewMode): string;
    /**
     * Update/reschedule an interview
     * Requirements: 8.2, 8.3
     */
    updateInterview(id: string, data: UpdateInterviewInput): Promise<Interview>;
    /**
     * Cancel an interview
     * Requirements: 8.4, 8.5
     */
    cancelInterview(id: string, reason?: string): Promise<Interview>;
    /**
     * Get interview by ID
     * Requirements: 17.1
     */
    getInterview(id: string): Promise<Interview | null>;
    /**
     * List interviews with filters
     * Requirements: 17.2
     */
    listInterviews(filters: InterviewFilters): Promise<Interview[]>;
    /**
     * Get interviews for dashboard (today, tomorrow, this week)
     * Requirements: 11.1, 11.2, 12.1
     */
    getDashboardInterviews(userId: string, companyId: string): Promise<DashboardInterviews>;
    /**
     * Get panel load distribution
     * Requirements: 13.1, 13.2
     */
    getPanelLoadDistribution(companyId: string, period: "week" | "month"): Promise<PanelLoad[]>;
    /**
     * Map Prisma interview to Interview type
     */
    mapToInterview(interview: any): Interview;
};
export default interviewService;
//# sourceMappingURL=interview.service.d.ts.map