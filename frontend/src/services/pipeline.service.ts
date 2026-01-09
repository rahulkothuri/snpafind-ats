/**
 * Pipeline Service - Requirements 1.3, 1.4, 1.5, 1.6, 3.1, 3.2, 3.3
 * 
 * Handles pipeline-related API calls including bulk move operations and sub-stage management
 */

import api from './api';
import type { PipelineStage } from '../types';

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

export interface AddSubStageRequest {
  parentStageId: string;
  name: string;
  position?: number;
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

  /**
   * Add a sub-stage to a parent stage
   * Requirements: 3.1, 3.2, 3.3
   */
  async addSubStage(data: AddSubStageRequest): Promise<PipelineStage> {
    const response = await api.post('/pipeline/sub-stages', data);
    return response.data;
  },

  /**
   * Delete a sub-stage
   * Requirements: 2.1, 2.2
   */
  async deleteSubStage(subStageId: string): Promise<void> {
    await api.delete(`/pipeline/sub-stages/${subStageId}`);
  },
};

export default pipelineService;
