import api from './api';

export interface DashboardMetrics {
  openRoles: number;
  activeCandidates: number;
  interviewsToday: number;
  offersPending: number;
  timeToFillMedian: number;
  offerAcceptanceRate: number;
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

export interface DashboardData {
  metrics: DashboardMetrics;
  rolePipeline: RolePipeline[];
  funnel: FunnelStage[];
  sources: SourcePerformance[];
  recruiterLoad: RecruiterLoad[];
}

export const dashboardService = {
  async getMetrics(): Promise<DashboardData> {
    // For now, return mock data since we don't have a dedicated dashboard endpoint
    // In a real implementation, this would aggregate data from multiple endpoints
    const response = await api.get('/jobs');
    const jobs = response.data;

    const candidatesResponse = await api.get('/candidates');
    const candidates = candidatesResponse.data;

    // Calculate metrics from actual data
    const openRoles = jobs.filter((j: { status: string }) => j.status === 'active').length;
    const activeCandidates = candidates.length;

    return {
      metrics: {
        openRoles,
        activeCandidates,
        interviewsToday: 8,
        offersPending: 6,
        timeToFillMedian: 24,
        offerAcceptanceRate: 78,
      },
      rolePipeline: jobs.slice(0, 6).map((job: { id: string; title: string; location: string; openings: number }, index: number) => ({
        id: job.id,
        role: job.title,
        location: job.location,
        applicants: Math.floor(Math.random() * 50) + 20,
        interview: Math.floor(Math.random() * 15) + 5,
        offer: Math.floor(Math.random() * 5) + 1,
        age: Math.floor(Math.random() * 30) + 10,
        sla: index % 3 === 0 ? 'At risk' : index % 3 === 1 ? 'Breached' : 'On track',
        priority: index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Medium' : 'Low',
      })),
      funnel: [
        { name: 'Applied', count: 236, percentage: 100 },
        { name: 'Screened', count: 142, percentage: 60 },
        { name: 'Shortlisted', count: 89, percentage: 38 },
        { name: 'Interview', count: 60, percentage: 25 },
        { name: 'Offer', count: 14, percentage: 6 },
        { name: 'Hired', count: 8, percentage: 3 },
      ],
      sources: [
        { source: 'LinkedIn', percentage: 44 },
        { source: 'Referrals', percentage: 19 },
        { source: 'Job Board X', percentage: 16 },
        { source: 'Career Page', percentage: 12 },
        { source: 'Agencies', percentage: 9 },
      ],
      recruiterLoad: [
        { name: 'Aarti', specialty: 'Tech', activeRoles: 4, candidates: 86 },
        { name: 'Rahul', specialty: 'Product', activeRoles: 2, candidates: 45 },
        { name: 'Vikram', specialty: 'Sales', activeRoles: 3, candidates: 52 },
        { name: 'Sana', specialty: 'Design', activeRoles: 2, candidates: 38 },
      ],
    };
  },
};

export default dashboardService;
