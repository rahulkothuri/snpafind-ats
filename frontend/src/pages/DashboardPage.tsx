import { Layout, KPICard, Badge, Button, Table, LoadingSpinner, ErrorMessage, AlertsPanel } from '../components';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { tasksService } from '../services';
import type { Task as ApiTask, TaskType, TaskSeverity } from '../services';

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
  status: 'open' | 'closed';
  completedAt?: string;
}

// Map API task type to display type
function mapTaskType(type: TaskType): Task['type'] {
  const typeMap: Record<TaskType, Task['type']> = {
    feedback: 'Feedback',
    approval: 'Approval',
    reminder: 'Reminder',
    pipeline: 'Pipeline',
  };
  return typeMap[type];
}

// Map display type to API task type
function mapToApiTaskType(type: Task['type']): TaskType {
  const typeMap: Record<Task['type'], TaskType> = {
    Feedback: 'feedback',
    Approval: 'approval',
    Reminder: 'reminder',
    Pipeline: 'pipeline',
  };
  return typeMap[type];
}

// Map API task to display task
function mapApiTaskToTask(apiTask: ApiTask): Task {
  return {
    id: apiTask.id,
    type: mapTaskType(apiTask.type),
    text: apiTask.text,
    age: apiTask.age,
    severity: apiTask.severity,
    status: apiTask.status,
    completedAt: apiTask.completedAt,
  };
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
  { id: '7', role: 'Frontend Developer', location: 'Mumbai', applicants: 35, interview: 7, offer: 1, age: 15, sla: 'On track', priority: 'Medium' },
  { id: '8', role: 'DevOps Engineer', location: 'Bangalore', applicants: 29, interview: 5, offer: 1, age: 22, sla: 'At risk', priority: 'High' },
  { id: '9', role: 'QA Engineer', location: 'Hyderabad', applicants: 31, interview: 8, offer: 2, age: 19, sla: 'On track', priority: 'Low' },
  { id: '10', role: 'Marketing Manager', location: 'Delhi', applicants: 26, interview: 4, offer: 0, age: 35, sla: 'Breached', priority: 'Medium' },
];

// Role relevance/activity scoring function - Requirements 2.1, 2.4
function calculateRoleRelevance(role: RolePipeline): number {
  let score = 0;
  
  // Priority scoring (High = 3, Medium = 2, Low = 1)
  const priorityScore = role.priority === 'High' ? 3 : role.priority === 'Medium' ? 2 : 1;
  score += priorityScore * 10;
  
  // SLA status scoring (Breached = 3, At risk = 2, On track = 1)
  const slaScore = role.sla === 'Breached' ? 3 : role.sla === 'At risk' ? 2 : 1;
  score += slaScore * 8;
  
  // Activity scoring based on pipeline activity (interviews + offers)
  const activityScore = role.interview + role.offer;
  score += activityScore * 2;
  
  // Recency scoring (newer roles get higher score, age is in days)
  const recencyScore = Math.max(0, 30 - role.age);
  score += recencyScore;
  
  return score;
}

// Function to get limited and sorted roles - Requirements 2.1, 2.4
function getLimitedRoles(roles: RolePipeline[], maxCount: number = 7): RolePipeline[] {
  return roles
    .map(role => ({ ...role, relevanceScore: calculateRoleRelevance(role) }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxCount)
    .map(({ relevanceScore, ...role }) => role);
}

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
  { id: '5', time: '4:00 PM', candidate: 'Amit Kumar', role: 'Frontend Developer', panel: 'Panel D (Frontend)', meetingType: 'Google Meet' },
  { id: '6', time: '5:00 PM', candidate: 'Neha Singh', role: 'Data Analyst', panel: 'Panel E (Data)', meetingType: 'Zoom' },
  { id: '7', time: '9:00 AM', candidate: 'Rajesh Gupta', role: 'DevOps Engineer', panel: 'Panel F (DevOps)', meetingType: 'In-office' },
];

