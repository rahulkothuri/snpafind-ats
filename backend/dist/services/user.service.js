import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { NotFoundError } from '../middleware/errorHandler.js';
const SALT_ROUNDS = 10;
function mapPrismaUserToUser(user) {
    return {
        id: user.id,
        companyId: user.companyId,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
export const userService = {
    /**
     * Create a new user with hashed password
     * Requirements: 4.1
     */
    async create(data) {
        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                companyId: data.companyId,
                name: data.name,
                email: data.email,
                passwordHash,
                role: data.role,
            },
        });
        return mapPrismaUserToUser(user);
    },
    /**
     * Get a user by ID
     */
    async getById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new NotFoundError('User');
        }
        return mapPrismaUserToUser(user);
    },
    /**
     * Get a user by email
     */
    async getByEmail(email) {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return null;
        }
        return mapPrismaUserToUser(user);
    },
    /**
     * Update a user
     * Requirements: 4.2
     */
    async update(id, data) {
        // Check if user exists
        const existing = await prisma.user.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new NotFoundError('User');
        }
        // Prepare update data
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.role !== undefined)
            updateData.role = data.role;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        if (data.password !== undefined) {
            updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
        }
        const user = await prisma.user.update({
            where: { id },
            data: updateData,
        });
        return mapPrismaUserToUser(user);
    },
    /**
     * Deactivate a user (soft delete)
     * Requirements: 4.3
     */
    async deactivate(id) {
        // Check if user exists
        const existing = await prisma.user.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new NotFoundError('User');
        }
        const user = await prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
        return mapPrismaUserToUser(user);
    },
    /**
     * Delete a user (hard delete)
     */
    async delete(id) {
        // Check if user exists
        const existing = await prisma.user.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new NotFoundError('User');
        }
        await prisma.user.delete({
            where: { id },
        });
    },
    /**
     * Get all users for a company
     * Requirements: 4.4
     */
    async getAllByCompany(companyId) {
        const users = await prisma.user.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
        });
        return users.map((u) => mapPrismaUserToUser(u));
    },
    /**
     * Get all users (admin only)
     */
    async getAll() {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return users.map((u) => mapPrismaUserToUser(u));
    },
    /**
     * Check if user is active
     */
    async isActive(id) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { isActive: true },
        });
        return user?.isActive ?? false;
    },
};
export default userService;
//# sourceMappingURL=user.service.js.map