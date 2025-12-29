/**
 * AdvancedFilters Component - Requirements 14.1, 14.2, 14.5, 14.6
 * 
 * Provides advanced filtering options for search:
 * - Candidate filters: stage, location, source, experience, skills, date range
 * - Job filters: status, department, location, priority, SLA status
 * - Filter combination with AND logic
 * - Active filter count display
 * - Clear all filters functionality
 */

import { useState, useEffect, useMemo } from 'react';
import { MultiSelect } from './MultiSelect';
import { useFilterOptions } from '../hooks/useSearch';
import type { MultiSelectOption } from './MultiSelect';
import type { SearchFilters } from '../services/search.service';

export interface AdvancedFiltersProps {
  /** Search type - determines which filters to show */
  type: 'candidates' | 'jobs';
  /** Current filter state */
  filters: SearchFilters;
  /** Callback when filters change */
  onFilterChange: (filters: Partial<SearchFilters>) => void;
  /** Callback to clear all filters */
  onClearFilters: () => void;
  /** Number of active filters */
  activeFilterCount: number;
}

// Legacy interface for backward compatibility
export interface AdvancedFiltersState {
  skills: string[];
  experienceMin: number | null;
  experienceMax: number | null;
  source: string | null;
}

// Common experience ranges
const experienceRanges = [
  { label: 'Any', min: undefined, max: undefined },
  { label: '0-2 years', min: 0, max: 2 },
  { label: '2-5 years', min: 2, max: 5 },
  { label: '5-10 years', min: 5, max: 10 },
  { label: '10+ years', min: 10, max: undefined },
];

// Job status options
const jobStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
];

// Job priority options
const jobPriorityOptions = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

// SLA status options
const slaStatusOptions = [
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'breached', label: 'Breached' },
];

// Date range presets
const dateRangePresets = [
  { label: 'Any time', value: null },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last year', days: 365 },
];

