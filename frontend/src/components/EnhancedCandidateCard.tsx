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
import { getResumeUrl } from '../services';
import { AddToJobModal } from './AddToJobModal';

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
  const [showAddToJobModal, setShowAddToJobModal] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

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

  const handleViewCV = () => {
    if (candidate.resumeUrl) {
      const fullUrl = getResumeUrl(candidate.resumeUrl);
      window.open(fullUrl, '_blank');
    } else {
      alert('No resume available for this candidate.');
    }
  };

  const handleAddToJob = () => {
    setShowAddToJobModal(true);
  };

  const handleAddToJobSuccess = (jobId: string, jobTitle: string) => {
    console.log(`Candidate ${candidate.name} added to job ${jobTitle} (${jobId})`);
    // Could show a toast notification here
  };

  const handleShare = () => {
    setShowSharePopup(true);
  };

  const handleCopyProfileLink = async () => {
    // Generate a shareable profile URL
    const profileUrl = `${window.location.origin}/candidates/${candidate.id}`;

    try {
      await navigator.clipboard.writeText(profileUrl);
      setShareSuccess(true);
      setTimeout(() => {
        setShareSuccess(false);
        setShowSharePopup(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShareSuccess(true);
      setTimeout(() => {
        setShareSuccess(false);
        setShowSharePopup(false);
      }, 2000);
    }
  };

  return (
    <>
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
              {/* Email & Phone - Display email on multiple lines if needed */}
              <div className="text-[10px] text-gray-400 mt-0.5 space-y-0.5">
                <p
                  className="break-all leading-tight"
                  title={candidate.email}
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                >
                  {candidate.email}
                </p>
                <p>{candidate.phone}</p>
              </div>
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
              className={`text-[10px] font-semibold flex items-center gap-1 transition-colors ${candidate.resumeUrl
                  ? 'text-blue-600 hover:text-blue-800'
                  : 'text-gray-400 cursor-not-allowed'
                }`}
              disabled={!candidate.resumeUrl}
              title={candidate.resumeUrl ? 'View Resume' : 'No resume available'}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View CV
            </button>
            <span className="text-gray-200">|</span>
            <button
              onClick={(e) => handleActionClick(e, handleShare)}
              className="text-[10px] font-semibold text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
          <button
            onClick={(e) => handleActionClick(e, handleAddToJob)}
            className="px-2.5 py-1 bg-gray-900 text-white text-[10px] font-semibold rounded hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add to Job
          </button>
        </div>
      </div>

      {/* Share Profile Popup */}
      {showSharePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowSharePopup(false)}
        >
          <div className="fixed inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-xl shadow-xl p-5 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Share Candidate Profile</h3>
              <button
                onClick={() => setShowSharePopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Share <span className="font-medium text-gray-700">{candidate.name}'s</span> profile with others by copying the link below.
            </p>

            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 mb-4">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/candidates/${candidate.id}`}
                className="flex-1 bg-transparent text-xs text-gray-600 outline-none truncate"
              />
              <button
                onClick={handleCopyProfileLink}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${shareSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {shareSuccess ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  'Copy Link'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Job Modal */}
      <AddToJobModal
        isOpen={showAddToJobModal}
        onClose={() => setShowAddToJobModal(false)}
        onSuccess={handleAddToJobSuccess}
        candidateId={candidate.id}
        candidateName={candidate.name}
      />
    </>
  );
}

export default EnhancedCandidateCard;