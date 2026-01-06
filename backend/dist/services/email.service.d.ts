/**
 * Email Service with Resend
 *
 * Handles all transactional emails using Resend API for interview notifications,
 * reminders, and other communications.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 16.1, 16.2, 16.3, 16.4, 16.5
 */
import type { Interview, User } from '../types/index.js';
/**
 * Email template types
 * Requirements: 16.1
 */
export type EmailTemplateKey = 'interview_confirmation_candidate' | 'interview_confirmation_panel' | 'interview_reschedule_candidate' | 'interview_reschedule_panel' | 'interview_cancellation_candidate' | 'interview_cancellation_panel' | 'interview_reminder_candidate' | 'interview_reminder_panel' | 'feedback_reminder' | 'application_form_invitation';
/**
 * Template variable context for email rendering
 * Requirements: 16.2
 */
export interface EmailTemplateContext {
    candidate_name?: string;
    job_title?: string;
    interview_date?: string;
    interview_time?: string;
    interview_datetime?: string;
    duration?: string;
    meeting_link?: string;
    location?: string;
    interviewer_names?: string;
    company_name?: string;
    interviewer_name?: string;
    resume_link?: string;
    old_interview_datetime?: string;
    new_interview_datetime?: string;
    cancel_reason?: string;
    feedback_link?: string;
    application_link?: string;
}
/**
 * Email template data structure
 */
export interface EmailTemplate {
    id: string;
    companyId: string | null;
    templateKey: string;
    subject: string;
    htmlContent: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Send email options
 */
export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
}
/**
 * Email send result
 */
export interface EmailSendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}
/**
 * Email Service
 * Requirements: 6.1, 7.1, 16.1, 16.2, 16.3, 16.4, 16.5
 */
