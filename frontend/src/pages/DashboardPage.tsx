import { Layout, KPICard, Badge, Button, Table, LoadingSpinner, ErrorMessage } from '../components';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';

/**
 * Dashboard Page - Requirements 15.1-15.10, 22.1-22.3
 * 
 * Features:
 * - Two-column layout with main content and right sidebar
 * - KPI cards showing key metrics
 * - Role-wise pipeline table
 * - Hiring funnel visualization
 * - Upcoming interviews list
 * - Tasks and alerts sections
 * - Source performance chart
 * - Recruiter load section
 * - Activity feed
 */

// Column type for Table component
interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

// Types for dashboard data
interface RolePipeline {
  id: string;
  role: string;
  location: string;
  applicants: number;
  interview: number;
  offer: number;
  age: number;
  sla: 'On track' | 'At risk' | 'Breached';
  priority: 'High' | 'Medium' | 'Low';
}

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
}

interface Interview {
  id: string;
  time: string;
  candidate: string;
  role: string;
  panel: string;
  meetingType: 'Google Meet' | 'Zoom' | 'In-office';
}

interface Task {
  id: string;
  type: 'Feedback' | 'Approval' | 'Reminder' | 'Pipeline';
  text: string;
  age: string;
  severity: 'high' | 'medium' | 'low';
}

interface Alert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  message: string;
  action: string;
}

interface SourcePerformance {
  source: string;
  percentage: number;
}

interface RecruiterLoad {
  name: string;
  specialty: string;
  activeRoles: number;
  candidates: number;
}

interface ActivityEntry {
  id: string;
  timestamp: string;
  text: string;
}

// Sample data - Requirements 30.1-30.6
const sampleRolePipeline: RolePipeline[] = [
  { id: '1', role: 'Senior Backend Engineer', location: 'Bangalore', applicants: 45, interview: 12, offer: 3, age: 18, sla: 'On track', priority: 'High' },
  { id: '2', role: 'Product Manager', location: 'Hyderabad', applicants: 32, interview: 8, offer: 2, age: 24, sla: 'At risk', priority: 'High' },
  { id: '3', role: 'Sales Lead (North)', location: 'Gurgaon', applicants: 28, interview: 6, offer: 1, age: 32, sla: 'Breached', priority: 'Medium' },
  { id: '4', role: 'UX Designer', location: 'Remote', applicants: 52, interview: 15, offer: 4, age: 14, sla: 'On track', priority: 'Medium' },
  { id: '5', role: 'Data Analyst', location: 'Chennai', applicants: 38, interview: 10, offer: 2, age: 21, sla: 'On track', priority: 'Low' },
  { id: '6', role: 'Backend Engineer (L2)', location: 'Pune', applicants: 41, interview: 9, offer: 2, age: 28, sla: 'At risk', priority: 'High' },
];

const sampleFunnel: FunnelStage[] = [
  { name: 'Applied', count: 236, percentage: 100 },
  { name: 'Screened', count: 142, percentage: 60 },
  { name: 'Shortlisted', count: 89, percentage: 38 },
  { name: 'Interview', count: 60, percentage: 25 },
  { name: 'Offer', count: 14, percentage: 6 },
  { name: 'Hired', count: 8, percentage: 3 },
];

const sampleInterviews: Interview[] = [
  { id: '1', time: '10:00 AM', candidate: 'Priya Sharma', role: 'Senior Backend Engineer', panel: 'Panel A (Backend)', meetingType: 'Google Meet' },
  { id: '2', time: '11:30 AM', candidate: 'Rahul Verma', role: 'Product Manager', panel: 'Panel C (Hiring Mgr)', meetingType: 'Zoom' },
  { id: '3', time: '2:00 PM', candidate: 'Ankit Patel', role: 'Backend Architect', panel: 'Panel B (Architecture)', meetingType: 'In-office' },
  { id: '4', time: '3:30 PM', candidate: 'Sneha Reddy', role: 'UX Designer', panel: 'Panel A (Backend)', meetingType: 'Google Meet' },
];

