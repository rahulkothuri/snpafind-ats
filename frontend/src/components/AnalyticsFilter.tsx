/**
 * AnalyticsFilter Component - Requirements 15.1, 15.2, 14.5, 14.6
 * 
 * Features:
 * - Support date range selection (predefined and custom)
 * - Support department, location, job filters
 * - Display active filter count
 * - Provide clear all filters action
 */

import { useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface AnalyticsFilters {
  dateRange: DateRange;
  departmentId?: string;
  locationId?: string;
  jobId?: string;
  recruiterId?: string;
}

interface AnalyticsFilterProps {
  filters: AnalyticsFilters;
  onFilterChange: (filters: AnalyticsFilters) => void;
  availableFilters: {
    departments: FilterOption[];
    locations: FilterOption[];
    jobs: FilterOption[];
    recruiters?: FilterOption[];
  };
  className?: string;
}

const predefinedDateRanges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'This year', days: 365 },
];

export function AnalyticsFilter({
  filters,
  onFilterChange,
  availableFilters,
  className = '',
}: AnalyticsFilterProps) {
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);

  // Calculate active filter count
  const activeFilterCount = [
    filters.dateRange.start && filters.dateRange.end,
    filters.departmentId,
    filters.locationId,
    filters.jobId,
    filters.recruiterId,
  ].filter(Boolean).length;

  // Handle predefined date range selection
  const handlePredefinedDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    onFilterChange({
      ...filters,
      dateRange: { start, end },
    });
    setShowCustomDateRange(false);
  };

  // Handle custom date range
  const handleCustomDateRange = (field: 'start' | 'end', value: string) => {
    const date = value ? new Date(value) : null;
    onFilterChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: date,
      },
    });
  };

  // Handle filter change
  const handleFilterChange = (field: keyof AnalyticsFilters, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFilterChange({
      dateRange: { start: null, end: null },
      departmentId: undefined,
      locationId: undefined,
      jobId: undefined,
      recruiterId: undefined,
    });
    setShowCustomDateRange(false);
  };

  // Format date for input
  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className={`bg-white rounded-xl border border-[#e2e8f0] p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#111827]">Filters</h3>
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <span className="text-xs px-2 py-1 bg-[#3b82f6] text-white rounded-full">
              {activeFilterCount} active
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-sm text-[#64748b] hover:text-[#374151] transition-colors"
            disabled={activeFilterCount === 0}
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-3">
            Date Range
          </label>
          
          {/* Predefined Ranges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {predefinedDateRanges.map((range) => (
              <button
                key={range.days}
                onClick={() => handlePredefinedDateRange(range.days)}
                className="px-3 py-2 text-xs border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors text-left"
              >
                {range.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustomDateRange(!showCustomDateRange)}
              className={`px-3 py-2 text-xs border rounded-lg transition-colors text-left ${
                showCustomDateRange
                  ? 'border-[#3b82f6] bg-[#eff6ff] text-[#3b82f6]'
                  : 'border-[#e2e8f0] hover:bg-[#f8fafc]'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Custom Date Range Inputs */}
          {showCustomDateRange && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#64748b] mb-1">Start Date</label>
                <input
                  type="date"
                  value={formatDateForInput(filters.dateRange.start)}
                  onChange={(e) => handleCustomDateRange('start', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-[#64748b] mb-1">End Date</label>
                <input
                  type="date"
                  value={formatDateForInput(filters.dateRange.end)}
                  onChange={(e) => handleCustomDateRange('end', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Current Date Range Display */}
          {filters.dateRange.start && filters.dateRange.end && (
            <div className="mt-2 text-xs text-[#64748b]">
              Selected: {filters.dateRange.start.toLocaleDateString()} - {filters.dateRange.end.toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Department Filter */}
        {availableFilters.departments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Department
            </label>
            <select
              value={filters.departmentId || ''}
              onChange={(e) => handleFilterChange('departmentId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            >
              <option value="">All Departments</option>
              {availableFilters.departments.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Location Filter */}
        {availableFilters.locations.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Location
            </label>
            <select
              value={filters.locationId || ''}
              onChange={(e) => handleFilterChange('locationId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            >
              <option value="">All Locations</option>
              {availableFilters.locations.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Job Filter */}
        {availableFilters.jobs.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Job
            </label>
            <select
              value={filters.jobId || ''}
              onChange={(e) => handleFilterChange('jobId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            >
              <option value="">All Jobs</option>
              {availableFilters.jobs.map((job) => (
                <option key={job.value} value={job.value}>
                  {job.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Recruiter Filter (if available) */}
        {availableFilters.recruiters && availableFilters.recruiters.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Recruiter
            </label>
            <select
              value={filters.recruiterId || ''}
              onChange={(e) => handleFilterChange('recruiterId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            >
              <option value="">All Recruiters</option>
              {availableFilters.recruiters.map((recruiter) => (
                <option key={recruiter.value} value={recruiter.value}>
                  {recruiter.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsFilter;