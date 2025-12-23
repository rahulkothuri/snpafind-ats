# Implementation Plan: Interview Management & Scheduling System

## Overview

This implementation plan covers Phase 3 of the ATS platform - Interview Management & Scheduling System. The implementation uses TypeScript for both backend (Express/Prisma) and frontend (React), integrating with Google Calendar API, Microsoft Graph API, and Resend for email delivery.

## Tasks

- [x] 1. Database Schema and Models
  - [x] 1.1 Create Prisma schema migrations for interview models
    - Add Interview, InterviewPanel, InterviewFeedback models
    - Add CalendarEvent, OAuthToken models
    - Add EmailTemplate, ScorecardTemplate models
    - Add CompanySettings model
    - Add enums: InterviewMode, InterviewStatus, InterviewRecommendation
    - Update User model with new relations
    - _Requirements: 17.1, 9.5, 4.5, 16.1_

  - [x] 1.2 Run migrations and generate Prisma client
    - Execute `prisma migrate dev`
    - Verify all models are created correctly
    - _Requirements: 17.1_

  - [ ]* 1.3 Write property test for interview serialization round-trip
    - **Property 13: Interview Serialization Round-Trip**
    - **Validates: Requirements 17.3, 17.4, 17.5**

- [-] 2. Core Interview Service
  - [x] 2.1 Create interview service with CRUD operations
    - Implement createInterview with validation
    - Implement updateInterview for rescheduling
    - Implement cancelInterview with reason
    - Implement getInterview and listInterviews with filters
    - _Requirements: 1.3, 1.4, 8.3, 8.5, 17.1, 17.2_

  - [ ]* 2.2 Write property test for interview creation completeness
    - **Property 1: Interview Creation Completeness**
    - **Validates: Requirements 1.3, 1.4, 17.1**

  - [ ]* 2.3 Write property test for interview validation
    - **Property 2: Interview Validation Rejects Invalid Input**
    - **Validates: Requirements 1.5**

  - [ ]* 2.4 Write property test for interview query filters
    - **Property 12: Interview Query Filters**
    - **Validates: Requirements 17.2**

- [x] 3. Checkpoint - Core Interview Service
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Calendar Integration Service
  - [x] 4.1 Create OAuth token management utilities
    - Implement token storage and retrieval
    - Implement token refresh logic
    - Implement token encryption for security
    - _Requirements: 4.1, 5.1_

  - [x] 4.2 Implement Google Calendar OAuth flow
    - Create getGoogleAuthUrl endpoint
    - Create handleGoogleCallback endpoint
    - Store tokens securely in OAuthToken table
    - _Requirements: 4.1_

  - [x] 4.3 Implement Microsoft Graph OAuth flow
    - Create getMicrosoftAuthUrl endpoint
    - Create handleMicrosoftCallback endpoint
    - Store tokens securely in OAuthToken table
    - _Requirements: 5.1_

  - [x] 4.4 Implement Google Calendar event operations
    - Create calendar event with Google Meet link
    - Update calendar event on reschedule
    - Delete calendar event on cancel
    - Include meeting details in event description
    - _Requirements: 2.2, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.5 Implement Microsoft Outlook calendar event operations
    - Create calendar event with Teams meeting link
    - Update calendar event on reschedule
    - Delete calendar event on cancel
    - Include meeting details in event description
    - _Requirements: 2.3, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 4.6 Write property test for meeting link generation
    - **Property 3: Meeting Link Generation by Mode**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

  - [ ]* 4.7 Write property test for calendar event lifecycle
    - **Property 5: Calendar Event Lifecycle Sync**
    - **Validates: Requirements 4.2, 4.3, 4.4, 5.2, 5.3, 5.4**

- [x] 5. Checkpoint - Calendar Integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Timezone Handling
  - [x] 6.1 Implement timezone utilities
    - Create UTC conversion functions using date-fns-tz
    - Create display formatting functions
    - Create timezone list provider (IANA timezones)
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 6.2 Write property test for UTC time storage
    - **Property 4: UTC Time Storage Invariant**
    - **Validates: Requirements 3.2, 3.3**

