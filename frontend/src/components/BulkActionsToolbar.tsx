/**
 * BulkActionsToolbar Component - Requirements 1.1, 1.2, 1.3, 1.5, 3.1, 3.4
 * 
 * Displays a toolbar when candidates are selected for bulk operations:
 * - Shows count of selected candidates
 * - Stage dropdown for bulk move
 * - Move button with loading state
 * - Clear selection button
 * - Comment modal for stage moves (required for rejection stages)
 */

import { useState } from 'react';
import { Button } from './Button';

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
}

export interface BulkMoveResult {
  success: boolean;
  movedCount: number;
  failedCount: number;
  failures?: { candidateId: string; candidateName?: string; error: string }[];
}

export interface BulkActionsToolbarProps {
  selectedCandidates: string[];
  stages: PipelineStage[];
  onBulkMove: (targetStageId: string, comment?: string) => Promise<BulkMoveResult>;
  onClearSelection: () => void;
  isLoading: boolean;
}

/**
 * Check if a stage is a rejection stage
 */
function isRejectionStage(stageName: string): boolean {
  const lowerName = stageName.toLowerCase();
  return lowerName.includes('reject') || 
         lowerName.includes('declined') ||
         lowerName.includes('not selected');
}

export function BulkActionsToolbar({
  selectedCandidates,
  stages,
  onBulkMove,
  onClearSelection,
  isLoading,
}: BulkActionsToolbarProps) {
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');
  const [pendingStageId, setPendingStageId] = useState<string>('');
  const [result, setResult] = useState<BulkMoveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Don't render if no candidates selected
  if (selectedCandidates.length === 0) {
    return null;
  }

  const selectedStage = stages.find(s => s.id === selectedStageId);
  const requiresComment = selectedStage ? isRejectionStage(selectedStage.name) : false;

  const handleMoveClick = () => {
    if (!selectedStageId) return;
    
    // Always show comment modal for moves (optional comment for non-rejection, required for rejection)
    setPendingStageId(selectedStageId);
    setShowCommentModal(true);
  };

  const handleConfirmMove = async () => {
    const stageToMove = stages.find(s => s.id === pendingStageId);
    const isRejection = stageToMove ? isRejectionStage(stageToMove.name) : false;
    
    // Validate comment for rejection stages
    if (isRejection && !comment.trim()) {
      setError('A comment is required when moving to a rejection stage');
      return;
    }

    setError(null);
    setShowCommentModal(false);
    
    try {
      const moveResult = await onBulkMove(pendingStageId, comment.trim() || undefined);
      setResult(moveResult);
      
      // Clear form state on success
      if (moveResult.success) {
        setSelectedStageId('');
        setComment('');
        setPendingStageId('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move candidates');
    }
  };

  const handleCloseResult = () => {
    setResult(null);
    if (result?.success) {
      onClearSelection();
    }
  };

  const handleCloseModal = () => {
    setShowCommentModal(false);
    setComment('');
    setPendingStageId('');
    setError(null);
  };

  return (
    <>
      {/* Bulk Actions Toolbar - Requirements 1.1, 1.2 */}
      <div className="bg-[#0b6cf0] text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2">
        <div className="flex items-center gap-3">
          {/* Selection count */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">
              {selectedCandidates.length} candidate{selectedCandidates.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          {/* Stage dropdown */}
          <select
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            disabled={isLoading}
          >
            <option value="" className="text-gray-900">Select stage...</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id} className="text-gray-900">
                {stage.name}
              </option>
            ))}
          </select>

          {/* Move button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMoveClick}
            disabled={!selectedStageId || isLoading}
            className="bg-white text-[#0b6cf0] hover:bg-white/90"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Moving...
              </span>
            ) : (
              'Move to Stage'
            )}
          </Button>
        </div>

        {/* Clear selection button */}
        <button
          onClick={onClearSelection}
          className="text-white/80 hover:text-white transition-colors"
          disabled={isLoading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Comment Modal - Requirements 3.1, 3.4 */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-2">
              Move {selectedCandidates.length} Candidate{selectedCandidates.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-[#64748b] mb-4">
              Moving to: <span className="font-medium text-[#374151]">{stages.find(s => s.id === pendingStageId)?.name}</span>
            </p>

            {/* Comment input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#374151] mb-1">
                Comment {requiresComment ? <span className="text-red-500">*</span> : '(optional)'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={requiresComment ? 'Please provide a reason for rejection...' : 'Add a comment for this stage change...'}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] focus:border-transparent resize-none"
                rows={3}
              />
              {requiresComment && (
                <p className="text-xs text-[#94a3b8] mt-1">
                  A comment is required when moving to a rejection stage
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseModal} disabled={isLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmMove} disabled={isLoading}>
                {isLoading ? 'Moving...' : 'Confirm Move'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal - Requirements 1.5 */}
      {result && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              {result.success ? (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-[#111827]">
                  {result.success ? 'Move Complete' : 'Partial Success'}
                </h3>
                <p className="text-sm text-[#64748b]">
                  {result.movedCount} candidate{result.movedCount !== 1 ? 's' : ''} moved successfully
                  {result.failedCount > 0 && `, ${result.failedCount} failed`}
                </p>
              </div>
            </div>

            {/* Show failures if any */}
            {result.failures && result.failures.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto">
                <p className="text-sm font-medium text-[#374151] mb-2">Failed to move:</p>
                <ul className="space-y-1">
                  {result.failures.map((failure) => (
                    <li key={failure.candidateId} className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                      {failure.candidateName || failure.candidateId}: {failure.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="primary" onClick={handleCloseResult}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BulkActionsToolbar;
