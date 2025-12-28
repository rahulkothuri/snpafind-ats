/**
 * Candidate Profile Page - Requirements 5.1, 5.2, 5.3, 5.4
 * 
 * Features:
 * - Dedicated page with comprehensive candidate information
 * - Resume viewer for PDF resumes
 * - Parsed data fields (name, email, phone, experience, skills, education)
 * - Complete activity timeline with stage changes
 * - Notes section for recruiter notes
 * - Attachments section for additional files
 * - Tags section for candidate labels
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, LoadingSpinner, ErrorMessage, CandidateNotesSection, CandidateAttachmentsSection, CandidateTagsSection } from '../components';
import { candidatesService, type Candidate, type CandidateActivity, type StageHistoryEntry, type CandidateNote, type CandidateAttachment } from '../services/candidates.service';
import { useAuth } from '../hooks/useAuth';
import { useCompany } from '../hooks/useCompany';
import api from '../services/api';
import { getResumeUrl } from '../services/api';

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Helper function to format date with time
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Helper function to format duration
function formatDuration(hours: number | undefined): string {
  if (!hours) return 'In progress';
  if (hours < 24) return `${Math.round(hours)} hours`;
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

// Helper function to get initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to get avatar color
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

export function CandidateProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: company } = useCompany();

  // State
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [activities, setActivities] = useState<CandidateActivity[]>([]);
  const [stageHistory, setStageHistory] = useState<StageHistoryEntry[]>([]);
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [attachments, setAttachments] = useState<CandidateAttachment[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'screening' | 'notes' | 'attachments' | 'tags'>('overview');

  // Fetch candidate data
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [candidateData, activitiesData, stageHistoryData, notesData, attachmentsData, tagsData] = await Promise.all([
          candidatesService.getById(id),
          candidatesService.getActivities(id),
          candidatesService.getStageHistory(id),
          candidatesService.getNotes(id),
          candidatesService.getAttachments(id),
          candidatesService.getAllTags(),
        ]);
        setCandidate(candidateData);
        setActivities(activitiesData);
        setStageHistory(stageHistoryData);
        setNotes(notesData);
        setAttachments(attachmentsData);
        setAvailableTags(tagsData);
      } catch (err) {
        console.error('Error fetching candidate data:', err);
        setError('Failed to load candidate data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle file upload - now accepts File directly for the new AttachmentsSection component
  const handleFileUpload = async (file: File) => {
    if (!id) return;
    const attachment = await candidatesService.uploadAttachment(id, file);
    setAttachments([attachment, ...attachments]);
  };

  // Handle deleting an attachment
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!id) return;
    await candidatesService.deleteAttachment(id, attachmentId);
    setAttachments(attachments.filter((a) => a.id !== attachmentId));
  };

  // Handle adding a tag - Requirements 7.2
  const handleAddTag = async (tag: string) => {
    if (!id || !candidate) return;
    const updatedCandidate = await candidatesService.addTag(id, tag);
    setCandidate(updatedCandidate);
    // Add to available tags if it's a new tag
    if (!availableTags.includes(tag)) {
      setAvailableTags([...availableTags, tag]);
    }
  };

  // Handle removing a tag - Requirements 7.5
  const handleRemoveTag = async (tag: string) => {
    if (!id || !candidate) return;
    const updatedCandidate = await candidatesService.removeTag(id, tag);
    setCandidate(updatedCandidate);
  };

  if (loading) {
    return (
      <Layout
        pageTitle="Candidate Profile"
        user={user}
        companyName={company?.name}
        onLogout={logout}
      >
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !candidate) {
    return (
      <Layout
        pageTitle="Candidate Profile"
        user={user}
        companyName={company?.name}
        onLogout={logout}
      >
        <ErrorMessage
          title="Error Loading Candidate"
          message={error || 'Candidate not found'}
          onRetry={() => window.location.reload()}
        />
      </Layout>
    );
  }

  return (
    <Layout
      pageTitle="Candidate Profile"
      pageSubtitle={candidate.name}
      user={user}
      companyName={company?.name}
      onLogout={logout}
      headerActions={
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors"
        >
          ← Back
        </button>
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm mb-6">
          <div className="p-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 ${getAvatarColor(candidate.name)}`}>
                {getInitials(candidate.name)}
              </div>

              {/* Basic Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-[#111827] mb-1">{candidate.name}</h1>
                {candidate.title && (
                  <p className="text-lg text-[#64748b] mb-2">{candidate.title}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-[#64748b]">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {candidate.email}
                  </span>
                  {candidate.phone && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {candidate.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {candidate.location}
                  </span>
                </div>

                {/* Tags */}
                {candidate.tags && candidate.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {candidate.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 text-xs font-medium bg-[#dbeafe] text-[#1e40af] rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Score */}
              {candidate.score !== undefined && (
                <div className="flex-shrink-0 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
                    candidate.score >= 80 ? 'bg-[#dcfce7] text-[#166534]' :
                    candidate.score >= 60 ? 'bg-[#fef3c7] text-[#92400e]' :
                    'bg-[#fee2e2] text-[#dc2626]'
                  }`}>
                    {candidate.score}
                  </div>
                  <p className="text-xs text-[#64748b] mt-1">Score</p>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-t border-[#e2e8f0] px-6">
            <nav className="flex gap-6">
              {(['overview', 'timeline', 'screening', 'notes', 'attachments', 'tags'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-[#0b6cf0] text-[#0b6cf0]'
                      : 'border-transparent text-[#64748b] hover:text-[#374151]'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'notes' && notes.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-[#f1f5f9] rounded-full">{notes.length}</span>
                  )}
                  {tab === 'attachments' && attachments.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-[#f1f5f9] rounded-full">{attachments.length}</span>
                  )}
                  {tab === 'tags' && candidate.tags && candidate.tags.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-[#f1f5f9] rounded-full">{candidate.tags.length}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab candidate={candidate} stageHistory={stageHistory} />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab activities={activities} stageHistory={stageHistory} />
        )}
        {activeTab === 'screening' && (
          <ScreeningTab activities={activities} />
        )}
        {activeTab === 'notes' && (
          <NotesTab
            notes={notes}
            onAddNote={async (content: string) => {
              if (!id) return;
              const note = await candidatesService.createNote(id, content);
              setNotes([note, ...notes]);
            }}
            onDeleteNote={async (noteId: string) => {
              if (!id) return;
              await candidatesService.deleteNote(id, noteId);
              setNotes(notes.filter((n) => n.id !== noteId));
            }}
          />
        )}
        {activeTab === 'attachments' && (
          <CandidateAttachmentsSection
            attachments={attachments}
            onUpload={handleFileUpload}
            onDelete={handleDeleteAttachment}
          />
        )}
        {activeTab === 'tags' && (
          <CandidateTagsSection
            tags={candidate.tags || []}
            availableTags={availableTags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        )}
      </div>
    </Layout>
  );
}


// Overview Tab - Requirements 5.2, 5.3
interface OverviewTabProps {
  candidate: Candidate;
  stageHistory: StageHistoryEntry[];
}

function OverviewTab({ candidate, stageHistory }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Resume Viewer */}
      <div className="lg:col-span-2">
        <ResumeViewer candidate={candidate} />
      </div>

      {/* Right Column - Parsed Data */}
      <div className="space-y-6">
        <ParsedDataSection candidate={candidate} />
        <StageHistorySection stageHistory={stageHistory} />
      </div>
    </div>
  );
}

// Resume Viewer Component - Requirement 5.2
interface ResumeViewerProps {
  candidate: Candidate;
}

function ResumeViewer({ candidate }: ResumeViewerProps) {
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const resumeUrl = candidate.resumeUrl ? getResumeUrl(candidate.resumeUrl) : null;
  const isPdf = candidate.resumeUrl?.toLowerCase().endsWith('.pdf');

  // Debug logging
  useEffect(() => {
    if (resumeUrl) {
      console.log('Resume URL:', resumeUrl);
      console.log('Is PDF:', isPdf);
    }
  }, [resumeUrl, isPdf]);

  // Reset states when resumeUrl changes
  useEffect(() => {
    setIframeError(false);
    setIsLoading(true);
    
    // Auto-fallback after 3 seconds if still loading (likely CSP blocked)
    const fallbackTimer = setTimeout(() => {
      if (isLoading) {
        console.log('PDF loading timeout, showing fallback');
        setIframeError(true);
        setIsLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(fallbackTimer);
  }, [resumeUrl, isLoading]);

  if (!resumeUrl) {
    return (
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-8 text-center">
        <svg className="w-16 h-16 mx-auto text-[#cbd5e1] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-[#64748b]">No resume uploaded</p>
      </div>
    );
  }

  const handleIframeLoad = () => {
    setIsLoading(false);
    // Reduce timeout to 500ms for faster fallback detection
    setTimeout(() => {
      const iframe = document.querySelector('iframe[title="Resume PDF Viewer"]') as HTMLIFrameElement;
      const objectEl = document.querySelector('object[data]') as HTMLObjectElement;
      
      if (iframe || objectEl) {
        try {
          // Try to access iframe content - will throw if blocked by CSP
          if (iframe) {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) {
              console.log('Iframe blocked by CSP, showing fallback');
              setIframeError(true);
              return;
            }
          }
          
          // Check if object loaded successfully
          if (objectEl && objectEl.data) {
            // Object seems to be working, keep it
            console.log('PDF loaded successfully via object tag');
          }
        } catch (error) {
          console.log('PDF viewer blocked by CSP, showing fallback');
          setIframeError(true);
        }
      }
    }, 500); // Reduced from 1000ms to 500ms
  };

  const handleIframeError = () => {
    console.log('Iframe failed to load');
    setIsLoading(false);
    setIframeError(true);
  };

  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
        <h3 className="text-sm font-semibold text-[#111827]">Resume</h3>
        <div className="flex gap-2">
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm font-medium text-[#0b6cf0] border border-[#0b6cf0] rounded-lg hover:bg-[#0b6cf0] hover:text-white transition-colors"
          >
            Open in New Tab
          </a>
          <a
            href={resumeUrl}
            download
            className="px-3 py-1.5 text-sm font-medium text-white bg-[#0b6cf0] rounded-lg hover:bg-[#0956c4] transition-colors"
          >
            Download
          </a>
        </div>
      </div>
      
      {isPdf && !iframeError ? (
        <div className="h-[600px] relative">
          {/* Simple iframe approach with fast fallback */}
          <iframe
            src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-0"
            title="Resume PDF Viewer"
            onError={handleIframeError}
            onLoad={handleIframeLoad}
            style={{ display: isLoading ? 'none' : 'block' }}
          />
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b6cf0] mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading resume...</p>
                <p className="text-xs text-gray-400 mt-1">If this takes too long, use the buttons above</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-[#0b6cf0] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-[#64748b] mb-2 font-medium">
            {iframeError ? 'Resume Preview Unavailable' : 'Resume preview not available for this format'}
          </p>
          <p className="text-xs text-[#94a3b8] mb-4">
            {iframeError 
              ? 'Due to security restrictions, the resume cannot be displayed inline. Use the options below to view it.' 
              : 'This file format cannot be previewed inline'
            }
          </p>
          <div className="flex gap-2 justify-center">
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0b6cf0] rounded-lg hover:bg-[#0956c4] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Resume
            </a>
            <a
              href={resumeUrl}
              download
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0b6cf0] border border-[#0b6cf0] rounded-lg hover:bg-[#0b6cf0] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Resume
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Parsed Data Section - Requirement 5.3
interface ParsedDataSectionProps {
  candidate: Candidate;
}

function ParsedDataSection({ candidate }: ParsedDataSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm">
      <div className="p-4 border-b border-[#e2e8f0]">
        <h3 className="text-sm font-semibold text-[#111827]">Candidate Details</h3>
      </div>
      <div className="p-4 space-y-3">
        <InfoRow label="Experience" value={`${candidate.experienceYears} years`} />
        {candidate.currentCompany && (
          <InfoRow label="Current Company" value={candidate.currentCompany} />
        )}
        {candidate.currentCtc && (
          <InfoRow label="Current CTC" value={candidate.currentCtc} />
        )}
        {candidate.expectedCtc && (
          <InfoRow label="Expected CTC" value={candidate.expectedCtc} />
        )}
        {candidate.noticePeriod && (
          <InfoRow label="Notice Period" value={candidate.noticePeriod} />
        )}
        {candidate.availability && (
          <InfoRow label="Availability" value={candidate.availability} />
        )}
        {candidate.age && (
          <InfoRow label="Age" value={`${candidate.age} years`} />
        )}
        {candidate.industry && (
          <InfoRow label="Industry" value={candidate.industry} />
        )}
        {candidate.jobDomain && (
          <InfoRow label="Job Domain" value={candidate.jobDomain} />
        )}
        {candidate.education && (
          <InfoRow label="Education" value={candidate.education} />
        )}
        <InfoRow label="Source" value={candidate.source} />
        <InfoRow label="Added" value={formatDate(candidate.createdAt)} />

        {/* Skills */}
        {candidate.skills && candidate.skills.length > 0 && (
          <div className="pt-3 border-t border-[#f1f5f9]">
            <p className="text-xs text-[#64748b] mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-1 text-xs bg-[#dbeafe] text-[#1d4ed8] rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {candidate.candidateSummary && (
          <div className="pt-3 border-t border-[#f1f5f9]">
            <p className="text-xs text-[#64748b] mb-2">Summary</p>
            <p className="text-sm text-[#374151]">{candidate.candidateSummary}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#64748b]">{label}</span>
      <span className="text-[#374151] font-medium">{value}</span>
    </div>
  );
}

// Stage History Section
interface StageHistorySectionProps {
  stageHistory: StageHistoryEntry[];
}

function StageHistorySection({ stageHistory }: StageHistorySectionProps) {
  if (stageHistory.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm">
      <div className="p-4 border-b border-[#e2e8f0]">
        <h3 className="text-sm font-semibold text-[#111827]">Stage History</h3>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {stageHistory.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-[#0b6cf0] mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#374151]">{entry.stageName}</p>
                <p className="text-xs text-[#64748b]">
                  {formatDate(entry.enteredAt)} • {formatDuration(entry.durationHours)}
                </p>
                {entry.comment && (
                  <p className="text-xs text-[#64748b] mt-1 italic">"{entry.comment}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// Timeline Tab - Requirement 5.4
interface TimelineTabProps {
  activities: CandidateActivity[];
  stageHistory: StageHistoryEntry[];
}

function TimelineTab({ activities, stageHistory }: TimelineTabProps) {
  // Combine activities and stage history into a unified timeline
  const timelineItems = [
    ...activities.map((a) => ({
      id: a.id,
      type: 'activity' as const,
      date: a.createdAt,
      title: getActivityTitle(a.activityType),
      description: a.description,
      metadata: a.metadata,
    })),
    ...stageHistory.map((s) => ({
      id: s.id,
      type: 'stage' as const,
      date: s.enteredAt,
      title: `Moved to ${s.stageName}`,
      description: s.comment || '',
      metadata: { movedBy: s.movedByName, duration: s.durationHours },
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (timelineItems.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-8 text-center">
        <svg className="w-16 h-16 mx-auto text-[#cbd5e1] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[#64748b]">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm">
      <div className="p-4 border-b border-[#e2e8f0]">
        <h3 className="text-sm font-semibold text-[#111827]">Activity Timeline</h3>
      </div>
      <div className="p-4">
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#0b6cf0] to-[#93c5fd]" />

          <div className="space-y-6">
            {timelineItems.map((item) => (
              <div key={item.id} className="relative">
                {/* Dot */}
                <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                  item.type === 'stage' ? 'bg-[#0b6cf0]' : 'bg-[#64748b]'
                }`} />

                <div className="bg-[#f8fafc] rounded-lg p-3 border border-[#e2e8f0]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-[#374151]">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-[#64748b] mt-1">{item.description}</p>
                      )}
                      {item.type === 'stage' && item.metadata?.movedBy && (
                        <p className="text-xs text-[#94a3b8] mt-1">by {item.metadata.movedBy as string}</p>
                      )}
                      {item.type === 'activity' && item.metadata?.screeningAnswers && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs font-medium text-blue-800 mb-2">Screening Question Answers:</p>
                          <div className="space-y-1">
                            {Object.entries(item.metadata.screeningAnswers as Record<string, any>).map(([questionId, answer]) => (
                              <div key={questionId} className="text-xs">
                                <span className="text-blue-700 font-medium">Q{questionId.slice(-1)}:</span>
                                <span className="text-blue-600 ml-1">
                                  {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-[#94a3b8] whitespace-nowrap">
                      {formatDateTime(item.date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Screening Tab - Shows screening question answers
interface ScreeningTabProps {
  activities: CandidateActivity[];
}

function ScreeningTab({ activities }: ScreeningTabProps) {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [loadingJob, setLoadingJob] = useState(false);

  // Find the application activity that contains screening answers
  const applicationActivity = activities.find(
    (activity) => activity.activityType === 'stage_change' && 
    activity.description === 'Applied via public application form' &&
    activity.metadata?.screeningAnswers
  );

  const screeningAnswers = applicationActivity?.metadata?.screeningAnswers as Record<string, any> | undefined;

  // Fetch job details to get the screening questions
  useEffect(() => {
    const fetchJobWithScreeningQuestions = async () => {
      if (!candidateId || !screeningAnswers) return;
      
      setLoadingJob(true);
      try {
        // Get candidate's job applications to find the job ID
        const candidateResponse = await api.get(`/candidates/${candidateId}`);
        const candidate = candidateResponse.data;
        
        // Get the first job application (assuming the screening answers are for the most recent application)
        if (candidate.jobCandidates && candidate.jobCandidates.length > 0) {
          const jobId = candidate.jobCandidates[0].jobId;
          const jobResponse = await api.get(`/jobs/${jobId}`);
          setJobDetails(jobResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch job details:', error);
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJobWithScreeningQuestions();
  }, [candidateId, screeningAnswers]);

  if (!screeningAnswers || Object.keys(screeningAnswers).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm">
        <div className="p-4 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#111827]">Screening Question Answers</h3>
        </div>
        <div className="p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-[#94a3b8] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[#64748b]">No screening questions were answered</p>
          <p className="text-sm text-[#94a3b8] mt-1">This candidate may have applied before screening questions were added to the job</p>
        </div>
      </div>
    );
  }

  if (loadingJob) {
    return (
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm">
        <div className="p-4 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#111827]">Screening Question Answers</h3>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b6cf0] mx-auto"></div>
          <p className="text-[#64748b] mt-4">Loading questions...</p>
        </div>
      </div>
    );
  }

  const screeningQuestions = jobDetails?.screeningQuestions || [];

  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm">
      <div className="p-4 border-b border-[#e2e8f0]">
        <h3 className="text-sm font-semibold text-[#111827]">Screening Question Answers</h3>
        <p className="text-xs text-[#64748b] mt-1">
          Answered on {new Date(applicationActivity.createdAt).toLocaleDateString()}
          {jobDetails && <span className="ml-2">• Job: {jobDetails.title}</span>}
        </p>
      </div>
      <div className="p-4">
        {screeningQuestions.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-[#94a3b8] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[#64748b]">No screening questions found for this job</p>
            <p className="text-sm text-[#94a3b8] mt-1">The job may not have had screening questions when this candidate applied</p>
          </div>
        ) : (
          <div className="space-y-4">
            {screeningQuestions.map((question: any, index: number) => {
              const answer = screeningAnswers[question.id];
              
              return (
                <div key={question.id} className="p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0b6cf0] text-white text-xs font-semibold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#111827] mb-2">
                        {question.question}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      <div className="bg-white rounded-lg p-3 border border-[#e2e8f0]">
                        <p className="text-sm text-[#374151]">
                          {answer !== undefined ? (
                            Array.isArray(answer) ? (
                              <span>
                                <strong>Selected:</strong> {answer.join(', ')}
                              </span>
                            ) : typeof answer === 'boolean' ? (
                              <span>
                                <strong>Answer:</strong> {answer ? 'Yes' : 'No'}
                              </span>
                            ) : (
                              <span>
                                <strong>Answer:</strong> {String(answer)}
                              </span>
                            )
                          ) : (
                            <span className="text-[#94a3b8] italic">Not answered</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Show answers that don't have matching questions (in case questions were deleted) */}
            {Object.entries(screeningAnswers).map(([questionId, answer]) => {
              const questionExists = screeningQuestions.some((q: any) => q.id === questionId);
              if (questionExists) return null;
              
              return (
                <div key={questionId} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 text-white text-xs font-semibold flex items-center justify-center">
                      ?
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800 mb-2">
                        Question (ID: {questionId})
                        <span className="text-xs text-yellow-600 ml-2">(Question no longer exists)</span>
                      </p>
                      <div className="bg-white rounded-lg p-3 border border-yellow-200">
                        <p className="text-sm text-yellow-700">
                          <strong>Answer:</strong> {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getActivityTitle(type: string): string {
  switch (type) {
    case 'stage_change':
      return 'Stage Changed';
    case 'note_added':
      return 'Note Added';
    case 'resume_uploaded':
      return 'Resume Uploaded';
    case 'interview_scheduled':
      return 'Interview Scheduled';
    case 'score_updated':
      return 'Score Updated';
    default:
      return 'Activity';
  }
}

// Notes Tab - Requirements 6.1, 6.2, 6.3
// Uses the CandidateNotesSection component for full CRUD operations
interface NotesTabProps {
  notes: CandidateNote[];
  onAddNote: (content: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  isLoading?: boolean;
}

function NotesTab({ notes, onAddNote, onDeleteNote, isLoading }: NotesTabProps) {
  return (
    <CandidateNotesSection
      notes={notes}
      onAddNote={onAddNote}
      onDeleteNote={onDeleteNote}
      isLoading={isLoading}
      placeholder="Write a note about this candidate..."
      title="Note"
    />
  );
}

export default CandidateProfilePage;
