import { Layout, KPICard, Table, LoadingSpinner, SLAConfigSection, AlertsPanel } from '../components';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import { useTasks } from '../hooks/useTasks';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  MdAdd, MdSettings, MdClose, MdCheckCircle, MdRadioButtonUnchecked, MdDeleteOutline,
  MdWork, MdPeople, MdEvent, MdAssignment, MdAccessTime
} from 'react-icons/md';
// Using types from services where possible, or keeping local compatible interfaces
import type { Task } from '../services/tasks.service';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}
import type {
  FunnelStage,
  SourcePerformance,
  RolePipeline
} from '../services/dashboard.service';

/**
 * Dashboard Page - Premium "SaaS" Grid Layout
 * High density, minimized scrolling
 */

// --- Components Refactored for Density defined inline for efficiency ---

// Compact Hiring Funnel
function HiringFunnel({ stages }: { stages: FunnelStage[] }) {
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className="card p-3 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
        Hiring Funnel
      </h3>
      <div className="flex-1 flex flex-col justify-around space-y-2">
        {stages.slice(0, 5).map((stage) => ( // Show top stages only
          <div key={stage.name} className="flex items-center gap-2 group">
            <div className="w-20 text-[11px] font-medium text-gray-500 text-right truncate group-hover:text-blue-600 transition-colors">
              {stage.name}
            </div>
            <div className="flex-1 h-4 bg-gray-50 rounded-sm overflow-hidden relative">
              <div
                className="h-full bg-blue-500/90 rounded-sm transition-all duration-500 ease-out group-hover:bg-blue-600"
                style={{ width: `${(stage.count / maxCount) * 100}%` }}
              />
            </div>
            <div className="w-8 text-[11px] font-semibold text-gray-700 text-right">
              {stage.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact Source Chart
function SourcePerformanceChart({ sources }: { sources: SourcePerformance[] }) {
  const maxPercentage = Math.max(...sources.map(s => s.percentage), 1);

  return (
    <div className="card p-3 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-1 h-3 bg-green-500 rounded-full"></span>
        Top Sources
      </h3>
      <div className="space-y-2 flex-1">
        {sources.slice(0, 5).map((source, idx) => (
          <div key={source.source} className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex justify-between items-end mb-0.5">
                <span className="text-[11px] font-medium text-gray-600">{source.source}</span>
                <span className="text-[11px] font-bold text-gray-900">{source.percentage}%</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-green-500/70'}`}
                  style={{ width: `${(source.percentage / maxPercentage) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// SLA Configuration Modal
function SLAConfigModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 transform transition-all">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">SLA Configuration</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <MdClose size={24} />
            </button>
          </div>
          <SLAConfigSection />
        </div>
      </div>
    </div>
  );
}

// Ultra Compact Interviews - Now "Lengthy" (Wide)
function UpcomingInterviews({ interviews, showViewAll, onViewAll }: any) {
  return (
    <div className="card p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Interviews</h3>
        <button onClick={onViewAll} className="px-2 py-1 text-[10px] font-semibold text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors">View All</button>
      </div>
      <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 h-[330px]">
        {interviews.length === 0 ? (
          <p className="text-[11px] text-gray-400 text-center py-2">No interviews today</p>
        ) : (
          interviews.map((interview: any) => (
            <div key={interview.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group cursor-pointer bg-white" title={showViewAll ? '' : ''}>
              <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 bg-blue-50 rounded-lg text-blue-700 border border-blue-100 shadow-sm">
                <span className="text-[11px] font-bold text-center px-1 leading-tight">{interview.time}</span>
              </div>
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">
                    {interview.candidateName || interview.candidate}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">{interview.role}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${interview.meetingType.includes('Google')
                    ? 'bg-orange-50 text-orange-700 border-orange-100'
                    : 'bg-gray-50 text-gray-600 border-gray-100'
                    }`}>
                    {interview.meetingType}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Compact Tasks Widget with Interactivity - Expanded
function QuickTasks({ tasks, onAddTask, onToggleTask, onDeleteTask }: {
  tasks: Task[];
  onAddTask: (text: string, severity: 'high' | 'medium' | 'low') => void;
  onToggleTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}) {
  const [newTaskText, setNewTaskText] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText, priority);
    setNewTaskText('');
    setPriority('medium');
    setIsAdding(false);
  }

  const openTasks = tasks.filter(t => t.status === 'open');

  return (
    <div className="card p-3 flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Tasks</h3>
        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {openTasks.length} Pending
        </span>
      </div>

      {/* Task List - Fixed Height for ~7 items */}
      <div className="space-y-1 overflow-y-auto custom-scrollbar pr-1 max-h-[320px]">
        {tasks.length === 0 && <p className="text-[11px] text-gray-400 text-center py-2">No tasks yet</p>}

        {tasks.map(task => (
          <div key={task.id} className="group flex items-start gap-2 p-1.5 hover:bg-gray-50 rounded transition-colors border-b border-gray-50 last:border-0">
            <button
              onClick={() => onToggleTask(task)}
              className={`mt-0.5 flex-shrink-0 ${task.status === 'closed' ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'}`}
            >
              {task.status === 'closed' ? <MdCheckCircle size={16} /> : <MdRadioButtonUnchecked size={16} />}
            </button>

            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-medium leading-tight ${task.status === 'closed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {task.text}
              </p>
              {task.status === 'open' && (
                <div className="mt-0.5 flex gap-1.5 text-[11px] text-gray-400">
                  <span className={`uppercase font-bold ${task.severity === 'high' ? 'text-red-500' : task.severity === 'medium' ? 'text-orange-400' : 'text-blue-400'
                    }`}>{task.severity}</span>
                  <span>•</span>
                  <span>{task.age}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => onDeleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-0.5"
              title="Delete task"
            >
              <MdDeleteOutline size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Task Input Area - Sticky at bottom of card */}
      <div className="mt-auto pt-2 border-t border-gray-100">
        {isAdding ? (
          <form onSubmit={handleAddTask} className="bg-gray-50/50 rounded-md p-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full text-xs bg-transparent border-none p-0 focus:ring-0 placeholder-gray-400 mb-2 focus:outline-none"
              autoFocus
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {(['high', 'medium', 'low'] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`text-[9px] px-1.5 py-0.5 rounded border capitalize ${priority === p
                      ? 'bg-white border-blue-500 text-blue-600 font-medium shadow-sm'
                      : 'border-transparent text-gray-400 hover:bg-gray-100'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-[9px] px-2 py-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTaskText.trim()}
                  className="text-[9px] px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors pl-1"
          >
            <MdAdd className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </div>
  )
}

// --- Main Page Component ---

// Types (Reused)
// Columns Definition - using navigate from closure
const createPipelineColumns = (navigate: (path: string) => void): Column<RolePipeline>[] => [
  { key: 'role', header: 'Role', render: (row) => <span className="font-semibold text-gray-900">{row.role}</span> },
  { key: 'location', header: 'Location', width: '120px', render: (row) => <span className="text-gray-600">{row.location || 'Not specified'}</span> },
  { key: 'applicants', header: 'Applicants', align: 'center', width: '100px' },
  { key: 'interview', header: 'Interviews', align: 'center', width: '100px' },
  { key: 'offer', header: 'Offers', align: 'center', width: '80px' },
  {
    key: 'sla', header: 'SLA Status', width: '120px', render: (row) => (
      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${row.sla === 'Breached' ? 'bg-red-100 text-red-700' :
        row.sla === 'At risk' ? 'bg-orange-100 text-orange-700' :
          'bg-green-100 text-green-700'
        }`}>
        {row.sla}
      </span>
    )
  },
  {
    key: 'actions', header: '', width: '80px', align: 'center', render: (row) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/roles?jobId=${row.id}`);
        }}
        className="px-2 py-1 text-[10px] font-semibold text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
      >
        View
      </button>
    )
  },
];

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Real Data Hooks
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboard();
  const { tasks, createTask, toggleTask, deleteTask } = useTasks();

  const [showSLAConfig, setShowSLAConfig] = useState(false);

  // Task Handlers
  const handleAddTask = (text: string, severity: 'high' | 'medium' | 'low') => {
    createTask.mutate({ text, severity, type: 'reminder' }); // Default type
  };

  const handleToggleTask = (task: Task) => {
    toggleTask.mutate(task);
  };

  const handleDeleteTask = (id: string) => {
    deleteTask.mutate(id);
  };

  if (isDashboardLoading || !dashboardData) {
    return (
      <Layout pageTitle="Dashboard" user={user}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  const { metrics, rolePipeline, funnel, sources, interviews } = dashboardData;

  return (
    <Layout pageTitle="Dashboard" user={user}>
      <div className="p-4 space-y-4 max-w-[1600px] mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/jobs/new')}
              className="bg-[#0f172a] text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 flex items-center gap-2"
            >
              <MdAdd size={16} />
              <span>Create New Job</span>
            </button>
            <button
              onClick={() => setShowSLAConfig(true)}
              className="bg-white text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm flex items-center gap-2"
            >
              <MdSettings size={16} />
              <span>SLA Settings</span>
            </button>
          </div>
        </div>

        {/* KPI Grid - Ultra Slim */}
        <div className="grid grid-cols-5 gap-3">
          <KPICard
            label="Active Jobs"
            value={metrics.openRoles}
            trend={{ text: '2 this week', type: 'ok' }}
            icon={MdWork}
          />
          <KPICard
            label="Total Candidates"
            value={metrics.activeCandidates}
            trend={{ text: '12 today', type: 'ok' }}
            icon={MdPeople}
          />
          <KPICard
            label="Interviews"
            value={metrics.interviewsThisWeek}
            subtitle={`${metrics.interviewsToday} today`}
            trend={{ text: 'Busy', type: 'ok' }}
            icon={MdEvent}
          />
          <KPICard
            label="Offers"
            value={metrics.offersPending}
            subtitle={`${metrics.totalHires} hired`}
            trend={{ text: 'On Track', type: 'ok' }}
            icon={MdAssignment}
          />
          <KPICard
            label="Time to Hire"
            value={`${metrics.timeToFillMedian}d`}
            subtitle="Avg."
            trend={{ text: 'Stable', type: 'neutral' }}
            icon={MdAccessTime}
          />
        </div>

        {/* Section 2: Main Content Grid (3 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left Column (2/3 width) - Pipeline & Deep Analysis & Interviews */}
          <div className="lg:col-span-2 space-y-4 flex flex-col h-full">



            {/* Active Pipeline Table */}
            <div className="card bg-white overflow-hidden flex flex-col shadow-none border border-gray-100/50 max-h-[500px]">
              <div className="p-3 border-b border-gray-100 flex justify-between items-center shrink-0">
                <h2 className="text-sm font-bold text-gray-900">Active Role Pipelines</h2>
                <button
                  onClick={() => navigate('/roles')}
                  className="px-2 py-1 text-[10px] font-semibold text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="overflow-y-auto custom-scrollbar">
                <Table
                  data={rolePipeline}
                  columns={createPipelineColumns(navigate)}
                  keyExtractor={(row) => row.id}
                  onRowClick={(row) => navigate(`/roles?jobId=${row.id}`)}
                />
              </div>
            </div>

            {/* Interviews - Moved Here for "Lengthy" View & Filling space */}
            <div className="flex-1 min-h-[400px]">
              <UpcomingInterviews
                interviews={interviews}
                showViewAll={true}
                onViewAll={() => navigate('/interviews')}
              />
            </div>

            {/* Hiring Funnel - Moved to Bottom of Left Col as requested */}
            <div className="card p-3 h-80">
              <HiringFunnel stages={funnel} />
            </div>

          </div>

          {/* Right Column (1/3 width) - "At a Glance" Action Board + Funnel/Sources */}
          <div className="space-y-4 flex flex-col">

            {/* Alerts Panel - Top Priority (Styled like Tasks) */}
            <div className="card h-[380px] flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AlertsPanel compact={true} maxAlerts={50} className="border-0 shadow-none h-full" />
              </div>
            </div>

            {/* Tasks / Actions */}
            <div>
              <QuickTasks
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>

            {/* Top Sources */}
            <div className="h-64">
              <SourcePerformanceChart sources={sources} />
            </div>

            {/* Mini Activity Feed */}
            <div className="card p-3 h-auto shrink-0 hidden">
              {/* Hidden for now to prevent overcrowding, keeping code for reference if user asks back */}
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent Activity</h3>
              <div className="space-y-3 relative">
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-100"></div>
                {/* ... content ... */}
              </div>
            </div>
          </div>

        </div>
      </div>
      <SLAConfigModal isOpen={showSLAConfig} onClose={() => setShowSLAConfig(false)} />
    </Layout>
  );
}

// Duplicate function export removed.
