/**
 * JobDetailsPanel Component - Requirements 5.2, 5.3, 5.4, 5.5
 * 
 * Displays complete job information on the application page.
 * Shows company info, all job posting details, job description, and mandatory criteria.
 * 
 * Features:
 * - Company information with logo
 * - All job posting details in organized sections
 * - Job description content
 * - Mandatory criteria section
 */

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

      {/* Job Description Section */}
      {job.description && (
        <div className="p-6 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide mb-4">
            Job Description
          </h3>
          <div 
            className="prose prose-sm max-w-none text-[#374151]"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        </div>
      )}

      {/* Mandatory Criteria Section */}
      <div className="p-6 bg-[#fffbeb]">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f59e0b] flex items-center justify-center">
            <svg 
              className="w-4 h-4 text-white" 
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
          <h3 className="text-sm font-semibold text-[#92400e]">
            {MANDATORY_CRITERIA_CONTENT.title}
          </h3>
        </div>

        <p className="text-sm text-[#78350f] font-medium mb-3">
          {MANDATORY_CRITERIA_CONTENT.intro}
        </p>

        <ol className="space-y-2 mb-4">
          {MANDATORY_CRITERIA_CONTENT.criteria.map((criterion, index) => (
            <li 
              key={index} 
              className="flex gap-2 text-sm text-[#78350f]"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#fcd34d] text-[#78350f] text-xs font-semibold flex items-center justify-center">
                {index + 1}
              </span>
              <span>{criterion}</span>
            </li>
          ))}
        </ol>

        <div className="pt-3 border-t border-[#fcd34d]">
          <p className="text-xs font-semibold text-[#92400e] uppercase tracking-wide">
            {MANDATORY_CRITERIA_CONTENT.note}
          </p>
        </div>
      </div>
    </div>
  );
}

export default JobDetailsPanel;
