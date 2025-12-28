/**
 * Email Service with Resend
 *
 * Handles all transactional emails using Resend API for interview notifications,
 * reminders, and other communications.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 16.1, 16.2, 16.3, 16.4, 16.5
 */
import { Resend } from 'resend';
import prisma from '../lib/prisma.js';
import { formatForEmail, formatDateInTimezone, formatTimeInTimezone } from './timezone.service.js';
// Lazy-initialize Resend client to avoid errors when API key is not set (e.g., in tests)
let resend = null;
function getResendClient() {
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}
// Default sender configuration
const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';
const DEFAULT_FROM_NAME = process.env.RESEND_FROM_NAME || 'ATS Portal';
/**
 * Default email templates
 * Requirements: 16.1, 16.4, 16.5
 */
const DEFAULT_TEMPLATES = {
    interview_confirmation_candidate: {
        subject: 'Interview Scheduled: {{job_title}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0b6cf0; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .button { display: inline-block; background: #0b6cf0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Scheduled</h1>
    </div>
    <div class="content">
      <p>Dear {{candidate_name}},</p>
      <p>Your interview for the <strong>{{job_title}}</strong> position has been scheduled.</p>
      <div class="details">
        <div class="detail-row"><span class="label">Date & Time:</span> {{interview_datetime}}</div>
        <div class="detail-row"><span class="label">Duration:</span> {{duration}}</div>
        <div class="detail-row"><span class="label">Interview Mode:</span> {{meeting_link}}</div>
        <div class="detail-row"><span class="label">Interviewers:</span> {{interviewer_names}}</div>
      </div>
      <p>Please ensure you are available at the scheduled time. If you need to reschedule, please contact us as soon as possible.</p>
      <p>Best regards,<br>{{company_name}}</p>
    </div>
    <div class="footer">
      <p>This is an automated message from {{company_name}}</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
    },
    interview_confirmation_panel: {
        subject: 'Interview Invitation: {{candidate_name}} - {{job_title}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0b6cf0; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .button { display: inline-block; background: #0b6cf0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Invitation</h1>
    </div>
    <div class="content">
      <p>Dear {{interviewer_name}},</p>
      <p>You have been assigned as an interviewer for <strong>{{candidate_name}}</strong> for the <strong>{{job_title}}</strong> position.</p>
      <div class="details">
        <div class="detail-row"><span class="label">Candidate:</span> {{candidate_name}}</div>
        <div class="detail-row"><span class="label">Position:</span> {{job_title}}</div>
        <div class="detail-row"><span class="label">Date & Time:</span> {{interview_datetime}}</div>
        <div class="detail-row"><span class="label">Duration:</span> {{duration}}</div>
        <div class="detail-row"><span class="label">Meeting Link:</span> {{meeting_link}}</div>
      </div>
      <p>Please review the candidate's resume before the interview.</p>
      <p>Best regards,<br>{{company_name}}</p>
    </div>
    <div class="footer">
      <p>This is an automated message from {{company_name}}</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
    },
    interview_reschedule_candidate: {
        subject: 'Interview Rescheduled: {{job_title}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .old-time { text-decoration: line-through; color: #999; }
    .new-time { color: #059669; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Rescheduled</h1>
    </div>
    <div class="content">
      <p>Dear {{candidate_name}},</p>
      <p>Your interview for the <strong>{{job_title}}</strong> position has been rescheduled.</p>
      <div class="details">
        <div class="detail-row"><span class="label">Previous Time:</span> <span class="old-time">{{old_interview_datetime}}</span></div>
        <div class="detail-row"><span class="label">New Time:</span> <span class="new-time">{{new_interview_datetime}}</span></div>
        <div class="detail-row"><span class="label">Duration:</span> {{duration}}</div>
        <div class="detail-row"><span class="label">Meeting Link:</span> {{meeting_link}}</div>
        <div class="detail-row"><span class="label">Interviewers:</span> {{interviewer_names}}</div>
      </div>
      <p>Please update your calendar accordingly. We apologize for any inconvenience.</p>
      <p>Best regards,<br>{{company_name}}</p>
    </div>
    <div class="footer">
      <p>This is an automated message from {{company_name}}</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
    },
    interview_reschedule_panel: {
        subject: 'Interview Rescheduled: {{candidate_name}} - {{job_title}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .old-time { text-decoration: line-through; color: #999; }
    .new-time { color: #059669; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Rescheduled</h1>
    </div>
    <div class="content">
      <p>Dear {{interviewer_name}},</p>
      <p>The interview with <strong>{{candidate_name}}</strong> for the <strong>{{job_title}}</strong> position has been rescheduled.</p>
      <div class="details">
        <div class="detail-row"><span class="label">Candidate:</span> {{candidate_name}}</div>
        <div class="detail-row"><span class="label">Previous Time:</span> <span class="old-time">{{old_interview_datetime}}</span></div>
        <div class="detail-row"><span class="label">New Time:</span> <span class="new-time">{{new_interview_datetime}}</span></div>
        <div class="detail-row"><span class="label">Duration:</span> {{duration}}</div>
        <div class="detail-row"><span class="label">Meeting Link:</span> {{meeting_link}}</div>
      </div>
      <p>Please update your calendar accordingly.</p>
      <p>Best regards,<br>{{company_name}}</p>
    </div>
    <div class="footer">
      <p>This is an automated message from {{company_name}}</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
    },
    interview_cancellation_candidate: {
        subject: 'Interview Cancelled: {{job_title}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Cancelled</h1>
    </div>
    <div class="content">
      <p>Dear {{candidate_name}},</p>
      <p>We regret to inform you that your interview for the <strong>{{job_title}}</strong> position has been cancelled.</p>
      <div class="details">
        <div class="detail-row"><span class="label">Originally Scheduled:</span> {{interview_datetime}}</div>
        <div class="detail-row"><span class="label">Reason:</span> {{cancel_reason}}</div>
      </div>
      <p>We apologize for any inconvenience. Our team will be in touch regarding next steps.</p>
      <p>Best regards,<br>{{company_name}}</p>
    </div>
    <div class="footer">
      <p>This is an automated message from {{company_name}}</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
    },
    interview_cancellation_panel: {
        subject: 'Interview Cancelled: {{candidate_name}} - {{job_title}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Cancelled</h1>
    </div>
    <div class="content">
      <p>Dear {{interviewer_name}},</p>
      <p>The interview with <strong>{{candidate_name}}</strong> for the <strong>{{job_title}}</strong> position has been cancelled.</p>
      <div class="details">
        <div class="detail-row"><span class="label">Candidate:</span> {{candidate_name}}</div>
        <div class="detail-row"><span class="label">Originally Scheduled:</span> {{interview_datetime}}</div>
        <div class="detail-row"><span class="label">Reason:</span> {{cancel_reason}}</div>
      </div>
      <p>Please remove this from your calendar.</p>
      <p>Best regards,<br>{{company_name}}</p>
    </div>
    <div class="footer">
      <p>This is an automated message from {{company_name}}</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
    },
    interview_reminder_candidate: {
        subject: 'Reminder: Interview Tomorrow - {{job_title}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .button { display: inline-block; background: #0b6cf0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Reminder</h1>
    </div>
    <div class="content">
      <p>Dear {{candidate_name}},</p>
      <p>This is a friendly reminder about your upcoming interview for the <strong>{{job_title}}</strong> position.</p>
      <div class="details">
        <div class="detail-row"><span class="label">Date & Time:</span> {{interview_datetime}}</div>
        <div class="detail-row"><span class="label">Duration:</span> {{duration}}</div>
        <div class="detail-row"><span class="label">Meeting Link:</span> {{meeting_link}}</div>
        <div class="detail-row"><span class="label">Interviewers:</span> {{interviewer_names}}</div>
      </div>
      <p>Please ensure you are prepared and available at the scheduled time. Good luck!</p>
      <p>Best regards,<br>{{company_name}}</p>
    </div>
    <div class="footer">
      <p>This is an automated message from {{company_name}}</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
    },
    interview_reminder_panel: {
        subject: 'Reminder: Interview in 1 Hour - {{candidate_name}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .button { display: inline-block; background: #0b6cf0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Starting Soon</h1>
    </div>
    <div class="content">
      <p>Dear {{interviewer_name}},</p>
      <p>This is a reminder that your interview with <strong>{{candidate_name}}</strong> for the <strong>{{job_title}}</strong> position starts in 1 hour.</p>
      <div class="details">
        <div class="detail-row"><span class="label">Candidate:</span> {{candidate_name}}</div>
        <div class="detail-row"><span class="label">Position:</span> {{job_title}}</div>
        <div class="detail-row"><span class="label">Time:</span> {{interview_datetime}}</div>
        <div class="detail-row"><span class="label">Duration:</span> {{duration}}</div>
        <div class="detail-row"><span class="label">Meeting Link:</span> {{meeting_link}}</div>
      </div>
      <p>Please review the candidate's resume if you haven't already.</p>
      <p>Best regards,<br>{{company_name}}</p>
    </div>
    <div class="footer">
      <p>This is an automated message from {{company_name}}</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
    },
    feedback_reminder: {
        subject: 'Feedback Pending: {{candidate_name}} - {{job_title}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .button { display: inline-block; background: #0b6cf0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Feedback Pending</h1>
    </div>
    <div class="content">
      <p>Dear {{interviewer_name}},</p>
      <p>Your feedback for the interview with <strong>{{candidate_name}}</strong> for the <strong>{{job_title}}</strong> position is pending.</p>
      <div class="details">
        <div class="detail-row"><span class="label">Candidate:</span> {{candidate_name}}</div>
        <div class="detail-row"><span class="label">Position:</span> {{job_title}}</div>
        <div class="detail-row"><span class="label">Interview Date:</span> {{interview_datetime}}</div>
      </div>
      <p>Please submit your feedback as soon as possible to help move the hiring process forward.</p>
      <p>Best regards,<br>{{company_name}}</p>
    </div>
    <div class="footer">
      <p>This is an automated message from {{company_name}}</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
    },
};
/**
 * Email Service
 * Requirements: 6.1, 7.1, 16.1, 16.2, 16.3, 16.4, 16.5
 */
export const emailService = {
    /**
     * Render template with variable substitution
     * Requirements: 16.2, 16.3
     *
     * @param template - Template string with {{variable}} placeholders
     * @param context - Object with variable values
     * @returns Rendered string with variables replaced
     */
    renderTemplate(template, context) {
        let rendered = template;
        // Replace all {{variable}} patterns with context values
        for (const [key, value] of Object.entries(context)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            rendered = rendered.replace(regex, value || '');
        }
        // Remove any remaining unreplaced variables
        rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');
        return rendered;
    },
    /**
     * Get email template by key
     * First checks for company-specific template, then falls back to default
     * Requirements: 16.4
     *
     * @param templateKey - Template identifier
     * @param companyId - Optional company ID for company-specific templates
     * @returns Template subject and HTML content
     */
    async getTemplate(templateKey, companyId) {
        // Try to get company-specific template first
        if (companyId) {
            const companyTemplate = await prisma.emailTemplate.findUnique({
                where: {
                    companyId_templateKey: {
                        companyId,
                        templateKey,
                    },
                },
            });
            if (companyTemplate) {
                return {
                    subject: companyTemplate.subject,
                    htmlContent: companyTemplate.htmlContent,
                };
            }
        }
        // Fall back to default template
        const defaultTemplate = DEFAULT_TEMPLATES[templateKey];
        if (!defaultTemplate) {
            throw new Error(`Template not found: ${templateKey}`);
        }
        return defaultTemplate;
    },
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
    async saveTemplate(companyId, templateKey, subject, htmlContent) {
        const template = await prisma.emailTemplate.upsert({
            where: {
                companyId_templateKey: {
                    companyId,
                    templateKey,
                },
            },
            update: {
                subject,
                htmlContent,
            },
            create: {
                companyId,
                templateKey,
                subject,
                htmlContent,
            },
        });
        return {
            id: template.id,
            companyId: template.companyId,
            templateKey: template.templateKey,
            subject: template.subject,
            htmlContent: template.htmlContent,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
        };
    },
    /**
     * Get all templates for a company (including defaults)
     * Requirements: 16.4
     *
     * @param companyId - Company ID
     * @returns Array of templates with company overrides merged
     */
    async getCompanyTemplates(companyId) {
        // Get company-specific templates
        const companyTemplates = await prisma.emailTemplate.findMany({
            where: { companyId },
        });
        const companyTemplateMap = new Map(companyTemplates.map(t => [t.templateKey, t]));
        // Merge with defaults
        const allTemplateKeys = Object.keys(DEFAULT_TEMPLATES);
        return allTemplateKeys.map(key => {
            const companyTemplate = companyTemplateMap.get(key);
            if (companyTemplate) {
                return {
                    templateKey: key,
                    subject: companyTemplate.subject,
                    htmlContent: companyTemplate.htmlContent,
                    isCustom: true,
                };
            }
            return {
                templateKey: key,
                subject: DEFAULT_TEMPLATES[key].subject,
                htmlContent: DEFAULT_TEMPLATES[key].htmlContent,
                isCustom: false,
            };
        });
    },
    /**
     * Send an email using Resend
     * Requirements: 6.1, 7.1
     *
     * @param options - Email send options
     * @returns Send result with success status
     */
    async sendEmail(options) {
        try {
            const from = options.from || `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`;
            const result = await getResendClient().emails.send({
                from,
                to: Array.isArray(options.to) ? options.to : [options.to],
                subject: options.subject,
                html: options.html,
                replyTo: options.replyTo,
            });
            if (result.error) {
                console.error('Resend error:', result.error);
                return {
                    success: false,
                    error: result.error.message,
                };
            }
            return {
                success: true,
                messageId: result.data?.id,
            };
        }
        catch (error) {
            console.error('Email send error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
    /**
     * Build email context from interview data
     * Requirements: 6.2, 7.2
     *
     * @param interview - Interview with relations
     * @param recipientTimezone - Timezone for date formatting
     * @returns Template context object
     */
    buildInterviewContext(interview, recipientTimezone) {
        const timezone = recipientTimezone || interview.timezone;
        const candidate = interview.jobCandidate?.candidate;
        const job = interview.jobCandidate?.job;
        const panelMembers = interview.panelMembers || [];
        // Get meeting link or location based on mode
        let meetingInfo = '';
        if (interview.mode === 'in_person') {
            meetingInfo = interview.location || 'Location TBD';
        }
        else {
            meetingInfo = interview.meetingLink || 'Meeting link will be provided';
        }
        return {
            candidate_name: candidate?.name || 'Candidate',
            job_title: job?.title || 'Position',
            interview_date: formatDateInTimezone(interview.scheduledAt, timezone),
            interview_time: formatTimeInTimezone(interview.scheduledAt, timezone),
            interview_datetime: formatForEmail(interview.scheduledAt, timezone),
            duration: `${interview.duration} minutes`,
            meeting_link: meetingInfo,
            location: interview.location,
            interviewer_names: panelMembers.map(pm => pm.user?.name || 'Interviewer').join(', '),
            company_name: DEFAULT_FROM_NAME,
            resume_link: candidate?.resumeUrl,
        };
    },
    /**
     * Send interview confirmation email to candidate
     * Requirements: 6.1, 6.2
     *
     * @param interview - Interview with relations
     * @returns Send result
     */
    async sendInterviewConfirmationToCandidate(interview) {
        const candidate = interview.jobCandidate?.candidate;
        if (!candidate?.email) {
            return { success: false, error: 'Candidate email not found' };
        }
        const companyId = interview.jobCandidate?.job?.companyId;
        const template = await this.getTemplate('interview_confirmation_candidate', companyId);
        const context = this.buildInterviewContext(interview);
        const subject = this.renderTemplate(template.subject, context);
        const html = this.renderTemplate(template.htmlContent, context);
        return this.sendEmail({
            to: candidate.email,
            subject,
            html,
        });
    },
    /**
     * Send interview invitation emails to all panel members
     * Requirements: 7.1, 7.2
     *
     * @param interview - Interview with relations
     * @returns Array of send results
     */
    async sendInterviewInvitationToPanel(interview) {
        const panelMembers = interview.panelMembers || [];
        const companyId = interview.jobCandidate?.job?.companyId;
        const template = await this.getTemplate('interview_confirmation_panel', companyId);
        const results = [];
        for (const panelMember of panelMembers) {
            const user = panelMember.user;
            if (!user?.email)
                continue;
            const context = this.buildInterviewContext(interview);
            context.interviewer_name = user.name;
            const subject = this.renderTemplate(template.subject, context);
            const html = this.renderTemplate(template.htmlContent, context);
            const result = await this.sendEmail({
                to: user.email,
                subject,
                html,
            });
            results.push(result);
        }
        return results;
    },
    /**
     * Send interview confirmation to both candidate and panel
     * Requirements: 6.1, 7.1
     *
     * @param interview - Interview with relations
     * @returns Combined results
     */
    async sendInterviewConfirmation(interview) {
        const [candidateResult, panelResults] = await Promise.all([
            this.sendInterviewConfirmationToCandidate(interview),
            this.sendInterviewInvitationToPanel(interview),
        ]);
        return { candidateResult, panelResults };
    },
    /**
     * Send reschedule notification to candidate
     * Requirements: 6.3
     *
     * @param interview - Updated interview with relations
     * @param oldScheduledAt - Previous scheduled time
     * @returns Send result
     */
    async sendRescheduleToCandidate(interview, oldScheduledAt) {
        const candidate = interview.jobCandidate?.candidate;
        if (!candidate?.email) {
            return { success: false, error: 'Candidate email not found' };
        }
        const companyId = interview.jobCandidate?.job?.companyId;
        const template = await this.getTemplate('interview_reschedule_candidate', companyId);
        const context = this.buildInterviewContext(interview);
        context.old_interview_datetime = formatForEmail(oldScheduledAt, interview.timezone);
        context.new_interview_datetime = context.interview_datetime;
        const subject = this.renderTemplate(template.subject, context);
        const html = this.renderTemplate(template.htmlContent, context);
        return this.sendEmail({
            to: candidate.email,
            subject,
            html,
        });
    },
    /**
     * Send reschedule notification to all panel members
     * Requirements: 7.3
     *
     * @param interview - Updated interview with relations
     * @param oldScheduledAt - Previous scheduled time
     * @returns Array of send results
     */
    async sendRescheduleToPanel(interview, oldScheduledAt) {
        const panelMembers = interview.panelMembers || [];
        const companyId = interview.jobCandidate?.job?.companyId;
        const template = await this.getTemplate('interview_reschedule_panel', companyId);
        const results = [];
        for (const panelMember of panelMembers) {
            const user = panelMember.user;
            if (!user?.email)
                continue;
            const context = this.buildInterviewContext(interview);
            context.interviewer_name = user.name;
            context.old_interview_datetime = formatForEmail(oldScheduledAt, interview.timezone);
            context.new_interview_datetime = context.interview_datetime;
            const subject = this.renderTemplate(template.subject, context);
            const html = this.renderTemplate(template.htmlContent, context);
            const result = await this.sendEmail({
                to: user.email,
                subject,
                html,
            });
            results.push(result);
        }
        return results;
    },
    /**
     * Send reschedule notification to both candidate and panel
     * Requirements: 6.3, 7.3
     *
     * @param interview - Updated interview with relations
     * @param oldScheduledAt - Previous scheduled time
     * @returns Combined results
     */
    async sendRescheduleNotification(interview, oldScheduledAt) {
        const [candidateResult, panelResults] = await Promise.all([
            this.sendRescheduleToCandidate(interview, oldScheduledAt),
            this.sendRescheduleToPanel(interview, oldScheduledAt),
        ]);
        return { candidateResult, panelResults };
    },
    /**
     * Send cancellation notification to candidate
     * Requirements: 6.4
     *
     * @param interview - Cancelled interview with relations
     * @returns Send result
     */
    async sendCancellationToCandidate(interview) {
        const candidate = interview.jobCandidate?.candidate;
        if (!candidate?.email) {
            return { success: false, error: 'Candidate email not found' };
        }
        const companyId = interview.jobCandidate?.job?.companyId;
        const template = await this.getTemplate('interview_cancellation_candidate', companyId);
        const context = this.buildInterviewContext(interview);
        context.cancel_reason = interview.cancelReason || 'No reason provided';
        const subject = this.renderTemplate(template.subject, context);
        const html = this.renderTemplate(template.htmlContent, context);
        return this.sendEmail({
            to: candidate.email,
            subject,
            html,
        });
    },
    /**
     * Send cancellation notification to all panel members
     * Requirements: 7.4
     *
     * @param interview - Cancelled interview with relations
     * @returns Array of send results
     */
    async sendCancellationToPanel(interview) {
        const panelMembers = interview.panelMembers || [];
        const companyId = interview.jobCandidate?.job?.companyId;
        const template = await this.getTemplate('interview_cancellation_panel', companyId);
        const results = [];
        for (const panelMember of panelMembers) {
            const user = panelMember.user;
            if (!user?.email)
                continue;
            const context = this.buildInterviewContext(interview);
            context.interviewer_name = user.name;
            context.cancel_reason = interview.cancelReason || 'No reason provided';
            const subject = this.renderTemplate(template.subject, context);
            const html = this.renderTemplate(template.htmlContent, context);
            const result = await this.sendEmail({
                to: user.email,
                subject,
                html,
            });
            results.push(result);
        }
        return results;
    },
    /**
     * Send cancellation notification to both candidate and panel
     * Requirements: 6.4, 7.4
     *
     * @param interview - Cancelled interview with relations
     * @returns Combined results
     */
    async sendCancellationNotification(interview) {
        const [candidateResult, panelResults] = await Promise.all([
            this.sendCancellationToCandidate(interview),
            this.sendCancellationToPanel(interview),
        ]);
        return { candidateResult, panelResults };
    },
    /**
     * Send reminder email to candidate (24 hours before)
     * Requirements: 6.5
     *
     * @param interview - Interview with relations
     * @returns Send result
     */
    async sendReminderToCandidate(interview) {
        const candidate = interview.jobCandidate?.candidate;
        if (!candidate?.email) {
            return { success: false, error: 'Candidate email not found' };
        }
        const companyId = interview.jobCandidate?.job?.companyId;
        const template = await this.getTemplate('interview_reminder_candidate', companyId);
        const context = this.buildInterviewContext(interview);
        const subject = this.renderTemplate(template.subject, context);
        const html = this.renderTemplate(template.htmlContent, context);
        return this.sendEmail({
            to: candidate.email,
            subject,
            html,
        });
    },
    /**
     * Send reminder email to panel member (1 hour before)
     * Requirements: 7.5
     *
     * @param interview - Interview with relations
     * @param panelMember - Specific panel member to remind
     * @returns Send result
     */
    async sendReminderToPanelMember(interview, panelMember) {
        if (!panelMember.email) {
            return { success: false, error: 'Panel member email not found' };
        }
        const companyId = interview.jobCandidate?.job?.companyId;
        const template = await this.getTemplate('interview_reminder_panel', companyId);
        const context = this.buildInterviewContext(interview);
        context.interviewer_name = panelMember.name;
        const subject = this.renderTemplate(template.subject, context);
        const html = this.renderTemplate(template.htmlContent, context);
        return this.sendEmail({
            to: panelMember.email,
            subject,
            html,
        });
    },
    /**
     * Send reminder emails to all panel members
     * Requirements: 7.5
     *
     * @param interview - Interview with relations
     * @returns Array of send results
     */
    async sendReminderToPanel(interview) {
        const panelMembers = interview.panelMembers || [];
        const results = [];
        for (const pm of panelMembers) {
            if (pm.user) {
                const result = await this.sendReminderToPanelMember(interview, pm.user);
                results.push(result);
            }
        }
        return results;
    },
    /**
     * Send feedback reminder email to panel member
     * Requirements: 14.3
     *
     * @param interview - Interview with relations
     * @param panelMember - Panel member who hasn't submitted feedback
     * @returns Send result
     */
    async sendFeedbackReminder(interview, panelMember) {
        if (!panelMember.email) {
            return { success: false, error: 'Panel member email not found' };
        }
        const companyId = interview.jobCandidate?.job?.companyId;
        const template = await this.getTemplate('feedback_reminder', companyId);
        const context = this.buildInterviewContext(interview);
        context.interviewer_name = panelMember.name;
        const subject = this.renderTemplate(template.subject, context);
        const html = this.renderTemplate(template.htmlContent, context);
        return this.sendEmail({
            to: panelMember.email,
            subject,
            html,
        });
    },
    /**
     * Get interviews that need candidate reminders (24 hours before)
     * Requirements: 6.5
     *
     * @returns Array of interviews needing candidate reminders
     */
    async getInterviewsNeedingCandidateReminder() {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
        const interviews = await prisma.interview.findMany({
            where: {
                status: 'scheduled',
                scheduledAt: {
                    gte: in23Hours,
                    lte: in24Hours,
                },
            },
            include: {
                jobCandidate: {
                    include: {
                        candidate: true,
                        job: true,
                    },
                },
                scheduler: true,
                panelMembers: {
                    include: {
                        user: true,
                    },
                },
                feedback: {
                    include: {
                        panelMember: true,
                    },
                },
            },
        });
        // Map to Interview type
        return interviews.map(i => ({
            id: i.id,
            jobCandidateId: i.jobCandidateId,
            scheduledAt: i.scheduledAt,
            duration: i.duration,
            timezone: i.timezone,
            mode: i.mode,
            meetingLink: i.meetingLink ?? undefined,
            location: i.location ?? undefined,
            status: i.status,
            notes: i.notes ?? undefined,
            cancelReason: i.cancelReason ?? undefined,
            scheduledBy: i.scheduledBy,
            createdAt: i.createdAt,
            updatedAt: i.updatedAt,
            jobCandidate: i.jobCandidate ? {
                id: i.jobCandidate.id,
                jobId: i.jobCandidate.jobId,
                candidateId: i.jobCandidate.candidateId,
                currentStageId: i.jobCandidate.currentStageId,
                appliedAt: i.jobCandidate.appliedAt,
                updatedAt: i.jobCandidate.updatedAt,
                candidate: i.jobCandidate.candidate ? {
                    id: i.jobCandidate.candidate.id,
                    companyId: i.jobCandidate.candidate.companyId,
                    name: i.jobCandidate.candidate.name,
                    email: i.jobCandidate.candidate.email,
                    phone: i.jobCandidate.candidate.phone ?? undefined,
                    experienceYears: i.jobCandidate.candidate.experienceYears,
                    currentCompany: i.jobCandidate.candidate.currentCompany ?? undefined,
                    location: i.jobCandidate.candidate.location,
                    source: i.jobCandidate.candidate.source,
                    skills: Array.isArray(i.jobCandidate.candidate.skills) ? i.jobCandidate.candidate.skills : [],
                    resumeUrl: i.jobCandidate.candidate.resumeUrl ?? undefined,
                    createdAt: i.jobCandidate.candidate.createdAt,
                    updatedAt: i.jobCandidate.candidate.updatedAt,
                } : undefined,
                job: i.jobCandidate.job ? {
                    id: i.jobCandidate.job.id,
                    companyId: i.jobCandidate.job.companyId,
                    title: i.jobCandidate.job.title,
                    department: i.jobCandidate.job.department,
                    description: i.jobCandidate.job.description ?? '',
                    status: i.jobCandidate.job.status,
                    openings: i.jobCandidate.job.openings,
                    skills: Array.isArray(i.jobCandidate.job.skills) ? i.jobCandidate.job.skills : [],
                    locations: Array.isArray(i.jobCandidate.job.locations) ? i.jobCandidate.job.locations : [],
                    createdAt: i.jobCandidate.job.createdAt,
                    updatedAt: i.jobCandidate.job.updatedAt,
                } : undefined,
            } : undefined,
            panelMembers: i.panelMembers?.map(pm => ({
                id: pm.id,
                interviewId: pm.interviewId,
                userId: pm.userId,
                createdAt: pm.createdAt,
                user: pm.user ? {
                    id: pm.user.id,
                    companyId: pm.user.companyId,
                    name: pm.user.name,
                    email: pm.user.email,
                    role: pm.user.role,
                    isActive: pm.user.isActive,
                    createdAt: pm.user.createdAt,
                    updatedAt: pm.user.updatedAt,
                } : undefined,
            })),
        }));
    },
    /**
     * Get interviews that need panel member reminders (1 hour before)
     * Requirements: 7.5
     *
     * @returns Array of interviews needing panel reminders
     */
    async getInterviewsNeedingPanelReminder() {
        const now = new Date();
        const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
        const in50Minutes = new Date(now.getTime() + 50 * 60 * 1000);
        const interviews = await prisma.interview.findMany({
            where: {
                status: 'scheduled',
                scheduledAt: {
                    gte: in50Minutes,
                    lte: in1Hour,
                },
            },
            include: {
                jobCandidate: {
                    include: {
                        candidate: true,
                        job: true,
                    },
                },
                scheduler: true,
                panelMembers: {
                    include: {
                        user: true,
                    },
                },
                feedback: {
                    include: {
                        panelMember: true,
                    },
                },
            },
        });
        // Map to Interview type (simplified for brevity)
        return interviews.map(i => ({
            id: i.id,
            jobCandidateId: i.jobCandidateId,
            scheduledAt: i.scheduledAt,
            duration: i.duration,
            timezone: i.timezone,
            mode: i.mode,
            meetingLink: i.meetingLink ?? undefined,
            location: i.location ?? undefined,
            status: i.status,
            notes: i.notes ?? undefined,
            cancelReason: i.cancelReason ?? undefined,
            scheduledBy: i.scheduledBy,
            createdAt: i.createdAt,
            updatedAt: i.updatedAt,
            jobCandidate: i.jobCandidate ? {
                id: i.jobCandidate.id,
                jobId: i.jobCandidate.jobId,
                candidateId: i.jobCandidate.candidateId,
                currentStageId: i.jobCandidate.currentStageId,
                appliedAt: i.jobCandidate.appliedAt,
                updatedAt: i.jobCandidate.updatedAt,
                candidate: i.jobCandidate.candidate ? {
                    id: i.jobCandidate.candidate.id,
                    companyId: i.jobCandidate.candidate.companyId,
                    name: i.jobCandidate.candidate.name,
                    email: i.jobCandidate.candidate.email,
                    phone: i.jobCandidate.candidate.phone ?? undefined,
                    experienceYears: i.jobCandidate.candidate.experienceYears,
                    currentCompany: i.jobCandidate.candidate.currentCompany ?? undefined,
                    location: i.jobCandidate.candidate.location,
                    source: i.jobCandidate.candidate.source,
                    skills: Array.isArray(i.jobCandidate.candidate.skills) ? i.jobCandidate.candidate.skills : [],
                    resumeUrl: i.jobCandidate.candidate.resumeUrl ?? undefined,
                    createdAt: i.jobCandidate.candidate.createdAt,
                    updatedAt: i.jobCandidate.candidate.updatedAt,
                } : undefined,
                job: i.jobCandidate.job ? {
                    id: i.jobCandidate.job.id,
                    companyId: i.jobCandidate.job.companyId,
                    title: i.jobCandidate.job.title,
                    department: i.jobCandidate.job.department,
                    description: i.jobCandidate.job.description ?? '',
                    status: i.jobCandidate.job.status,
                    openings: i.jobCandidate.job.openings,
                    skills: Array.isArray(i.jobCandidate.job.skills) ? i.jobCandidate.job.skills : [],
                    locations: Array.isArray(i.jobCandidate.job.locations) ? i.jobCandidate.job.locations : [],
                    createdAt: i.jobCandidate.job.createdAt,
                    updatedAt: i.jobCandidate.job.updatedAt,
                } : undefined,
            } : undefined,
            panelMembers: i.panelMembers?.map(pm => ({
                id: pm.id,
                interviewId: pm.interviewId,
                userId: pm.userId,
                createdAt: pm.createdAt,
                user: pm.user ? {
                    id: pm.user.id,
                    companyId: pm.user.companyId,
                    name: pm.user.name,
                    email: pm.user.email,
                    role: pm.user.role,
                    isActive: pm.user.isActive,
                    createdAt: pm.user.createdAt,
                    updatedAt: pm.user.updatedAt,
                } : undefined,
            })),
        }));
    },
    /**
     * Process and send all pending reminders
     * This should be called by a scheduled job
     * Requirements: 6.5, 7.5
     */
    async processReminders() {
        let candidateReminders = 0;
        let panelReminders = 0;
        // Send candidate reminders (24 hours before)
        const candidateInterviews = await this.getInterviewsNeedingCandidateReminder();
        for (const interview of candidateInterviews) {
            const result = await this.sendReminderToCandidate(interview);
            if (result.success)
                candidateReminders++;
        }
        // Send panel reminders (1 hour before)
        const panelInterviews = await this.getInterviewsNeedingPanelReminder();
        for (const interview of panelInterviews) {
            const results = await this.sendReminderToPanel(interview);
            panelReminders += results.filter(r => r.success).length;
        }
        return { candidateReminders, panelReminders };
    },
};
export default emailService;
//# sourceMappingURL=email.service.js.map