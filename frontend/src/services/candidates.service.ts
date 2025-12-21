import api from './api';

export interface Candidate {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  experienceYears: number;
  currentCompany?: string;
  location: string;
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string;
  source: string;
  availability?: string;
  skills: string[];
  resumeUrl?: string;
  score?: number;
  createdAt: string;
  updatedAt: string;
  currentStage?: string;
  // Enhanced fields for comprehensive candidate display
  age?: number;
  industry?: string;
  jobDomain?: string;
  candidateSummary?: string;
  tags?: string[];
  title?: string;
  department?: string;
  internalMobility?: boolean;
}

export interface JobCandidate {
  id: string;
  jobId: string;
  candidateId: string;
  currentStageId: string;
  appliedAt: string;
  updatedAt: string;
  candidate?: Candidate;
  stageName?: string;
}

export interface CandidateActivity {
  id: string;
  candidateId: string;
  jobCandidateId?: string;
  activityType: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateCandidateData {
  name: string;
  email: string;
  phone?: string;
  experienceYears: number;
  currentCompany?: string;
  location: string;
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string;
  source: string;
  availability?: string;
  skills?: string[];
}

export interface CandidateSearchParams {
  search?: string;
  department?: string;
  location?: string;
  experienceMin?: number;
  experienceMax?: number;
  source?: string;
  availability?: string;
}

export const candidatesService = {
  async getAll(params?: CandidateSearchParams): Promise<Candidate[]> {
    const response = await api.get('/candidates', { params });
    return response.data;
  },

  async getById(id: string): Promise<Candidate> {
    const response = await api.get(`/candidates/${id}`);
    return response.data;
  },

  async create(data: CreateCandidateData): Promise<Candidate> {
    const response = await api.post('/candidates', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateCandidateData>): Promise<Candidate> {
    const response = await api.put(`/candidates/${id}`, data);
    return response.data;
  },

  async uploadResume(id: string, file: File): Promise<{ resumeUrl: string }> {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await api.post(`/candidates/${id}/resume`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateStage(id: string, stageId: string, jobId: string): Promise<void> {
    await api.put(`/candidates/${id}/stage`, { stageId, jobId });
  },

  async updateScore(id: string, score: number): Promise<Candidate> {
    const response = await api.put(`/candidates/${id}`, { score });
    return response.data;
  },

  async getActivities(id: string): Promise<CandidateActivity[]> {
    const response = await api.get(`/candidates/${id}/activities`);
    return response.data;
  },

  async getByJob(jobId: string): Promise<JobCandidate[]> {
    const response = await api.get(`/jobs/${jobId}/candidates`);
    return response.data;
  },
};

export default candidatesService;
