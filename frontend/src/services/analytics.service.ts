import api from './api';

// Analytics Filter Interface
export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  departmentId?: string;
  locationId?: string;
  jobId?: string;
  recruiterId?: string;
}

// KPI Metrics Interface (Requirements 1.1, 1.4)
export interface KPIMetrics {
  activeRoles: number;
  activeCandidates: number;
  newCandidatesThisMonth: number;
  interviewsToday: number;
  interviewsThisWeek: number;
  offersPending: number;
  totalHires: number;
  totalOffers: number;
  avgTimeToFill: number;
  offerAcceptanceRate: number;
  rolesOnTrack: number;
  rolesAtRisk: number;
  rolesBreached: number;
}

// Funnel Data Interface (Requirements 2.1, 2.2, 2.5)
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

// Time Analytics Interfaces (Requirements 6.1, 6.2, 6.3, 7.1, 7.2)
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

// Source Analytics Interface (Requirements 5.1, 5.2, 5.4)
export interface SourceData {
  source: string;
  candidateCount: number;
  percentage: number;
  hireCount: number;
  hireRate: number;
  avgTimeToHire: number;
}

// Team Performance Interfaces (Requirements 11.1, 11.2, 12.1, 12.2)
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

// Drop-off Analysis Interfaces (Requirements 10.1, 10.2, 10.3)
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

// Offer Analytics Interface (Requirements 8.1, 8.2, 8.3)
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

// SLA Analytics Interface (Requirements 19.1, 19.2)
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

// Export Data Interface (Requirements 16.1, 16.2, 16.3, 16.4)
export interface ExportRequest {
  format: 'pdf' | 'excel' | 'csv';
  sections: string[];
  filters: AnalyticsFilters;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

// Analytics Filter Options Interface (Requirements 9.1)
export interface AnalyticsFilterOptions {
  departments: { value: string; label: string }[];
  locations: { value: string; label: string }[];
  jobs: { value: string; label: string }[];
  recruiters: { value: string; label: string }[];
}

// Analytics Service Class
export class AnalyticsService {
  
  /**
   * Get filter options for analytics dashboard (Requirements 9.1)
   * Fetches departments, locations, jobs, and recruiters from the database
   */
  async getFilterOptions(): Promise<AnalyticsFilterOptions> {
    try {
      const response = await api.get('/analytics/filter-options');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
      // Return empty arrays on error to allow the page to still render
      return {
        departments: [],
        locations: [],
        jobs: [],
        recruiters: []
      };
    }
  }

