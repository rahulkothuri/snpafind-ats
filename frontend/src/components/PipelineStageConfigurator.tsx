/**
 * PipelineStageConfigurator Component
 * 
 * Clean, modern UI for configuring pipeline stages during job creation.
 * Features drag-and-drop reordering for sub-stages.
 */

import { useState, useCallback } from 'react';
import type { SubStageConfig } from '../types';

// Pipeline phases for organizing stages
export type PipelinePhase = 'queue' | 'applied' | 'screening' | 'shortlist' | 'interview' | 'selected' | 'offer' | 'hired';

export interface PipelinePhaseConfig {
  name: string;
  type: PipelinePhase;
  allowMultiple: boolean;
  isMandatory: boolean;
  defaultStages: string[];
}

export const PIPELINE_PHASES: PipelinePhaseConfig[] = [
  { name: 'Queue', type: 'queue', allowMultiple: false, isMandatory: false, defaultStages: ['Queue'] },
  { name: 'Applied', type: 'applied', allowMultiple: false, isMandatory: false, defaultStages: ['Applied'] },
  { name: 'Screening', type: 'screening', allowMultiple: false, isMandatory: true, defaultStages: ['Screening'] },
  { name: 'Shortlisted', type: 'shortlist', allowMultiple: false, isMandatory: true, defaultStages: ['Shortlisted'] },
  { name: 'Interview', type: 'interview', allowMultiple: false, isMandatory: false, defaultStages: ['Interview'] },
  { name: 'Selected', type: 'selected', allowMultiple: false, isMandatory: false, defaultStages: ['Selected'] },
  { name: 'Offered', type: 'offer', allowMultiple: false, isMandatory: true, defaultStages: ['Offered'] },
  { name: 'Hired', type: 'hired', allowMultiple: false, isMandatory: false, defaultStages: ['Hired'] }
];

export interface EnhancedPipelineStageConfig {
  id?: string;
  name: string;
  position: number;
  isMandatory: boolean;
  subStages?: SubStageConfig[];
  type: PipelinePhase;
  isCustom: boolean;
  parentStageId?: string;
  requirements?: string[];
  estimatedDuration?: number;
}

export const DEFAULT_PIPELINE_STAGES: EnhancedPipelineStageConfig[] = [
  { name: 'Queue', position: 0, isMandatory: false, subStages: [], type: 'queue', isCustom: false },
  { name: 'Applied', position: 1, isMandatory: false, subStages: [], type: 'applied', isCustom: false },
  { name: 'Screening', position: 2, isMandatory: true, subStages: [{ name: 'HR Screening', position: 0 }], type: 'screening', isCustom: false },
  { name: 'Shortlisted', position: 3, isMandatory: true, subStages: [{ name: 'CV Shortlist', position: 0 }, { name: 'Panel Shortlist', position: 1 }], type: 'shortlist', isCustom: false },
  { name: 'Interview', position: 4, isMandatory: false, subStages: [{ name: 'Round 1', position: 0 }, { name: 'Round 2', position: 1 }], type: 'interview', isCustom: false },
  { name: 'Selected', position: 5, isMandatory: false, subStages: [], type: 'selected', isCustom: false },
  { name: 'Offered', position: 6, isMandatory: true, subStages: [{ name: 'Offer Sent', position: 0 }, { name: 'Offer Accepted', position: 1 }], type: 'offer', isCustom: false },
  { name: 'Hired', position: 7, isMandatory: false, subStages: [], type: 'hired', isCustom: false },
];

interface PipelineStageConfiguratorProps {
  stages: EnhancedPipelineStageConfig[];
  onChange: (stages: EnhancedPipelineStageConfig[]) => void;
  onAddSubStage?: (parentStageId: string, subStageName: string) => Promise<void>;
  onDeleteSubStage?: (subStageId: string) => Promise<void>;
}

