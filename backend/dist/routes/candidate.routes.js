import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import candidateService from '../services/candidate.service.js';
import stageHistoryService from '../services/stageHistory.service.js';
import notesService from '../services/notes.service.js';
import attachmentsService, { ALLOWED_ATTACHMENT_EXTENSIONS, ALLOWED_ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_SIZE, } from '../services/attachments.service.js';
import { ValidationError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
// Configure multer for resume uploads
const UPLOAD_DIR = 'uploads/resumes';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `resume-${uniqueSuffix}${ext}`);
    },
});
const fileFilter = (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        cb(new Error(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
        return;
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(new Error(`Invalid file type. Allowed: PDF, DOC, DOCX`));
        return;
    }
    cb(null, true);
};
const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter,
});
// Configure multer for attachment uploads (Requirements 6.4, 6.5)
const ATTACHMENTS_UPLOAD_DIR = 'uploads/attachments';
// Ensure attachments upload directory exists
if (!fs.existsSync(ATTACHMENTS_UPLOAD_DIR)) {
    fs.mkdirSync(ATTACHMENTS_UPLOAD_DIR, { recursive: true });
}
const attachmentStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, ATTACHMENTS_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `attachment-${uniqueSuffix}${ext}`);
    },
});
const attachmentFileFilter = (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(ext)) {
        cb(new Error(`Invalid file extension. Allowed: ${ALLOWED_ATTACHMENT_EXTENSIONS.join(', ')}`));
        return;
    }
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
        cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, PNG, JPG, JPEG'));
        return;
    }
    cb(null, true);
};
const attachmentUpload = multer({
    storage: attachmentStorage,
    limits: {
        fileSize: MAX_ATTACHMENT_SIZE,
    },
    fileFilter: attachmentFileFilter,
});
// Validation schemas
const createCandidateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    experienceYears: z.number().min(0).optional(),
    currentCompany: z.string().optional(),
    location: z.string().min(1, 'Location is required'),
    currentCtc: z.string().optional(),
    expectedCtc: z.string().optional(),
    noticePeriod: z.string().optional(),
    source: z.string().min(1, 'Source is required'),
    availability: z.string().optional(),
    skills: z.array(z.string()).optional(),
    score: z.number().min(0).max(100).optional(),
    // Score breakdown fields (Requirements 8.5)
    domainScore: z.number().min(0).max(100).optional(),
    industryScore: z.number().min(0).max(100).optional(),
    keyResponsibilitiesScore: z.number().min(0).max(100).optional(),
});
const updateCandidateSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().optional(),
    experienceYears: z.number().min(0).optional(),
    currentCompany: z.string().optional(),
    location: z.string().min(1).optional(),
    currentCtc: z.string().optional(),
    expectedCtc: z.string().optional(),
    noticePeriod: z.string().optional(),
    source: z.string().min(1).optional(),
    availability: z.string().optional(),
    skills: z.array(z.string()).optional(),
    resumeUrl: z.string().optional(),
    score: z.number().min(0).max(100).optional(),
    // Score breakdown fields (Requirements 8.5)
    domainScore: z.number().min(0).max(100).optional(),
    industryScore: z.number().min(0).max(100).optional(),
    keyResponsibilitiesScore: z.number().min(0).max(100).optional(),
});
const searchQuerySchema = z.object({
    query: z.string().optional(),
    department: z.string().optional(),
    location: z.string().optional(),
    experienceMin: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
    experienceMax: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
    source: z.string().optional(),
    availability: z.string().optional(),
    scoreMin: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
    scoreMax: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
    sortBy: z.enum(['score_asc', 'score_desc', 'updated', 'name']).optional(),
    tags: z.string().optional().transform((val) => val ? val.split(',').map(t => t.trim()).filter(t => t) : undefined),
});
const changeStageSchema = z.object({
    jobCandidateId: z.string().min(1, 'Job candidate ID is required'),
    newStageId: z.string().min(1, 'New stage ID is required'),
    rejectionReason: z.string().optional(),
    comment: z.string().optional(),
});
const updateScoreSchema = z.object({
    score: z.number().min(0, 'Score must be at least 0').max(100, 'Score must be at most 100'),
});
// Score breakdown update schema (Requirements 8.5)
const updateScoreBreakdownSchema = z.object({
    domainScore: z.number().min(0).max(100).optional(),
    industryScore: z.number().min(0).max(100).optional(),
    keyResponsibilitiesScore: z.number().min(0).max(100).optional(),
}).refine((data) => data.domainScore !== undefined || data.industryScore !== undefined || data.keyResponsibilitiesScore !== undefined, { message: 'At least one score must be provided' });
const createNoteSchema = z.object({
    content: z.string().min(1, 'Note content is required'),
});
const addTagSchema = z.object({
    tag: z.string().min(1, 'Tag is required'),
});
// Helper to validate request body
function validateBody(schema, body) {
    const result = schema.safeParse(body);
    if (!result.success) {
        const errors = {};
        result.error.issues.forEach((issue) => {
            const path = issue.path.join('.');
            if (!errors[path]) {
                errors[path] = [];
            }
            errors[path].push(issue.message);
        });
        throw new ValidationError(errors);
    }
    return result.data;
}
/**
 * GET /api/candidates
 * Get all candidates for the authenticated user's company
 * Requirements: 8.3
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Company ID not found' });
        }
        const candidates = await candidateService.getAllByCompany(companyId);
        return res.json(candidates);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/candidates/search
 * Search candidates with filters including score-based sorting and filtering
 * Requirements: 11.1, 11.2, 11.3, 11.4, 25.3, 25.4
 */
