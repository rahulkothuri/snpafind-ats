import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services';
import { useAuth } from './useAuth';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: (userId?: string) => [...dashboardKeys.all, 'metrics', userId] as const,
};

export function useDashboard() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: dashboardKeys.metrics(user?.id),
    queryFn: () => dashboardService.getDashboardData(user || undefined),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    enabled: !!user, // Only fetch when user is available
  });
}
