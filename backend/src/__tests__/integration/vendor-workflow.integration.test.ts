/**
 * Integration Test: Vendor Workflow
 * **Validates: Requirements 7.4, 7.6, 10.2, 10.3**
 * 
 * Tests the vendor workflow:
 * 1. Create vendor with job assignments
 * 2. Verify vendor can access assigned jobs
 * 3. Verify vendor cannot access unassigned jobs
 * 4. Verify vendor can access candidates in assigned jobs
 * 5. Verify vendor cannot access candidates in unassigned jobs
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../lib/prisma.js';
import vendorService from '../../services/vendor.service.js';

// Test data
let testCompanyId: string;
let testVendorId: string;
let assignedJobId: string;
let unassignedJobId: string;
let assignedJobCandidateId: string;
let unassignedJobCandidateId: string;
let candidateInAssignedJobId: string;
let candidateInUnassignedJobId: string;

beforeAll(async () => {
  // Create a test company
  const company = await prisma.company.create({
    data: {
      name: 'Vendor Workflow Test Company',
      contactEmail: 'test@vendorworkflow.com',
    },
  });
  testCompanyId = company.id;

  // Create two jobs - one will be assigned to vendor, one will not
  const assignedJob = await prisma.job.create({
    data: {
      companyId: testCompanyId,
      title: 'Assigned Job',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'Full-time',
      description: 'Job assigned to vendor',
      status: 'active',
    },
  });
  assignedJobId = assignedJob.id;

  const unassignedJob = await prisma.job.create({
    data: {
      companyId: testCompanyId,
      title: 'Unassigned Job',
      department: 'Marketing',
      location: 'Remote',
      employmentType: 'Full-time',
      description: 'Job NOT assigned to vendor',
      status: 'active',
    },
  });
  unassignedJobId = unassignedJob.id;

  // Create pipeline stages for both jobs
  const assignedJobStage = await prisma.pipelineStage.create({
    data: { jobId: assignedJobId, name: 'Applied', position: 0, isDefault: true },
  });

  const unassignedJobStage = await prisma.pipelineStage.create({
    data: { jobId: unassignedJobId, name: 'Applied', position: 0, isDefault: true },
  });

  // Create candidates for each job
  const candidateInAssignedJob = await prisma.candidate.create({
    data: {
      companyId: testCompanyId,
      name: 'Candidate in Assigned Job',
      email: `assigned-job-candidate-${Date.now()}@test.com`,
      location: 'Test Location',
      source: 'Integration Test',
      experienceYears: 5,
    },
  });
  candidateInAssignedJobId = candidateInAssignedJob.id;

  const candidateInUnassignedJob = await prisma.candidate.create({
    data: {
      companyId: testCompanyId,
      name: 'Candidate in Unassigned Job',
      email: `unassigned-job-candidate-${Date.now()}@test.com`,
      location: 'Test Location',
      source: 'Integration Test',
      experienceYears: 3,
    },
  });
  candidateInUnassignedJobId = candidateInUnassignedJob.id;

  // Create job candidate associations
  const assignedJobCandidate = await prisma.jobCandidate.create({
    data: {
      jobId: assignedJobId,
      candidateId: candidateInAssignedJob.id,
      currentStageId: assignedJobStage.id,
    },
  });
  assignedJobCandidateId = assignedJobCandidate.id;

  const unassignedJobCandidate = await prisma.jobCandidate.create({
    data: {
      jobId: unassignedJobId,
      candidateId: candidateInUnassignedJob.id,
      currentStageId: unassignedJobStage.id,
    },
  });
  unassignedJobCandidateId = unassignedJobCandidate.id;
}, 60000);

afterAll(async () => {
  // Clean up in reverse order of creation
  try {
    // Delete vendor job assignments
    if (testVendorId) {
      await prisma.vendorJobAssignment.deleteMany({
        where: { vendorId: testVendorId },
      });
    }

    // Delete vendor user
    if (testVendorId) {
      await prisma.user.delete({
        where: { id: testVendorId },
      });
    }

    // Delete job candidates
    if (assignedJobCandidateId) {
      await prisma.jobCandidate.delete({
        where: { id: assignedJobCandidateId },
      });
    }
    if (unassignedJobCandidateId) {
      await prisma.jobCandidate.delete({
        where: { id: unassignedJobCandidateId },
      });
    }

    // Delete candidates
    if (candidateInAssignedJobId) {
      await prisma.candidate.delete({
        where: { id: candidateInAssignedJobId },
      });
    }
    if (candidateInUnassignedJobId) {
      await prisma.candidate.delete({
        where: { id: candidateInUnassignedJobId },
      });
    }

    // Delete pipeline stages
    await prisma.pipelineStage.deleteMany({
      where: { jobId: { in: [assignedJobId, unassignedJobId] } },
    });

    // Delete jobs
    if (assignedJobId) {
      await prisma.job.delete({
        where: { id: assignedJobId },
      });
    }
    if (unassignedJobId) {
      await prisma.job.delete({
        where: { id: unassignedJobId },
      });
    }

    // Delete company
    if (testCompanyId) {
      await prisma.company.delete({
        where: { id: testCompanyId },
      });
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 60000);

describe('Integration: Vendor Workflow', () => {
  /**
   * Test creating a vendor with job assignments
   * Requirements: 7.3, 10.1, 10.4
   */
  it('should create vendor with job assignments', async () => {
    const vendor = await vendorService.createVendor({
      companyId: testCompanyId,
      name: 'Test Vendor',
      email: `vendor-${Date.now()}@test.com`,
      password: 'testpassword123',
      assignedJobIds: [assignedJobId], // Only assign one job
    });

    testVendorId = vendor.id;

    // Verify vendor was created with correct role
    expect(vendor.id).toBeDefined();
    expect(vendor.role).toBe('vendor');
    expect(vendor.name).toBe('Test Vendor');
    expect(vendor.isActive).toBe(true);

    // Verify job assignment was created
    expect(vendor.assignedJobs!).toHaveLength(1);
    expect(vendor.assignedJobs![0].id).toBe(assignedJobId);
    expect(vendor.assignedJobs![0].title).toBe('Assigned Job');
  }, 30000);

  /**
   * Test vendor has access to assigned job
   * Requirements: 7.4, 10.2
   */
  it('should allow vendor access to assigned job', async () => {
    const hasAccess = await vendorService.hasJobAccess(testVendorId, assignedJobId);
    expect(hasAccess).toBe(true);
  }, 30000);

  /**
   * Test vendor does not have access to unassigned job
   * Requirements: 7.4, 10.2
   */
  it('should deny vendor access to unassigned job', async () => {
    const hasAccess = await vendorService.hasJobAccess(testVendorId, unassignedJobId);
    expect(hasAccess).toBe(false);
  }, 30000);

  /**
   * Test getting vendor job IDs
   * Requirements: 10.2, 10.3
   */
  it('should return only assigned job IDs for vendor', async () => {
    const jobIds = await vendorService.getVendorJobIds(testVendorId);

    expect(jobIds).toHaveLength(1);
    expect(jobIds).toContain(assignedJobId);
    expect(jobIds).not.toContain(unassignedJobId);
  }, 30000);

  /**
   * Test vendor can access candidates in assigned jobs
   * Requirements: 7.9, 10.3
   */
  it('should allow vendor to see candidates in assigned jobs', async () => {
    const vendorJobIds = await vendorService.getVendorJobIds(testVendorId);

    // Check if candidate in assigned job is accessible
    const jobCandidate = await prisma.jobCandidate.findFirst({
      where: {
        candidateId: candidateInAssignedJobId,
        jobId: { in: vendorJobIds },
      },
    });

    expect(jobCandidate).not.toBeNull();
    expect(jobCandidate?.candidateId).toBe(candidateInAssignedJobId);
  }, 30000);

  /**
   * Test vendor cannot access candidates in unassigned jobs
   * Requirements: 7.9, 10.3
   */
  it('should deny vendor access to candidates in unassigned jobs', async () => {
    const vendorJobIds = await vendorService.getVendorJobIds(testVendorId);

    // Check if candidate in unassigned job is NOT accessible
    const jobCandidate = await prisma.jobCandidate.findFirst({
      where: {
        candidateId: candidateInUnassignedJobId,
        jobId: { in: vendorJobIds },
      },
    });

    expect(jobCandidate).toBeNull();
  }, 30000);

  /**
   * Test updating vendor job assignments
   * Requirements: 10.5
   */
  it('should update vendor job assignments immediately', async () => {
    // Add the unassigned job to vendor
    const updatedVendor = await vendorService.updateVendor(testVendorId, testCompanyId, {
      assignedJobIds: [assignedJobId, unassignedJobId],
    });

    // Verify both jobs are now assigned
    expect(updatedVendor.assignedJobs!).toHaveLength(2);
    expect(updatedVendor.assignedJobs!.map(j => j.id)).toContain(assignedJobId);
    expect(updatedVendor.assignedJobs!.map(j => j.id)).toContain(unassignedJobId);

    // Verify vendor now has access to previously unassigned job
    const hasAccess = await vendorService.hasJobAccess(testVendorId, unassignedJobId);
    expect(hasAccess).toBe(true);

    // Verify vendor can now see candidate in previously unassigned job
    const vendorJobIds = await vendorService.getVendorJobIds(testVendorId);
    const jobCandidate = await prisma.jobCandidate.findFirst({
      where: {
        candidateId: candidateInUnassignedJobId,
        jobId: { in: vendorJobIds },
      },
    });
    expect(jobCandidate).not.toBeNull();
  }, 30000);

  /**
   * Test removing job assignment from vendor
   */
  it('should remove job assignment and update access immediately', async () => {
    // Remove the unassigned job from vendor
    const updatedVendor = await vendorService.updateVendor(testVendorId, testCompanyId, {
      assignedJobIds: [assignedJobId], // Only keep the originally assigned job
    });

    // Verify only one job is assigned
    expect(updatedVendor.assignedJobs!).toHaveLength(1);
    expect(updatedVendor.assignedJobs![0].id).toBe(assignedJobId);

    // Verify vendor no longer has access to removed job
    const hasAccess = await vendorService.hasJobAccess(testVendorId, unassignedJobId);
    expect(hasAccess).toBe(false);
  }, 30000);

  /**
   * Test deactivating vendor
   * Requirements: 7.8
   */
  it('should deactivate vendor while preserving data', async () => {
    const deactivatedVendor = await vendorService.deactivateVendor(testVendorId, testCompanyId);

    // Verify vendor is deactivated
    expect(deactivatedVendor.isActive).toBe(false);

    // Verify vendor data is preserved
    expect(deactivatedVendor.id).toBe(testVendorId);
    expect(deactivatedVendor.name).toBe('Test Vendor');
    expect(deactivatedVendor.assignedJobs).toHaveLength(1);

    // Reactivate for cleanup
    await vendorService.updateVendor(testVendorId, testCompanyId, { isActive: true });
  }, 30000);

  /**
   * Test vendor retrieval
   * Requirements: 7.2
   */
  it('should retrieve all vendors for a company', async () => {
    const vendors = await vendorService.getVendors(testCompanyId);

    expect(vendors.length).toBeGreaterThan(0);

    const testVendor = vendors.find(v => v.id === testVendorId);
    expect(testVendor).toBeDefined();
    expect(testVendor?.role).toBe('vendor');
    expect(testVendor?.assignedJobs).toBeDefined();
  }, 30000);

  /**
   * Test assigning additional jobs to vendor
   * Requirements: 10.4
   */
  it('should assign additional jobs to vendor', async () => {
    // First ensure vendor only has one job
    await vendorService.updateVendor(testVendorId, testCompanyId, {
      assignedJobIds: [assignedJobId],
    });

    // Assign additional job
    const updatedVendor = await vendorService.assignJobsToVendor(
      testVendorId,
      testCompanyId,
      [unassignedJobId]
    );

    // Verify both jobs are now assigned
    expect(updatedVendor.assignedJobs!).toHaveLength(2);
    expect(updatedVendor.assignedJobs!.map(j => j.id)).toContain(assignedJobId);
    expect(updatedVendor.assignedJobs!.map(j => j.id)).toContain(unassignedJobId);
  }, 30000);

  /**
   * Test removing specific job assignment
   */
  it('should remove specific job assignment from vendor', async () => {
    const updatedVendor = await vendorService.removeJobAssignment(
      testVendorId,
      testCompanyId,
      unassignedJobId
    );

    // Verify only one job remains
    expect(updatedVendor.assignedJobs!).toHaveLength(1);
    expect(updatedVendor.assignedJobs![0].id).toBe(assignedJobId);
  }, 30000);
});
