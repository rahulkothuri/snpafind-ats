/**
 * SLA Configuration Section Component
 * Requirements: 10.5
 * 
 * Displays current SLA thresholds per stage and allows editing thresholds.
 * - Apply: Saves the current settings for this company
 * - Make it Default: Updates the system default settings with current values
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
  const [savedConfigs, setSavedConfigs] = useState<EditableConfig[]>([]);
  const [defaults, setDefaults] = useState<{ stageName: string; thresholdDays: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isMakingDefault, setIsMakingDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [newThreshold, setNewThreshold] = useState(5);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Clear success message after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await alertsService.getSLAConfig();
      const loadedConfigs = response.configs.map(c => ({
        stageName: c.stageName,
        thresholdDays: c.thresholdDays,
        isModified: false,
      }));
      setConfigs(loadedConfigs);
      setSavedConfigs(loadedConfigs);
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
    setSuccessMessage(null);
  };

  const handleAddConfig = () => {
    if (!newStageName.trim()) return;
    
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
    setSuccessMessage(null);
  };

  const handleRemoveConfig = (stageName: string) => {
    setConfigs(prev => prev.filter(c => c.stageName !== stageName));
    setSuccessMessage(null);
  };

  const handleLoadSystemDefaults = () => {
    setConfigs(defaults.map(d => ({
      stageName: d.stageName,
      thresholdDays: d.thresholdDays,
      isModified: true,
    })));
    setSuccessMessage(null);
  };

  const handleResetToSaved = () => {
    setConfigs(savedConfigs.map(c => ({ ...c, isModified: false })));
    setSuccessMessage(null);
    setError(null);
  };

  // Apply: Save current settings for this company
  const handleApply = async () => {
    try {
      setIsApplying(true);
      setError(null);
      
      const configsToSave: UpdateSLAConfigData[] = configs.map(c => ({
        stageName: c.stageName,
        thresholdDays: c.thresholdDays,
      }));

      const response = await alertsService.updateSLAConfig(configsToSave);
      const newSavedConfigs = response.configs.map(c => ({
        stageName: c.stageName,
        thresholdDays: c.thresholdDays,
        isModified: false,
      }));
      setConfigs(newSavedConfigs);
      setSavedConfigs(newSavedConfigs);
      setSuccessMessage('SLA settings applied successfully! These thresholds are now active for your company.');
    } catch (err) {
      console.error('Failed to apply SLA configs:', err);
      setError('Failed to apply configuration');
    } finally {
      setIsApplying(false);
    }
  };

  // Make it Default: Update system defaults with current values
  const handleMakeDefault = async () => {
    try {
      setIsMakingDefault(true);
      setError(null);
      
      const configsToSave: UpdateSLAConfigData[] = configs.map(c => ({
        stageName: c.stageName,
        thresholdDays: c.thresholdDays,
      }));

      const response = await alertsService.updateSystemDefaults(configsToSave);
      setDefaults(response.defaults);
      setSuccessMessage('System defaults updated! These thresholds will now be the default for all new configurations.');
    } catch (err) {
      console.error('Failed to update system defaults:', err);
      setError('Failed to update system defaults');
    } finally {
      setIsMakingDefault(false);
    }
  };

  const hasChanges = configs.some(c => c.isModified || c.isNew) || 
    configs.length !== savedConfigs.length ||
    configs.some((c, i) => savedConfigs[i]?.stageName !== c.stageName || savedConfigs[i]?.thresholdDays !== c.thresholdDays);

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
      <div>
        <p className="text-sm text-gray-500 mt-1">
          Configure time thresholds for pipeline stages. Use <strong>Apply</strong> to save for your company, 
          or <strong>Make it Default</strong> to update system-wide defaults.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <span className="text-sm text-red-700">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>You have unsaved changes</span>
        </div>
      )}

      {/* Configuration Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Pipeline Stage
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Threshold (Days)
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {configs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <div className="text-gray-400 mb-3">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-4">No SLA thresholds configured yet</p>
                  <Button variant="secondary" onClick={handleLoadSystemDefaults}>
                    Load System Defaults
                  </Button>
                </td>
              </tr>
            ) : (
              configs.map((config) => (
                <tr 
                  key={config.stageName}
                  className={`${config.isModified ? 'bg-amber-50/50' : ''} hover:bg-gray-50 transition-colors`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{config.stageName}</span>
                      {config.isNew && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">New</span>
                      )}
                      {config.isModified && !config.isNew && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Modified</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={config.thresholdDays}
                        onChange={(e) => handleThresholdChange(config.stageName, parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <span className="text-sm text-gray-500">days</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRemoveConfig(config.stageName)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
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
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Add New Stage Threshold</h4>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Stage Name</label>
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="e.g., Technical Interview"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Threshold (Days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={newThreshold}
                onChange={(e) => setNewThreshold(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleAddConfig}>Add</Button>
              <Button variant="secondary" onClick={() => { setShowAddForm(false); setNewStageName(''); setNewThreshold(5); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Custom Stage Threshold
        </button>
      )}

      {/* System Defaults Reference */}
      {defaults.length > 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-blue-800">Current System Defaults</h4>
            <button onClick={handleLoadSystemDefaults} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Load these defaults →
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {defaults.map((d) => (
              <span key={d.stageName} className="px-3 py-1.5 text-xs font-medium bg-white text-blue-700 rounded-full border border-blue-200">
                {d.stageName}: {d.thresholdDays} days
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          {/* Apply Button - Save for this company */}
          <Button 
            variant="primary" 
            onClick={handleApply} 
            disabled={isApplying || isMakingDefault || !hasChanges}
          >
            {isApplying ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Applying...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply
              </span>
            )}
          </Button>
          
          {/* Make it Default Button - Update system defaults */}
          <Button 
            variant="secondary"
            onClick={handleMakeDefault} 
            disabled={isApplying || isMakingDefault || configs.length === 0}
            className="!border-purple-300 !text-purple-700 hover:!bg-purple-50"
          >
            {isMakingDefault ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Updating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Make it Default
              </span>
            )}
          </Button>
          
          {hasChanges && (
            <Button variant="secondary" onClick={handleResetToSaved} disabled={isApplying || isMakingDefault}>
              Reset
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-400 text-right">
          <p><strong>Apply:</strong> Save settings for your company</p>
          <p><strong>Make it Default:</strong> Update system-wide defaults</p>
        </div>
      </div>
    </div>
  );
}

export default SLAConfigSection;
