import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';

/**
 * JobShareModal Component - Requirements 7.1, 7.2, 7.3, 7.5, 7.6
 * 
 * Features:
 * - Success message after job creation - Requirement 7.1
 * - Copy Link button with clipboard integration - Requirement 7.2, 7.4
 * - Share to WhatsApp button with wa.me link - Requirement 7.3, 7.5
 * - Go to Roles navigation button - Requirement 7.6
 */

interface JobShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
}

export function JobShareModal({ isOpen, onClose, jobId, jobTitle }: JobShareModalProps) {
  const navigate = useNavigate();
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  // Generate the application URL - Requirement 7.2
  const applicationUrl = `${window.location.origin}/apply/${jobId}`;

  // Handle copy link to clipboard - Requirement 7.4
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(applicationUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = applicationUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Handle share to WhatsApp - Requirement 7.5
  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(`Check out this job opportunity: ${jobTitle}\n\nApply here: ${applicationUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Handle navigation to Roles page - Requirement 7.6
  const handleGoToRoles = () => {
    onClose();
    navigate('/roles');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Success Message - Requirement 7.1 */}
          <h2 className="text-xl font-semibold text-center text-[#111827] mb-2">
            Job Created Successfully!
          </h2>
          <p className="text-sm text-center text-[#64748b] mb-6">
            Your job posting for <span className="font-medium text-[#111827]">{jobTitle}</span> is now live. Share it with potential candidates.
          </p>

          {/* Application URL Display */}
          <div className="bg-[#f9fafb] border border-[#e2e8f0] rounded-lg p-3 mb-6">
            <p className="text-xs text-[#64748b] mb-1">Application Link</p>
            <p className="text-sm text-[#111827] font-mono break-all">{applicationUrl}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Copy Link Button - Requirement 7.2, 7.4 */}
            <button
              onClick={handleCopyLink}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                copySuccess 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-[#f9fafb] text-[#374151] border border-[#e2e8f0] hover:bg-[#f1f5f9]'
              }`}
            >
              {copySuccess ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Link Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>

            {/* Share to WhatsApp Button - Requirement 7.3, 7.5 */}
            <button
              onClick={handleShareWhatsApp}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-[#25D366] text-white hover:bg-[#20BD5A] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share to WhatsApp
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e2e8f0]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-[#64748b]">or</span>
              </div>
            </div>

            {/* Go to Roles Button - Requirement 7.6 */}
            <Button
              variant="primary"
              onClick={handleGoToRoles}
              className="w-full py-3"
            >
              Go to Roles
            </Button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#64748b] hover:text-[#111827] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default JobShareModal;