export function PipelineStageConfigurator({ 
  stages, 
  onChange,
  onAddSubStage,
  onDeleteSubStage 
}: PipelineStageConfiguratorProps) {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [newSubStageNames, setNewSubStageNames] = useState<Record<string, string>>({});
  const [subStageLoading, setSubStageLoading] = useState<string | null>(null);
  
  // Sub-stage drag state
  const [draggedSubStage, setDraggedSubStage] = useState<{ stageName: string; index: number } | null>(null);
  const [dragOverSubStage, setDragOverSubStage] = useState<{ stageName: string; index: number } | null>(null);

  const isSubStageNameUnique = useCallback((parentStageName: string, subStageName: string): boolean => {
    const parentStage = stages.find(s => s.name === parentStageName);
    if (!parentStage || !parentStage.subStages) return true;
    return !parentStage.subStages.some(sub => sub.name.toLowerCase() === subStageName.toLowerCase());
  }, [stages]);

  const toggleStageExpansion = useCallback((stageName: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageName)) {
      newExpanded.delete(stageName);
    } else {
      newExpanded.add(stageName);
    }
    setExpandedStages(newExpanded);
  }, [expandedStages]);

  const handleAddSubStage = useCallback(async (parentStageName: string) => {
    const subStageName = newSubStageNames[parentStageName]?.trim();
    if (!subStageName || !isSubStageNameUnique(parentStageName, subStageName)) return;

    const parentStage = stages.find(s => s.name === parentStageName);
    if (!parentStage) return;

    if (onAddSubStage && parentStage.id) {
      setSubStageLoading(parentStageName);
      try {
        await onAddSubStage(parentStage.id, subStageName);
      } catch (error) {
        console.error('Failed to add sub-stage:', error);
      } finally {
        setSubStageLoading(null);
      }
    } else {
      const maxPosition = parentStage.subStages?.length ? Math.max(...parentStage.subStages.map(s => s.position)) + 1 : 0;
      const updatedStages = stages.map(stage => {
        if (stage.name === parentStageName) {
          return { ...stage, subStages: [...(stage.subStages || []), { name: subStageName, position: maxPosition }] };
        }
        return stage;
      });
      onChange(updatedStages);
    }
    setNewSubStageNames(prev => ({ ...prev, [parentStageName]: '' }));
  }, [newSubStageNames, stages, isSubStageNameUnique, onAddSubStage, onChange]);

  const handleDeleteSubStage = useCallback(async (parentStageName: string, subStageIndex: number) => {
    const parentStage = stages.find(s => s.name === parentStageName);
    if (!parentStage || !parentStage.subStages) return;

    const subStage = parentStage.subStages[subStageIndex];
    if (!subStage) return;

    if (onDeleteSubStage && subStage.id) {
      setSubStageLoading(`${parentStageName}-${subStageIndex}`);
      try {
        await onDeleteSubStage(subStage.id);
      } catch (error) {
        console.error('Failed to delete sub-stage:', error);
      } finally {
        setSubStageLoading(null);
      }
    } else {
      const updatedStages = stages.map(stage => {
        if (stage.name === parentStageName) {
          const newSubStages = stage.subStages?.filter((_, idx) => idx !== subStageIndex) || [];
          return { ...stage, subStages: newSubStages.map((sub, idx) => ({ ...sub, position: idx })) };
        }
        return stage;
      });
      onChange(updatedStages);
    }
  }, [stages, onDeleteSubStage, onChange]);

  // Sub-stage drag handlers
  const handleSubStageDragStart = (stageName: string, index: number) => {
    setDraggedSubStage({ stageName, index });
  };

  const handleSubStageDragOver = (e: React.DragEvent, stageName: string, index: number) => {
    e.preventDefault();
    if (draggedSubStage && draggedSubStage.stageName === stageName) {
      setDragOverSubStage({ stageName, index });
    }
  };

  const handleSubStageDragEnd = () => {
    if (!draggedSubStage || !dragOverSubStage || draggedSubStage.stageName !== dragOverSubStage.stageName) {
      setDraggedSubStage(null);
      setDragOverSubStage(null);
      return;
    }

    const { stageName, index: fromIndex } = draggedSubStage;
    const { index: toIndex } = dragOverSubStage;

    if (fromIndex === toIndex) {
      setDraggedSubStage(null);
      setDragOverSubStage(null);
      return;
    }

    const updatedStages = stages.map(stage => {
      if (stage.name === stageName && stage.subStages) {
        const newSubStages = [...stage.subStages];
        const [moved] = newSubStages.splice(fromIndex, 1);
        newSubStages.splice(toIndex, 0, moved);
        return { ...stage, subStages: newSubStages.map((sub, idx) => ({ ...sub, position: idx })) };
      }
      return stage;
    });

    onChange(updatedStages);
    setDraggedSubStage(null);
    setDragOverSubStage(null);
  };

  const sortedStages = [...stages].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-4">
      {/* Stages List */}
      <div className="space-y-1">
        {sortedStages.map((stage) => {
          const isExpanded = expandedStages.has(stage.name);
          const hasSubStages = stage.subStages && stage.subStages.length > 0;
          
          return (
            <div key={stage.name} className="group">
              {/* Stage Row */}
              <div
                onClick={() => toggleStageExpansion(stage.name)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer
                  transition-all duration-150 ease-in-out
                  ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}
                  border border-gray-100
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Expand Arrow */}
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>

                  {/* Position Number */}
                  <span className="text-sm text-gray-400 font-medium w-6">{stage.position + 1}.</span>

                  {/* Stage Name */}
                  <span className="text-sm font-medium text-gray-800">{stage.name}</span>

                  {/* Required Badge */}
                  {stage.isMandatory && (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                      Required
                    </span>
                  )}

                  {/* Sub-stage Count */}
                  {hasSubStages && (
                    <span className="text-xs text-gray-400">
                      ({stage.subStages?.length} sub-stage{stage.subStages?.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-stages Panel */}
              {isExpanded && (
                <div className="ml-6 mt-1 mb-2 pl-4 border-l-2 border-gray-100">
                  {/* Existing Sub-stages */}
                  {stage.subStages && stage.subStages.length > 0 && (
                    <div className="space-y-1 py-2">
                      {stage.subStages.map((subStage, subIndex) => (
                        <div
                          key={subStage.id || `${stage.name}-${subIndex}`}
                          draggable
                          onDragStart={() => handleSubStageDragStart(stage.name, subIndex)}
                          onDragOver={(e) => handleSubStageDragOver(e, stage.name, subIndex)}
                          onDragEnd={handleSubStageDragEnd}
                          className={`
                            flex items-center justify-between px-3 py-2 rounded-md
                            bg-white hover:bg-gray-50 cursor-grab active:cursor-grabbing
                            transition-all duration-150
                            ${dragOverSubStage?.stageName === stage.name && dragOverSubStage?.index === subIndex 
                              ? 'ring-2 ring-blue-400 ring-opacity-50' 
                              : ''}
                            ${draggedSubStage?.stageName === stage.name && draggedSubStage?.index === subIndex 
                              ? 'opacity-50' 
                              : ''}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            {/* Drag Handle */}
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                            
                            {/* Dot Indicator */}
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                            
                            <span className="text-sm text-gray-600">{subStage.name}</span>
                          </div>

                          {/* Delete Sub-stage */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubStage(stage.name, subIndex);
                            }}
                            disabled={subStageLoading === `${stage.name}-${subIndex}`}
                            className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all disabled:opacity-50"
                            title="Delete sub-stage"
                          >
                            {subStageLoading === `${stage.name}-${subIndex}` ? (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Sub-stage Input */}
                  <div className="flex items-center gap-2 py-2">
                    <input
                      type="text"
                      value={newSubStageNames[stage.name] || ''}
                      onChange={(e) => setNewSubStageNames(prev => ({ ...prev, [stage.name]: e.target.value }))}
                      placeholder="Add sub-stage..."
                      className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 focus:border-blue-400
                                 placeholder:text-gray-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubStage(stage.name);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddSubStage(stage.name);
                      }}
                      disabled={!newSubStageNames[stage.name]?.trim() || !isSubStageNameUnique(stage.name, newSubStageNames[stage.name]?.trim() || '') || subStageLoading === stage.name}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-md 
                                 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed
                                 transition-colors flex items-center gap-1"
                    >
                      {subStageLoading === stage.name ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )}
                      Add
                    </button>
                  </div>

                  {/* Duplicate Name Error */}
                  {newSubStageNames[stage.name]?.trim() && !isSubStageNameUnique(stage.name, newSubStageNames[stage.name]?.trim() || '') && (
                    <p className="text-xs text-red-500 px-1">Sub-stage name already exists.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pipeline Preview */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-3">Pipeline Flow</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {sortedStages.map((stage, index) => (
            <div key={stage.name} className="flex items-center">
              <div className={`
                px-2.5 py-1 rounded text-xs font-medium
                ${stage.isMandatory 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {stage.name}
                {stage.subStages && stage.subStages.length > 0 && (
                  <span className="ml-1 text-[10px] opacity-60">({stage.subStages.length})</span>
                )}
              </div>
              {index < sortedStages.length - 1 && (
                <svg className="w-3 h-3 text-gray-300 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
