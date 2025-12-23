import { useEffect, useRef } from 'react';

/**
 * DetailPanel Component - Requirements 5.3, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 18.10
 * 
 * Features:
 * - Slides in from right side (300-320px width)
 * - Header with title, subtitle, and close button - Blue gradient header
 * - Summary section with label-value pairs
 * - CV section with dashed border
 * - Skills & Tags section with rounded pills
 * - Timeline section with vertical line
 * - Notes section with textarea
 * - Actions section with buttons
 * - Shadow on left edge for overlay effect
 * - Blue and white theme design
 * - Section headers and dividers styled consistently
 */

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onMoreInfo?: () => void;  // Optional callback for More Info button navigation
}

export function DetailPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  onMoreInfo,
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
          fixed inset-0 bg-black/30 z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Panel - Blue and White Theme */}
      <aside
        ref={panelRef}
        className={`
          fixed top-0 right-0 h-full w-[var(--detail-panel-width)] z-50
          bg-white
          shadow-[-8px_0_30px_rgba(11,108,240,0.15)]
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header - Blue gradient background */}
        <div className="flex items-start justify-between p-4 bg-gradient-to-r from-[#0b6cf0] to-[#3b82f6] text-white">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-white truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-blue-100 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-3">
            {onMoreInfo && (
              <button
                onClick={onMoreInfo}
                className="px-3 py-1.5 text-xs font-semibold text-[#0b6cf0] bg-white hover:bg-blue-50 rounded-lg transition-colors"
              >
                More Info
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - White background with subtle blue accents */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
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
 * Blue and white theme styling
 */
export function DetailSection({ title, children, className = '' }: SectionProps) {
  return (
    <div className={`p-4 border-b border-[#e2e8f0] bg-white ${className}`}>
      <h3 className="text-xs font-semibold text-[#0b6cf0] uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-1 h-4 bg-[#0b6cf0] rounded-full"></span>
        {title}
      </h3>
      {children}
    </div>
  );
}

// Summary row - Requirement 18.2 - Blue/white theme
interface SummaryRowProps {
  label: string;
  value: string | React.ReactNode;
}

export function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex justify-between py-2 text-sm border-b border-[#f1f5f9] last:border-b-0">
      <span className="text-[#64748b]">{label}</span>
      <span className="text-[#1e293b] font-medium">{value}</span>
    </div>
  );
}

// CV Section - Requirement 18.3 - Blue/white theme
interface CVSectionProps {
  filename: string;
  onView: () => void;
}

export function CVSection({ filename, onView }: CVSectionProps) {
  return (
    <div className="border-2 border-dashed border-[#bfdbfe] rounded-lg p-4 flex items-center justify-between bg-[#eff6ff]">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-[#0b6cf0] flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-sm text-[#1e293b] font-medium truncate">{filename}</span>
      </div>
      <button
        onClick={onView}
        className="px-4 py-2 text-xs font-semibold text-white bg-[#0b6cf0] hover:bg-[#0956c4] rounded-lg transition-colors shadow-sm"
      >
        View CV
      </button>
    </div>
  );
}

// Skills Tags - Requirement 18.4 - Blue/white theme
interface SkillsTagsProps {
  skills: string[];
}

export function SkillsTags({ skills }: SkillsTagsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="px-3 py-1.5 bg-[#dbeafe] text-[#1d4ed8] text-xs font-medium rounded-full border border-[#bfdbfe]"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

// Timeline - Requirement 18.5 - Blue/white theme
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
    <div className="relative pl-5">
      {/* Vertical line - Blue gradient */}
      <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#0b6cf0] to-[#93c5fd]" />
      
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="relative">
            {/* Dot - Blue with white border */}
            <div className="absolute -left-3.5 top-1 w-3 h-3 rounded-full bg-[#0b6cf0] border-2 border-white shadow-sm" />
            
            <div className="text-xs bg-[#f8fafc] rounded-lg p-2 border border-[#e2e8f0]">
              <span className="text-[#0b6cf0] font-medium">{entry.date}</span>
              <p className="text-[#374151] mt-1">{entry.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Notes Section - Requirement 18.6, 18.8 - Blue/white theme
interface NotesSectionProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  saving?: boolean;
}

export function NotesSection({ value, onChange, onSave, saving = false }: NotesSectionProps) {
  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add a note for this candidate..."
        className="w-full h-24 resize-none px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#0b6cf0] focus:ring-2 focus:ring-[#0b6cf0]/20 bg-white placeholder-[#94a3b8]"
      />
      <button
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 text-xs font-semibold bg-[#0b6cf0] text-white rounded-lg hover:bg-[#0956c4] disabled:opacity-50 transition-colors shadow-sm"
      >
        {saving ? 'Saving...' : 'Save note'}
      </button>
    </div>
  );
}

// Actions Section - Requirement 18.7 - Blue/white theme
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
        return 'bg-[#0b6cf0] text-white hover:bg-[#0956c4] shadow-sm';
      case 'danger':
        return 'bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2] border border-[#fecaca]';
      default:
        return 'bg-white text-[#374151] hover:bg-[#f1f5f9] border border-[#e2e8f0]';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${getButtonStyle(action.variant)}`}
          >
            {action.label}
          </button>
        ))}
      </div>
      {lastUpdated && (
        <div className="flex items-center gap-2 text-[10px] text-[#64748b]">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last updated: {lastUpdated}
        </div>
      )}
    </div>
  );
}

export default DetailPanel;
