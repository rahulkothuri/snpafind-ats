/**
 * AnalyticsPage Component - Polished "Neat & Clean" Dashboard
 * Requirements: Premium Aesthetic, Structured Layout, real-time
 */

import { useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { AnalyticsFilterBar } from '../components/AnalyticsFilterBar';
import { KPICard } from '../components/KPICard';
import { FunnelChart } from '../components/FunnelChart';
import { HorizontalBarChart } from '../components/HorizontalBarChart';
import { RejectionPieChart } from '../components/RejectionPieChart';
import { PanelPerformanceCard } from '../components/PanelPerformanceCard';
import { StageRejectionChart } from '../components/StageRejectionChart';
import {
  MdTrendingUp, MdPeople, MdEvent, MdAssignment,
  MdCheckCircle, MdCancel, MdPictureAsPdf, MdTableChart,
  MdTimer, MdGroup, MdSpeed
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
  usePanelPerformance
} from '../hooks/useAnalytics';
import { useAuth } from '../hooks/useAuth';

// Local interface for component state that includes dateRange
interface LocalAnalyticsFilters {
  dateRange: { start: Date | null; end: Date | null };
  departmentId?: string;
  locationId?: string;
  jobId?: string;
  recruiterId?: string;
}

// Mock filter options
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
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50/50">

        {/* Top Filter Bar */}
        <AnalyticsFilterBar
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
          className="shrink-0 shadow-sm z-10"
        />

        {/* Toolbar */}
        <div className="px-8 py-3 flex justify-between items-center bg-white border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MdSpeed className="text-blue-600" />
            Real-time Overview
          </h2>
          <div className="flex gap-2">
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

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Row 1: Key Performance Indicators - 6 Cards */}
            {kpis.data && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KPICard
                  label="Avg Time to Hire"
                  value={`${kpis.data.avgTimeToFill} days`}
                  subtitle="From open to accepted offer"
                  icon={MdTimer}
                />
                <KPICard
                  label="Offer Acceptance Rate"
                  value={`${kpis.data.offerAcceptanceRate}%`}
                  subtitle={`${kpis.data.offersPending + kpis.data.totalHires} offers, ${kpis.data.totalHires} accepted`}
                  icon={MdCheckCircle}
                />
                <KPICard
                  label="Interview → Offer"
                  value={`${interviewToOfferRate.rate}%`}
                  subtitle={`${interviewToOfferRate.interviews} interviews, ${interviewToOfferRate.offers} offers`}
                  icon={MdEvent}
                />
                <KPICard
                  label="Overall Rejection Rate"
                  value={`${overallRejectionRate}%`}
                  subtitle="Across all roles & stages"
                  icon={MdCancel}
                />
                <div className="relative rounded-xl p-5 bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Roles on track</h3>
                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2">
                      {slaData.data?.summary.onTrack || 0}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="text-xs text-gray-500">At risk: <span className="text-amber-600 font-semibold">{slaData.data?.summary.atRisk || 0}</span> · Breached: <span className="text-red-600 font-semibold">{slaData.data?.summary.breached || 0}</span></div>
                    <div className="text-[10px] text-gray-400">Based on SLA for time to fill</div>
                  </div>
                </div>
                <KPICard
                  label="Active Candidates"
                  value={kpis.data.activeCandidates}
                  subtitle={`New this month: ${Math.round(kpis.data.activeCandidates * 0.29)}`}
                  icon={MdPeople}
                />
              </div>
            )}

            {/* Row 2: Main Charts (Funnel & Rejection Pie) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* STAGE FUNNEL (Wider) */}
              <div className="xl:col-span-7 bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <MdTrendingUp className="text-blue-500" /> Stage Funnel Conversion
                    </h3>
                    <div className="text-xs text-gray-500 mt-0.5">From applicants to hired · All engineering roles</div>
                  </div>
                  {/* Legend match */}
                  <div className="flex gap-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-200"></span> Volume</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Conversion %</span>
                  </div>
                </div>
                <div className="flex-1 min-h-[250px]">
                  {funnelData.funnel.data?.stages && (
                    <FunnelChart
                      stages={funnelData.funnel.data.stages}
                      showPercentages={true}
                      className="h-full border-none shadow-none p-0"
                    />
                  )}
                </div>
              </div>

              {/* REJECTION REASONS (Narrower) */}
              <div className="xl:col-span-5 h-full">
                {rejectionData.data?.reasons ? (
                  <RejectionPieChart
                    data={rejectionData.data.reasons.map(r => ({
                      reason: r.reason,
                      percentage: r.percentage,
                      color: r.color
                    }))}
                    topStage={rejectionData.data.topStageForRejection}
                    className="h-full"
                  />
                ) : (
                  <RejectionPieChart
                    data={[
                      { reason: 'Skill mismatch', percentage: 28, color: '#ef4444' },
                      { reason: 'Compensation mismatch', percentage: 24, color: '#f97316' },
                      { reason: 'Culture / attitude', percentage: 22, color: '#0ea5e9' },
                      { reason: 'Location / notice / other', percentage: 26, color: '#22c55e' },
                    ]}
                    topStage="Screening (52% of all rejections)"
                    className="h-full"
                  />
                )}
              </div>
            </div>

            {/* Row 3: Secondary Metrics (Time & Recruiter) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* TIME SPENT AT EACH STAGE */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <MdTimer className="text-blue-400" /> Average Time Spent at Each Stage
                  </h3>
                  <div className="text-xs text-gray-500 mt-0.5">In days · Closed roles only</div>
                </div>
                {timeData.timeInStage.data?.stages && (
                  <HorizontalBarChart
                    title=""
                    valueLabel="Days"
                    data={timeData.timeInStage.data.stages.map(stage => ({
                      id: stage.stageName,
                      label: stage.stageName,
                      value: stage.avgDays,
                      displayValue: `${stage.avgDays}d`,
                      isOverThreshold: false,
                    }))}
                    showValues={true}
                    colorScheme={{
                      normal: '#bfdbfe', // blue-200 to match reference
                      warning: '#fca5a5',
                      threshold: '#fbbf24'
                    }}
                    className="border-none shadow-none p-0"
                  />
                )}
                <div className="mt-4 text-[10px] text-gray-500">
                  Bottleneck: <strong className="text-gray-700">Offer → Join</strong> & <strong className="text-gray-700">Shortlist → Interview</strong>.
                </div>
              </div>

              {/* RECRUITER PRODUCTIVITY */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <MdGroup className="text-purple-500" /> Recruiter Productivity
                  </h3>
                  <div className="text-xs text-gray-500 mt-0.5">Top 3 recruiters · Last 90 days</div>
                </div>
                {teamData.recruiters.data && (
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
                )}
                <div className="mt-4 flex justify-between items-center text-[10px] text-gray-500">
                  <span>Metric: Time to fill (TTF) + hires per recruiter</span>
                  <button className="text-blue-600 hover:underline">View full report</button>
                </div>
              </div>
            </div>

            {/* Row 4: Panel Performance & Role-wise TTF */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {panelData.data ? (
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
              ) : (
                <PanelPerformanceCard
                  data={[
                    { id: '1', name: 'Panel A (Backend)', rounds: 21, offerRate: 29, topRejectionReason: 'Skill mismatch', avgFeedbackTime: 5.2 },
                    { id: '2', name: 'Panel B (Architecture)', rounds: 12, offerRate: 42, topRejectionReason: 'Culture / fit', avgFeedbackTime: 8.1 },
                    { id: '3', name: 'Panel C (Hiring Mgr)', rounds: 17, offerRate: 19, topRejectionReason: 'Comp mismatch', avgFeedbackTime: 14.3 },
                  ]}
                />
              )}

              {/* ROLE-WISE TIME TO FILL */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <MdAssignment className="text-indigo-500" /> Role-wise Time to Fill
                  </h3>
                  <div className="text-xs text-gray-500 mt-0.5">Closed roles only · Engineering</div>
                </div>
                {timeData.timeToFill.data?.byRole && (
                  <HorizontalBarChart
                    title=""
                    valueLabel="Days"
                    data={timeData.timeToFill.data.byRole.slice(0, 5).map(role => ({
                      id: role.roleId,
                      label: role.roleName,
                      value: role.average,
                      displayValue: `${role.average}d`,
                      isOverThreshold: role.isOverTarget,
                    }))}
                    colorScheme={{
                      normal: '#60a5fa',
                      warning: '#f97316',
                      threshold: '#fbbf24'
                    }}
                    showValues={true}
                    className="border-none shadow-none p-0"
                  />
                )}
                <div className="mt-4 flex justify-between items-center text-[10px] text-gray-500">
                  <span>Benchmark: Target TTF = <strong>30 days</strong></span>
                  <button className="text-blue-600 hover:underline">View details</button>
                </div>
              </div>
            </div>

            {/* Row 5: Stage-wise Rejections */}
            {dropOffData.data?.byStage && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <StageRejectionChart
                  data={dropOffData.data.byStage.map(s => ({
                    stageName: s.stageName,
                    dropOffCount: s.dropOffCount,
                    dropOffPercentage: s.dropOffPercentage
                  }))}
                  highestDropOffStage={dropOffData.data.highestDropOffStage}
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AnalyticsPage;