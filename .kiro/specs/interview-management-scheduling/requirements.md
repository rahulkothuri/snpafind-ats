# Requirements Document

## Introduction

Phase 3 - Interview Management & Scheduling System for the ATS platform. This module enables scheduling interviews with candidates, integrating with Google Calendar and Microsoft Outlook for calendar sync, supporting multiple video conferencing platforms (Google Meet, Zoom, In-person), sending email notifications to candidates and panel members, collecting structured interview feedback via scorecards, and providing a comprehensive interview dashboard for tracking upcoming interviews and panel workload.

## Glossary

- **Interview_Scheduler**: The system component responsible for creating, updating, and managing interview appointments
- **Calendar_Integration_Service**: The service that syncs interviews with external calendar providers (Google Calendar, Outlook)
- **Email_Service**: The service responsible for sending transactional emails via Resend API (confirmations, reminders, cancellations)
- **Resend**: The email delivery platform used for sending transactional emails with React email templates
- **Feedback_Engine**: The component that manages interview scorecards and feedback collection
- **Interview_Dashboard**: The UI component displaying interview schedules, upcoming interviews, and panel analytics
- **Panel_Member**: A user (interviewer) assigned to conduct an interview
- **Interview_Mode**: The format of the interview (Google Meet, Microsoft Teams, In-person)
- **Scorecard**: A structured feedback form with rating criteria for evaluating candidates
- **SLA_Alert**: A notification triggered when interviews or feedback are overdue

## Requirements

### Requirement 1: Interview Scheduling from Candidate Card

**User Story:** As a recruiter, I want to schedule interviews directly from a candidate's profile card, so that I can quickly set up interviews without navigating away from the pipeline view.

#### Acceptance Criteria

1. WHEN a user clicks "Schedule Interview" on a candidate card, THE Interview_Scheduler SHALL display a scheduling modal with date, time, duration, and interview mode options
2. WHEN scheduling an interview, THE Interview_Scheduler SHALL allow selection of one or more Panel_Members from the company's user list
3. WHEN a valid interview is submitted, THE Interview_Scheduler SHALL create an interview record with status "scheduled"
4. WHEN an interview is created, THE Interview_Scheduler SHALL record the candidate, job, stage, panel members, datetime, duration, timezone, and interview mode
5. IF required fields (date, time, at least one panel member) are missing, THEN THE Interview_Scheduler SHALL display validation errors and prevent submission

### Requirement 2: Interview Mode Support

**User Story:** As a recruiter, I want to specify the interview mode (Google Meet, Microsoft Teams, or In-person), so that candidates and interviewers know how to join the interview.

#### Acceptance Criteria

1. THE Interview_Scheduler SHALL support three interview modes: Google_Meet, Microsoft_Teams, and In_Person
2. WHEN Google_Meet mode is selected, THE Interview_Scheduler SHALL generate a Google Meet link via the Google Calendar API with conferenceData
3. WHEN Microsoft_Teams mode is selected, THE Interview_Scheduler SHALL generate a Teams meeting link via the Microsoft Graph API
4. WHEN In_Person mode is selected, THE Interview_Scheduler SHALL require a location/address field
5. WHEN an interview is created, THE Interview_Scheduler SHALL store the meeting link or location in the interview record

### Requirement 3: Time Zone Support

**User Story:** As a recruiter scheduling interviews across regions, I want to specify time zones, so that all participants see the correct local time.

#### Acceptance Criteria

1. WHEN scheduling an interview, THE Interview_Scheduler SHALL allow selection of a timezone from a standard timezone list (IANA format)
2. THE Interview_Scheduler SHALL store interview times in UTC format internally
3. WHEN displaying interview times, THE Interview_Dashboard SHALL convert UTC to the viewer's local timezone
4. WHEN sending email notifications, THE Email_Service SHALL include the interview time in the recipient's timezone

### Requirement 4: Google Calendar Integration

**User Story:** As an interviewer, I want scheduled interviews to appear on my Google Calendar, so that I can manage my schedule in one place.

#### Acceptance Criteria

1. WHEN a user connects their Google account, THE Calendar_Integration_Service SHALL obtain OAuth 2.0 authorization for calendar access
2. WHEN an interview is scheduled, THE Calendar_Integration_Service SHALL create a calendar event on each panel member's connected Google Calendar
3. WHEN an interview is rescheduled, THE Calendar_Integration_Service SHALL update the corresponding calendar events
4. WHEN an interview is cancelled, THE Calendar_Integration_Service SHALL delete the corresponding calendar events
5. THE Calendar_Integration_Service SHALL include the meeting link, candidate name, job title, and interview details in the calendar event description

### Requirement 5: Microsoft Outlook Calendar Integration