const sampleTasks: Task[] = [
  { id: '1', type: 'Feedback', text: 'Submit feedback for Priya Sharma - Backend round', age: '2h', severity: 'high' },
  { id: '2', type: 'Approval', text: 'Approve offer letter for Vikram Singh', age: '1d', severity: 'high' },
  { id: '3', type: 'Reminder', text: 'Follow up with Ankit Patel on offer decision', age: '3d', severity: 'medium' },
  { id: '4', type: 'Pipeline', text: 'Review 12 new applications for Data Analyst', age: '4h', severity: 'medium' },
];

const sampleAlerts: Alert[] = [
  { id: '1', level: 'critical', message: 'SLA breach: Sales Lead (North) - 32 days', action: 'View role' },
  { id: '2', level: 'warning', message: 'Resume parsing failed for 3 candidates', action: 'Review' },
  { id: '3', level: 'info', message: 'New LinkedIn integration available', action: 'Learn more' },
];

const sampleSources: SourcePerformance[] = [
  { source: 'LinkedIn', percentage: 44 },
  { source: 'Referrals', percentage: 19 },
  { source: 'Job Board X', percentage: 16 },
  { source: 'Career Page', percentage: 12 },
  { source: 'Agencies', percentage: 9 },
];

const sampleRecruiters: RecruiterLoad[] = [
  { name: 'Aarti', specialty: 'Tech', activeRoles: 4, candidates: 86 },
  { name: 'Rahul', specialty: 'Product', activeRoles: 2, candidates: 45 },
  { name: 'Vikram', specialty: 'Sales', activeRoles: 3, candidates: 52 },
  { name: 'Sana', specialty: 'Design', activeRoles: 2, candidates: 38 },
];

const sampleActivities: ActivityEntry[] = [
  { id: '1', timestamp: '2 min ago', text: 'Priya Sharma moved to Interview stage' },
  { id: '2', timestamp: '15 min ago', text: 'New job posted: Backend Architect' },
  { id: '3', timestamp: '1 hour ago', text: 'Offer letter sent to Vikram Singh' },
  { id: '4', timestamp: '2 hours ago', text: '5 new candidates added from LinkedIn' },
  { id: '5', timestamp: '3 hours ago', text: 'Interview scheduled for Ankit Patel' },
];


// Role pipeline table columns
const pipelineColumns: Column<RolePipeline>[] = [
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    render: (row) => (
      <div>
        <div className="font-medium text-[#111827]">{row.role}</div>
        <div className="text-[10px] text-[#64748b]">{row.location}</div>
      </div>
    ),
  },
  { key: 'applicants', header: 'Apps', sortable: true, align: 'center' },
  { key: 'interview', header: 'Interv', sortable: true, align: 'center' },
  { key: 'offer', header: 'Offer', sortable: true, align: 'center' },
  {
    key: 'age',
    header: 'Age',
    sortable: true,
    align: 'center',
    render: (row) => <span>{row.age}d</span>,
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
      const variant = row.priority === 'High' ? 'priority' : 'gray';
      return <Badge text={row.priority} variant={variant} />;
    },
  },
];

