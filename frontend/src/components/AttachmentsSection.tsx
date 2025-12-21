/**
 * CandidateAttachmentsSection Component - Requirements 6.4, 6.5
 * 
 * Features:
 * - Display existing attachments with metadata (file name, upload date, download link)
 * - Add file upload with drag-and-drop support
 * - Client-side validation for file type and size
 * - Delete attachments with confirmation
 */

import { useState, useRef, useCallback } from 'react';
import type { CandidateAttachment } from '../services/candidates.service';
import { BACKEND_BASE_URL } from '../services/api';

// Allowed file types - Requirements 6.4
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];

// Max file size: 10MB - Requirements 6.4
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Validation result type
interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Validate file type and size - Requirements 6.4
export function validateAttachment(file: File): ValidationResult {
  // Check file type
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isValidType = ALLOWED_FILE_TYPES.includes(file.type) || 
                      ALLOWED_EXTENSIONS.includes(extension);
  
  if (!isValidType) {
    return {
      valid: false,
      error: 'Please upload a PDF, DOC, DOCX, or image file (PNG, JPG)',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size must be less than 10MB',
    };
  }

  return { valid: true };
}

export interface CandidateAttachmentsSectionProps {
  /** Array of attachments to display */
  attachments: CandidateAttachment[];
  /** Callback when a file is uploaded */
  onUpload: (file: File) => Promise<void>;
  /** Callback when an attachment is deleted */
  onDelete: (attachmentId: string) => Promise<void>;
  /** Whether the component is in a loading state */
  isLoading?: boolean;
  /** Title for the section */
  title?: string;
}

export function CandidateAttachmentsSection({
  attachments,
  onUpload,
  onDelete,
  isLoading = false,
  title = 'Attachments',
}: CandidateAttachmentsSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setUploadError(null);
    
    // Validate file
    const validation = validateAttachment(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow re-uploading same file
    e.target.value = '';
  };

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle delete
  const handleDelete = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    try {
      await onDelete(attachmentId);
    } catch (err) {
      console.error('Error deleting attachment:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Click to open file dialog
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-[#e2e8f0] rounded w-32 mb-3"></div>
            <div className="h-32 bg-[#f1f5f9] rounded"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm">
          <div className="animate-pulse p-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="w-8 h-8 bg-[#e2e8f0] rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-[#e2e8f0] rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-[#f1f5f9] rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-4">
        <h3 className="text-sm font-semibold text-[#111827] mb-3">Upload {title}</h3>
        
        {/* Drag and Drop Zone */}
        <div
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragOver
              ? 'border-[#0b6cf0] bg-[#eff6ff]'
              : 'border-[#e2e8f0] hover:border-[#0b6cf0] hover:bg-[#f8fafc]'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-[#0b6cf0] mb-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm text-[#64748b]">Uploading...</p>
              </div>
            ) : (
              <>
                <svg className="w-8 h-8 text-[#94a3b8] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-[#64748b]">
                  {isDragOver ? 'Drop file here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-[#94a3b8] mt-1">PDF, DOC, DOCX, PNG, JPG up to 10MB</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleInputChange}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            disabled={uploading}
          />
        </div>

        {/* Error Message */}
        {uploadError && (
          <div className="mt-3 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg">
            <p className="text-sm text-[#dc2626] flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {uploadError}
            </p>
          </div>
        )}
      </div>

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <EmptyAttachmentsState />
      ) : (
        <AttachmentsList
          attachments={attachments}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}
    </div>
  );
}

// Empty state component
function EmptyAttachmentsState() {
  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-8 text-center">
      <svg 
        className="w-16 h-16 mx-auto text-[#cbd5e1] mb-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" 
        />
      </svg>
      <p className="text-[#64748b]">No attachments yet</p>
      <p className="text-sm text-[#94a3b8] mt-1">Upload files to keep them with this candidate</p>
    </div>
  );
}


// Attachments list component - Requirements 6.5
interface AttachmentsListProps {
  attachments: CandidateAttachment[];
  onDelete: (attachmentId: string) => void;
  deletingId: string | null;
}

function AttachmentsList({ attachments, onDelete, deletingId }: AttachmentsListProps) {
  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-[#f8fafc]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">File</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Size</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Uploaded</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">By</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748b] uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e2e8f0]">
          {attachments.map((attachment) => (
            <AttachmentRow
              key={attachment.id}
              attachment={attachment}
              onDelete={() => onDelete(attachment.id)}
              isDeleting={deletingId === attachment.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Individual attachment row component
interface AttachmentRowProps {
  attachment: CandidateAttachment;
  onDelete: () => void;
  isDeleting: boolean;
}

function AttachmentRow({ attachment, onDelete, isDeleting }: AttachmentRowProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Get file icon based on type
  const getFileIcon = () => {
    const extension = attachment.fileName.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') {
      return (
        <svg className="w-4 h-4 text-[#dc2626]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13h1c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1h-1v2H7v-5h1.5zm3 0h1.5c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1H11.5v-5zm4.5 0h2v1h-1v1h1v1h-1v2h-1v-5z" />
        </svg>
      );
    }
    
    if (['doc', 'docx'].includes(extension || '')) {
      return (
        <svg className="w-4 h-4 text-[#2563eb]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM9.5 13l1.5 5 1.5-5h1l-2 6h-1l-2-6h1z" />
        </svg>
      );
    }
    
    if (['png', 'jpg', 'jpeg'].includes(extension || '')) {
      return (
        <svg className="w-4 h-4 text-[#16a34a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4 text-[#0b6cf0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <tr className="hover:bg-[#f8fafc] group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#f1f5f9] flex items-center justify-center flex-shrink-0">
            {getFileIcon()}
          </div>
          <span className="text-sm font-medium text-[#374151] truncate max-w-[200px]" title={attachment.fileName}>
            {attachment.fileName}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-[#64748b]">{formatFileSize(attachment.fileSize)}</td>
      <td className="px-4 py-3 text-sm text-[#64748b]">{formatDate(attachment.createdAt)}</td>
      <td className="px-4 py-3 text-sm text-[#64748b]">{attachment.uploaderName}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {showDeleteConfirm ? (
            <>
              <button
                onClick={handleCancelDelete}
                className="px-2 py-1 text-xs font-medium text-[#64748b] hover:text-[#374151] transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="px-2 py-1 text-xs font-medium text-white bg-[#dc2626] rounded hover:bg-[#b91c1c] disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </>
          ) : (
            <>
              {/* Download button */}
              <a
                href={`${BACKEND_BASE_URL}${attachment.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-[#0b6cf0] hover:bg-[#dbeafe] rounded transition-colors"
                title="Download"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
              {/* Delete button */}
              <button
                onClick={handleDeleteClick}
                className="p-1.5 text-[#94a3b8] hover:text-[#dc2626] hover:bg-[#fee2e2] rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default CandidateAttachmentsSection;
