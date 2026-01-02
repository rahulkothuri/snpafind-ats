import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Table } from './Table';
import { MultiSelect } from './MultiSelect';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import type { Column } from './Table';

/**
 * Vendor Management Section Component
 * Requirements: 7.1, 7.2, 7.5, 7.7
 * 
 * Features:
 * - Vendor table with Name, Email, Assigned Jobs, Status, Actions
 * - Add vendor modal with form
 * - Edit vendor modal
 * - Job assignment multi-select
 */

export interface AssignedJob {
  id: string;
  title: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  assignedJobs: AssignedJob[];
  createdAt: string;
}

export interface JobOption {
  id: string;
  title: string;
}

export interface VendorFormData {
  name: string;
  email: string;
  password: string;
  assignedJobIds: string[];
}

export interface VendorManagementSectionProps {
  vendors: Vendor[];
  jobs: JobOption[];
  isLoading: boolean;
  error: string | null;
  onAddVendor: (data: VendorFormData) => Promise<void>;
  onUpdateVendor: (id: string, data: Partial<VendorFormData>) => Promise<void>;
  onToggleVendorStatus: (id: string) => Promise<void>;
  onRemoveVendor: (id: string) => Promise<void>;
  onRefresh: () => void;
}

// Add/Edit Vendor Modal Component
interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VendorFormData) => Promise<void>;
  jobs: JobOption[];
  vendor?: Vendor | null;
  isEdit?: boolean;
}

