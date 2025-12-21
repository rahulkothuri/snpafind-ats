/**
 * SLA Configuration Section Component
 * Requirements: 10.5
 * 
 * Displays current SLA thresholds per stage and allows editing thresholds.
 */

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { alertsService } from '../services';
import type { UpdateSLAConfigData } from '../services';

interface SLAConfigSectionProps {
  className?: string;
}

interface EditableConfig {
  stageName: string;
  thresholdDays: number;
  isNew?: boolean;
  isModified?: boolean;
}

export function SLAConfigSection({ className = '' }: SLAConfigSectionProps) {
  const [configs, setConfigs] = useState<EditableConfig[]>([]);
  const [defaults, setDefaults] = useState<{ stageName: string; thresholdDays: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newThreshold, setNewThreshold] = useState(5);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch SLA configurations on mount
  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await alertsService.getSLAConfig();
      setConfigs(response.configs.map(c => ({
        stageName: c.stageName,
        thresholdDays: c.thresholdDays,
        isModified: false,
      })));
      setDefaults(response.defaults);
    } catch (err) {
      console.error('Failed to fetch SLA configs:', err);
      setError('Failed to load SLA configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThresholdChange = (stageName: string, value: number) => {
    setConfigs(prev => prev.map(c => 
      c.stageName === stageName 
        ? { ...c, thresholdDays: value, isModified: true }
        : c
    ));
    setSaveSuccess(false);
  };

  const handleAddConfig = () => {
    if (!newStageName.trim()) return;
    
    // Check if stage already exists
    if (configs.some(c => c.stageName.toLowerCase() === newStageName.trim().toLowerCase())) {
      setError('A configuration for this stage already exists');
      return;
    }

    setConfigs(prev => [...prev, {
      stageName: newStageName.trim(),
      thresholdDays: newThreshold,
      isNew: true,
      isModified: true,
    }]);
    setNewStageName('');
    setNewThreshold(5);
    setShowAddForm(false);
    setSaveSuccess(false);
  };

  const handleRemoveConfig = (stageName: string) => {
    setConfigs(prev => prev.filter(c => c.stageName !== stageName));
    setSaveSuccess(false);
  };

  const handleApplyDefaults = async () => {
    try {
      setIsSaving(true);
      setError(null);
      const response = await alertsService.applyDefaultSLAConfig();
      setConfigs(response.configs.map(c => ({
        stageName: c.stageName,
        thresholdDays: c.thresholdDays,
        isModified: false,
      })));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to apply defaults:', err);
      setError('Failed to apply default configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const configsToSave: UpdateSLAConfigData[] = configs.map(c => ({
        stageName: c.stageName,
        thresholdDays: c.thresholdDays,
      }));

      const response = await alertsService.updateSLAConfig(configsToSave);
      setConfigs(response.configs.map(c => ({
        stageName: c.stageName,
        thresholdDays: c.thresholdDays,
        isModified: false,
      })));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save SLA configs:', err);
      setError('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = configs.some(c => c.isModified || c.isNew);

  if (isLoading) {
    return (
      <div className={`flex justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#111827]">SLA Configuration</h3>
          <p className="text-sm text-[#64748b] mt-1">
            Set time thresholds for each pipeline stage. Candidates exceeding these thresholds will trigger alerts.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleApplyDefaults}
          disabled={isSaving}
        >
          Apply Defaults
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-red-500">❌</span>
            <span className="text-sm text-red-700">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Configuration Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Pipeline Stage
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Threshold (Days)
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {configs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-[#64748b]">
                  No SLA configurations set. Click "Apply Defaults" or add custom thresholds.
                </td>
              </tr>
            ) : (
              configs.map((config) => (
                <tr 
                  key={config.stageName}
                  className={config.isModified ? 'bg-[#fef9c3]/30' : ''}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#111827]">{config.stageName}</span>
                      {config.isNew && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-[#dbeafe] text-[#1d4ed8] rounded-full">
                          New
                        </span>
                      )}
                      {config.isModified && !config.isNew && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-[#fef3c7] text-[#92400e] rounded-full">
                          Modified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={config.thresholdDays}
                        onChange={(e) => handleThresholdChange(config.stageName, parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0]/20 focus:border-[#0b6cf0]"
                      />
                      <span className="text-sm text-[#64748b]">days</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRemoveConfig(config.stageName)}
                      className="text-sm text-[#dc2626] hover:text-[#b91c1c] font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Configuration */}
      {showAddForm ? (
        <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
          <h4 className="text-sm font-semibold text-[#111827] mb-3">Add New Stage Threshold</h4>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#64748b] mb-1">
                Stage Name
              </label>
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="e.g., Technical Interview"
                className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0]/20 focus:border-[#0b6cf0]"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-[#64748b] mb-1">
                Threshold (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={newThreshold}
                onChange={(e) => setNewThreshold(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0]/20 focus:border-[#0b6cf0]"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleAddConfig}>
                Add
              </Button>
              <Button variant="secondary" onClick={() => {
                setShowAddForm(false);
                setNewStageName('');
                setNewThreshold(5);
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 text-sm text-[#0b6cf0] hover:text-[#0958c7] font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Custom Stage Threshold
        </button>
      )}

      {/* Default Thresholds Reference */}
      {defaults.length > 0 && (
        <div className="bg-[#f0f9ff] rounded-xl border border-[#bae6fd] p-4">
          <h4 className="text-sm font-semibold text-[#0369a1] mb-2">Default Thresholds Reference</h4>
          <div className="flex flex-wrap gap-3">
            {defaults.map((d) => (
              <span 
                key={d.stageName}
                className="px-3 py-1 text-xs font-medium bg-white text-[#0369a1] rounded-full border border-[#bae6fd]"
              >
                {d.stageName}: {d.thresholdDays} days
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Save Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-[#e2e8f0]">
        <Button 
          variant="primary" 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button 
          variant="secondary" 
          onClick={fetchConfigs}
          disabled={isSaving}
        >
          Reset
        </Button>
        {saveSuccess && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Configuration saved successfully
          </span>
        )}
      </div>
    </div>
  );
}

export default SLAConfigSection;
