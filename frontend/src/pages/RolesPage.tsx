import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layout,
  Button,
  DetailPanel,
  DetailSection,
  SummaryRow,
  CVSection,
  SkillsTags,
  Timeline,
  NotesSection,
  ActionsSection,
  LoadingSpinner,
  ErrorMessage,
  JobDescriptionModal,
  RolesLeftPanel,
  JobDetailsRightPanel,
  InterviewScheduleModal,
  ScoreBreakdown,
  MoveCandidateModal,
} from '../components';
import type { ViewMode, PipelineCandidate } from '../components';
import { useAuth } from '../hooks/useAuth';
import { useJobs } from '../hooks/useJobs';
import { getResumeUrl, candidatesService, jobsService, pipelineService } from '../services';
import type { Job, JobCandidate } from '../services';
import type { Job as JobType } from '../types';
import { filterRolesBySearch, filterRolesByStatus } from '../utils/filters';

/**
 * Roles & Pipelines Page - Requirements 1-6, 16.1-16.11
 * 
 * Features:
 * - Split-panel layout (roles list on left 40%, job details on right 60%)
 * - Role search and Open/Closed toggle filter
 * - Candidate search within selected role
 * - Accurate application counts from database
 * - Responsive layout with vertical stacking below 1024px
 */

// Types
interface Role {
  id: string;
  title: string;
  department: string;
  location: string;
  openings: number;
  applicants: number;
  interviews: number;
  sla: 'On track' | 'At risk' | 'Breached';
  priority: 'High' | 'Medium' | 'Low';
  recruiter: string;
  status: 'active' | 'paused' | 'closed';
}

// Candidate Detail Panel Content
function CandidateDetailContent({
  candidate,
  onScheduleInterview,
  onMove,
  onReject,
  onSendEmail,
}: {
  candidate: PipelineCandidate;
  onScheduleInterview: () => void;
  onMove: () => void;
  onReject: () => void;
  onSendEmail: () => void;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveNote = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setNote('');
    }, 1000);
  };

  const timelineEntries = [
    { id: '1', date: '2 hours ago', description: `Moved to ${candidate.stage}` },
    { id: '2', date: '1 day ago', description: 'Interview scheduled with Panel A' },
    { id: '3', date: '3 days ago', description: 'Applied via ' + candidate.source },
  ];

  const actions = [
    { label: 'Change Stage', onClick: onMove, variant: 'secondary' as const },
    { label: 'Schedule Interview', onClick: onScheduleInterview, variant: 'primary' as const },
    { label: 'Send Email', onClick: onSendEmail, variant: 'secondary' as const },
    { label: 'Reject', onClick: onReject, variant: 'danger' as const },
  ];

  return (
    <>
      <DetailSection title="Summary">
        <SummaryRow label="Current company" value={candidate.currentCompany || 'Not specified'} />
        <SummaryRow label="Total experience" value={`${candidate.experience} years`} />
        <SummaryRow label="Current CTC" value={candidate.currentCtc || 'Not specified'} />
        <SummaryRow label="Expected CTC" value={candidate.expectedCtc || 'Not specified'} />
        <SummaryRow label="Notice period" value={candidate.noticePeriod || 'Not specified'} />
      </DetailSection>

      {/* Score Breakdown Section - Requirements 2.1 */}
      <DetailSection title="Score Breakdown">
        <ScoreBreakdown
          domainScore={candidate.domainScore}
          industryScore={candidate.industryScore}
          keyResponsibilitiesScore={candidate.keyResponsibilitiesScore}
          overallScore={candidate.score}
        />
      </DetailSection>

      <DetailSection title="CV">
        <CVSection
          filename={`${candidate.name.replace(' ', '_')}_Resume.pdf`}
          onView={() => window.open(getResumeUrl(candidate.resumeUrl), '_blank')}
        />
      </DetailSection>

      <DetailSection title="Skills & Tags">
        <SkillsTags skills={candidate.skills} />
      </DetailSection>

      <DetailSection title="Timeline">
        <Timeline entries={timelineEntries} />
      </DetailSection>

      <DetailSection title="Notes">
        <NotesSection
          value={note}
          onChange={setNote}
          onSave={handleSaveNote}
          saving={saving}
        />
      </DetailSection>

      <DetailSection title="Actions">
        <ActionsSection
          actions={actions}
          lastUpdated={candidate.updatedAt}
        />
      </DetailSection>
    </>
  );
}


