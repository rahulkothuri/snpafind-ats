import type { UserRole } from '../types/index.js';
export interface AnalyticsFilters {
    startDate?: Date;
    endDate?: Date;
    departmentId?: string;
    locationId?: string;
    jobId?: string;
    recruiterId?: string;
}
export interface KPIMetrics {
    activeRoles: number;
    activeCandidates: number;
    interviewsToday: number;
    interviewsThisWeek: number;
    offersPending: number;
    totalHires: number;
    avgTimeToFill: number;
    offerAcceptanceRate: number;
    rolesOnTrack: number;
    rolesAtRisk: number;
    rolesBreached: number;
}
export interface FunnelStage {
    id: string;
    name: string;
    count: number;
    percentage: number;
    conversionToNext: number;
    avgDaysInStage: number;
}
export interface FunnelData {
    stages: FunnelStage[];
    totalApplicants: number;
    totalHired: number;
    overallConversionRate: number;
}
export interface ConversionData {
    stages: {
        fromStage: string;
        toStage: string;
        conversionRate: number;
        dropOffCount: number;
    }[];
}
export interface TimeToFillData {
    overall: {
        average: number;
        median: number;
        target: number;
    };
    byDepartment: {
        department: string;
        average: number;
        count: number;
    }[];
    byRole: {
        roleId: string;
        roleName: string;
        average: number;
        isOverTarget: boolean;
    }[];
}
export interface TimeInStageData {
    stages: {
        stageName: string;
        avgDays: number;
        isBottleneck: boolean;
    }[];
    bottleneckStage: string;
    suggestion: string;
}
export interface SourceData {
    source: string;
    candidateCount: number;
    percentage: number;
    hireCount: number;
    hireRate: number;
    avgTimeToHire: number;
}
export interface RecruiterData {
    id: string;
    name: string;
    specialty: string;
    activeRoles: number;
    cvsAdded: number;
    interviewsScheduled: number;
    offersMade: number;
    hires: number;
    avgTimeToFill: number;
    productivityScore: number;
}
export interface PanelData {
    panelName: string;
    interviewRounds: number;
    offerPercentage: number;
    topRejectionReason: string;
    avgFeedbackTime: number;
}
export interface DropOffData {
    byStage: {
        stageName: string;
        dropOffCount: number;
        dropOffPercentage: number;
    }[];
    highestDropOffStage: string;
}
export interface RejectionData {
    reasons: {
        reason: string;
        count: number;
        percentage: number;
        color: string;
    }[];
    topStageForRejection: string;
}
export interface OfferData {
    overall: {
        acceptanceRate: number;
        totalOffers: number;
        acceptedOffers: number;
    };
    byDepartment: {
        department: string;
        acceptanceRate: number;
        totalOffers: number;
        acceptedOffers: number;
    }[];
    byRole: {
        roleId: string;
        roleName: string;
        acceptanceRate: number;
        totalOffers: number;
        acceptedOffers: number;
        isUnderThreshold: boolean;
    }[];
}
export interface SLAStatusData {
    summary: {
        onTrack: number;
        atRisk: number;
        breached: number;
    };
    roles: {
        roleId: string;
        roleName: string;
        status: 'on_track' | 'at_risk' | 'breached';
        daysOpen: number;
        threshold: number;
        candidatesBreaching: number;
    }[];
}
export declare class AnalyticsService {
    /**
     * Get KPI metrics for dashboard (Requirements 1.1, 1.2, 1.3)
     */
    getKPIMetrics(companyId: string, userId: string, userRole: UserRole, filters?: AnalyticsFilters): Promise<KPIMetrics>;
    /**
     * Get funnel analytics (Requirements 2.1, 2.2, 2.3)
     */
    getFunnelAnalytics(companyId: string, userId: string, userRole: UserRole, filters?: AnalyticsFilters): Promise<FunnelData>;
    /**
     * Get conversion rates between stages (Requirements 9.1, 9.2)
     */
    getConversionRates(companyId: string, userId: string, userRole: UserRole, filters?: AnalyticsFilters): Promise<ConversionData>;
    /**
     * Get time-to-fill analytics (Requirements 6.1, 6.2, 6.3, 6.4, 6.6)
     */
    getTimeToFill(companyId: string, userId: string, userRole: UserRole, filters?: AnalyticsFilters): Promise<TimeToFillData>;
    /**
     * Get time-in-stage analytics (Requirements 7.1, 7.2, 7.3, 7.4, 7.6)
     */
    getTimeInStage(companyId: string, userId: string, userRole: UserRole, filters?: AnalyticsFilters): Promise<TimeInStageData>;
    /**
     * Get source performance analytics (Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6)
     */
    getSourcePerformance(companyId: string, userId: string, userRole: UserRole, filters?: AnalyticsFilters): Promise<SourceData[]>;
    /**
     * Get recruiter productivity analytics (Requirements 11.1, 11.2, 11.3)
     */
    getRecruiterProductivity(companyId: string, userId: string, userRole: UserRole, filters?: AnalyticsFilters): Promise<RecruiterData[]>;
    /**
     * Get panel performance analytics (Requirements 12.1, 12.2, 12.3)
     */
    getPanelPerformance(companyId: string, userId: string, userRole: UserRole, filters?: AnalyticsFilters): Promise<PanelData[]>;
    /**
     * Get drop-off analysis (Requirements 10.1, 10.2, 10.3)
     */
    getDropOffAnalysis(companyId: string, userId: string, userRole: UserRole, filters?: AnalyticsFilters): Promise<DropOffData>;
    /**
     * Get rejection reasons analysis (Requirements 10.2, 10.5)
     */
    getRejectionReasons(companyId: string, userId: string, userRole: UserRole, filters?: AnalyticsFilters): Promise<RejectionData>;
    /**
     * Get offer acceptance rate analytics (Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6)
     */
    getOfferAcceptanceRate(companyId: string, userId: string, userRole: UserRole, filters?: AnalyticsFilters): Promise<OfferData>;
    /**
     * Get SLA status analytics (Requirements 19.1, 19.2)
     */
    getSLAStatus(companyId: string, userId: string, userRole: UserRole, filters?: AnalyticsFilters): Promise<SLAStatusData>;
    /**
     * Build job where clause for role-based filtering (Requirements 1.2, 1.3)
     */
    private buildJobWhereClause;
    /**
     * Build date filter for queries
     */
    private buildDateFilter;
    /**
     * Calculate average time-to-fill
     */
    private calculateAverageTimeToFill;
    /**
     * Calculate offer acceptance rate
     */
    private calculateOfferAcceptanceRate;
    /**
     * Get SLA status summary
     */
    private getSLAStatusSummary;
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=analytics.service.d.ts.map