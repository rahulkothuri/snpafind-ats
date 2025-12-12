import type { Candidate, CandidateActivity, JobCandidate } from '../types/index.js';
export interface CreateCandidateData {
    companyId: string;
    name: string;
    email: string;
    phone?: string;
    experienceYears?: number;
    currentCompany?: string;
    location: string;
    currentCtc?: string;
    expectedCtc?: string;
    noticePeriod?: string;
    source: string;
    availability?: string;
    skills?: string[];
    score?: number;
}
export interface UpdateCandidateData {
    name?: string;
    email?: string;
    phone?: string;
    experienceYears?: number;
    currentCompany?: string;
    location?: string;
    currentCtc?: string;
    expectedCtc?: string;
    noticePeriod?: string;
    source?: string;
    availability?: string;
    skills?: string[];
    resumeUrl?: string;
    score?: number;
}
export interface CandidateSearchFilters {
    query?: string;
    department?: string;
    location?: string;
    experienceMin?: number;
    experienceMax?: number;
    source?: string;
    availability?: string;
    scoreMin?: number;
    scoreMax?: number;
    sortBy?: 'score_asc' | 'score_desc' | 'updated' | 'name';
}
export interface StageChangeData {
    jobCandidateId: string;
    newStageId: string;
    rejectionReason?: string;
}
export interface StageChangeResult {
    jobCandidate: JobCandidate;
    activity: CandidateActivity;
}
export interface ScoreUpdateResult {
    candidate: Candidate;
    activity: CandidateActivity;
}
export declare const candidateService: {
    /**
     * Create a new candidate
     * Requirements: 8.1, 8.2, 8.4
     */
    create(data: CreateCandidateData): Promise<Candidate>;
    /**
     * Get a candidate by ID
     */
    getById(id: string): Promise<Candidate>;
    /**
     * Get a candidate by email
     */
    getByEmail(email: string): Promise<Candidate | null>;
    /**
     * Update a candidate
     * Requirements: 9.2
     */
    update(id: string, data: UpdateCandidateData): Promise<Candidate>;
    /**
     * Get all candidates for a company
     * Requirements: 8.3
     */
    getAllByCompany(companyId: string): Promise<Candidate[]>;
    /**
     * Get all candidates
     */
    getAll(): Promise<Candidate[]>;
    /**
     * Search candidates
     * Requirements: 11.1, 11.2, 11.3, 11.4
     */
    search(companyId: string, filters: CandidateSearchFilters): Promise<Candidate[]>;
    /**
     * Update resume URL for a candidate
     * Requirements: 10.1
     */
    updateResumeUrl(id: string, resumeUrl: string): Promise<Candidate>;
    /**
     * Delete a candidate
     */
    delete(id: string): Promise<void>;
    /**
     * Change a candidate's stage in a job pipeline
     * Requirements: 24.1, 24.2, 24.3, 24.4
     */
    changeStage(data: StageChangeData): Promise<StageChangeResult>;
    /**
     * Get available stages for a job candidate
     * Requirements: 24.3
     */
    getAvailableStages(jobCandidateId: string): Promise<{
        id: string;
        name: string;
        position: number;
    }[]>;
    /**
     * Update a candidate's score
     * Requirements: 25.1, 25.2
     */
    updateScore(candidateId: string, score: number): Promise<ScoreUpdateResult>;
    /**
     * Get candidate's activity timeline
     */
    getActivityTimeline(candidateId: string): Promise<CandidateActivity[]>;
    /**
     * Search candidates with score filtering and sorting
     * Requirements: 25.3, 25.4
     */
    searchWithScoring(companyId: string, filters: CandidateSearchFilters): Promise<Candidate[]>;
};
export default candidateService;
//# sourceMappingURL=candidate.service.d.ts.map