// Layout Components
export { Sidebar } from './Sidebar';
export { Header } from './Header';
export { Footer } from './Footer';
export { Layout } from './Layout';

// Shared UI Components
export { Badge } from './Badge';
export { Button } from './Button';
export { KPICard } from './KPICard';
export { Table, Pagination } from './Table';
export type { Column } from './Table';
export { EnhancedCandidateCard } from './EnhancedCandidateCard';
export { PaginationControls } from './PaginationControls';

// Bulk Actions Components - Requirements 1.1, 1.2, 1.3
export { BulkActionsToolbar } from './BulkActionsToolbar';
export type { BulkActionsToolbarProps, BulkMoveResult } from './BulkActionsToolbar';

// Loading, Error, and Empty State Components - Requirements 23.1, 23.2, 23.3, 23.4
export { LoadingSpinner } from './LoadingSpinner';
export { LoadingOverlay } from './LoadingOverlay';
export { ErrorMessage } from './ErrorMessage';
export { EmptyState } from './EmptyState';
export { Skeleton, KPICardSkeleton, TableRowSkeleton, CardSkeleton } from './Skeleton';

// Detail Panel Components
export { 
  DetailPanel,
  DetailSection,
  SummaryRow,
  CVSection,
  SkillsTags,
  Timeline,
  NotesSection,
  ActionsSection,
} from './DetailPanel';

// Job Form Components
export { MandatoryCriteriaSection, MANDATORY_CRITERIA_CONTENT } from './MandatoryCriteriaSection';
export { PipelineStageConfigurator, DEFAULT_PIPELINE_STAGES } from './PipelineStageConfigurator';
export { MultiSelect } from './MultiSelect';
export type { MultiSelectOption, MultiSelectProps } from './MultiSelect';
export { JobShareModal } from './JobShareModal';
export { JobDetailsPanel } from './JobDetailsPanel';
export type { JobDetailsPanelProps } from './JobDetailsPanel';
export { JobDescriptionModal } from './JobDescriptionModal';
export type { JobDescriptionModalProps } from './JobDescriptionModal';
export { StageImportModal } from './StageImportModal';
export type { StageImportModalProps } from './StageImportModal';

// Route Protection Components
export { JobProtectedRoute } from './JobProtectedRoute';
export { RoleProtectedRoute } from './RoleProtectedRoute';

// Search and Filter Components - Requirements 1.1, 2.1, 3.1
export { SearchInput } from './SearchInput';
export type { SearchInputProps } from './SearchInput';
export { StatusToggle } from './StatusToggle';
export type { StatusToggleProps } from './StatusToggle';

// Split Panel Components - Requirements 5.1, 5.2
export { RolesLeftPanel } from './RolesLeftPanel';
export type { RolesLeftPanelProps, Role as RolesLeftPanelRole } from './RolesLeftPanel';
export { JobDetailsRightPanel } from './JobDetailsRightPanel';
export type { JobDetailsRightPanelProps, PipelineCandidate, ViewMode, StageCount } from './JobDetailsRightPanel';

// Pipeline Stage Components - Requirements 4.1, 4.5
export { PipelineStageCard } from './PipelineStageCard';
export type { PipelineStageCardProps, StageMetric } from './PipelineStageCard';

// Advanced Filters Component - Requirements 4.3
export { AdvancedFilters } from './AdvancedFilters';
export type { AdvancedFiltersProps, AdvancedFiltersState } from './AdvancedFilters';

// Candidate Notes Section Component - Requirements 6.1, 6.2, 6.3
export { CandidateNotesSection } from './NotesSection';
export type { CandidateNotesSectionProps } from './NotesSection';

// Candidate Attachments Section Component - Requirements 6.4, 6.5
export { CandidateAttachmentsSection, validateAttachment } from './AttachmentsSection';
export type { CandidateAttachmentsSectionProps } from './AttachmentsSection';

// Candidate Tags Section Component - Requirements 7.1, 7.2
export { CandidateTagsSection } from './TagsSection';
export type { CandidateTagsSectionProps } from './TagsSection';

// Notification Components - Requirements 8.2, 8.3, 8.4, 8.5
export { NotificationBell } from './NotificationBell';
export type { NotificationBellProps } from './NotificationBell';

// Alerts Panel Component - Requirements 9.2, 9.5, 10.2, 10.3
export { AlertsPanel } from './AlertsPanel';
export type { AlertsPanelProps } from './AlertsPanel';

// SLA Configuration Component - Requirements 10.5
export { SLAConfigSection } from './SLAConfigSection';
export type { default as SLAConfigSectionDefault } from './SLAConfigSection';
