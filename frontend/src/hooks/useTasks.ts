import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '../services/tasks.service';
import type { Task, CreateTaskData, TaskStatus } from '../services/tasks.service';
import { useAuth } from './useAuth';

export const taskKeys = {
    all: ['tasks'] as const,
    // Include userId in key for proper user isolation
    list: (userId?: string, status?: TaskStatus) => [...taskKeys.all, 'list', userId, status] as const,
    byUser: (userId: string) => [...taskKeys.all, 'user', userId] as const,
};

export function useTasks() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch all tasks for the current user - include userId in query key for isolation
    const tasksQuery = useQuery({
        queryKey: taskKeys.byUser(user?.id || ''),
        queryFn: () => tasksService.getAll(),
        enabled: !!user?.id, // Only fetch when user is authenticated
        staleTime: 0, // Always refetch to ensure fresh data
    });

    // Create Task Mutation
    const createTask = useMutation({
        mutationFn: (data: CreateTaskData) => tasksService.create(data),
        onSuccess: () => {
            // Invalidate user-specific tasks query
            if (user?.id) {
                queryClient.invalidateQueries({ queryKey: taskKeys.byUser(user.id) });
            }
        },
    });

    // Toggle Task Status Mutation (Complete/Reopen)
    const toggleTask = useMutation({
        mutationFn: async (task: Task) => {
            if (task.status === 'open') {
                return tasksService.complete(task.id);
            } else {
                return tasksService.reopen(task.id);
            }
        },
        onSuccess: () => {
            // Invalidate user-specific tasks query
            if (user?.id) {
                queryClient.invalidateQueries({ queryKey: taskKeys.byUser(user.id) });
            }
        },
    });

    // Delete Task Mutation
    const deleteTask = useMutation({
        mutationFn: (id: string) => tasksService.delete(id),
        onSuccess: () => {
            // Invalidate user-specific tasks query
            if (user?.id) {
                queryClient.invalidateQueries({ queryKey: taskKeys.byUser(user.id) });
            }
        },
    });

    return {
        tasks: tasksQuery.data || [],
        isLoading: tasksQuery.isLoading,
        isError: tasksQuery.isError,
        createTask,
        toggleTask,
        deleteTask,
    };
}