export function AdvancedFilters({
  type,
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: '',
  });

  // Fetch filter options from API
  const { data: filterOptions, isLoading } = useFilterOptions(type);

  // Convert filter options to MultiSelect format
  const locationOptions: MultiSelectOption[] = useMemo(() => 
    filterOptions?.locations?.map(loc => ({ value: loc.value, label: `${loc.label} (${loc.count})` })) || [],
    [filterOptions?.locations]
  );

  const sourceOptions: MultiSelectOption[] = useMemo(() => 
    filterOptions?.sources?.map(src => ({ value: src.value, label: `${src.label} (${src.count})` })) || [],
    [filterOptions?.sources]
  );

  const skillOptions: MultiSelectOption[] = useMemo(() => 
    filterOptions?.skills?.map(skill => ({ value: skill.value, label: `${skill.label} (${skill.count})` })) || [],
    [filterOptions?.skills]
  );

  const departmentOptions: MultiSelectOption[] = useMemo(() => 
    filterOptions?.departments?.map(dept => ({ value: dept.value, label: `${dept.label} (${dept.count})` })) || [],
    [filterOptions?.departments]
  );

  const stageOptions: MultiSelectOption[] = useMemo(() => 
    filterOptions?.stages?.map(stage => ({ value: stage.value, label: `${stage.label} (${stage.count})` })) || [],
    [filterOptions?.stages]
  );

  // Handle multi-select changes
  const handleMultiSelectChange = (field: keyof SearchFilters) => (values: string[]) => {
    onFilterChange({ [field]: values.length > 0 ? values : undefined });
  };

  // Handle experience range change
  const handleExperienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'any') {
      onFilterChange({ experienceMin: undefined, experienceMax: undefined });
    } else {
      const [min, max] = value.split('-').map(v => v === 'undefined' ? undefined : parseInt(v, 10));
      onFilterChange({ experienceMin: min, experienceMax: max });
    }
  };

  // Handle date range preset change
  const handleDateRangePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'custom') {
      // Keep current custom range
      return;
    } else if (value === 'any') {
      onFilterChange({ dateRange: undefined });
      setCustomDateRange({ start: '', end: '' });
    } else {
      const days = parseInt(value, 10);
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      onFilterChange({ dateRange: { start, end } });
      setCustomDateRange({ start: '', end: '' });
    }
  };

  // Handle custom date range change
  const handleCustomDateChange = (field: 'start' | 'end') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newCustomRange = { ...customDateRange, [field]: value };
    setCustomDateRange(newCustomRange);

    if (newCustomRange.start && newCustomRange.end) {
      const start = new Date(newCustomRange.start);
      const end = new Date(newCustomRange.end);
      if (start <= end) {
        onFilterChange({ dateRange: { start, end } });
      }
    }
  };

  // Get current experience range value for select
  const getExperienceValue = () => {
    if (filters.experienceMin === undefined && filters.experienceMax === undefined) return 'any';
    return `${filters.experienceMin ?? 'undefined'}-${filters.experienceMax ?? 'undefined'}`;
  };

  // Get current date range preset value
  const getDateRangePresetValue = () => {
    if (!filters.dateRange) return 'any';
    
    const { start, end } = filters.dateRange;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const preset = dateRangePresets.find(p => p.days === diffDays);
    return preset ? diffDays.toString() : 'custom';
  };

  // Update custom date range when filters change externally
  useEffect(() => {
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      setCustomDateRange({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      });
    }
  }, [filters.dateRange]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Filter Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-900">Advanced Filters</h3>
            {activeFilterCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading filter options...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Candidate-specific filters */}
              {type === 'candidates' && (
                <>
                  {/* Pipeline Stage Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pipeline Stage
                    </label>
                    <MultiSelect
                      options={stageOptions}
                      value={filters.stage || []}
                      onChange={handleMultiSelectChange('stage')}
                      placeholder="Select stages..."
                    />
                  </div>

                  {/* Source Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source
                    </label>
                    <MultiSelect
                      options={sourceOptions}
                      value={filters.source || []}
                      onChange={handleMultiSelectChange('source')}
                      placeholder="Select sources..."
                    />
                  </div>

                  {/* Skills Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills
                    </label>
                    <MultiSelect
                      options={skillOptions}
                      value={filters.skills || []}
                      onChange={handleMultiSelectChange('skills')}
                      placeholder="Select skills..."
                    />
                  </div>

                  {/* Experience Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience
                    </label>
                    <select
                      value={getExperienceValue()}
                      onChange={handleExperienceChange}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {experienceRanges.map((range) => (
                        <option 
                          key={range.label} 
                          value={range.min === undefined && range.max === undefined ? 'any' : `${range.min ?? 'undefined'}-${range.max ?? 'undefined'}`}
                        >
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Job-specific filters */}
              {type === 'jobs' && (
                <>
                  {/* Job Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <MultiSelect
                      options={jobStatusOptions}
                      value={filters.status || []}
                      onChange={handleMultiSelectChange('status')}
                      placeholder="Select status..."
                    />
                  </div>

                  {/* Department Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <MultiSelect
                      options={departmentOptions}
                      value={filters.department || []}
                      onChange={handleMultiSelectChange('department')}
                      placeholder="Select departments..."
                    />
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <MultiSelect
                      options={jobPriorityOptions}
                      value={filters.priority || []}
                      onChange={handleMultiSelectChange('priority')}
                      placeholder="Select priority..."
                    />
                  </div>

                  {/* SLA Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SLA Status
                    </label>
                    <MultiSelect
                      options={slaStatusOptions}
                      value={filters.slaStatus || []}
                      onChange={handleMultiSelectChange('slaStatus')}
                      placeholder="Select SLA status..."
                    />
                  </div>
                </>
              )}

              {/* Common filters for both types */}
              
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <MultiSelect
                  options={locationOptions}
                  value={filters.location || []}
                  onChange={handleMultiSelectChange('location')}
                  placeholder="Select locations..."
                />
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={getDateRangePresetValue()}
                  onChange={handleDateRangePresetChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white mb-2"
                >
                  {dateRangePresets.map((preset) => (
                    <option 
                      key={preset.label} 
                      value={preset.value === null ? 'any' : preset.days?.toString() || 'custom'}
                    >
                      {preset.label}
                    </option>
                  ))}
                  <option value="custom">Custom Range</option>
                </select>

                {/* Custom Date Range Inputs */}
                {getDateRangePresetValue() === 'custom' && (
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={handleCustomDateChange('start')}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Start date"
                    />
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={handleCustomDateChange('end')}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="End date"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Legacy component for backward compatibility
export function LegacyAdvancedFilters({
  filters,
  onFiltersChange,
  availableSkills,
  availableSources,
  isExpanded = false,
  onToggleExpand,
}: {
  filters: AdvancedFiltersState;
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  availableSkills: string[];
  availableSources: string[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
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
                  value={range.min === undefined && range.max === undefined ? 'any' : `${range.min ?? 'null'}-${range.max ?? 'null'}`}
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
