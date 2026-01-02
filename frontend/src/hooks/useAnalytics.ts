import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { analyticsService, type AnalyticsFilters, type AnalyticsFilterOptions, type KPIMetrics, type FunnelData, type ConversionData, type TimeToFillData, type TimeInStageData, type SourceData, type RecruiterData, type PanelData, type DropOffData, type RejectionData, type OfferData, type SLAStatusData, type ExportRequest, AnalyticsService } from '../services/analytics.service';

// Query keys for React Query caching
export const analyticsKeys = {
  all: ['analytics'] as const,
  filterOptions: () => [...analyticsKeys.all, 'filter-options'] as const,
  kpis: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'kpis', filters] as const,
  funnel: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'funnel', filters] as const,
  conversionRates: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'conversion-rates', filters] as const,
  timeToFill: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'time-to-fill', filters] as const,
  timeInStage: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'time-in-stage', filters] as const,
  sources: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'sources', filters] as const,
  recruiters: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'recruiters', filters] as const,
  panels: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'panels', filters] as const,
  dropOff: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'drop-off', filters] as const,
  rejectionReasons: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'rejection-reasons', filters] as const,
  offerRate: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'offer-rate', filters] as const,
  slaStatus: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'sla-status', filters] as const,
  overview: (filters?: AnalyticsFilters) => [...analyticsKeys.all, 'overview', filters] as const,
};

// Default query options for analytics
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchInterval: 60 * 1000, // Refetch every 1 minute for real-time updates
  retry: 2,
  refetchOnWindowFocus: false,
};

/**
 * Hook for fetching analytics filter options
 * Requirements: 9.1 - Fetch departments, locations, jobs, and recruiters from database
 */
export function useAnalyticsFilterOptions(
  options?: Omit<UseQueryOptions<AnalyticsFilterOptions>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.filterOptions(),
    queryFn: () => analyticsService.getFilterOptions(),
    staleTime: 10 * 60 * 1000, // 10 minutes - filter options don't change often
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });
}

/**
 * Hook for fetching KPI metrics
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useKPIMetrics(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<KPIMetrics>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.kpis(filters),
    queryFn: () => analyticsService.getKPIMetrics(filters),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching funnel analytics
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useFunnelAnalytics(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<FunnelData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.funnel(filters),
    queryFn: () => analyticsService.getFunnelAnalytics(filters),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching conversion rates
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useConversionRates(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<ConversionData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.conversionRates(filters),
    queryFn: () => analyticsService.getConversionRates(filters),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching time-to-fill analytics
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useTimeToFill(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<TimeToFillData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.timeToFill(filters),
    queryFn: () => analyticsService.getTimeToFill(filters),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching time-in-stage analytics
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useTimeInStage(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<TimeInStageData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.timeInStage(filters),
    queryFn: () => analyticsService.getTimeInStage(filters),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching source performance analytics
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useSourcePerformance(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<SourceData[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.sources(filters),
    queryFn: () => analyticsService.getSourcePerformance(filters),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching recruiter productivity analytics
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useRecruiterProductivity(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<RecruiterData[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.recruiters(filters),
    queryFn: () => analyticsService.getRecruiterProductivity(filters),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching panel performance analytics
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function usePanelPerformance(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<PanelData[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.panels(filters),
    queryFn: () => analyticsService.getPanelPerformance(filters),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching drop-off analysis
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useDropOffAnalysis(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<DropOffData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.dropOff(filters),
    queryFn: () => analyticsService.getDropOffAnalysis(filters),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching rejection reasons analysis
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useRejectionReasons(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<RejectionData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.rejectionReasons(filters),
    queryFn: () => analyticsService.getRejectionReasons(filters),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching offer acceptance rate analytics
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useOfferAcceptanceRate(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<OfferData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.offerRate(filters),
    queryFn: () => analyticsService.getOfferAcceptanceRate(filters),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching SLA status analytics
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useSLAStatus(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<SLAStatusData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.slaStatus(filters),
    queryFn: () => analyticsService.getSLAStatus(filters),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching analytics overview (aggregated data)
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useAnalyticsOverview(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<{
    kpis: KPIMetrics;
    funnel: FunnelData;
    sources: SourceData[];
    slaStatus: SLAStatusData;
  }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.overview(filters),
    queryFn: () => analyticsService.getAnalyticsOverview(filters),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for exporting analytics data
 * Note: This returns a function to trigger the export, not a query
 */
export function useAnalyticsExport() {
  return {
    exportAnalytics: async (exportRequest: ExportRequest): Promise<Blob> => {
      return analyticsService.exportAnalytics(exportRequest);
    },
  };
}

/**
 * Utility hook for date range presets
 * Requirements: 15.1, 15.2 - Predefined date range options
 */
export function useDateRangePresets() {
  return AnalyticsService.getDateRangePresets();
}

/**
 * Utility hook for date range validation
 * Requirements: 15.3 - Custom date range selection with validation
 */
export function useDateRangeValidation() {
  return {
    validateDateRange: (startDate: Date, endDate: Date) =>
      AnalyticsService.validateDateRange(startDate, endDate),
  };
}

/**
 * Combined hook for common analytics data used in dashboard
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useDashboardAnalytics(filters?: AnalyticsFilters) {
  const kpis = useKPIMetrics(filters);
  const funnel = useFunnelAnalytics(filters);
  const sources = useSourcePerformance(filters);
  const slaStatus = useSLAStatus(filters);

  return {
    kpis,
    funnel,
    sources,
    slaStatus,
    isLoading: kpis.isLoading || funnel.isLoading || sources.isLoading || slaStatus.isLoading,
    isError: kpis.isError || funnel.isError || sources.isError || slaStatus.isError,
    error: kpis.error || funnel.error || sources.error || slaStatus.error,
  };
}

/**
 * Combined hook for team performance analytics
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useTeamPerformanceAnalytics(filters?: AnalyticsFilters) {
  const recruiters = useRecruiterProductivity(filters);
  const panels = usePanelPerformance(filters);

  return {
    recruiters,
    panels,
    isLoading: recruiters.isLoading || panels.isLoading,
    isError: recruiters.isError || panels.isError,
    error: recruiters.error || panels.error,
  };
}

/**
 * Combined hook for time analytics
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useTimeAnalytics(filters?: AnalyticsFilters) {
  const timeToFill = useTimeToFill(filters);
  const timeInStage = useTimeInStage(filters);

  return {
    timeToFill,
    timeInStage,
    isLoading: timeToFill.isLoading || timeInStage.isLoading,
    isError: timeToFill.isError || timeInStage.isError,
    error: timeToFill.error || timeInStage.error,
  };
}

/**
 * Combined hook for funnel and drop-off analytics
 * Requirements: 15.1, 15.2, 15.3 - Support date range and filter parameters
 */
export function useFunnelAnalyticsComplete(filters?: AnalyticsFilters) {
  const funnel = useFunnelAnalytics(filters);
  const conversionRates = useConversionRates(filters);
  const dropOff = useDropOffAnalysis(filters);
  const rejectionReasons = useRejectionReasons(filters);

  return {
    funnel,
    conversionRates,
    dropOff,
    rejectionReasons,
    isLoading: funnel.isLoading || conversionRates.isLoading || dropOff.isLoading || rejectionReasons.isLoading,
    isError: funnel.isError || conversionRates.isError || dropOff.isError || rejectionReasons.isError,
    error: funnel.error || conversionRates.error || dropOff.error || rejectionReasons.error,
  };
}