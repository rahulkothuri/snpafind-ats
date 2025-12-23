/**
 * Tasks Service - Dashboard task management API
 */

import api from './api';

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
  age: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
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

export const tasksService = {
  /**
   * Get all tasks for the current user
   */
  async getAll(status?: TaskStatus): Promise<Task[]> {
    const params = status ? { status } : {};
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  /**
   * Get a single task by ID
   */
  async getById(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  /**
   * Create a new task
   */
  async create(data: CreateTaskData): Promise<Task> {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  /**
   * Update a task
   */
  async update(id: string, data: UpdateTaskData): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  /**
   * Mark a task as complete
   */
  async complete(id: string): Promise<Task> {
    const response = await api.post(`/tasks/${id}/complete`);
    return response.data;
  },

  /**
   * Reopen a closed task
   */
  async reopen(id: string): Promise<Task> {
    const response = await api.post(`/tasks/${id}/reopen`);
    return response.data;
  },

  /**
   * Delete a task
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};

export default tasksService;
