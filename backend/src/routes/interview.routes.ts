import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { interviewService } from '../services/interview.service.js';
import { feedbackService } from '../services/feedback.service.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import type {
  CreateInterviewInput,
  UpdateInterviewInput,
  InterviewFilters,
  InterviewMode,
  InterviewStatus,
} from '../types/index.js';

const router = Router();

/**
 * Interview API Routes
 * Requirements: 1.1, 1.2, 8.1, 8.2, 8.4, 11.1, 11.2, 11.3, 12.1, 12.2, 13.1, 13.2
 */

// ==========================================
// Interview CRUD Routes (Requirements 1.1, 1.2, 8.1, 8.2, 8.4)
// ==========================================

/**
 * POST /api/interviews
 * Create a new interview
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    const input: CreateInterviewInput = {
      jobCandidateId: req.body.jobCandidateId,
      scheduledAt: req.body.scheduledAt,
      duration: req.body.duration,
      timezone: req.body.timezone,
      mode: req.body.mode as InterviewMode,
      location: req.body.location,
      panelMemberIds: req.body.panelMemberIds,
      notes: req.body.notes,
      scheduledBy: userId,
    };

    const interview = await interviewService.createInterview(input);

    // Email notifications and calendar sync are now handled in the service (Task 21.1, 21.2)

    res.status(201).json(interview);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/interviews
 * List interviews with filters
 * Requirements: 17.2
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    
    const filters: InterviewFilters = {
      companyId,
      jobId: req.query.jobId as string | undefined,
      candidateId: req.query.candidateId as string | undefined,
      panelMemberId: req.query.panelMemberId as string | undefined,
      status: req.query.status as InterviewStatus | undefined,
      mode: req.query.mode as InterviewMode | undefined,
      jobCandidateId: req.query.jobCandidateId as string | undefined,
    };

    // Parse date filters
    if (req.query.dateFrom) {
      filters.dateFrom = new Date(req.query.dateFrom as string);
    }
    if (req.query.dateTo) {
      filters.dateTo = new Date(req.query.dateTo as string);
    }

    const interviews = await interviewService.listInterviews(filters);
    res.json(interviews);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/interviews/dashboard
 * Get dashboard data (today, tomorrow, this week, pending feedback)
 * Requirements: 11.1, 11.2, 11.3, 12.1, 12.2
 */
router.get('/dashboard', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    const dashboardData = await interviewService.getDashboardInterviews(userId, companyId);
    res.json(dashboardData);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/interviews/panel-load
 * Get panel load distribution
 * Requirements: 13.1, 13.2
 */
router.get('/panel-load', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const period = (req.query.period as 'week' | 'month') || 'week';

    if (period !== 'week' && period !== 'month') {
      throw new ValidationError({ period: ['Period must be "week" or "month"'] });
    }

    const panelLoad = await interviewService.getPanelLoadDistribution(companyId, period);
    res.json(panelLoad);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/interviews/pending-feedback
 * Get interviews pending feedback for current user
 * Requirements: 14.2
 */
router.get('/pending-feedback', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const pendingInterviews = await feedbackService.getPendingFeedback(userId);
    res.json(pendingInterviews);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/interviews/:id
 * Get interview details
 * Requirements: 17.1
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const interview = await interviewService.getInterview(id);
    if (!interview) {
      throw new NotFoundError('Interview');
    }

    res.json(interview);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/interviews/:id
 * Update/reschedule an interview
 * Requirements: 8.1, 8.2, 8.3
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const input: UpdateInterviewInput = {
      scheduledAt: req.body.scheduledAt,
      duration: req.body.duration,
      timezone: req.body.timezone,
      mode: req.body.mode as InterviewMode | undefined,
      location: req.body.location,
      panelMemberIds: req.body.panelMemberIds,
      notes: req.body.notes,
    };

    const interview = await interviewService.updateInterview(id, input);

    // Email notifications and calendar sync are now handled in the service (Task 21.1, 21.2)

    res.json(interview);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/interviews/:id
 * Cancel an interview
 * Requirements: 8.4, 8.5
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const reason = req.body.reason as string | undefined;

    const interview = await interviewService.cancelInterview(id, reason);

    // Email notifications and calendar sync are now handled in the service (Task 21.1, 21.2)

    res.json(interview);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Feedback Routes (Requirements 9.2, 14.2, 14.5)
// ==========================================

/**
 * POST /api/interviews/:id/feedback
 * Submit feedback for an interview
 * Requirements: 9.2
 */
router.post('/:id/feedback', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const feedback = await feedbackService.submitFeedback({
      interviewId: id,
      panelMemberId: userId,
      ratings: req.body.ratings,
      overallComments: req.body.overallComments,
      recommendation: req.body.recommendation,
    });

    // Process auto-stage movement after feedback submission (Requirements 10.1-10.5)
    feedbackService.processAutoStageMovement(id).catch((err: Error) => {
      console.error('Failed to process auto-stage movement:', err);
    });

    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/interviews/:id/feedback
 * Get all feedback for an interview
 * Requirements: 14.5
 */
router.get('/:id/feedback', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const feedback = await feedbackService.getInterviewFeedback(id);
    res.json(feedback);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/interviews/:id/feedback-status
 * Get feedback completion status for an interview
 * Requirements: 14.5
 */
router.get('/:id/feedback-status', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const status = await feedbackService.getFeedbackCompletionStatus(id);
    res.json(status);
  } catch (error) {
    next(error);
  }
});

export default router;