function VendorModal({ isOpen, onClose, onSave, jobs, vendor, isEdit = false }: VendorModalProps) {
  const [formData, setFormData] = useState<VendorFormData>({
    name: '',
    email: '',
    password: '',
    assignedJobIds: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or vendor changes
  useEffect(() => {
    if (isOpen) {
      if (vendor && isEdit) {
        setFormData({
          name: vendor.name,
          email: vendor.email,
          password: '',
          assignedJobIds: vendor.assignedJobs.map(j => j.id),
        });
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          assignedJobIds: [],
        });
      }
      setErrors({});
    }
  }, [isOpen, vendor, isEdit]);

  if (!isOpen) return null;

  const handleChange = (field: keyof VendorFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!isEdit && !formData.password.trim()) newErrors.password = 'Password is required';
    else if (!isEdit && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      if (err.response?.data?.details) {
        const apiErrors: Record<string, string> = {};
        Object.entries(err.response.data.details).forEach(([key, messages]) => {
          apiErrors[key] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setErrors(apiErrors);
      } else {
        setErrors({ submit: err.message || 'Failed to save vendor' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const jobOptions = jobs.map(job => ({
    value: job.id,
    label: job.title,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#111827]">
            {isEdit ? 'Edit Vendor' : 'Add New Vendor'}
          </h3>
          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-[#111827] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="form-group">
            <label htmlFor="vendorName" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Name
            </label>
            <input
              id="vendorName"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="Enter vendor name"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="vendorEmail" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              id="vendorEmail"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="vendor@company.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Password (only for new vendors) */}
          {!isEdit && (
            <div className="form-group">
              <label htmlFor="vendorPassword" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Temporary Password
              </label>
              <input
                id="vendorPassword"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="Minimum 8 characters"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>
          )}

          {/* Job Assignment Multi-select */}
          <div className="form-group">
            <label htmlFor="assignedJobs" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Assigned Jobs
            </label>
            <MultiSelect
              id="assignedJobs"
              options={jobOptions}
              value={formData.assignedJobIds}
              onChange={(value) => handleChange('assignedJobIds', value)}
              placeholder="Select jobs to assign..."
              searchPlaceholder="Search jobs..."
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Vendors can only access candidates and data for assigned jobs
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


// Confirm Delete Modal
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  vendorName: string;
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, vendorName }: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#111827]">Remove Vendor</h3>
            <p className="text-sm text-[#64748b]">This action cannot be undone</p>
          </div>
        </div>
        
        <p className="text-sm text-[#374151] mb-6">
          Are you sure you want to remove <span className="font-medium">{vendorName}</span>? 
          This will permanently delete the vendor account and all associated data.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm} 
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Removing...' : 'Remove Vendor'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main VendorManagementSection Component
export function VendorManagementSection({
  vendors,
  jobs,
  isLoading,
  error,
  onAddVendor,
  onUpdateVendor,
  onToggleVendorStatus,
  onRemoveVendor,
  onRefresh,
}: VendorManagementSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);

  // Generate avatar background color based on name
  const getAvatarColor = (name: string) => {
    const colors = ['#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0b6cf0'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleAddVendor = async (data: VendorFormData) => {
    await onAddVendor(data);
  };

  const handleEditVendor = async (data: VendorFormData) => {
    if (!editingVendor) return;
    await onUpdateVendor(editingVendor.id, {
      name: data.name,
      email: data.email,
      assignedJobIds: data.assignedJobIds,
    });
    setEditingVendor(null);
  };

  const handleDeleteVendor = async () => {
    if (!deletingVendor) return;
    await onRemoveVendor(deletingVendor.id);
    setDeletingVendor(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRefresh} />;
  }

  const vendorColumns: Column<Vendor>[] = [
    {
      key: 'name',
      header: 'Vendor',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
            style={{ backgroundColor: getAvatarColor(row.name) }}
          >
            {row.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-[#111827] truncate">{row.name}</div>
            <div className="text-xs text-[#64748b] truncate">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'assignedJobs',
      header: 'Assigned Jobs',
      render: (row) => (
        <div className="flex flex-wrap gap-1 max-w-[250px]">
          {row.assignedJobs.length === 0 ? (
            <span className="text-sm text-[#9ca3af]">No jobs assigned</span>
          ) : row.assignedJobs.length <= 2 ? (
            row.assignedJobs.map((job) => (
              <Badge key={job.id} text={job.title} variant="gray" />
            ))
          ) : (
            <>
              <Badge text={row.assignedJobs[0].title} variant="gray" />
              <Badge text={`+${row.assignedJobs.length - 1} more`} variant="blue" />
            </>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          text={row.isActive ? 'Active' : 'Inactive'}
          variant={row.isActive ? 'green' : 'red'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button 
            className="text-sm text-[#0b6cf0] hover:text-[#0958c7] font-medium transition-colors"
            onClick={() => setEditingVendor(row)}
          >
            Edit
          </button>
          <span className="text-[#e2e8f0]">|</span>
          <button
            className={`text-sm font-medium transition-colors ${row.isActive
              ? 'text-[#f59e0b] hover:text-[#d97706]'
              : 'text-[#16a34a] hover:text-[#15803d]'
            }`}
            onClick={() => onToggleVendorStatus(row.id)}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <span className="text-[#e2e8f0]">|</span>
          <button
            className="text-sm text-[#dc2626] hover:text-[#b91c1c] font-medium transition-colors"
            onClick={() => setDeletingVendor(row)}
          >
            Remove
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#111827]">Vendor Management</h3>
          <p className="text-sm text-[#64748b] mt-1">
            Manage third-party recruitment agencies and their job access
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Vendor
          </span>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {vendors.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-[#111827] mb-1">No vendors yet</h4>
            <p className="text-sm text-[#64748b] mb-4">
              Add vendors to give external recruiters limited access to specific jobs
            </p>
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              Add Your First Vendor
            </Button>
          </div>
        ) : (
          <Table
            columns={vendorColumns}
            data={vendors}
            keyExtractor={(row) => row.id}
          />
        )}
      </div>

      {/* Add Vendor Modal */}
      <VendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddVendor}
        jobs={jobs}
      />

      {/* Edit Vendor Modal */}
      <VendorModal
        isOpen={!!editingVendor}
        onClose={() => setEditingVendor(null)}
        onSave={handleEditVendor}
        jobs={jobs}
        vendor={editingVendor}
        isEdit
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingVendor}
        onClose={() => setDeletingVendor(null)}
        onConfirm={handleDeleteVendor}
        vendorName={deletingVendor?.name || ''}
      />
    </div>
  );
}

export default VendorManagementSection;
