import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import type { User, UserRole } from '../types/index.js';

const SALT_ROUNDS = 10;

// Type for Prisma user result
interface PrismaUserResult {
  id: string;
  companyId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  companyRoleId: string | null;
  companyRole: {
    id: string;
    name: string;
  } | null;
}

export interface CreateUserData {
  companyId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  companyRoleId?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
  companyRoleId?: string | null;
}

function mapPrismaUserToUser(user: PrismaUserResult): User {
  return {
    id: user.id,
    companyId: user.companyId,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    isActive: user.isActive,
    companyRoleId: user.companyRoleId,
    companyRole: user.companyRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const userService = {
  /**
   * Create a new user with hashed password
   * Requirements: 4.1
   */
  async create(data: CreateUserData): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        companyRoleId: data.companyRoleId,
      },
      include: {
        companyRole: {
          select: { id: true, name: true }
        }
      }
    });

    return mapPrismaUserToUser(user as PrismaUserResult);
  },

  /**
   * Get a user by ID
   */
  async getById(id: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        companyRole: {
          select: { id: true, name: true }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return mapPrismaUserToUser(user as PrismaUserResult);
  },

  /**
   * Get a user by email
   */
  async getByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        companyRole: {
          select: { id: true, name: true }
        }
      }
    });

    if (!user) {
      return null;
    }

    return mapPrismaUserToUser(user as PrismaUserResult);
  },

  /**
   * Update a user
   * Requirements: 4.2
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('User');
    }

    // Prepare update data
    const updateData: {
      name?: string;
      email?: string;
      role?: UserRole;
      isActive?: boolean;
      passwordHash?: string;
      companyRoleId?: string | null;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    }
    if (data.companyRoleId !== undefined) {
      // @ts-ignore
      updateData.companyRoleId = data.companyRoleId;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        companyRole: {
          select: { id: true, name: true }
        }
      }
    });

    return mapPrismaUserToUser(user as PrismaUserResult);
  },

  /**
   * Deactivate a user (soft delete)
   * Requirements: 4.3
   */
  async deactivate(id: string): Promise<User> {
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
      include: {
        companyRole: {
          select: { id: true, name: true }
        }
      }
    });

    return mapPrismaUserToUser(user as PrismaUserResult);
  },

  /**
   * Delete a user (hard delete)
   */
  async delete(id: string): Promise<void> {
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
  async getAllByCompany(companyId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        companyRole: {
          select: { id: true, name: true }
        }
      }
    });

    return users.map((u: PrismaUserResult) => mapPrismaUserToUser(u));
  },

  /**
   * Get all users (admin only)
   */
  async getAll(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        companyRole: {
          select: { id: true, name: true }
        }
      }
    });

    return users.map((u: PrismaUserResult) => mapPrismaUserToUser(u));
  },

  /**
   * Check if user is active
   */
  async isActive(id: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true },
    });

    return user?.isActive ?? false;
  },
};

export default userService;
