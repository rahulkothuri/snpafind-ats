/**
 * Pipeline Service - Requirements 1.3, 1.4, 1.5, 1.6
 * 
 * Handles pipeline-related API calls including bulk move operations
 */

import api from './api';

export interface BulkMoveRequest {
  candidateIds: string[];
  targetStageId: string;
  jobId: string;
  comment?: string;
}

export interface BulkMoveFailure {
  candidateId: string;
  candidateName?: string;
  error: string;
}

export interface BulkMoveResult {
  success: boolean;
  movedCount: number;
  failedCount: number;
  failures?: BulkMoveFailure[];
}

export const pipelineService = {
  /**
   * Move multiple candidates to a target stage in a single operation
   * Requirements: 1.3, 1.4, 1.5, 1.6
   */
  async bulkMove(data: BulkMoveRequest): Promise<BulkMoveResult> {
    const response = await api.post('/pipeline/bulk-move', data);
    return response.data;
  },

  /**
   * Move a single candidate to a target stage
   */
  async moveCandidate(jobCandidateId: string, targetStageId: string, jobId: string): Promise<void> {
    await api.post('/pipeline/bulk-move', {
      candidateIds: [jobCandidateId],
      targetStageId,
      jobId,
    });
  },
};

export default pipelineService;
