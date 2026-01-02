/**
 * AnalyticsPage Component - Polished "Neat & Clean" Dashboard
 * Requirements: Premium Aesthetic, Structured Layout, real-time
 */

import { useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { AnalyticsFilterBar, type GroupByOption } from '../components/AnalyticsFilterBar';
import { KPICard } from '../components/KPICard';
import { FunnelChart } from '../components/FunnelChart';
import { HorizontalBarChart } from '../components/HorizontalBarChart';
import { RejectionPieChart } from '../components/RejectionPieChart';
import { PanelPerformanceCard } from '../components/PanelPerformanceCard';
import { StageRejectionChart } from '../components/StageRejectionChart';
import { AnalyticsErrorState } from '../components/AnalyticsErrorState';
import { AnalyticsEmptyState, EmptyStateIcons } from '../components/AnalyticsEmptyState';
import {
  MdTrendingUp, MdPeople, MdEvent, MdAssignment,
  MdCheckCircle, MdCancel, MdPictureAsPdf, MdTableChart,
  MdTimer, MdGroup, MdSpeed, MdRefresh, MdError
} from 'react-icons/md';
import {
  useKPIMetrics,
  useFunnelAnalyticsComplete,
  useTimeAnalytics,
  useTeamPerformanceAnalytics,
  useSLAStatus,
  useAnalyticsExport,
  useDateRangePresets,
  useDropOffAnalysis,
  useRejectionReasons,
  usePanelPerformance,
  useAnalyticsFilterOptions
} from '../hooks/useAnalytics';
import { useAuth } from '../hooks/useAuth';
import { Skeleton } from '../components/Skeleton';

// Local interface for component state that includes dateRange and groupBy (Requirements 9.4, 9.5)
interface LocalAnalyticsFilters {
  dateRange: { start: Date | null; end: Date | null };
  departmentId?: string;
  locationId?: string;
  jobId?: string;
  recruiterId?: string;
  groupBy?: GroupByOption;
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<LocalAnalyticsFilters>({
    dateRange: { start: null, end: null },
  });
  const [isExporting, setIsExporting] = useState(false);

  // Fetch filter options from database (Requirements 9.1)
  const filterOptionsQuery = useAnalyticsFilterOptions();

  // Convert filters for API calls
  const apiFilters = useMemo(() => ({
    startDate: filters.dateRange.start || undefined,
    endDate: filters.dateRange.end || undefined,
    departmentId: filters.departmentId,
    locationId: filters.locationId,
    jobId: filters.jobId,
    recruiterId: filters.recruiterId,
  }), [filters]);

  const kpis = useKPIMetrics(apiFilters);
  const funnelData = useFunnelAnalyticsComplete(apiFilters);
  const timeData = useTimeAnalytics(apiFilters);
  const teamData = useTeamPerformanceAnalytics(apiFilters);
  const slaData = useSLAStatus(apiFilters);
  const { exportAnalytics } = useAnalyticsExport();
  const dropOffData = useDropOffAnalysis(apiFilters);
  const rejectionData = useRejectionReasons(apiFilters);
  const panelData = usePanelPerformance(apiFilters);

  const dateRangePresets = useDateRangePresets();
  const defaultRange = dateRangePresets.find(preset => preset.value === 'last_90_days');

  if (!filters.dateRange.start && !filters.dateRange.end && defaultRange) {
    setFilters({
      ...filters,
      dateRange: {
        start: defaultRange.startDate,
        end: defaultRange.endDate,
      },
    });
  }

  // Transform filter options for AnalyticsFilterBar
  const availableFilters = useMemo(() => {
    const options = filterOptionsQuery.data;
    return {
      departments: options?.departments || [],
      locations: options?.locations || [],
      jobs: options?.jobs || [],
      recruiters: options?.recruiters || [],
    };
  }, [filterOptionsQuery.data]);

  // Check if any data is loading
  const isLoading = kpis.isLoading || funnelData.isLoading || timeData.isLoading ||
    teamData.isLoading || slaData.isLoading || dropOffData.isLoading ||
    rejectionData.isLoading || panelData.isLoading;

  // Check if any data has errors
  const hasError = kpis.isError || funnelData.isError || timeData.isError ||
    teamData.isError || slaData.isError || dropOffData.isError ||
    rejectionData.isError || panelData.isError;

  // Refetch all data
  const refetchAll = () => {
    kpis.refetch();
    funnelData.funnel.refetch();
    timeData.timeInStage.refetch();
    timeData.timeToFill.refetch();
    teamData.recruiters.refetch();
    slaData.refetch();
    dropOffData.refetch();
    rejectionData.refetch();
    panelData.refetch();
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!filters.dateRange.start || !filters.dateRange.end) return;
    setIsExporting(true);
    try {
      const blob = await exportAnalytics({
        format,
        sections: ['all'],
        filters: apiFilters,
        dateRange: {
          startDate: filters.dateRange.start,
          endDate: filters.dateRange.end,
        },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${format}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate Interview → Offer rate from funnel data
  const interviewToOfferRate = useMemo(() => {
    if (!funnelData.funnel.data?.stages) return { rate: 0, interviews: 0, offers: 0 };
    const stages = funnelData.funnel.data.stages;
    const interviewStage = stages.find(s => s.name.toLowerCase() === 'interview');
    const offerStage = stages.find(s => s.name.toLowerCase() === 'offer');
    const interviews = interviewStage?.count || 0;
    const offers = offerStage?.count || 0;
    const rate = interviews > 0 ? Math.round((offers / interviews) * 100) : 0;
    return { rate, interviews, offers };
  }, [funnelData.funnel.data]);

  // Calculate overall rejection rate
  const overallRejectionRate = useMemo(() => {
    if (!funnelData.funnel.data) return 0;
    const { totalApplicants, totalHired } = funnelData.funnel.data;
    if (totalApplicants === 0) return 0;
    return Math.round(((totalApplicants - totalHired) / totalApplicants) * 100);
  }, [funnelData.funnel.data]);

  return (
    <Layout pageTitle="Analytics Dashboard" user={user}>
      <div className="flex flex-col min-h-[calc(100vh-64px)] bg-gray-50/50">

        {/* Top Filter Bar */}
        <AnalyticsFilterBar
          filters={{
            dateRange: filters.dateRange,
            departmentId: filters.departmentId,
            locationId: filters.locationId,
            jobId: filters.jobId,
            recruiterId: filters.recruiterId,
            groupBy: filters.groupBy,
          }}
          onFilterChange={(newFilters) => setFilters({
            dateRange: newFilters.dateRange,
            departmentId: newFilters.departmentId,
            locationId: newFilters.locationId,
            jobId: newFilters.jobId,
            recruiterId: newFilters.recruiterId,
            groupBy: newFilters.groupBy,
          })}
          availableFilters={availableFilters}
          isLoading={isLoading || filterOptionsQuery.isLoading}
          className="shrink-0 shadow-sm z-10"
        />

        {/* Toolbar */}
        <div className="px-8 py-3 flex justify-between items-center bg-white border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MdSpeed className="text-blue-600" />
            Real-time Overview
            {isLoading && <span className="text-xs text-gray-400 ml-2">Loading...</span>}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={refetchAll}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <MdRefresh size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting || !filters.dateRange.start}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MdPictureAsPdf size={14} /> PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={isExporting || !filters.dateRange.start}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MdTableChart size={14} /> Excel
            </button>
          </div>
        </div>

        {/* Error State Banner - Requirements 10.3 */}
        {hasError && (
          <div className="px-8 py-3 bg-red-50 border-b border-red-100">
            <div className="flex items-center justify-between max-w-[1400px] mx-auto">
              <div className="flex items-center gap-2 text-red-700">
                <MdError size={18} />
                <span className="text-sm font-medium">Some data failed to load.</span>
              </div>
              <button
                onClick={refetchAll}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <MdRefresh size={14} className={isLoading ? 'animate-spin' : ''} />
                Retry All
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area - Auto-expands based on content */}
        <div className="flex-1 p-8 pb-12">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Row 1: Key Performance Indicators - 6 Cards */}
            {kpis.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <Skeleton className="h-3 w-20 mb-3" />
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : kpis.data ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* KPI 1: Avg Time to Hire - Requirements 1.4 */}
                <KPICard
                  label="Avg Time to Hire"
                  value={kpis.data.avgTimeToFill > 0 ? `${kpis.data.avgTimeToFill} days` : '—'}
                  subtitle="From open to accepted offer"
                  icon={MdTimer}
                />
                {/* KPI 2: Offer Acceptance Rate - Requirements 1.5 */}
                <KPICard
                  label="Offer Acceptance Rate"
                  value={kpis.data.totalOffers > 0 ? `${kpis.data.offerAcceptanceRate}%` : '—'}
                  subtitle={kpis.data.totalOffers > 0 ? `${kpis.data.totalOffers} offers, ${kpis.data.totalHires} accepted` : 'No offers yet'}
                  icon={MdCheckCircle}
                />
                {/* KPI 3: Interview → Offer - Requirements 1.6 */}
                <KPICard
                  label="Interview → Offer"
                  value={interviewToOfferRate.interviews > 0 ? `${interviewToOfferRate.rate}%` : '—'}
                  subtitle={interviewToOfferRate.interviews > 0 ? `${interviewToOfferRate.interviews} interviews, ${interviewToOfferRate.offers} offers` : 'No interviews yet'}
                  icon={MdEvent}
                />
                {/* KPI 4: Overall Rejection Rate - Requirements 1.7 */}
                <KPICard
                  label="Overall Rejection Rate"
                  value={funnelData.funnel.data?.totalApplicants && funnelData.funnel.data.totalApplicants > 0 ? `${overallRejectionRate}%` : '—'}
                  subtitle="Across all roles & stages"
                  icon={MdCancel}
                />
                {/* KPI 5: Roles on Track - Requirements 1.8 */}
                <div className="relative rounded-xl p-5 bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Roles on track</h3>
                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2">
                      {slaData.data?.summary?.onTrack ?? 0}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="text-xs text-gray-500">
                      At risk: <span className="text-amber-600 font-semibold">{slaData.data?.summary?.atRisk ?? 0}</span> ·
                      Breached: <span className="text-red-600 font-semibold">{slaData.data?.summary?.breached ?? 0}</span>
                    </div>
                    <div className="text-[10px] text-gray-400">Based on SLA for time to fill</div>
                  </div>
                </div>
                {/* KPI 6: Active Candidates - Requirements 1.9 */}
                <KPICard
                  label="Active Candidates"
                  value={kpis.data.activeCandidates > 0 ? kpis.data.activeCandidates : '—'}
                  subtitle={kpis.data.newCandidatesThisMonth > 0 ? `New this month: ${kpis.data.newCandidatesThisMonth}` : 'No new candidates this month'}
                  icon={MdPeople}
                />
              </div>
            ) : kpis.isError ? (
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <AnalyticsErrorState
                  message="Failed to load KPI metrics"
                  onRetry={() => kpis.refetch()}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <AnalyticsEmptyState
                  title="No KPI data available"
                  message="Try adjusting your filters or date range"
                  icon={EmptyStateIcons.chart}
                />
              </div>
            )}

            {/* Row 2: Tall Charts (Funnel & Time-Spent) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* STAGE FUNNEL - Requirements 2.1, 2.3, 2.4, 2.5, 2.6 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <MdTrendingUp className="text-blue-500" /> Stage Funnel Conversion
                    </h3>
                    <div className="text-xs text-gray-500 mt-0.5">From applicants to hired · All roles</div>
                  </div>
                  {/* Legend - Requirements 2.6 */}
                  <div className="flex gap-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-200"></span> Volume</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Conversion %</span>
                  </div>
                </div>
                <div>
                  {funnelData.funnel.isLoading ? (
                    <div className="space-y-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-3 rounded-full" width={`${100 - i * 15}%`} />
                        </div>
                      ))}
                    </div>
                  ) : funnelData.funnel.isError ? (
                    <AnalyticsErrorState
                      message="Failed to load funnel data"
                      onRetry={() => funnelData.funnel.refetch()}
                    />
                  ) : funnelData.funnel.data?.stages && funnelData.funnel.data.stages.length > 0 ? (
                    <FunnelChart
                      stages={funnelData.funnel.data.stages}
                      showPercentages={true}
                      className="border-none shadow-none p-0"
                    />
                  ) : (
                    <AnalyticsEmptyState
                      title="No funnel data available"
                      message="Try adjusting your filters or date range"
                      icon={EmptyStateIcons.chart}
                    />
                  )}
                </div>
              </div>

              {/* TIME SPENT AT EACH STAGE - Requirements 4.1, 4.3, 4.4, 4.5 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="mb-3">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <MdTimer className="text-blue-400" /> Average Time Spent at Each Stage
                  </h3>
                  <div className="text-xs text-gray-500 mt-0.5">In days · Closed roles only</div>
                </div>
                {timeData.timeInStage.isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-2 rounded-full" width={`${80 - i * 10}%`} />
                      </div>
                    ))}
                  </div>
                ) : timeData.timeInStage.isError ? (
                  <AnalyticsErrorState
                    message="Failed to load time-in-stage data"
                    onRetry={() => timeData.timeInStage.refetch()}
                  />
                ) : timeData.timeInStage.data?.stages && timeData.timeInStage.data.stages.length > 0 ? (
                  <>
                    <HorizontalBarChart
                      title=""
                      valueLabel="Days"
                      data={timeData.timeInStage.data.stages.map(stage => ({
                        id: stage.stageName,
                        label: stage.stageName,
                        value: stage.avgDays,
                        displayValue: `${stage.avgDays}d`,
                        isOverThreshold: stage.isBottleneck,
                      }))}
                      showValues={true}
                      colorScheme={{
                        normal: '#bfdbfe',
                        warning: '#fca5a5',
                        threshold: '#fbbf24'
                      }}
                      className="border-none shadow-none p-0"
                    />
                    {timeData.timeInStage.data.bottleneckStage && (
                      <div className="mt-4 text-[10px] text-gray-500">
                        Bottleneck: <strong className="text-gray-700">{timeData.timeInStage.data.bottleneckStage}</strong>
                        {timeData.timeInStage.data.suggestion && (
                          <span className="block mt-1 text-gray-400">{timeData.timeInStage.data.suggestion}</span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <AnalyticsEmptyState
                    title="No time-in-stage data available"
                    message="Try adjusting your filters or date range"
                    icon={EmptyStateIcons.time}
                  />
                )}
              </div>
            </div>

            {/* Row 3: Compact Cards (Rejection Pie & Recruiter) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* REJECTION REASONS - Requirements 3.1, 3.3, 3.4, 3.5, 3.6 */}
              <div>
                {rejectionData.isLoading ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2 mb-4">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-5 w-40" />
                    </div>
                    <div className="flex items-center justify-center py-4">
                      <Skeleton className="h-32 w-32 rounded-full" />
                    </div>
                    <div className="space-y-2 mt-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Skeleton className="h-3 w-3 rounded-full" />
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-8 ml-auto" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : rejectionData.data?.reasons ? (
                  <RejectionPieChart
                    data={rejectionData.data.reasons.map(r => ({
                      reason: r.reason,
                      percentage: r.percentage,
                      color: r.color
                    }))}
                    topStage={rejectionData.data.topStageForRejection}
                  />
                ) : rejectionData.isError ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <AnalyticsErrorState
                      message="Failed to load rejection data"
                      onRetry={() => rejectionData.refetch()}
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <AnalyticsEmptyState
                      title="No rejection data available"
                      message="Try adjusting your filters or date range"
                      icon={EmptyStateIcons.pie}
                    />
                  </div>
                )}
              </div>

              {/* RECRUITER PRODUCTIVITY - Requirements 5.1, 5.3, 5.4, 5.5 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-full">
                <div className="mb-3">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <MdGroup className="text-purple-500" /> Recruiter Productivity
                  </h3>
                  <div className="text-xs text-gray-500 mt-0.5">Top 3 recruiters · Last 90 days</div>
                </div>
                {/* Loading State - Requirements 10.4 */}
                {teamData.recruiters.isLoading ? (
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      {[...Array(7)].map((_, i) => (
                        <Skeleton key={i} className="h-3 w-16" />
                      ))}
                    </div>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between py-2">
                        {[...Array(7)].map((_, j) => (
                          <Skeleton key={j} className="h-3 w-12" />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : teamData.recruiters.isError ? (
                  /* Error State - Requirements 10.3 */
                  <AnalyticsErrorState
                    message="Failed to load recruiter data"
                    onRetry={() => teamData.recruiters.refetch()}
                  />
                ) : teamData.recruiters.data && teamData.recruiters.data.length > 0 ? (
                  /* Recruiter Table with real data - Requirements 5.1, 5.3, 5.4 */
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] uppercase text-gray-500 border-b border-gray-100 tracking-wider">
                          <th className="py-2 px-2 font-medium">Recruiter</th>
                          <th className="py-2 px-2 font-medium text-center">Roles</th>
                          <th className="py-2 px-2 font-medium text-center">CVs added</th>
                          <th className="py-2 px-2 font-medium text-center">Interviews</th>
                          <th className="py-2 px-2 font-medium text-center">Offers</th>
                          <th className="py-2 px-2 font-medium text-center">Hires</th>
                          <th className="py-2 px-2 font-medium text-right">Avg TTF</th>
                        </tr>
                      </thead>
                      <tbody className="text-[11px]">
                        {/* Show top 3 recruiters by default - Requirements 5.4 */}
                        {teamData.recruiters.data.slice(0, 3).map(r => (
                          <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="py-2.5 px-2 font-medium text-gray-800">{r.name}</td>
                            <td className="py-2.5 px-2 text-center text-gray-600">{r.activeRoles}</td>
                            <td className="py-2.5 px-2 text-center text-gray-600">{r.cvsAdded}</td>
                            <td className="py-2.5 px-2 text-center text-gray-600">{r.interviewsScheduled}</td>
                            <td className="py-2.5 px-2 text-center text-gray-600">{r.offersMade}</td>
                            <td className="py-2.5 px-2 text-center text-gray-800 font-bold">{r.hires}</td>
                            <td className="py-2.5 px-2 text-right text-gray-600">{r.avgTimeToFill}d</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Empty State - Requirements 10.2 */
                  <AnalyticsEmptyState
                    title="No recruiter data available"
                    message="Try adjusting your filters or date range"
                    icon={EmptyStateIcons.people}
                  />
                )}
                {/* Footer with metric info and link to full report - Requirements 5.5 */}
                <div className="mt-3 flex justify-between items-center text-[10px] text-gray-500">
                  <span>Metric: Time to fill (TTF) + hires per recruiter</span>
                  <button className="text-blue-600 hover:underline">View full report</button>
                </div>
              </div>
            </div>

            {/* Row 4: Panel Performance & Role-wise TTF */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* PANEL PERFORMANCE - Requirements 6.1, 6.3, 6.4, 6.5 */}
              {panelData.isLoading ? (
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-full">
                  <div className="flex items-center gap-2 mb-6">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-3 w-16" />
                      ))}
                    </div>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between py-2">
                        {[...Array(5)].map((_, j) => (
                          <Skeleton key={j} className="h-3 w-12" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : panelData.data && panelData.data.length > 0 ? (
                <PanelPerformanceCard
                  data={panelData.data.map((p, i) => ({
                    id: String(i),
                    name: p.panelName,
                    rounds: p.interviewRounds,
                    offerRate: p.offerPercentage,
                    topRejectionReason: p.topRejectionReason,
                    avgFeedbackTime: p.avgFeedbackTime
                  }))}
                />
              ) : panelData.isError ? (
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <AnalyticsErrorState
                    message="Failed to load panel performance data"
                    onRetry={() => panelData.refetch()}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <AnalyticsEmptyState
                    title="No panel performance data available"
                    message="Try adjusting your filters or date range"
                    icon={EmptyStateIcons.people}
                  />
                </div>
              )}

              {/* ROLE-WISE TIME TO FILL - Requirements 7.1, 7.3, 7.4, 7.5, 7.6 */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <MdAssignment className="text-indigo-500" /> Role-wise Time to Fill
                  </h3>
                  <div className="text-xs text-gray-500 mt-0.5">Closed roles only · All departments</div>
                </div>
                {/* Loading State - Requirements 10.4 */}
                {timeData.timeToFill.isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-2 rounded-full" width={`${80 - i * 10}%`} />
                      </div>
                    ))}
                  </div>
                ) : timeData.timeToFill.isError ? (
                  /* Error State - Requirements 10.3 */
                  <AnalyticsErrorState
                    message="Failed to load time-to-fill data"
                    onRetry={() => timeData.timeToFill.refetch()}
                  />
                ) : timeData.timeToFill.data?.byRole && timeData.timeToFill.data.byRole.length > 0 ? (
                  /* Chart with real data - Requirements 7.1, 7.3, 7.4 */
                  <HorizontalBarChart
                    title=""
                    valueLabel="Days"
                    data={timeData.timeToFill.data.byRole.slice(0, 5).map(role => ({
                      id: role.roleId,
                      label: role.roleName,
                      value: role.average,
                      displayValue: `${role.average}d`,
                      isOverThreshold: role.isOverTarget, // Highlight roles over 30 days in orange - Requirements 7.3, 7.4
                    }))}
                    colorScheme={{
                      normal: '#60a5fa', // blue-400
                      warning: '#f97316', // orange-500 for roles over threshold - Requirements 7.4
                      threshold: '#fbbf24' // amber-400
                    }}
                    showValues={true}
                    threshold={timeData.timeToFill.data.overall?.target || 30} // Show benchmark target line - Requirements 7.5
                    thresholdLabel={`Target: ${timeData.timeToFill.data.overall?.target || 30} days`}
                    className="border-none shadow-none p-0"
                  />
                ) : (
                  /* Empty State - Requirements 10.2 */
                  <AnalyticsEmptyState
                    title="No time-to-fill data available"
                    message="Try adjusting your filters or date range"
                    icon={EmptyStateIcons.document}
                  />
                )}
                {/* Footer with benchmark target and link to details - Requirements 7.5, 7.6 */}
                <div className="mt-4 flex justify-between items-center text-[10px] text-gray-500">
                  <span>Benchmark: Target TTF = <strong>{timeData.timeToFill.data?.overall?.target || 30} days</strong></span>
                  <button className="text-blue-600 hover:underline">View per-role aging & SLA details</button>
                </div>
              </div>
            </div>

            {/* Row 5: Stage-wise Rejections - Requirements 8.1, 8.3, 8.4, 8.5, 8.6 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Loading State - Requirements 10.4 */}
              {dropOffData.isLoading ? (
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2 mb-6">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-2.5 flex-1 rounded-full" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-3 w-64 mt-5" />
                </div>
              ) : dropOffData.isError ? (
                /* Error State - Requirements 10.3 */
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-h-[200px]">
                  <AnalyticsErrorState
                    message="Failed to load drop-off data"
                    onRetry={() => dropOffData.refetch()}
                  />
                </div>
              ) : dropOffData.data?.byStage && dropOffData.data.byStage.length > 0 ? (
                /* StageRejectionChart with real data - Requirements 8.1, 8.3, 8.4, 8.5, 8.6 */
                <StageRejectionChart
                  data={dropOffData.data.byStage.map(s => ({
                    stageName: s.stageName,
                    dropOffCount: s.dropOffCount,
                    dropOffPercentage: s.dropOffPercentage
                  }))}
                  highestDropOffStage={dropOffData.data.highestDropOffStage}
                />
              ) : (
                /* Empty State - Requirements 10.2 */
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-h-[200px]">
                  <AnalyticsEmptyState
                    title="No drop-off data available"
                    message="Try adjusting your filters or date range"
                    icon={EmptyStateIcons.chart}
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AnalyticsPage;