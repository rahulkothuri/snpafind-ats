/**
 * Add Candidate Modal Component
 * 
 * Modal for adding candidates directly to a job from the Roles page.
 * Includes fields for: Name, Email, Phone, Experience, Current CTC, Expected CTC, Skills, Resume upload
 */

import { useState, useRef, type FormEvent, type ChangeEvent, type DragEvent } from 'react';
import { Button, MultiSelect, LoadingSpinner } from './index';
import api from '../services/api';
import { SKILLS } from '../constants/jobFormOptions';

interface AddCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
    onSuccess?: () => void;
}

interface CandidateFormData {
    name: string;
    email: string;
    phone: string;
    experienceYears: string;
    currentCompany: string;
    currentCtc: string;
    expectedCtc: string;
    location: string;
    noticePeriod: string;
    skills: string[];
    resumeFile: File | null;
    source: string;
}

const initialFormData: CandidateFormData = {
    name: '',
    email: '',
    phone: '',
    experienceYears: '',
    currentCompany: '',
    currentCtc: '',
    expectedCtc: '',
    location: '',
    noticePeriod: '',
    skills: [],
    resumeFile: null,
    source: 'Manual',
};

export function AddCandidateModal({ isOpen, onClose, jobId, jobTitle, onSuccess }: AddCandidateModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<CandidateFormData>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    if (!isOpen) return null;

    const updateFormData = (field: keyof CandidateFormData, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
        setSubmitError(null);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        if (!formData.experienceYears.trim()) newErrors.experienceYears = 'Experience is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // File handling
    const validateFile = (file: File): string | null => {
        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedExtensions.includes(ext)) {
            return 'Only PDF, DOC, and DOCX files are allowed';
        }
        if (file.size > maxSize) {
            return 'File size must be less than 5MB';
        }
        return null;
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const error = validateFile(file);
            if (error) {
                setErrors(prev => ({ ...prev, resumeFile: error }));
            } else {
                updateFormData('resumeFile', file);
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.resumeFile;
                    return newErrors;
                });
            }
        }
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const error = validateFile(file);
            if (error) {
                setErrors(prev => ({ ...prev, resumeFile: error }));
            } else {
                updateFormData('resumeFile', file);
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.resumeFile;
                    return newErrors;
                });
            }
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const submitData = new FormData();
            submitData.append('jobId', jobId);
            submitData.append('name', formData.name);
            submitData.append('email', formData.email);
            submitData.append('phone', formData.phone);
            submitData.append('experienceYears', formData.experienceYears);
            submitData.append('source', formData.source);

            if (formData.currentCompany) submitData.append('currentCompany', formData.currentCompany);
            if (formData.currentCtc) submitData.append('currentCtc', formData.currentCtc);
            if (formData.expectedCtc) submitData.append('expectedCtc', formData.expectedCtc);
            if (formData.location) submitData.append('location', formData.location);
            if (formData.noticePeriod) submitData.append('noticePeriod', formData.noticePeriod);
            if (formData.skills.length > 0) submitData.append('skills', JSON.stringify(formData.skills));
            if (formData.resumeFile) submitData.append('resume', formData.resumeFile);

            await api.post('/candidates/add-to-job', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Reset form and close
            setFormData(initialFormData);
            onSuccess?.();
            onClose();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setSubmitError(err.response?.data?.message || 'Failed to add candidate. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData(initialFormData);
        setErrors({});
        setSubmitError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Add Candidate</h2>
                        <p className="text-sm text-gray-500">Adding to: {jobTitle}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    {submitError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {submitError}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => updateFormData('name', e.target.value)}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.name ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                placeholder="John Doe"
                            />
                            {errors.name && <p className="mt-1 text-red-600 text-xs">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => updateFormData('email', e.target.value)}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.email ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                placeholder="john@example.com"
                            />
                            {errors.email && <p className="mt-1 text-red-600 text-xs">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => updateFormData('phone', e.target.value)}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.phone ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                placeholder="+91 98765 43210"
                            />
                            {errors.phone && <p className="mt-1 text-red-600 text-xs">{errors.phone}</p>}
                        </div>

                        {/* Experience */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Experience (Years) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={formData.experienceYears}
                                onChange={(e) => updateFormData('experienceYears', e.target.value)}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.experienceYears ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                placeholder="5"
                            />
                            {errors.experienceYears && <p className="mt-1 text-red-600 text-xs">{errors.experienceYears}</p>}
                        </div>

                        {/* Current Company */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Current Company
                            </label>
                            <input
                                type="text"
                                value={formData.currentCompany}
                                onChange={(e) => updateFormData('currentCompany', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="ABC Corp"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Location
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => updateFormData('location', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Bangalore, India"
                            />
                        </div>

                        {/* Current CTC */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Current CTC
                            </label>
                            <input
                                type="text"
                                value={formData.currentCtc}
                                onChange={(e) => updateFormData('currentCtc', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="₹12,00,000"
                            />
                        </div>

                        {/* Expected CTC */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Expected CTC
                            </label>
                            <input
                                type="text"
                                value={formData.expectedCtc}
                                onChange={(e) => updateFormData('expectedCtc', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="₹15,00,000"
                            />
                        </div>

                        {/* Notice Period */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Notice Period
                            </label>
                            <select
                                value={formData.noticePeriod}
                                onChange={(e) => updateFormData('noticePeriod', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">Select</option>
                                <option value="Immediate">Immediate</option>
                                <option value="15 days">15 days</option>
                                <option value="30 days">30 days</option>
                                <option value="60 days">60 days</option>
                                <option value="90 days">90 days</option>
                            </select>
                        </div>

                        {/* Source */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Source
                            </label>
                            <select
                                value={formData.source}
                                onChange={(e) => updateFormData('source', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="Manual">Manual</option>
                                <option value="Referral">Referral</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Naukri">Naukri</option>
                                <option value="Indeed">Indeed</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Skills - Full Width */}
                    <div className="mt-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                            Skills
                        </label>
                        <MultiSelect
                            options={SKILLS}
                            value={formData.skills}
                            onChange={(skills) => updateFormData('skills', skills)}
                            placeholder="Select skills"
                            searchPlaceholder="Search skills..."
                            maxDisplayTags={5}
                        />
                    </div>

                    {/* Resume Upload - Full Width */}
                    <div className="mt-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                            Resume
                        </label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                ${errors.resumeFile ? 'border-red-500' : ''}
              `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {formData.resumeFile ? (
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm text-gray-700">{formData.resumeFile.name}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateFormData('resumeFile', null);
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="text-gray-500">
                                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-sm">Drag & drop resume or click to browse</p>
                                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX (max 5MB)</p>
                                </div>
                            )}
                        </div>
                        {errors.resumeFile && <p className="mt-1 text-red-600 text-xs">{errors.resumeFile}</p>}
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={() => handleSubmit({ preventDefault: () => { } } as FormEvent)} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Adding...
                            </>
                        ) : (
                            'Add Candidate'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default AddCandidateModal;
