import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsService, type CreateJobData } from '../services';

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: string) => [...jobKeys.lists(), { filters }] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  pipeline: (id: string) => [...jobKeys.all, 'pipeline', id] as const,
};

export function useJobs() {
  return useQuery({
    queryKey: jobKeys.lists(),
    queryFn: () => jobsService.getAll(),
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => jobsService.getById(id),
    enabled: !!id,
  });
}

export function usePipelineStages(jobId: string) {
  return useQuery({
    queryKey: jobKeys.pipeline(jobId),
    queryFn: () => jobsService.getPipelineStages(jobId),
    enabled: !!jobId,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobData) => jobsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateJobData> }) =>
      jobsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}
