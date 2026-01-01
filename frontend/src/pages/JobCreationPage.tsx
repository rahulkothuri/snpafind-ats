import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, Button, MultiSelect, MandatoryCriteriaSection, ScreeningQuestionsSection, PipelineStageConfigurator, JobShareModal, StageImportModal } from '../components';
import { DEFAULT_MANDATORY_CRITERIA } from '../components/MandatoryCriteriaSection';
import { DEFAULT_PIPELINE_STAGES, type EnhancedPipelineStageConfig } from '../components/PipelineStageConfigurator';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import api from '../services/api';
import type { Job, WorkMode, JobPriority, PipelineStageConfig, MandatoryCriteria, ScreeningQuestion } from '../types';
import { EDUCATION_QUALIFICATIONS, SKILLS, INDUSTRIES, WORK_MODES, CITIES, JOB_PRIORITIES, JOB_DOMAINS } from '../constants/jobFormOptions';

/**
 * Job Creation/Edit Page - Requirements 20.1-20.6, 1.1-1.7
 * 
 * Features:
 * - Form with title, department, location, employment type, salary range
 * - Experience range inputs (min/max) with validation - Requirement 1.2
 * - Salary range inputs (min/max) with currency formatting - Requirement 1.3
 * - Rich text editor for job description
 * - Validation for required fields
 * - Create/update job functionality
 */

interface JobFormData {
  title: string;
  description: string;
  openings: number;
  experienceMin: number | '';
  experienceMax: number | '';
  salaryMin: number | '';
  salaryMax: number | '';
  variables: string;
  educationQualification: string;
  ageUpTo: number | '';
  skills: string[];
  preferredIndustry: string;
  workMode: WorkMode | '';
  locations: string[];
  priority: JobPriority | '';
  jobDomain: string;
  assignedRecruiterId: string;
  pipelineStages: EnhancedPipelineStageConfig[];
  mandatoryCriteria: MandatoryCriteria;
  screeningQuestions: ScreeningQuestion[];
}

const initialFormData: JobFormData = {
  title: '',
  description: '',
  openings: 1,
  experienceMin: '',
  experienceMax: '',
  salaryMin: '',
  salaryMax: '',
  variables: '',
  educationQualification: '',
  ageUpTo: '',
  skills: [],
  preferredIndustry: '',
  workMode: '',
  locations: [],
  priority: '',
  jobDomain: '',
  assignedRecruiterId: '',
  pipelineStages: DEFAULT_PIPELINE_STAGES,
  mandatoryCriteria: DEFAULT_MANDATORY_CRITERIA,
  screeningQuestions: [],
};

/**
 * Format a number as Indian currency (₹) with lakhs notation
 * Requirement 1.3: Currency formatting for salary inputs
 */
