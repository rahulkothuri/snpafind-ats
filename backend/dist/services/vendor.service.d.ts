import type { Vendor, CreateVendorInput, UpdateVendorInput } from '../types/index.js';
/**
 * Vendor Service
 * Handles vendor user management and job assignments
 * Requirements: 7.3, 10.1, 10.4
 */
export declare const vendorService: {
    /**
     * Create a new vendor user with job assignments
     * Requirements: 7.3, 10.1, 10.4
     */
    createVendor(data: CreateVendorInput): Promise<Vendor>;
    /**
     * Get all vendors for a company
     * Requirements: 7.2
     */
    getVendors(companyId: string): Promise<Vendor[]>;
    /**
     * Get a vendor by ID
     */
    getVendorById(id: string, companyId: string): Promise<Vendor>;
    /**
     * Update a vendor
     * Requirements: 7.7
     */
    updateVendor(id: string, companyId: string, data: UpdateVendorInput): Promise<Vendor>;
    /**
     * Delete a vendor (hard delete)
     */
    deleteVendor(id: string, companyId: string): Promise<void>;
    /**
     * Deactivate a vendor (soft delete)
     * Requirements: 7.8
     */
    deactivateVendor(id: string, companyId: string): Promise<Vendor>;
    /**
     * Assign jobs to a vendor
     * Requirements: 10.4
     */
    assignJobsToVendor(vendorId: string, companyId: string, jobIds: string[]): Promise<Vendor>;
    /**
     * Remove job assignment from a vendor
     */
    removeJobAssignment(vendorId: string, companyId: string, jobId: string): Promise<Vendor>;
    /**
     * Get job IDs assigned to a vendor
     * Requirements: 10.2, 10.3
     */
    getVendorJobIds(vendorId: string): Promise<string[]>;
    /**
     * Check if a vendor has access to a specific job
     * Requirements: 7.4, 7.6
     */
    hasJobAccess(vendorId: string, jobId: string): Promise<boolean>;
    /**
     * Map Prisma result to Vendor type
     */
    mapToVendor(user: any): Vendor;
};
export default vendorService;
//# sourceMappingURL=vendor.service.d.ts.map