// Main Roles Page Component
export function RolesPage() {
  const { user, logout } = useAuth();
  const { data: apiJobs, isLoading: jobsLoading, error: jobsError, refetch: refetchJobs } = useJobs();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get jobId from URL query parameter
  const jobIdFromUrl = searchParams.get('jobId');

  // Role selection and filtering state
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed'>('open');

  // Candidate state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedCandidate, setSelectedCandidate] = useState<PipelineCandidate | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [jobCandidates, setJobCandidates] = useState<PipelineCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<{ id: string; name: string; position: number }[]>([]);
  const [candidatesRefreshKey, setCandidatesRefreshKey] = useState(0);

  // Job Description Modal state
  const [isJobDescriptionModalOpen, setIsJobDescriptionModalOpen] = useState(false);
  const [selectedJobForDescription, setSelectedJobForDescription] = useState<JobType | null>(null);
  const [jobDescriptionLoading, setJobDescriptionLoading] = useState(false);

  // Interview Schedule Modal state (for detail panel)
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

  // Move Candidate Modal state (for detail panel)
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  // Resizable splitter state
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle splitter drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Constrain between 20% and 80%
    const constrainedWidth = Math.min(Math.max(newWidth, 20), 80);
    setLeftPanelWidth(constrainedWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handler to open Job Description Modal
  const handleViewJobDescription = async () => {
    if (!selectedRole) return;
    setJobDescriptionLoading(true);
    try {
      const jobDetails = await jobsService.getById(selectedRole.id);
      setSelectedJobForDescription(jobDetails as unknown as JobType);
      setIsJobDescriptionModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    } finally {
      setJobDescriptionLoading(false);
    }
  };

  // Handler to navigate to Edit JD page - Requirements 1.2, 1.4
  const handleEditJobDescription = () => {
    if (!selectedRole) return;
    navigate(`/jobs/${selectedRole.id}/edit`);
  };

  // Handler to navigate to candidate profile page - Requirements 3.2, 3.3, 3.5
  const handleMoreInfo = (candidateId: string) => {
    setSelectedCandidate(null); // Close sidebar first
    navigate(`/candidates/${candidateId}`);
  };

  // Handler to toggle job status (open/close)
  const handleToggleStatus = useCallback(async () => {
    if (!selectedRole) return;
    try {
      await jobsService.toggleStatus(selectedRole.id);
      // Refresh jobs list to get updated status
      refetchJobs();
    } catch (error) {
      console.error('Failed to toggle job status:', error);
    }
  }, [selectedRole, refetchJobs]);

  // Handler to duplicate job
  const handleDuplicateJob = useCallback(async () => {
    if (!selectedRole) return;
    try {
      const duplicatedJob = await jobsService.duplicate(selectedRole.id);
      // Refresh jobs list and navigate to the new job
      await refetchJobs();
      navigate(`/roles?jobId=${duplicatedJob.id}`);
    } catch (error) {
      console.error('Failed to duplicate job:', error);
    }
  }, [selectedRole, refetchJobs, navigate]);

  // Handler to reject candidate
  const handleRejectCandidate = useCallback(async () => {
    if (!selectedCandidate) return;
    // Find rejected stage ID or name (case insensitive)
    const rejectedStage = pipelineStages.find(s => s.name.toLowerCase() === 'rejected');

    if (!rejectedStage) {
      console.error('Rejected stage not found in pipeline');
      alert('Error: "Rejected" stage not configured for this job. Please add a "Rejected" stage to the pipeline.');
      return;
    }

    const targetStageId = rejectedStage.id;

    try {
      // Use selectedRole.id as primary source for job ID
      if (selectedRole?.id) {
        await pipelineService.moveCandidate(
          selectedCandidate.jobCandidateId || selectedCandidate.id,
          targetStageId,
          selectedRole.id
        );
      } else {
        console.error('Missing Job ID for move operation');
        return;
      }
      setCandidatesRefreshKey(prev => prev + 1);
      setSelectedCandidate(null);
    } catch (error) {
      console.error('Failed to reject candidate:', error);
      alert('Failed to reject candidate. Please try again.');
    }
  }, [selectedCandidate, pipelineStages, selectedRole]);

  // Handler to send email
  const handleSendEmail = useCallback(() => {
    if (!selectedCandidate) return;
    window.location.href = `mailto:${selectedCandidate.email}?subject=Regarding your application for ${selectedRole?.title || 'Job'}`;
  }, [selectedCandidate, selectedRole]);

  // Handler for move success
  // Handler for move success
  const handleMoveSuccess = useCallback(async (targetStageId: string) => {
    if (!selectedCandidate || !selectedRole) return;
    try {
      await pipelineService.moveCandidate(
        selectedCandidate.jobCandidateId || selectedCandidate.id,
        targetStageId,
        selectedRole.id
      );
      setCandidatesRefreshKey(prev => prev + 1);
      setIsMoveModalOpen(false);
      setSelectedCandidate(null);
    } catch (error) {
      console.error('Failed to move candidate:', error);
      throw error;
    }
  }, [selectedCandidate, selectedRole]);


  // Map API jobs to local format - Requirements 4.1, 4.3, 4.4
  const rolesFromApi: Role[] = useMemo(() => {
    if (!apiJobs) return [];
    return apiJobs.map((job: Job, index: number) => {
      const applicantCount = job.candidateCount ?? 0;
      const interviewCount = job.interviewCount ?? 0;

      return {
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        openings: job.openings,
        applicants: applicantCount,
        interviews: interviewCount,
        sla: applicantCount === 0 ? 'On track' : index % 3 === 0 ? 'At risk' : index % 3 === 1 ? 'Breached' : 'On track',
        priority: index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Medium' : 'Low',
        recruiter: ['Aarti', 'Rahul', 'Vikram', 'Sana'][index % 4],
        status: job.status,
      };
    }) as Role[];
  }, [apiJobs]);

  // Use API data only
  const allRoles = rolesFromApi;

  // Apply filters to roles - Requirements 1.2, 2.2, 2.3
  const filteredRoles = useMemo(() => {
    let result = allRoles;
    result = filterRolesByStatus(result, statusFilter);
    result = filterRolesBySearch(result, roleSearchQuery);
    return result;
  }, [allRoles, statusFilter, roleSearchQuery]);

  // Set initial selected role when filtered roles change or when jobId is in URL
  useEffect(() => {
    // If there's a jobId in the URL, try to select that job
    if (jobIdFromUrl && allRoles.length > 0) {
      const jobFromUrl = allRoles.find(r => r.id === jobIdFromUrl);
      if (jobFromUrl) {
        // If the job is closed, switch to closed filter
        if (jobFromUrl.status === 'closed' && statusFilter === 'open') {
          setStatusFilter('closed');
        }
        setSelectedRole(jobFromUrl);
        // Clear the URL parameter after selecting
        setSearchParams({}, { replace: true });
        return;
      }
    }

    // Default behavior: select first role if none selected
    if (filteredRoles.length > 0 && (!selectedRole || !filteredRoles.find(r => r.id === selectedRole.id))) {
      setSelectedRole(filteredRoles[0]);
    } else if (filteredRoles.length === 0) {
      setSelectedRole(null);
    }
  }, [filteredRoles, selectedRole, jobIdFromUrl, allRoles, statusFilter, setSearchParams]);

  // Fetch candidates for the selected job
  useEffect(() => {
    async function fetchJobCandidates() {
      // Don't fetch if no role selected
      if (!selectedRole) {
        setJobCandidates([]);
        setPipelineStages([]);
        return;
      }

      setCandidatesLoading(true);
      try {
        // Fetch candidates and pipeline stages in parallel
        const [candidates, stages] = await Promise.all([
          candidatesService.getByJob(selectedRole.id),
          jobsService.getPipelineStages(selectedRole.id),
        ]);

        const mappedCandidates: PipelineCandidate[] = candidates.map((jc: JobCandidate) => ({
          id: jc.candidateId,
          jobCandidateId: jc.id, // Include jobCandidateId for bulk operations
          name: jc.candidate?.name || 'Unknown',
          title: jc.candidate?.currentCompany || 'Candidate',
          stage: jc.stageName || 'Applied',
          score: jc.candidate?.score || 0,
          experience: jc.candidate?.experienceYears || 0,
          location: jc.candidate?.location || '',
          source: jc.candidate?.source || '',
          updatedAt: new Date(jc.updatedAt).toLocaleDateString(),
          skills: Array.isArray(jc.candidate?.skills) ? jc.candidate.skills : [],
          email: jc.candidate?.email || '',
          phone: jc.candidate?.phone || '',
          currentCompany: jc.candidate?.currentCompany || '',
          currentCtc: jc.candidate?.currentCtc || '',
          expectedCtc: jc.candidate?.expectedCtc || '',
          noticePeriod: jc.candidate?.noticePeriod || '',
          resumeUrl: jc.candidate?.resumeUrl,
          // Score breakdown fields - Requirements 2.1, 8.2
          domainScore: jc.candidate?.domainScore ?? null,
          industryScore: jc.candidate?.industryScore ?? null,
          keyResponsibilitiesScore: jc.candidate?.keyResponsibilitiesScore ?? null,
        }));
        setJobCandidates(mappedCandidates);
        setPipelineStages(stages.map(s => ({ id: s.id, name: s.name, position: s.position })));
      } catch (error) {
        console.error('Failed to fetch job candidates:', error);
        setJobCandidates([]);
        setPipelineStages([]);
      } finally {
        setCandidatesLoading(false);
      }
    }

    fetchJobCandidates();
  }, [selectedRole, rolesFromApi.length, candidatesRefreshKey]);

  // Handler to refresh candidates after bulk move
  const handleCandidatesMoved = useCallback(() => {
    setCandidatesRefreshKey(prev => prev + 1);
  }, []);

  // Filter candidates by stage and search - Requirements 3.2
  const filteredCandidates = useMemo(() => {
    let result = jobCandidates;
    if (stageFilter) {
      result = result.filter((c) => c.stage === stageFilter);
    }
    if (candidateSearchQuery.trim()) {
      const lowerQuery = candidateSearchQuery.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(lowerQuery));
    }
    return result;
  }, [jobCandidates, stageFilter, candidateSearchQuery]);

  // Header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">Export pipeline</Button>
    </div>
  );

  // Calculate totals for subtitle
  const totalOpenings = allRoles.reduce((sum, r) => sum + r.openings, 0);
  const totalApplicants = allRoles.reduce((sum, r) => sum + r.applicants, 0);

  return (
    <Layout
      pageTitle="Role-wise Pipeline"
      pageSubtitle={`${allRoles.length} roles · ${totalOpenings} openings · ${totalApplicants} candidates in pipeline`}
      headerActions={headerActions}
      user={user}
      companyName="Acme Technologies"
      footerLeftText="SnapFind Client ATS · Roles & Pipelines view"
      footerRightText="Time-to-fill (median): 24 days · Offer acceptance: 78%"
      onLogout={logout}
    >
      {/* Loading State */}
      {jobsLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {jobsError && (
        <ErrorMessage
          message="Failed to load roles"
          onRetry={() => refetchJobs()}
        />
      )}

      {/* Resizable Split Panel Layout - Requirements 5.1, 5.4 */}
      {!jobsLoading && !jobsError && (
        <div
          ref={containerRef}
          className="flex h-[calc(100vh-160px)] min-h-[500px] gap-0"
        >
          {/* Left Panel - Roles List */}
          <div
            className="h-full min-h-0 flex flex-col overflow-hidden"
            style={{ width: `${leftPanelWidth}%` }}
          >
            <RolesLeftPanel
              roles={filteredRoles}
              selectedRole={selectedRole}
              onSelectRole={setSelectedRole}
              searchQuery={roleSearchQuery}
              onSearchChange={setRoleSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          {/* Resizable Splitter */}
          <div
            className={`
              w-1 bg-[#e2e8f0] hover:bg-[#0b6cf0] cursor-col-resize transition-colors
              flex items-center justify-center relative group
              ${isDragging ? 'bg-[#0b6cf0]' : ''}
            `}
            onMouseDown={handleMouseDown}
          >
            {/* Drag handle indicator */}
            <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
              <div className="w-1 h-8 bg-[#94a3b8] rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              </div>
            </div>
          </div>

          {/* Right Panel - Job Details */}
          <div
            className="h-full min-h-0 overflow-auto pl-1"
            style={{ width: `${100 - leftPanelWidth}%` }}
          >
            <JobDetailsRightPanel
              role={selectedRole}
              candidates={filteredCandidates}
              candidateSearchQuery={candidateSearchQuery}
              onCandidateSearchChange={setCandidateSearchQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              stageFilter={stageFilter}
              onStageFilterChange={setStageFilter}
              onCandidateClick={setSelectedCandidate}
              isLoading={candidatesLoading}
              onViewJobDescription={handleViewJobDescription}
              jobDescriptionLoading={jobDescriptionLoading}
              onEditJobDescription={handleEditJobDescription}
              pipelineStages={pipelineStages}
              onCandidatesMoved={handleCandidatesMoved}
              onToggleStatus={handleToggleStatus}
              onDuplicateJob={handleDuplicateJob}
            />
          </div>
        </div>
      )}

      {/* Detail Panel for selected candidate */}
      <DetailPanel
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title={selectedCandidate?.name || ''}
        subtitle={selectedCandidate ? `${selectedCandidate.title} · ${selectedCandidate.location} · ${selectedCandidate.stage}` : ''}
        onMoreInfo={selectedCandidate ? () => handleMoreInfo(selectedCandidate.id) : undefined}
      >
        {selectedCandidate && (
          <CandidateDetailContent
            candidate={selectedCandidate}
            onScheduleInterview={() => setIsInterviewModalOpen(true)}
            onMove={() => setIsMoveModalOpen(true)}
            onReject={handleRejectCandidate}
            onSendEmail={handleSendEmail}
          />
        )}
      </DetailPanel>

      {/* Interview Schedule Modal (from detail panel) */}
      {selectedCandidate && selectedRole && (
        <InterviewScheduleModal
          isOpen={isInterviewModalOpen}
          onClose={() => setIsInterviewModalOpen(false)}
          onSuccess={() => {
            setIsInterviewModalOpen(false);
            setCandidatesRefreshKey(prev => prev + 1);
          }}
          jobCandidateId={selectedCandidate.jobCandidateId || selectedCandidate.id}
          candidateName={selectedCandidate.name}
          jobTitle={selectedRole.title}
          jobId={selectedRole.id}
        />
      )}

      {/* Move Candidate Modal (from detail panel) */}
      {selectedCandidate && (
        <MoveCandidateModal
          isOpen={isMoveModalOpen}
          onClose={() => setIsMoveModalOpen(false)}
          candidateName={selectedCandidate.name}
          currentStageId={pipelineStages.find(s => s.name === selectedCandidate.stage)?.id || selectedCandidate.stage}
          stages={pipelineStages.map(s => ({ id: s.id, name: s.name }))}
          onMove={handleMoveSuccess}
        />
      )}

      {/* Job Description Modal */}
      <JobDescriptionModal
        isOpen={isJobDescriptionModalOpen}
        onClose={() => {
          setIsJobDescriptionModalOpen(false);
          setSelectedJobForDescription(null);
        }}
        job={selectedJobForDescription}
      />
    </Layout>
  );
}

export default RolesPage;