**User Story:** As an interviewer using Outlook, I want scheduled interviews to sync with my Outlook calendar, so that I can see all my appointments in one place.

#### Acceptance Criteria

1. WHEN a user connects their Microsoft account, THE Calendar_Integration_Service SHALL obtain OAuth 2.0 authorization via Microsoft Graph API
2. WHEN an interview is scheduled, THE Calendar_Integration_Service SHALL create a calendar event on each panel member's connected Outlook calendar
3. WHEN an interview is rescheduled, THE Calendar_Integration_Service SHALL update the corresponding Outlook calendar events
4. WHEN an interview is cancelled, THE Calendar_Integration_Service SHALL delete the corresponding Outlook calendar events
5. IF a panel member has both Google and Outlook connected, THE Calendar_Integration_Service SHALL sync to their preferred calendar only

### Requirement 6: Email Notifications to Candidates

**User Story:** As a candidate, I want to receive email confirmations for my interviews, so that I have all the details I need to attend.

#### Acceptance Criteria

1. WHEN an interview is scheduled, THE Email_Service SHALL send a confirmation email to the candidate within 1 minute
2. THE Email_Service SHALL include in the confirmation: interview date/time (in candidate's timezone), duration, interview mode, meeting link or location, interviewer names, and job title
3. WHEN an interview is rescheduled, THE Email_Service SHALL send an update email to the candidate with the new details
4. WHEN an interview is cancelled, THE Email_Service SHALL send a cancellation email to the candidate
5. THE Email_Service SHALL send a reminder email to the candidate 24 hours before the interview

### Requirement 7: Email Notifications to Panel Members

**User Story:** As an interviewer, I want to receive email notifications about my assigned interviews, so that I can prepare in advance.

#### Acceptance Criteria

1. WHEN an interview is scheduled, THE Email_Service SHALL send invitation emails to all panel members
2. THE Email_Service SHALL include in the invitation: candidate name, resume link, job title, interview date/time, duration, and meeting link
3. WHEN an interview is rescheduled, THE Email_Service SHALL notify all panel members of the change
4. WHEN an interview is cancelled, THE Email_Service SHALL notify all panel members
5. THE Email_Service SHALL send a reminder email to panel members 1 hour before the interview

### Requirement 8: Reschedule and Cancel Interviews

**User Story:** As a recruiter, I want to reschedule or cancel interviews, so that I can handle changes in availability.

#### Acceptance Criteria

1. WHEN a user clicks "Reschedule" on an interview, THE Interview_Scheduler SHALL display a modal with the current details pre-filled
2. WHEN rescheduling, THE Interview_Scheduler SHALL allow modification of date, time, duration, mode, and panel members
3. WHEN a reschedule is confirmed, THE Interview_Scheduler SHALL update the interview record and trigger calendar and email updates
4. WHEN a user clicks "Cancel" on an interview, THE Interview_Scheduler SHALL prompt for confirmation and an optional cancellation reason
5. WHEN cancellation is confirmed, THE Interview_Scheduler SHALL mark the interview as "cancelled" and trigger calendar deletion and email notifications

### Requirement 9: Interview Feedback Scorecards

**User Story:** As an interviewer, I want to submit structured feedback using a scorecard, so that hiring decisions are based on consistent evaluation criteria.

#### Acceptance Criteria

1. THE Feedback_Engine SHALL provide a scorecard template with configurable rating criteria (e.g., Technical Skills, Communication, Culture Fit)
2. WHEN an interviewer opens the feedback form, THE Feedback_Engine SHALL display the scorecard with rating scales (1-5) for each criterion
3. THE Feedback_Engine SHALL require a text field for overall comments/notes
4. THE Feedback_Engine SHALL require a recommendation field (Strong Hire, Hire, No Hire, Strong No Hire)
5. WHEN feedback is submitted, THE Feedback_Engine SHALL record the interviewer, timestamp, ratings, comments, and recommendation

### Requirement 10: Auto-Stage Movement Based on Feedback

**User Story:** As a hiring manager, I want candidates to automatically move to the next stage when all feedback is positive, so that the hiring process moves efficiently.

#### Acceptance Criteria

1. WHEN all panel members have submitted feedback for an interview, THE Feedback_Engine SHALL evaluate the aggregate recommendation
2. IF all recommendations are "Strong Hire" or "Hire", THEN THE Feedback_Engine SHALL automatically move the candidate to the next pipeline stage
3. IF any recommendation is "Strong No Hire", THEN THE Feedback_Engine SHALL flag the candidate for review without auto-movement
4. WHEN auto-stage movement occurs, THE system SHALL create a stage history record with "Auto-moved based on interview feedback" comment
5. THE Feedback_Engine SHALL allow disabling auto-stage movement at the company settings level

### Requirement 11: Interview Dashboard - Today's Interviews

**User Story:** As a recruiter, I want to see today's interviews at a glance, so that I can prepare for the day.

#### Acceptance Criteria

1. WHEN a user opens the Interview Dashboard, THE Interview_Dashboard SHALL display a "Today's Interviews" section
2. THE Interview_Dashboard SHALL show each interview with: time, candidate name, job title, interview mode, and panel members
3. THE Interview_Dashboard SHALL sort today's interviews by time ascending
4. WHEN clicking on an interview, THE Interview_Dashboard SHALL navigate to the interview detail view
5. THE Interview_Dashboard SHALL indicate interviews that are in progress, upcoming, or completed

### Requirement 12: Interview Dashboard - Upcoming Interviews

**User Story:** As a recruiter, I want to see upcoming interviews for the week, so that I can plan ahead.

#### Acceptance Criteria

1. THE Interview_Dashboard SHALL display sections for "Tomorrow's Interviews" and "This Week's Interviews"
2. THE Interview_Dashboard SHALL group interviews by date within each section
3. THE Interview_Dashboard SHALL show interview count badges for each day
4. WHEN no interviews are scheduled for a period, THE Interview_Dashboard SHALL display an appropriate empty state message
5. THE Interview_Dashboard SHALL provide filters for job, panel member, and interview mode

### Requirement 13: Panel Load Distribution

**User Story:** As a hiring manager, I want to see how interview load is distributed among panel members, so that I can balance workloads.

#### Acceptance Criteria

1. THE Interview_Dashboard SHALL display a "Panel Load" section showing interview counts per panel member
2. THE Interview_Dashboard SHALL show load for configurable time periods (this week, this month)
3. THE Interview_Dashboard SHALL highlight panel members with unusually high or low interview counts
4. WHEN clicking on a panel member, THE Interview_Dashboard SHALL show their scheduled interviews
5. THE Interview_Dashboard SHALL calculate and display average interviews per panel member

### Requirement 14: Feedback Pending Alerts

**User Story:** As a recruiter, I want to be alerted when interview feedback is pending, so that I can follow up with interviewers.

#### Acceptance Criteria

1. WHEN an interview is completed and feedback is not submitted within 24 hours, THE system SHALL create a "feedback_pending" notification
2. THE Interview_Dashboard SHALL display a "Pending Feedback" section listing interviews awaiting feedback
3. THE system SHALL send email reminders to panel members who haven't submitted feedback after 24 hours
4. WHEN all feedback is submitted for an interview, THE system SHALL mark the interview as "feedback_complete"
5. THE Interview_Dashboard SHALL show the feedback completion percentage for each interview

### Requirement 15: Interview Activity Timeline

**User Story:** As a recruiter, I want to see all interview-related activities on the candidate's timeline, so that I have a complete history.

#### Acceptance Criteria

1. WHEN an interview is scheduled, THE system SHALL add an "interview_scheduled" activity to the candidate's timeline
2. WHEN an interview is rescheduled, THE system SHALL add an "interview_rescheduled" activity with old and new times
3. WHEN an interview is cancelled, THE system SHALL add an "interview_cancelled" activity with the reason
4. WHEN feedback is submitted, THE system SHALL add an "interview_feedback" activity with the recommendation
5. THE candidate profile page SHALL display all interview activities in chronological order

### Requirement 16: Email Template Management

**User Story:** As an admin, I want to customize email templates for interview communications, so that emails match our company branding.

#### Acceptance Criteria

1. THE Email_Service SHALL support customizable templates for: interview confirmation, reschedule notification, cancellation notification, and reminders
2. THE Email_Service SHALL support template variables: {{candidate_name}}, {{job_title}}, {{interview_date}}, {{interview_time}}, {{meeting_link}}, {{interviewer_names}}
3. WHEN sending emails, THE Email_Service SHALL render templates with the appropriate variable values
4. THE system SHALL provide default templates that can be overridden at the company level
5. THE Email_Service SHALL support HTML email templates with company logo and branding

### Requirement 17: Interview Data Persistence

**User Story:** As a system, I want to reliably store and retrieve interview data, so that no scheduling information is lost.

#### Acceptance Criteria

1. THE Interview_Scheduler SHALL persist interview records to the database with all required fields
2. THE system SHALL support querying interviews by: candidate, job, panel member, date range, and status
3. WHEN serializing interview data for API responses, THE system SHALL include all relevant fields in JSON format
4. WHEN deserializing interview data from API requests, THE system SHALL validate all required fields
5. FOR ALL valid interview objects, serializing then deserializing SHALL produce an equivalent object (round-trip property)
