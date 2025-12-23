/**
 * PanelLoadChart Component
 * 
 * Displays a bar chart showing interviews per panel member with:
 * - Bar chart visualization
 * - Time period selector (week/month)
 * - Highlight high/low load
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */

import { useState } from 'react';
import type { PanelLoad } from '../services/interviews.service';

export interface PanelLoadChartProps {
  data: PanelLoad[];
  isLoading?: boolean;
  onPeriodChange?: (period: 'week' | 'month') => void;
  onPanelMemberClick?: (userId: string) => void;
  initialPeriod?: 'week' | 'month';
}

// Get load level based on interview count relative to average
function getLoadLevel(count: number, average: number): 'high' | 'normal' | 'low' {
  if (average === 0) return 'normal';
  const ratio = count / average;
  if (ratio >= 1.5) return 'high';
  if (ratio <= 0.5) return 'low';
  return 'normal';
}

// Get bar color based on load level
function getBarColor(level: 'high' | 'normal' | 'low'): string {
  switch (level) {
    case 'high':
      return 'bg-[#ef4444]'; // Red for high load
    case 'low':
      return 'bg-[#22c55e]'; // Green for low load
    default:
      return 'bg-[#0b6cf0]'; // Blue for normal
  }
}

// Get load badge styles
function getLoadBadgeStyles(level: 'high' | 'normal' | 'low'): string {
  switch (level) {
    case 'high':
      return 'bg-[#fee2e2] text-[#991b1b]';
    case 'low':
      return 'bg-[#dcfce7] text-[#166534]';
    default:
      return 'bg-[#f3f4f6] text-[#374151]';
  }
}

export function PanelLoadChart({
  data,
  isLoading = false,
  onPeriodChange,
  onPanelMemberClick,
  initialPeriod = 'week',
}: PanelLoadChartProps) {
  const [period, setPeriod] = useState<'week' | 'month'>(initialPeriod);

  // Calculate max count for scaling
  const maxCount = Math.max(...data.map(d => d.interviewCount), 1);
  
  // Calculate average
  const totalInterviews = data.reduce((sum, d) => sum + d.interviewCount, 0);
  const averageLoad = data.length > 0 ? totalInterviews / data.length : 0;

  const handlePeriodChange = (newPeriod: 'week' | 'month') => {
    setPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-[#e2e8f0] rounded animate-pulse" />
          <div className="h-8 w-40 bg-[#e2e8f0] rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-24 h-4 bg-[#e2e8f0] rounded animate-pulse" />
              <div className="flex-1 h-6 bg-[#e2e8f0] rounded animate-pulse" />
              <div className="w-8 h-4 bg-[#e2e8f0] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      {/* Header with title and period selector */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#111827]">Panel Load Distribution</h3>
          <p className="text-xs text-[#64748b]">
            Avg: {averageLoad.toFixed(1)} interviews/{period === 'week' ? 'week' : 'month'}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
          <button
            onClick={() => handlePeriodChange('week')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              period === 'week'
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#64748b] hover:text-[#374151]'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => handlePeriodChange('month')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              period === 'month'
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#64748b] hover:text-[#374151]'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Empty state */}
      {data.length === 0 && (
        <div className="text-center py-8 text-sm text-[#64748b]">
          No panel load data available
        </div>
      )}

      {/* Bar chart */}
      {data.length > 0 && (
        <div className="space-y-3">
          {data.map((member) => {
            const loadLevel = getLoadLevel(member.interviewCount, averageLoad);
            const barWidth = (member.interviewCount / maxCount) * 100;
            
            return (
              <div
                key={member.userId}
                className={`flex items-center gap-3 ${
                  onPanelMemberClick ? 'cursor-pointer hover:bg-[#f8fafc] -mx-2 px-2 py-1 rounded-lg transition-colors' : ''
                }`}
                onClick={() => onPanelMemberClick?.(member.userId)}
              >
                {/* Name */}
                <div className="w-28 flex-shrink-0">
                  <div className="text-sm font-medium text-[#374151] truncate" title={member.userName}>
                    {member.userName}
                  </div>
                  <div className="text-[10px] text-[#94a3b8] truncate" title={member.userEmail}>
                    {member.userEmail}
                  </div>
                </div>

                {/* Bar */}
                <div className="flex-1 h-6 bg-[#f1f5f9] rounded overflow-hidden">
                  <div
                    className={`h-full ${getBarColor(loadLevel)} rounded transition-all duration-300`}
                    style={{ width: `${Math.max(barWidth, 2)}%` }}
                  />
                </div>

                {/* Count and load indicator */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-medium text-[#374151] w-6 text-right">
                    {member.interviewCount}
                  </span>
                  {loadLevel !== 'normal' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${getLoadBadgeStyles(loadLevel)}`}>
                      {loadLevel === 'high' ? 'High' : 'Low'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {data.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-[#e2e8f0]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#ef4444]" />
            <span className="text-[10px] text-[#64748b]">High Load (≥150%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#0b6cf0]" />
            <span className="text-[10px] text-[#64748b]">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#22c55e]" />
            <span className="text-[10px] text-[#64748b]">Low Load (≤50%)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PanelLoadChart;