  /**
   * Get KPI metrics for dashboard (Requirements 1.1, 5.1, 6.1, 7.1, 8.1)
   */
  async getKPIMetrics(filters: AnalyticsFilters = {}): Promise<KPIMetrics> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`/analytics/kpis${params}`);
    return response.data;
  }

  /**
   * Get funnel analytics (Requirements 2.1, 2.2, 2.3)
   */
  async getFunnelAnalytics(filters: AnalyticsFilters = {}): Promise<FunnelData> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`/analytics/funnel${params}`);
    return response.data;
  }

  /**
   * Get conversion rates between stages (Requirements 9.1, 9.2)
   */
  async getConversionRates(filters: AnalyticsFilters = {}): Promise<ConversionData> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`/analytics/conversion-rates${params}`);
    return response.data;
  }

  /**
   * Get time-to-fill analytics (Requirements 6.1, 6.2, 6.3, 6.4, 6.6)
   */
  async getTimeToFill(filters: AnalyticsFilters = {}): Promise<TimeToFillData> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`/analytics/time-to-fill${params}`);
    return response.data;
  }

  /**
   * Get time-in-stage analytics (Requirements 7.1, 7.2, 7.3, 7.4, 7.6)
   */
  async getTimeInStage(filters: AnalyticsFilters = {}): Promise<TimeInStageData> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`/analytics/time-in-stage${params}`);
    return response.data;
  }

  /**
   * Get source performance analytics (Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6)
   */
  async getSourcePerformance(filters: AnalyticsFilters = {}): Promise<SourceData[]> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`/analytics/sources${params}`);
    return response.data;
  }

  /**
   * Get recruiter productivity analytics (Requirements 11.1, 11.2, 11.3, 11.4, 11.5)
   */
  async getRecruiterProductivity(filters: AnalyticsFilters = {}): Promise<RecruiterData[]> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`/analytics/recruiters${params}`);
    return response.data;
  }

  /**
   * Get panel performance analytics (Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6)
   */
  async getPanelPerformance(filters: AnalyticsFilters = {}): Promise<PanelData[]> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`/analytics/panels${params}`);
    return response.data;
  }

  /**
   * Get drop-off analysis (Requirements 10.1, 10.2, 10.3)
   */
  async getDropOffAnalysis(filters: AnalyticsFilters = {}): Promise<DropOffData> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`/analytics/drop-off${params}`);
    return response.data;
  }

  /**
   * Get rejection reasons analysis (Requirements 10.2, 10.5)
   */
  async getRejectionReasons(filters: AnalyticsFilters = {}): Promise<RejectionData> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`/analytics/rejection-reasons${params}`);
    return response.data;
  }

  /**
   * Get offer acceptance rate analytics (Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6)
   */
  async getOfferAcceptanceRate(filters: AnalyticsFilters = {}): Promise<OfferData> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`/analytics/offer-rate${params}`);
    return response.data;
  }

  /**
   * Get SLA status analytics (Requirements 19.1, 19.2, 19.3, 19.4, 19.5, 19.6)
   */
  async getSLAStatus(filters: AnalyticsFilters = {}): Promise<SLAStatusData> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`/analytics/sla${params}`);
    return response.data;
  }

  /**
   * Export analytics report (Requirements 11.1, 11.2, 11.3)
   * PDF export includes all visible data
   * Excel export includes all visible data
   * Exports respect current filters
   */
  async exportAnalytics(exportRequest: ExportRequest): Promise<Blob> {
    // Build query params from filters and export options
    const params = new URLSearchParams();
    
    // Add format
    params.append('format', exportRequest.format);
    
    // Add date range filters
    if (exportRequest.dateRange.startDate) {
      params.append('startDate', exportRequest.dateRange.startDate.toISOString());
    }
    if (exportRequest.dateRange.endDate) {
      params.append('endDate', exportRequest.dateRange.endDate.toISOString());
    }
    
    // Add other filters from the request
    if (exportRequest.filters.departmentId) {
      params.append('departmentId', exportRequest.filters.departmentId);
    }
    if (exportRequest.filters.locationId) {
      params.append('locationId', exportRequest.filters.locationId);
    }
    if (exportRequest.filters.jobId) {
      params.append('jobId', exportRequest.filters.jobId);
    }
    if (exportRequest.filters.recruiterId) {
      params.append('recruiterId', exportRequest.filters.recruiterId);
    }
    
    const queryString = params.toString();
    const response = await api.get(`/analytics/export?${queryString}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Get aggregated analytics data for overview
   */
  async getAnalyticsOverview(filters: AnalyticsFilters = {}): Promise<{
    kpis: KPIMetrics;
    funnel: FunnelData;
    sources: SourceData[];
    slaStatus: SLAStatusData;
  }> {
    const params = this.buildQueryParams(filters);
    const response = await api.get(`/analytics/overview${params}`);
    return response.data;
  }

  // Private helper methods

  /**
   * Build query parameters from filters
   */
  private buildQueryParams(filters: AnalyticsFilters): string {
    const params = new URLSearchParams();

    if (filters.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }

    if (filters.departmentId) {
      params.append('departmentId', filters.departmentId);
    }

    if (filters.locationId) {
      params.append('locationId', filters.locationId);
    }

    if (filters.jobId) {
      params.append('jobId', filters.jobId);
    }

    if (filters.recruiterId) {
      params.append('recruiterId', filters.recruiterId);
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Get predefined date range filters
   */
  static getDateRangePresets(): { label: string; value: string; startDate: Date; endDate: Date }[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return [
      {
        label: 'Last 7 days',
        value: 'last_7_days',
        startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: now
      },
      {
        label: 'Last 30 days',
        value: 'last_30_days',
        startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now
      },
      {
        label: 'Last 90 days',
        value: 'last_90_days',
        startDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
        endDate: now
      },
      {
        label: 'Last 6 months',
        value: 'last_6_months',
        startDate: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000),
        endDate: now
      },
      {
        label: 'This year',
        value: 'this_year',
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: now
      }
    ];
  }

  /**
   * Validate date range
   */
  static validateDateRange(startDate: Date, endDate: Date): { isValid: boolean; error?: string } {
    if (startDate > endDate) {
      return {
        isValid: false,
        error: 'Start date must be before end date'
      };
    }

    const maxRangeMs = 365 * 24 * 60 * 60 * 1000; // 1 year
    if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
      return {
        isValid: false,
        error: 'Date range cannot exceed 1 year'
      };
    }

    const now = new Date();
    if (startDate > now) {
      return {
        isValid: false,
        error: 'Start date cannot be in the future'
      };
    }

    return { isValid: true };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;