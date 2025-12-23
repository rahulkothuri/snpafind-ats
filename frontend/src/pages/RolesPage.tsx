import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '../components';
import type { ViewMode, PipelineCandidate } from '../components';
import { useAuth } from '../hooks/useAuth';
import { useJobs } from '../hooks/useJobs';
import { getResumeUrl, candidatesService, jobsService } from '../services';
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

// Sample data for demo when no API data
const sampleRoles: Role[] = [
  { id: '1', title: 'Senior Backend Engineer', department: 'Engineering', location: 'Bangalore', openings: 2, applicants: 45, interviews: 12, sla: 'On track', priority: 'High', recruiter: 'Aarti', status: 'active' },
  { id: '2', title: 'Product Manager', department: 'Product', location: 'Hyderabad', openings: 1, applicants: 32, interviews: 8, sla: 'At risk', priority: 'High', recruiter: 'Rahul', status: 'active' },
  { id: '3', title: 'Sales Lead (North)', department: 'Sales', location: 'Gurgaon', openings: 1, applicants: 28, interviews: 6, sla: 'Breached', priority: 'Medium', recruiter: 'Vikram', status: 'paused' },
  { id: '4', title: 'UX Designer', department: 'Design', location: 'Remote', openings: 2, applicants: 52, interviews: 15, sla: 'On track', priority: 'Medium', recruiter: 'Sana', status: 'active' },
  { id: '5', title: 'Data Analyst', department: 'Analytics', location: 'Chennai', openings: 1, applicants: 38, interviews: 10, sla: 'On track', priority: 'Low', recruiter: 'Aarti', status: 'closed' },
  { id: '6', title: 'Backend Engineer (L2)', department: 'Engineering', location: 'Pune', openings: 3, applicants: 41, interviews: 9, sla: 'At risk', priority: 'High', recruiter: 'Aarti', status: 'active' },
];


