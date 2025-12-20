import { useState, useMemo, useEffect } from 'react';
import { Layout, KPICard, Badge, Button, Table, DetailPanel, DetailSection, SummaryRow, CVSection, SkillsTags, Timeline, NotesSection, ActionsSection, LoadingSpinner, ErrorMessage, JobDescriptionModal } from '../components';
import type { Column } from '../components';
import { useAuth } from '../hooks/useAuth';
import { useJobs } from '../hooks/useJobs';
import { getResumeUrl, candidatesService, jobsService } from '../services';
import type { Job, JobCandidate } from '../services';
import type { Job as JobType } from '../types';

/**
 * Roles & Pipelines Page - Requirements 16.1-16.11
 * 
 * Features:
 * - Three-panel layout (roles list, pipeline view, detail panel)
 * - Role selection and view switching (table/board)
 * - Roles table with columns: Role, Loc, Open, Apps, Interv, SLA, Pri
 * - Pipeline KPI cards and stage summary strip
 * - Table view with candidate data
 * - Kanban board view with stage columns
 * - Detail panel for candidate selection
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
}

interface PipelineCandidate {
  id: string;
  name: string;
  title: string;
  stage: string;
  score: number;
  experience: number;
  location: string;
  source: string;
  updatedAt: string;
  skills: string[];
  email: string;
  phone: string;
  currentCompany: string;
  currentCtc: string;
  expectedCtc: string;
  noticePeriod: string;
  resumeUrl?: string;
}

interface StageCount {
  name: string;
  count: number;
}

type ViewMode = 'table' | 'board';

// Sample data - Requirements 30.1-30.6
const sampleRoles: Role[] = [
  { id: '1', title: 'Senior Backend Engineer', department: 'Engineering', location: 'Bangalore', openings: 2, applicants: 45, interviews: 12, sla: 'On track', priority: 'High', recruiter: 'Aarti' },
  { id: '2', title: 'Product Manager', department: 'Product', location: 'Hyderabad', openings: 1, applicants: 32, interviews: 8, sla: 'At risk', priority: 'High', recruiter: 'Rahul' },
  { id: '3', title: 'Sales Lead (North)', department: 'Sales', location: 'Gurgaon', openings: 1, applicants: 28, interviews: 6, sla: 'Breached', priority: 'Medium', recruiter: 'Vikram' },
  { id: '4', title: 'UX Designer', department: 'Design', location: 'Remote', openings: 2, applicants: 52, interviews: 15, sla: 'On track', priority: 'Medium', recruiter: 'Sana' },
  { id: '5', title: 'Data Analyst', department: 'Analytics', location: 'Chennai', openings: 1, applicants: 38, interviews: 10, sla: 'On track', priority: 'Low', recruiter: 'Aarti' },
  { id: '6', title: 'Backend Engineer (L2)', department: 'Engineering', location: 'Pune', openings: 3, applicants: 41, interviews: 9, sla: 'At risk', priority: 'High', recruiter: 'Aarti' },
  { id: '7', title: 'Backend Architect', department: 'Engineering', location: 'Bangalore', openings: 1, applicants: 22, interviews: 5, sla: 'On track', priority: 'High', recruiter: 'Aarti' },
  { id: '8', title: 'SDE II (Platform)', department: 'Engineering', location: 'Hyderabad', openings: 2, applicants: 35, interviews: 8, sla: 'On track', priority: 'Medium', recruiter: 'Aarti' },
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

const defaultStages = ['Queue', 'Applied', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'];



// Roles List Panel Component - Requirements 16.1, 16.9, 16.10, 10.1
function RolesListPanel({ 
  roles, 
  selectedRole, 
  onSelectRole 
}: { 
  roles: Role[]; 
  selectedRole: Role | null; 
  onSelectRole: (role: Role) => void;
}) {
  const columns: Column<Role>[] = [
    {
      key: 'title',
      header: 'Role',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-[#111827]">{row.title}</div>
          <div className="text-[10px] text-[#64748b]">{row.department}</div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Loc',
      sortable: true,
      render: (row) => <span className="text-[#64748b] text-xs">{row.location}</span>,
    },
    {
      key: 'openings',
      header: 'Open',
      sortable: true,
      align: 'center',
      render: (row) => (
        <span className="font-medium text-[#111827]">{row.openings}</span>
      ),
    },
    {
      key: 'applicants',
      header: 'Apps',
      sortable: true,
      align: 'center',
      render: (row) => (
        <span className="font-medium text-[#0b6cf0]">{row.applicants}</span>
      ),
    },
    {
      key: 'interviews',
      header: 'Interv',
      sortable: true,
      align: 'center',
      render: (row) => (
        <span className="font-medium text-[#111827]">{row.interviews}</span>
      ),
    },
    {
      key: 'sla',
      header: 'SLA',
      render: (row) => {
        const variant = row.sla === 'On track' ? 'green' : row.sla === 'At risk' ? 'orange' : 'red';
        return <Badge text={row.sla} variant={variant} />;
      },
    },
    {
      key: 'priority',
      header: 'Pri',
      render: (row) => {
        const variant = row.priority === 'High' ? 'priority' : row.priority === 'Medium' ? 'orange' : 'gray';
        return <Badge text={row.priority} variant={variant} />;
      },
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
      {/* Card Header - Requirements 10.1 */}
      <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#111827]">Roles</h3>
          <p className="text-xs text-[#64748b]">Click a role to view its full pipeline</p>
        </div>
        <span className="px-2 py-1 bg-[#f8fafc] rounded-full text-xs text-[#64748b] border border-[#e2e8f0]">
          High: {roles.filter(r => r.priority === 'High').length} · Medium: {roles.filter(r => r.priority === 'Medium').length}
        </span>
      </div>
      <Table
        columns={columns}
        data={roles}
        keyExtractor={(row) => row.id}
        onRowClick={onSelectRole}
        selectedRow={selectedRole || undefined}
      />
    </div>
  );
}

