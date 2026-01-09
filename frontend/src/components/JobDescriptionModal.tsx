/**
 * JobDescriptionModal Component - Requirements 6.2, 6.3
 * 
 * Displays complete job details in a read-only modal format.
 * Shows all job fields including Role Name, Experience Range, Salary Range,
 * Work Mode, Locations, Job Description, and Mandatory Criteria.
 * 
 * Features:
 * - Read-only display of all job fields
 * - Job description content
 * - Mandatory criteria section
 * - Responsive scrollable content
 */

import type { Job } from '../types';
import { MANDATORY_CRITERIA_CONTENT } from './MandatoryCriteriaSection';

export interface JobDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
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

export function JobDescriptionModal({ isOpen, onClose, job }: JobDescriptionModalProps) {
  if (!isOpen || !job) return null;

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
    : job.location || null;

  // Format skills
  const skillsDisplay = job.skills && job.skills.length > 0
    ? job.skills
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#e2e8f0]">
            <div>
              <h2 className="text-xl font-semibold text-[#111827]">{job.title}</h2>
              {job.department && (
                <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-medium bg-[#e0f2fe] text-[#0369a1]">
                  {job.department}
                </span>
              )}
            </div>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-[#64748b] hover:text-[#111827] transition-colors p-2 rounded-lg hover:bg-[#f1f5f9]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
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
                <DetailRow label="Employment Type" value={job.employmentType} />
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
                  className="prose prose-sm max-w-none text-[#374151] [&_p]:min-h-[1.5em] [&_p:empty]:before:content-['\00a0']"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </div>
            )}

            {/* Mandatory Criteria Section - Show job's actual mandatory criteria if available */}
            {job.mandatoryCriteria && job.mandatoryCriteria.criteria && job.mandatoryCriteria.criteria.length > 0 ? (
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
                    {job.mandatoryCriteria.title}
                  </h3>
                </div>

                {job.mandatoryCriteria.intro && (
                  <p className="text-sm text-[#78350f] font-medium mb-3">
                    {job.mandatoryCriteria.intro}
                  </p>
                )}

                <ol className="space-y-2 mb-4">
                  {job.mandatoryCriteria.criteria.map((criterion, index) => (
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

                {job.mandatoryCriteria.note && (
                  <div className="pt-3 border-t border-[#fcd34d]">
                    <p className="text-xs font-semibold text-[#92400e] uppercase tracking-wide">
                      {job.mandatoryCriteria.note}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Fallback to default mandatory criteria if job doesn't have custom ones */
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
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#e2e8f0] bg-[#f9fafb]">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 rounded-lg font-medium bg-[#0b6cf0] text-white hover:bg-[#0956c4] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDescriptionModal;
