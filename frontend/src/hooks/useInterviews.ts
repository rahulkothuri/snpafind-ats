/**
 * Interview Hooks
 * 
 * React Query hooks for interview management including scheduling,
 * rescheduling, cancellation, and querying interviews.
 * 
 * Requirements: 1.3, 8.3, 8.5
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewsService } from '../services';
import type { 
  CreateInterviewInput, 
  UpdateInterviewInput, 
  InterviewFilters,
  FeedbackRating,
  InterviewRecommendation
} from '../services/interviews.service';

// Query keys for cache management
export const interviewKeys = {
  all: ['interviews'] as const,
  lists: () => [...interviewKeys.all, 'list'] as const,
  list: (filters?: InterviewFilters) => [...interviewKeys.lists(), { filters }] as const,
  details: () => [...interviewKeys.all, 'detail'] as const,
  detail: (id: string) => [...interviewKeys.details(), id] as const,
  dashboard: () => [...interviewKeys.all, 'dashboard'] as const,
  panelLoad: (period: 'week' | 'month') => [...interviewKeys.all, 'panelLoad', period] as const,
  pendingFeedback: () => [...interviewKeys.all, 'pendingFeedback'] as const,
  feedback: (interviewId: string) => [...interviewKeys.all, 'feedback', interviewId] as const,
  timezones: () => ['timezones'] as const,
};

/**
 * Hook to fetch list of interviews with optional filters
 * Requirements: 17.2
 */
export function useInterviews(filters?: InterviewFilters) {
  return useQuery({
    queryKey: interviewKeys.list(filters),
    queryFn: () => interviewsService.list(filters),
  });
}

/**
 * Hook to fetch a single interview by ID
 */
export function useInterview(id: string) {
  return useQuery({
    queryKey: interviewKeys.detail(id),
    queryFn: () => interviewsService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch dashboard interviews (today, tomorrow, this week, pending feedback)
 * Requirements: 11.1, 11.2, 12.1
 */
export function useInterviewDashboard() {
  return useQuery({
    queryKey: interviewKeys.dashboard(),
    queryFn: () => interviewsService.getDashboard(),
  });
}

/**
 * Hook to fetch panel load distribution
 * Requirements: 13.1, 13.2
 */
export function usePanelLoad(period: 'week' | 'month' = 'week') {
  return useQuery({
    queryKey: interviewKeys.panelLoad(period),
    queryFn: () => interviewsService.getPanelLoad(period),
  });
}

/**
 * Hook to fetch pending feedback for current user
 * Requirements: 14.2
 */
export function usePendingFeedback() {
  return useQuery({
    queryKey: interviewKeys.pendingFeedback(),
    queryFn: () => interviewsService.getPendingFeedback(),
  });
}

/**
 * Hook to fetch feedback for an interview
 * Requirements: 14.5
 */
export function useInterviewFeedback(interviewId: string) {
  return useQuery({
    queryKey: interviewKeys.feedback(interviewId),
    queryFn: () => interviewsService.getFeedback(interviewId),
    enabled: !!interviewId,
  });
}

/**
 * Hook to fetch available timezones
 * Requirements: 3.1
 */
export function useTimezones() {
  return useQuery({
    queryKey: interviewKeys.timezones(),
    queryFn: () => interviewsService.getTimezones(),
    staleTime: Infinity, // Timezones don't change
  });
}

/**
 * Hook to create a new interview
 * Requirements: 1.3
 */
export function useCreateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInterviewInput) => interviewsService.create(data),
    onSuccess: () => {
      // Invalidate all interview-related queries
      queryClient.invalidateQueries({ queryKey: interviewKeys.lists() });
      queryClient.invalidateQueries({ queryKey: interviewKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: interviewKeys.panelLoad('week') });
      queryClient.invalidateQueries({ queryKey: interviewKeys.panelLoad('month') });
    },
  });
}

/**
 * Hook to update/reschedule an interview
 * Requirements: 8.3
 */
export function useUpdateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInterviewInput }) =>
      interviewsService.update(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific interview and lists
      queryClient.invalidateQueries({ queryKey: interviewKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: interviewKeys.lists() });
      queryClient.invalidateQueries({ queryKey: interviewKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: interviewKeys.panelLoad('week') });
      queryClient.invalidateQueries({ queryKey: interviewKeys.panelLoad('month') });
    },
  });
}

/**
 * Hook to cancel an interview
 * Requirements: 8.5
 */
export function useCancelInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      interviewsService.cancel(id, reason),
    onSuccess: (_, { id }) => {
      // Invalidate specific interview and lists
      queryClient.invalidateQueries({ queryKey: interviewKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: interviewKeys.lists() });
      queryClient.invalidateQueries({ queryKey: interviewKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: interviewKeys.panelLoad('week') });
      queryClient.invalidateQueries({ queryKey: interviewKeys.panelLoad('month') });
    },
  });
}

/**
 * Hook to submit feedback for an interview
 * Requirements: 9.2
 */
export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      interviewId,
      ratings,
      overallComments,
      recommendation,
    }: {
      interviewId: string;
      ratings: FeedbackRating[];
      overallComments: string;
      recommendation: InterviewRecommendation;
    }) =>
      interviewsService.submitFeedback(interviewId, {
        ratings,
        overallComments,
        recommendation,
      }),
    onSuccess: (_, { interviewId }) => {
      // Invalidate feedback and pending feedback queries
      queryClient.invalidateQueries({ queryKey: interviewKeys.feedback(interviewId) });
      queryClient.invalidateQueries({ queryKey: interviewKeys.detail(interviewId) });
      queryClient.invalidateQueries({ queryKey: interviewKeys.pendingFeedback() });
      queryClient.invalidateQueries({ queryKey: interviewKeys.dashboard() });
    },
  });
}
