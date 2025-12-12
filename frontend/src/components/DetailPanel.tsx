import { useEffect, useRef } from 'react';

/**
 * DetailPanel Component - Requirements 5.3, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 18.10
 * 
 * Features:
 * - Slides in from right side (300-320px width)
 * - Header with title, subtitle, and close button
 * - Summary section with label-value pairs
 * - CV section with dashed border
 * - Skills & Tags section with rounded pills
 * - Timeline section with vertical line
 * - Notes section with textarea
 * - Actions section with buttons
 * - Shadow on left edge for overlay effect
 * - White background with subtle shadow (light theme)
 * - Section headers and dividers styled consistently
 */

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function DetailPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`
          fixed inset-0 bg-black/20 z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Panel - Requirements 5.3, 18.1, 18.9, 18.10 */}
      {/* White background with shadow - light theme styling */}
      <aside
        ref={panelRef}
        className={`
          fixed top-0 right-0 h-full w-[var(--detail-panel-width)] z-50
          bg-[var(--color-bg-white)]
          shadow-[var(--shadow-panel)]
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header - Requirement 18.1 */}
        {/* White background with bottom border divider */}
        <div className="flex items-start justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-white)]">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-[var(--color-text-secondary)] truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-gray)] rounded-md transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Light background for scrollable area */}
        <div className="flex-1 overflow-y-auto bg-[var(--color-bg-white)]">
          {children}
        </div>
      </aside>
    </>
  );
}

// Sub-components for DetailPanel sections

interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * DetailSection - Section container with header and divider
 * Requirement 5.3: Form sections with section headers and subtle dividers
 */
export function DetailSection({ title, children, className = '' }: SectionProps) {
  return (
    <div className={`p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-white)] ${className}`}>
      <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

// Summary row - Requirement 18.2
interface SummaryRowProps {
  label: string;
  value: string | React.ReactNode;
}

export function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-[var(--color-text-primary)] font-medium">{value}</span>
    </div>
  );
}

// CV Section - Requirement 18.3
interface CVSectionProps {
  filename: string;
  onView: () => void;
}

export function CVSection({ filename, onView }: CVSectionProps) {
  return (
    <div className="border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-md)] p-4 flex items-center justify-between bg-[var(--color-bg-white)]">
      <div className="flex items-center gap-2 min-w-0">
        <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm text-[var(--color-text-primary)] truncate">{filename}</span>
      </div>
      <button
        onClick={onView}
        className="px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] rounded-[var(--radius-md)] transition-colors"
      >
        View CV
      </button>
    </div>
  );
}

// Skills Tags - Requirement 18.4
interface SkillsTagsProps {
  skills: string[];
}

export function SkillsTags({ skills }: SkillsTagsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <span
          key={skill}
          className="px-2.5 py-1 bg-[var(--color-bg-gray)] text-[var(--color-sidebar-text)] text-xs rounded-full border border-[var(--color-border)]"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

// Timeline - Requirement 18.5
interface TimelineEntry {
  id: string;
  date: string;
  description: string;
}

interface TimelineProps {
  entries: TimelineEntry[];
}

export function Timeline({ entries }: TimelineProps) {
  return (
    <div className="relative pl-4">
      {/* Vertical line */}
      <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-[var(--color-border)]" />
      
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="relative">
            {/* Dot - Primary blue color */}
            <div className="absolute -left-2.5 top-1.5 w-2 h-2 rounded-full bg-[var(--color-primary)]" />
            
            <div className="text-xs">
              <span className="text-[var(--color-text-muted)]">{entry.date}</span>
              <p className="text-[var(--color-text-primary)] mt-0.5">{entry.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Notes Section - Requirement 18.6, 18.8
interface NotesSectionProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  saving?: boolean;
}

export function NotesSection({ value, onChange, onSave, saving = false }: NotesSectionProps) {
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add a note for this candidate..."
        className="form-textarea h-24 resize-none"
      />
      <button
        onClick={onSave}
        disabled={saving}
        className="px-3 py-1.5 text-xs font-medium bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving...' : 'Save note'}
      </button>
    </div>
  );
}

// Actions Section - Requirement 18.7
interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface ActionsSectionProps {
  actions: ActionButton[];
  lastUpdated?: string;
}

export function ActionsSection({ actions, lastUpdated }: ActionsSectionProps) {
  const getButtonStyle = (variant: ActionButton['variant'] = 'secondary') => {
    switch (variant) {
      case 'primary':
        return 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]';
      case 'danger':
        return 'bg-[var(--color-badge-red-bg)] text-[var(--color-badge-red-text)] hover:opacity-90 border border-[var(--color-badge-red-bg)]';
      default:
        return 'bg-[var(--color-bg-gray)] text-[var(--color-sidebar-text)] hover:bg-[var(--color-bg-input)] border border-[var(--color-border)]';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] transition-colors ${getButtonStyle(action.variant)}`}
          >
            {action.label}
          </button>
        ))}
      </div>
      {lastUpdated && (
        <span className="inline-block px-2 py-1 text-[10px] text-[var(--color-text-secondary)] bg-[var(--color-bg-gray)] rounded-full">
          Last updated: {lastUpdated}
        </span>
      )}
    </div>
  );
}

export default DetailPanel;
