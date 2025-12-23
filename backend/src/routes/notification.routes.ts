import { Router, Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { requireMinimumRole } from '../middleware/rbac.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 * Requirements: 8.2, 8.3
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.userId;

    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const result = await notificationService.getNotifications(userId, {
      unreadOnly,
      limit,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notifications/pending-feedback
 * Get interviews with pending feedback for the company
 * Requirements: 14.2
 */
router.get('/pending-feedback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.user!.companyId;

    const pendingFeedback = await notificationService.getPendingFeedbackInterviews(companyId);

    res.json({ pendingFeedback });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notifications/feedback-status/:interviewId
 * Get feedback completion status for a specific interview
 * Requirements: 14.5
 */
router.get('/feedback-status/:interviewId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { interviewId } = req.params;

    const status = await notificationService.getFeedbackCompletionStatus(interviewId);

    res.json(status);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notifications/process-feedback-reminders
 * Process and send feedback pending notifications (admin only)
 * Requirements: 14.1, 14.3
 */
router.post(
  '/process-feedback-reminders',
  requireMinimumRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hoursThreshold = req.body.hoursThreshold || 24;

      const result = await notificationService.processFeedbackPendingNotifications(hoursThreshold);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/notifications/check-feedback-complete/:interviewId
 * Check and mark interview as feedback complete if all feedback is submitted
 * Requirements: 14.4
 */
router.post('/check-feedback-complete/:interviewId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { interviewId } = req.params;

    const result = await notificationService.checkAndMarkFeedbackComplete(interviewId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 * Requirements: 8.5
 */
router.put('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.userId;
    const notificationId = req.params.id;

    const notification = await notificationService.markAsRead(notificationId, userId);

    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 * Requirements: 8.5
 */
router.put('/mark-all-read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.userId;

    const result = await notificationService.markAllAsRead(userId);

    res.json({ success: true, count: result.count });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for the authenticated user
 * Requirements: 8.2
 */
router.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.userId;

    const count = await notificationService.getUnreadCount(userId);

    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.userId;
    const notificationId = req.params.id;

    await notificationService.deleteNotification(notificationId, userId);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
