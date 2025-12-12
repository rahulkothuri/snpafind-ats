import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: () => dashboardService.getMetrics(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}
