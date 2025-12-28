import { Router } from 'express';
import { calendarService } from '../services/calendar.service.js';
import { oauthService } from '../services/oauth.service.js';
import { authenticate } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';
const router = Router();
/**
 * Calendar OAuth Routes
 * Requirements: 4.1, 5.1
 */
// ==========================================
// Google Calendar OAuth (Requirements 4.1)
// ==========================================
/**
 * GET /api/calendar/google/auth
 * Get Google OAuth authorization URL
 */
router.get('/google/auth', authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const redirectUri = req.query.redirectUri;
        const authUrl = calendarService.getGoogleAuthUrl(userId, redirectUri);
        res.json({ authUrl });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/calendar/google/callback
 * Handle Google OAuth callback
 */
router.get('/google/callback', async (req, res, next) => {
    try {
        const { code, state, error } = req.query;
        if (error) {
            // User denied access or other error
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/settings?calendar_error=${encodeURIComponent(error)}`);
        }
        if (!code || !state) {
            throw new ValidationError({
                callback: ['Missing authorization code or state parameter']
            });
        }
        const userId = state;
        await calendarService.handleGoogleCallback(userId, code);
        // Redirect to frontend settings page with success
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/settings?calendar_connected=google`);
    }
    catch (error) {
        next(error);
    }
});
// ==========================================
// Microsoft Calendar OAuth (Requirements 5.1)
// ==========================================
/**
 * GET /api/calendar/microsoft/auth
 * Get Microsoft OAuth authorization URL
 */
router.get('/microsoft/auth', authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const redirectUri = req.query.redirectUri;
        const authUrl = calendarService.getMicrosoftAuthUrl(userId, redirectUri);
        res.json({ authUrl });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/calendar/microsoft/callback
 * Handle Microsoft OAuth callback
 */
router.get('/microsoft/callback', async (req, res, next) => {
    try {
        const { code, state, error, error_description } = req.query;
        if (error) {
            // User denied access or other error
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const errorMsg = error_description || error;
            return res.redirect(`${frontendUrl}/settings?calendar_error=${encodeURIComponent(errorMsg)}`);
        }
        if (!code || !state) {
            throw new ValidationError({
                callback: ['Missing authorization code or state parameter']
            });
        }
        const userId = state;
        await calendarService.handleMicrosoftCallback(userId, code);
        // Redirect to frontend settings page with success
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/settings?calendar_connected=microsoft`);
    }
    catch (error) {
        next(error);
    }
});
// ==========================================
// Calendar Connection Management
// ==========================================
/**
 * GET /api/calendar/status
 * Get calendar connection status for current user
 */
router.get('/status', authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const status = await calendarService.getConnectionStatus(userId);
        res.json(status);
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/calendar/:provider/disconnect
 * Disconnect a calendar provider
 */
router.delete('/:provider/disconnect', authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const provider = req.params.provider;
        if (provider !== 'google' && provider !== 'microsoft') {
            throw new ValidationError({
                provider: ['Invalid provider. Must be "google" or "microsoft"']
            });
        }
        await calendarService.disconnectCalendar(userId, provider);
        res.json({ message: `${provider} calendar disconnected successfully` });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/calendar/connected-providers
 * Get list of connected calendar providers for current user
 */
router.get('/connected-providers', authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const providers = await oauthService.getConnectedProviders(userId);
        res.json({ providers });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=calendar.routes.js.map