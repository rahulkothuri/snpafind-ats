/**
 * Alerts Service - Requirements 9.2, 9.5, 10.1, 10.2, 10.3
 * 
 * Handles alert-related API calls for SLA breaches and pending feedback
 */

import api from './api';

/**
 * SLA Breach Alert interface
 * Requirements: 10.1, 10.2, 10.3
 */
export interface SLABreachAlert {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  stageName: string;
  daysInStage: number;
  thresholdDays: number;
  daysOverdue: number;
  enteredAt: string;
}

/**
 * Pending Feedback Alert interface
 * Requirements: 9.1, 9.2, 9.5
 */
export interface PendingFeedbackAlert {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  interviewType: string;
  interviewDate: string;
  interviewerId: string;
  interviewerName: string;
  hoursOverdue: number;
}

/**
 * Alerts response from API
 */
export interface AlertsResponse {
  slaBreaches: SLABreachAlert[];
  pendingFeedback: PendingFeedbackAlert[];
}

/**
 * Alert filter options
 */
export type AlertType = 'sla' | 'feedback' | 'all';

export interface GetAlertsOptions {
  type?: AlertType;
}

/**
 * SLA Configuration interface
 * Requirements: 10.5
 */
export interface SLAConfig {
  id: string;
  companyId: string;
  stageName: string;
  thresholdDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface SLAConfigResponse {
  configs: SLAConfig[];
  defaults: { stageName: string; thresholdDays: number }[];
}

export interface UpdateSLAConfigData {
  stageName: string;
  thresholdDays: number;
}

export const alertsService = {
  /**
   * Get all alerts (SLA breaches and pending feedback)
   * Requirements: 9.2, 10.2
   */
  async getAlerts(options: GetAlertsOptions = {}): Promise<AlertsResponse> {
    const params = new URLSearchParams();
    if (options.type) {
      params.append('type', options.type);
    }
    const response = await api.get(`/alerts?${params.toString()}`);
    return response.data;
  },

  /**
   * Get SLA configuration for the company
   * Requirements: 10.5
   */
  async getSLAConfig(): Promise<SLAConfigResponse> {
    const response = await api.get('/settings/sla');
    return response.data;
  },

  /**
   * Update SLA configuration
   * Requirements: 10.5
   */
  async updateSLAConfig(configs: UpdateSLAConfigData[]): Promise<{ success: boolean; configs: SLAConfig[] }> {
    const response = await api.put('/settings/sla', { configs });
    return response.data;
  },

  /**
   * Update single SLA configuration
   * Requirements: 10.5
   */
  async updateSingleSLAConfig(data: UpdateSLAConfigData): Promise<{ success: boolean; config: SLAConfig }> {
    const response = await api.put('/settings/sla', data);
    return response.data;
  },

  /**
   * Delete SLA configuration for a stage
   * Requirements: 10.5
   */
  async deleteSLAConfig(stageName: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/settings/sla/${encodeURIComponent(stageName)}`);
    return response.data;
  },

  /**
   * Apply default SLA thresholds
   * Requirements: 10.5
   */
  async applyDefaultSLAConfig(): Promise<{ success: boolean; configs: SLAConfig[] }> {
    const response = await api.post('/settings/sla/apply-defaults');
    return response.data;
  },

  /**
   * Get default SLA thresholds
   * Requirements: 10.5
   */
  async getDefaultSLAThresholds(): Promise<{ defaults: { stageName: string; thresholdDays: number }[] }> {
    const response = await api.get('/settings/sla/defaults');
    return response.data;
  },

  /**
   * Check SLA status for a specific candidate
   * Requirements: 10.1, 2.5
   */
  async checkCandidateSLAStatus(jobCandidateId: string): Promise<{ isBreached: boolean; breach: SLABreachAlert | null }> {
    const response = await api.get(`/candidates/${jobCandidateId}/sla-status`);
    return response.data;
  },
};

export default alertsService;
