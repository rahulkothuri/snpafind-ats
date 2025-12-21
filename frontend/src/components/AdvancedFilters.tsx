/**
 * AdvancedFilters Component - Requirements 4.3
 * 
 * Provides advanced filtering options for the pipeline view:
 * - Skills filter dropdown (multi-select)
 * - Experience range filter (min/max)
 * - Source filter dropdown
 */

import { useMemo } from 'react';
import { MultiSelect } from './MultiSelect';
import type { MultiSelectOption } from './MultiSelect';

export interface AdvancedFiltersState {
  skills: string[];
  experienceMin: number | null;
  experienceMax: number | null;
  source: string | null;
}

export interface AdvancedFiltersProps {
  /** Current filter state */
  filters: AdvancedFiltersState;
  /** Callback when filters change */
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  /** Available skills for the dropdown */
  availableSkills: string[];
  /** Available sources for the dropdown */
  availableSources: string[];
  /** Whether the filters panel is expanded */
  isExpanded?: boolean;
  /** Callback to toggle expansion */
  onToggleExpand?: () => void;
}

// Common experience ranges
const experienceRanges = [
  { label: 'Any', min: null, max: null },
  { label: '0-2 years', min: 0, max: 2 },
  { label: '2-5 years', min: 2, max: 5 },
  { label: '5-10 years', min: 5, max: 10 },
  { label: '10+ years', min: 10, max: null },
];

export function AdvancedFilters({
  filters,
  onFiltersChange,
  availableSkills,
  availableSources,
  isExpanded = false,
  onToggleExpand,
}: AdvancedFiltersProps) {
  // Convert skills to MultiSelect options
  const skillOptions: MultiSelectOption[] = useMemo(() => 
    availableSkills.map(skill => ({ value: skill, label: skill })),
    [availableSkills]
  );

  // Handle skills change
  const handleSkillsChange = (selectedSkills: string[]) => {
    onFiltersChange({ ...filters, skills: selectedSkills });
  };

  // Handle experience range change
  const handleExperienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'any') {
      onFiltersChange({ ...filters, experienceMin: null, experienceMax: null });
    } else {
      const [min, max] = value.split('-').map(v => v === 'null' ? null : parseInt(v, 10));
      onFiltersChange({ ...filters, experienceMin: min, experienceMax: max });
    }
  };

  // Handle source change
  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({ ...filters, source: value === 'all' ? null : value });
  };

  // Get current experience range value for select
  const getExperienceValue = () => {
    if (filters.experienceMin === null && filters.experienceMax === null) return 'any';
    return `${filters.experienceMin ?? 'null'}-${filters.experienceMax ?? 'null'}`;
  };

  // Check if any filters are active
  const hasActiveFilters = filters.skills.length > 0 || 
    filters.experienceMin !== null || 
    filters.experienceMax !== null || 
    filters.source !== null;

  // Clear all filters
  const handleClearFilters = () => {
    onFiltersChange({
      skills: [],
      experienceMin: null,
      experienceMax: null,
      source: null,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
      {/* Filter Header */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#f8fafc] transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg 
            className="w-4 h-4 text-[#64748b]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
            />
          </svg>
          <span className="text-sm font-medium text-[#374151]">Advanced Filters</span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 bg-[#0b6cf0] text-white text-[10px] font-medium rounded-full">
              Active
            </span>
          )}
        </div>
        <svg 
          className={`w-4 h-4 text-[#64748b] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[#e2e8f0] space-y-4">
          {/* Skills Filter - Requirements 4.3 */}
          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-1.5">
              Skills
            </label>
            <MultiSelect
              options={skillOptions}
              value={filters.skills}
              onChange={handleSkillsChange}
              placeholder="Select skills..."
            />
          </div>

          {/* Experience Range Filter - Requirements 4.3 */}
          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-1.5">
              Experience
            </label>
            <select
              value={getExperienceValue()}
              onChange={handleExperienceChange}
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0]/20 focus:border-[#0b6cf0] bg-white"
            >
              {experienceRanges.map((range) => (
                <option 
                  key={range.label} 
                  value={range.min === null && range.max === null ? 'any' : `${range.min ?? 'null'}-${range.max ?? 'null'}`}
                >
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter - Requirements 4.3 */}
          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-1.5">
              Source
            </label>
            <select
              value={filters.source || 'all'}
              onChange={handleSourceChange}
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0]/20 focus:border-[#0b6cf0] bg-white"
            >
              <option value="all">All Sources</option>
              {availableSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="w-full px-3 py-2 text-xs font-medium text-[#dc2626] bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default AdvancedFilters;
