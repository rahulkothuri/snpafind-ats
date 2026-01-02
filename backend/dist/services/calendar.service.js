import { oauthService } from './oauth.service.js';
import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
/**
 * Calendar Integration Service
 * Handles OAuth and calendar event management for Google and Microsoft
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5
 */
// Google OAuth2 Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/calendar/google/callback';
// Microsoft OAuth2 Configuration
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || '';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/calendar/microsoft/callback';
// Google Calendar API scopes
const GOOGLE_CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
];
// Microsoft Graph API scopes
const MICROSOFT_GRAPH_SCOPES = [
    'Calendars.ReadWrite',
    'OnlineMeetings.ReadWrite',
    'offline_access',
];
/**
 * Calendar Service
 */
export const calendarService = {
    // ==========================================
    // Google Calendar OAuth Flow (Requirements 4.1)
    // ==========================================
    /**
     * Generate Google OAuth authorization URL
     */
    getGoogleAuthUrl(userId, redirectUri) {
        if (!GOOGLE_CLIENT_ID) {
            throw new ValidationError({ google: ['Google OAuth is not configured'] });
        }
        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: redirectUri || GOOGLE_REDIRECT_URI,
            response_type: 'code',
            scope: GOOGLE_CALENDAR_SCOPES.join(' '),
            access_type: 'offline',
            prompt: 'consent',
            state: userId, // Pass userId in state for callback
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    },
    /**
     * Handle Google OAuth callback and exchange code for tokens
     */
    async handleGoogleCallback(userId, code) {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            throw new ValidationError({ google: ['Google OAuth is not configured'] });
        }
        // Exchange authorization code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: GOOGLE_REDIRECT_URI,
            }),
        });
        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Google token exchange failed:', error);
            throw new ValidationError({ google: ['Failed to exchange authorization code'] });
        }
        const tokenData = await tokenResponse.json();
        // Calculate expiry time
        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
        // Store tokens securely
        await oauthService.storeToken(userId, 'google', {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt,
            scope: tokenData.scope,
        });
    },
    /**
     * Refresh Google access token
     */
    async refreshGoogleToken(refreshToken) {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            throw new ValidationError({ google: ['Google OAuth is not configured'] });
        }
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });
        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Google token refresh failed:', error);
            throw new Error('Failed to refresh Google token');
        }
        const tokenData = await tokenResponse.json();
        return {
            accessToken: tokenData.access_token,
            refreshToken, // Keep the same refresh token
            expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
            scope: tokenData.scope,
        };
    },
    // ==========================================
    // Microsoft Graph OAuth Flow (Requirements 5.1)
    // ==========================================
    /**
     * Generate Microsoft OAuth authorization URL
     */
    getMicrosoftAuthUrl(userId, redirectUri) {
        if (!MICROSOFT_CLIENT_ID) {
            throw new ValidationError({ microsoft: ['Microsoft OAuth is not configured'] });
        }
        const params = new URLSearchParams({
            client_id: MICROSOFT_CLIENT_ID,
            redirect_uri: redirectUri || MICROSOFT_REDIRECT_URI,
            response_type: 'code',
            scope: MICROSOFT_GRAPH_SCOPES.join(' '),
            response_mode: 'query',
            state: userId, // Pass userId in state for callback
        });
        return `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
    },
    /**
     * Handle Microsoft OAuth callback and exchange code for tokens
     */
    async handleMicrosoftCallback(userId, code) {
        if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
            throw new ValidationError({ microsoft: ['Microsoft OAuth is not configured'] });
        }
        // Exchange authorization code for tokens
        const tokenResponse = await fetch(`https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: MICROSOFT_CLIENT_ID,
                client_secret: MICROSOFT_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: MICROSOFT_REDIRECT_URI,
                scope: MICROSOFT_GRAPH_SCOPES.join(' '),
            }),
        });
        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Microsoft token exchange failed:', error);
            throw new ValidationError({ microsoft: ['Failed to exchange authorization code'] });
        }
        const tokenData = await tokenResponse.json();
        // Calculate expiry time
        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
        // Store tokens securely
        await oauthService.storeToken(userId, 'microsoft', {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt,
            scope: tokenData.scope,
        });
    },
    /**
     * Refresh Microsoft access token
     */
    async refreshMicrosoftToken(refreshToken) {
        if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
            throw new ValidationError({ microsoft: ['Microsoft OAuth is not configured'] });
        }
        const tokenResponse = await fetch(`https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: MICROSOFT_CLIENT_ID,
                client_secret: MICROSOFT_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
                scope: MICROSOFT_GRAPH_SCOPES.join(' '),
            }),
        });
        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Microsoft token refresh failed:', error);
            throw new Error('Failed to refresh Microsoft token');
        }
        const tokenData = await tokenResponse.json();
        return {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || refreshToken,
            expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
            scope: tokenData.scope,
        };
    },
    // ==========================================
    // Calendar Connection Management
    // ==========================================
    /**
     * Disconnect a calendar provider for a user
     */
    async disconnectCalendar(userId, provider) {
        // Delete OAuth token
        await oauthService.deleteToken(userId, provider);
        // Delete associated calendar events
        await prisma.calendarEvent.deleteMany({
            where: {
                userId,
                provider,
            },
        });
    },
    /**
     * Get calendar connection status for a user
     */
    async getConnectionStatus(userId) {
        const [googleToken, microsoftToken] = await Promise.all([
            oauthService.getToken(userId, 'google'),
            oauthService.getToken(userId, 'microsoft'),
        ]);
        return {
            google: {
                connected: !!googleToken,
                email: googleToken?.scope?.includes('@') ? undefined : undefined, // Email not stored in token
                connectedAt: googleToken?.createdAt?.toISOString(),
            },
            microsoft: {
                connected: !!microsoftToken,
                email: undefined, // Email not stored in token
                connectedAt: microsoftToken?.createdAt?.toISOString(),
            },
        };
    },
    // ==========================================
    // Google Calendar Event Operations (Requirements 4.2, 4.3, 4.4, 4.5)
    // ==========================================
    /**
     * Get valid Google access token with auto-refresh
     */
    async getGoogleAccessToken(userId) {
        const accessToken = await oauthService.getValidAccessToken(userId, 'google', this.refreshGoogleToken.bind(this));
        if (!accessToken) {
            throw new NotFoundError('Google calendar connection');
        }
        return accessToken;
    },
    /**
     * Create a Google Calendar event with optional Google Meet link
     * Requirements: 2.2, 4.2, 4.5
     */
    async createGoogleCalendarEvent(userId, input) {
        const accessToken = await this.getGoogleAccessToken(userId);
        // Build event payload
        const event = {
            summary: input.title,
            description: input.description,
            start: {
                dateTime: input.startTime.toISOString(),
                timeZone: input.timezone,
            },
            end: {
                dateTime: input.endTime.toISOString(),
                timeZone: input.timezone,
            },
            attendees: input.attendees.map(a => ({
                email: a.email,
                displayName: a.name,
            })),
        };
        // Add conference data for Google Meet if requested
        if (input.createMeetingLink) {
            event.conferenceData = {
                createRequest: {
                    requestId: input.interviewId,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            };
        }
        // Create calendar event via Google Calendar API
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });
        if (!response.ok) {
            const error = await response.text();
            console.error('Google Calendar event creation failed:', error);
            throw new Error('Failed to create Google Calendar event');
        }
        const createdEvent = await response.json();
        // Extract meeting link from conference data
        const meetingLink = createdEvent.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri;
        // Store calendar event reference
        await prisma.calendarEvent.create({
            data: {
                interviewId: input.interviewId,
                userId,
                provider: 'google',
                externalId: createdEvent.id,
            },
        });
        return {
            provider: 'google',
            eventId: createdEvent.id,
            meetingLink,
        };
    },
    /**
     * Update a Google Calendar event
     * Requirements: 4.3
     */
    async updateGoogleCalendarEvent(userId, interviewId, input) {
        const accessToken = await this.getGoogleAccessToken(userId);
        // Get existing calendar event reference
        const calendarEvent = await prisma.calendarEvent.findFirst({
            where: {
                interviewId,
                userId,
                provider: 'google',
            },
        });
        if (!calendarEvent) {
            throw new NotFoundError('Google calendar event');
        }
        // Build update payload
        const updatePayload = {};
        if (input.title) {
            updatePayload.summary = input.title;
        }
        if (input.description) {
            updatePayload.description = input.description;
        }
        if (input.startTime && input.timezone) {
            updatePayload.start = {
                dateTime: input.startTime.toISOString(),
                timeZone: input.timezone,
            };
        }
        if (input.endTime && input.timezone) {
            updatePayload.end = {
                dateTime: input.endTime.toISOString(),
                timeZone: input.timezone,
            };
        }
        if (input.attendees) {
            updatePayload.attendees = input.attendees.map(a => ({
                email: a.email,
                displayName: a.name,
            }));
        }
        // Update calendar event via Google Calendar API
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEvent.externalId}?sendUpdates=all`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload),
        });
        if (!response.ok) {
            const error = await response.text();
            console.error('Google Calendar event update failed:', error);
            throw new Error('Failed to update Google Calendar event');
        }
        const updatedEvent = await response.json();
        const meetingLink = updatedEvent.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri;
        return {
            provider: 'google',
            eventId: updatedEvent.id,
            meetingLink,
        };
    },
    /**
     * Delete a Google Calendar event
     * Requirements: 4.4
     */
    async deleteGoogleCalendarEvent(userId, interviewId) {
        const accessToken = await this.getGoogleAccessToken(userId);
        // Get existing calendar event reference
        const calendarEvent = await prisma.calendarEvent.findFirst({
            where: {
                interviewId,
                userId,
                provider: 'google',
            },
        });
        if (!calendarEvent) {
            // No event to delete
            return;
        }
        // Delete calendar event via Google Calendar API
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEvent.externalId}?sendUpdates=all`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (!response.ok && response.status !== 404) {
            const error = await response.text();
            console.error('Google Calendar event deletion failed:', error);
            throw new Error('Failed to delete Google Calendar event');
        }
        // Delete calendar event reference from database
        await prisma.calendarEvent.delete({
            where: { id: calendarEvent.id },
        });
    },
    // ==========================================
    // Microsoft Outlook Calendar Event Operations (Requirements 5.2, 5.3, 5.4, 5.5)
    // ==========================================
    /**
     * Get valid Microsoft access token with auto-refresh
     */
    async getMicrosoftAccessToken(userId) {
        const accessToken = await oauthService.getValidAccessToken(userId, 'microsoft', this.refreshMicrosoftToken.bind(this));
        if (!accessToken) {
            throw new NotFoundError('Microsoft calendar connection');
        }
        return accessToken;
    },
    /**
     * Create a Microsoft Outlook Calendar event with optional Teams meeting link
     * Requirements: 2.3, 5.2, 5.5
     */
    async createMicrosoftCalendarEvent(userId, input) {
        const accessToken = await this.getMicrosoftAccessToken(userId);
        // Build event payload
        const event = {
            subject: input.title,
            body: {
                contentType: 'HTML',
                content: input.description,
            },
            start: {
                dateTime: input.startTime.toISOString().replace('Z', ''),
                timeZone: input.timezone,
            },
            end: {
                dateTime: input.endTime.toISOString().replace('Z', ''),
                timeZone: input.timezone,
            },
            attendees: input.attendees.map(a => ({
                emailAddress: {
                    address: a.email,
                    name: a.name,
                },
                type: 'required',
            })),
        };
        // Add Teams meeting if requested
        if (input.createMeetingLink) {
            event.isOnlineMeeting = true;
            event.onlineMeetingProvider = 'teamsForBusiness';
        }
        // Create calendar event via Microsoft Graph API
        const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });
        if (!response.ok) {
            const error = await response.text();
            console.error('Microsoft Calendar event creation failed:', error);
            throw new Error('Failed to create Microsoft Calendar event');
        }
        const createdEvent = await response.json();
        // Extract meeting link
        const meetingLink = createdEvent.onlineMeeting?.joinUrl;
        // Store calendar event reference
        await prisma.calendarEvent.create({
            data: {
                interviewId: input.interviewId,
                userId,
                provider: 'microsoft',
                externalId: createdEvent.id,
            },
        });
        return {
            provider: 'microsoft',
            eventId: createdEvent.id,
            meetingLink,
        };
    },
    /**
     * Update a Microsoft Outlook Calendar event
     * Requirements: 5.3
     */
    async updateMicrosoftCalendarEvent(userId, interviewId, input) {
        const accessToken = await this.getMicrosoftAccessToken(userId);
        // Get existing calendar event reference
        const calendarEvent = await prisma.calendarEvent.findFirst({
            where: {
                interviewId,
                userId,
                provider: 'microsoft',
            },
        });
        if (!calendarEvent) {
            throw new NotFoundError('Microsoft calendar event');
        }
        // Build update payload
        const updatePayload = {};
        if (input.title) {
            updatePayload.subject = input.title;
        }
        if (input.description) {
            updatePayload.body = {
                contentType: 'HTML',
                content: input.description,
            };
        }
        if (input.startTime && input.timezone) {
            updatePayload.start = {
                dateTime: input.startTime.toISOString().replace('Z', ''),
                timeZone: input.timezone,
            };
        }
        if (input.endTime && input.timezone) {
            updatePayload.end = {
                dateTime: input.endTime.toISOString().replace('Z', ''),
                timeZone: input.timezone,
            };
        }
        if (input.attendees) {
            updatePayload.attendees = input.attendees.map(a => ({
                emailAddress: {
                    address: a.email,
                    name: a.name,
                },
                type: 'required',
            }));
        }
        // Update calendar event via Microsoft Graph API
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${calendarEvent.externalId}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload),
        });
        if (!response.ok) {
            const error = await response.text();
            console.error('Microsoft Calendar event update failed:', error);
            throw new Error('Failed to update Microsoft Calendar event');
        }
        const updatedEvent = await response.json();
        const meetingLink = updatedEvent.onlineMeeting?.joinUrl;
        return {
            provider: 'microsoft',
            eventId: updatedEvent.id,
            meetingLink,
        };
    },
    /**
     * Delete a Microsoft Outlook Calendar event
     * Requirements: 5.4
     */
    async deleteMicrosoftCalendarEvent(userId, interviewId) {
        const accessToken = await this.getMicrosoftAccessToken(userId);
        // Get existing calendar event reference
        const calendarEvent = await prisma.calendarEvent.findFirst({
            where: {
                interviewId,
                userId,
                provider: 'microsoft',
            },
        });
        if (!calendarEvent) {
            // No event to delete
            return;
        }
        // Delete calendar event via Microsoft Graph API
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${calendarEvent.externalId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (!response.ok && response.status !== 404) {
            const error = await response.text();
            console.error('Microsoft Calendar event deletion failed:', error);
            throw new Error('Failed to delete Microsoft Calendar event');
        }
        // Delete calendar event reference from database
        await prisma.calendarEvent.delete({
            where: { id: calendarEvent.id },
        });
    },
    // ==========================================
    // Unified Calendar Operations
    // ==========================================
    /**
     * Create calendar events for all panel members with connected calendars
     * Returns the meeting link if generated
     */
    async createCalendarEventsForInterview(interviewId, panelMemberIds, input) {
        let meetingLink;
        for (const userId of panelMemberIds) {
            const connectionStatus = await this.getConnectionStatus(userId);
            // Try Google Calendar first
            if (connectionStatus.google.connected) {
                try {
                    console.log(`Attempting to create Google Calendar event for user ${userId}`);
                    const result = await this.createGoogleCalendarEvent(userId, {
                        ...input,
                        interviewId,
                    });
                    console.log(`Google Calendar event created for ${userId}, Link: ${result.meetingLink}`);
                    if (result.meetingLink && !meetingLink) {
                        meetingLink = result.meetingLink;
                    }
                }
                catch (error) {
                    console.error(`Failed to create Google calendar event for user ${userId}:`, error);
                }
            }
            else {
                console.log(`User ${userId} is not connected to Google Calendar. Skipping...`);
            }
            // Try Microsoft Calendar
            if (connectionStatus.microsoft.connected) {
                try {
                    console.log(`Attempting to create Microsoft Calendar event for user ${userId}`);
                    const result = await this.createMicrosoftCalendarEvent(userId, {
                        ...input,
                        interviewId,
                    });
                    console.log(`Microsoft Calendar event created for ${userId}, Link: ${result.meetingLink}`);
                    if (result.meetingLink && !meetingLink) {
                        meetingLink = result.meetingLink;
                    }
                }
                catch (error) {
                    console.error(`Failed to create Microsoft calendar event for user ${userId}:`, error);
                }
            }
            else {
                console.log(`User ${userId} is not connected to Microsoft Calendar. Skipping...`);
            }
        }
        return meetingLink;
    },
    /**
     * Update calendar events for all panel members with connected calendars
     */
    async updateCalendarEventsForInterview(interviewId, panelMemberIds, input) {
        for (const userId of panelMemberIds) {
            // Get all calendar events for this interview and user
            const calendarEvents = await prisma.calendarEvent.findMany({
                where: {
                    interviewId,
                    userId,
                },
            });
            for (const event of calendarEvents) {
                try {
                    if (event.provider === 'google') {
                        await this.updateGoogleCalendarEvent(userId, interviewId, input);
                    }
                    else if (event.provider === 'microsoft') {
                        await this.updateMicrosoftCalendarEvent(userId, interviewId, input);
                    }
                }
                catch (error) {
                    console.error(`Failed to update ${event.provider} calendar event for user ${userId}:`, error);
                }
            }
        }
    },
    /**
     * Delete calendar events for all panel members
     */
    async deleteCalendarEventsForInterview(interviewId, panelMemberIds) {
        for (const userId of panelMemberIds) {
            // Get all calendar events for this interview and user
            const calendarEvents = await prisma.calendarEvent.findMany({
                where: {
                    interviewId,
                    userId,
                },
            });
            for (const event of calendarEvents) {
                try {
                    if (event.provider === 'google') {
                        await this.deleteGoogleCalendarEvent(userId, interviewId);
                    }
                    else if (event.provider === 'microsoft') {
                        await this.deleteMicrosoftCalendarEvent(userId, interviewId);
                    }
                }
                catch (error) {
                    console.error(`Failed to delete ${event.provider} calendar event for user ${userId}:`, error);
                }
            }
        }
    },
    /**
     * Generate meeting link based on interview mode
     * Requirements: 2.2, 2.3, 2.4, 2.5
     */
    async generateMeetingLink(interviewId, mode, schedulerUserId, eventInput) {
        if (mode === 'in_person') {
            // No meeting link for in-person interviews
            return undefined;
        }
        const connectionStatus = await this.getConnectionStatus(schedulerUserId);
        if (mode === 'google_meet') {
            if (!connectionStatus.google.connected) {
                console.warn('Google Calendar not connected for meeting link generation');
                return undefined;
            }
            try {
                const result = await this.createGoogleCalendarEvent(schedulerUserId, {
                    ...eventInput,
                    interviewId,
                    createMeetingLink: true,
                });
                return result.meetingLink;
            }
            catch (error) {
                console.error('Failed to generate Google Meet link:', error);
                return undefined;
            }
        }
        if (mode === 'microsoft_teams') {
            if (!connectionStatus.microsoft.connected) {
                console.warn('Microsoft Calendar not connected for meeting link generation');
                return undefined;
            }
            try {
                const result = await this.createMicrosoftCalendarEvent(schedulerUserId, {
                    ...eventInput,
                    interviewId,
                    createMeetingLink: true,
                });
                return result.meetingLink;
            }
            catch (error) {
                console.error('Failed to generate Teams meeting link:', error);
                return undefined;
            }
        }
        return undefined;
    },
};
export default calendarService;
//# sourceMappingURL=calendar.service.js.map