/**
 * Add Note Modal
 * 
 * Simple modal to add a note to a candidate
 */

import { useState } from 'react';
import { Button } from './index';
import api from '../services/api';

interface AddNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateId: string;
    candidateName: string;
    onSuccess?: () => void;
}

export function AddNoteModal({ isOpen, onClose, candidateId, candidateName, onSuccess }: AddNoteModalProps) {
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;

        try {
            setIsSubmitting(true);
            setError(null);
            await api.post(`/candidates/${candidateId}/notes`, {
                content: note.trim(),
            });
            setNote('');
            onSuccess?.();
            onClose();
        } catch (err) {
            setError('Failed to add note');
            console.error('Error adding note:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Note</h3>
                <p className="text-sm text-gray-500 mb-4">Adding note for <span className="font-medium text-gray-900">{candidateName}</span></p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] text-sm"
                            placeholder="Enter your note here..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            autoFocus
                        />
                        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={isSubmitting || !note.trim()}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Note'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
