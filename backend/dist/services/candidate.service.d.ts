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
    domainScore?: number;
    industryScore?: number;
    keyResponsibilitiesScore?: number;
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
    domainScore?: number;
    industryScore?: number;
    keyResponsibilitiesScore?: number;
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
    tags?: string[];
}
export interface StageChangeData {
    jobCandidateId: string;
    newStageId: string;
    rejectionReason?: string;
    comment?: string;
    movedBy?: string;
}
export interface StageChangeResult {
    jobCandidate: JobCandidate;
    activity: CandidateActivity;
}
export interface ScoreUpdateResult {
    candidate: Candidate;
    activity: CandidateActivity;
}
/**
 * Calculate overall score as the average of non-null sub-scores
 * Requirements: 8.3, 8.4
 * @param domainScore - Domain score (0-100 or null)
 * @param industryScore - Industry score (0-100 or null)
 * @param keyResponsibilitiesScore - Key responsibilities score (0-100 or null)
 * @returns The average of non-null scores, or null if all scores are null
 */
export declare function calculateOverallScore(domainScore: number | null | undefined, industryScore: number | null | undefined, keyResponsibilitiesScore: number | null | undefined): number | null;
export declare const candidateService: {
    /**
     * Create a new candidate
     * Requirements: 8.1, 8.2, 8.4, 8.5
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
     * Requirements: 9.2, 8.5
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
     * Requirements: 24.1, 24.2, 24.3, 24.4, 2.1, 2.2
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
     * Update a candidate's score breakdown (individual sub-scores)
     * Requirements: 8.3, 8.4, 8.5
     */
    updateScoreBreakdown(candidateId: string, scoreBreakdown: {
        domainScore?: number;
        industryScore?: number;
        keyResponsibilitiesScore?: number;
    }): Promise<ScoreUpdateResult>;
    /**
     * Get candidate's activity timeline
     */
    getActivityTimeline(candidateId: string): Promise<CandidateActivity[]>;
    /**
     * Search candidates with score filtering and sorting
     * Requirements: 25.3, 25.4, 7.3
     */
    searchWithScoring(companyId: string, filters: CandidateSearchFilters): Promise<Candidate[]>;
    /**
     * Add a tag to a candidate
     * Requirements: 7.2
     */
    addTag(candidateId: string, tag: string): Promise<Candidate>;
    /**
     * Remove a tag from a candidate
     * Requirements: 7.5
     */
    removeTag(candidateId: string, tag: string): Promise<Candidate>;
    /**
     * Get all unique tags used across candidates in a company
     * Requirements: 7.2 (for autocomplete/selection)
     */
    getAllTags(companyId: string): Promise<string[]>;
    /**
     * Add an existing candidate to a job's Applied stage
     * Used by the candidate master database "Add to Job" feature
     */
    addToJob(candidateId: string, jobId: string, companyId: string): Promise<{
        message: string;
        jobCandidate: JobCandidate;
    }>;
    /**
     * Create a new candidate and assign them to a job
     * Used by the AddCandidateModal
     */
    createAndAssignToJob(data: {
        companyId: string;
        jobId: string;
        name: string;
        email: string;
        phone: string;
        experienceYears?: number;
        currentCompany?: string;
        currentCtc?: string;
        expectedCtc?: string;
        location: string;
        noticePeriod?: string;
        skills?: string[];
        source: string;
        resumeUrl?: string;
    }): Promise<Candidate>;
};
export default candidateService;
//# sourceMappingURL=candidate.service.d.ts.map