export declare const emailService: {
    /**
     * Render template with variable substitution
     * Requirements: 16.2, 16.3
     *
     * @param template - Template string with {{variable}} placeholders
     * @param context - Object with variable values
     * @returns Rendered string with variables replaced
     */
    renderTemplate(template: string, context: EmailTemplateContext): string;
    /**
     * Get email template by key
     * First checks for company-specific template, then falls back to default
     * Requirements: 16.4
     *
     * @param templateKey - Template identifier
     * @param companyId - Optional company ID for company-specific templates
     * @returns Template subject and HTML content
     */
    getTemplate(templateKey: EmailTemplateKey, companyId?: string): Promise<{
        subject: string;
        htmlContent: string;
    }>;
    /**
     * Save or update a company email template
     * Requirements: 16.4
     *
     * @param companyId - Company ID
     * @param templateKey - Template identifier
     * @param subject - Email subject template
     * @param htmlContent - HTML content template
     * @returns Saved template
     */
    saveTemplate(companyId: string, templateKey: EmailTemplateKey, subject: string, htmlContent: string): Promise<EmailTemplate>;
    /**
     * Get all templates for a company (including defaults)
     * Requirements: 16.4
     *
     * @param companyId - Company ID
     * @returns Array of templates with company overrides merged
     */
    getCompanyTemplates(companyId: string): Promise<Array<{
        templateKey: EmailTemplateKey;
        subject: string;
        htmlContent: string;
        isCustom: boolean;
    }>>;
    /**
     * Send an email using Resend
     * Requirements: 6.1, 7.1
     *
     * @param options - Email send options
     * @returns Send result with success status
     */
    sendEmail(options: SendEmailOptions): Promise<EmailSendResult>;
    /**
     * Build email context from interview data
     * Requirements: 6.2, 7.2
     *
     * @param interview - Interview with relations
     * @param recipientTimezone - Timezone for date formatting
     * @returns Template context object
     */
    buildInterviewContext(interview: Interview, recipientTimezone?: string): EmailTemplateContext;
    /**
     * Send interview confirmation email to candidate
     * Requirements: 6.1, 6.2
     *
     * @param interview - Interview with relations
     * @returns Send result
     */
    sendInterviewConfirmationToCandidate(interview: Interview): Promise<EmailSendResult>;
    /**
     * Send interview invitation emails to all panel members
     * Requirements: 7.1, 7.2
     *
     * @param interview - Interview with relations
     * @returns Array of send results
     */
    sendInterviewInvitationToPanel(interview: Interview): Promise<EmailSendResult[]>;
    /**
     * Send interview confirmation to both candidate and panel
     * Requirements: 6.1, 7.1
     *
     * @param interview - Interview with relations
     * @returns Combined results
     */
    sendInterviewConfirmation(interview: Interview): Promise<{
        candidateResult: EmailSendResult;
        panelResults: EmailSendResult[];
    }>;
    /**
     * Send reschedule notification to candidate
     * Requirements: 6.3
     *
     * @param interview - Updated interview with relations
     * @param oldScheduledAt - Previous scheduled time
     * @returns Send result
     */
    sendRescheduleToCandidate(interview: Interview, oldScheduledAt: Date): Promise<EmailSendResult>;
    /**
     * Send reschedule notification to all panel members
     * Requirements: 7.3
     *
     * @param interview - Updated interview with relations
     * @param oldScheduledAt - Previous scheduled time
     * @returns Array of send results
     */
    sendRescheduleToPanel(interview: Interview, oldScheduledAt: Date): Promise<EmailSendResult[]>;
    /**
     * Send reschedule notification to both candidate and panel
     * Requirements: 6.3, 7.3
     *
     * @param interview - Updated interview with relations
     * @param oldScheduledAt - Previous scheduled time
     * @returns Combined results
     */
    sendRescheduleNotification(interview: Interview, oldScheduledAt: Date): Promise<{
        candidateResult: EmailSendResult;
        panelResults: EmailSendResult[];
    }>;
    /**
     * Send cancellation notification to candidate
     * Requirements: 6.4
     *
     * @param interview - Cancelled interview with relations
     * @returns Send result
     */
    sendCancellationToCandidate(interview: Interview): Promise<EmailSendResult>;
    /**
     * Send cancellation notification to all panel members
     * Requirements: 7.4
     *
     * @param interview - Cancelled interview with relations
     * @returns Array of send results
     */
    sendCancellationToPanel(interview: Interview): Promise<EmailSendResult[]>;
    /**
     * Send cancellation notification to both candidate and panel
     * Requirements: 6.4, 7.4
     *
     * @param interview - Cancelled interview with relations
     * @returns Combined results
     */
    sendCancellationNotification(interview: Interview): Promise<{
        candidateResult: EmailSendResult;
        panelResults: EmailSendResult[];
    }>;
    /**
     * Send reminder email to candidate (24 hours before)
     * Requirements: 6.5
     *
     * @param interview - Interview with relations
     * @returns Send result
     */
    sendReminderToCandidate(interview: Interview): Promise<EmailSendResult>;
    /**
     * Send reminder email to panel member (1 hour before)
     * Requirements: 7.5
     *
     * @param interview - Interview with relations
     * @param panelMember - Specific panel member to remind
     * @returns Send result
     */
    sendReminderToPanelMember(interview: Interview, panelMember: User): Promise<EmailSendResult>;
    /**
     * Send reminder emails to all panel members
     * Requirements: 7.5
     *
     * @param interview - Interview with relations
     * @returns Array of send results
     */
    sendReminderToPanel(interview: Interview): Promise<EmailSendResult[]>;
    /**
     * Send feedback reminder email to panel member
     * Requirements: 14.3
     *
     * @param interview - Interview with relations
     * @param panelMember - Panel member who hasn't submitted feedback
     * @returns Send result
     */
    sendFeedbackReminder(interview: Interview, panelMember: User): Promise<EmailSendResult>;
    /**
     * Get interviews that need candidate reminders (24 hours before)
     * Requirements: 6.5
     *
     * @returns Array of interviews needing candidate reminders
     */
    getInterviewsNeedingCandidateReminder(): Promise<Interview[]>;
    /**
     * Get interviews that need panel member reminders (1 hour before)
     * Requirements: 7.5
     *
     * @returns Array of interviews needing panel reminders
     */
    getInterviewsNeedingPanelReminder(): Promise<Interview[]>;
    /**
     * Process and send all pending reminders
     * This should be called by a scheduled job
     * Requirements: 6.5, 7.5
     */
    processReminders(): Promise<{
        candidateReminders: number;
        panelReminders: number;
    }>;
    /**
     * Send application form invitation email to a candidate
     * Used for bulk import workflow when candidates need to complete application form
     *
     * @param options - Candidate and job details for the invitation
     * @returns Send result with success status
     */
    sendApplicationFormInvitation(options: {
        candidateEmail: string;
        candidateName: string;
        jobId: string;
        jobTitle: string;
        companyName: string;
        companyId?: string;
    }): Promise<EmailSendResult>;
};
export default emailService;
//# sourceMappingURL=email.service.d.ts.map