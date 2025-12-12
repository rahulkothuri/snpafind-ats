import { useState, useEffect, useRef, type FormEvent, type DragEvent, type ChangeEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

// Types for the application form
interface JobDetails {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  employmentType: string;
  department: string;
  description: string;
}

interface ApplicationFormData {
  fullName: string;
  email: string;
  phone: string;
  currentLocation: string;
  linkedinProfile: string;
  portfolioUrl: string;
  resumeFile: File | null;
  coverLetter: string;
  desiredSalary: string;
  workAuthorization: 'yes' | 'no' | null;
  agreedToTerms: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const formSteps = [
  { id: 1, title: 'Personal Information', progress: 25 },
  { id: 2, title: 'Resume / CV', progress: 50 },
  { id: 3, title: 'Additional Information', progress: 75 },
  { id: 4, title: 'Review & Submit', progress: 100 },
];

const initialFormData: ApplicationFormData = {
  fullName: '',
  email: '',
  phone: '',
  currentLocation: '',
  linkedinProfile: '',
  portfolioUrl: '',
  resumeFile: null,
  coverLetter: '',
  desiredSalary: '',
  workAuthorization: null,
  agreedToTerms: false,
};

export function ApplicationPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [job, setJob] = useState<JobDetails | null>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch job details on mount
  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        setJobError('Invalid job URL');
        setIsLoadingJob(false);
        return;
      }
      
      try {
        const response = await api.get(`/public/jobs/${jobId}`);
        setJob(response.data);
      } catch (err: unknown) {
        const error = err as { response?: { status?: number } };
        if (error.response?.status === 404) {
          setJobError('This job posting is no longer available');
        } else {
          setJobError('Failed to load job details. Please try again later.');
        }
      } finally {
        setIsLoadingJob(false);
      }
    };
    
    fetchJob();
  }, [jobId]);

  const updateFormData = (field: keyof ApplicationFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validation for each step
  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};
    
    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.currentLocation.trim()) newErrors.currentLocation = 'Current location is required';
    }
    
    if (step === 2) {
      if (!formData.resumeFile) newErrors.resumeFile = 'Resume is required';
    }
    
    if (step === 4) {
      if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // File handling
  const validateFile = (file: File): string | null => {
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      return 'Invalid file format. Please upload PDF, DOC, or DOCX';
    }
    if (file.size > maxSize) {
      return 'File size exceeds 5MB limit';
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrors(prev => ({ ...prev, resumeFile: error }));
      return;
    }
    updateFormData('resumeFile', file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeFile = () => {
    updateFormData('resumeFile', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep(4) || !jobId) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const submitData = new FormData();
      submitData.append('jobId', jobId);
      submitData.append('fullName', formData.fullName);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('currentLocation', formData.currentLocation);
      submitData.append('workAuthorization', formData.workAuthorization || 'no');
      submitData.append('agreedToTerms', String(formData.agreedToTerms));
      
      if (formData.linkedinProfile) submitData.append('linkedinProfile', formData.linkedinProfile);
      if (formData.portfolioUrl) submitData.append('portfolioUrl', formData.portfolioUrl);
      if (formData.coverLetter) submitData.append('coverLetter', formData.coverLetter);
      if (formData.desiredSalary) submitData.append('desiredSalary', formData.desiredSalary);
      if (formData.resumeFile) submitData.append('resume', formData.resumeFile);
      
      await api.post('/public/applications', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setSubmitSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; code?: string } } };
      const message = error.response?.data?.message || 'Failed to submit application. Please try again.';
      setErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoadingJob) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b6cf0]"></div>
      </div>
    );
  }

  // Error state
  if (jobError || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#111827] mb-2">Job Not Found</h1>
          <p className="text-[#64748b]">{jobError || 'This job posting is no longer available'}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#111827] mb-2">Application Submitted!</h1>
          <p className="text-[#64748b] mb-6">
            Thank you for applying to {job.title} at {job.companyName}. We'll review your application and get back to you soon.
          </p>
          <Link to="/" className="text-[#0b6cf0] hover:underline">Return to homepage</Link>
        </div>
      </div>
    );
  }

  // Step indicator component
  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#374151]">
          Step {currentStep} of 4: {formSteps[currentStep - 1].title}
        </span>
        <span className="text-sm text-[#64748b]">{formSteps[currentStep - 1].progress}%</span>
      </div>
      <div className="w-full bg-[#e2e8f0] rounded-full h-2">
        <div 
          className="bg-[#0b6cf0] h-2 rounded-full transition-all duration-300"
          style={{ width: `${formSteps[currentStep - 1].progress}%` }}
        />
      </div>
    </div>
  );

  // Step 1: Personal Information
  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#111827] mb-4">Personal Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="fullName" className="form-label">Full Name *</label>
          <input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => updateFormData('fullName', e.target.value)}
            className={`form-input ${errors.fullName ? 'error' : ''}`}
            placeholder="John Doe"
          />
          {errors.fullName && <p className="form-error">{errors.fullName}</p>}
        </div>
        
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email Address *</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="john@example.com"
          />
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>
        
        <div className="form-group">
          <label htmlFor="phone" className="form-label">Phone Number *</label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            className={`form-input ${errors.phone ? 'error' : ''}`}
            placeholder="+1 (555) 123-4567"
          />
          {errors.phone && <p className="form-error">{errors.phone}</p>}
        </div>
        
        <div className="form-group">
          <label htmlFor="currentLocation" className="form-label">Current Location *</label>
          <input
            id="currentLocation"
            type="text"
            value={formData.currentLocation}
            onChange={(e) => updateFormData('currentLocation', e.target.value)}
            className={`form-input ${errors.currentLocation ? 'error' : ''}`}
            placeholder="San Francisco, CA"
          />
          {errors.currentLocation && <p className="form-error">{errors.currentLocation}</p>}
        </div>
      </div>

      <div className="pt-4 border-t border-[#e2e8f0]">
        <p className="text-sm text-[#64748b] mb-4">Optional Information</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="linkedinProfile" className="form-label">LinkedIn Profile</label>
            <input
              id="linkedinProfile"
              type="url"
              value={formData.linkedinProfile}
              onChange={(e) => updateFormData('linkedinProfile', e.target.value)}
              className="form-input"
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="portfolioUrl" className="form-label">Portfolio / Website</label>
            <input
              id="portfolioUrl"
              type="url"
              value={formData.portfolioUrl}
              onChange={(e) => updateFormData('portfolioUrl', e.target.value)}
              className="form-input"
              placeholder="https://johndoe.com"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Resume Upload
  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#111827] mb-4">Resume / CV</h2>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-[#0b6cf0] bg-blue-50' : 'border-[#e2e8f0] hover:border-[#0b6cf0]'}
          ${errors.resumeFile ? 'border-red-300 bg-red-50' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {formData.resumeFile ? (
          <div className="flex items-center justify-center gap-3">
            <svg className="w-8 h-8 text-[#0b6cf0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-left">
              <p className="font-medium text-[#111827]">{formData.resumeFile.name}</p>
              <p className="text-sm text-[#64748b]">{(formData.resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeFile(); }}
              className="ml-4 p-1 text-red-500 hover:bg-red-50 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <svg className="w-12 h-12 mx-auto text-[#64748b] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-[#374151] font-medium mb-1">Drag and drop your resume here</p>
            <p className="text-sm text-[#64748b]">or click to browse</p>
            <p className="text-xs text-[#94a3b8] mt-2">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
          </>
        )}
      </div>
      {errors.resumeFile && <p className="form-error">{errors.resumeFile}</p>}
    </div>
  );

  // Step 3: Additional Information
  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#111827] mb-4">Additional Information</h2>
      
      <div className="form-group">
        <label htmlFor="coverLetter" className="form-label">Cover Letter (Optional)</label>
        <textarea
          id="coverLetter"
          value={formData.coverLetter}
          onChange={(e) => updateFormData('coverLetter', e.target.value)}
          className="form-input min-h-[150px]"
          placeholder="Tell us why you're interested in this position..."
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="desiredSalary" className="form-label">Desired Salary (Optional)</label>
        <input
          id="desiredSalary"
          type="text"
          value={formData.desiredSalary}
          onChange={(e) => updateFormData('desiredSalary', e.target.value)}
          className="form-input"
          placeholder="e.g., $80,000 - $100,000"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Are you authorized to work in this location? *</label>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="workAuthorization"
              checked={formData.workAuthorization === 'yes'}
              onChange={() => updateFormData('workAuthorization', 'yes')}
              className="w-4 h-4 text-[#0b6cf0]"
            />
            <span className="text-[#374151]">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="workAuthorization"
              checked={formData.workAuthorization === 'no'}
              onChange={() => updateFormData('workAuthorization', 'no')}
              className="w-4 h-4 text-[#0b6cf0]"
            />
            <span className="text-[#374151]">No</span>
          </label>
        </div>
      </div>
    </div>
  );

  // Step 4: Review and Submit
  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[#111827] mb-4">Review Your Application</h2>
      
      <div className="bg-[#f8fafc] rounded-lg p-4 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-[#64748b] mb-2">Personal Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p><span className="text-[#64748b]">Name:</span> <span className="text-[#111827]">{formData.fullName}</span></p>
            <p><span className="text-[#64748b]">Email:</span> <span className="text-[#111827]">{formData.email}</span></p>
            <p><span className="text-[#64748b]">Phone:</span> <span className="text-[#111827]">{formData.phone}</span></p>
            <p><span className="text-[#64748b]">Location:</span> <span className="text-[#111827]">{formData.currentLocation}</span></p>
            {formData.linkedinProfile && <p><span className="text-[#64748b]">LinkedIn:</span> <span className="text-[#111827]">{formData.linkedinProfile}</span></p>}
            {formData.portfolioUrl && <p><span className="text-[#64748b]">Portfolio:</span> <span className="text-[#111827]">{formData.portfolioUrl}</span></p>}
          </div>
        </div>
        
        <div className="border-t border-[#e2e8f0] pt-4">
          <h3 className="text-sm font-medium text-[#64748b] mb-2">Resume</h3>
          <p className="text-sm text-[#111827]">{formData.resumeFile?.name || 'No file uploaded'}</p>
        </div>
        
        <div className="border-t border-[#e2e8f0] pt-4">
          <h3 className="text-sm font-medium text-[#64748b] mb-2">Additional Information</h3>
          <div className="text-sm space-y-1">
            {formData.coverLetter && <p><span className="text-[#64748b]">Cover Letter:</span> <span className="text-[#111827]">{formData.coverLetter.substring(0, 100)}...</span></p>}
            {formData.desiredSalary && <p><span className="text-[#64748b]">Desired Salary:</span> <span className="text-[#111827]">{formData.desiredSalary}</span></p>}
            <p><span className="text-[#64748b]">Work Authorization:</span> <span className="text-[#111827]">{formData.workAuthorization === 'yes' ? 'Yes' : formData.workAuthorization === 'no' ? 'No' : 'Not specified'}</span></p>
          </div>
        </div>
      </div>
      
      <div className="form-group">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreedToTerms}
            onChange={(e) => updateFormData('agreedToTerms', e.target.checked)}
            className="w-4 h-4 mt-1 text-[#0b6cf0] rounded"
          />
          <span className="text-sm text-[#374151]">
            I agree to the <a href="#" className="text-[#0b6cf0] hover:underline">Privacy Policy</a> and{' '}
            <a href="#" className="text-[#0b6cf0] hover:underline">Terms of Service</a>. I understand that my information will be processed in accordance with these policies.
          </span>
        </label>
        {errors.agreedToTerms && <p className="form-error mt-2">{errors.agreedToTerms}</p>}
      </div>
      
      {errors.submit && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{errors.submit}</p>
        </div>
      )}
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Job Header */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-[#e2e8f0]">
          <div className="flex items-start gap-4">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.companyName} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[#0b6cf0] flex items-center justify-center">
                <span className="text-white font-bold">{job.companyName.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold text-[#111827]">{job.title}</h1>
              <p className="text-[#64748b]">{job.companyName}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e0f2fe] text-[#0369a1]">
                  {job.location}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f0fdf4] text-[#166534]">
                  {job.employmentType}
                </span>
                {job.department && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fef3c7] text-[#92400e]">
                    {job.department}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
          <StepIndicator />
          
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-[#e2e8f0]">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2.5 text-[#374151] bg-white border border-[#e2e8f0] rounded-full hover:bg-[#f8fafc] transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 text-white bg-[#0b6cf0] rounded-full hover:bg-[#0958c7] transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-white bg-[#0b6cf0] rounded-full hover:bg-[#0958c7] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ApplicationPage;
