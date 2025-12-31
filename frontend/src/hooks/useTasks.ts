import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '../services/tasks.service';
import type { Task, CreateTaskData, TaskStatus } from '../services/tasks.service';
import { useAuth } from './useAuth';

export const taskKeys = {
    all: ['tasks'] as const,
    list: (status?: TaskStatus) => [...taskKeys.all, 'list', status] as const,
};

export function useTasks() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch all tasks (open and closed)
    const tasksQuery = useQuery({
        queryKey: taskKeys.all,
        queryFn: () => tasksService.getAll(),
        enabled: !!user,
    });

    // Create Task Mutation
    const createTask = useMutation({
        mutationFn: (data: CreateTaskData) => tasksService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
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
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
        },
    });

    // Delete Task Mutation
    const deleteTask = useMutation({
        mutationFn: (id: string) => tasksService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
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
