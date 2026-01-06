import { useState, useEffect, useRef, type FormEvent, type DragEvent, type ChangeEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { JobDetailsPanel } from '../components/JobDetailsPanel';
import type { ScreeningQuestion, MandatoryCriteria } from '../types';

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
  // Mandatory criteria
  mandatoryCriteria?: MandatoryCriteria;
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
  currentCompany: string;
  currentSalary: string;
  expectedSalary: string;
  desiredSalary?: string;
  noticePeriod: string;
  workAuthorization: 'yes' | 'no' | null;
  agreedToTerms: boolean;
  screeningAnswers: Record<string, string | string[] | number | boolean>;
}

interface FormErrors {
  [key: string]: string;
}

const formSteps = [
  { id: 1, title: 'Personal Information & Resume', progress: 33 },
  { id: 2, title: 'Screening Questions', progress: 66 },
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
  currentCompany: '',
  currentSalary: '',
  expectedSalary: '',
  desiredSalary: '',
  noticePeriod: '',
  workAuthorization: null,
  agreedToTerms: false,
  screeningAnswers: {},
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

      // Salary validation
      if (!formData.currentSalary.trim()) newErrors.currentSalary = 'Current salary is required';
      if (!formData.expectedSalary.trim()) newErrors.expectedSalary = 'Expected salary is required';
    }

    if (step === 2) {
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

    if (step === 3) {
      if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // If we're on step 1 and there are no screening questions, skip to step 3
      if (currentStep === 1 && (!job?.screeningQuestions || job.screeningQuestions.length === 0)) {
        setCurrentStep(3);
      } else {
        setCurrentStep(prev => Math.min(prev + 1, 3));
      }
    }
  };

  const handleBack = () => {
    // If we're on step 3 and there are no screening questions, go back to step 1
    if (currentStep === 3 && (!job?.screeningQuestions || job.screeningQuestions.length === 0)) {
      setCurrentStep(1);
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
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
      if (formData.currentCompany) submitData.append('currentCompany', formData.currentCompany);
      if (formData.currentSalary) submitData.append('currentCtc', formData.currentSalary);
      if (formData.expectedSalary) submitData.append('expectedCtc', formData.expectedSalary);
      if (formData.noticePeriod) submitData.append('noticePeriod', formData.noticePeriod);
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

  // Header Component
  const Header = () => {
    if (!job) return null;
    return (
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.companyName} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover border border-slate-100" />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {job.companyName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight line-clamp-1">{job.title}</h1>
              <p className="text-xs text-slate-500 line-clamp-1">{job.companyName} • {job.location}</p>
            </div>
          </div>
          <Link to="/" className="text-xs sm:text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            Browse Jobs
          </Link>
        </div>
      </div>
    );
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

  // Success View
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Thanks for applying to <strong>{job.companyName}</strong>. We've received your application for the <strong>{job.title}</strong> role.
            </p>
            <Link to="/" className="block w-full py-3 px-4 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors">
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="space-y-6 pr-1 sm:pr-2">
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
    <div className="space-y-6 sm:space-y-8 pr-1 sm:pr-2">
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
          <label htmlFor="currentCompany" className="form-label">Current Company</label>
          <input
            id="currentCompany"
            type="text"
            value={formData.currentCompany || ''}
            onChange={(e) => updateFormData('currentCompany', e.target.value)}
            className="form-input min-h-[44px]"
            placeholder="e.g. Acme Corp"
          />
        </div>

        <div className="form-group">
          <label htmlFor="currentSalary" className="form-label">Current Salary (CTC) *</label>
          <input
            id="currentSalary"
            type="text"
            value={formData.currentSalary}
            onChange={(e) => updateFormData('currentSalary', e.target.value)}
            className={`form-input min-h-[44px] ${errors.currentSalary ? 'border-red-500' : ''}`}
            placeholder="e.g., ₹8,00,000 / $50,000"
          />
          {errors.currentSalary && <p className="mt-1 text-red-600 text-sm">{errors.currentSalary}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="expectedSalary" className="form-label">Expected Salary (CTC) *</label>
          <input
            id="expectedSalary"
            type="text"
            value={formData.expectedSalary}
            onChange={(e) => updateFormData('expectedSalary', e.target.value)}
            className={`form-input min-h-[44px] ${errors.expectedSalary ? 'border-red-500' : ''}`}
            placeholder="e.g., ₹12,00,000 / $70,000"
          />
          {errors.expectedSalary && <p className="mt-1 text-red-600 text-sm">{errors.expectedSalary}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="noticePeriod" className="form-label">Notice Period</label>
          <input
            id="noticePeriod"
            type="text"
            value={formData.noticePeriod || ''}
            onChange={(e) => updateFormData('noticePeriod', e.target.value)}
            className="form-input min-h-[44px]"
            placeholder="e.g., 30 days, 2 months"
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
      <div className="space-y-4 sm:space-y-6 pr-1 sm:pr-2">
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
              {formData.currentCompany && <p><span className="text-[#64748b]">Current Company:</span> <span className="text-[#111827]">{formData.currentCompany}</span></p>}
              {formData.noticePeriod && <p><span className="text-[#64748b]">Notice Period:</span> <span className="text-[#111827]">{formData.noticePeriod}</span></p>}
              <p><span className="text-[#64748b]">Work Authorization:</span> <span className="text-[#111827]">{formData.workAuthorization === 'yes' ? 'Yes' : formData.workAuthorization === 'no' ? 'No' : 'Not specified'}</span></p>
            </div>
          </div>
        </div>
      </div>
    );
  };




  // Split Layout
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start">

          {/* LEFT COLUMN: Job Details */}
          <div className="lg:col-span-7 space-y-4 mb-6 lg:mb-0">
            {/* Mobile Apply Button (Visible only on small screens) */}
            <div className="lg:hidden mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-20 z-20">
              <button
                onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
              >
                Apply for this Job
              </button>
            </div>

            {/* Job Details Panel - Using job data */}
            {job && (
              <JobDetailsPanel
                job={job}
                company={{ name: job.companyName, logoUrl: job.companyLogo }}
              />
            )}

          </div>

          {/* RIGHT COLUMN: Application Form */}
          <div className="lg:col-span-5">
            <div id="application-form" className="transition-all duration-300">
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200">
                {/* Form Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <h3 className="text-lg font-bold">Apply Now</h3>
                  <div className="mt-4 flex items-center justify-between text-xs font-medium text-blue-100">
                    <span>Step {currentStep} of {formSteps.length}</span>
                    <span>{Math.round((currentStep / formSteps.length) * 100)}% Complete</span>
                  </div>
                  {/* Progress Bar inside Header */}
                  <div className="mt-2 h-1.5 bg-blue-900/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(currentStep / formSteps.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6">
                  {currentStep === 1 && (
                    <>
                      <h4 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-5 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">1</span>
                        Personal Info
                      </h4>
                      {renderStep1()}
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      <h4 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-5 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">2</span>
                        Screening Questions
                      </h4>
                      {renderScreeningQuestions()}
                    </>
                  )}

                  {currentStep === 3 && (
                    <>
                      <h4 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-5 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">3</span>
                        Review & Submit
                      </h4>
                      {renderStep2()}

                      {/* Terms */}
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <div className="relative flex items-center mt-0.5">
                            <input
                              type="checkbox"
                              checked={formData.agreedToTerms}
                              onChange={(e) => updateFormData('agreedToTerms', e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                          </div>
                          <span className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">
                            I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
                          </span>
                        </label>
                        {errors.agreedToTerms && <p className="text-xs text-red-500 mt-1 ml-7">{errors.agreedToTerms}</p>}
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  <div className="mt-8 flex items-center gap-3 pt-4 border-t border-slate-100">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        Back
                      </button>
                    )}

                    {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex-1 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        Next Step
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-5 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-md shadow-green-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            Submit Application
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {errors.submit && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {errors.submit}
                    </div>
                  )}

                </form>
              </div>

              {/* Security Badge */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Secure Application
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default ApplicationPage;
