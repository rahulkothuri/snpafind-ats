import api from './api';

/**
 * Vendor Service
 * Handles vendor CRUD operations and job assignments
 * Requirements: 7.3
 */

export interface AssignedJob {
  id: string;
  title: string;
}

export interface Vendor {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: 'vendor';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedJobs: AssignedJob[];
}

export interface CreateVendorData {
  name: string;
  email: string;
  password: string;
  assignedJobIds: string[];
}

export interface UpdateVendorData {
  name?: string;
  email?: string;
  isActive?: boolean;
  assignedJobIds?: string[];
}

export const vendorsService = {
  /**
   * Get all vendors for the company
   * Requirements: 7.2
   */
  async getAll(): Promise<Vendor[]> {
    const response = await api.get('/vendors');
    return response.data;
  },

  /**
   * Get a vendor by ID
   */
  async getById(id: string): Promise<Vendor> {
    const response = await api.get(`/vendors/${id}`);
    return response.data;
  },

  /**
   * Create a new vendor
   * Requirements: 7.3
   */
  async create(data: CreateVendorData): Promise<Vendor> {
    const response = await api.post('/vendors', data);
    return response.data;
  },

  /**
   * Update a vendor
   * Requirements: 7.7
   */
  async update(id: string, data: UpdateVendorData): Promise<Vendor> {
    const response = await api.put(`/vendors/${id}`, data);
    return response.data;
  },

  /**
   * Delete a vendor (hard delete)
   * Requirements: 7.7
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/vendors/${id}`);
  },

  /**
   * Deactivate a vendor (soft delete)
   * Requirements: 7.8
   */
  async deactivate(id: string): Promise<Vendor> {
    const response = await api.post(`/vendors/${id}/deactivate`);
    return response.data.vendor;
  },

  /**
   * Toggle vendor active status
   */
  async toggleStatus(id: string): Promise<Vendor> {
    const vendor = await this.getById(id);
    return this.update(id, { isActive: !vendor.isActive });
  },

  /**
   * Assign jobs to a vendor
   * Requirements: 10.4
   */
  async assignJobs(vendorId: string, jobIds: string[]): Promise<Vendor> {
    const response = await api.post(`/vendors/${vendorId}/jobs`, { jobIds });
    return response.data;
  },

  /**
   * Remove a job assignment from a vendor
   */
  async removeJobAssignment(vendorId: string, jobId: string): Promise<Vendor> {
    const response = await api.delete(`/vendors/${vendorId}/jobs/${jobId}`);
    return response.data;
  },
};

export default vendorsService;
