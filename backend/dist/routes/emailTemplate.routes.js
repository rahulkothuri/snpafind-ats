import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { emailService } from '../services/email.service.js';
import { ValidationError } from '../middleware/errorHandler.js';
const router = Router();
/**
 * Email Template Routes
 * Requirements: 16.4
 */
// Valid template keys
const VALID_TEMPLATE_KEYS = [
    'interview_confirmation_candidate',
    'interview_confirmation_panel',
    'interview_reschedule_candidate',
    'interview_reschedule_panel',
    'interview_cancellation_candidate',
    'interview_cancellation_panel',
    'interview_reminder_candidate',
    'interview_reminder_panel',
    'feedback_reminder',
];
/**
 * GET /api/email-templates
 * Get all email templates for the company (including defaults)
 * Requirements: 16.4
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const templates = await emailService.getCompanyTemplates(companyId);
        res.json(templates);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/email-templates/:key
 * Get a specific email template
 * Requirements: 16.4
 */
router.get('/:key', authenticate, async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const templateKey = req.params.key;
        if (!VALID_TEMPLATE_KEYS.includes(templateKey)) {
            throw new ValidationError({ templateKey: ['Invalid template key'] });
        }
        const template = await emailService.getTemplate(templateKey, companyId);
        res.json({
            templateKey,
            ...template,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/email-templates/:key
 * Update an email template for the company
 * Requirements: 16.4
 */
router.put('/:key', authenticate, async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const templateKey = req.params.key;
        if (!VALID_TEMPLATE_KEYS.includes(templateKey)) {
            throw new ValidationError({ templateKey: ['Invalid template key'] });
        }
        const { subject, htmlContent } = req.body;
        const errors = {};
        if (!subject || typeof subject !== 'string' || subject.trim() === '') {
            errors.subject = ['Subject is required'];
        }
        if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.trim() === '') {
            errors.htmlContent = ['HTML content is required'];
        }
        if (Object.keys(errors).length > 0) {
            throw new ValidationError(errors);
        }
        const template = await emailService.saveTemplate(companyId, templateKey, subject.trim(), htmlContent.trim());
        res.json(template);
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/email-templates/:key
 * Reset an email template to default (delete company override)
 * Requirements: 16.4
 */
router.delete('/:key', authenticate, async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const templateKey = req.params.key;
        if (!VALID_TEMPLATE_KEYS.includes(templateKey)) {
            throw new ValidationError({ templateKey: ['Invalid template key'] });
        }
        // Import prisma to delete the template
        const { default: prisma } = await import('../lib/prisma.js');
        await prisma.emailTemplate.deleteMany({
            where: {
                companyId,
                templateKey,
            },
        });
        res.json({ message: 'Template reset to default' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/email-templates/:key/preview
 * Preview an email template with sample data
 * Requirements: 16.3
 */
router.post('/:key/preview', authenticate, async (req, res, next) => {
    try {
        const templateKey = req.params.key;
        if (!VALID_TEMPLATE_KEYS.includes(templateKey)) {
            throw new ValidationError({ templateKey: ['Invalid template key'] });
        }
        const { subject, htmlContent, context } = req.body;
        if (!subject || !htmlContent) {
            throw new ValidationError({
                subject: !subject ? ['Subject is required for preview'] : [],
                htmlContent: !htmlContent ? ['HTML content is required for preview'] : [],
            });
        }
        // Use provided context or default sample data
        const sampleContext = context || {
            candidate_name: 'John Doe',
            job_title: 'Senior Software Engineer',
            interview_date: 'December 25, 2025',
            interview_time: '10:00 AM',
            interview_datetime: 'December 25, 2025 at 10:00 AM IST',
            duration: '60 minutes',
            meeting_link: 'https://meet.google.com/abc-defg-hij',
            location: '123 Main Street, City',
            interviewer_names: 'Jane Smith, Bob Johnson',
            company_name: 'Acme Corp',
            interviewer_name: 'Jane Smith',
            resume_link: 'https://example.com/resume.pdf',
            old_interview_datetime: 'December 24, 2025 at 2:00 PM IST',
            new_interview_datetime: 'December 25, 2025 at 10:00 AM IST',
            cancel_reason: 'Schedule conflict',
            feedback_link: 'https://example.com/feedback',
        };
        const renderedSubject = emailService.renderTemplate(subject, sampleContext);
        const renderedHtml = emailService.renderTemplate(htmlContent, sampleContext);
        res.json({
            subject: renderedSubject,
            html: renderedHtml,
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=emailTemplate.routes.js.map