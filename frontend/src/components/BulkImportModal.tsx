/**
 * BulkImportModal Component
 * 
 * Modal interface for bulk importing candidates from CSV/Excel files.
 */

import { useState, useRef } from 'react';
import api from '../services/api';

export interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  onSuccess: () => void;
}

interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  failures?: {
    email: string;
    name?: string;
    error: string;
  }[];
  invitationsSent: number;
  invitationsFailed: number;
}

export function BulkImportModal({ isOpen, onClose, jobId, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sendEmails, setSendEmails] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setSendEmails(true);
    setIsUploading(false);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sendEmails', String(sendEmails));

    try {
      // Use api.postForm to automatically handle multipart/form-data headers and boundaries
      const response = await api.postForm(`/jobs/${jobId}/bulk-import`, formData);

      setResult(response.data);
      if (response.data.success || response.data.importedCount > 0) {
        // Delay success callback slightly or call it immediately depending on UX preference
        // Maybe don't close immediately so they can see the result
        onSuccess();
      }
    } catch (err: any) {
      console.error('Bulk import failed:', err);
      console.error('Error response:', err.response?.data);
      const errorData = err.response?.data;
      let errorMessage = errorData?.message || 'Failed to import candidates. Please check your file and try again.';
      // Include details if present (e.g., validation errors)
      if (errorData?.details) {
        const detailsStr = Object.entries(errorData.details)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('; ');
        errorMessage += ` Details: ${detailsStr}`;
      }
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Bulk Import Candidates</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={isUploading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!result ? (
            <>
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">Instructions:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Upload a CSV or Excel (.xlsx, .xls) file.</li>
                  <li>Required columns: <strong>name</strong>, <strong>email</strong>.</li>
                  <li>Optional columns: phone, location, experienceYears, currentCompany, skills (semicolon separated).</li>
                  <li>Candidates will be added to the <strong>Queue</strong> stage.</li>
                </ul>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  disabled={isUploading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: CSV, Excel (.xlsx, .xls). Max size: 10MB.
                </p>
              </div>

              {/* Options */}
              <div className="flex items-center">
                <input
                  id="send-emails"
                  type="checkbox"
                  checked={sendEmails}
                  onChange={(e) => setSendEmails(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isUploading}
                />
                <label htmlFor="send-emails" className="ml-2 block text-sm text-gray-900">
                  Send application invitation emails to imported candidates
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </>
          ) : (
            /* Result View */
            <div className="space-y-4">
              <div className={`p-4 rounded-lg flex items-center gap-3 ${result.success ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                {result.success ? (
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                <div>
                  <p className="font-semibold">{result.success ? 'Import Completed Successfully' : 'Import Completed with Errors'}</p>
                  <p className="text-sm mt-1">
                    Imported: {result.importedCount} | Skipped: {result.skippedCount} | Failed: {result.failedCount}
                  </p>
                </div>
              </div>

              {result.failedCount > 0 && result.failures && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-medium text-sm text-gray-700">
                    Failures ({result.failures.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.failures.map((fail, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm text-gray-900">{fail.email}</td>
                            <td className="px-4 py-2 text-sm text-red-600">{fail.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          {!result ? (
            <>
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="px-4 py-2 bg-[#0b6cf0] text-white rounded-lg hover:bg-[#0952b8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Upload & Import
              </button>
            </>
          ) : (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