// Function to parse time string to comparable format - Requirements 3.1, 3.4
function parseInterviewTime(timeStr: string): number {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  
  if (period === 'PM' && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  return hour24 * 60 + minutes;
}

// Function to get limited and chronologically sorted interviews - Requirements 3.1, 3.4
function getLimitedInterviews(interviews: Interview[], maxCount: number = 5): Interview[] {
  return interviews
    .slice()
    .sort((a, b) => parseInterviewTime(a.time) - parseInterviewTime(b.time))
    .slice(0, maxCount);
}

const sampleTasks: Task[] = [
  { id: '1', type: 'Feedback', text: 'Submit feedback for Priya Sharma - Backend round', age: '2h', severity: 'high', status: 'open' },
  { id: '2', type: 'Approval', text: 'Approve offer letter for Vikram Singh', age: '1d', severity: 'high', status: 'open' },
  { id: '3', type: 'Reminder', text: 'Follow up with Ankit Patel on offer decision', age: '3d', severity: 'medium', status: 'open' },
  { id: '4', type: 'Pipeline', text: 'Review 12 new applications for Data Analyst', age: '4h', severity: 'medium', status: 'open' },
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
function UpcomingInterviews({ 
  interviews, 
  showViewAll = false, 
  onViewAll 
}: { 
  interviews: Interview[]; 
  showViewAll?: boolean;
  onViewAll?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111827]">Upcoming Interviews</h3>
        {showViewAll && onViewAll && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewAll}
          >
            View All
          </Button>
        )}
      </div>
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


// Tasks Section Component with Add/Complete functionality
function TasksSection({ 
  tasks, 
  onAddTask, 
  onCompleteTask,
  onReopenTask,
}: { 
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'age' | 'status'>) => void;
  onCompleteTask: (taskId: string) => void;
  onReopenTask: (taskId: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'open' | 'closed'>('open');
  const [newTask, setNewTask] = useState({
    type: 'Reminder' as Task['type'],
    text: '',
    severity: 'medium' as Task['severity'],
  });

  const filteredTasks = tasks.filter(task => task.status === viewMode);
  const openCount = tasks.filter(t => t.status === 'open').length;
  const closedCount = tasks.filter(t => t.status === 'closed').length;

  const severityVariant = (severity: Task['severity']) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      default: return 'gray';
    }
  };

  // Professional emoji icons mapping - Requirements 4.1
  const typeIcon = (type: Task['type']) => {
    switch (type) {
      case 'Feedback': return '💭';
      case 'Approval': return '✓';
      case 'Reminder': return '⏰';
      case 'Pipeline': return '📊';
      default: return '📌';
    }
  };

  // Icon background colors for better visual hierarchy
  const typeIconBg = (type: Task['type']) => {
    switch (type) {
      case 'Feedback': return 'bg-blue-100 text-blue-600';
      case 'Approval': return 'bg-green-100 text-green-600';
      case 'Reminder': return 'bg-orange-100 text-orange-600';
      case 'Pipeline': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleAddTask = () => {
    if (newTask.text.trim()) {
      onAddTask(newTask);
      setNewTask({ type: 'Reminder', text: '', severity: 'medium' });
      setShowAddForm(false);
    }
  };

  const handleCompleteClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    onCompleteTask(taskId);
  };

  const handleReopenClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    onReopenTask(taskId);
  };

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      {/* Header with tabs and add button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('open')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              viewMode === 'open'
                ? 'bg-[#0b6cf0] text-white'
                : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setViewMode('closed')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              viewMode === 'closed'
                ? 'bg-[#0b6cf0] text-white'
                : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
            }`}
          >
            Closed ({closedCount})
          </button>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#0b6cf0] hover:bg-[#e8f2fe] rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="mb-4 p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Task Description</label>
              <input
                type="text"
                value={newTask.text}
                onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
                placeholder="Enter task description..."
                className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0]"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#374151] mb-1">Type</label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value as Task['type'] })}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0]"
                >
                  <option value="Feedback">Feedback</option>
                  <option value="Approval">Approval</option>
                  <option value="Reminder">Reminder</option>
                  <option value="Pipeline">Pipeline</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#374151] mb-1">Priority</label>
                <select
                  value={newTask.severity}
                  onChange={(e) => setNewTask({ ...newTask, severity: e.target.value as Task['severity'] })}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0]"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#64748b] hover:bg-[#e2e8f0] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                disabled={!newTask.text.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#0b6cf0] hover:bg-[#0952b8] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div 
        className="space-y-2"
        role="list"
        aria-labelledby="tasks-section-heading"
      >
        {filteredTasks.length === 0 ? (
          <div className="text-center py-6 text-sm text-[#64748b]">
            {viewMode === 'open' ? 'No open tasks' : 'No closed tasks'}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-start gap-3 p-3 border rounded-lg transition-all duration-200 ${
                task.status === 'closed'
                  ? 'bg-[#f1f5f9] border-[#e2e8f0] opacity-75'
                  : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#cbd5e1] cursor-pointer'
              }`}
              role="listitem"
            >
              {/* Complete/Reopen checkbox */}
              <button
                onClick={(e) => task.status === 'open' ? handleCompleteClick(e, task.id) : handleReopenClick(e, task.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  task.status === 'closed'
                    ? 'bg-[#10b981] border-[#10b981] text-white'
                    : 'border-[#cbd5e1] hover:border-[#0b6cf0] hover:bg-[#e8f2fe]'
                }`}
                title={task.status === 'open' ? 'Mark as complete' : 'Reopen task'}
              >
                {task.status === 'closed' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${typeIconBg(task.type)}`}
                aria-hidden="true"
              >
                {typeIcon(task.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium leading-tight mb-1 line-clamp-2 ${
                  task.status === 'closed' ? 'text-[#64748b] line-through' : 'text-[#111827]'
                }`}>
                  {task.text}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#64748b]">
                    {task.type} • {task.status === 'closed' && task.completedAt ? `Completed ${task.completedAt}` : task.age}
                  </span>
                </div>
              </div>
              <Badge text={task.severity} variant={severityVariant(task.severity)} />
            </div>
          ))
        )}
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
  const navigate = useNavigate();

  // Task state management with API
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      setTasksError(null);
      const apiTasks = await tasksService.getAll();
      setTasks(apiTasks.map(mapApiTaskToTask));
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setTasksError('Failed to load tasks');
      // Fall back to sample tasks on error
      setTasks(sampleTasks);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // Load tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Add new task handler
  const handleAddTask = async (newTask: Omit<Task, 'id' | 'age' | 'status'>) => {
    try {
      const apiTask = await tasksService.create({
        type: mapToApiTaskType(newTask.type),
        text: newTask.text,
        severity: newTask.severity as TaskSeverity,
      });
      setTasks(prev => [mapApiTaskToTask(apiTask), ...prev]);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // Complete task handler
  const handleCompleteTask = async (taskId: string) => {
    try {
      const apiTask = await tasksService.complete(taskId);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? mapApiTaskToTask(apiTask) : task
      ));
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  // Reopen task handler
  const handleReopenTask = async (taskId: string) => {
    try {
      const apiTask = await tasksService.reopen(taskId);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? mapApiTaskToTask(apiTask) : task
      ));
    } catch (err) {
      console.error('Failed to reopen task:', err);
    }
  };

  // Generate role-specific table columns - Requirements 5.2
  const getRoleSpecificColumns = useMemo(() => {
    const baseColumns = [...pipelineColumns];
    
    // Add actions column for admins and hiring managers
    if (user?.role === 'admin' || user?.role === 'hiring_manager') {
      baseColumns.push({
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex gap-1">
            <Button 
              variant="mini" 
              miniColor="default"
              onClick={() => navigate(`/jobs/${row.id}`)}
            >
              View
            </Button>
            <Button 
              variant="mini" 
              miniColor="default"
              onClick={() => navigate(`/jobs/${row.id}/edit`)}
            >
              Edit
            </Button>
          </div>
        ),
      });
    } else if (user?.role === 'recruiter') {
      // Recruiters can only view their assigned jobs
      baseColumns.push({
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <Button 
            variant="mini" 
            miniColor="default"
            onClick={() => navigate(`/jobs/${row.id}`)}
          >
            View
          </Button>
        ),
      });
    }
    
    return baseColumns;
  }, [user?.role, navigate]);

  // Handle row click with role-based permissions - Requirements 5.2
  const handleRowClick = (row: RolePipeline) => {
    // All users can view job details if they have access
    navigate(`/jobs/${row.id}`);
  };

  // Use API data if available, otherwise fall back to sample data
  const metrics = dashboardData?.metrics || {
    openRoles: 12,
    activeCandidates: 236,
    interviewsToday: 8,
    offersPending: 6,
    timeToFillMedian: 24,
    offerAcceptanceRate: 78,
  };

  const allRolePipeline = dashboardData?.rolePipeline || sampleRolePipeline;
  const rolePipeline = getLimitedRoles(allRolePipeline, 7);
  // const showViewAllRoles = allRolePipeline.length > 7;
  
  const allInterviews = sampleInterviews;
  const interviews = getLimitedInterviews(allInterviews, 5);
  const showViewAllInterviews = allInterviews.length > 5;
  
  const funnel = dashboardData?.funnel || sampleFunnel;
  const sources = dashboardData?.sources || sampleSources;
  const recruiters = dashboardData?.recruiterLoad || sampleRecruiters;

  // Navigation handlers - Requirements 2.2, 2.3, 3.2, 3.3
  const handleViewAllRoles = () => {
    navigate('/roles');
  };

  const handleViewAllInterviews = () => {
    navigate('/interviews');
  };

  // Header actions for the dashboard - Requirements 5.2
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">Saved views</Button>
      <Button variant="outline" size="sm">Export</Button>
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

      {/* Two-column responsive layout - Requirements 1.1, 1.2, 1.3, 1.4 */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 grid-responsive-xl">
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

         

          {/* Role-wise Pipeline Table - Requirement 15.2, 2.1, 2.2, 2.3, 2.4 */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#111827]">
                Role-wise Pipeline
                {user?.role === 'recruiter' && (
                  <span className="text-xs text-[#64748b] ml-2">(Assigned to you)</span>
                )}
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewAllRoles}
              >
                View All
              </Button>
            </div>
            {rolePipeline.length === 0 ? (
              <div className="text-center py-8 text-[#64748b]">
                {user?.role === 'recruiter' 
                  ? 'No jobs assigned to you yet.' 
                  : 'No jobs available.'
                }
              </div>
            ) : (
              <Table
                columns={getRoleSpecificColumns}
                data={rolePipeline}
                keyExtractor={(row) => row.id}
                onRowClick={handleRowClick}
              />
            )}
          </div>

          {/* Upcoming Interviews - Moved to top - Requirement 15.4, 3.1, 3.2, 3.3, 3.4 */}
        <UpcomingInterviews 
          interviews={interviews} 
          showViewAll={showViewAllInterviews}
          onViewAll={handleViewAllInterviews}
        />

          {/* Hiring Funnel - Moved to bottom - Requirement 15.3 */}
          <HiringFunnel stages={funnel} />
        </div>

        {/* Right Sidebar Column - Reorganized per Requirements 1.1, 1.2 */}
        <div className="space-y-6">
          {/* Tasks and Alerts Section - Moved to top right position per Requirement 1.1 */}
          <div className="grid grid-cols-1 gap-4">
            <TasksSection 
              tasks={tasks} 
              onAddTask={handleAddTask}
              onCompleteTask={handleCompleteTask}
              onReopenTask={handleReopenTask}
            />
            {/* AlertsPanel - Requirements 9.2, 10.2 - Fetches alerts on mount */}
            <AlertsPanel maxAlerts={5} />
          </div>

          {/* Recruiter Load - Requirement 15.8 */}
          <RecruiterLoadSection recruiters={recruiters} />

          {/* Activity Feed - Requirements 15.9, 15.10 */}
          <ActivityFeed activities={sampleActivities} />

          {/* Source Performance - Moved to bottom per Requirement 1.2 */}
          <SourcePerformanceChart sources={sources} />
        </div>
      </div>
    </Layout>
  );
}

export default DashboardPage;
