/**
 * Pipeline Stage Constants - Requirements 5.1, 5.2, 5.5
 * 
 * Centralized constants for pipeline stages including the Selected stage.
 * These constants are used across the application for consistent stage handling.
 */

/**
 * Default pipeline stages in order - Requirements 5.1, 5.2, 6.1, 6.2
 * Order: Queue → Applied → Screening → Shortlist → Interview → Selected → Offered → Hired → Rejected
 */
export const DEFAULT_PIPELINE_STAGES = [
  'Queue',
  'Applied',
  'Screening',
  'Shortlisted',   // Changed from 'Shortlist' - Requirements 6.1
  'Interview',
  'Selected',
  'Offered',     // Changed from 'Offer' - Requirements 6.2
  'Hired',
  'Rejected'
] as const;

export type PipelineStageName = typeof DEFAULT_PIPELINE_STAGES[number];

/**
 * Stage colors for visual styling - Requirements 5.5, 6.3
 * Each stage has background, text, indicator, and border colors
 */
export const STAGE_COLORS: Record<string, { 
  bg: string; 
  text: string; 
  indicator: string;
  border?: string;
}> = {
  'Queue': { 
    bg: 'bg-[#f1f5f9]', 
    text: 'text-[#475569]', 
    indicator: 'bg-[#94a3b8]',
    border: 'border-[#e2e8f0]'
  },
  'Applied': { 
    bg: 'bg-[#e0f2fe]', 
    text: 'text-[#0369a1]', 
    indicator: 'bg-[#0ea5e9]',
    border: 'border-[#bae6fd]'
  },
  'Screening': { 
    bg: 'bg-[#fef3c7]', 
    text: 'text-[#92400e]', 
    indicator: 'bg-[#f59e0b]',
    border: 'border-[#fde68a]'
  },
  'Shortlisted': {  // Changed from 'Shortlist' - Requirements 6.3
    bg: 'bg-[#dcfce7]', 
    text: 'text-[#166534]', 
    indicator: 'bg-[#22c55e]',
    border: 'border-[#bbf7d0]'
  },
  'Interview': { 
    bg: 'bg-[#e0e7ff]', 
    text: 'text-[#4338ca]', 
    indicator: 'bg-[#6366f1]',
    border: 'border-[#c7d2fe]'
  },
  'Selected': { 
    bg: 'bg-[#fce7f3]', 
    text: 'text-[#be185d]', 
    indicator: 'bg-[#ec4899]',
    border: 'border-[#fbcfe8]'
  },
  'Offered': {  // Changed from 'Offer' - Requirements 6.3
    bg: 'bg-[#f5f3ff]', 
    text: 'text-[#6d28d9]', 
    indicator: 'bg-[#8b5cf6]',
    border: 'border-[#ddd6fe]'
  },
  'Hired': { 
    bg: 'bg-[#d1fae5]', 
    text: 'text-[#047857]', 
    indicator: 'bg-[#10b981]',
    border: 'border-[#a7f3d0]'
  },
  'Rejected': { 
    bg: 'bg-[#fee2e2]', 
    text: 'text-[#b91c1c]', 
    indicator: 'bg-[#ef4444]',
    border: 'border-[#fecaca]'
  },
};

/**
 * Get stage color configuration with fallback
 * @param stageName - The name of the stage
 * @returns Stage color configuration
 */
export function getStageColors(stageName: string): { 
  bg: string; 
  text: string; 
  indicator: string;
  border: string;
} {
  const colors = STAGE_COLORS[stageName];
  if (colors) {
    return {
      bg: colors.bg,
      text: colors.text,
      indicator: colors.indicator,
      border: colors.border || 'border-[#e2e8f0]'
    };
  }
  // Default fallback colors
  return { 
    bg: 'bg-[#dbeafe]', 
    text: 'text-[#1d4ed8]', 
    indicator: 'bg-[#94a3b8]',
    border: 'border-[#e2e8f0]'
  };
}

/**
 * Get stage indicator color
 * @param stageName - The name of the stage
 * @returns CSS class for the indicator color
 */
export function getStageIndicatorColor(stageName: string): string {
  return STAGE_COLORS[stageName]?.indicator || 'bg-[#94a3b8]';
}

/**
 * Check if a stage name is valid
 * @param stageName - The name to check
 * @returns True if the stage name is valid
 */
export function isValidStageName(stageName: string): stageName is PipelineStageName {
  return DEFAULT_PIPELINE_STAGES.includes(stageName as PipelineStageName);
}
