/**
 * Task Service - Dashboard task management
 *
 * Handles CRUD operations for user tasks
 */
import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
// Helper to format relative time
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1)
        return 'Just now';
    if (diffMins < 60)
        return `${diffMins}m`;
    if (diffHours < 24)
        return `${diffHours}h`;
    if (diffDays < 7)
        return `${diffDays}d`;
    return `${Math.floor(diffDays / 7)}w`;
}
export const taskService = {
    /**
     * Get all tasks for a user
     */
    async getByUserId(userId, companyId, status) {
        const where = {
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
    async getById(id, userId) {
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
    async create(userId, companyId, data) {
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
    async update(id, userId, data) {
        const existing = await prisma.task.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            throw new NotFoundError('Task');
        }
        const updateData = {};
        if (data.type !== undefined)
            updateData.type = data.type;
        if (data.text !== undefined)
            updateData.text = data.text.trim();
        if (data.severity !== undefined)
            updateData.severity = data.severity;
        if (data.status !== undefined) {
            updateData.status = data.status;
            // Set completedAt when closing, clear when reopening
            if (data.status === 'closed') {
                updateData.completedAt = new Date();
            }
            else {
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
    async complete(id, userId) {
        return this.update(id, userId, { status: 'closed' });
    },
    /**
     * Reopen a task
     */
    async reopen(id, userId) {
        return this.update(id, userId, { status: 'open' });
    },
    /**
     * Delete a task
     */
    async delete(id, userId) {
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
    mapToTask(task) {
        return {
            id: task.id,
            companyId: task.companyId,
            userId: task.userId,
            type: task.type,
            text: task.text,
            severity: task.severity,
            status: task.status,
            completedAt: task.completedAt || undefined,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            age: formatRelativeTime(task.createdAt),
        };
    },
};
export default taskService;
//# sourceMappingURL=task.service.js.map