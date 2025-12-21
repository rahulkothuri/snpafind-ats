/**
 * Enhanced Candidate Card Component - Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.3, 2.4, 5.4, 5.5
 * 
 * Features:
 * - Comprehensive candidate information display
 * - Name, phone, email in header section
 * - Current company, location, experience, notice period
 * - Salary information (current and expected)
 * - Age, industry, and job domain fields
 * - Skills display with overflow handling (+X more)
 * - 5-6 line candidate summary with proper formatting
 * - Action buttons (CV, Add to Job, Share, More Actions)
 */

import { Button } from './';

interface DatabaseCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  experienceYears: number;
  currentCompany: string;
  location: string;
  source: string;
  availability: string;
  skills: string[];
  tags: string[];
  currentCtc: string;
  expectedCtc: string;
  noticePeriod: string;
  resumeUrl?: string;
  updatedAt: string;
  internalMobility: boolean;
  // Enhanced fields
  age?: number;
  industry?: string;
  jobDomain?: string;
  candidateSummary?: string;
  createdAt: string;
}

interface EnhancedCandidateCardProps {
  candidate: DatabaseCandidate;
  onClick: (candidate: DatabaseCandidate) => void;
  isSelected: boolean;
}

// Helper function to generate avatar initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to generate avatar background color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-[#dbeafe] text-[#1d4ed8]',
    'bg-[#dcfce7] text-[#166534]',
    'bg-[#fef3c7] text-[#92400e]',
    'bg-[#fce7f3] text-[#9d174d]',
    'bg-[#e0e7ff] text-[#4338ca]',
    'bg-[#ccfbf1] text-[#0f766e]',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function EnhancedCandidateCard({
  candidate,
  onClick,
  isSelected,
}: EnhancedCandidateCardProps) {
  const handleCardClick = () => {
    onClick(candidate);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation(); // Prevent card click when clicking action buttons
    action();
  };

  const handleViewCV = () => {
    if (candidate.resumeUrl) {
      window.open(candidate.resumeUrl, '_blank');
    }
  };

  const handleAddToJob = () => {
    console.log('Add to job:', candidate.name);
  };

  const handleShare = () => {
    console.log('Share candidate:', candidate.name);
  };

  const handleMoreActions = () => {
    console.log('More actions for:', candidate.name);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`
        bg-white rounded-lg border border-[#e2e8f0] p-2.5 shadow-sm cursor-pointer transition-all
        hover:shadow-md hover:border-[#cbd5e1]
        ${isSelected ? 'ring-2 ring-[#0b6cf0] border-[#0b6cf0]' : ''}
      `}
    >
      {/* Header Row - Name, Contact, Created Date */}
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${getAvatarColor(candidate.name)}`}
        >
          {getInitials(candidate.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#111827] truncate">{candidate.name}</div>
          <div className="text-[11px] text-[#64748b] truncate">{candidate.phone} • {candidate.email}</div>
        </div>
        <div className="text-[11px] text-[#64748b] flex-shrink-0">
          Created: {candidate.createdAt}
        </div>
      </div>

      {/* Row 1: All main fields in single row */}
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] mb-1">
        <div className="flex items-center gap-1">
          <span className="text-[#64748b]">Company:</span>
          <span className="font-medium text-[#374151]">{candidate.currentCompany}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#64748b]">Location:</span>
          <span className="font-medium text-[#374151]">{candidate.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#64748b]">Exp:</span>
          <span className="font-medium text-[#374151]">{candidate.experienceYears} yrs</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#64748b]">Age:</span>
          <span className="font-medium text-[#374151]">{candidate.age || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#64748b]">Notice:</span>
          <span className="font-medium text-[#374151]">{candidate.noticePeriod}</span>
        </div>
      </div>

      {/* Row 2: Industry, Domain, Salary in single row */}
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] mb-1">
        <div className="flex items-center gap-1">
          <span className="text-[#64748b]">Industry:</span>
          <span className="font-medium text-[#374151]">{candidate.industry || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#64748b]">Domain:</span>
          <span className="font-medium text-[#374151]">{candidate.jobDomain || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#64748b]">Salary:</span>
          <span className="font-medium text-[#374151]">{candidate.currentCtc} → {candidate.expectedCtc}</span>
        </div>
      </div>

      {/* Skills Row */}
      <div className="text-[11px] mb-1">
        <span className="text-[#64748b]">Skills: </span>
        {candidate.skills.slice(0, 7).map((skill, index) => (
          <span key={skill}>
            <span className="px-1.5 py-0.5 bg-[#dbeafe] text-[#1d4ed8] text-[10px] rounded font-medium">
              {skill}
            </span>
            {index < Math.min(candidate.skills.length - 1, 6) && ' '}
          </span>
        ))}
        {candidate.skills.length > 7 && (
          <span className="px-1.5 py-0.5 bg-[#f3f4f6] text-[#64748b] text-[10px] rounded font-medium ml-1">
            +{candidate.skills.length - 7}
          </span>
        )}
      </div>

      {/* Summary Row - Show complete summary */}
      <div className="text-[11px] mb-1.5">
        <span className="text-[#64748b]">Summary: </span>
        <span className="font-medium text-[#374151]">
          {candidate.candidateSummary && candidate.candidateSummary.trim() 
            ? candidate.candidateSummary
            : 'No summary available'}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 pt-1.5 border-t border-[#e2e8f0]">
        <div onClick={(e) => handleActionClick(e, handleViewCV)}>
          <Button variant="mini" miniColor="cv">
            CV
          </Button>
        </div>
        <div onClick={(e) => handleActionClick(e, handleAddToJob)}>
          <Button variant="mini" miniColor="schedule">
            Add to Job
          </Button>
        </div>
        <div onClick={(e) => handleActionClick(e, handleShare)}>
          <Button variant="mini" miniColor="note">
            Share
          </Button>
        </div>
        <div onClick={(e) => handleActionClick(e, handleMoreActions)}>
          <Button variant="mini" miniColor="default">
            More Actions
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EnhancedCandidateCard;