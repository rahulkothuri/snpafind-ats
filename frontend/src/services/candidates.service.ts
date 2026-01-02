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
  education?: string;
  // Score breakdown fields - Requirements 8.1, 8.2
  domainScore?: number | null;
  industryScore?: number | null;
  keyResponsibilitiesScore?: number | null;
}

// Stage History Entry - Requirements 2.1, 2.2, 2.3
export interface StageHistoryEntry {
  id: string;
  jobCandidateId: string;
  stageId: string;
  stageName: string;
  enteredAt: string;
  exitedAt?: string;
  durationHours?: number;
  comment?: string;
  movedBy?: string;
  movedByName?: string;
}

// Candidate Note - Requirements 6.1, 6.2, 6.3
export interface CandidateNote {
  id: string;
  candidateId: string;
  content: string;
  createdBy: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

// Candidate Attachment - Requirements 6.4, 6.5
export interface CandidateAttachment {
  id: string;
  candidateId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploaderName: string;
  createdAt: string;
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

  // Stage History - Requirements 2.1, 2.2, 2.3
  async getStageHistory(candidateId: string): Promise<StageHistoryEntry[]> {
    const response = await api.get(`/candidates/${candidateId}/stage-history`);
    return response.data;
  },

  // Notes - Requirements 6.1, 6.2, 6.3
  async getNotes(candidateId: string): Promise<CandidateNote[]> {
    const response = await api.get(`/candidates/${candidateId}/notes`);
    return response.data;
  },

  async createNote(candidateId: string, content: string): Promise<CandidateNote> {
    const response = await api.post(`/candidates/${candidateId}/notes`, { content });
    return response.data;
  },

  async deleteNote(candidateId: string, noteId: string): Promise<void> {
    await api.delete(`/candidates/${candidateId}/notes/${noteId}`);
  },

  // Attachments - Requirements 6.4, 6.5
  async getAttachments(candidateId: string): Promise<CandidateAttachment[]> {
    const response = await api.get(`/candidates/${candidateId}/attachments`);
    return response.data;
  },

  async uploadAttachment(candidateId: string, file: File): Promise<CandidateAttachment> {
    const formData = new FormData();
    formData.append('attachment', file);
    const response = await api.post(`/candidates/${candidateId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteAttachment(candidateId: string, attachmentId: string): Promise<void> {
    await api.delete(`/candidates/${candidateId}/attachments/${attachmentId}`);
  },

  // Tags - Requirements 7.2, 7.5
  async addTag(candidateId: string, tag: string): Promise<Candidate> {
    const response = await api.post(`/candidates/${candidateId}/tags`, { tag });
    return response.data;
  },

  async removeTag(candidateId: string, tag: string): Promise<Candidate> {
    const response = await api.delete(`/candidates/${candidateId}/tags/${encodeURIComponent(tag)}`);
    return response.data;
  },

  async getAllTags(): Promise<string[]> {
    const response = await api.get('/candidates/tags/all');
    return response.data;
  },
};

export default candidatesService;
