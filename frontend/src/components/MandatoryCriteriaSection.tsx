/**
 * MandatoryCriteriaSection Component - Requirements 3.1, 3.2, 3.3
 * 
 * Displays and allows editing of mandatory screening criteria for job postings.
 * Can be used in read-only mode for display or editable mode for job creation/editing.
 * 
 * Features:
 * - Editable title, intro, criteria list, and note
 * - Add/remove criteria items
 * - Visual hierarchy with header and numbered list
 * - Warning/important styling to emphasize mandatory nature
 */

import { useState } from 'react';
import type { MandatoryCriteria } from '../types';

// Default mandatory criteria content
export const DEFAULT_MANDATORY_CRITERIA: MandatoryCriteria = {
  title: "Mandatory Criteria (Can't be neglected during screening)",
  intro: "Preferred candidates from good startups only.",
  criteria: [
    "CA Candidates are not applicable for this role.",
    "Need candidate from Tier 1 and Tier 2 colleges only.",
    "2–3 years of hands-on experience in Financial Analysis / FP&A.",
    "Strong proficiency in Financial Modelling, forecasting, budgeting, and variance analysis.",
    "Experience preparing financial reports, presentations, and management dashboards with Advance Excel skills.",
    "Strong attention to detail with high accuracy in analysis and reporting.",
    "Strong problem-solving skills and ability to recommend practical solutions on different Scenarios.",
    "Candidate should be good in Cost Management.",
  ],
  note: "NOTE - Looking for highly Intentful and Enthusiatic candidates",
};

// Legacy export for backward compatibility
export const MANDATORY_CRITERIA_CONTENT = DEFAULT_MANDATORY_CRITERIA;

export interface MandatoryCriteriaSectionProps {
  /** The criteria data to display/edit */
  value?: MandatoryCriteria;
  /** Callback when criteria changes (if provided, enables edit mode) */
  onChange?: (criteria: MandatoryCriteria) => void;
  /** Force read-only mode even if onChange is provided */
  readOnly?: boolean;
}

export function MandatoryCriteriaSection({ 
  value = DEFAULT_MANDATORY_CRITERIA, 
  onChange,
  readOnly = false,
}: MandatoryCriteriaSectionProps) {
  const [newCriterion, setNewCriterion] = useState('');
  const isEditable = onChange && !readOnly;

  const handleTitleChange = (title: string) => {
    if (onChange) {
      onChange({ ...value, title });
    }
  };

  const handleIntroChange = (intro: string) => {
    if (onChange) {
      onChange({ ...value, intro });
    }
  };

  const handleNoteChange = (note: string) => {
    if (onChange) {
      onChange({ ...value, note });
    }
  };

  const handleCriterionChange = (index: number, text: string) => {
    if (onChange) {
      const newCriteria = [...value.criteria];
      newCriteria[index] = text;
      onChange({ ...value, criteria: newCriteria });
    }
  };

  const handleAddCriterion = () => {
    if (onChange && newCriterion.trim()) {
      onChange({ ...value, criteria: [...value.criteria, newCriterion.trim()] });
      setNewCriterion('');
    }
  };

  const handleRemoveCriterion = (index: number) => {
    if (onChange) {
      const newCriteria = value.criteria.filter((_, i) => i !== index);
      onChange({ ...value, criteria: newCriteria });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newCriterion.trim()) {
      e.preventDefault();
      handleAddCriterion();
    }
  };

  return (
    <div className="form-section bg-[#fffbeb] border border-[#fcd34d]">
      {/* Header with warning icon */}
      <div className="flex items-start gap-2 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f59e0b] flex items-center justify-center mt-1">
          <svg 
            className="w-5 h-5 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        {isEditable ? (
          <input
            type="text"
            value={value.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="flex-1 text-base font-semibold text-[#92400e] bg-white/50 border border-[#fcd34d] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
            placeholder="Section title..."
          />
        ) : (
          <h3 className="text-base font-semibold text-[#92400e]">
            {value.title}
          </h3>
        )}
      </div>

      {/* Mode indicator */}
      <div className="flex items-center gap-1.5 mb-4 text-xs text-[#b45309]">
        {isEditable ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
              />
            </svg>
            <span>Edit the mandatory criteria for this job posting</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
            <span>This section is read-only and will be included in all job postings</span>
          </>
        )}
      </div>

      {/* Intro text */}
      {isEditable ? (
        <input
          type="text"
          value={value.intro}
          onChange={(e) => handleIntroChange(e.target.value)}
          className="w-full text-sm text-[#78350f] font-medium bg-white/50 border border-[#fcd34d] rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
          placeholder="Introduction text..."
        />
      ) : (
        <p className="text-sm text-[#78350f] font-medium mb-3">
          {value.intro}
        </p>
      )}

      {/* Numbered criteria list */}
      <ol className="space-y-2 mb-4">
        {value.criteria.map((criterion, index) => (
          <li 
            key={index} 
            className="flex gap-3 text-sm text-[#78350f]"
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#fcd34d] text-[#78350f] text-xs font-semibold flex items-center justify-center">
              {index + 1}
            </span>
            {isEditable ? (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={criterion}
                  onChange={(e) => handleCriterionChange(index, e.target.value)}
                  className="flex-1 bg-white/50 border border-[#fcd34d] rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCriterion(index)}
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                  title="Remove criterion"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <span className="pt-0.5">{criterion}</span>
            )}
          </li>
        ))}
      </ol>

      {/* Add new criterion input */}
      {isEditable && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newCriterion}
            onChange={(e) => setNewCriterion(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white/50 border border-[#fcd34d] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
            placeholder="Add a new criterion..."
          />
          <button
            type="button"
            onClick={handleAddCriterion}
            disabled={!newCriterion.trim()}
            className="px-4 py-2 bg-[#f59e0b] text-white rounded-lg text-sm font-medium hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Note section */}
      <div className="mt-4 pt-3 border-t border-[#fcd34d]">
        {isEditable ? (
          <input
            type="text"
            value={value.note}
            onChange={(e) => handleNoteChange(e.target.value)}
            className="w-full text-sm font-semibold text-[#92400e] uppercase tracking-wide bg-white/50 border border-[#fcd34d] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
            placeholder="Note..."
          />
        ) : (
          <p className="text-sm font-semibold text-[#92400e] uppercase tracking-wide">
            {value.note}
          </p>
        )}
      </div>
    </div>
  );
}

export default MandatoryCriteriaSection;
