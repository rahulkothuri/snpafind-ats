import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js';
import type { Vendor, CreateVendorInput, UpdateVendorInput } from '../types/index.js';

const SALT_ROUNDS = 10;

/**
 * Vendor Service
 * Handles vendor user management and job assignments
 * Requirements: 7.3, 10.1, 10.4
 */
export const vendorService = {
  /**
   * Create a new vendor user with job assignments
   * Requirements: 7.3, 10.1, 10.4
   */
  async createVendor(data: CreateVendorInput): Promise<Vendor> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('A user with this email already exists', { field: 'email' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create vendor user and job assignments in a transaction
    const vendor = await prisma.$transaction(async (tx) => {
      // Create the vendor user
      const user = await tx.user.create({
        data: {
          companyId: data.companyId,
          name: data.name,
          email: data.email,
          passwordHash,
          role: 'vendor',
        },
      });

      // Create job assignments if provided
      if (data.assignedJobIds && data.assignedJobIds.length > 0) {
        // Verify all jobs exist and belong to the same company
        const jobs = await tx.job.findMany({
          where: {
            id: { in: data.assignedJobIds },
            companyId: data.companyId,
          },
        });

        if (jobs.length !== data.assignedJobIds.length) {
          throw new NotFoundError('One or more jobs not found or do not belong to this company');
        }

        // Create vendor job assignments
        await tx.vendorJobAssignment.createMany({
          data: data.assignedJobIds.map((jobId) => ({
            vendorId: user.id,
            jobId,
          })),
        });
      }

      // Fetch the complete vendor with assignments
      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          vendorJobAssignments: {
            include: {
              job: {
                select: { id: true, title: true },
              },
            },
          },
        },
      });
    });

    return this.mapToVendor(vendor);
  },

  /**
   * Get all vendors for a company
   * Requirements: 7.2
   */
  async getVendors(companyId: string): Promise<Vendor[]> {
    const vendors = await prisma.user.findMany({
      where: {
        companyId,
        role: 'vendor',
      },
      include: {
        vendorJobAssignments: {
          include: {
            job: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return vendors.map((v) => this.mapToVendor(v));
  },

  /**
   * Get a vendor by ID
   */
  async getVendorById(id: string, companyId: string): Promise<Vendor> {
    const vendor = await prisma.user.findFirst({
      where: {
        id,
        companyId,
        role: 'vendor',
      },
      include: {
        vendorJobAssignments: {
          include: {
            job: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundError('Vendor');
    }

    return this.mapToVendor(vendor);
  },

  /**
   * Update a vendor
   * Requirements: 7.7
   */
  async updateVendor(id: string, companyId: string, data: UpdateVendorInput): Promise<Vendor> {
    // Check if vendor exists
    const existing = await prisma.user.findFirst({
      where: {
        id,
        companyId,
        role: 'vendor',
      },
    });

    if (!existing) {
      throw new NotFoundError('Vendor');
    }

    // Check email uniqueness if updating email
    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists) {
        throw new ConflictError('A user with this email already exists', { field: 'email' });
      }
    }

    // Update vendor and job assignments in a transaction
    const vendor = await prisma.$transaction(async (tx) => {
      // Update user fields
      const updateData: { name?: string; email?: string; isActive?: boolean } = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      await tx.user.update({
        where: { id },
        data: updateData,
      });

      // Update job assignments if provided
      if (data.assignedJobIds !== undefined) {
        // Verify all jobs exist and belong to the same company
        if (data.assignedJobIds.length > 0) {
          const jobs = await tx.job.findMany({
            where: {
              id: { in: data.assignedJobIds },
              companyId,
            },
          });

          if (jobs.length !== data.assignedJobIds.length) {
            throw new NotFoundError('One or more jobs not found or do not belong to this company');
          }
        }

        // Delete existing assignments
        await tx.vendorJobAssignment.deleteMany({
          where: { vendorId: id },
        });

        // Create new assignments
        if (data.assignedJobIds.length > 0) {
          await tx.vendorJobAssignment.createMany({
            data: data.assignedJobIds.map((jobId) => ({
              vendorId: id,
              jobId,
            })),
          });
        }
      }

      // Fetch updated vendor
      return tx.user.findUnique({
        where: { id },
        include: {
          vendorJobAssignments: {
            include: {
              job: {
                select: { id: true, title: true },
              },
            },
          },
        },
      });
    });

    return this.mapToVendor(vendor);
  },

  /**
   * Delete a vendor (hard delete)
   */
  async deleteVendor(id: string, companyId: string): Promise<void> {
    // Check if vendor exists
    const existing = await prisma.user.findFirst({
      where: {
        id,
        companyId,
        role: 'vendor',
      },
    });

    if (!existing) {
      throw new NotFoundError('Vendor');
    }

    // Delete vendor (cascade will delete job assignments)
    await prisma.user.delete({
      where: { id },
    });
  },

  /**
   * Deactivate a vendor (soft delete)
   * Requirements: 7.8
   */
  async deactivateVendor(id: string, companyId: string): Promise<Vendor> {
    const vendor = await this.updateVendor(id, companyId, { isActive: false });
    return vendor;
  },

  /**
   * Assign jobs to a vendor
   * Requirements: 10.4
   */
  async assignJobsToVendor(vendorId: string, companyId: string, jobIds: string[]): Promise<Vendor> {
    // Check if vendor exists
    const vendor = await prisma.user.findFirst({
      where: {
        id: vendorId,
        companyId,
        role: 'vendor',
      },
    });

    if (!vendor) {
      throw new NotFoundError('Vendor');
    }

    // Verify all jobs exist and belong to the same company
    const jobs = await prisma.job.findMany({
      where: {
        id: { in: jobIds },
        companyId,
      },
    });

    if (jobs.length !== jobIds.length) {
      throw new NotFoundError('One or more jobs not found or do not belong to this company');
    }

    // Add new job assignments (skip existing ones)
    await prisma.$transaction(async (tx) => {
      for (const jobId of jobIds) {
        await tx.vendorJobAssignment.upsert({
          where: {
            vendorId_jobId: {
              vendorId,
              jobId,
            },
          },
          create: {
            vendorId,
            jobId,
          },
          update: {}, // No update needed, just ensure it exists
        });
      }
    });

    return this.getVendorById(vendorId, companyId);
  },

  /**
   * Remove job assignment from a vendor
   */
  async removeJobAssignment(vendorId: string, companyId: string, jobId: string): Promise<Vendor> {
    // Check if vendor exists
    const vendor = await prisma.user.findFirst({
      where: {
        id: vendorId,
        companyId,
        role: 'vendor',
      },
    });

    if (!vendor) {
      throw new NotFoundError('Vendor');
    }

    // Delete the assignment
    await prisma.vendorJobAssignment.deleteMany({
      where: {
        vendorId,
        jobId,
      },
    });

    return this.getVendorById(vendorId, companyId);
  },

  /**
   * Get job IDs assigned to a vendor
   * Requirements: 10.2, 10.3
   */
  async getVendorJobIds(vendorId: string): Promise<string[]> {
    const assignments = await prisma.vendorJobAssignment.findMany({
      where: { vendorId },
      select: { jobId: true },
    });

    return assignments.map((a) => a.jobId);
  },

  /**
   * Check if a vendor has access to a specific job
   * Requirements: 7.4, 7.6
   */
  async hasJobAccess(vendorId: string, jobId: string): Promise<boolean> {
    const assignment = await prisma.vendorJobAssignment.findUnique({
      where: {
        vendorId_jobId: {
          vendorId,
          jobId,
        },
      },
    });

    return !!assignment;
  },

  /**
   * Map Prisma result to Vendor type
   */
  mapToVendor(user: any): Vendor {
    const assignedJobs = user.vendorJobAssignments?.map((vja: any) => ({
      id: vja.job.id,
      title: vja.job.title,
    })) || [];

    return {
      id: user.id,
      companyId: user.companyId,
      name: user.name,
      email: user.email,
      role: 'vendor',
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      assignedJobs,
      vendorJobAssignments: user.vendorJobAssignments?.map((vja: any) => ({
        id: vja.id,
        vendorId: vja.vendorId,
        jobId: vja.jobId,
        createdAt: vja.createdAt,
        job: vja.job,
      })),
    };
  },
};

export default vendorService;