router.get('/search', authenticate, async (req, res, next) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Company ID not found' });
        }
        const filters = validateBody(searchQuerySchema, req.query);
        // Use searchWithScoring to support score filtering and sorting (Requirements 25.3, 25.4)
        const candidates = await candidateService.searchWithScoring(companyId, filters);
        return res.json(candidates);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/candidates/:id
 * Get a candidate by ID
 */
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const candidate = await candidateService.getById(req.params.id);
        return res.json(candidate);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/candidates
 * Create a new candidate
 * Requirements: 8.1, 8.2, 8.4
 */
router.post('/', authenticate, async (req, res, next) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Company ID not found' });
        }
        const data = validateBody(createCandidateSchema, req.body);
        const candidate = await candidateService.create({
            ...data,
            companyId,
        });
        return res.status(201).json(candidate);
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/candidates/:id
 * Update a candidate
 * Requirements: 9.2
 */
router.put('/:id', authenticate, async (req, res, next) => {
    try {
        const data = validateBody(updateCandidateSchema, req.body);
        const candidate = await candidateService.update(req.params.id, data);
        return res.json(candidate);
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/candidates/:id
 * Delete a candidate
 */
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        await candidateService.delete(req.params.id);
        return res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/candidates/:id/stage
 * Change a candidate's stage in a job pipeline
 * Requirements: 24.1, 24.2, 24.3, 24.4, 2.1, 2.2
 */
router.put('/:id/stage', authenticate, async (req, res, next) => {
    try {
        const data = validateBody(changeStageSchema, req.body);
        const result = await candidateService.changeStage({
            ...data,
            movedBy: req.user?.userId,
        });
        return res.json(result);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/candidates/:id/stages
 * Get available stages for a job candidate
 * Requirements: 24.3
 */
router.get('/:id/stages', authenticate, async (req, res, next) => {
    try {
        const stages = await candidateService.getAvailableStages(req.params.id);
        return res.json(stages);
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/candidates/:id/score
 * Update a candidate's score
 * Requirements: 25.1, 25.2
 */
router.put('/:id/score', authenticate, async (req, res, next) => {
    try {
        const data = validateBody(updateScoreSchema, req.body);
        const result = await candidateService.updateScore(req.params.id, data.score);
        return res.json(result);
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/candidates/:id/score-breakdown
 * Update a candidate's score breakdown (individual sub-scores)
 * Requirements: 8.3, 8.4, 8.5
 */
router.put('/:id/score-breakdown', authenticate, async (req, res, next) => {
    try {
        const data = validateBody(updateScoreBreakdownSchema, req.body);
        const result = await candidateService.updateScoreBreakdown(req.params.id, data);
        return res.json(result);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/candidates/:id/activities
 * Get a candidate's activity timeline
 * Requirements: 24.2
 */
router.get('/:id/activities', authenticate, async (req, res, next) => {
    try {
        const activities = await candidateService.getActivityTimeline(req.params.id);
        return res.json(activities);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/candidates/:id/stage-history
 * Get stage history for a candidate with duration calculations
 * Requirements: 2.3
 */
router.get('/:id/stage-history', authenticate, async (req, res, next) => {
    try {
        const candidateId = req.params.id;
        const stageHistory = await stageHistoryService.getStageHistoryByCandidateId(candidateId);
        return res.json(stageHistory);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/candidates/:id/notes
 * Get all notes for a candidate in reverse chronological order
 * Requirements: 6.1, 6.2, 6.3
 */
router.get('/:id/notes', authenticate, async (req, res, next) => {
    try {
        const candidateId = req.params.id;
        const notes = await notesService.getNotes(candidateId);
        return res.json(notes);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/candidates/:id/notes
 * Create a new note for a candidate
 * Requirements: 6.1, 6.2
 */
router.post('/:id/notes', authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'User ID not found' });
        }
        const data = validateBody(createNoteSchema, req.body);
        const note = await notesService.createNote({
            candidateId: req.params.id,
            content: data.content,
            createdBy: userId,
        });
        return res.status(201).json(note);
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/candidates/:id/notes/:noteId
 * Delete a note from a candidate
 * Requirements: 6.1
 */
router.delete('/:id/notes/:noteId', authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'User ID not found' });
        }
        await notesService.deleteNote(req.params.noteId, userId);
        return res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/candidates/:id/resume
 * Upload a resume for a candidate
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */
router.post('/:id/resume', authenticate, (req, res, next) => {
    upload.single('resume')(req, res, async (err) => {
        try {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        code: 'FILE_TOO_LARGE',
                        message: 'File size exceeds maximum limit of 10MB',
                    });
                }
                return res.status(400).json({
                    code: 'UPLOAD_ERROR',
                    message: err.message,
                });
            }
            if (err) {
                return res.status(400).json({
                    code: 'INVALID_FILE',
                    message: err.message,
                });
            }
            if (!req.file) {
                return res.status(400).json({
                    code: 'NO_FILE',
                    message: 'No resume file provided',
                });
            }
            const candidateId = req.params.id;
            const resumeUrl = `/${UPLOAD_DIR}/${req.file.filename}`;
            const candidate = await candidateService.updateResumeUrl(candidateId, resumeUrl);
            return res.json({
                message: 'Resume uploaded successfully',
                candidate,
                file: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype,
                    url: resumeUrl,
                },
            });
        }
        catch (error) {
            next(error);
        }
    });
});
/**
 * Validate resume file format and size
 * Helper function for property testing
 */
export const validateResumeFile = (file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return { valid: false, error: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` };
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return { valid: false, error: 'Invalid file type. Allowed: PDF, DOC, DOCX' };
    }
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'File size exceeds maximum limit of 10MB' };
    }
    return { valid: true };
};
/**
 * GET /api/candidates/:id/attachments
 * Get all attachments for a candidate
 * Requirements: 6.4, 6.5
 */
router.get('/:id/attachments', authenticate, async (req, res, next) => {
    try {
        const candidateId = req.params.id;
        const attachments = await attachmentsService.getAttachments(candidateId);
        return res.json(attachments);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/candidates/:id/attachments
 * Upload an attachment for a candidate (multipart)
 * Requirements: 6.4, 6.5
 */
router.post('/:id/attachments', authenticate, (req, res, next) => {
    attachmentUpload.single('attachment')(req, res, async (err) => {
        try {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        code: 'FILE_TOO_LARGE',
                        message: 'File size exceeds maximum limit of 10MB',
                    });
                }
                return res.status(400).json({
                    code: 'UPLOAD_ERROR',
                    message: err.message,
                });
            }
            if (err) {
                return res.status(400).json({
                    code: 'INVALID_FILE',
                    message: err.message,
                });
            }
            if (!req.file) {
                return res.status(400).json({
                    code: 'NO_FILE',
                    message: 'No attachment file provided',
                });
            }
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ code: 'UNAUTHORIZED', message: 'User ID not found' });
            }
            const candidateId = req.params.id;
            const fileUrl = `/${ATTACHMENTS_UPLOAD_DIR}/${req.file.filename}`;
            const attachment = await attachmentsService.uploadAttachment({
                candidateId,
                fileName: req.file.originalname,
                fileUrl,
                fileType: req.file.mimetype,
                fileSize: req.file.size,
                uploadedBy: userId,
            });
            return res.status(201).json(attachment);
        }
        catch (error) {
            next(error);
        }
    });
});
/**
 * DELETE /api/candidates/:id/attachments/:attachmentId
 * Delete an attachment from a candidate
 * Requirements: 6.4
 */
router.delete('/:id/attachments/:attachmentId', authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'User ID not found' });
        }
        await attachmentsService.deleteAttachment(req.params.attachmentId, userId);
        return res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/candidates/:id/tags
 * Add a tag to a candidate
 * Requirements: 7.2
 */
router.post('/:id/tags', authenticate, async (req, res, next) => {
    try {
        const data = validateBody(addTagSchema, req.body);
        const candidate = await candidateService.addTag(req.params.id, data.tag);
        return res.status(201).json(candidate);
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/candidates/:id/tags/:tag
 * Remove a tag from a candidate
 * Requirements: 7.5
 */
router.delete('/:id/tags/:tag', authenticate, async (req, res, next) => {
    try {
        const tag = decodeURIComponent(req.params.tag);
        const candidate = await candidateService.removeTag(req.params.id, tag);
        return res.json(candidate);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/candidates/tags
 * Get all unique tags used in the company
 * Requirements: 7.2 (for autocomplete)
 */
router.get('/tags/all', authenticate, async (req, res, next) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Company ID not found' });
        }
        const tags = await candidateService.getAllTags(companyId);
        return res.json(tags);
    }
    catch (error) {
        next(error);
    }
});
export { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
export default router;
//# sourceMappingURL=candidate.routes.js.map