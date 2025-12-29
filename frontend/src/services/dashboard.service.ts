import api from './api';
import type { User } from '../types';

export interface DashboardMetrics {
  openRoles: number;
  activeCandidates: number;
  interviewsToday: number;
  interviewsThisWeek: number;
  offersPending: number;
  totalHires: number;
  timeToFillMedian: number;
  offerAcceptanceRate: number;
  rolesOnTrack: number;
  rolesAtRisk: number;
  rolesBreached: number;
}

export interface RolePipeline {
  id: string;
  role: string;
  location: string;
  applicants: number;
  interview: number;
  offer: number;
  age: number;
  sla: 'On track' | 'At risk' | 'Breached';
  priority: 'High' | 'Medium' | 'Low';
  assignedRecruiterId?: string;
}

export interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
}

export interface SourcePerformance {
  source: string;
  percentage: number;
}

export interface RecruiterLoad {
  name: string;
  specialty: string;
  activeRoles: number;
  candidates: number;
}

export interface Interview {
  id: string;
  time: string;
  candidateName: string;
  role: string;
  panelMembers: string[];
  meetingType: 'Google Meet' | 'Zoom' | 'In-person';
  meetingLink?: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: Date;
  description: string;
  entityType: 'candidate' | 'job' | 'interview';
  entityId: string;
  entityName: string;
  activityType: 'stage_change' | 'interview_scheduled' | 'offer_made' | 'hire';
}

export interface DashboardData {
  metrics: DashboardMetrics;
  rolePipeline: RolePipeline[];
  funnel: FunnelStage[];
  sources: SourcePerformance[];
  recruiterLoad: RecruiterLoad[];
  interviews: Interview[];
  activities: ActivityEntry[];
}

export const dashboardService = {
  /**
   * Get aggregated dashboard data (Requirements 1.2, 1.3, 3.7)
   */
  async getDashboardData(_user?: User): Promise<DashboardData> {
    const response = await api.get('/dashboard');
    return response.data;
  },

  /**
   * Get KPI metrics with role-based filtering (Requirements 1.1, 1.2, 1.3)
   */
  async getKPIMetrics(_user?: User): Promise<DashboardMetrics> {
    const response = await api.get('/dashboard/kpis');
    return response.data;
  },

  /**
   * Get role pipeline data with role-based filtering (Requirements 3.1, 3.2, 3.3, 3.5, 3.7)
   */
  async getRolePipeline(_user?: User, limit: number = 7): Promise<RolePipeline[]> {
    const params = new URLSearchParams();
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    const queryString = params.toString();
    const url = `/dashboard/pipeline${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get upcoming interviews (Requirements 4.1, 4.2, 4.4, 4.6)
   */
  async getUpcomingInterviews(period: 'today' | 'week' = 'today', limit: number = 5): Promise<Interview[]> {
    const params = new URLSearchParams();
    params.append('period', period);
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    const queryString = params.toString();
    const url = `/dashboard/interviews?${queryString}`;
    
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get activity feed (Requirements 20.1, 20.2, 20.3, 20.4)
   */
  async getActivityFeed(limit: number = 10): Promise<ActivityEntry[]> {
    const params = new URLSearchParams();
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    const queryString = params.toString();
    const url = `/dashboard/activity${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Legacy method for backward compatibility - now uses real API calls
   */
  async getMetrics(_user?: User): Promise<DashboardData> {
    return this.getDashboardData(_user);
  },

  /**
   * Get funnel data for dashboard overview
   */
  async getFunnelData(): Promise<FunnelStage[]> {
    const response = await api.get('/analytics/funnel');
    return response.data.stages.map((stage: any) => ({
      name: stage.name,
      count: stage.count,
      percentage: stage.percentage
    }));
  },

  /**
   * Get source performance data for dashboard overview
   */
  async getSourcePerformance(): Promise<SourcePerformance[]> {
    const response = await api.get('/analytics/sources');
    return response.data.map((source: any) => ({
      source: source.source,
      percentage: source.percentage
    }));
  },

  /**
   * Get recruiter load data for dashboard overview
   */
  async getRecruiterLoad(): Promise<RecruiterLoad[]> {
    const response = await api.get('/analytics/recruiters');
    return response.data.map((recruiter: any) => ({
      name: recruiter.name,
      specialty: recruiter.specialty,
      activeRoles: recruiter.activeRoles,
      candidates: recruiter.cvsAdded
    }));
  }
};

export default dashboardService;
