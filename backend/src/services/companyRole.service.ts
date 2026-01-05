/**
 * Company Role Service
 * 
 * Handles CRUD operations for custom company roles
 */

import prisma from '../lib/prisma.js';
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js';

export interface CompanyRole {
    id: string;
    companyId: string;
    name: string;
    description: string | null;
    permissions: string[];
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface CreateRoleData {
    companyId: string;
    name: string;
    description?: string;
    permissions?: string[];
}

interface UpdateRoleData {
    name?: string;
    description?: string;
    permissions?: string[];
}

// Default roles that every company should have
const DEFAULT_ROLES = [
    { name: 'Admin', description: 'Full access to all features', isDefault: true, permissions: ['all'] },
    { name: 'Recruiter', description: 'Can manage candidates and job postings', isDefault: true, permissions: ['jobs:read', 'jobs:write', 'candidates:read', 'candidates:write'] },
    { name: 'Hiring Manager', description: 'Can view and manage assigned jobs', isDefault: true, permissions: ['jobs:read', 'candidates:read', 'interviews:read', 'interviews:write'] },
];

export const companyRoleService = {
    /**
     * Get all roles for a company
     */
    async getAll(companyId: string): Promise<CompanyRole[]> {
        const roles = await prisma.companyRole.findMany({
            where: { companyId },
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        });

        return roles.map((r) => ({
            id: r.id,
            companyId: r.companyId,
            name: r.name,
            description: r.description,
            permissions: Array.isArray(r.permissions) ? r.permissions as string[] : [],
            isDefault: r.isDefault,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        }));
    },

    /**
     * Get a role by ID
     */
    async getById(id: string): Promise<CompanyRole> {
        const role = await prisma.companyRole.findUnique({
            where: { id },
        });

        if (!role) {
            throw new NotFoundError('Company Role');
        }

        return {
            id: role.id,
            companyId: role.companyId,
            name: role.name,
            description: role.description,
            permissions: Array.isArray(role.permissions) ? role.permissions as string[] : [],
            isDefault: role.isDefault,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        };
    },

    /**
     * Create a new custom role
     */
    async create(data: CreateRoleData): Promise<CompanyRole> {
        // Check if role with same name exists
        const existing = await prisma.companyRole.findFirst({
            where: {
                companyId: data.companyId,
                name: { equals: data.name, mode: 'insensitive' },
            },
        });

        if (existing) {
            throw new ConflictError('Role with this name already exists');
        }

        const role = await prisma.companyRole.create({
            data: {
                companyId: data.companyId,
                name: data.name.trim(),
                description: data.description?.trim(),
                permissions: data.permissions || [],
                isDefault: false,
            },
        });

        return {
            id: role.id,
            companyId: role.companyId,
            name: role.name,
            description: role.description,
            permissions: Array.isArray(role.permissions) ? role.permissions as string[] : [],
            isDefault: role.isDefault,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        };
    },

    /**
     * Update a role
     */
    async update(id: string, data: UpdateRoleData): Promise<CompanyRole> {
        const existing = await prisma.companyRole.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundError('Company Role');
        }

        // Don't allow editing default roles' names
        if (existing.isDefault && data.name && data.name !== existing.name) {
            throw new ConflictError('Cannot change name of default roles');
        }

        // Check for name conflict if changing name
        if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
            const nameConflict = await prisma.companyRole.findFirst({
                where: {
                    companyId: existing.companyId,
                    name: { equals: data.name, mode: 'insensitive' },
                    id: { not: id },
                },
            });

            if (nameConflict) {
                throw new ConflictError('Role with this name already exists');
            }
        }

        const role = await prisma.companyRole.update({
            where: { id },
            data: {
                name: data.name?.trim(),
                description: data.description?.trim(),
                permissions: data.permissions,
            },
        });

        return {
            id: role.id,
            companyId: role.companyId,
            name: role.name,
            description: role.description,
            permissions: Array.isArray(role.permissions) ? role.permissions as string[] : [],
            isDefault: role.isDefault,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        };
    },

    /**
     * Delete a role
     */
    async delete(id: string): Promise<void> {
        const existing = await prisma.companyRole.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundError('Company Role');
        }

        if (existing.isDefault) {
            throw new ConflictError('Cannot delete default roles');
        }

        await prisma.companyRole.delete({
            where: { id },
        });
    },

    /**
     * Initialize default roles for a new company
     */
    async initializeDefaultRoles(companyId: string): Promise<CompanyRole[]> {
        const existingRoles = await prisma.companyRole.findMany({
            where: { companyId },
        });

        if (existingRoles.length > 0) {
            return existingRoles.map((r) => ({
                id: r.id,
                companyId: r.companyId,
                name: r.name,
                description: r.description,
                permissions: Array.isArray(r.permissions) ? r.permissions as string[] : [],
                isDefault: r.isDefault,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
            }));
        }

        // Create default roles
        const createdRoles = await Promise.all(
            DEFAULT_ROLES.map((role) =>
                prisma.companyRole.create({
                    data: {
                        companyId,
                        name: role.name,
                        description: role.description,
                        permissions: role.permissions,
                        isDefault: role.isDefault,
                    },
                })
            )
        );

        return createdRoles.map((r) => ({
            id: r.id,
            companyId: r.companyId,
            name: r.name,
            description: r.description,
            permissions: Array.isArray(r.permissions) ? r.permissions as string[] : [],
            isDefault: r.isDefault,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        }));
    },
};

export default companyRoleService;
