import { useState, useEffect, useRef, type FormEvent, type DragEvent, type ChangeEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { JobDetailsPanel } from '../components/JobDetailsPanel';
import type { ScreeningQuestion } from '../types';

// Types for the application form - enhanced with all new job fields
interface JobDetails {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  employmentType: string;
  department: string;
  description: string;
  // Enhanced job fields
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  variables?: string;
  educationQualification?: string;
  openings?: number;
  ageUpTo?: number;
  skills?: string[];
  preferredIndustry?: string;
  workMode?: string;
  locations?: string[];
  priority?: string;
  jobDomain?: string;
  // Additional job description sections (Requirement 1.3)
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  // Screening questions
  screeningQuestions?: ScreeningQuestion[];
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
  screeningAnswers: Record<string, string | string[] | number | boolean>;
}

interface FormErrors {
  [key: string]: string;
}

const formSteps = [
  { id: 1, title: 'Screening Questions', progress: 33 },
  { id: 2, title: 'Personal Information & Resume', progress: 66 },
  { id: 3, title: 'Review & Submit', progress: 100 },
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
  screeningAnswers: {},
};

export function ApplicationPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // View state management - Requirements 3.1, 3.2, 3.3, 3.4
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [job, setJob] = useState<JobDetails | null>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Handler to show application form when Apply button is clicked - Requirement 3.3
  const handleApplyClick = () => {
    setShowApplicationForm(true);
  };

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
      // Screening Questions validation
      const screeningQuestions = job?.screeningQuestions || [];
      for (const question of screeningQuestions) {
        if (question.required) {
          const answer = formData.screeningAnswers[question.id];
          if (answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
            newErrors[`screening_${question.id}`] = 'This question is required';
          }
        }
      }
    }
    
    if (step === 2) {
      // Personal Information validation
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.currentLocation.trim()) newErrors.currentLocation = 'Current location is required';
      
      // Resume validation
      if (!formData.resumeFile) newErrors.resumeFile = 'Resume is required';
    }
    
    if (step === 3) {
      if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
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
    if (!validateStep(3) || !jobId) return;
    
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
      
      // Add screening answers as JSON string
      if (Object.keys(formData.screeningAnswers).length > 0) {
        submitData.append('screeningAnswers', JSON.stringify(formData.screeningAnswers));
      }
      
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b6cf0]"></div>
      </div>
    );
  }

  // Error state
  if (jobError || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="text-center max-w-md w-full">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-[#111827] mb-2">Job Not Found</h1>
          <p className="text-sm sm:text-base text-[#64748b]">{jobError || 'This job posting is no longer available'}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="text-center max-w-md w-full">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-[#111827] mb-2">Application Submitted!</h1>
          <p className="text-sm sm:text-base text-[#64748b] mb-6">
            Thank you for applying to {job.title} at {job.companyName}. We'll review your application and get back to you soon.
          </p>
          <Link to="/" className="text-[#0b6cf0] hover:underline inline-block min-h-[44px] leading-[44px] touch-manipulation">Return to homepage</Link>
        </div>
      </div>
    );
  }

  // Step indicator component - Responsive with accessibility
  const StepIndicator = () => (
    <div className="mb-6 sm:mb-8" role="progressbar" aria-valuenow={formSteps[currentStep - 1].progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Application progress: Step ${currentStep} of 3`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-medium text-[#374151]">
          Step {currentStep} of 3: {formSteps[currentStep - 1].title}
        </span>
        <span className="text-xs sm:text-sm text-[#64748b]" aria-hidden="true">{formSteps[currentStep - 1].progress}%</span>
      </div>
      <div className="w-full bg-[#e2e8f0] rounded-full h-2">
        <div 
          className="bg-[#0b6cf0] h-2 rounded-full transition-all duration-300"
          style={{ width: `${formSteps[currentStep - 1].progress}%` }}
        />
      </div>
    </div>
  );

  // Helper function to update screening answer
  const updateScreeningAnswer = (questionId: string, value: string | string[] | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      screeningAnswers: {
        ...prev.screeningAnswers,
        [questionId]: value,
      },
    }));
    // Clear error for this question
    if (errors[`screening_${questionId}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`screening_${questionId}`];
        return newErrors;
      });
    }
  };

  // Step 1: Screening Questions
  const renderScreeningQuestions = () => {
    const screeningQuestions = job?.screeningQuestions || [];
    
    if (screeningQuestions.length === 0) {
      // Skip to next step if no screening questions
      return (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[#374151] font-medium">No screening questions for this position</p>
          <p className="text-sm text-[#64748b] mt-1">Click Next to continue with your application</p>
        </div>
      );
    }

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">Screening Questions</p>
              <p className="text-sm text-blue-700 mt-1">Please answer the following questions to help us understand your qualifications better.</p>
            </div>
          </div>
        </div>

        {screeningQuestions.map((question, index) => (
          <div key={question.id} className="form-group">
            <label className="form-label">
              {index + 1}. {question.question} {question.required && <span className="text-red-500">*</span>}
            </label>
            
            {question.type === 'text' && (
              <input
                type="text"
                value={(formData.screeningAnswers[question.id] as string) || ''}
                onChange={(e) => updateScreeningAnswer(question.id, e.target.value)}
                className={`form-input min-h-[44px] ${errors[`screening_${question.id}`] ? 'error' : ''}`}
                placeholder="Enter your answer..."
              />
            )}
            
            {question.type === 'textarea' && (
              <textarea
                value={(formData.screeningAnswers[question.id] as string) || ''}
                onChange={(e) => updateScreeningAnswer(question.id, e.target.value)}
                className={`form-input min-h-[100px] ${errors[`screening_${question.id}`] ? 'error' : ''}`}
                placeholder="Enter your answer..."
              />
            )}
            
            {question.type === 'number' && (
              <input
                type="number"
                value={(formData.screeningAnswers[question.id] as number) || ''}
                onChange={(e) => updateScreeningAnswer(question.id, e.target.value ? Number(e.target.value) : '')}
                className={`form-input min-h-[44px] ${errors[`screening_${question.id}`] ? 'error' : ''}`}
                placeholder="Enter a number..."
              />
            )}
            
            {question.type === 'yes_no' && (
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                  <input
                    type="radio"
                    name={`screening_${question.id}`}
                    checked={formData.screeningAnswers[question.id] === 'yes'}
                    onChange={() => updateScreeningAnswer(question.id, 'yes')}
                    className="w-5 h-5 text-[#0b6cf0]"
                  />
                  <span className="text-[#374151]">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                  <input
                    type="radio"
                    name={`screening_${question.id}`}
                    checked={formData.screeningAnswers[question.id] === 'no'}
                    onChange={() => updateScreeningAnswer(question.id, 'no')}
                    className="w-5 h-5 text-[#0b6cf0]"
                  />
                  <span className="text-[#374151]">No</span>
                </label>
              </div>
            )}
            
            {question.type === 'single_choice' && question.options && (
              <div className="space-y-2 mt-2">
                {question.options.map((option, optIndex) => (
                  <label key={optIndex} className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input
                      type="radio"
                      name={`screening_${question.id}`}
                      checked={formData.screeningAnswers[question.id] === option}
                      onChange={() => updateScreeningAnswer(question.id, option)}
                      className="w-5 h-5 text-[#0b6cf0]"
                    />
                    <span className="text-[#374151]">{option}</span>
                  </label>
                ))}
              </div>
            )}
            
            {question.type === 'multiple_choice' && question.options && (
              <div className="space-y-2 mt-2">
                {question.options.map((option, optIndex) => {
                  const currentAnswers = (formData.screeningAnswers[question.id] as string[]) || [];
                  const isChecked = currentAnswers.includes(option);
                  return (
                    <label key={optIndex} className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const newAnswers = isChecked
                            ? currentAnswers.filter(a => a !== option)
                            : [...currentAnswers, option];
                          updateScreeningAnswer(question.id, newAnswers);
                        }}
                        className="w-5 h-5 text-[#0b6cf0] rounded"
                      />
                      <span className="text-[#374151]">{option}</span>
                    </label>
                  );
                })}
              </div>
            )}
            
            {errors[`screening_${question.id}`] && (
              <p className="form-error mt-1">{errors[`screening_${question.id}`]}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Step 2: Personal Information, Resume, and Additional Information (Combined)
  // Responsive: Full-width fields on mobile, two-column grid on tablet/desktop
  const renderStep1 = () => (
    <div className="space-y-6 sm:space-y-8 max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
      {/* Personal Information Section */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-[#111827] mb-3 sm:mb-4">Personal Information</h2>
        
        {/* Responsive grid: 1 column on mobile, 2 columns on tablet+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">Full Name *</label>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => updateFormData('fullName', e.target.value)}
              className={`form-input min-h-[44px] ${errors.fullName ? 'error' : ''}`}
              placeholder="John Doe"
              aria-invalid={errors.fullName ? 'true' : 'false'}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            />
            {errors.fullName && <p className="form-error" id="fullName-error" role="alert">{errors.fullName}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address *</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              className={`form-input min-h-[44px] ${errors.email ? 'error' : ''}`}
              placeholder="john@example.com"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && <p className="form-error" id="email-error" role="alert">{errors.email}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone Number *</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
              className={`form-input min-h-[44px] ${errors.phone ? 'error' : ''}`}
              placeholder="+1 (555) 123-4567"
              aria-invalid={errors.phone ? 'true' : 'false'}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && <p className="form-error" id="phone-error" role="alert">{errors.phone}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="currentLocation" className="form-label">Current Location *</label>
            <input
              id="currentLocation"
              type="text"
              value={formData.currentLocation}
              onChange={(e) => updateFormData('currentLocation', e.target.value)}
              className={`form-input min-h-[44px] ${errors.currentLocation ? 'error' : ''}`}
              placeholder="San Francisco, CA"
              aria-invalid={errors.currentLocation ? 'true' : 'false'}
              aria-describedby={errors.currentLocation ? 'currentLocation-error' : undefined}
            />
            {errors.currentLocation && <p className="form-error" id="currentLocation-error" role="alert">{errors.currentLocation}</p>}
          </div>
        </div>

        <div className="pt-3 sm:pt-4 border-t border-[#e2e8f0]">
          <p className="text-sm text-[#64748b] mb-3 sm:mb-4">Optional Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="form-group">
              <label htmlFor="linkedinProfile" className="form-label">LinkedIn Profile</label>
              <input
                id="linkedinProfile"
                type="url"
                value={formData.linkedinProfile}
                onChange={(e) => updateFormData('linkedinProfile', e.target.value)}
                className="form-input min-h-[44px]"
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
                className="form-input min-h-[44px]"
                placeholder="https://johndoe.com"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resume Upload Section */}
      <div className="space-y-4 pt-4 sm:pt-6 border-t border-[#e2e8f0]">
        <h2 className="text-base sm:text-lg font-semibold text-[#111827] mb-3 sm:mb-4" id="resume-section-heading">Resume / CV</h2>
        
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
          role="button"
          tabIndex={0}
          aria-labelledby="resume-section-heading"
          aria-describedby="resume-help-text"
          className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors touch-manipulation
            ${isDragging ? 'border-[#0b6cf0] bg-blue-50' : 'border-[#e2e8f0] hover:border-[#0b6cf0]'}
            ${errors.resumeFile ? 'border-red-300 bg-red-50' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Upload resume file"
          />
          
          {formData.resumeFile ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <svg className="w-8 h-8 text-[#0b6cf0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-center sm:text-left">
                <p className="font-medium text-[#111827] text-sm sm:text-base break-all">{formData.resumeFile.name}</p>
                <p className="text-xs sm:text-sm text-[#64748b]">{(formData.resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                className="mt-2 sm:mt-0 sm:ml-4 p-2 text-red-500 hover:bg-red-50 rounded min-h-[44px] min-w-[44px] touch-manipulation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <svg className="w-10 sm:w-12 h-10 sm:h-12 mx-auto text-[#64748b] mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-[#374151] font-medium mb-1 text-sm sm:text-base">Drag and drop your resume here</p>
              <p className="text-xs sm:text-sm text-[#64748b]">or tap to browse</p>
              <p className="text-xs text-[#94a3b8] mt-2" id="resume-help-text">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
            </>
          )}
        </div>
        {errors.resumeFile && <p className="form-error" id="resume-error" role="alert">{errors.resumeFile}</p>}
      </div>

      {/* Additional Information Section */}
      <div className="space-y-4 pt-4 sm:pt-6 border-t border-[#e2e8f0]">
        <h2 className="text-base sm:text-lg font-semibold text-[#111827] mb-3 sm:mb-4">Additional Information</h2>
        
        <div className="form-group">
          <label htmlFor="coverLetter" className="form-label">Cover Letter (Optional)</label>
          <textarea
            id="coverLetter"
            value={formData.coverLetter}
            onChange={(e) => updateFormData('coverLetter', e.target.value)}
            className="form-input min-h-[120px] sm:min-h-[150px]"
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
            className="form-input min-h-[44px]"
            placeholder="e.g., $80,000 - $100,000"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" id="work-auth-label">Are you authorized to work in this location? *</label>
          <div className="flex gap-4 sm:gap-6 mt-2" role="radiogroup" aria-labelledby="work-auth-label">
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px] touch-manipulation">
              <input
                type="radio"
                name="workAuthorization"
                checked={formData.workAuthorization === 'yes'}
                onChange={() => updateFormData('workAuthorization', 'yes')}
                className="w-5 h-5 sm:w-4 sm:h-4 text-[#0b6cf0]"
                aria-label="Yes, I am authorized to work"
              />
              <span className="text-[#374151]">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px] touch-manipulation">
              <input
                type="radio"
                name="workAuthorization"
                checked={formData.workAuthorization === 'no'}
                onChange={() => updateFormData('workAuthorization', 'no')}
                className="w-5 h-5 sm:w-4 sm:h-4 text-[#0b6cf0]"
                aria-label="No, I am not authorized to work"
              />
              <span className="text-[#374151]">No</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Review and Submit (formerly step 4)
  // Step 3: Review and Submit
  // Responsive: Adjusted grid and spacing for different screen sizes
  const renderStep2 = () => {
    const screeningQuestions = job?.screeningQuestions || [];
    
    return (
    <div className="space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
      <h2 className="text-base sm:text-lg font-semibold text-[#111827] mb-3 sm:mb-4">Review Your Application</h2>
      
      <div className="bg-[#f8fafc] rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Screening Questions Review */}
        {screeningQuestions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[#64748b] mb-2">Screening Questions</h3>
            <div className="space-y-2 text-sm">
              {screeningQuestions.map((question, index) => {
                const answer = formData.screeningAnswers[question.id];
                let displayAnswer = 'Not answered';
                if (answer !== undefined && answer !== '') {
                  if (Array.isArray(answer)) {
                    displayAnswer = answer.join(', ');
                  } else {
                    displayAnswer = String(answer);
                  }
                }
                return (
                  <div key={question.id} className="pb-2 border-b border-[#e2e8f0] last:border-0">
                    <p className="text-[#64748b]">{index + 1}. {question.question}</p>
                    <p className="text-[#111827] mt-1">{displayAnswer}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {screeningQuestions.length > 0 && (
          <div className="border-t border-[#e2e8f0] pt-3 sm:pt-4" />
        )}
        
        <div>
          <h3 className="text-sm font-medium text-[#64748b] mb-2">Personal Information</h3>
          {/* Responsive grid: 1 column on mobile, 2 columns on tablet+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-sm">
            <p><span className="text-[#64748b]">Name:</span> <span className="text-[#111827]">{formData.fullName}</span></p>
            <p><span className="text-[#64748b]">Email:</span> <span className="text-[#111827] break-all">{formData.email}</span></p>
            <p><span className="text-[#64748b]">Phone:</span> <span className="text-[#111827]">{formData.phone}</span></p>
            <p><span className="text-[#64748b]">Location:</span> <span className="text-[#111827]">{formData.currentLocation}</span></p>
            {formData.linkedinProfile && <p className="col-span-1 sm:col-span-2"><span className="text-[#64748b]">LinkedIn:</span> <span className="text-[#111827] break-all">{formData.linkedinProfile}</span></p>}
            {formData.portfolioUrl && <p className="col-span-1 sm:col-span-2"><span className="text-[#64748b]">Portfolio:</span> <span className="text-[#111827] break-all">{formData.portfolioUrl}</span></p>}
          </div>
        </div>
        
        <div className="border-t border-[#e2e8f0] pt-3 sm:pt-4">
          <h3 className="text-sm font-medium text-[#64748b] mb-2">Resume</h3>
          <p className="text-sm text-[#111827] break-all">{formData.resumeFile?.name || 'No file uploaded'}</p>
        </div>
        
        <div className="border-t border-[#e2e8f0] pt-3 sm:pt-4">
          <h3 className="text-sm font-medium text-[#64748b] mb-2">Additional Information</h3>
          <div className="text-sm space-y-1">
            {formData.coverLetter && <p><span className="text-[#64748b]">Cover Letter:</span> <span className="text-[#111827]">{formData.coverLetter.substring(0, 100)}...</span></p>}
            {formData.desiredSalary && <p><span className="text-[#64748b]">Desired Salary:</span> <span className="text-[#111827]">{formData.desiredSalary}</span></p>}
            <p><span className="text-[#64748b]">Work Authorization:</span> <span className="text-[#111827]">{formData.workAuthorization === 'yes' ? 'Yes' : formData.workAuthorization === 'no' ? 'No' : 'Not specified'}</span></p>
          </div>
        </div>
      </div>
      
      <div className="form-group">
        <label className="flex items-start gap-3 cursor-pointer min-h-[44px] touch-manipulation">
          <input
            type="checkbox"
            checked={formData.agreedToTerms}
            onChange={(e) => updateFormData('agreedToTerms', e.target.checked)}
            className="w-5 h-5 sm:w-4 sm:h-4 mt-0.5 text-[#0b6cf0] rounded flex-shrink-0"
            aria-invalid={errors.agreedToTerms ? 'true' : 'false'}
            aria-describedby={errors.agreedToTerms ? 'terms-error' : undefined}
            aria-label="I agree to the Privacy Policy and Terms of Service"
          />
          <span className="text-sm text-[#374151]">
            I agree to the <a href="#" className="text-[#0b6cf0] hover:underline">Privacy Policy</a> and{' '}
            <a href="#" className="text-[#0b6cf0] hover:underline">Terms of Service</a>. I understand that my information will be processed in accordance with these policies.
          </span>
        </label>
        {errors.agreedToTerms && <p className="form-error mt-2" id="terms-error" role="alert">{errors.agreedToTerms}</p>}
      </div>
      
      {errors.submit && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200" role="alert">
          <p className="text-sm text-red-700">{errors.submit}</p>
        </div>
      )}
    </div>
  );
  };

  // Main render - Responsive layout (Requirements 5.1, 5.2, 5.3, 5.4, 5.5)
  // Mobile (< 768px): Stack content vertically, full-width form fields, touch-friendly buttons
  // Tablet (768px - 1024px): Adjusted column proportions, optimized spacing
  // Desktop (> 1024px): Two-column layout with sticky job details
  
  // Job Details View - Initial state showing job info with Apply button (Requirements 3.1, 3.2, 3.4)
  const renderJobDetailsView = () => (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">
      <JobDetailsPanel
        job={{
          id: job.id,
          title: job.title,
          department: job.department,
          description: job.description,
          openings: job.openings,
          experienceMin: job.experienceMin,
          experienceMax: job.experienceMax,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          variables: job.variables,
          educationQualification: job.educationQualification,
          ageUpTo: job.ageUpTo,
          skills: job.skills,
          preferredIndustry: job.preferredIndustry,
          workMode: job.workMode,
          locations: job.locations,
          priority: job.priority,
          jobDomain: job.jobDomain,
          // Additional job description sections (Requirement 1.3)
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          benefits: job.benefits,
        }}
        company={{
          name: job.companyName,
          logoUrl: job.companyLogo,
        }}
      />
      
      {/* Apply Button at bottom - Requirement 3.2, 5.5 (touch-friendly min 44px) */}
      <div className="mt-6 flex justify-center px-4 sm:px-0">
        <button
          type="button"
          onClick={handleApplyClick}
          className="w-full sm:w-auto px-8 py-3 text-white bg-[#0b6cf0] rounded-full hover:bg-[#0958c7] transition-colors text-lg font-medium shadow-lg hover:shadow-xl min-h-[44px] touch-manipulation"
        >
          Apply for this Position
        </button>
      </div>
    </div>
  );

  // Application Form View - Shown after clicking Apply (Requirement 3.3)
  // Responsive layout: stacked on mobile, two-column on tablet/desktop
  const renderApplicationFormView = () => (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 px-4 sm:px-6 lg:px-0">
      {/* Left Column - Job Details Panel */}
      {/* Mobile: Full width, not sticky */}
      {/* Tablet (768px-1024px): 45% width */}
      {/* Desktop (>1024px): 40% width, sticky */}
      <div className="w-full lg:w-[40%] md:w-[45%] lg:sticky lg:top-8 lg:self-start">
        <JobDetailsPanel
          job={{
            id: job.id,
            title: job.title,
            department: job.department,
            description: job.description,
            openings: job.openings,
            experienceMin: job.experienceMin,
            experienceMax: job.experienceMax,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            variables: job.variables,
            educationQualification: job.educationQualification,
            ageUpTo: job.ageUpTo,
            skills: job.skills,
            preferredIndustry: job.preferredIndustry,
            workMode: job.workMode,
            locations: job.locations,
            priority: job.priority,
            jobDomain: job.jobDomain,
            // Additional job description sections (Requirement 1.3)
            responsibilities: job.responsibilities,
            requirements: job.requirements,
            benefits: job.benefits,
          }}
          company={{
            name: job.companyName,
            logoUrl: job.companyLogo,
          }}
        />
      </div>

      {/* Right Column - Application Form */}
      {/* Mobile: Full width */}
      {/* Tablet (768px-1024px): 55% width */}
      {/* Desktop (>1024px): 60% width */}
      <div className="w-full lg:w-[60%] md:w-[55%]">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-[#e2e8f0] max-h-[90vh] overflow-y-auto">
          <StepIndicator />
          
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderScreeningQuestions()}
            {currentStep === 2 && renderStep1()}
            {currentStep === 3 && renderStep2()}
            
            {/* Navigation Buttons - Touch-friendly (min 44px) - Requirement 5.5 */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#e2e8f0]">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full sm:w-auto px-6 py-2.5 text-[#374151] bg-white border border-[#e2e8f0] rounded-full hover:bg-[#f8fafc] transition-colors min-h-[44px] touch-manipulation"
                >
                  Back
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto px-6 py-2.5 text-white bg-[#0b6cf0] rounded-full hover:bg-[#0958c7] transition-colors min-h-[44px] touch-manipulation"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 text-white bg-[#0b6cf0] rounded-full hover:bg-[#0958c7] transition-colors disabled:opacity-50 min-h-[44px] touch-manipulation"
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

  return (
    <div className="min-h-screen bg-[#f8fafc] py-4 sm:py-6 lg:py-8 px-0 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Conditional rendering based on showApplicationForm state - Requirements 3.3, 3.4 */}
        {showApplicationForm ? renderApplicationFormView() : renderJobDetailsView()}
      </div>
    </div>
  );
}

export default ApplicationPage;