// Hiring Funnel Component
function HiringFunnel({ stages }: { stages: FunnelStage[] }) {
  const maxCount = stages[0]?.count || 1;
  
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">Hiring Funnel</h3>
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.name} className="flex items-center gap-3">
            <div className="w-20 text-xs text-[#64748b] text-right">{stage.name}</div>
            <div className="flex-1 h-6 bg-[#f1f5f9] rounded overflow-hidden">
              <div
                className="h-full bg-[#0b6cf0] rounded transition-all duration-300"
                style={{ width: `${(stage.count / maxCount) * 100}%` }}
              />
            </div>
            <div className="w-16 text-xs text-[#374151]">
              {stage.count} <span className="text-[#94a3b8]">({stage.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Upcoming Interviews Component
function UpcomingInterviews({ interviews }: { interviews: Interview[] }) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">Upcoming Interviews</h3>
      <div className="space-y-3">
        {interviews.map((interview) => (
          <div
            key={interview.id}
            className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]"
          >
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-[#0b6cf0]">{interview.time}</div>
              <div>
                <div className="text-sm font-medium text-[#111827]">{interview.candidate}</div>
                <div className="text-xs text-[#64748b]">{interview.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-[#64748b]">{interview.panel}</div>
                <Badge
                  text={interview.meetingType}
                  variant={interview.meetingType === 'In-office' ? 'green' : 'blue'}
                />
              </div>
              <div className="flex gap-1">
                <Button variant="mini" miniColor="schedule">Join</Button>
                <Button variant="mini" miniColor="default">Reschedule</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// Tasks Section Component
function TasksSection({ tasks }: { tasks: Task[] }) {
  const severityVariant = (severity: Task['severity']) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      default: return 'gray';
    }
  };

  const typeIcon = (type: Task['type']) => {
    switch (type) {
      case 'Feedback': return '💬';
      case 'Approval': return '✅';
      case 'Reminder': return '🔔';
      case 'Pipeline': return '📋';
      default: return '📌';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">Open Tasks</h3>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-2 hover:bg-[#f8fafc] rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{typeIcon(task.type)}</span>
              <div>
                <div className="text-xs font-medium text-[#374151]">{task.text}</div>
                <div className="text-[10px] text-[#94a3b8]">{task.type} · {task.age}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge text={task.severity} variant={severityVariant(task.severity)} />
              <Button variant="mini" miniColor="default">Mark done</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Alerts Section Component
function AlertsSection({ alerts }: { alerts: Alert[] }) {
  const levelStyles = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: '🔴', text: 'text-red-700' },
    warning: { bg: 'bg-orange-50', border: 'border-orange-200', icon: '🟠', text: 'text-orange-700' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: '🔵', text: 'text-blue-700' },
  };

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">Alerts</h3>
      <div className="space-y-2">
        {alerts.map((alert) => {
          const style = levelStyles[alert.level];
          return (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-2 rounded-lg border ${style.bg} ${style.border}`}
            >
              <div className="flex items-center gap-2">
                <span>{style.icon}</span>
                <span className={`text-xs ${style.text}`}>{alert.message}</span>
              </div>
              <button className={`text-xs font-medium ${style.text} hover:underline`}>
                {alert.action}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Source Performance Component
function SourcePerformanceChart({ sources }: { sources: SourcePerformance[] }) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">Source Performance</h3>
      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.source} className="flex items-center gap-3">
            <div className="w-24 text-xs text-[#64748b]">{source.source}</div>
            <div className="flex-1 h-4 bg-[#f1f5f9] rounded overflow-hidden">
              <div
                className="h-full bg-[#0b6cf0] rounded transition-all duration-300"
                style={{ width: `${source.percentage}%` }}
              />
            </div>
            <div className="w-10 text-xs text-[#374151] text-right">{source.percentage}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Recruiter Load Component
function RecruiterLoadSection({ recruiters }: { recruiters: RecruiterLoad[] }) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">Recruiter Load</h3>
      <div className="space-y-3">
        {recruiters.map((recruiter) => (
          <div
            key={recruiter.name}
            className="flex items-center justify-between p-2 hover:bg-[#f8fafc] rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0b6cf0] flex items-center justify-center text-white text-xs font-medium">
                {recruiter.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-medium text-[#374151]">{recruiter.name}</div>
                <div className="text-[10px] text-[#94a3b8]">{recruiter.specialty}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#374151]">{recruiter.activeRoles} roles</div>
              <div className="text-[10px] text-[#94a3b8]">{recruiter.candidates} candidates</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// Activity Feed Component
function ActivityFeed({ activities }: { activities: ActivityEntry[] }) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">Activity Feed</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-[#0b6cf0]" />
            <div>
              <div className="text-xs text-[#374151]">{activity.text}</div>
              <div className="text-[10px] text-[#94a3b8]">{activity.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Dashboard Page Component
export function DashboardPage() {
  const { user, logout } = useAuth();
  const { data: dashboardData, isLoading, error, refetch } = useDashboard();

  // Use API data if available, otherwise fall back to sample data
  const metrics = dashboardData?.metrics || {
    openRoles: 12,
    activeCandidates: 236,
    interviewsToday: 8,
    offersPending: 6,
    timeToFillMedian: 24,
    offerAcceptanceRate: 78,
  };

  const rolePipeline = dashboardData?.rolePipeline || sampleRolePipeline;
  const funnel = dashboardData?.funnel || sampleFunnel;
  const sources = dashboardData?.sources || sampleSources;
  const recruiters = dashboardData?.recruiterLoad || sampleRecruiters;

  // Header actions for the dashboard
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline">Saved views</Button>
      <Button variant="outline">Export</Button>
      <Button variant="primary">+ New Role</Button>
    </div>
  );

  return (
    <Layout
      pageTitle="Dashboard"
      pageSubtitle="Overview of hiring activities and metrics"
      headerActions={headerActions}
      user={user}
      companyName="Acme Technologies"
      footerLeftText="SnapFind Client ATS · Dashboard prototype for reference only"
      footerRightText={`Time-to-fill (median): ${metrics.timeToFillMedian} days · Offer acceptance: ${metrics.offerAcceptanceRate}%`}
      onLogout={logout}
    >
      {/* Loading and Error States */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && (
        <ErrorMessage
          message="Failed to load dashboard data"
          onRetry={() => refetch()}
        />
      )}

      {/* Two-column responsive layout - Requirements 15.1, 22.1, 22.2, 22.3 */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 grid-responsive-xl">
        {/* Main Content Column */}
        <div className="space-y-6">
          {/* KPI Cards Section - Requirement 15.1, 22.3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 grid-cols-4-responsive">
            <KPICard
              label="Open Roles"
              value={metrics.openRoles}
              chip="Priority: 3 High"
              trend={{ text: '+2 this week', type: 'ok' }}
            />
            <KPICard
              label="Active Candidates"
              value={metrics.activeCandidates}
              trend={{ text: '+18% vs last 30 days', type: 'ok' }}
            />
            <KPICard
              label="Interviews Today"
              value={metrics.interviewsToday}
              subtitle="Panel load: 2.7 avg"
              trend={{ text: '3 pending feedback', type: 'warn' }}
            />
            <KPICard
              label="Offers Pending"
              value={metrics.offersPending}
              trend={{ text: '3 offers > 5 days', type: 'bad' }}
            />
          </div>

          {/* Role-wise Pipeline Table - Requirement 15.2 */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">Role-wise Pipeline</h3>
            <Table
              columns={pipelineColumns}
              data={rolePipeline}
              keyExtractor={(row) => row.id}
              onRowClick={(row) => console.log('Selected role:', row.role)}
            />
          </div>

          {/* Hiring Funnel - Requirement 15.3 */}
          <HiringFunnel stages={funnel} />

          {/* Upcoming Interviews - Requirement 15.4 */}
          <UpcomingInterviews interviews={sampleInterviews} />

          {/* Tasks and Alerts Row - Requirements 15.5, 15.6, 22.2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 grid-cols-2-responsive">
            <TasksSection tasks={sampleTasks} />
            <AlertsSection alerts={sampleAlerts} />
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Source Performance - Requirement 15.7 */}
          <SourcePerformanceChart sources={sources} />

          {/* Recruiter Load - Requirement 15.8 */}
          <RecruiterLoadSection recruiters={recruiters} />

          {/* Activity Feed - Requirements 15.9, 15.10 */}
          <ActivityFeed activities={sampleActivities} />
        </div>
      </div>
    </Layout>
  );
}

export default DashboardPage;
