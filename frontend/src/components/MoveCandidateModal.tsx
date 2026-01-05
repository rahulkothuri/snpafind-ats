
import React, { useState } from 'react';
import Button from './Button';

interface Stage {
    id: string;
    name: string;
}

interface MoveCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateName: string;
    currentStageId: string;
    stages: Stage[];
    onMove: (targetStageId: string) => Promise<void>;
}

export default function MoveCandidateModal({
    isOpen,
    onClose,
    candidateName,
    currentStageId,
    stages,
    onMove,
}: MoveCandidateModalProps) {
    const [selectedStageId, setSelectedStageId] = useState<string>(currentStageId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStageId === currentStageId) {
            onClose();
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onMove(selectedStageId);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to move candidate');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200 border border-[#e2e8f0]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold leading-6 text-[#111827]">
                        Move Candidate
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                        type="button"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-sm text-[#64748b] mb-4">
                    Select a new stage for <span className="font-semibold text-[#111827]">{candidateName}</span>.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wider mb-1.5">
                            Target Stage
                        </label>
                        <select
                            value={selectedStageId}
                            onChange={(e) => setSelectedStageId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0b6cf0]/20 focus:border-[#0b6cf0] transition-all"
                        >
                            {stages.map((stage) => (
                                <option key={stage.id} value={stage.id} disabled={stage.id === currentStageId}>
                                    {stage.name} {stage.id === currentStageId ? '(Current)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                            <p className="text-xs text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-[#f1f5f9]">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting || selectedStageId === currentStageId}
                        >
                            {isSubmitting ? 'Moving...' : 'Move Candidate'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
