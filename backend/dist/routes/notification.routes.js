import { Router } from 'express';
import { notificationService } from '../services/notification.service.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
// All routes require authentication
router.use(authenticate);
/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 * Requirements: 8.2, 8.3
 */
router.get('/', async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user.userId;
        const unreadOnly = req.query.unreadOnly === 'true';
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const result = await notificationService.getNotifications(userId, {
            unreadOnly,
            limit,
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 * Requirements: 8.5
 */
router.put('/:id/read', async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user.userId;
        const notificationId = req.params.id;
        const notification = await notificationService.markAsRead(notificationId, userId);
        res.json({ success: true, notification });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 * Requirements: 8.5
 */
router.put('/mark-all-read', async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user.userId;
        const result = await notificationService.markAllAsRead(userId);
        res.json({ success: true, count: result.count });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/notifications/unread-count
 * Get unread notification count for the authenticated user
 * Requirements: 8.2
 */
router.get('/unread-count', async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user.userId;
        const count = await notificationService.getUnreadCount(userId);
        res.json({ unreadCount: count });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user.userId;
        const notificationId = req.params.id;
        await notificationService.deleteNotification(notificationId, userId);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=notification.routes.js.map