- [x] 7. Email Service with Resend
  - [x] 7.1 Set up Resend client and configuration
    - Install resend package
    - Create email service with Resend client
    - Configure sender domain
    - _Requirements: 6.1, 7.1_

  - [x] 7.2 Create email template system
    - Implement template storage and retrieval
    - Implement variable substitution engine
    - Create default templates for all email types
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 7.3 Implement interview notification emails
    - Send confirmation to candidate on schedule
    - Send invitation to panel members on schedule
    - Send update emails on reschedule
    - Send cancellation emails on cancel
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

  - [x] 7.4 Implement reminder emails
    - Send candidate reminder 24 hours before
    - Send panel member reminder 1 hour before
    - _Requirements: 6.5, 7.5_

  - [ ]* 7.5 Write property test for email content completeness
    - **Property 6: Email Notification Completeness**
    - **Validates: Requirements 6.2, 3.4**

  - [ ]* 7.6 Write property test for email lifecycle triggers
    - **Property 7: Interview Lifecycle Email Triggers**
    - **Validates: Requirements 6.1, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4**

  - [ ]* 7.7 Write property test for template variable substitution
    - **Property 15: Email Template Variable Substitution**
    - **Validates: Requirements 16.2, 16.3**

- [x] 8. Checkpoint - Email Service
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Feedback Service
  - [x] 9.1 Create feedback service with scorecard support
    - Implement submitFeedback with validation
    - Implement getInterviewFeedback
    - Implement isAllFeedbackComplete
    - Implement getPendingFeedback for user
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 9.2 Implement scorecard template management
    - Create default scorecard criteria
    - Allow company-level customization
    - _Requirements: 9.1_

  - [x] 9.3 Implement auto-stage movement logic
    - Evaluate aggregate recommendations
    - Move candidate on positive feedback
    - Flag for review on strong_no_hire
    - Create stage history record
    - Respect company settings for enable/disable
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 9.4 Write property test for feedback recording
    - **Property 8: Feedback Recording Completeness**
    - **Validates: Requirements 9.5**

  - [ ]* 9.5 Write property test for auto-stage movement
    - **Property 9: Auto-Stage Movement Logic**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [x] 10. Checkpoint - Feedback Service
  - Ensure all tests pass, ask the user if questions arise.

- [-] 11. Notifications and Alerts
  - [x] 11.1 Implement feedback pending notifications
    - Create notification when feedback overdue (24 hours)
    - Send email reminder to panel members
    - Mark interview as feedback_complete when done
    - _Requirements: 14.1, 14.3, 14.4_

  - [ ]* 11.2 Write property test for feedback pending notifications
    - **Property 10: Feedback Pending Notification**
    - **Validates: Requirements 14.1, 14.3**

- [x] 12. Activity Timeline Integration
  - [x] 12.1 Implement interview activity recording
    - Record interview_scheduled activity
    - Record interview_rescheduled activity with old/new times
    - Record interview_cancelled activity with reason
    - Record interview_feedback activity with recommendation
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ]* 12.2 Write property test for activity timeline
    - **Property 11: Interview Activity Timeline Recording**
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

- [x] 13. Interview API Routes
  - [x] 13.1 Create interview routes
    - POST /api/interviews - Create interview
    - GET /api/interviews - List with filters
    - GET /api/interviews/:id - Get details
    - PUT /api/interviews/:id - Update/reschedule
    - DELETE /api/interviews/:id - Cancel
    - _Requirements: 1.1, 1.2, 8.1, 8.2, 8.4_

  - [x] 13.2 Create dashboard routes
    - GET /api/interviews/dashboard - Today, tomorrow, week
    - GET /api/interviews/panel-load - Load distribution
    - _Requirements: 11.1, 11.2, 11.3, 12.1, 12.2, 13.1, 13.2_

  - [x] 13.3 Create feedback routes
    - POST /api/interviews/:id/feedback - Submit feedback
    - GET /api/interviews/:id/feedback - Get feedback
    - GET /api/interviews/pending-feedback - Pending for user
    - _Requirements: 9.2, 14.2, 14.5_

  - [x] 13.4 Create calendar OAuth routes
    - GET /api/calendar/google/auth
    - GET /api/calendar/google/callback
    - GET /api/calendar/microsoft/auth
    - GET /api/calendar/microsoft/callback
    - DELETE /api/calendar/:provider/disconnect
    - _Requirements: 4.1, 5.1_

  - [x] 13.5 Create email template routes
    - GET /api/email-templates
    - PUT /api/email-templates/:key
    - _Requirements: 16.4_

  - [ ]* 13.6 Write property test for panel load calculation
    - **Property 14: Panel Load Calculation Accuracy**
    - **Validates: Requirements 13.1, 13.2, 13.5**

