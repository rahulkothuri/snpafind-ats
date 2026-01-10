/**
 * StageImportModal Component - Requirements 3.1, 3.2, 3.4
 * 
 * Modal interface for importing pipeline stages from existing jobs.
 * 
 * Features:
 * - Job selection and stage preview
 * - Search and filter functionality for available jobs
 * - Stage selection and modification interface
 * - Preview of stages before import
 */

import { useState, useEffect, useMemo } from 'react';
import type { Job, PipelineStageConfig } from '../types';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export interface StageImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (stages: PipelineStageConfig[]) => void;
  currentJobId?: string;
}

interface JobWithStages extends Job {
  stages?: Array<{
    id: string;
    jobId: string;
    name: string;
    position: number;
    isDefault: boolean;
    isMandatory: boolean;
    parentId?: string;
    subStages?: Array<{
      id: string;
      jobId: string;
      name: string;
      position: number;
      isDefault: boolean;
      isMandatory: boolean;
      parentId?: string;
    }>;
  }>;
}

export function StageImportModal({ isOpen, onClose, onImport, currentJobId }: StageImportModalProps) {
  const { user } = useAuth();
  const [availableJobs, setAvailableJobs] = useState<JobWithStages[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<JobWithStages | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [modifiedStages, setModifiedStages] = useState<Record<string, { name: string; isMandatory: boolean }>>({});

  // Fetch available jobs when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchAvailableJobs();
    }
  }, [isOpen, user]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedJobId('');
      setSelectedJob(null);
      setSearchTerm('');
      setError(null);
      setSelectedStages(new Set());
      setModifiedStages({});
    }
  }, [isOpen]);

  // Fetch job details when a job is selected
  useEffect(() => {
    if (selectedJobId) {
      fetchJobDetails(selectedJobId);
    } else {
      setSelectedJob(null);
      setSelectedStages(new Set());
      setModifiedStages({});
    }
  }, [selectedJobId]);

  const fetchAvailableJobs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/jobs');
      const jobs = response.data.filter((job: Job) => 
        job.id !== currentJobId && // Exclude current job
        job.status === 'active' // Only active jobs
      );
      setAvailableJobs(jobs);
    } catch (err) {
      console.error('Failed to fetch available jobs:', err);
      setError('Failed to load available jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobDetails = async (jobId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/jobs/${jobId}`);
      const job = response.data;
      setSelectedJob(job);
      
      // Auto-select all stages initially
      if (job.stages) {
        const stageIds = job.stages.map((stage: any) => stage.id);
        setSelectedStages(new Set(stageIds));
      }
    } catch (err) {
      console.error('Failed to fetch job details:', err);
      setError('Failed to load job details. Please try again.');
      setSelectedJob(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter jobs based on search term
  const filteredJobs = useMemo(() => {
    if (!searchTerm.trim()) return availableJobs;
    
    const term = searchTerm.toLowerCase();
    return availableJobs.filter(job => 
      job.title.toLowerCase().includes(term) ||
      job.department.toLowerCase().includes(term)
    );
  }, [availableJobs, searchTerm]);

  // Handle stage selection toggle
  const handleStageToggle = (stageId: string) => {
    const newSelected = new Set(selectedStages);
    if (newSelected.has(stageId)) {
      newSelected.delete(stageId);
    } else {
      newSelected.add(stageId);
    }
    setSelectedStages(newSelected);
  };

  // Handle stage modification
  const handleStageModification = (stageId: string, field: 'name' | 'isMandatory', value: string | boolean) => {
    setModifiedStages(prev => ({
      ...prev,
      [stageId]: {
        ...prev[stageId],
        [field]: value,
      },
    }));
  };

  // Handle import
  const handleImport = async () => {
    if (!selectedJob || selectedStages.size === 0) return;

    setIsImporting(true);
    setError(null);

    try {
      // Prepare stages for import
      const stagesToImport: PipelineStageConfig[] = selectedJob.stages!
        .filter(stage => selectedStages.has(stage.id))
        .map((stage, index) => {
          const modifications = modifiedStages[stage.id];
          return {
            name: modifications?.name || stage.name,
            position: index,
            isMandatory: modifications?.isMandatory !== undefined ? modifications.isMandatory : stage.isMandatory,
            subStages: stage.subStages?.map((subStage, subIndex) => ({
              name: subStage.name,
              position: subIndex,
            })) || [],
          };
        });

      onImport(stagesToImport);
      onClose();
    } catch (err) {
      console.error('Failed to import stages:', err);
      setError('Failed to import stages. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Import Pipeline Stages</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={isImporting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Panel - Job Selection */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Select Source Job</h3>
              
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search jobs by title or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Job List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && !selectedJob ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b6cf0]"></div>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No jobs found matching your search.' : 'No jobs available for import.'}
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-all
                        ${selectedJobId === job.id 
                          ? 'border-[#0b6cf0] bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500">{job.department}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Created {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Stage Preview and Selection */}
          <div className="w-1/2 flex flex-col">
            {selectedJob ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Pipeline Stages</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    From: <span className="font-medium">{selectedJob.title}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Select stages to import and modify them if needed
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b6cf0]"></div>
                    </div>
                  ) : selectedJob.stages && selectedJob.stages.length > 0 ? (
                    <div className="space-y-3">
                      {selectedJob.stages.map((stage) => {
                        const isSelected = selectedStages.has(stage.id);
                        const modifications = modifiedStages[stage.id];
                        const displayName = modifications?.name || stage.name;
                        const displayMandatory = modifications?.isMandatory !== undefined 
                          ? modifications.isMandatory 
                          : stage.isMandatory;

                        return (
                          <div
                            key={stage.id}
                            className={`
                              border rounded-lg transition-all
                              ${isSelected ? 'border-[#0b6cf0] bg-blue-50' : 'border-gray-200'}
                            `}
                          >
                            <div className="p-3">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleStageToggle(stage.id)}
                                  className="w-4 h-4 text-[#0b6cf0] border-gray-300 rounded focus:ring-[#0b6cf0]"
                                />
                                
                                <div className="flex-1">
                                  {isSelected ? (
                                    <input
                                      type="text"
                                      value={displayName}
                                      onChange={(e) => handleStageModification(stage.id, 'name', e.target.value)}
                                      className="font-medium text-gray-900 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                                      placeholder="Stage name"
                                    />
                                  ) : (
                                    <span className="font-medium text-gray-900">{displayName}</span>
                                  )}
                                  
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">Position: {stage.position}</span>
                                    {displayMandatory && (
                                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                                        Required
                                      </span>
                                    )}
                                    {stage.subStages && stage.subStages.length > 0 && (
                                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                        {stage.subStages.length} sub-stage{stage.subStages.length !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {isSelected && (
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={displayMandatory}
                                      onChange={(e) => handleStageModification(stage.id, 'isMandatory', e.target.checked)}
                                      className="w-3 h-3 text-[#0b6cf0] border-gray-300 rounded focus:ring-[#0b6cf0]"
                                    />
                                    <span className="text-gray-600">Required</span>
                                  </label>
                                )}
                              </div>

                              {/* Sub-stages */}
                              {isSelected && stage.subStages && stage.subStages.length > 0 && (
                                <div className="mt-3 pl-7 space-y-1">
                                  {stage.subStages.map((subStage) => (
                                    <div key={subStage.id} className="text-sm text-gray-600 flex items-center gap-2">
                                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                      {subStage.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      This job has no pipeline stages to import.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>Select a job to preview its pipeline stages</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Always visible at bottom */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            {selectedStages.size > 0 && (
              <span>{selectedStages.size} stage{selectedStages.size !== 1 ? 's' : ''} selected</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedJob || selectedStages.size === 0 || isImporting}
              className="px-4 py-2 bg-[#0b6cf0] text-white rounded-lg hover:bg-[#0952b8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              Import {selectedStages.size > 0 ? `${selectedStages.size} Stage${selectedStages.size !== 1 ? 's' : ''}` : 'Stages'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute bottom-20 left-6 right-6 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StageImportModal;