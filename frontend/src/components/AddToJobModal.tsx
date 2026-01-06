/**
 * AddToJobModal Component
 * 
 * Modal for adding an existing candidate to a job.
 * Shows list of available (active) jobs and adds candidate to "Applied" stage.
 */

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { jobsService } from '../services/jobs.service';
import type { Job } from '../services/jobs.service';
import api from '../services/api';

interface AddToJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (jobId: string, jobTitle: string) => void;
    candidateId: string;
    candidateName: string;
}

export function AddToJobModal({
    isOpen,
    onClose,
    onSuccess,
    candidateId,
    candidateName,
}: AddToJobModalProps) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // Load jobs when modal opens
    useEffect(() => {
        if (isOpen) {
            loadJobs();
            setSelectedJobId('');
            setError('');
            setSearchQuery('');
        }
    }, [isOpen]);

    const loadJobs = async () => {
        setIsLoading(true);
        try {
            const allJobs = await jobsService.getAll();
            // Only show active jobs
            setJobs(allJobs.filter(job => job.status === 'active'));
        } catch (err) {
            console.error('Failed to load jobs:', err);
            setError('Failed to load jobs. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedJobId) {
            setError('Please select a job');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Call API to add candidate to job
            await api.post(`/candidates/${candidateId}/add-to-job`, {
                jobId: selectedJobId,
            });

            const selectedJob = jobs.find(j => j.id === selectedJobId);
            onSuccess(selectedJobId, selectedJob?.title || 'Selected Job');
            onClose();
        } catch (err: unknown) {
            console.error('Failed to add candidate to job:', err);
            const apiError = err as { response?: { data?: { message?: string; code?: string } } };
            if (apiError.response?.data?.code === 'ALREADY_IN_JOB') {
                setError('This candidate is already added to this job.');
            } else {
                setError(apiError.response?.data?.message || 'Failed to add candidate to job. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter jobs based on search query
    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all max-h-[80vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-[#111827]">
                                Add to Job
                            </h2>
                            <p className="text-sm text-[#64748b] mt-0.5">
                                Adding <span className="font-medium text-[#374151]">{candidateName}</span> to a job
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-[#64748b] hover:text-[#111827] transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search jobs..."
                            className="w-full px-3 py-2 pl-9 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] focus:border-transparent"
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Job List */}
                    <div className="flex-1 overflow-y-auto min-h-0 mb-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0b6cf0]"></div>
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <div className="text-center py-8 text-[#64748b]">
                                {searchQuery ? 'No jobs match your search' : 'No active jobs available'}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredJobs.map(job => (
                                    <button
                                        key={job.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedJobId(job.id);
                                            setError('');
                                        }}
                                        className={`w-full text-left p-3 rounded-lg border transition-all ${selectedJobId === job.id
                                                ? 'border-[#0b6cf0] bg-blue-50 ring-1 ring-[#0b6cf0]'
                                                : 'border-[#e2e8f0] hover:border-[#0b6cf0] hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm font-medium text-[#111827] truncate">{job.title}</h4>
                                                <p className="text-xs text-[#64748b] mt-0.5 truncate">
                                                    {job.department} • {job.location}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-2">
                                                <span className="text-xs text-[#64748b] whitespace-nowrap">
                                                    {job.openings} opening{job.openings !== 1 ? 's' : ''}
                                                </span>
                                                {selectedJobId === job.id && (
                                                    <svg className="w-4 h-4 text-[#0b6cf0] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Info Message */}
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-xs text-blue-700">
                            The candidate will be added to the <strong>"Applied"</strong> stage of the selected job.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleSubmit}
                            className="flex-1"
                            disabled={isSubmitting || !selectedJobId}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Adding...
                                </span>
                            ) : (
                                'Add to Job'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddToJobModal;
