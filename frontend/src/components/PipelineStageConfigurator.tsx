/**
 * PipelineStageConfigurator Component - Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 * 
 * Allows users to configure pipeline stages during job creation with enhanced features.
 * 
 * Features:
 * - Support multiple stages within each phase (shortlisting, screening, interview)
 * - Dynamic stage addition and removal
 * - Drag-and-drop reordering functionality
 * - Stage validation and ordering logic
 * - Phase-based organization of stages
 * 
 * Note: Stage names should align with DEFAULT_PIPELINE_STAGES from constants/pipelineStages.ts
 * The Selected stage is positioned between Interview and Offer per Requirements 5.1
 */

import { useState, useCallback } from 'react';
import type { PipelineStageConfig } from '../types';

// Pipeline phases for organizing stages (Requirements 2.1, 2.2, 2.3, 5.1)
export type PipelinePhase = 'shortlisting' | 'screening' | 'interview' | 'selected' | 'offer' | 'hired';

export interface PipelinePhaseConfig {
  name: string;
  type: PipelinePhase;
  allowMultiple: boolean;
  isMandatory: boolean;
  defaultStages: string[];
}

// Phase configuration (Requirements 2.1, 2.2, 2.3, 5.1, 5.2)
export const PIPELINE_PHASES: PipelinePhaseConfig[] = [
  {
    name: 'Shortlisting',
    type: 'shortlisting',
    allowMultiple: true,
    isMandatory: false,
    defaultStages: ['Applied', 'Initial Review']
  },
  {
    name: 'Screening',
    type: 'screening',
    allowMultiple: true,
    isMandatory: true,
    defaultStages: ['Phone Screening', 'Document Review']
  },
  {
    name: 'Interview',
    type: 'interview',
    allowMultiple: true,
    isMandatory: false,
    defaultStages: ['Technical Interview', 'HR Interview', 'Final Interview']
  },
  {
    name: 'Selected',
    type: 'selected',
    allowMultiple: false,
    isMandatory: false,
    defaultStages: ['Selected']
  },
  {
    name: 'Offer',
    type: 'offer',
    allowMultiple: false,
    isMandatory: true,
    defaultStages: ['Offer']
  },
  {
    name: 'Hired',
    type: 'hired',
    allowMultiple: false,
    isMandatory: false,
    defaultStages: ['Hired']
  }
];

// Enhanced pipeline stage configuration with phase support
export interface EnhancedPipelineStageConfig extends PipelineStageConfig {
  type: PipelinePhase;
  isCustom: boolean;
  parentStageId?: string;
  requirements?: string[];
  estimatedDuration?: number;
}

// Default pipeline stages configuration with phases (Requirements 5.1, 5.2)
// Order: Applied → Screening → Interview → Selected → Offer
export const DEFAULT_PIPELINE_STAGES: EnhancedPipelineStageConfig[] = [
  { name: 'Applied', position: 0, isMandatory: false, subStages: [], type: 'shortlisting', isCustom: false },
  { name: 'Phone Screening', position: 1, isMandatory: true, subStages: [], type: 'screening', isCustom: false },
  { name: 'Technical Interview', position: 2, isMandatory: false, subStages: [], type: 'interview', isCustom: false },
  { name: 'Selected', position: 3, isMandatory: false, subStages: [], type: 'selected', isCustom: false },
  { name: 'Offer', position: 4, isMandatory: true, subStages: [], type: 'offer', isCustom: false },
];

interface PipelineStageConfiguratorProps {
  stages: EnhancedPipelineStageConfig[];
  onChange: (stages: EnhancedPipelineStageConfig[]) => void;
}

