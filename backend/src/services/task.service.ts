/**
 * Task Service - Dashboard task management
 * 
 * Handles CRUD operations for user tasks
 */

import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

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

// Helper to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}w`;
}

export const taskService = {
  /**
   * Get all tasks for a user
   */
  async getByUserId(userId: string, companyId: string, status?: TaskStatus): Promise<Task[]> {
    const where: Record<string, unknown> = {
      userId,
      companyId,
    };

    if (status) {
      where.status = status;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // Open tasks first
        { createdAt: 'desc' },
      ],
    });

    return tasks.map(this.mapToTask);
  },

  /**
   * Get a single task by ID
   */
  async getById(id: string, userId: string): Promise<Task> {
    const task = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    return this.mapToTask(task);
  },

  /**
   * Create a new task
   */
  async create(userId: string, companyId: string, data: CreateTaskData): Promise<Task> {
    if (!data.text || data.text.trim() === '') {
      throw new ValidationError({ text: ['Task description is required'] });
    }

    const task = await prisma.task.create({
      data: {
        userId,
        companyId,
        type: data.type,
        text: data.text.trim(),
        severity: data.severity || 'medium',
        status: 'open',
      },
    });

    return this.mapToTask(task);
  },

  /**
   * Update a task
   */
  async update(id: string, userId: string, data: UpdateTaskData): Promise<Task> {
    const existing = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Task');
    }

    const updateData: Record<string, unknown> = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.text !== undefined) updateData.text = data.text.trim();
    if (data.severity !== undefined) updateData.severity = data.severity;
    if (data.status !== undefined) {
      updateData.status = data.status;
      // Set completedAt when closing, clear when reopening
      if (data.status === 'closed') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return this.mapToTask(task);
  },

  /**
   * Complete a task
   */
  async complete(id: string, userId: string): Promise<Task> {
    return this.update(id, userId, { status: 'closed' });
  },

  /**
   * Reopen a task
   */
  async reopen(id: string, userId: string): Promise<Task> {
    return this.update(id, userId, { status: 'open' });
  },

  /**
   * Delete a task
   */
  async delete(id: string, userId: string): Promise<void> {
    const existing = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Task');
    }

    await prisma.task.delete({
      where: { id },
    });
  },

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
  }): Task & { age: string } {
    return {
      id: task.id,
      companyId: task.companyId,
      userId: task.userId,
      type: task.type as TaskType,
      text: task.text,
      severity: task.severity as TaskSeverity,
      status: task.status as TaskStatus,
      completedAt: task.completedAt || undefined,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      age: formatRelativeTime(task.createdAt),
    };
  },
};

export default taskService;
