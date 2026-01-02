import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertsService } from '../services/alerts.service';
import type { SLABreachAlert, PendingFeedbackAlert, AlertType } from '../services/alerts.service';
import { Badge } from './Badge';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * AlertsPanel Component - Requirements 9.2, 9.5, 10.2, 10.3
 * 
 * Features:
 * - Display SLA breach alerts
 * - Display pending feedback alerts
 * - Show alert age
 * - Navigate to candidate on alert click
 */

export interface AlertsPanelProps {
  /** Filter alerts by type */
  filterType?: AlertType;
  /** Maximum number of alerts to display */
  maxAlerts?: number;
  /** Show compact view */
  compact?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback when alert is clicked */
  onAlertClick?: (alert: SLABreachAlert | PendingFeedbackAlert, type: 'sla' | 'feedback') => void;
}

/**
 * Format alert age for display
 * Requirements: 9.5, 10.3
 */
function formatAlertAge(daysOrHours: number, unit: 'days' | 'hours'): string {
  if (unit === 'hours') {
    if (daysOrHours < 24) {
      return `${daysOrHours}h overdue`;
    }
    const days = Math.floor(daysOrHours / 24);
    return `${days}d overdue`;
  }
  return `${daysOrHours}d overdue`;
}

/**
 * Get severity level based on overdue amount
 */
function getSeverity(daysOverdue: number): 'critical' | 'warning' | 'info' {
  if (daysOverdue >= 7) return 'critical';
  if (daysOverdue >= 3) return 'warning';
  return 'info';
}