const formatCurrency = (value: number | ''): string => {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';

  // Format in Indian numbering system (lakhs)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

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

  // State for JobShareModal - Requirement 7.1
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string>('');
  const [createdJobTitle, setCreatedJobTitle] = useState<string>('');

  // State for StageImportModal - Requirements 3.1, 3.2, 3.4
  const [showStageImportModal, setShowStageImportModal] = useState(false);

  // Fetch company users for recruiter assignment - Requirement 1.1
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();

  // Filter to get only recruiters and hiring managers who can be assigned to jobs
  const recruiters = users.filter(
    (u) => (u.role === 'recruiter' || u.role === 'hiring_manager') && u.isActive
  );


  // Load existing job data for edit mode - Requirement 20.5
  useEffect(() => {
    if (isEditMode && id) {
      setIsLoading(true);
      api.get<Job>(`/jobs/${id}`)
        .then((response) => {
          const job = response.data;
          // Convert pipeline stages from API format to form format
          const pipelineStages: EnhancedPipelineStageConfig[] = job.stages && job.stages.length > 0
            ? job.stages
              .filter(stage => !stage.parentId) // Only top-level stages
              .sort((a, b) => a.position - b.position)
              .map(stage => ({
                id: stage.id,
                name: stage.name,
                position: stage.position,
                isMandatory: stage.isMandatory || false,
                subStages: (stage.subStages || [])
                  .sort((a, b) => a.position - b.position)
                  .map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    position: sub.position,
                  })),
                type: 'screening', // Default type, will be inferred from stage name
                isCustom: !stage.isDefault,
              }))
            : DEFAULT_PIPELINE_STAGES;

          setFormData({
            title: job.title,
            description: job.description || '',
            openings: job.openings,
            experienceMin: job.experienceMin ?? '',
            experienceMax: job.experienceMax ?? '',
            salaryMin: job.salaryMin ?? '',
            salaryMax: job.salaryMax ?? '',
            variables: job.variables || '',
            educationQualification: job.educationQualification || '',
            ageUpTo: job.ageUpTo ?? '',
            skills: job.skills || [],
            preferredIndustry: job.preferredIndustry || '',
            workMode: job.workMode || '',
            locations: job.locations || [],
            priority: job.priority || '',
            jobDomain: job.jobDomain || '',
            assignedRecruiterId: job.assignedRecruiterId || '',
            pipelineStages,
            mandatoryCriteria: job.mandatoryCriteria || DEFAULT_MANDATORY_CRITERIA,
            screeningQuestions: job.screeningQuestions || [],
          });
        })
        .catch((err) => {
          console.error('Failed to load job:', err);
          setSubmitError('Failed to load job details');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isEditMode, id]);

  const handleChange = (field: keyof JobFormData, value: string | number | '' | string[] | WorkMode | JobPriority | EnhancedPipelineStageConfig[] | MandatoryCriteria | ScreeningQuestion[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setSubmitError(null);
  };

  // Validate form - Requirement 20.3, 1.2 (Experience Range Validation), 1.3 (Salary Range Validation), 1.7 (Required Field Validation)
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation - Requirement 1.7
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }
    if (formData.openings < 1) {
      newErrors.openings = 'At least 1 opening is required';
    }

    // Experience range required validation - Requirement 1.7
    const expMin = formData.experienceMin;
    const expMax = formData.experienceMax;

    if (expMin === '' || expMin === null || expMin === undefined) {
      newErrors.experienceMin = 'Minimum experience is required';
    } else if (expMin < 0) {
      newErrors.experienceMin = 'Minimum experience cannot be negative';
    }

    if (expMax === '' || expMax === null || expMax === undefined) {
      newErrors.experienceMax = 'Maximum experience is required';
    } else if (expMax < 0) {
      newErrors.experienceMax = 'Maximum experience cannot be negative';
    }

    // Experience range validation - Requirement 1.2
    if (expMin !== '' && expMax !== '' && typeof expMin === 'number' && typeof expMax === 'number' && expMin > expMax) {
      newErrors.experienceMax = 'Maximum experience must be greater than or equal to minimum';
    }

    // Salary range validation - Requirement 1.3
    const salMin = formData.salaryMin;
    const salMax = formData.salaryMax;

    if (salMin !== '' && salMin < 0) {
      newErrors.salaryMin = 'Minimum salary cannot be negative';
    }
    if (salMax !== '' && salMax < 0) {
      newErrors.salaryMax = 'Maximum salary cannot be negative';
    }
    if (salMin !== '' && salMax !== '' && salMin > salMax) {
      newErrors.salaryMax = 'Maximum salary must be greater than or equal to minimum';
    }

    // Work mode required validation - Requirement 1.7
    if (!formData.workMode) {
      newErrors.workMode = 'Work mode is required';
    }

    // Locations required validation - Requirement 1.7
    if (!formData.locations || formData.locations.length === 0) {
      newErrors.locations = 'At least one job location is required';
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
      // Build payload with only non-empty/changed fields
      const payload: Record<string, unknown> = {
        companyId: user?.companyId || 'default-company-id',
      };

      // Only include fields that have values or have been explicitly set
      if (formData.title.trim()) payload.title = formData.title.trim();
      if (formData.description.trim()) payload.description = formData.description.trim();
      if (formData.openings > 0) payload.openings = formData.openings;

      // Experience range - only include if set
      if (formData.experienceMin !== '') payload.experienceMin = formData.experienceMin;
      if (formData.experienceMax !== '') payload.experienceMax = formData.experienceMax;

      // Salary range - only include if set
      if (formData.salaryMin !== '') payload.salaryMin = formData.salaryMin;
      if (formData.salaryMax !== '') payload.salaryMax = formData.salaryMax;

      // Optional fields - only include if they have values
      if (formData.variables.trim()) payload.variables = formData.variables.trim();
      if (formData.educationQualification) payload.educationQualification = formData.educationQualification;
      if (formData.ageUpTo !== '') payload.ageUpTo = formData.ageUpTo;
      if (formData.skills.length > 0) payload.skills = formData.skills;
      if (formData.preferredIndustry) payload.preferredIndustry = formData.preferredIndustry;
      if (formData.workMode) payload.workMode = formData.workMode;
      if (formData.locations.length > 0) payload.locations = formData.locations;
      if (formData.priority) payload.priority = formData.priority;
      if (formData.jobDomain) payload.jobDomain = formData.jobDomain;
      if (formData.assignedRecruiterId) payload.assignedRecruiterId = formData.assignedRecruiterId;

      // Always include these complex objects if they exist and have content
      if (formData.mandatoryCriteria &&
        formData.mandatoryCriteria.title &&
        formData.mandatoryCriteria.criteria &&
        formData.mandatoryCriteria.criteria.length > 0) {
        payload.mandatoryCriteria = formData.mandatoryCriteria;
      }

      if (formData.screeningQuestions && formData.screeningQuestions.length > 0) {
        payload.screeningQuestions = formData.screeningQuestions;
      }

      if (formData.pipelineStages && formData.pipelineStages.length > 0) {
        payload.pipelineStages = formData.pipelineStages;
      }

      if (isEditMode && id) {
        await api.put(`/jobs/${id}`, payload);
        // For edit mode, navigate directly to roles page
        navigate('/roles');
      } else {
        // For create mode, show the share modal - Requirement 7.1
        const response = await api.post<Job>('/jobs', payload);
        const createdJob = response.data;
        setCreatedJobId(createdJob.id);
        setCreatedJobTitle(createdJob.title);
        setShowShareModal(true);
      }
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

  // Handle stage import - Requirements 3.3, 3.4
  const handleStageImport = (importedStages: PipelineStageConfig[]) => {
    // Convert imported stages to EnhancedPipelineStageConfig format
    const enhancedStages: EnhancedPipelineStageConfig[] = importedStages.map((stage, index) => ({
      ...stage,
      position: index,
      type: inferStageType(stage.name),
      isCustom: true,
      subStages: stage.subStages || [],
    }));

    handleChange('pipelineStages', enhancedStages);
    setShowStageImportModal(false);
  };

  // Helper function to infer stage type from name
  const inferStageType = (stageName: string): 'shortlisting' | 'screening' | 'interview' | 'offer' | 'hired' => {
    const name = stageName.toLowerCase();
    if (name.includes('shortlist') || name.includes('applied') || name.includes('queue')) {
      return 'shortlisting';
    } else if (name.includes('screen') || name.includes('review')) {
      return 'screening';
    } else if (name.includes('interview') || name.includes('selected')) {
      return 'interview';
    } else if (name.includes('offer')) {
      return 'offer';
    } else if (name.includes('hired') || name.includes('onboard')) {
      return 'hired';
    }
    return 'screening'; // Default
  };

  // Handle share modal close - Requirement 7.1
  const handleShareModalClose = () => {
    setShowShareModal(false);
    // Reset form after closing modal
    setFormData(initialFormData);
    setCreatedJobId('');
    setCreatedJobTitle('');
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
      <div className="max-w-[1600px] mx-auto p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Error Banner */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-xs text-red-700">{submitError}</p>
              </div>
            </div>
          )}

          {/* Top Section: Basic Info Grid */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">Basic Information</h3>

            <div className="grid grid-cols-4 gap-x-4 gap-y-3">
              {/* Row 1: Title (2), Recruiter (1), Priority (1) */}
              <div className="col-span-2">
                <label htmlFor="title" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.title ? 'border-red-300' : 'border-gray-200'}`}
                  placeholder="e.g., Senior Backend Engineer"
                />
                {errors.title && <p className="text-[10px] text-red-500 mt-0.5">{errors.title}</p>}
              </div>

              <div className="col-span-1">
                <label htmlFor="assignedRecruiterId" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Assign Recruiter
                </label>
                <select
                  id="assignedRecruiterId"
                  value={formData.assignedRecruiterId}
                  onChange={(e) => handleChange('assignedRecruiterId', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  disabled={isLoadingUsers}
                >
                  <option value="">Select recruiter</option>
                  {recruiters.map((recruiter) => (
                    <option key={recruiter.id} value={recruiter.id}>
                      {recruiter.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label htmlFor="priority" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value as JobPriority | '')}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">Select priority</option>
                  {JOB_PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>

              {/* Row 2: Experience (1), Salary (1), Openings (1), Work Mode (1) */}
              <div className="col-span-1">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Experience (Yrs) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.experienceMin}
                    onChange={(e) => handleChange('experienceMin', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.experienceMin ? 'border-red-300' : 'border-gray-200'}`}
                    placeholder="Min"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.experienceMax}
                    onChange={(e) => handleChange('experienceMax', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.experienceMax ? 'border-red-300' : 'border-gray-200'}`}
                    placeholder="Max"
                  />
                </div>
              </div>

              <div className="col-span-1">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Salary (₹ LPA)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.salaryMin}
                    onChange={(e) => handleChange('salaryMin', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="Min"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.salaryMax}
                    onChange={(e) => handleChange('salaryMax', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="Max"
                  />
                </div>
                {(formData.salaryMin !== '' || formData.salaryMax !== '') && (
                  <p className="text-[10px] text-gray-400 mt-1 truncate">
                    {formData.salaryMin !== '' ? formatCurrency(formData.salaryMin) : ''}
                    {formData.salaryMin !== '' && formData.salaryMax !== '' ? ' - ' : ''}
                    {formData.salaryMax !== '' ? formatCurrency(formData.salaryMax) : ''}
                  </p>
                )}
              </div>

              <div className="col-span-1">
                <label htmlFor="openings" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Openings <span className="text-red-500">*</span>
                </label>
                <input
                  id="openings"
                  type="number"
                  min="1"
                  value={formData.openings}
                  onChange={(e) => handleChange('openings', parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none ${errors.openings ? 'border-red-300' : 'border-gray-200'}`}
                />
              </div>

              <div className="col-span-1">
                <label htmlFor="workMode" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Work Mode <span className="text-red-500">*</span>
                </label>
                <select
                  id="workMode"
                  value={formData.workMode}
                  onChange={(e) => handleChange('workMode', e.target.value as WorkMode | '')}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white ${errors.workMode ? 'border-red-300' : 'border-gray-200'}`}
                >
                  <option value="">Select mode</option>
                  {WORK_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>

              {/* Row 3: Locations (1), Industry (1), Domain (1), Education (1) */}
              <div className="col-span-1">
                <label htmlFor="locations" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Locations <span className="text-red-500">*</span>
                </label>
                <div className="h-[34px]">
                  <MultiSelect
                    id="locations"
                    options={CITIES}
                    value={formData.locations}
                    onChange={(locations) => handleChange('locations', locations)}
                    placeholder="Select..."
                    searchPlaceholder="Search..."
                    maxDisplayTags={2}
                    error={!!errors.locations}
                  />
                </div>
              </div>

              <div className="col-span-1">
                <label htmlFor="preferredIndustry" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Industry
                </label>
                <select
                  id="preferredIndustry"
                  value={formData.preferredIndustry}
                  onChange={(e) => handleChange('preferredIndustry', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry.value} value={industry.value}>{industry.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label htmlFor="jobDomain" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Job Domain
                </label>
                <select
                  id="jobDomain"
                  value={formData.jobDomain}
                  onChange={(e) => handleChange('jobDomain', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select domain</option>
                  {JOB_DOMAINS.map((domain) => (
                    <option key={domain.value} value={domain.value}>{domain.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label htmlFor="educationQualification" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Education
                </label>
                <select
                  id="educationQualification"
                  value={formData.educationQualification}
                  onChange={(e) => handleChange('educationQualification', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select...</option>
                  {EDUCATION_QUALIFICATIONS.map((qual) => (
                    <option key={qual.value} value={qual.value}>{qual.label}</option>
                  ))}
                </select>
              </div>

              {/* Row 4: Skills (2), Variables (1), Age (1) */}
              <div className="col-span-2">
                <label htmlFor="skills" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Skills
                </label>
                <div className="h-[34px]">
                  <MultiSelect
                    id="skills"
                    options={SKILLS}
                    value={formData.skills}
                    onChange={(skills) => handleChange('skills', skills)}
                    placeholder="Select required skills..."
                    searchPlaceholder="Search..."
                    maxDisplayTags={4}
                  />
                </div>
              </div>

              <div className="col-span-1">
                <label htmlFor="variables" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Variables / Incentives
                </label>
                <input
                  id="variables"
                  type="text"
                  value={formData.variables}
                  onChange={(e) => handleChange('variables', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Annual bonus"
                />
              </div>

              <div className="col-span-1">
                <label htmlFor="ageUpTo" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Max Age
                </label>
                <input
                  id="ageUpTo"
                  type="number"
                  min="18"
                  max="70"
                  value={formData.ageUpTo}
                  onChange={(e) => handleChange('ageUpTo', e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 35"
                />
              </div>
            </div>
          </div>

          {/* Bottom Section: Stacked vertical layout */}
          <div className="space-y-4">
            {/* Job Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">Job Description</h3>

              {/* Rich Text Editor Toolbar */}
              <div className="border border-[#e2e8f0] rounded-t-lg bg-[#f9fafb] px-3 py-1 flex items-center gap-1">
                <button
                  type="button"
                  className="p-1 rounded hover:bg-gray-200 text-[#64748b]"
                  title="Bold"
                  onClick={() => {
                    const textarea = document.getElementById('description') as HTMLTextAreaElement;
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = formData.description;
                    const newText = text.substring(0, start) + `**${text.substring(start, end)}**` + text.substring(end);
                    handleChange('description', newText);
                  }}
                >
                  <b className="font-serif">B</b>
                </button>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-gray-200 text-[#64748b]"
                  title="Italic"
                  onClick={() => {
                    const textarea = document.getElementById('description') as HTMLTextAreaElement;
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = formData.description;
                    const newText = text.substring(0, start) + `_${text.substring(start, end)}_` + text.substring(end);
                    handleChange('description', newText);
                  }}
                >
                  <i className="font-serif">I</i>
                </button>
                <div className="w-px h-4 bg-[#e2e8f0] mx-1" />
                <button
                  type="button"
                  className="p-1 rounded hover:bg-gray-200 text-[#64748b]"
                  title="Bullet List"
                  onClick={() => {
                    const text = formData.description;
                    const newText = text + (text.endsWith('\n') || text === '' ? '' : '\n') + '• ';
                    handleChange('description', newText);
                  }}
                >
                  • Liste
                </button>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-gray-200 text-[#64748b]"
                  title="Heading"
                  onClick={() => {
                    const text = formData.description;
                    const newText = text + (text.endsWith('\n') || text === '' ? '' : '\n') + '## ';
                    handleChange('description', newText);
                  }}
                >
                  H2
                </button>
              </div>

              {/* Description Textarea */}
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-t-0 border-[#e2e8f0] rounded-b-lg text-sm text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0b6cf0] resize-none font-mono leading-relaxed"
                placeholder="Describe the role..."
              />
            </div>

            {/* Screening Requirements */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">Screening Requirements</h3>

              <div className="space-y-6">
                <MandatoryCriteriaSection
                  value={formData.mandatoryCriteria || DEFAULT_MANDATORY_CRITERIA}
                  onChange={(criteria) => handleChange('mandatoryCriteria', criteria)}
                />

                <div className="pt-6 border-t border-gray-100">
                  <ScreeningQuestionsSection
                    value={formData.screeningQuestions}
                    onChange={(questions) => handleChange('screeningQuestions', questions)}
                  />
                </div>
              </div>
            </div>

            {/* Pipeline Configuration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                <h3 className="text-sm font-bold text-gray-900">Pipeline Stages</h3>
                <button
                  type="button"
                  onClick={() => setShowStageImportModal(true)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Import Stages
                </button>
              </div>
              <PipelineStageConfigurator
                stages={formData.pipelineStages}
                onChange={(stages) => handleChange('pipelineStages', stages)}
              />
            </div>
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

      {/* Job Share Modal - Requirement 7.1 */}
      <JobShareModal
        isOpen={showShareModal}
        onClose={handleShareModalClose}
        jobId={createdJobId}
        jobTitle={createdJobTitle}
      />

      {/* Stage Import Modal - Requirements 3.1, 3.2, 3.4 */}
      <StageImportModal
        isOpen={showStageImportModal}
        onClose={() => setShowStageImportModal(false)}
        onImport={handleStageImport}
        currentJobId={id}
      />
    </Layout>
  );
}

export default JobCreationPage;
