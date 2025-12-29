/**
 * AnalyticsPage Component - Requirements 17.1, 17.2, 17.5
 * 
 * Features:
 * - Organize into sections: Overview KPIs, Funnel Analytics, Time Analytics, Source Analytics, Team Performance
 * - Add section navigation
 * - Responsive layout for different screen sizes
 * - Consistent styling with the rest of the application
 */

import { useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { AnalyticsFilter } from '../components/AnalyticsFilter';
import { KPICard } from '../components/KPICard';
import { FunnelChart } from '../components/FunnelChart';
import { HorizontalBarChart } from '../components/HorizontalBarChart';
import { PieChart } from '../components/PieChart';
import { Table } from '../components/Table';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { 
  useKPIMetrics,
  useFunnelAnalyticsComplete,
  useTimeAnalytics,
  useSourcePerformance,
  useTeamPerformanceAnalytics,
  useSLAStatus,
  useAnalyticsExport,
  useDateRangePresets
} from '../hooks/useAnalytics';
import type { RecruiterData, PanelData } from '../services/analytics.service';
import { useAuth } from '../hooks/useAuth';

// Local interface for component state that includes dateRange
interface LocalAnalyticsFilters {
  dateRange: { start: Date | null; end: Date | null };
  departmentId?: string;
  locationId?: string;
  jobId?: string;
  recruiterId?: string;
}

// Section navigation items
const sections = [
  { id: 'overview', label: 'Overview KPIs', icon: '📊' },
  { id: 'funnel', label: 'Funnel Analytics', icon: '🔄' },
  { id: 'time', label: 'Time Analytics', icon: '⏱️' },
  { id: 'source', label: 'Source Analytics', icon: '📈' },
  { id: 'team', label: 'Team Performance', icon: '👥' },
];

// Mock filter options - in real app, these would come from API
const mockFilterOptions = {
  departments: [
    { value: 'engineering', label: 'Engineering' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'sales', label: 'Sales' },
    { value: 'hr', label: 'Human Resources' },
  ],
  locations: [
    { value: 'san-francisco', label: 'San Francisco' },
    { value: 'new-york', label: 'New York' },
    { value: 'london', label: 'London' },
    { value: 'remote', label: 'Remote' },
  ],
  jobs: [
    { value: 'senior-engineer', label: 'Senior Software Engineer' },
    { value: 'product-manager', label: 'Product Manager' },
    { value: 'designer', label: 'UX Designer' },
  ],
  recruiters: [
    { value: 'john-doe', label: 'John Doe' },
    { value: 'jane-smith', label: 'Jane Smith' },
    { value: 'mike-johnson', label: 'Mike Johnson' },
  ],
};

export function AnalyticsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [filters, setFilters] = useState<LocalAnalyticsFilters>({
    dateRange: { start: null, end: null },
  });
  const [isExporting, setIsExporting] = useState(false);

  // Convert filters for API calls
  const apiFilters = useMemo(() => ({
    startDate: filters.dateRange.start || undefined,
    endDate: filters.dateRange.end || undefined,
    departmentId: filters.departmentId,
    locationId: filters.locationId,
    jobId: filters.jobId,
    recruiterId: filters.recruiterId,
  }), [filters]);

  // Analytics hooks
  const kpis = useKPIMetrics(apiFilters);
  const funnelData = useFunnelAnalyticsComplete(apiFilters);
  const timeData = useTimeAnalytics(apiFilters);
  const sourceData = useSourcePerformance(apiFilters);
  const teamData = useTeamPerformanceAnalytics(apiFilters);
  const slaData = useSLAStatus(apiFilters);
  const { exportAnalytics } = useAnalyticsExport();

  // Set default date range on mount
  const dateRangePresets = useDateRangePresets();
  const defaultRange = dateRangePresets.find(preset => preset.value === 'last_90_days');
  
  // Initialize with default date range if no filters are set
  if (!filters.dateRange.start && !filters.dateRange.end && defaultRange) {
    setFilters({
      ...filters,
      dateRange: {
        start: defaultRange.startDate,
        end: defaultRange.endDate,
      },
    });
  }

  // Handle export
  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!filters.dateRange.start || !filters.dateRange.end) return;
    
    setIsExporting(true);
    try {
      const blob = await exportAnalytics({
        format,
        sections: [activeSection],
        filters: apiFilters,
        dateRange: {
          startDate: filters.dateRange.start,
          endDate: filters.dateRange.end,
        },
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${activeSection}-${format}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      // TODO: Show error toast
    } finally {
      setIsExporting(false);
    }
  };

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Layout pageTitle="Analytics Dashboard" user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Analytics Dashboard</h1>
            <p className="text-[#64748b] mt-1">
              Comprehensive insights into your recruitment pipeline and team performance
            </p>
          </div>
          
          {/* Export Buttons - Requirements 16.1, 16.2, 16.5, 16.6 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting || !filters.dateRange.start}
              className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? <LoadingSpinner size="sm" /> : 'Export PDF'}
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={isExporting || !filters.dateRange.start}
              className="px-4 py-2 text-sm font-medium text-white bg-[#3b82f6] border border-[#3b82f6] rounded-lg hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? <LoadingSpinner size="sm" /> : 'Export Excel'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Section Navigation and Filters */}
          <div className="lg:col-span-1 space-y-6">
            {/* Section Navigation - Requirements 17.2 */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Sections</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left
                      ${activeSection === section.id
                        ? 'bg-[#eff6ff] text-[#3b82f6] font-medium'
                        : 'text-[#64748b] hover:bg-[#f8fafc] hover:text-[#374151]'
                      }
                    `}
                  >
                    <span>{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Filters */}
            <AnalyticsFilter
              filters={{
                dateRange: filters.dateRange,
                departmentId: filters.departmentId,
                locationId: filters.locationId,
                jobId: filters.jobId,
                recruiterId: filters.recruiterId,
              }}
              onFilterChange={(newFilters) => setFilters({
                dateRange: newFilters.dateRange,
                departmentId: newFilters.departmentId,
                locationId: newFilters.locationId,
                jobId: newFilters.jobId,
                recruiterId: newFilters.recruiterId,
              })}
              availableFilters={mockFilterOptions}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Overview KPIs Section - Requirements 1.1, 19.1 */}
            <section id="overview" className="space-y-6">
              <h2 className="text-xl font-semibold text-[#111827]">Overview KPIs</h2>
              
              {kpis.isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" text="Loading KPI metrics..." />
                </div>
              ) : kpis.error ? (
                <div className="text-center py-8 text-red-600">
                  Error loading KPI data: {kpis.error.message}
                </div>
              ) : kpis.data ? (
                <>
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <KPICard
                      label="Active Roles"
                      value={kpis.data.activeRoles}
                      subtitle="Open positions"
                    />
                    <KPICard
                      label="Active Candidates"
                      value={kpis.data.activeCandidates}
                      subtitle="In pipeline"
                    />
                    <KPICard
                      label="Interviews Today"
                      value={kpis.data.interviewsToday}
                      subtitle="Scheduled"
                    />
                    <KPICard
                      label="Interviews This Week"
                      value={kpis.data.interviewsThisWeek}
                      subtitle="Scheduled"
                    />
                    <KPICard
                      label="Offers Pending"
                      value={kpis.data.offersPending}
                      subtitle="Awaiting response"
                    />
                    <KPICard
                      label="Total Hires"
                      value={kpis.data.totalHires}
                      subtitle="Current period"
                    />
                    <KPICard
                      label="Avg Time to Fill"
                      value={`${kpis.data.avgTimeToFill} days`}
                      subtitle="From open to accepted offer"
                    />
                    <KPICard
                      label="Offer Acceptance Rate"
                      value={`${kpis.data.offerAcceptanceRate}%`}
                      subtitle="Accepted offers"
                      trend={
                        kpis.data.offerAcceptanceRate >= 70
                          ? { text: 'Good', type: 'ok' }
                          : { text: 'Below target', type: 'warn' }
                      }
                    />
                  </div>

                  {/* SLA Status Summary */}
                  {slaData.data && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <KPICard
                        label="Roles On Track"
                        value={slaData.data.summary.onTrack}
                        subtitle="Meeting SLA"
                        trend={{ text: 'On track', type: 'ok' }}
                      />
                      <KPICard
                        label="Roles At Risk"
                        value={slaData.data.summary.atRisk}
                        subtitle="Within 3 days of breach"
                        trend={{ text: 'At risk', type: 'warn' }}
                      />
                      <KPICard
                        label="Roles Breached"
                        value={slaData.data.summary.breached}
                        subtitle="Past SLA threshold"
                        trend={{ text: 'Breached', type: 'bad' }}
                      />
                    </div>
                  )}
                </>
              ) : null}
            </section>

            {/* Funnel Analytics Section - Requirements 2.1, 9.1, 10.1, 10.2 */}
            <section id="funnel" className="space-y-6">
              <h2 className="text-xl font-semibold text-[#111827]">Funnel Analytics</h2>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Funnel Chart */}
                {funnelData.funnel.data && funnelData.funnel.data.stages && (
                  <FunnelChart
                    stages={funnelData.funnel.data.stages}
                    showPercentages={true}
                    className="xl:col-span-2"
                  />
                )}

                {/* Drop-off Analysis */}
                {funnelData.dropOff.data && funnelData.dropOff.data.byStage && (
                  <HorizontalBarChart
                    title="Drop-off Analysis"
                    valueLabel="Candidates who exited at each stage"
                    data={funnelData.dropOff.data.byStage.map(stage => ({
                      id: stage.stageName,
                      label: stage.stageName,
                      value: stage.dropOffCount,
                      displayValue: `${stage.dropOffCount} (${stage.dropOffPercentage.toFixed(1)}%)`,
                    }))}
                    showValues={true}
                  />
                )}

                {/* Rejection Reasons */}
                {funnelData.rejectionReasons.data && funnelData.rejectionReasons.data.reasons && (
                  <PieChart
                    title="Rejection Reasons"
                    data={funnelData.rejectionReasons.data.reasons.map(reason => ({
                      id: reason.reason,
                      label: reason.reason,
                      value: reason.count,
                      percentage: reason.percentage,
                      color: reason.color,
                    }))}
                    showLegend={true}
                    showPercentages={true}
                  />
                )}
              </div>
            </section>

            {/* Time Analytics Section - Requirements 6.1, 6.4, 7.1, 7.3, 7.4 */}
            <section id="time" className="space-y-6">
              <h2 className="text-xl font-semibold text-[#111827]">Time Analytics</h2>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Time-to-Fill Chart */}
                {timeData.timeToFill.data && timeData.timeToFill.data.byRole && (
                  <HorizontalBarChart
                    title="Time-to-Fill by Role"
                    valueLabel="Average days from job opening to hire"
                    threshold={timeData.timeToFill.data.overall.target}
                    thresholdLabel={`Target: ${timeData.timeToFill.data.overall.target} days`}
                    data={timeData.timeToFill.data.byRole.map(role => ({
                      id: role.roleId,
                      label: role.roleName,
                      value: role.average,
                      displayValue: `${role.average} days`,
                      isOverThreshold: role.isOverTarget,
                    }))}
                    showValues={true}
                  />
                )}

                {/* Time-in-Stage Chart */}
                {timeData.timeInStage.data && timeData.timeInStage.data.stages && (
                  <div className="space-y-4">
                    <HorizontalBarChart
                      title="Time-in-Stage Analysis"
                      valueLabel="Average days candidates spend in each stage"
                      data={timeData.timeInStage.data.stages.map(stage => ({
                        id: stage.stageName,
                        label: stage.stageName,
                        value: stage.avgDays,
                        displayValue: `${stage.avgDays} days`,
                        isOverThreshold: stage.isBottleneck,
                      }))}
                      showValues={true}
                    />
                    
                    {/* Actionable Suggestions */}
                    {timeData.timeInStage.data.suggestion && (
                      <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-[#3b82f6]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-[#1e40af]">Suggestion</h4>
                            <p className="text-sm text-[#1e40af] mt-1">{timeData.timeInStage.data.suggestion}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Source Analytics Section - Requirements 5.1, 5.4 */}
            <section id="source" className="space-y-6">
              <h2 className="text-xl font-semibold text-[#111827]">Source Analytics</h2>
              
              {sourceData.data && sourceData.data.length > 0 && (
                <HorizontalBarChart
                  title="Source Performance"
                  valueLabel="Ranked by hire rate (effectiveness)"
                  data={sourceData.data.map(source => ({
                    id: source.source,
                    label: source.source,
                    value: source.hireRate,
                    displayValue: `${source.hireRate.toFixed(1)}% (${source.hireCount}/${source.candidateCount})`,
                    subtitle: `${source.candidateCount} candidates, ${source.percentage.toFixed(1)}% of total`,
                  }))}
                  showValues={true}
                />
              )}
            </section>

            {/* Team Performance Section - Requirements 11.1, 12.1 */}
            <section id="team" className="space-y-6">
              <h2 className="text-xl font-semibold text-[#111827]">Team Performance</h2>
              
              <div className="space-y-6">
                {/* Recruiter Productivity Table */}
                {teamData.recruiters.data && teamData.recruiters.data.length > 0 && (
                  <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
                    <h3 className="text-lg font-semibold text-[#111827] mb-4">Recruiter Productivity</h3>
                    <Table
                      columns={[
                        { key: 'name', header: 'Recruiter', sortable: true },
                        { key: 'specialty', header: 'Specialty', sortable: true },
                        { key: 'activeRoles', header: 'Active Roles', sortable: true, align: 'center' },
                        { key: 'cvsAdded', header: 'CVs Added', sortable: true, align: 'center' },
                        { key: 'interviewsScheduled', header: 'Interviews', sortable: true, align: 'center' },
                        { key: 'offersMade', header: 'Offers', sortable: true, align: 'center' },
                        { key: 'hires', header: 'Hires', sortable: true, align: 'center' },
                        { 
                          key: 'avgTimeToFill', 
                          header: 'Avg Time to Fill', 
                          sortable: true, 
                          align: 'center',
                          render: (row: RecruiterData) => `${row.avgTimeToFill} days`
                        },
                        { 
                          key: 'productivityScore', 
                          header: 'Score', 
                          sortable: true, 
                          align: 'center',
                          render: (row: RecruiterData) => (
                            <span className={`font-medium ${
                              row.productivityScore >= 80 ? 'text-green-600' :
                              row.productivityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {row.productivityScore}
                            </span>
                          )
                        },
                      ]}
                      data={teamData.recruiters.data}
                      keyExtractor={(row) => row.id}
                      emptyMessage="No recruiter data available"
                    />
                  </div>
                )}

                {/* Panel Performance Table */}
                {teamData.panels.data && teamData.panels.data.length > 0 && (
                  <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
                    <h3 className="text-lg font-semibold text-[#111827] mb-4">Panel Performance</h3>
                    <Table
                      columns={[
                        { key: 'panelName', header: 'Panel', sortable: true },
                        { key: 'interviewRounds', header: 'Rounds Conducted', sortable: true, align: 'center' },
                        { 
                          key: 'offerPercentage', 
                          header: 'Offer Rate', 
                          sortable: true, 
                          align: 'center',
                          render: (row: PanelData) => (
                            <span className={`font-medium ${
                              row.offerPercentage >= 30 ? 'text-green-600' :
                              row.offerPercentage >= 20 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {row.offerPercentage.toFixed(1)}%
                            </span>
                          )
                        },
                        { key: 'topRejectionReason', header: 'Top Rejection Reason', sortable: true },
                        { 
                          key: 'avgFeedbackTime', 
                          header: 'Avg Feedback Time', 
                          sortable: true, 
                          align: 'center',
                          render: (row: PanelData) => (
                            <span className={`${
                              row.avgFeedbackTime <= 24 ? 'text-green-600' :
                              row.avgFeedbackTime <= 48 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {row.avgFeedbackTime}h
                            </span>
                          )
                        },
                      ]}
                      data={teamData.panels.data}
                      keyExtractor={(row) => row.panelName}
                      emptyMessage="No panel data available"
                    />
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AnalyticsPage;