import { useState, useRef, useEffect } from 'react';
import { MdFilterList, MdDateRange, MdBusiness, MdLocationOn, MdWork, MdPerson, MdClose, MdCheck, MdViewModule } from 'react-icons/md';

interface FilterOption {
    value: string;
    label: string;
}

interface DateRange {
    start: Date | null;
    end: Date | null;
}

// Group by options for analytics view (Requirements 9.4)
export type GroupByOption = 'role' | 'recruiter' | 'panel' | 'department';

interface AnalyticsFilters {
    dateRange: DateRange;
    departmentId?: string;
    locationId?: string;
    jobId?: string;
    recruiterId?: string;
    groupBy?: GroupByOption;
}

interface AnalyticsFilterBarProps {
    filters: AnalyticsFilters;
    onFilterChange: (filters: AnalyticsFilters) => void;
    availableFilters: {
        departments: FilterOption[];
        locations: FilterOption[];
        jobs: FilterOption[];
        recruiters?: FilterOption[];
    };
    className?: string;
    isLoading?: boolean;
}

const predefinedDateRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last 6 months', days: 180 },
    { label: 'This year', days: 365 },
];

// Group by options (Requirements 9.4)
const groupByOptions: FilterOption[] = [
    { value: 'role', label: 'Role-wise' },
    { value: 'recruiter', label: 'Recruiter-wise' },
    { value: 'panel', label: 'Panel-wise' },
    { value: 'department', label: 'Department-wise' },
];

export function AnalyticsFilterBar({
    filters,
    onFilterChange,
    availableFilters,
    className = '',
    isLoading = false,
}: AnalyticsFilterBarProps) {
    const [activePopover, setActivePopover] = useState<string | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close popover when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setActivePopover(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate active filter count
    const activeFilterCount = [
        filters.departmentId,
        filters.locationId,
        filters.jobId,
        filters.recruiterId,
        filters.groupBy,
    ].filter(Boolean).length;

    const handlePredefinedDateRange = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);

        onFilterChange({
            ...filters,
            dateRange: { start, end },
        });
        setActivePopover(null);
    };

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

    const handleFilterChange = (field: keyof AnalyticsFilters, value: string) => {
        onFilterChange({
            ...filters,
            [field]: value || undefined,
        });
        setActivePopover(null);
    };

    const clearAllFilters = () => {
        onFilterChange({
            dateRange: { start: null, end: null },
            departmentId: undefined,
            locationId: undefined,
            jobId: undefined,
            recruiterId: undefined,
            groupBy: undefined,
        });
        setActivePopover(null);
    };

    const handleGroupByChange = (value: string) => {
        onFilterChange({
            ...filters,
            groupBy: value as GroupByOption || undefined,
        });
        setActivePopover(null);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const dateLabel = filters.dateRange.start && filters.dateRange.end
        ? `${formatDate(filters.dateRange.start)} - ${formatDate(filters.dateRange.end)}`
        : 'Select Date Range';

    return (
        <div className={`bg-white border-b border-gray-200 sticky top-0 z-20 ${className}`} ref={wrapperRef}>
            <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">

                {/* Left: Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-gray-500 mr-2">
                        <MdFilterList size={20} />
                        <span className="text-sm font-medium">Filters:</span>
                    </div>

                    {/* Date Range Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setActivePopover(activePopover === 'date' ? null : 'date')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${filters.dateRange.start ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <MdDateRange size={14} />
                            {dateLabel}
                        </button>

                        {activePopover === 'date' && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-30 animate-in fade-in zoom-in-95 duration-100">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Select</h4>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {predefinedDateRanges.map((range) => (
                                        <button
                                            key={range.days}
                                            onClick={() => handlePredefinedDateRange(range.days)}
                                            className="text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-200 transition-colors"
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="border-t border-gray-100 pt-3">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Range</h4>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            onChange={(e) => handleCustomDateRange('start', e.target.value)}
                                            value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                                        />
                                        <span className="text-gray-400 self-center">-</span>
                                        <input
                                            type="date"
                                            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            onChange={(e) => handleCustomDateRange('end', e.target.value)}
                                            value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Department Filter */}
                    <FilterDropdown
                        icon={<MdBusiness size={14} />}
                        label="Department"
                        value={filters.departmentId}
                        options={availableFilters.departments}
                        isOpen={activePopover === 'department'}
                        onToggle={() => setActivePopover(activePopover === 'department' ? null : 'department')}
                        onSelect={(val) => handleFilterChange('departmentId', val)}
                    />

                    {/* Location Filter */}
                    <FilterDropdown
                        icon={<MdLocationOn size={14} />}
                        label="Location"
                        value={filters.locationId}
                        options={availableFilters.locations}
                        isOpen={activePopover === 'location'}
                        onToggle={() => setActivePopover(activePopover === 'location' ? null : 'location')}
                        onSelect={(val) => handleFilterChange('locationId', val)}
                    />

                    {/* Job Filter */}
                    <FilterDropdown
                        icon={<MdWork size={14} />}
                        label="Job"
                        value={filters.jobId}
                        options={availableFilters.jobs}
                        isOpen={activePopover === 'job'}
                        onToggle={() => setActivePopover(activePopover === 'job' ? null : 'job')}
                        onSelect={(val) => handleFilterChange('jobId', val)}
                    />

                    {/* Recruiter Filter */}
                    {availableFilters.recruiters && (
                        <FilterDropdown
                            icon={<MdPerson size={14} />}
                            label="Recruiter"
                            value={filters.recruiterId}
                            options={availableFilters.recruiters}
                            isOpen={activePopover === 'recruiter'}
                            onToggle={() => setActivePopover(activePopover === 'recruiter' ? null : 'recruiter')}
                            onSelect={(val) => handleFilterChange('recruiterId', val)}
                        />
                    )}

                    {/* Group By Selector - Requirements 9.4 */}
                    <FilterDropdown
                        icon={<MdViewModule size={14} />}
                        label="Group by"
                        value={filters.groupBy}
                        options={groupByOptions}
                        isOpen={activePopover === 'groupBy'}
                        onToggle={() => setActivePopover(activePopover === 'groupBy' ? null : 'groupBy')}
                        onSelect={handleGroupByChange}
                    />

                    {activeFilterCount > 0 && (
                        <button
                            onClick={clearAllFilters}
                            className="text-xs text-red-600 hover:text-red-700 ml-2 px-2 py-1 flex items-center gap-1"
                        >
                            <MdClose size={14} /> Clear All
                        </button>
                    )}
                </div>

                {/* Right: Loading/Live Indicator - Requirements 10.4 */}
                <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    {isLoading ? (
                        <>
                            <svg className="w-3 h-3 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-blue-500">Loading data...</span>
                        </>
                    ) : (
                        <>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Live Updates
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper Component for Dropdowns
function FilterDropdown({
    icon,
    label,
    value,
    options,
    isOpen,
    onToggle,
    onSelect
}: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    options: FilterOption[];
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (val: string) => void;
}) {
    const selectedLabel = options.find(o => o.value === value)?.label;

    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors max-w-[150px] truncate ${value ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
            >
                <span className="shrink-0">{icon}</span>
                <span className="truncate">{value ? selectedLabel : label}</span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                    <button
                        onClick={() => onSelect('')}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center justify-between ${!value ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-gray-700'}`}
                    >
                        All {label}s
                        {!value && <MdCheck size={14} />}
                    </button>

                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onSelect(opt.value)}
                            className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center justify-between ${value === opt.value ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-gray-700'}`}
                        >
                            <span className="truncate">{opt.label}</span>
                            {value === opt.value && <MdCheck size={14} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