// Stage Summary Strip Component - Requirement 16.4, 10.2
function StageSummaryStrip({ stages, onStageFilter }: { stages: StageCount[]; onStageFilter: (stage: string | null) => void }) {
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const handleStageClick = (stageName: string) => {
    const newStage = activeStage === stageName ? null : stageName;
    setActiveStage(newStage);
    onStageFilter(newStage);
  };

  const getStageIndicatorColor = (stageName: string): string => {
    const colors: Record<string, string> = {
      'Queue': 'bg-[#94a3b8]',
      'Applied': 'bg-[#0ea5e9]',
      'Screening': 'bg-[#f59e0b]',
      'Shortlisted': 'bg-[#22c55e]',
      'Interview': 'bg-[#6366f1]',
      'Offer': 'bg-[#8b5cf6]',
      'Hired': 'bg-[#10b981]',
      'Rejected': 'bg-[#ef4444]',
    };
    return colors[stageName] || 'bg-[#94a3b8]';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {stages.map((stage) => (
        <button
          key={stage.name}
          onClick={() => handleStageClick(stage.name)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
            ${activeStage === stage.name 
              ? 'bg-[#0b6cf0] text-white shadow-sm' 
              : 'bg-[#f8fafc] text-[#4b5563] border border-dashed border-[#e2e8f0] hover:bg-[#e8f2fe] hover:border-[#0b6cf0]'
            }
          `}
        >
          {/* Stage Indicator Dot */}
          <span className={`w-1.5 h-1.5 rounded-full ${activeStage === stage.name ? 'bg-white' : getStageIndicatorColor(stage.name)}`}></span>
          {stage.name} <span className="ml-0.5 opacity-75">{stage.count}</span>
        </button>
      ))}
    </div>
  );
}

// Candidate Table View Component - Requirement 16.5, 10.3
function CandidateTableView({ 
  candidates, 
  onCandidateClick 
}: { 
  candidates: PipelineCandidate[]; 
  onCandidateClick: (candidate: PipelineCandidate) => void;
}) {
  const getScoreVariant = (score: number): 'green' | 'orange' | 'red' => {
    if (score >= 80) return 'green';
    if (score >= 50) return 'orange';
    return 'red';
  };

  const getStageColor = (stage: string): { bg: string; text: string } => {
    const colors: Record<string, { bg: string; text: string }> = {
      'Queue': { bg: 'bg-[#f1f5f9]', text: 'text-[#475569]' },
      'Applied': { bg: 'bg-[#e0f2fe]', text: 'text-[#0369a1]' },
      'Screening': { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]' },
      'Shortlisted': { bg: 'bg-[#dcfce7]', text: 'text-[#166534]' },
      'Interview': { bg: 'bg-[#e0e7ff]', text: 'text-[#4338ca]' },
      'Offer': { bg: 'bg-[#f5f3ff]', text: 'text-[#6d28d9]' },
      'Hired': { bg: 'bg-[#d1fae5]', text: 'text-[#047857]' },
      'Rejected': { bg: 'bg-[#fee2e2]', text: 'text-[#b91c1c]' },
    };
    return colors[stage] || { bg: 'bg-[#dbeafe]', text: 'text-[#1d4ed8]' };
  };

  const columns: Column<PipelineCandidate>[] = [
    {
      key: 'name',
      header: 'Candidate',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          {/* Avatar - Requirements 10.3 */}
          <div className={`w-8 h-8 rounded-full ${getAvatarColor(row.name)} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}>
            {getInitials(row.name)}
          </div>
          <div>
            <div className="font-semibold text-[#111827]">{row.name}</div>
            <div className="text-[10px] text-[#64748b]">{row.title}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      sortable: true,
      render: (row) => {
        const stageColor = getStageColor(row.stage);
        return (
          <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${stageColor.bg} ${stageColor.text}`}>
            {row.stage}
          </span>
        );
      },
    },
    {
      key: 'score',
      header: 'Score',
      sortable: true,
      align: 'center',
      render: (row) => (
        <Badge text={String(row.score)} variant={getScoreVariant(row.score)} />
      ),
    },
    {
      key: 'experience',
      header: 'Exp',
      sortable: true,
      align: 'center',
      render: (row) => <span className="text-[#64748b]">{row.experience} yrs</span>,
    },
    {
      key: 'location',
      header: 'Location',
      sortable: true,
      render: (row) => <span className="text-[#64748b]">{row.location}</span>,
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      render: (row) => <span className="text-[#64748b]">{row.source}</span>,
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      sortable: true,
      render: (row) => <span className="text-[#64748b]">{row.updatedAt}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: () => (
        <div className="flex gap-1">
          <Button variant="mini" miniColor="note" onClick={() => {}}>Note</Button>
          <Button variant="mini" miniColor="move" onClick={() => {}}>Move</Button>
          <Button variant="mini" miniColor="schedule" onClick={() => {}}>Schedule</Button>
          <Button variant="mini" miniColor="cv" onClick={() => {}}>CV</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
      <Table
        columns={columns}
        data={candidates}
        keyExtractor={(row) => row.id}
        onRowClick={onCandidateClick}
      />
    </div>
  );
}


// Helper function to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to get avatar background color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-[#0b6cf0]', 'bg-[#16a34a]', 'bg-[#dc2626]', 'bg-[#9333ea]',
    'bg-[#ea580c]', 'bg-[#0891b2]', 'bg-[#4f46e5]', 'bg-[#be185d]'
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

// Kanban Card Component - Requirement 16.7, 10.3
function KanbanCard({ 
  candidate, 
  onClick 
}: { 
  candidate: PipelineCandidate; 
  onClick: () => void;
}) {
  const getScoreVariant = (score: number): 'green' | 'orange' | 'red' => {
    if (score >= 80) return 'green';
    if (score >= 50) return 'orange';
    return 'red';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-[#e2e8f0] p-3 shadow-sm hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5"
    >
      {/* Avatar, Name, and Score Badge - Requirements 10.3 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full ${getAvatarColor(candidate.name)} flex items-center justify-center text-white text-xs font-medium`}>
            {getInitials(candidate.name)}
          </div>
          <div>
            <div className="font-semibold text-sm text-[#111827]">{candidate.name}</div>
            <div className="text-[10px] text-[#64748b]">{candidate.title}</div>
          </div>
        </div>
        <Badge text={String(candidate.score)} variant={getScoreVariant(candidate.score)} />
      </div>
      
      <div className="text-[10px] text-[#64748b] mb-2">
        {candidate.experience} yrs · {candidate.location}
      </div>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {candidate.skills.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="px-1.5 py-0.5 bg-[#f8fafc] text-[#4b5563] text-[9px] rounded-full border border-[#e2e8f0]"
          >
            {skill}
          </span>
        ))}
        {candidate.skills.length > 3 && (
          <span className="text-[9px] text-[#94a3b8]">+{candidate.skills.length - 3}</span>
        )}
      </div>
      
      <div className="flex gap-1">
        <Button variant="mini" miniColor="note">Note</Button>
        <Button variant="mini" miniColor="move">Move</Button>
        <Button variant="mini" miniColor="schedule">Sched</Button>
        <Button variant="mini" miniColor="cv">CV</Button>
      </div>
    </div>
  );
}

// Stage color mapping for pipeline indicators - Requirements 10.2
const stageColors: Record<string, { bg: string; border: string; indicator: string }> = {
  'Queue': { bg: 'bg-[#f1f5f9]', border: 'border-[#e2e8f0]', indicator: 'bg-[#94a3b8]' },
  'Applied': { bg: 'bg-[#e0f2fe]', border: 'border-[#bae6fd]', indicator: 'bg-[#0ea5e9]' },
  'Screening': { bg: 'bg-[#fef3c7]', border: 'border-[#fde68a]', indicator: 'bg-[#f59e0b]' },
  'Shortlisted': { bg: 'bg-[#dcfce7]', border: 'border-[#bbf7d0]', indicator: 'bg-[#22c55e]' },
  'Interview': { bg: 'bg-[#e0e7ff]', border: 'border-[#c7d2fe]', indicator: 'bg-[#6366f1]' },
  'Offer': { bg: 'bg-[#f5f3ff]', border: 'border-[#ddd6fe]', indicator: 'bg-[#8b5cf6]' },
  'Hired': { bg: 'bg-[#d1fae5]', border: 'border-[#a7f3d0]', indicator: 'bg-[#10b981]' },
  'Rejected': { bg: 'bg-[#fee2e2]', border: 'border-[#fecaca]', indicator: 'bg-[#ef4444]' },
};

// Kanban Board View Component - Requirements 16.6, 16.7, 10.2
function KanbanBoardView({ 
  candidates, 
  stages,
  onCandidateClick 
}: { 
  candidates: PipelineCandidate[]; 
  stages: string[];
  onCandidateClick: (candidate: PipelineCandidate) => void;
}) {
  const getCandidatesByStage = (stage: string) => 
    candidates.filter((c) => c.stage === stage);

  const getStageStyle = (stage: string) => stageColors[stage] || stageColors['Queue'];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.filter(s => s !== 'Rejected').map((stage) => {
        const stageCandidates = getCandidatesByStage(stage);
        const stageStyle = getStageStyle(stage);
        return (
          <div
            key={stage}
            className={`flex-shrink-0 w-[280px] ${stageStyle.bg} rounded-xl p-3 border ${stageStyle.border}`}
          >
            {/* Stage Header with Indicator - Requirements 10.2 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stageStyle.indicator}`}></div>
                <h4 className="text-sm font-semibold text-[#374151]">{stage}</h4>
              </div>
              <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium text-[#64748b] border border-[#e2e8f0] shadow-sm">
                {stageCandidates.length}
              </span>
            </div>
            
            <div className="space-y-3 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto">
              {stageCandidates.map((candidate) => (
                <KanbanCard
                  key={candidate.id}
                  candidate={candidate}
                  onClick={() => onCandidateClick(candidate)}
                />
              ))}
              {stageCandidates.length === 0 && (
                <div className="text-center py-8 text-xs text-[#94a3b8]">
                  No candidates
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Candidate Detail Panel Content - Requirement 16.8
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
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedCandidate, setSelectedCandidate] = useState<PipelineCandidate | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [jobCandidates, setJobCandidates] = useState<PipelineCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  
  // State for Job Description Modal - Requirements 6.1, 6.2
  const [isJobDescriptionModalOpen, setIsJobDescriptionModalOpen] = useState(false);
  const [selectedJobForDescription, setSelectedJobForDescription] = useState<JobType | null>(null);
  const [jobDescriptionLoading, setJobDescriptionLoading] = useState(false);

  // Handler to open Job Description Modal - Requirements 6.1, 6.2
  const handleViewJobDescription = async (jobId: string) => {
    setJobDescriptionLoading(true);
    try {
      const jobDetails = await jobsService.getById(jobId);
      setSelectedJobForDescription(jobDetails as unknown as JobType);
      setIsJobDescriptionModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    } finally {
      setJobDescriptionLoading(false);
    }
  };

  // Map API jobs to local format - show 0 candidates for new jobs until real applications come in
  const rolesFromApi: Role[] = useMemo(() => {
    if (!apiJobs) return [];
    return apiJobs.map((job: Job, index: number) => {
      // Use candidateCount from job if available, otherwise 0 for new jobs
      const applicantCount = job.candidateCount ?? 0;
      const interviewCount = job.interviewCount ?? 0;
      
      return {
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        openings: job.openings,
        applicants: applicantCount, // Actual count from database (0 for new jobs)
        interviews: interviewCount, // Actual interview count (0 for new jobs)
        sla: applicantCount === 0 ? 'On track' : index % 3 === 0 ? 'At risk' : index % 3 === 1 ? 'Breached' : 'On track',
        priority: index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Medium' : 'Low',
        recruiter: ['Aarti', 'Rahul', 'Vikram', 'Sana'][index % 4],
      };
    }) as Role[];
  }, [apiJobs]);

  // Use API data if available, otherwise fall back to sample data
  const roles = rolesFromApi.length > 0 ? rolesFromApi : sampleRoles;

  // Set initial selected role
  useEffect(() => {
    if (!selectedRole && roles.length > 0) {
      setSelectedRole(roles[0]);
    }
  }, [roles, selectedRole]);

  // Fetch candidates for the selected job
  useEffect(() => {
    async function fetchJobCandidates() {
      if (!selectedRole) {
        setJobCandidates([]);
        return;
      }

      // If using sample data (no API jobs), use sample candidates for demo
      if (rolesFromApi.length === 0) {
        setJobCandidates(sampleCandidates);
        return;
      }

      setCandidatesLoading(true);
      try {
        const candidates = await candidatesService.getByJob(selectedRole.id);
        // Map JobCandidate to PipelineCandidate
        const mappedCandidates: PipelineCandidate[] = candidates.map((jc: JobCandidate) => ({
          id: jc.candidateId,
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
      } catch (error) {
        console.error('Failed to fetch job candidates:', error);
        setJobCandidates([]);
      } finally {
        setCandidatesLoading(false);
      }
    }

    fetchJobCandidates();
  }, [selectedRole, rolesFromApi.length]);

  // Calculate stage counts for the selected role's candidates
  const stageCounts: StageCount[] = defaultStages.map((stage) => ({
    name: stage,
    count: jobCandidates.filter((c) => c.stage === stage).length,
  }));

  // Filter candidates by stage if filter is active
  const filteredCandidates = stageFilter
    ? jobCandidates.filter((c) => c.stage === stageFilter)
    : jobCandidates;

  // Calculate KPI metrics for selected role
  const totalCandidates = jobCandidates.length;
  const newThisWeek = jobCandidates.length > 0 ? Math.min(3, jobCandidates.length) : 0;
  const interviewsScheduled = jobCandidates.filter((c) => c.stage === 'Interview').length;
  const pendingFeedback = interviewsScheduled > 0 ? Math.min(2, interviewsScheduled) : 0;
  const offersMade = jobCandidates.filter((c) => c.stage === 'Offer').length;
  const acceptanceRate = 75;
  const avgTimeInStage = 4.2;

  // Header actions - Requirement 16.11
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">Export pipeline</Button>
    </div>
  );

  // Calculate totals for subtitle
  const totalOpenings = roles.reduce((sum, r) => sum + r.openings, 0);
  const totalApplicants = roles.reduce((sum, r) => sum + r.applicants, 0);

  return (
    <Layout
      pageTitle="Role-wise Pipeline"
      pageSubtitle={`${roles.length} active roles · ${totalOpenings} openings · ${totalApplicants} candidates in pipeline`}
      headerActions={headerActions}
      user={user}
      companyName="Acme Technologies"
      footerLeftText="SnapFind Client ATS · Roles & Pipelines view"
      footerRightText="Time-to-fill (median): 24 days · Offer acceptance: 78%"
      onLogout={logout}
    >
      {/* Loading and Error States */}
      {jobsLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {jobsError && (
        <ErrorMessage
          message="Failed to load roles"
          onRetry={() => refetchJobs()}
        />
      )}

      <div className="space-y-6">
        {/* Roles List Panel - Requirements 16.1, 16.9, 16.10, 10.1 */}
        <div>
          <RolesListPanel
            roles={roles}
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
          />
        </div>

        {/* Selected Role Section - Requirement 16.2 */}
        {selectedRole && (
          <div className="space-y-6">
            {/* Role Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">{selectedRole.title}</h2>
                <p className="text-sm text-[#64748b]">
                  {selectedRole.department} · {selectedRole.location} · Recruiter: {selectedRole.recruiter}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleViewJobDescription(selectedRole.id)}
                  disabled={jobDescriptionLoading}
                >
                  {jobDescriptionLoading ? 'Loading...' : 'View Job Description'}
                </Button>
                <Button variant="primary">+ Add candidate</Button>
              </div>
            </div>

            {/* KPI Cards - Requirement 16.3, 22.3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 grid-cols-4-responsive">
              <KPICard
                label="Total candidates"
                value={totalCandidates}
                chip={`+${newThisWeek} this week`}
              />
              <KPICard
                label="Interviews scheduled"
                value={interviewsScheduled}
                trend={{ text: `${pendingFeedback} pending feedback`, type: 'warn' }}
              />
              <KPICard
                label="Offers made"
                value={offersMade}
                trend={{ text: `${acceptanceRate}% acceptance`, type: 'ok' }}
              />
              <KPICard
                label="Avg time in stage"
                value={`${avgTimeInStage} days`}
                trend={{ text: 'Screening bottleneck', type: 'warn' }}
              />
            </div>

            {/* Stage Summary Strip - Requirement 16.4 */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#111827]">Pipeline Stages</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      viewMode === 'table'
                        ? 'bg-[#0b6cf0] text-white'
                        : 'bg-[#f8fafc] text-[#4b5563] hover:bg-[#e8f2fe]'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('board')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      viewMode === 'board'
                        ? 'bg-[#0b6cf0] text-white'
                        : 'bg-[#f8fafc] text-[#4b5563] hover:bg-[#e8f2fe]'
                    }`}
                  >
                    Board
                  </button>
                </div>
              </div>
              <StageSummaryStrip stages={stageCounts} onStageFilter={setStageFilter} />
            </div>

            {/* Candidates View - Requirements 16.5, 16.6, 16.7 */}
            {candidatesLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-8 text-center">
                <p className="text-[#64748b]">No candidates have applied to this role yet.</p>
                <p className="text-sm text-[#94a3b8] mt-1">Candidates will appear here when they apply.</p>
              </div>
            ) : viewMode === 'table' ? (
              <CandidateTableView
                candidates={filteredCandidates}
                onCandidateClick={setSelectedCandidate}
              />
            ) : (
              <KanbanBoardView
                candidates={filteredCandidates}
                stages={defaultStages}
                onCandidateClick={setSelectedCandidate}
              />
            )}
          </div>
        )}
      </div>

      {/* Detail Panel - Requirement 16.8 */}
      <DetailPanel
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title={selectedCandidate?.name || ''}
        subtitle={selectedCandidate ? `${selectedCandidate.title} · ${selectedCandidate.location} · ${selectedCandidate.stage}` : ''}
      >
        {selectedCandidate && (
          <CandidateDetailContent
            candidate={selectedCandidate}
          />
        )}
      </DetailPanel>

      {/* Job Description Modal - Requirements 6.1, 6.2, 6.3 */}
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
