import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, Button } from '../components';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import type { Job } from '../types';

/**
 * Job Creation/Edit Page - Requirements 20.1-20.6
 * 
 * Features:
 * - Form with title, department, location, employment type, salary range
 * - Rich text editor for job description
 * - Validation for required fields
 * - Create/update job functionality
 */

interface JobFormData {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  salaryRange: string;
  description: string;
  openings: number;
}

const initialFormData: JobFormData = {
  title: '',
  department: '',
  location: '',
  employmentType: 'Full-time',
  salaryRange: '',
  description: '',
  openings: 1,
};

const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
const departments = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
const locations = ['Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Gurgaon', 'Mumbai', 'Remote'];

export function JobCreationPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);


  // Load existing job data for edit mode - Requirement 20.5
  useEffect(() => {
    if (isEditMode && id) {
      setIsLoading(true);
      api.get<Job>(`/jobs/${id}`)
        .then((response) => {
          const job = response.data;
          setFormData({
            title: job.title,
            department: job.department,
            location: job.location,
            employmentType: job.employmentType || 'Full-time',
            salaryRange: job.salaryRange || '',
            description: job.description || '',
            openings: job.openings,
          });
        })
        .catch((err) => {
          console.error('Failed to load job:', err);
          setSubmitError('Failed to load job details');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isEditMode, id]);

  const handleChange = (field: keyof JobFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setSubmitError(null);
  };

  // Validate form - Requirement 20.3
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (formData.openings < 1) {
      newErrors.openings = 'At least 1 opening is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission - Requirements 20.3, 20.4
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        ...formData,
        companyId: user?.companyId || 'default-company-id',
      };

      if (isEditMode && id) {
        await api.put(`/jobs/${id}`, payload);
      } else {
        await api.post('/jobs', payload);
      }

      // Redirect to roles page on success - Requirement 20.4
      navigate('/roles');
    } catch (err: unknown) {
      console.error('Failed to save job:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setSubmitError(error.response?.data?.message || 'Failed to save job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel - Requirement 20.6
  const handleCancel = () => {
    navigate(-1);
  };


  if (isLoading) {
    return (
      <Layout
        pageTitle={isEditMode ? 'Edit Job' : 'Create New Job'}
        user={user}
        companyName="Acme Technologies"
        footerLeftText="SnapFind Client ATS · Job Management"
        onLogout={logout}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b6cf0]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      pageTitle={isEditMode ? 'Edit Job Requisition' : 'Create New Job Requisition'}
      pageSubtitle={isEditMode ? 'Update job details and requirements' : 'Define a new position and start the hiring process'}
      user={user}
      companyName="Acme Technologies"
      footerLeftText="SnapFind Client ATS · Job Management"
      footerRightText=""
      onLogout={logout}
    >
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Banner */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            </div>
          )}

          {/* Basic Information Card */}
          <div className="form-section">
            <h3 className="form-section-header">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Title - Required */}
              <div className="md:col-span-2 form-group">
                <label htmlFor="title" className="form-label form-label-required">
                  Job Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="e.g., Senior Backend Engineer"
                />
                {errors.title && <p className="form-error">{errors.title}</p>}
              </div>


              {/* Department - Required */}
              <div className="form-group">
                <label htmlFor="department" className="form-label form-label-required">
                  Department
                </label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  className={`form-select ${errors.department ? 'error' : ''}`}
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && <p className="form-error">{errors.department}</p>}
              </div>

              {/* Location - Required */}
              <div className="form-group">
                <label htmlFor="location" className="form-label form-label-required">
                  Location
                </label>
                <select
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className={`form-select ${errors.location ? 'error' : ''}`}
                >
                  <option value="">Select location</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                {errors.location && <p className="form-error">{errors.location}</p>}
              </div>

              {/* Employment Type */}
              <div className="form-group">
                <label htmlFor="employmentType" className="form-label">
                  Employment Type
                </label>
                <select
                  id="employmentType"
                  value={formData.employmentType}
                  onChange={(e) => handleChange('employmentType', e.target.value)}
                  className="form-select"
                >
                  {employmentTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>


              {/* Salary Range */}
              <div className="form-group">
                <label htmlFor="salaryRange" className="form-label">
                  Salary Range
                </label>
                <input
                  id="salaryRange"
                  type="text"
                  value={formData.salaryRange}
                  onChange={(e) => handleChange('salaryRange', e.target.value)}
                  className="form-input"
                  placeholder="e.g., ₹15-25 LPA"
                />
              </div>

              {/* Number of Openings */}
              <div className="form-group">
                <label htmlFor="openings" className="form-label">
                  Number of Openings
                </label>
                <input
                  id="openings"
                  type="number"
                  min="1"
                  value={formData.openings}
                  onChange={(e) => handleChange('openings', parseInt(e.target.value) || 1)}
                  className={`form-input ${errors.openings ? 'error' : ''}`}
                />
                {errors.openings && <p className="form-error">{errors.openings}</p>}
              </div>
            </div>
          </div>

          {/* Job Description Card - Requirement 20.2 */}
          <div className="form-section">
            <h3 className="form-section-header">Job Description</h3>
            <p className="form-section-subtitle">
              Provide a detailed description of the role, responsibilities, and requirements.
            </p>
            
            {/* Rich Text Editor Toolbar */}
            <div className="border border-[#e2e8f0] rounded-t-lg bg-[#f9fafb] px-3 py-2 flex items-center gap-1">
              <button
                type="button"
                className="p-1.5 rounded hover:bg-gray-200 text-[#64748b]"
                title="Bold"
                onClick={() => {
                  const textarea = document.getElementById('description') as HTMLTextAreaElement;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const text = formData.description;
                  const selectedText = text.substring(start, end);
                  const newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end);
                  handleChange('description', newText);
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h8a4 4 0 100-8H6v8zm0 0h8a4 4 0 110 8H6v-8z" />
                </svg>
              </button>

              <button
                type="button"
                className="p-1.5 rounded hover:bg-gray-200 text-[#64748b]"
                title="Italic"
                onClick={() => {
                  const textarea = document.getElementById('description') as HTMLTextAreaElement;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const text = formData.description;
                  const selectedText = text.substring(start, end);
                  const newText = text.substring(0, start) + `_${selectedText}_` + text.substring(end);
                  handleChange('description', newText);
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>
              <div className="w-px h-5 bg-[#e2e8f0] mx-1" />
              <button
                type="button"
                className="p-1.5 rounded hover:bg-gray-200 text-[#64748b]"
                title="Bullet List"
                onClick={() => {
                  const text = formData.description;
                  const newText = text + (text.endsWith('\n') || text === '' ? '' : '\n') + '• ';
                  handleChange('description', newText);
                  setTimeout(() => {
                    const textarea = document.getElementById('description') as HTMLTextAreaElement;
                    textarea.focus();
                    textarea.setSelectionRange(newText.length, newText.length);
                  }, 0);
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                type="button"
                className="p-1.5 rounded hover:bg-gray-200 text-[#64748b]"
                title="Heading"
                onClick={() => {
                  const text = formData.description;
                  const newText = text + (text.endsWith('\n') || text === '' ? '' : '\n') + '## ';
                  handleChange('description', newText);
                  setTimeout(() => {
                    const textarea = document.getElementById('description') as HTMLTextAreaElement;
                    textarea.focus();
                    textarea.setSelectionRange(newText.length, newText.length);
                  }, 0);
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </button>
            </div>

            
            {/* Description Textarea */}
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border border-t-0 border-[#e2e8f0] rounded-b-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] focus:border-transparent resize-none font-mono"
              placeholder={`## About the Role
Describe the position and its importance to the team...

## Responsibilities
• Key responsibility 1
• Key responsibility 2
• Key responsibility 3

## Requirements
• Required skill or qualification 1
• Required skill or qualification 2

## Nice to Have
• Preferred qualification 1
• Preferred qualification 2

## Benefits
• Benefit 1
• Benefit 2`}
            />
            <p className="mt-2 text-xs text-[#64748b]">
              Supports basic markdown formatting: **bold**, _italic_, ## headings, • bullet points
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="secondary" onClick={handleCancel} type="button">
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" type="button" onClick={() => setFormData(initialFormData)}>
                Reset
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditMode ? 'Update Job' : 'Create Job'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default JobCreationPage;
