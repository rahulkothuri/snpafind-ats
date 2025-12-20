/**
 * PipelineStageConfigurator Component - Requirements 4.1, 4.2, 4.3, 4.4
 * 
 * Allows users to configure pipeline stages during job creation.
 * 
 * Features:
 * - Display mandatory stages (Screening, Shortlisted, Offer) as locked
 * - Allow adding/removing optional stages
 * - Support adding sub-stages under Interview stage
 * - Drag-and-drop reordering for non-mandatory stages
 */

import { useState, useCallback } from 'react';
import type { PipelineStageConfig, SubStageConfig } from '../types';

// Mandatory stages that cannot be removed (Requirement 4.2)
const MANDATORY_STAGES = ['Screening', 'Shortlisted', 'Offer'];

// Default pipeline stages configuration
export const DEFAULT_PIPELINE_STAGES: PipelineStageConfig[] = [
  { name: 'Screening', position: 0, isMandatory: true, subStages: [] },
  { name: 'Shortlisted', position: 1, isMandatory: true, subStages: [] },
  { name: 'Interview', position: 2, isMandatory: false, subStages: [] },
  { name: 'Offer', position: 3, isMandatory: true, subStages: [] },
];

interface PipelineStageConfiguratorProps {
  stages: PipelineStageConfig[];
  onChange: (stages: PipelineStageConfig[]) => void;
}

