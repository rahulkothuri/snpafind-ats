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
 * - Collapsible candidate summary with "Read more" toggle
 * - Action buttons (CV, Add to Job, Share, More Actions)
 */

import { useState } from 'react';
// Button import removed as it is not used in the new design

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
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-yellow-100 text-yellow-800',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
    'bg-teal-100 text-teal-700',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function EnhancedCandidateCard({
  candidate,
  onClick,
  isSelected,
}: EnhancedCandidateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = () => {
    onClick(candidate);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation(); // Prevent card click when clicking action buttons
    action();
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when toggling expand
    setIsExpanded(!isExpanded);
  };

  // Unused handlers removed

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

  // More actions handler removed

  return (
    <div
      onClick={handleCardClick}
      className={`
        bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-blue-300
        ${isSelected ? 'ring-1 ring-blue-500 border-blue-500 bg-blue-50/10' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-1.5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(candidate.name)} border border-white shadow-sm`}
          >
            {getInitials(candidate.name)}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate flex items-center gap-2">
              {candidate.name}
              {candidate.internalMobility && (
                <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] rounded-full border border-green-100 font-medium">Internal</span>
              )}
            </h3>
            <p className="text-xs text-gray-600 truncate font-medium">{candidate.title}</p>
            {/* Restore Email & Phone - Requirement: Do not remove content */}
            <p className="text-[10px] text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
              <span>{candidate.email}</span>
              <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
              <span>{candidate.phone}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center text-[10px] text-gray-400 gap-1 bg-gray-50 px-2 py-1 rounded-full border border-gray-100 whitespace-nowrap">
            <span>Updated {candidate.createdAt}</span>
          </div>
        </div>
      </div>

      {/* Grid Stats - Improved Layout with Optimized Spacing */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] mb-3 px-0.5 mt-2">
        {/* Left Column Fields - Adjusted for "Experience" */}
        <div className="flex items-center gap-2 text-gray-700">
          <span className="text-gray-400 w-20 flex-shrink-0">Experience</span>
          <span className="font-semibold text-gray-900 truncate">{candidate.experienceYears} Years</span>
        </div>
        {/* Right Column Fields - Longer Label Width */}
        <div className="flex items-center gap-2 text-gray-700">
          <span className="text-gray-400 w-22 flex-shrink-0">Location</span>
          <span className="font-semibold text-gray-900 truncate">{candidate.location}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <span className="text-gray-400 w-20 flex-shrink-0">Company</span>
          <span className="font-semibold text-gray-900 truncate" title={candidate.currentCompany}>{candidate.currentCompany}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <span className="text-gray-400 w-22 flex-shrink-0">Notice Period</span>
          <span className="font-semibold text-orange-700 truncate">{candidate.noticePeriod}</span>
        </div>

        {/* Compensation Row */}
        <div className="flex items-center gap-2 text-gray-700 col-span-2 border-t border-dashed border-gray-100 pt-2 mt-1">
          <span className="text-gray-400 w-20 flex-shrink-0">Compensation</span>
          <span className="font-semibold text-gray-900 truncate">
            {candidate.currentCtc} <span className="text-gray-300 mx-1">→</span> <span className="text-blue-700">{candidate.expectedCtc}</span>
          </span>
        </div>
      </div>

      {/* Summary - Optimized Truncation */}
      <div className="text-[11px] mb-3 bg-gray-50/50 p-2 rounded border border-gray-100/50 relative group">
        <span className="text-gray-400 font-medium mr-1.5">Summary:</span>
        {candidate.candidateSummary && candidate.candidateSummary.trim() ? (
          <span className="text-gray-600 leading-relaxed">
            {isExpanded ? (
              <>
                {candidate.candidateSummary}
                <button
                  onClick={handleToggleExpand}
                  className="ml-1.5 text-blue-600 hover:text-blue-800 font-medium hover:underline inline-block cursor-pointer"
                >
                  Show less
                </button>
              </>
            ) : (
              <>
                {candidate.candidateSummary.length > 105
                  ? candidate.candidateSummary.substring(0, 105).trim()
                  : candidate.candidateSummary}
                {candidate.candidateSummary.length > 105 && (
                  <>
                    <span>... </span>
                    <button
                      onClick={handleToggleExpand}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline inline-block cursor-pointer whitespace-nowrap ml-1"
                    >
                      Read more
                    </button>
                  </>
                )}
              </>
            )}
          </span>
        ) : (
          <span className="text-gray-400 italic">No summary available</span>
        )}
      </div>

      {/* Skills - Single Line */}
      <div className="flex flex-wrap gap-1 mb-3">
        {candidate.skills.slice(0, 6).map((skill) => (
          <span key={skill} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded border border-gray-200 font-medium">
            {skill}
          </span>
        ))}
        {candidate.skills.length > 6 && (
          <span className="px-1.5 py-0.5 text-gray-400 text-[10px] font-medium">+ {candidate.skills.length - 6}</span>
        )}
      </div>

      {/* Footer Actions - Compact */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex gap-3">
          <button
            onClick={(e) => handleActionClick(e, handleViewCV)}
            className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            View CV
          </button>
          <span className="text-gray-200">|</span>
          <button
            onClick={(e) => handleActionClick(e, handleShare)}
            className="text-[10px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
          >
            Share
          </button>
        </div>
        <button
          onClick={(e) => handleActionClick(e, handleAddToJob)}
          className="px-2.5 py-1 bg-gray-900 text-white text-[10px] font-semibold rounded hover:bg-gray-800 transition-colors shadow-sm"
        >
          Add to Job
        </button>
      </div>
    </div>
  );
}

export default EnhancedCandidateCard;