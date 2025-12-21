/**
 * JobDetailsPanel Component - Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 5.2, 5.3, 5.4, 5.5
 * 
 * Displays complete job information on the application page.
 * Shows company info, all job posting details, job description, and mandatory criteria.
 * 
 * Features:
 * - Company information with logo
 * - All job posting details in organized sections
 * - Job description content with markdown rendering (Requirement 1.2)
 * - Full job description display including responsibilities, requirements, benefits (Requirement 1.1, 1.3)
 * - Mandatory criteria section with prominent positioning (Requirements 2.1, 2.2, 2.3)
 */

import ReactMarkdown from 'react-markdown';
import { MANDATORY_CRITERIA_CONTENT } from './MandatoryCriteriaSection';

export interface JobDetailsPanelProps {
  job: {
    id: string;
    title: string;
    department: string;
    description?: string;
    openings?: number;
    // Enhanced job fields
    experienceMin?: number;
    experienceMax?: number;
    salaryMin?: number;
    salaryMax?: number;
    variables?: string;
    educationQualification?: string;
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
  };
  company: {
    name: string;
    logoUrl?: string;
  };
}

/**
 * Formats a number as currency (INR format)
 */
function formatCurrency(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(0)}K`;
  }
  return `₹${value}`;
}

/**
 * Detail row component for consistent styling
 */
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2 border-b border-[#e2e8f0] last:border-b-0">
      <span className="text-sm text-[#64748b]">{label}</span>
      <span className="text-sm font-medium text-[#111827] text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export function JobDetailsPanel({ job, company }: JobDetailsPanelProps) {
  // Format experience range
  const experienceRange = job.experienceMin !== undefined && job.experienceMax !== undefined
    ? `${job.experienceMin} - ${job.experienceMax} years`
    : job.experienceMin !== undefined
    ? `${job.experienceMin}+ years`
    : job.experienceMax !== undefined
    ? `Up to ${job.experienceMax} years`
    : null;

  // Format salary range
  const salaryRange = job.salaryMin !== undefined && job.salaryMax !== undefined
    ? `${formatCurrency(job.salaryMin)} - ${formatCurrency(job.salaryMax)}`
    : job.salaryMin !== undefined
    ? `${formatCurrency(job.salaryMin)}+`
    : job.salaryMax !== undefined
    ? `Up to ${formatCurrency(job.salaryMax)}`
    : null;

  // Format locations
  const locationsDisplay = job.locations && job.locations.length > 0
    ? job.locations.join(', ')
    : null;

  // Format skills
  const skillsDisplay = job.skills && job.skills.length > 0
    ? job.skills
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden">
      {/* Company Header */}
      <div className="p-6 border-b border-[#e2e8f0] bg-gradient-to-r from-[#f8fafc] to-white">
        <div className="flex items-center gap-4">
          {company.logoUrl ? (
            <img 
              src={company.logoUrl} 
              alt={company.name} 
              className="w-16 h-16 rounded-xl object-cover border border-[#e2e8f0]"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#0b6cf0] flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {company.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">{company.name}</h2>
            <p className="text-sm text-[#64748b]">Hiring for this position</p>
          </div>
        </div>
      </div>

      {/* Job Title Section */}
      <div className="p-6 border-b border-[#e2e8f0]">
        <h1 className="text-xl font-bold text-[#111827] mb-2">{job.title}</h1>
        {job.department && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#e0f2fe] text-[#0369a1]">
            {job.department}
          </span>
        )}
      </div>

      {/* Job Details Section */}
      <div className="p-6 border-b border-[#e2e8f0]">
        <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
          Job Details
        </h3>
        <div className="space-y-1">
          <DetailRow label="Experience" value={experienceRange} />
          <DetailRow label="Salary" value={salaryRange} />
          {job.variables && <DetailRow label="Variables/Incentives" value={job.variables} />}
          <DetailRow label="Education" value={job.educationQualification} />
          {job.openings && job.openings > 0 && (
            <DetailRow label="Vacancies" value={`${job.openings} position${job.openings > 1 ? 's' : ''}`} />
          )}
          {job.ageUpTo && <DetailRow label="Age Limit" value={`Up to ${job.ageUpTo} years`} />}
          <DetailRow label="Work Mode" value={job.workMode} />
          <DetailRow label="Location(s)" value={locationsDisplay} />
          <DetailRow label="Priority" value={job.priority} />
          <DetailRow label="Industry" value={job.preferredIndustry} />
          <DetailRow label="Domain" value={job.jobDomain} />
        </div>
      </div>

      {/* Skills Section */}
      {skillsDisplay && skillsDisplay.length > 0 && (
        <div className="p-6 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
            Required Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {skillsDisplay.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Job Description Section - Requirement 1.1, 1.2 */}
      {job.description && (
        <div className="p-6 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
            Job Description
          </h3>
          <div className="prose prose-sm max-w-none text-[#374151] prose-headings:text-[#111827] prose-headings:font-semibold prose-p:text-[#374151] prose-li:text-[#374151] prose-strong:text-[#111827] prose-ul:list-disc prose-ol:list-decimal">
            <ReactMarkdown>{job.description}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Responsibilities Section - Requirement 1.3 */}
      {job.responsibilities && (
        <div className="p-6 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#0b6cf0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Responsibilities
            </span>
          </h3>
          <div className="prose prose-sm max-w-none text-[#374151] prose-headings:text-[#111827] prose-headings:font-semibold prose-p:text-[#374151] prose-li:text-[#374151] prose-strong:text-[#111827] prose-ul:list-disc prose-ol:list-decimal">
            <ReactMarkdown>{job.responsibilities}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Requirements Section - Requirement 1.3 */}
      {job.requirements && (
        <div className="p-6 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#0b6cf0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Requirements
            </span>
          </h3>
          <div className="prose prose-sm max-w-none text-[#374151] prose-headings:text-[#111827] prose-headings:font-semibold prose-p:text-[#374151] prose-li:text-[#374151] prose-strong:text-[#111827] prose-ul:list-disc prose-ol:list-decimal">
            <ReactMarkdown>{job.requirements}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Benefits Section - Requirement 1.3 */}
      {job.benefits && (
        <div className="p-6 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Benefits
            </span>
          </h3>
          <div className="prose prose-sm max-w-none text-[#374151] prose-headings:text-[#111827] prose-headings:font-semibold prose-p:text-[#374151] prose-li:text-[#374151] prose-strong:text-[#111827] prose-ul:list-disc prose-ol:list-decimal">
            <ReactMarkdown>{job.benefits}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Mandatory Criteria Section - Requirements 2.1, 2.2, 2.3 */}
      {/* Positioned prominently before Apply button with distinct visual styling */}
      <div className="p-6 bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] border-t-4 border-[#f59e0b]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#f59e0b] flex items-center justify-center shadow-md">
            <svg 
              className="w-6 h-6 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#92400e]">
              {MANDATORY_CRITERIA_CONTENT.title}
            </h3>
            <p className="text-xs text-[#b45309]">Please review before applying</p>
          </div>
        </div>

        <div className="bg-white/50 rounded-lg p-4 mb-4 border border-[#fcd34d]">
          <p className="text-sm text-[#78350f] font-semibold">
            {MANDATORY_CRITERIA_CONTENT.intro}
          </p>
        </div>

        <ol className="space-y-3 mb-4">
          {MANDATORY_CRITERIA_CONTENT.criteria.map((criterion, index) => (
            <li 
              key={index} 
              className="flex gap-3 text-sm text-[#78350f] bg-white/30 rounded-lg p-3 border border-[#fde68a]"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f59e0b] text-white text-xs font-bold flex items-center justify-center shadow-sm">
                {index + 1}
              </span>
              <span className="pt-0.5 font-medium">{criterion}</span>
            </li>
          ))}
        </ol>

        <div className="pt-4 border-t border-[#fcd34d]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#dc2626]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-bold text-[#92400e] uppercase tracking-wide">
              {MANDATORY_CRITERIA_CONTENT.note}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetailsPanel;