export function PipelineStageConfigurator({ stages, onChange }: PipelineStageConfiguratorProps) {
  const [newStageName, setNewStageName] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<PipelinePhase>('shortlisting');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<PipelinePhase>>(new Set<PipelinePhase>(['shortlisting', 'screening', 'interview', 'selected', 'offer']));

  // Group stages by phase for better organization
  const stagesByPhase = stages.reduce((acc, stage) => {
    if (!acc[stage.type]) {
      acc[stage.type] = [];
    }
    acc[stage.type].push(stage);
    return acc;
  }, {} as Record<PipelinePhase, EnhancedPipelineStageConfig[]>);

  // Sort stages within each phase by position
  Object.keys(stagesByPhase).forEach(phase => {
    stagesByPhase[phase as PipelinePhase].sort((a, b) => a.position - b.position);
  });

  // Validate stage name uniqueness (Requirements 2.4)
  const isStageNameUnique = useCallback((name: string, excludeIndex?: number): boolean => {
    return !stages.some((stage, index) => 
      stage.name.toLowerCase() === name.toLowerCase() && index !== excludeIndex
    );
  }, [stages]);

  // Add a new stage to a specific phase (Requirements 2.1, 2.2, 2.3)
  const handleAddStage = useCallback(() => {
    if (!newStageName.trim()) return;
    
    // Check for duplicate names (Requirements 2.4)
    if (!isStageNameUnique(newStageName.trim())) {
      return;
    }

    const phaseConfig = PIPELINE_PHASES.find(p => p.type === selectedPhase);
    if (!phaseConfig) return;

    // Check if phase allows multiple stages
    const existingStagesInPhase = stagesByPhase[selectedPhase] || [];
    if (!phaseConfig.allowMultiple && existingStagesInPhase.length > 0) {
      return;
    }

    // Calculate position within the phase
    const maxPositionInPhase = existingStagesInPhase.length > 0 
      ? Math.max(...existingStagesInPhase.map(s => s.position))
      : -1;

    // Calculate global position
    let globalPosition = 0;
    for (const phase of PIPELINE_PHASES) {
      if (phase.type === selectedPhase) {
        globalPosition += maxPositionInPhase + 1;
        break;
      }
      const phaseStages = stagesByPhase[phase.type] || [];
      globalPosition += phaseStages.length;
    }

    const newStage: EnhancedPipelineStageConfig = {
      name: newStageName.trim(),
      position: globalPosition,
      isMandatory: phaseConfig.isMandatory,
      subStages: [],
      type: selectedPhase,
      isCustom: true,
    };

    const newStages = [...stages, newStage];
    
    // Recalculate positions to maintain order
    const reorderedStages = recalculatePositions(newStages);
    
    onChange(reorderedStages);
    setNewStageName('');
  }, [newStageName, selectedPhase, stages, stagesByPhase, isStageNameUnique, onChange]);

  // Remove a stage (Requirements 2.5)
  const handleRemoveStage = useCallback((stageIndex: number) => {
    const stage = stages[stageIndex];
    
    // Don't allow removing mandatory stages
    if (stage.isMandatory) return;
    
    const newStages = stages.filter((_, index) => index !== stageIndex);
    const reorderedStages = recalculatePositions(newStages);
    
    onChange(reorderedStages);
  }, [stages, onChange]);

  // Recalculate positions to maintain logical flow (Requirements 2.5)
  const recalculatePositions = useCallback((stagesToReorder: EnhancedPipelineStageConfig[]): EnhancedPipelineStageConfig[] => {
    const stagesByPhaseLocal = stagesToReorder.reduce((acc, stage) => {
      if (!acc[stage.type]) {
        acc[stage.type] = [];
      }
      acc[stage.type].push(stage);
      return acc;
    }, {} as Record<PipelinePhase, EnhancedPipelineStageConfig[]>);

    let globalPosition = 0;
    const reorderedStages: EnhancedPipelineStageConfig[] = [];

    for (const phaseConfig of PIPELINE_PHASES) {
      const phaseStages = stagesByPhaseLocal[phaseConfig.type] || [];
      phaseStages.sort((a, b) => a.position - b.position);
      
      for (const stage of phaseStages) {
        reorderedStages.push({
          ...stage,
          position: globalPosition++
        });
      }
    }

    return reorderedStages;
  }, []);

  // Toggle phase expansion
  const togglePhaseExpansion = useCallback((phase: PipelinePhase) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phase)) {
      newExpanded.delete(phase);
    } else {
      newExpanded.add(phase);
    }
    setExpandedPhases(newExpanded);
  }, [expandedPhases]);

  // Drag and drop handlers for reordering within phases (Requirements 2.5)
  const handleDragStart = useCallback((index: number, stage: EnhancedPipelineStageConfig) => {
    // Don't allow dragging mandatory stages
    if (stage.isMandatory) return;
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number, stage: EnhancedPipelineStageConfig) => {
    e.preventDefault();
    // Only allow dropping within the same phase
    const draggedStage = draggedIndex !== null ? stages[draggedIndex] : null;
    if (!draggedStage || draggedStage.type !== stage.type || stage.isMandatory) return;
    setDragOverIndex(index);
  }, [draggedIndex, stages]);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const draggedStage = stages[draggedIndex];
    const targetStage = stages[dragOverIndex];

    // Only allow reordering within the same phase
    if (draggedStage.type !== targetStage.type || draggedStage.isMandatory || targetStage.isMandatory) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Perform the reorder
    const newStages = [...stages];
    newStages.splice(draggedIndex, 1);
    newStages.splice(dragOverIndex, 0, draggedStage);

    // Recalculate positions
    const reorderedStages = recalculatePositions(newStages);

    onChange(reorderedStages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, stages, onChange, recalculatePositions]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  return (
    <div className="form-section">
      <h3 className="form-section-header">Pipeline Stages Configuration</h3>
      <p className="form-section-subtitle">
        Configure the hiring pipeline stages organized by phases. Each phase can contain multiple stages.
      </p>

      {/* Phase-based Stages List */}
      <div className="space-y-4 mt-4">
        {PIPELINE_PHASES.map((phaseConfig) => {
          const phaseStages = stagesByPhase[phaseConfig.type] || [];
          const isExpanded = expandedPhases.has(phaseConfig.type);
          
          return (
            <div key={phaseConfig.type} className="border rounded-lg bg-white">
              {/* Phase Header */}
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => togglePhaseExpansion(phaseConfig.type)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-400">
                    <svg 
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{phaseConfig.name}</span>
                    {phaseConfig.isMandatory && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                        Required Phase
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      ({phaseStages.length} stage{phaseStages.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {phaseConfig.allowMultiple && (
                    <span className="text-xs text-gray-500">Multiple stages allowed</span>
                  )}
                </div>
              </div>

              {/* Phase Stages */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {phaseStages.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No stages in this phase</p>
                      {phaseConfig.defaultStages.length > 0 && (
                        <p className="text-xs mt-1">
                          Suggested: {phaseConfig.defaultStages.join(', ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 p-3">
                      {phaseStages.map((stage) => {
                        const globalIndex = stages.findIndex(s => s.name === stage.name);
                        return (
                          <div
                            key={stage.name}
                            draggable={!stage.isMandatory}
                            onDragStart={() => handleDragStart(globalIndex, stage)}
                            onDragOver={(e) => handleDragOver(e, globalIndex, stage)}
                            onDragEnd={handleDragEnd}
                            onDragLeave={handleDragLeave}
                            className={`
                              border rounded-lg transition-all
                              ${stage.isMandatory 
                                ? 'bg-gray-50 border-gray-200' 
                                : 'bg-white border-gray-200 hover:border-[#0b6cf0] cursor-move'
                              }
                              ${dragOverIndex === globalIndex && !stage.isMandatory ? 'border-[#0b6cf0] border-2 bg-blue-50' : ''}
                              ${draggedIndex === globalIndex ? 'opacity-50' : ''}
                            `}
                          >
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                {/* Drag Handle */}
                                {!stage.isMandatory && (
                                  <div className="text-gray-400 cursor-move">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                    </svg>
                                  </div>
                                )}

                                {/* Lock Icon for Mandatory Stages */}
                                {stage.isMandatory && (
                                  <div className="text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </div>
                                )}

                                {/* Stage Name */}
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${stage.isMandatory ? 'text-gray-600' : 'text-gray-900'}`}>
                                    {stage.name}
                                  </span>
                                  {stage.isMandatory && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                                      Required
                                    </span>
                                  )}
                                  {stage.isCustom && (
                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">
                                      Custom
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                {/* Remove Button (only for non-mandatory stages) */}
                                {!stage.isMandatory && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStage(globalIndex)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                    title="Remove stage"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Stage */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value as PipelinePhase)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] focus:border-transparent"
            >
              {PIPELINE_PHASES.map((phase) => {
                const existingStages = stagesByPhase[phase.type] || [];
                const canAddMore = phase.allowMultiple || existingStages.length === 0;
                
                return (
                  <option 
                    key={phase.type} 
                    value={phase.type}
                    disabled={!canAddMore}
                  >
                    {phase.name} {!canAddMore ? '(Max reached)' : ''}
                  </option>
                );
              })}
            </select>
            
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Enter new stage name"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddStage();
                }
              }}
            />
            
            <button
              type="button"
              onClick={handleAddStage}
              disabled={!newStageName.trim() || !isStageNameUnique(newStageName.trim())}
              className="px-4 py-2 text-sm bg-[#0b6cf0] text-white rounded-lg hover:bg-[#0952b8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Stage
            </button>
          </div>
          
          {newStageName.trim() && !isStageNameUnique(newStageName.trim()) && (
            <p className="text-xs text-red-500">
              Stage name already exists. Please choose a different name.
            </p>
          )}
          
          <p className="text-xs text-gray-500">
            Add stages to organize your hiring process. Drag non-mandatory stages to reorder within their phase.
          </p>
        </div>
      </div>

      {/* Visual Pipeline Preview */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-3">Pipeline Preview</div>
        <div className="space-y-2">
          {PIPELINE_PHASES.map((phaseConfig) => {
            const phaseStages = stagesByPhase[phaseConfig.type] || [];
            if (phaseStages.length === 0) return null;
            
            return (
              <div key={phaseConfig.type} className="flex items-center gap-2">
                <div className="text-xs font-medium text-gray-500 w-20 flex-shrink-0">
                  {phaseConfig.name}:
                </div>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {phaseStages.map((stage, index) => (
                    <div key={stage.name} className="flex items-center">
                      <div
                        className={`
                          px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap
                          ${stage.isMandatory 
                            ? 'bg-gray-100 text-gray-600 border border-gray-200' 
                            : 'bg-blue-50 text-[#0b6cf0] border border-blue-200'
                          }
                        `}
                      >
                        {stage.name}
                      </div>
                      {index < phaseStages.length - 1 && (
                        <svg className="w-3 h-3 text-gray-300 mx-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PipelineStageConfigurator;
