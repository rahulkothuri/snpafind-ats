/**
 * Interview Dashboard Page
 * 
 * Displays a comprehensive interview management dashboard with:
 * - Today's interviews section
 * - Tomorrow's interviews section
 * - This week's interviews section
 * - Pending feedback section
 * - Panel load distribution chart
 * - Filters for job, panel member, and interview mode
 * 
 * Requirements: 11.1, 11.2, 11.3, 12.1, 12.2, 12.5, 13.1, 13.2, 13.3, 13.4
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, 
  LoadingSpinner, 
  ErrorMessage, 
  EmptyState,
  Badge,
  InterviewDetailModal,
  RescheduleModal,
  CancelConfirmationModal,
} from '../components';
import { InterviewCard } from '../components/InterviewCard';
import { PanelLoadChart } from '../components/PanelLoadChart';
import { InterviewDashboardFilters } from '../components/InterviewDashboardFilters';
import { useAuth } from '../hooks/useAuth';
import { useInterviewDashboard, usePanelLoad } from '../hooks/useInterviews';
import { useJobs } from '../hooks/useJobs';
import { useUsers } from '../hooks/useUsers';
import type { Interview, InterviewMode } from '../services/interviews.service';

// Interview section component for displaying grouped interviews
interface InterviewSectionProps {
  title: string;
  interviews: Interview[];
  emptyMessage: string;
  onReschedule?: (interview: Interview) => void;
  onCancel?: (interview: Interview) => void;
  onView?: (interview: Interview) => void;
  onJoin?: (interview: Interview) => void;
  compact?: boolean;
  showCount?: boolean;
}

function InterviewSection({
  title,
  interviews,
  emptyMessage,
  onReschedule,
  onCancel,
  onView,
  onJoin,
  compact = false,
  showCount = true,
}: InterviewSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
        {showCount && (
          <Badge 
            text={`${interviews.length} interview${interviews.length !== 1 ? 's' : ''}`} 
            variant={interviews.length > 0 ? 'blue' : 'gray'} 
          />
        )}
      </div>
      
      {interviews.length === 0 ? (
        <div className="text-center py-6 text-sm text-[#64748b]">
          {emptyMessage}
        </div>
      ) : (
        <div className={compact ? 'space-y-2' : 'space-y-4'}>
          {interviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              onReschedule={onReschedule}
              onCancel={onCancel}
              onView={onView}
              onJoin={onJoin}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Pending feedback section component
interface PendingFeedbackSectionProps {
  interviews: Interview[];
  onView?: (interview: Interview) => void;
}

function PendingFeedbackSection({ interviews, onView }: PendingFeedbackSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#111827]">Pending Feedback</h3>
          {interviews.length > 0 && (
            <span className="flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-[#ef4444] rounded-full">
              {interviews.length}
            </span>
          )}
        </div>
      </div>
      
      {interviews.length === 0 ? (
        <div className="text-center py-6">
          <span className="text-2xl mb-2 block">✅</span>
          <p className="text-sm text-[#64748b]">All feedback submitted!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => {
            const candidateName = interview.jobCandidate?.candidate?.name || 'Unknown';
            const jobTitle = interview.jobCandidate?.job?.title || 'Unknown Job';
            const scheduledDate = new Date(interview.scheduledAt);
            const now = new Date();
            const hoursSince = Math.floor((now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60));
            
            return (
              <div
                key={interview.id}
                className="flex items-center justify-between p-3 bg-[#fef3c7] rounded-lg border border-[#fcd34d] cursor-pointer hover:bg-[#fde68a] transition-colors"
                onClick={() => onView?.(interview)}
              >
                <div>
                  <div className="text-sm font-medium text-[#92400e]">{candidateName}</div>
                  <div className="text-xs text-[#b45309]">{jobTitle}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#92400e]">
                    {hoursSince > 24 ? `${Math.floor(hoursSince / 24)}d ago` : `${hoursSince}h ago`}
                  </div>
                  <Badge text="Feedback Due" variant="orange" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function InterviewDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Interview detail modal state
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Reschedule modal state
  const [rescheduleInterview, setRescheduleInterview] = useState<Interview | null>(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  
  // Cancel confirmation modal state
  const [cancelInterview, setCancelInterview] = useState<Interview | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  
  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard,
  } = useInterviewDashboard();
  
  // Panel load state
  const [panelLoadPeriod, setPanelLoadPeriod] = useState<'week' | 'month'>('week');
  const { 
    data: panelLoadData, 
    isLoading: panelLoadLoading,
  } = usePanelLoad(panelLoadPeriod);
  
  // Fetch jobs and users for filters
  const { data: jobs } = useJobs();
  const { data: users } = useUsers();
  
  // Filter state
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedPanelMemberId, setSelectedPanelMemberId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<InterviewMode | null>(null);

  // Filter interviews based on selected filters
  const filterInterviews = useCallback((interviews: Interview[]): Interview[] => {
    return interviews.filter((interview) => {
      // Filter by job
      if (selectedJobId && interview.jobCandidate?.jobId !== selectedJobId) {
        return false;
      }
      
      // Filter by panel member
      if (selectedPanelMemberId) {
        const hasPanelMember = interview.panelMembers?.some(
          pm => pm.userId === selectedPanelMemberId
        );
        if (!hasPanelMember) return false;
      }
      
      // Filter by mode
      if (selectedMode && interview.mode !== selectedMode) {
        return false;
      }
      
      return true;
    });
  }, [selectedJobId, selectedPanelMemberId, selectedMode]);

  // Filtered interview data
  const filteredData = useMemo(() => {
    if (!dashboardData) return null;
    
    return {
      today: filterInterviews(dashboardData.today || []),
      tomorrow: filterInterviews(dashboardData.tomorrow || []),
      thisWeek: filterInterviews(dashboardData.thisWeek || []),
      pendingFeedback: filterInterviews(dashboardData.pendingFeedback || []),
    };
  }, [dashboardData, filterInterviews]);

  // Prepare filter options
  const jobOptions = useMemo(() => {
    return (jobs || []).map(job => ({ id: job.id, title: job.title }));
  }, [jobs]);

  const panelMemberOptions = useMemo(() => {
    return (users || [])
      .filter(u => u.isActive)
      .map(user => ({ id: user.id, name: user.name }));
  }, [users]);

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedJobId(null);
    setSelectedPanelMemberId(null);
    setSelectedMode(null);
  };

  // Interview action handlers
  const handleReschedule = (interview: Interview) => {
    setRescheduleInterview(interview);
    setIsRescheduleModalOpen(true);
  };

  const handleCancel = (interview: Interview) => {
    setCancelInterview(interview);
    setIsCancelModalOpen(true);
  };

  const handleCloseRescheduleModal = () => {
    setIsRescheduleModalOpen(false);
    setRescheduleInterview(null);
  };

  const handleRescheduleSuccess = () => {
    handleCloseRescheduleModal();
    refetchDashboard();
  };

  const handleCloseCancelModal = () => {
    setIsCancelModalOpen(false);
    setCancelInterview(null);
  };

  const handleCancelSuccess = () => {
    handleCloseCancelModal();
    refetchDashboard();
  };

  const handleView = (interview: Interview) => {
    // Open interview detail modal with feedback integration
    setSelectedInterview(interview);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedInterview(null);
    // Refetch dashboard data to update feedback status
    refetchDashboard();
  };

  const handleJoin = (interview: Interview) => {
    if (interview.meetingLink) {
      window.open(interview.meetingLink, '_blank');
    }
  };

  const handlePanelMemberClick = (userId: string) => {
    setSelectedPanelMemberId(userId);
  };

  // Calculate summary stats
  const totalToday = filteredData?.today.length || 0;
  const totalTomorrow = filteredData?.tomorrow.length || 0;
  const totalThisWeek = filteredData?.thisWeek.length || 0;
  const pendingFeedbackCount = filteredData?.pendingFeedback.length || 0;

  return (
    <Layout
      pageTitle="Interview Dashboard"
      pageSubtitle={`${totalToday} today · ${totalTomorrow} tomorrow · ${totalThisWeek} this week`}
      user={user}
      companyName="Acme Technologies"
      footerLeftText="SnapFind Client ATS · Interview Management"
      footerRightText={`Pending feedback: ${pendingFeedbackCount}`}
      onLogout={logout}
    >
      {/* Loading State */}
      {dashboardLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {dashboardError && (
        <ErrorMessage
          message="Failed to load interview dashboard"
          onRetry={() => refetchDashboard()}
        />
      )}

      {/* Dashboard Content */}
      {!dashboardLoading && !dashboardError && filteredData && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            {/* Today's Interviews - Requirements 11.1, 11.2, 11.3 */}
            <InterviewSection
              title="Today's Interviews"
              interviews={filteredData.today}
              emptyMessage="No interviews scheduled for today"
              onReschedule={handleReschedule}
              onCancel={handleCancel}
              onView={handleView}
              onJoin={handleJoin}
            />

            {/* Tomorrow's Interviews - Requirements 12.1 */}
            <InterviewSection
              title="Tomorrow's Interviews"
              interviews={filteredData.tomorrow}
              emptyMessage="No interviews scheduled for tomorrow"
              onReschedule={handleReschedule}
              onCancel={handleCancel}
              onView={handleView}
              compact
            />

            {/* This Week's Interviews - Requirements 12.2 */}
            <InterviewSection
              title="This Week's Interviews"
              interviews={filteredData.thisWeek}
              emptyMessage="No more interviews scheduled this week"
              onReschedule={handleReschedule}
              onCancel={handleCancel}
              onView={handleView}
              compact
            />
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Filters - Requirements 12.5 */}
            <InterviewDashboardFilters
              jobs={jobOptions}
              selectedJobId={selectedJobId}
              onJobChange={setSelectedJobId}
              panelMembers={panelMemberOptions}
              selectedPanelMemberId={selectedPanelMemberId}
              onPanelMemberChange={setSelectedPanelMemberId}
              selectedMode={selectedMode}
              onModeChange={setSelectedMode}
              onClearFilters={handleClearFilters}
            />

            {/* Pending Feedback - Requirements 14.2 */}
            <PendingFeedbackSection
              interviews={filteredData.pendingFeedback}
              onView={handleView}
            />

            {/* Panel Load Chart - Requirements 13.1, 13.2, 13.3, 13.4 */}
            <PanelLoadChart
              data={panelLoadData || []}
              isLoading={panelLoadLoading}
              onPeriodChange={setPanelLoadPeriod}
              onPanelMemberClick={handlePanelMemberClick}
              initialPeriod={panelLoadPeriod}
            />
          </div>
        </div>
      )}

      {/* Empty State when no data */}
      {!dashboardLoading && !dashboardError && !filteredData && (
        <EmptyState
          icon="📅"
          title="No interviews found"
          description="There are no interviews scheduled. Start by scheduling interviews from the candidate pipeline."
          actionLabel="Go to Roles"
          onAction={() => navigate('/roles')}
        />
      )}

      {/* Interview Detail Modal with Feedback Integration - Requirements 9.2, 14.5 */}
      {selectedInterview && (
        <InterviewDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          interview={selectedInterview}
          currentUserId={user?.id || ''}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
        />
      )}

      {/* Reschedule Modal - Requirements 8.1, 8.2 */}
      {rescheduleInterview && (
        <RescheduleModal
          isOpen={isRescheduleModalOpen}
          onClose={handleCloseRescheduleModal}
          onSuccess={handleRescheduleSuccess}
          interview={rescheduleInterview}
        />
      )}

      {/* Cancel Confirmation Modal - Requirements 8.4 */}
      {cancelInterview && (
        <CancelConfirmationModal
          isOpen={isCancelModalOpen}
          onClose={handleCloseCancelModal}
          onSuccess={handleCancelSuccess}
          interview={cancelInterview}
        />
      )}
    </Layout>
  );
}

export default InterviewDashboardPage;
