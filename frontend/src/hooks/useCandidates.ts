import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesService, type CreateCandidateData, type CandidateSearchParams } from '../services';

export const candidateKeys = {
  all: ['candidates'] as const,
  lists: () => [...candidateKeys.all, 'list'] as const,
  list: (params?: CandidateSearchParams) => [...candidateKeys.lists(), params] as const,
  details: () => [...candidateKeys.all, 'detail'] as const,
  detail: (id: string) => [...candidateKeys.details(), id] as const,
  activities: (id: string) => [...candidateKeys.all, 'activities', id] as const,
  byJob: (jobId: string) => [...candidateKeys.all, 'byJob', jobId] as const,
};

export function useCandidates(params?: CandidateSearchParams) {
  return useQuery({
    queryKey: candidateKeys.list(params),
    queryFn: () => candidatesService.getAll(params),
  });
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: candidateKeys.detail(id),
    queryFn: () => candidatesService.getById(id),
    enabled: !!id,
  });
}

export function useCandidateActivities(id: string) {
  return useQuery({
    queryKey: candidateKeys.activities(id),
    queryFn: () => candidatesService.getActivities(id),
    enabled: !!id,
  });
}

export function useCandidatesByJob(jobId: string) {
  return useQuery({
    queryKey: candidateKeys.byJob(jobId),
    queryFn: () => candidatesService.getByJob(jobId),
    enabled: !!jobId,
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCandidateData) => candidatesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
    },
  });
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCandidateData> }) =>
      candidatesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
    },
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      candidatesService.uploadResume(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(id) });
    },
  });
}

export function useUpdateCandidateStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stageId, jobId }: { id: string; stageId: string; jobId: string }) =>
      candidatesService.updateStage(id, stageId, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.all });
    },
  });
}

export function useUpdateCandidateScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, score }: { id: string; score: number }) =>
      candidatesService.updateScore(id, score),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
    },
  });
}
