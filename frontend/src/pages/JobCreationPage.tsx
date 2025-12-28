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

              {/* Experience Range - Requirement 1.2, 1.7 */}
              <div className="form-group">
                <label className="form-label form-label-required">
                  Experience Range (Years)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      id="experienceMin"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.experienceMin}
                      onChange={(e) => handleChange('experienceMin', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className={`form-input ${errors.experienceMin ? 'error' : ''}`}
                      placeholder="Min"
                    />
                  </div>
                  <span className="text-[#64748b] text-sm">to</span>
                  <div className="flex-1">
                    <input
                      id="experienceMax"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.experienceMax}
                      onChange={(e) => handleChange('experienceMax', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className={`form-input ${errors.experienceMax ? 'error' : ''}`}
                      placeholder="Max"
                    />
                  </div>
                </div>
                {errors.experienceMin && <p className="form-error">{errors.experienceMin}</p>}
                {errors.experienceMax && <p className="form-error">{errors.experienceMax}</p>}
              </div>

              {/* Salary Range - Requirement 1.3 */}
              <div className="form-group">
                <label className="form-label">
                  Salary Range (₹ per annum)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-sm">₹</span>
                    <input
                      id="salaryMin"
                      type="number"
                      min="0"
                      step="10000"
                      value={formData.salaryMin}
                      onChange={(e) => handleChange('salaryMin', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className={`form-input pl-7 ${errors.salaryMin ? 'error' : ''}`}
                      placeholder="Min"
                    />
                  </div>
                  <span className="text-[#64748b] text-sm">to</span>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-sm">₹</span>
                    <input
                      id="salaryMax"
                      type="number"
                      min="0"
                      step="10000"
                      value={formData.salaryMax}
                      onChange={(e) => handleChange('salaryMax', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className={`form-input pl-7 ${errors.salaryMax ? 'error' : ''}`}
                      placeholder="Max"
                    />
                  </div>
                </div>
                {/* Display formatted currency preview */}
                {(formData.salaryMin !== '' || formData.salaryMax !== '') && (
                  <p className="mt-1 text-xs text-[#64748b]">
                    {formData.salaryMin !== '' && formData.salaryMax !== '' 
                      ? `${formatCurrency(formData.salaryMin)} - ${formatCurrency(formData.salaryMax)}`
                      : formData.salaryMin !== '' 
                        ? `From ${formatCurrency(formData.salaryMin)}`
                        : `Up to ${formatCurrency(formData.salaryMax)}`
                    }
                  </p>
                )}
                {errors.salaryMin && <p className="form-error">{errors.salaryMin}</p>}
                {errors.salaryMax && <p className="form-error">{errors.salaryMax}</p>}
              </div>

              {/* Variables/Incentives - Requirement 1.1 */}
              <div className="md:col-span-2 form-group">
                <label htmlFor="variables" className="form-label">
                  Variables / Incentives
                </label>
                <input
                  id="variables"
                  type="text"
                  value={formData.variables}
                  onChange={(e) => handleChange('variables', e.target.value)}
                  className="form-input"
                  placeholder="e.g., Performance bonus, Stock options, Annual bonus up to 20%"
                />
                <p className="mt-1 text-xs text-[#64748b]">
                  Describe any variable pay, bonuses, or incentives associated with this role
                </p>
              </div>

              {/* Education Qualification - Requirement 1.1 */}
              <div className="form-group">
                <label htmlFor="educationQualification" className="form-label">
                  Education Qualification
                </label>
                <select
                  id="educationQualification"
                  value={formData.educationQualification}
                  onChange={(e) => handleChange('educationQualification', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select qualification</option>
                  {EDUCATION_QUALIFICATIONS.map((qual) => (
                    <option key={qual.value} value={qual.value}>{qual.label}</option>
                  ))}
                </select>
              </div>

              {/* Age Limit - Requirement 1.1 */}
              <div className="form-group">
                <label htmlFor="ageUpTo" className="form-label">
                  Age Up To
                </label>
                <input
                  id="ageUpTo"
                  type="number"
                  min="18"
                  max="70"
                  value={formData.ageUpTo}
                  onChange={(e) => handleChange('ageUpTo', e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="form-input"
                  placeholder="e.g., 35"
                />
                <p className="mt-1 text-xs text-[#64748b]">
                  Maximum age limit for candidates (optional)
                </p>
              </div>

              {/* Skills Multi-Select - Requirement 1.1 */}
              <div className="md:col-span-2 form-group">
                <label htmlFor="skills" className="form-label">
                  Skills
                </label>
                <MultiSelect
                  id="skills"
                  options={SKILLS}
                  value={formData.skills}
                  onChange={(skills) => handleChange('skills', skills)}
                  placeholder="Select required skills..."
                  searchPlaceholder="Search skills..."
                  maxDisplayTags={8}
                />
                <p className="mt-1 text-xs text-[#64748b]">
                  Select the skills required for this position
                </p>
              </div>

              {/* Preferred Industry - Requirement 1.1 */}
              <div className="form-group">
                <label htmlFor="preferredIndustry" className="form-label">
                  Preferred Industry
                </label>
                <select
                  id="preferredIndustry"
                  value={formData.preferredIndustry}
                  onChange={(e) => handleChange('preferredIndustry', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry.value} value={industry.value}>{industry.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[#64748b]">
                  Preferred industry background for candidates
                </p>
              </div>

              {/* Work Mode - Requirement 1.5, 1.7 */}
              <div className="form-group">
                <label htmlFor="workMode" className="form-label form-label-required">
                  Work Mode
                </label>
                <select
                  id="workMode"
                  value={formData.workMode}
                  onChange={(e) => handleChange('workMode', e.target.value as WorkMode | '')}
                  className={`form-select ${errors.workMode ? 'error' : ''}`}
                >
                  <option value="">Select work mode</option>
                  {WORK_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
                {errors.workMode && <p className="form-error">{errors.workMode}</p>}
                <p className="mt-1 text-xs text-[#64748b]">
                  Employment arrangement type for this position
                </p>
              </div>

              {/* Job Locations Multi-Select - Requirement 1.4, 1.7 */}
              <div className="form-group">
                <label htmlFor="locations" className="form-label form-label-required">
                  Job Locations
                </label>
                <MultiSelect
                  id="locations"
                  options={CITIES}
                  value={formData.locations}
                  onChange={(locations) => handleChange('locations', locations)}
                  placeholder="Select job locations..."
                  searchPlaceholder="Search cities..."
                  maxDisplayTags={5}
                  error={!!errors.locations}
                />
                {errors.locations && <p className="form-error">{errors.locations}</p>}
                <p className="mt-1 text-xs text-[#64748b]">
                  Select one or more cities where this position is available
                </p>
              </div>

              {/* Job Priority - Requirement 1.6 */}
              <div className="form-group">
                <label htmlFor="priority" className="form-label">
                  Job Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value as JobPriority | '')}
                  className="form-select"
                >
                  <option value="">Select priority</option>
                  {JOB_PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[#64748b]">
                  Urgency level for filling this position
                </p>
              </div>

              {/* Job Domain - Requirement 1.1 */}
              <div className="form-group">
                <label htmlFor="jobDomain" className="form-label">
                  Job Domain
                </label>
                <select
                  id="jobDomain"
                  value={formData.jobDomain}
                  onChange={(e) => handleChange('jobDomain', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select domain</option>
                  {JOB_DOMAINS.map((domain) => (
                    <option key={domain.value} value={domain.value}>{domain.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[#64748b]">
                  Functional area or category of the job role
                </p>
              </div>

              {/* Assign Recruiter - Requirement 1.1 */}
              <div className="form-group">
                <label htmlFor="assignedRecruiterId" className="form-label">
                  Assign Recruiter
                </label>
                <select
                  id="assignedRecruiterId"
                  value={formData.assignedRecruiterId}
                  onChange={(e) => handleChange('assignedRecruiterId', e.target.value)}
                  className="form-select"
                  disabled={isLoadingUsers}
                >
                  <option value="">Select recruiter</option>
                  {recruiters.map((recruiter) => (
                    <option key={recruiter.id} value={recruiter.id}>
                      {recruiter.name} ({recruiter.role === 'hiring_manager' ? 'Hiring Manager' : 'Recruiter'})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[#64748b]">
                  {isLoadingUsers ? 'Loading recruiters...' : 'Assign a recruiter to manage this job posting'}
                </p>
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

          {/* Mandatory Criteria Section - Requirement 3.1 */}
          <MandatoryCriteriaSection 
            value={formData.mandatoryCriteria || DEFAULT_MANDATORY_CRITERIA}
            onChange={(criteria) => handleChange('mandatoryCriteria', criteria)}
          />

          {/* Screening Questions Section */}
          <ScreeningQuestionsSection
            value={formData.screeningQuestions}
            onChange={(questions) => handleChange('screeningQuestions', questions)}
          />

          {/* Pipeline Stage Configuration - Requirement 4.1 */}
          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="form-section-header">Pipeline Stages Configuration</h3>
                <p className="form-section-subtitle">
                  Configure the hiring pipeline stages organized by phases. Each phase can contain multiple stages.
                </p>
              </div>
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowStageImportModal(true)}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Import Stages
              </Button>
            </div>
            <PipelineStageConfigurator
              stages={formData.pipelineStages}
              onChange={(stages) => handleChange('pipelineStages', stages)}
            />
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
