import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import type { PipelineStage } from '../types/index.js';

// Type for Prisma stage result
interface PrismaStageResult {
  id: string;
  jobId: string;
  name: string;
  position: number;
  isDefault: boolean;
  isMandatory: boolean;
  parentId: string | null;
  createdAt: Date;
}

export interface CreateStageData {
  jobId: string;
  name: string;
  position: number;
}

export interface ReorderStageData {
  stageId: string;
  newPosition: number;
}

export const pipelineService = {
  /**
   * Get all stages for a job
   * Requirements: 6.3
   */
  async getStagesByJobId(jobId: string): Promise<PipelineStage[]> {
    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError('Job');
    }

    const stages = await prisma.pipelineStage.findMany({
      where: { jobId },
      orderBy: { position: 'asc' },
    });

    return stages.map((s: PrismaStageResult) => this.mapToStage(s));
  },

  /**
   * Insert a custom sub-stage at a specific position
   * Requirements: 6.2
   */
  async insertStage(data: CreateStageData): Promise<PipelineStage> {
    // Validate input
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError({ name: ['Stage name is required'] });
    }

    if (data.position < 0) {
      throw new ValidationError({ position: ['Position must be non-negative'] });
    }

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
    });

    if (!job) {
      throw new NotFoundError('Job');
    }

    // Get current stages to validate position
    const existingStages = await prisma.pipelineStage.findMany({
      where: { jobId: data.jobId },
      orderBy: { position: 'asc' },
    });

    // Position should be within valid range (0 to count)
    if (data.position > existingStages.length) {
      throw new ValidationError({ 
        position: [`Position must be between 0 and ${existingStages.length}`] 
      });
    }

    // Insert stage in a transaction to maintain position integrity
    const stage = await prisma.$transaction(async (tx: any) => {
      // Shift all stages at or after the target position
      await tx.pipelineStage.updateMany({
        where: {
          jobId: data.jobId,
          position: { gte: data.position },
        },
        data: {
          position: { increment: 1 },
        },
      });

      // Create the new stage at the specified position
      const newStage = await tx.pipelineStage.create({
        data: {
          jobId: data.jobId,
          name: data.name.trim(),
          position: data.position,
          isDefault: false, // Custom stages are not default
        },
      });

      return newStage;
    });

    return this.mapToStage(stage);
  },

  /**
   * Reorder a stage to a new position
   * Requirements: 6.4
   */
  async reorderStage(data: ReorderStageData): Promise<PipelineStage[]> {
    // Find the stage to move
    const stage = await prisma.pipelineStage.findUnique({
      where: { id: data.stageId },
    });

    if (!stage) {
      throw new NotFoundError('Pipeline stage');
    }

    const jobId = stage.jobId;
    const oldPosition = stage.position;
    const newPosition = data.newPosition;

    if (newPosition < 0) {
      throw new ValidationError({ newPosition: ['Position must be non-negative'] });
    }

    // Get all stages for the job
    const allStages = await prisma.pipelineStage.findMany({
      where: { jobId },
      orderBy: { position: 'asc' },
    });

    if (newPosition >= allStages.length) {
      throw new ValidationError({ 
        newPosition: [`Position must be between 0 and ${allStages.length - 1}`] 
      });
    }

    // If position hasn't changed, return current stages
    if (oldPosition === newPosition) {
      return allStages.map((s: PrismaStageResult) => this.mapToStage(s));
    }

    // Reorder in a transaction to maintain integrity
    await prisma.$transaction(async (tx: any) => {
      if (newPosition > oldPosition) {
        // Moving down: shift stages between old and new position up
        await tx.pipelineStage.updateMany({
          where: {
            jobId,
            position: { gt: oldPosition, lte: newPosition },
          },
          data: {
            position: { decrement: 1 },
          },
        });
      } else {
        // Moving up: shift stages between new and old position down
        await tx.pipelineStage.updateMany({
          where: {
            jobId,
            position: { gte: newPosition, lt: oldPosition },
          },
          data: {
            position: { increment: 1 },
          },
        });
      }

      // Update the moved stage's position
      await tx.pipelineStage.update({
        where: { id: data.stageId },
        data: { position: newPosition },
      });
    });

    // Return updated stages
    const updatedStages = await prisma.pipelineStage.findMany({
      where: { jobId },
      orderBy: { position: 'asc' },
    });

    return updatedStages.map((s: PrismaStageResult) => this.mapToStage(s));
  },

  /**
   * Delete a custom stage (cannot delete default stages)
   */
  async deleteStage(stageId: string): Promise<void> {
    const stage = await prisma.pipelineStage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundError('Pipeline stage');
    }

    if (stage.isDefault) {
      throw new ValidationError({ 
        stage: ['Cannot delete default pipeline stages'] 
      });
    }

    const jobId = stage.jobId;
    const position = stage.position;

    // Delete and reorder in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Delete the stage
      await tx.pipelineStage.delete({
        where: { id: stageId },
      });

      // Shift all stages after the deleted position
      await tx.pipelineStage.updateMany({
        where: {
          jobId,
          position: { gt: position },
        },
        data: {
          position: { decrement: 1 },
        },
      });
    });
  },

  /**
   * Map Prisma stage to PipelineStage type
   */
  mapToStage(stage: PrismaStageResult): PipelineStage {
    return {
      id: stage.id,
      jobId: stage.jobId,
      name: stage.name,
      position: stage.position,
      isDefault: stage.isDefault,
      isMandatory: stage.isMandatory,
      parentId: stage.parentId ?? undefined,
    };
  },
};

export default pipelineService;