- [x] 14. Checkpoint - Backend API Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Frontend - Interview Scheduling
  - [x] 15.1 Create InterviewScheduleModal component
    - Date/time picker with timezone selection
    - Duration selector (30, 45, 60, 90 min)
    - Interview mode selector (Google Meet, Teams, In-person)
    - Panel member multi-select
    - Location field for in-person
    - Notes field
    - _Requirements: 1.1, 1.2, 2.1, 3.1_

  - [x] 15.2 Create interview service hooks
    - useCreateInterview mutation
    - useUpdateInterview mutation
    - useCancelInterview mutation
    - useInterviews query with filters
    - _Requirements: 1.3, 8.3, 8.5_

  - [x] 15.3 Integrate scheduling modal with candidate card
    - Add "Schedule Interview" button to candidate card
    - Open modal with candidate context
    - Handle success/error states
    - _Requirements: 1.1_

- [x] 16. Frontend - Interview Dashboard
  - [x] 16.1 Create InterviewDashboardPage
    - Today's interviews section
    - Tomorrow's interviews section
    - This week's interviews section
    - Pending feedback section
    - _Requirements: 11.1, 11.2, 11.3, 12.1, 12.2_

  - [x] 16.2 Create InterviewCard component
    - Display time, candidate, job, mode, panel
    - Status indicators (upcoming, in progress, completed)
    - Quick actions (reschedule, cancel, view)
    - _Requirements: 11.4, 11.5_

  - [x] 16.3 Create PanelLoadChart component
    - Bar chart showing interviews per panel member
    - Time period selector (week/month)
    - Highlight high/low load
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 16.4 Create dashboard filters
    - Filter by job
    - Filter by panel member
    - Filter by interview mode
    - _Requirements: 12.5_

- [x] 17. Frontend - Feedback Scorecard
  - [x] 17.1 Create FeedbackScorecard component
    - Rating criteria with 1-5 scale
    - Comments field per criterion
    - Overall comments textarea
    - Recommendation selector
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 17.2 Create FeedbackSummary component
    - Display all submitted feedback
    - Show aggregate scores
    - Show recommendations
    - _Requirements: 14.5_

  - [x] 17.3 Integrate feedback with interview detail view
    - Show feedback form for panel members
    - Show feedback summary for all users
    - _Requirements: 9.2_

- [x] 18. Frontend - Calendar Integration UI
  - [x] 18.1 Create CalendarConnectionSettings component
    - Connect Google Calendar button
    - Connect Microsoft Outlook button
    - Show connection status
    - Disconnect option
    - _Requirements: 4.1, 5.1_

  - [x] 18.2 Handle OAuth callback pages
    - Google callback success/error page
    - Microsoft callback success/error page
    - _Requirements: 4.1, 5.1_

- [x] 19. Frontend - Reschedule and Cancel
  - [x] 19.1 Create RescheduleModal component
    - Pre-fill current interview details
    - Allow modification of all fields
    - Show change summary before confirm
    - _Requirements: 8.1, 8.2_

  - [x] 19.2 Create CancelConfirmationModal component
    - Confirmation prompt
    - Optional cancellation reason
    - _Requirements: 8.4_

- [x] 20. Checkpoint - Frontend Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Integration and Wiring
  - [x] 21.1 Wire interview scheduling to calendar sync
    - Trigger calendar event creation on interview create
    - Trigger calendar event update on reschedule
    - Trigger calendar event delete on cancel
    - _Requirements: 4.2, 4.3, 4.4, 5.2, 5.3, 5.4_

  - [x] 21.2 Wire interview scheduling to email notifications
    - Send confirmation emails on create
    - Send update emails on reschedule
    - Send cancellation emails on cancel
    - _Requirements: 6.1, 6.3, 6.4, 7.1, 7.3, 7.4_

  - [x] 21.3 Wire feedback submission to auto-stage movement
    - Check if all feedback complete
    - Evaluate recommendations
    - Trigger stage movement if applicable
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 21.4 Wire interview actions to activity timeline
    - Create activities for all interview events
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 21.5 Add interview routes to main router
    - Register all interview routes
    - Add authentication middleware
    - Add RBAC middleware
    - _Requirements: All_

- [ ] 22. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all integrations work end-to-end
  - Test OAuth flows with real Google/Microsoft accounts
  - Test email delivery with Resend

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- External API integrations (Google, Microsoft, Resend) require valid API credentials for full testing