export function AlertsPanel({
  filterType = 'all',
  maxAlerts = 10,
  compact = false,
  className = '',
  onAlertClick,
}: AlertsPanelProps) {
  const navigate = useNavigate();
  const [slaBreaches, setSlaBreaches] = useState<SLABreachAlert[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<PendingFeedbackAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'sla' | 'feedback'>('all');

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await alertsService.getAlerts({ type: filterType });
      setSlaBreaches(response.slaBreaches || []);
      setPendingFeedback(response.pendingFeedback || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Handle alert click - navigate to candidate
  // Requirements: 9.3
  const handleAlertClick = (alert: SLABreachAlert | PendingFeedbackAlert, type: 'sla' | 'feedback') => {
    if (onAlertClick) {
      onAlertClick(alert, type);
    } else {
      navigate(`/candidates/${alert.candidateId}`);
    }
  };

  // Filter alerts based on active tab
  const filteredSlaBreaches = activeTab === 'feedback' ? [] : slaBreaches.slice(0, maxAlerts);
  const filteredPendingFeedback = activeTab === 'sla' ? [] : pendingFeedback.slice(0, maxAlerts);

  const totalAlerts = slaBreaches.length + pendingFeedback.length;
  const criticalCount = slaBreaches.filter(a => getSeverity(a.daysOverdue) === 'critical').length;

  // Severity styles - Refined for a cleaner, more aesthetic look
  const severityStyles = {
    critical: {
      bg: 'bg-gradient-to-r from-rose-50/80 to-white',
      border: 'border-l-4 border-l-rose-400 border-y border-r border-y-gray-100 border-r-gray-100',
      icon: '!',
      iconBg: 'bg-rose-100 text-rose-600',
      text: 'text-gray-800',
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-50/60 to-white',
      border: 'border-l-4 border-l-amber-400 border-y border-r border-y-gray-100 border-r-gray-100',
      icon: '!',
      iconBg: 'bg-amber-100 text-amber-600',
      text: 'text-gray-800',
    },
    info: {
      bg: 'bg-gradient-to-r from-sky-50/60 to-white',
      border: 'border-l-4 border-l-sky-400 border-y border-r border-y-gray-100 border-r-gray-100',
      icon: 'i',
      iconBg: 'bg-sky-100 text-sky-600',
      text: 'text-gray-800',
    },
  };

  if (compact) {
    return (
      <div className={`bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#111827]">
            Alerts
            {totalAlerts > 0 && (
              <span className="ml-2 text-xs font-normal text-[#64748b]">
                ({totalAlerts})
              </span>
            )}
          </h3>
          {criticalCount > 0 && (
            <Badge text={`${criticalCount} critical`} variant="red" />
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-[#64748b] text-sm">
            <p>{error}</p>
            <button
              onClick={fetchAlerts}
              className="mt-1 text-[#0b6cf0] hover:text-[#0952b8] text-xs"
            >
              Try again
            </button>
          </div>
        ) : totalAlerts === 0 ? (
          <div className="text-center py-4 text-[#64748b] text-sm">
            <span className="text-2xl block mb-1">✓</span>
            No alerts
          </div>
        ) : (
          <div className="space-y-2 pb-3">
            {filteredSlaBreaches.slice(0, maxAlerts).map((alert) => {
              const severity = getSeverity(alert.daysOverdue);
              const style = severityStyles[severity];
              return (
                <button
                  key={alert.id}
                  onClick={() => handleAlertClick(alert, 'sla')}
                  className={`w-full text-left p-2.5 rounded-lg ${style.bg} ${style.border} hover:shadow-sm transition-all duration-200`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${style.iconBg}`}>{style.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${style.text} truncate`}>
                        {alert.candidateName}
                      </p>
                      <p className="text-[10px] text-[#64748b] truncate">
                        {alert.stageName} • {formatAlertAge(alert.daysOverdue, 'days')}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
            {totalAlerts > maxAlerts && (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full text-center text-xs text-[#0b6cf0] hover:text-[#0952b8] py-1"
              >
                View all {totalAlerts} alerts
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-[#e2e8f0] shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#111827]">Alerts</h3>
          {totalAlerts > 0 && (
            <span className="bg-[#f1f5f9] text-[#64748b] text-xs px-2 py-0.5 rounded-full">
              {totalAlerts}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchAlerts}>
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e2e8f0]">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'all'
            ? 'text-[#0b6cf0] border-b-2 border-[#0b6cf0]'
            : 'text-[#64748b] hover:text-[#374151]'
            }`}
        >
          All ({totalAlerts})
        </button>
        <button
          onClick={() => setActiveTab('sla')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'sla'
            ? 'text-[#0b6cf0] border-b-2 border-[#0b6cf0]'
            : 'text-[#64748b] hover:text-[#374151]'
            }`}
        >
          SLA Breaches ({slaBreaches.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'feedback'
            ? 'text-[#0b6cf0] border-b-2 border-[#0b6cf0]'
            : 'text-[#64748b] hover:text-[#374151]'
            }`}
        >
          Pending Feedback ({pendingFeedback.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-[#64748b]">
            <p>{error}</p>
            <button
              onClick={fetchAlerts}
              className="mt-2 text-sm text-[#0b6cf0] hover:text-[#0952b8]"
            >
              Try again
            </button>
          </div>
        ) : totalAlerts === 0 ? (
          <div className="text-center py-8 text-[#64748b]">
            <span className="text-4xl block mb-2">✓</span>
            <p className="font-medium">No alerts</p>
            <p className="text-sm mt-1">All candidates are within SLA thresholds</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {/* SLA Breach Alerts */}
            {filteredSlaBreaches.map((alert) => {
              const severity = getSeverity(alert.daysOverdue);
              const style = severityStyles[severity];
              return (
                <button
                  key={alert.id}
                  onClick={() => handleAlertClick(alert, 'sla')}
                  className={`w-full text-left p-3.5 rounded-xl ${style.bg} ${style.border} hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`}
                  aria-label={`SLA breach alert for ${alert.candidateName}, ${alert.daysOverdue} days overdue in ${alert.stageName}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${style.iconBg}`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium ${style.text} truncate`}>
                          {alert.candidateName}
                        </p>
                        <Badge
                          text={formatAlertAge(alert.daysOverdue, 'days')}
                          variant={severity === 'critical' ? 'red' : severity === 'warning' ? 'orange' : 'blue'}
                        />
                      </div>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        Stuck in <span className="font-medium">{alert.stageName}</span> for {alert.daysInStage} days
                      </p>
                      <p className="text-xs text-[#94a3b8] mt-0.5 truncate">
                        {alert.jobTitle}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Pending Feedback Alerts */}
            {filteredPendingFeedback.map((alert) => (
              <button
                key={alert.id}
                onClick={() => handleAlertClick(alert, 'feedback')}
                className="w-full text-left p-3.5 rounded-xl bg-gradient-to-r from-violet-50/60 to-white border-l-4 border-l-violet-400 border-y border-r border-y-gray-100 border-r-gray-100 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                aria-label={`Pending feedback alert for ${alert.candidateName}, ${alert.hoursOverdue} hours overdue`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-violet-100 text-violet-600">
                    ✎
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {alert.candidateName}
                      </p>
                      <Badge
                        text={formatAlertAge(alert.hoursOverdue, 'hours')}
                        variant="blue"
                      />
                    </div>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      {alert.interviewType} feedback pending from {alert.interviewerName}
                    </p>
                    <p className="text-xs text-[#94a3b8] mt-0.5 truncate">
                      {alert.jobTitle}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {/* Show more link if there are more alerts */}
            {(slaBreaches.length > maxAlerts || pendingFeedback.length > maxAlerts) && (
              <div className="text-center pt-2">
                <button className="text-xs text-[#0b6cf0] hover:text-[#0952b8]">
                  View all alerts
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertsPanel;
