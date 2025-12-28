import { OAuthTokenData, OAuthProvider } from './oauth.service.js';
export interface CalendarEventResult {
    provider: OAuthProvider;
    eventId: string;
    meetingLink?: string;
}
export interface CalendarEventInput {
    interviewId: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    timezone: string;
    attendees: Array<{
        email: string;
        name?: string;
    }>;
    createMeetingLink: boolean;
}
export interface CalendarEventUpdateInput {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    timezone?: string;
    attendees?: Array<{
        email: string;
        name?: string;
    }>;
}
/**
 * Calendar Service
 */
export declare const calendarService: {
    /**
     * Generate Google OAuth authorization URL
     */
    getGoogleAuthUrl(userId: string, redirectUri?: string): string;
    /**
     * Handle Google OAuth callback and exchange code for tokens
     */
    handleGoogleCallback(userId: string, code: string): Promise<void>;
    /**
     * Refresh Google access token
     */
    refreshGoogleToken(refreshToken: string): Promise<OAuthTokenData>;
    /**
     * Generate Microsoft OAuth authorization URL
     */
    getMicrosoftAuthUrl(userId: string, redirectUri?: string): string;
    /**
     * Handle Microsoft OAuth callback and exchange code for tokens
     */
    handleMicrosoftCallback(userId: string, code: string): Promise<void>;
    /**
     * Refresh Microsoft access token
     */
    refreshMicrosoftToken(refreshToken: string): Promise<OAuthTokenData>;
    /**
     * Disconnect a calendar provider for a user
     */
    disconnectCalendar(userId: string, provider: OAuthProvider): Promise<void>;
    /**
     * Get calendar connection status for a user
     */
    getConnectionStatus(userId: string): Promise<{
        google: {
            connected: boolean;
            email?: string;
            connectedAt?: string;
        };
        microsoft: {
            connected: boolean;
            email?: string;
            connectedAt?: string;
        };
    }>;
    /**
     * Get valid Google access token with auto-refresh
     */
    getGoogleAccessToken(userId: string): Promise<string>;
    /**
     * Create a Google Calendar event with optional Google Meet link
     * Requirements: 2.2, 4.2, 4.5
     */
    createGoogleCalendarEvent(userId: string, input: CalendarEventInput): Promise<CalendarEventResult>;
    /**
     * Update a Google Calendar event
     * Requirements: 4.3
     */
    updateGoogleCalendarEvent(userId: string, interviewId: string, input: CalendarEventUpdateInput): Promise<CalendarEventResult>;
    /**
     * Delete a Google Calendar event
     * Requirements: 4.4
     */
    deleteGoogleCalendarEvent(userId: string, interviewId: string): Promise<void>;
    /**
     * Get valid Microsoft access token with auto-refresh
     */
    getMicrosoftAccessToken(userId: string): Promise<string>;
    /**
     * Create a Microsoft Outlook Calendar event with optional Teams meeting link
     * Requirements: 2.3, 5.2, 5.5
     */
    createMicrosoftCalendarEvent(userId: string, input: CalendarEventInput): Promise<CalendarEventResult>;
    /**
     * Update a Microsoft Outlook Calendar event
     * Requirements: 5.3
     */
    updateMicrosoftCalendarEvent(userId: string, interviewId: string, input: CalendarEventUpdateInput): Promise<CalendarEventResult>;
    /**
     * Delete a Microsoft Outlook Calendar event
     * Requirements: 5.4
     */
    deleteMicrosoftCalendarEvent(userId: string, interviewId: string): Promise<void>;
    /**
     * Create calendar events for all panel members with connected calendars
     * Returns the meeting link if generated
     */
    createCalendarEventsForInterview(interviewId: string, panelMemberIds: string[], input: Omit<CalendarEventInput, "interviewId">): Promise<string | undefined>;
    /**
     * Update calendar events for all panel members with connected calendars
     */
    updateCalendarEventsForInterview(interviewId: string, panelMemberIds: string[], input: CalendarEventUpdateInput): Promise<void>;
    /**
     * Delete calendar events for all panel members
     */
    deleteCalendarEventsForInterview(interviewId: string, panelMemberIds: string[]): Promise<void>;
    /**
     * Generate meeting link based on interview mode
     * Requirements: 2.2, 2.3, 2.4, 2.5
     */
    generateMeetingLink(interviewId: string, mode: "google_meet" | "microsoft_teams" | "in_person", schedulerUserId: string, eventInput: Omit<CalendarEventInput, "interviewId" | "createMeetingLink">): Promise<string | undefined>;
};
export default calendarService;
//# sourceMappingURL=calendar.service.d.ts.map