const sampleCandidates: PipelineCandidate[] = [
  { id: '1', name: 'Priya Sharma', title: 'Senior Software Engineer', stage: 'Interview', score: 85, experience: 6, location: 'Bangalore', source: 'LinkedIn', updatedAt: '2 hours ago', skills: ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL'], email: 'priya.sharma@email.com', phone: '+91 98765 43210', currentCompany: 'FinEdge Systems', currentCtc: '₹28 LPA', expectedCtc: '₹38 LPA', noticePeriod: '30 days' },
  { id: '2', name: 'Rahul Verma', title: 'Backend Developer', stage: 'Screening', score: 72, experience: 4, location: 'Hyderabad', source: 'Referral', updatedAt: '1 day ago', skills: ['Node.js', 'React', 'MongoDB', 'AWS'], email: 'rahul.verma@email.com', phone: '+91 98765 43211', currentCompany: 'CloudNova', currentCtc: '₹18 LPA', expectedCtc: '₹25 LPA', noticePeriod: '60 days' },
  { id: '3', name: 'Ankit Patel', title: 'Tech Lead', stage: 'Offer', score: 92, experience: 8, location: 'Gurgaon', source: 'Job Board', updatedAt: '3 hours ago', skills: ['Java', 'Kafka', 'Kubernetes', 'System Design'], email: 'ankit.patel@email.com', phone: '+91 98765 43212', currentCompany: 'NeoPay', currentCtc: '₹42 LPA', expectedCtc: '₹55 LPA', noticePeriod: '90 days' },
  { id: '4', name: 'Sneha Reddy', title: 'Software Engineer', stage: 'Applied', score: 65, experience: 3, location: 'Chennai', source: 'Career Page', updatedAt: '5 hours ago', skills: ['Python', 'Django', 'PostgreSQL'], email: 'sneha.reddy@email.com', phone: '+91 98765 43213', currentCompany: 'CodeNest', currentCtc: '₹12 LPA', expectedCtc: '₹18 LPA', noticePeriod: '30 days' },
  { id: '5', name: 'Vikram Singh', title: 'Senior Developer', stage: 'Shortlisted', score: 78, experience: 5, location: 'Pune', source: 'LinkedIn', updatedAt: '1 day ago', skills: ['Java', 'Spring Boot', 'React', 'Docker'], email: 'vikram.singh@email.com', phone: '+91 98765 43214', currentCompany: 'FinEdge Systems', currentCtc: '₹22 LPA', expectedCtc: '₹30 LPA', noticePeriod: '45 days' },
  { id: '6', name: 'Meera Nair', title: 'Backend Engineer', stage: 'Queue', score: 58, experience: 2, location: 'Remote', source: 'Agency', updatedAt: '2 days ago', skills: ['Go', 'gRPC', 'Redis'], email: 'meera.nair@email.com', phone: '+91 98765 43215', currentCompany: 'CloudNova', currentCtc: '₹10 LPA', expectedCtc: '₹15 LPA', noticePeriod: '15 days' },
  { id: '7', name: 'Arjun Kumar', title: 'Full Stack Developer', stage: 'Interview', score: 81, experience: 4, location: 'Bangalore', source: 'Referral', updatedAt: '6 hours ago', skills: ['Node.js', 'React', 'TypeScript', 'PostgreSQL'], email: 'arjun.kumar@email.com', phone: '+91 98765 43216', currentCompany: 'NeoPay', currentCtc: '₹20 LPA', expectedCtc: '₹28 LPA', noticePeriod: '30 days' },
  { id: '8', name: 'Divya Menon', title: 'Software Engineer', stage: 'Hired', score: 88, experience: 5, location: 'Hyderabad', source: 'LinkedIn', updatedAt: '1 week ago', skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka'], email: 'divya.menon@email.com', phone: '+91 98765 43217', currentCompany: 'CodeNest', currentCtc: '₹24 LPA', expectedCtc: '₹32 LPA', noticePeriod: '30 days' },
];

// Candidate Detail Panel Content
function CandidateDetailContent({ 
  candidate,
}: { 
  candidate: PipelineCandidate;
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
    { label: 'Change Stage', onClick: () => {}, variant: 'secondary' as const },
    { label: 'Schedule Interview', onClick: () => {}, variant: 'primary' as const },
    { label: 'Send Email', onClick: () => {}, variant: 'secondary' as const },
    { label: 'Reject', onClick: () => {}, variant: 'danger' as const },
  ];

  return (
    <>
      <DetailSection title="Summary">
        <SummaryRow label="Current company" value={candidate.currentCompany} />
        <SummaryRow label="Total experience" value={`${candidate.experience} years`} />
        <SummaryRow label="Current CTC" value={candidate.currentCtc} />
        <SummaryRow label="Expected CTC" value={candidate.expectedCtc} />
        <SummaryRow label="Notice period" value={candidate.noticePeriod} />
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

  // Use API data if available, otherwise fall back to sample data
  const allRoles = rolesFromApi.length > 0 ? rolesFromApi : sampleRoles;

  // Apply filters to roles - Requirements 1.2, 2.2, 2.3
  const filteredRoles = useMemo(() => {
    let result = allRoles;
    result = filterRolesByStatus(result, statusFilter);
    result = filterRolesBySearch(result, roleSearchQuery);
    return result;
  }, [allRoles, statusFilter, roleSearchQuery]);

  // Set initial selected role when filtered roles change
  useEffect(() => {
    if (filteredRoles.length > 0 && (!selectedRole || !filteredRoles.find(r => r.id === selectedRole.id))) {
      setSelectedRole(filteredRoles[0]);
    } else if (filteredRoles.length === 0) {
      setSelectedRole(null);
    }
  }, [filteredRoles, selectedRole]);

  // Fetch candidates for the selected job
  useEffect(() => {
    async function fetchJobCandidates() {
      if (!selectedRole) {
        setJobCandidates([]);
        setPipelineStages([]);
        return;
      }

      // If using sample data, use sample candidates for demo
      if (rolesFromApi.length === 0) {
        setJobCandidates(sampleCandidates);
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
            className="h-full min-h-0 overflow-auto pl-4"
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
          <CandidateDetailContent candidate={selectedCandidate} />
        )}
      </DetailPanel>

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
