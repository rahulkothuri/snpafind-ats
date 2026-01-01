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

  // Ensure we always have a valid criteria object with an array
  const safeValue = {
    title: value?.title || DEFAULT_MANDATORY_CRITERIA.title,
    intro: value?.intro || DEFAULT_MANDATORY_CRITERIA.intro,
    criteria: Array.isArray(value?.criteria) ? value.criteria : DEFAULT_MANDATORY_CRITERIA.criteria,
    // Note removed from UI but preserved in data structure if needed for compatibility
    note: value?.note || DEFAULT_MANDATORY_CRITERIA.note,
  };

  const handleIntroChange = (intro: string) => {
    if (onChange) {
      onChange({ ...safeValue, intro });
    }
  };

  const handleCriterionChange = (index: number, text: string) => {
    if (onChange) {
      const newCriteria = [...safeValue.criteria];
      newCriteria[index] = text;
      onChange({ ...safeValue, criteria: newCriteria });
    }
  };

  const handleAddCriterion = () => {
    if (onChange && newCriterion.trim()) {
      onChange({ ...safeValue, criteria: [...safeValue.criteria, newCriterion.trim()] });
      setNewCriterion('');
    }
  };

  const handleRemoveCriterion = (index: number) => {
    if (onChange) {
      const newCriteria = safeValue.criteria.filter((_, i) => i !== index);
      onChange({ ...safeValue, criteria: newCriteria });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newCriterion.trim()) {
      e.preventDefault();
      handleAddCriterion();
    }
  };

  return (
    <div className="space-y-4">
      {/* Introduction */}
      <div>
        {isEditable ? (
          <input
            type="text"
            value={safeValue.intro}
            onChange={(e) => handleIntroChange(e.target.value)}
            className="w-full text-sm text-gray-600 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none transition-colors px-0 py-1"
            placeholder="Introduction text..."
          />
        ) : (
          <p className="text-sm text-gray-600">
            {safeValue.intro}
          </p>
        )}
      </div>

      {/* Criteria List */}
      <div className="space-y-3">
        {safeValue.criteria.map((criterion, index) => (
          <div
            key={index}
            className="group flex items-start gap-3 bg-gray-50 rounded-lg p-3 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all duration-200"
          >
            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />

            {isEditable ? (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={criterion}
                  onChange={(e) => handleCriterionChange(index, e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-700 focus:outline-none placeholder-gray-400"
                  placeholder="Enter requirement..."
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCriterion(index)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove requirement"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-700 leading-relaxed">{criterion}</span>
            )}
          </div>
        ))}

        {/* Add New Criterion Input */}
        {isEditable && (
          <div className="flex items-center gap-3 bg-white border border-dashed border-gray-300 rounded-lg p-3 hover:border-blue-400 transition-colors group focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20">
            <svg className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <input
              type="text"
              value={newCriterion}
              onChange={(e) => setNewCriterion(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm bg-transparent focus:outline-none placeholder-gray-400 text-gray-700"
              placeholder="Add a new screening requirement..."
            />
            {newCriterion && (
              <button
                type="button"
                onClick={handleAddCriterion}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
              >
                Add
              </button>
            )}
          </div>
        )}
      </div>

      {safeValue.criteria.length === 0 && !isEditable && (
        <p className="text-sm text-gray-400 italic">No specific screening criteria listed.</p>
      )}
    </div>
  );
}

export default MandatoryCriteriaSection;
