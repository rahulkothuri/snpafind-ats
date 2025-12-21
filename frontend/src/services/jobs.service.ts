import api from './api';

export interface Job {
  id: string;
  companyId: string;
  title: string;
  department: string;
  location: string;
  employmentType?: string;
  salaryRange?: string;
  description?: string;
  status: 'active' | 'paused' | 'closed';
  openings: number;
  createdAt: string;
  updatedAt: string;
  candidateCount?: number;
  interviewCount?: number;
  offerCount?: number;
}

export interface PipelineStage {
  id: string;
  jobId: string;
  name: string;
  position: number;
  isDefault: boolean;
  candidateCount?: number;
}

export interface StageMetric {
  stageId: string;
  stageName: string;
  candidateCount: number;
  avgDaysInStage: number;
  slaBreachCount: number;
}

export interface PipelineAnalytics {
  stageMetrics: StageMetric[];
  overallTAT: number;
}

export interface CreateJobData {
  title: string;
  department: string;
  location: string;
  employmentType?: string;
  salaryRange?: string;
  description?: string;
  openings?: number;
}

export const jobsService = {
  async getAll(): Promise<Job[]> {
    const response = await api.get('/jobs');
    return response.data;
  },

  async getById(id: string): Promise<Job> {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  async create(data: CreateJobData): Promise<Job> {
    const response = await api.post('/jobs', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateJobData>): Promise<Job> {
    const response = await api.put(`/jobs/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/jobs/${id}`);
  },

  async getPipelineStages(jobId: string): Promise<PipelineStage[]> {
    const response = await api.get(`/jobs/${jobId}/pipeline`);
    return response.data;
  },

  /**
   * Get pipeline analytics including stage metrics with counts and TAT
   * Requirements: 2.4, 4.1
   */
  async getPipelineAnalytics(jobId: string): Promise<PipelineAnalytics> {
    const response = await api.get(`/jobs/${jobId}/pipeline/analytics`);
    return response.data;
  },
};

export default jobsService;
