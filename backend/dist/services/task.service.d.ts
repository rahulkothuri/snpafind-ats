/**
 * Task Service - Dashboard task management
 *
 * Handles CRUD operations for user tasks
 */
export type TaskType = 'feedback' | 'approval' | 'reminder' | 'pipeline';
export type TaskSeverity = 'high' | 'medium' | 'low';
export type TaskStatus = 'open' | 'closed';
export interface Task {
    id: string;
    companyId: string;
    userId: string;
    type: TaskType;
    text: string;
    severity: TaskSeverity;
    status: TaskStatus;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateTaskData {
    type: TaskType;
    text: string;
    severity?: TaskSeverity;
}
export interface UpdateTaskData {
    type?: TaskType;
    text?: string;
    severity?: TaskSeverity;
    status?: TaskStatus;
}
export declare const taskService: {
    /**
     * Get all tasks for a user
     */
    getByUserId(userId: string, companyId: string, status?: TaskStatus): Promise<Task[]>;
    /**
     * Get a single task by ID
     */
    getById(id: string, userId: string): Promise<Task>;
    /**
     * Create a new task
     */
    create(userId: string, companyId: string, data: CreateTaskData): Promise<Task>;
    /**
     * Update a task
     */
    update(id: string, userId: string, data: UpdateTaskData): Promise<Task>;
    /**
     * Complete a task
     */
    complete(id: string, userId: string): Promise<Task>;
    /**
     * Reopen a task
     */
    reopen(id: string, userId: string): Promise<Task>;
    /**
     * Delete a task
     */
    delete(id: string, userId: string): Promise<void>;
    /**
     * Map Prisma task to Task type with formatted age
     */
    mapToTask(task: {
        id: string;
        companyId: string;
        userId: string;
        type: string;
        text: string;
        severity: string;
        status: string;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }): Task & {
        age: string;
    };
};
export default taskService;
//# sourceMappingURL=task.service.d.ts.map