export function PipelineStageConfigurator({ stages, onChange }: PipelineStageConfiguratorProps) {
  const [newStageName, setNewStageName] = useState('');
  const [newSubStageName, setNewSubStageName] = useState('');
  const [addingSubStageFor, setAddingSubStageFor] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Add a new optional stage
  const handleAddStage = useCallback(() => {
    if (!newStageName.trim()) return;
    
    // Check for duplicate names
    if (stages.some(s => s.name.toLowerCase() === newStageName.trim().toLowerCase())) {
      return;
    }

    // Insert before Offer stage (which should always be last)
    const offerIndex = stages.findIndex(s => s.name === 'Offer');
    const newStage: PipelineStageConfig = {
      name: newStageName.trim(),
      position: offerIndex >= 0 ? offerIndex : stages.length,
      isMandatory: false,
      subStages: [],
    };

    const newStages = [...stages];
    if (offerIndex >= 0) {
      newStages.splice(offerIndex, 0, newStage);
    } else {
      newStages.push(newStage);
    }

    // Recalculate positions
    const updatedStages = newStages.map((stage, idx) => ({
      ...stage,
      position: idx,
    }));

    onChange(updatedStages);
    setNewStageName('');
  }, [newStageName, stages, onChange]);

  // Remove an optional stage
  const handleRemoveStage = useCallback((stageName: string) => {
    if (MANDATORY_STAGES.includes(stageName)) return;
    
    const newStages = stages
      .filter(s => s.name !== stageName)
      .map((stage, idx) => ({ ...stage, position: idx }));
    
    onChange(newStages);
  }, [stages, onChange]);

  // Add a sub-stage under Interview stage (Requirement 4.3)
  const handleAddSubStage = useCallback((parentStageName: string) => {
    if (!newSubStageName.trim()) return;

    const newStages = stages.map(stage => {
      if (stage.name === parentStageName) {
        // Check for duplicate sub-stage names
        if (stage.subStages.some(s => s.name.toLowerCase() === newSubStageName.trim().toLowerCase())) {
          return stage;
        }

        const newSubStage: SubStageConfig = {
          name: newSubStageName.trim(),
          position: stage.subStages.length,
        };

        return {
          ...stage,
          subStages: [...stage.subStages, newSubStage],
        };
      }
      return stage;
    });

    onChange(newStages);
    setNewSubStageName('');
    setAddingSubStageFor(null);
  }, [newSubStageName, stages, onChange]);

  // Remove a sub-stage
  const handleRemoveSubStage = useCallback((parentStageName: string, subStageName: string) => {
    const newStages = stages.map(stage => {
      if (stage.name === parentStageName) {
        return {
          ...stage,
          subStages: stage.subStages
            .filter(s => s.name !== subStageName)
            .map((s, idx) => ({ ...s, position: idx })),
        };
      }
      return stage;
    });

    onChange(newStages);
  }, [stages, onChange]);

  // Drag and drop handlers for reordering (Requirement 4.4)
  const handleDragStart = useCallback((index: number, stage: PipelineStageConfig) => {
    // Don't allow dragging mandatory stages
    if (stage.isMandatory) return;
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number, stage: PipelineStageConfig) => {
    e.preventDefault();
    // Don't allow dropping on mandatory stages
    if (stage.isMandatory) return;
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const draggedStage = stages[draggedIndex];
    const targetStage = stages[dragOverIndex];

    // Don't allow reordering if either stage is mandatory
    if (draggedStage.isMandatory || targetStage.isMandatory) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Perform the reorder
    const newStages = [...stages];
    newStages.splice(draggedIndex, 1);
    newStages.splice(dragOverIndex, 0, draggedStage);

    // Recalculate positions
    const updatedStages = newStages.map((stage, idx) => ({
      ...stage,
      position: idx,
    }));

    onChange(updatedStages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, stages, onChange]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  return (
    <div className="form-section">
      <h3 className="form-section-header">Pipeline Stages Configuration</h3>
      <p className="form-section-subtitle">
        Configure the hiring pipeline stages for this job. Mandatory stages cannot be removed.
      </p>

      {/* Stages List */}
      <div className="space-y-2 mt-4">
        {stages.map((stage, index) => (
          <div
            key={stage.name}
            draggable={!stage.isMandatory}
            onDragStart={() => handleDragStart(index, stage)}
            onDragOver={(e) => handleDragOver(e, index, stage)}
            onDragEnd={handleDragEnd}
            onDragLeave={handleDragLeave}
            className={`
              border rounded-lg transition-all
              ${stage.isMandatory 
                ? 'bg-gray-50 border-gray-200' 
                : 'bg-white border-gray-200 hover:border-[#0b6cf0] cursor-move'
              }
              ${dragOverIndex === index && !stage.isMandatory ? 'border-[#0b6cf0] border-2 bg-blue-50' : ''}
              ${draggedIndex === index ? 'opacity-50' : ''}
            `}
          >
            {/* Stage Header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                {/* Drag Handle */}
                {!stage.isMandatory && (
                  <div className="text-gray-400 cursor-move">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                )}

                {/* Lock Icon for Mandatory Stages */}
                {stage.isMandatory && (
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Add Sub-stage Button (only for Interview stage) */}
                {stage.name === 'Interview' && (
                  <button
                    type="button"
                    onClick={() => setAddingSubStageFor(addingSubStageFor === stage.name ? null : stage.name)}
                    className="text-sm text-[#0b6cf0] hover:text-[#0952b8] flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Sub-stage
                  </button>
                )}

                {/* Remove Button (only for non-mandatory stages) */}
                {!stage.isMandatory && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStage(stage.name)}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="Remove stage"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Sub-stages (for Interview stage) */}
            {stage.name === 'Interview' && stage.subStages.length > 0 && (
              <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
                <div className="text-xs text-gray-500 mb-2">Sub-stages:</div>
                <div className="space-y-1">
                  {stage.subStages.map((subStage) => (
                    <div
                      key={subStage.name}
                      className="flex items-center justify-between py-1.5 px-2 bg-white rounded border border-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm text-gray-700">{subStage.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubStage(stage.name, subStage.name)}
                        className="text-gray-400 hover:text-red-500 p-0.5"
                        title="Remove sub-stage"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Sub-stage Input (for Interview stage) */}
            {addingSubStageFor === stage.name && (
              <div className="border-t border-gray-100 px-3 py-3 bg-blue-50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubStageName}
                    onChange={(e) => setNewSubStageName(e.target.value)}
                    placeholder="e.g., Technical Interview, HR Interview"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubStage(stage.name);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSubStage(stage.name)}
                    disabled={!newSubStageName.trim()}
                    className="px-3 py-1.5 text-sm bg-[#0b6cf0] text-white rounded hover:bg-[#0952b8] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingSubStageFor(null);
                      setNewSubStageName('');
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Stage */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
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
            disabled={!newStageName.trim()}
            className="px-4 py-2 text-sm bg-[#0b6cf0] text-white rounded-lg hover:bg-[#0952b8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Stage
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          New stages will be added before the Offer stage. Drag non-mandatory stages to reorder them.
        </p>
      </div>

      {/* Visual Pipeline Preview */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-3">Pipeline Preview</div>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {stages.map((stage, index) => (
            <div key={stage.name} className="flex items-center">
              <div
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                  ${stage.isMandatory 
                    ? 'bg-gray-100 text-gray-600 border border-gray-200' 
                    : 'bg-blue-50 text-[#0b6cf0] border border-blue-200'
                  }
                `}
              >
                {stage.name}
                {stage.subStages.length > 0 && (
                  <span className="ml-1 text-gray-400">({stage.subStages.length})</span>
                )}
              </div>
              {index < stages.length - 1 && (
                <svg className="w-4 h-4 text-gray-300 mx-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PipelineStageConfigurator;
