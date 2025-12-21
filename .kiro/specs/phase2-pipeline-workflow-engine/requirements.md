# Requirements Document

## Introduction

This document defines the requirements for completing Phase 2 of the SnapFind ATS - the Candidate Pipeline & Workflow Engine. This phase builds the heart of the ATS by implementing comprehensive candidate tracking, stage movement with timestamps, bulk operations, stage-level comments, role-wise pipeline views with drill-down capabilities, enhanced candidate profile pages, and a notifications/alerts engine.

### Current State Analysis

Based on codebase analysis, the following Phase 2 features are already implemented:
- Basic candidate stage movement (single candidate)
- Activity timeline for stage changes
- Basic pipeline stage management
- Candidate search and filtering
- Role-wise pipeline view (basic)

### Features to be Implemented

1. **Bulk Stage Movement** - Move multiple candidates between stages simultaneously
2. **Stage Timestamps & TAT Calculation** - Track time spent in each stage for turnaround time metrics
3. **Stage-Level Comments** - Add comments when moving candidates between stages
4. **Enhanced Role-Wise Pipeline View** - Stage counts, drill-down into stages, advanced filters
5. **Candidate Profile Page** - Dedicated page with resume viewer, parsed data, activity timeline, notes, attachments, tags
6. **Notifications & Alerts Engine** - Stage update notifications, pending feedback alerts, SLA alerts

## Glossary

- **ATS**: Applicant Tracking System - software that manages the recruitment and hiring process
- **Pipeline_Stage**: A step in the hiring process (e.g., Applied, Screening, Interview, Offer, Hired)
- **Stage_Movement**: The action of moving a candidate from one pipeline stage to another
- **Bulk_Movement**: Moving multiple candidates between stages in a single operation
- **TAT**: Turnaround Time - the time taken to move a candidate through the pipeline
- **Stage_Timestamp**: The date and time when a candidate entered or exited a stage
- **Stage_Comment**: A note or reason attached to a stage movement action
- **SLA**: Service Level Agreement - expected time limits for candidate processing
- **Drill_Down**: The ability to click on a stage to see all candidates in that stage
- **Notification**: An in-app alert informing users of important events
- **Candidate_Profile_Page**: A dedicated page showing comprehensive candidate information

## Requirements

### Requirement 1: Bulk Stage Movement

**User Story:** As a recruiter, I want to move multiple candidates between stages at once, so that I can efficiently process candidates in bulk.

#### Acceptance Criteria

1. WHEN viewing candidates in a pipeline stage THEN THE Pipeline_Module SHALL display checkboxes next to each candidate for selection
2. WHEN one or more candidates are selected THEN THE Pipeline_Module SHALL display a bulk actions toolbar with stage movement options
3. WHEN a user selects a target stage from bulk actions THEN THE Pipeline_Module SHALL move all selected candidates to that stage in a single operation
4. WHEN bulk movement is executed THEN THE Pipeline_Module SHALL create activity records for each moved candidate
5. WHEN bulk movement completes THEN THE Pipeline_Module SHALL display a success message with the count of candidates moved
6. IF any candidate fails to move during bulk operation THEN THE Pipeline_Module SHALL continue processing remaining candidates and report failures separately

### Requirement 2: Stage Timestamps and TAT Calculation

**User Story:** As a hiring manager, I want to track how long candidates spend in each stage, so that I can identify bottlenecks and improve hiring efficiency.

#### Acceptance Criteria

1. WHEN a candidate enters a pipeline stage THEN THE Pipeline_Module SHALL record the entry timestamp
2. WHEN a candidate exits a pipeline stage THEN THE Pipeline_Module SHALL record the exit timestamp
3. WHEN viewing a candidate's timeline THEN THE Pipeline_Module SHALL display the duration spent in each stage
4. WHEN viewing pipeline analytics THEN THE Pipeline_Module SHALL calculate and display average TAT per stage
5. WHEN a candidate has been in a stage beyond the SLA threshold THEN THE Pipeline_Module SHALL flag the candidate as "at risk"

### Requirement 3: Stage-Level Comments

**User Story:** As a recruiter, I want to add comments when moving candidates between stages, so that I can document reasons and provide context for the team.

#### Acceptance Criteria

1. WHEN initiating a stage movement THEN THE Pipeline_Module SHALL display a comment input field
2. WHEN a comment is provided during stage movement THEN THE Pipeline_Module SHALL store the comment with the stage change activity
3. WHEN viewing a candidate's activity timeline THEN THE Pipeline_Module SHALL display stage movement comments
4. WHEN moving to a rejection stage THEN THE Pipeline_Module SHALL require a rejection reason comment
5. WHEN viewing stage history THEN THE Pipeline_Module SHALL show all comments associated with stage transitions

### Requirement 4: Enhanced Role-Wise Pipeline View

**User Story:** As a recruiter, I want to see candidate counts per stage and drill down into each stage, so that I can quickly understand pipeline health and take action.

#### Acceptance Criteria

1. WHEN viewing a role's pipeline THEN THE Pipeline_Module SHALL display candidate count badges on each stage
2. WHEN a user clicks on a stage THEN THE Pipeline_Module SHALL filter the candidate list to show only candidates in that stage
3. WHEN viewing the pipeline THEN THE Pipeline_Module SHALL provide filters for skills, experience range, source, and status
4. WHEN applying filters THEN THE Pipeline_Module SHALL update both stage counts and candidate list in real-time
5. WHEN viewing stage counts THEN THE Pipeline_Module SHALL highlight stages with candidates exceeding SLA thresholds

### Requirement 5: Candidate Profile Page

**User Story:** As a recruiter, I want a dedicated candidate profile page with comprehensive information, so that I can thoroughly evaluate candidates and manage their application.

#### Acceptance Criteria

1. WHEN navigating to a candidate profile THEN THE Candidate_Module SHALL display a dedicated page with candidate details
2. WHEN viewing the profile THEN THE Candidate_Module SHALL display an embedded resume viewer for PDF resumes
3. WHEN viewing the profile THEN THE Candidate_Module SHALL show parsed data fields (name, email, phone, experience, skills, education)
4. WHEN viewing the profile THEN THE Candidate_Module SHALL display a complete activity timeline with all stage changes and actions
5. WHEN viewing the profile THEN THE Candidate_Module SHALL provide a notes section for adding and viewing recruiter notes
6. WHEN viewing the profile THEN THE Candidate_Module SHALL support file attachments beyond the resume
7. WHEN viewing the profile THEN THE Candidate_Module SHALL display and allow editing of tags and labels

### Requirement 6: Notes and Attachments

**User Story:** As a recruiter, I want to add notes and attachments to candidate profiles, so that I can document interactions and store relevant files.

#### Acceptance Criteria

1. WHEN viewing a candidate profile THEN THE Candidate_Module SHALL display a notes section with existing notes
2. WHEN adding a note THEN THE Candidate_Module SHALL store the note with timestamp and author information
3. WHEN viewing notes THEN THE Candidate_Module SHALL display notes in reverse chronological order
4. WHEN uploading an attachment THEN THE Candidate_Module SHALL accept PDF, DOC, DOCX, and image files up to 10MB
5. WHEN viewing attachments THEN THE Candidate_Module SHALL display file name, upload date, and download link

### Requirement 7: Tags and Labels

**User Story:** As a recruiter, I want to tag candidates with custom labels, so that I can categorize and filter candidates effectively.

#### Acceptance Criteria

1. WHEN viewing a candidate profile THEN THE Candidate_Module SHALL display existing tags as colored badges
2. WHEN adding a tag THEN THE Candidate_Module SHALL allow selection from existing tags or creation of new tags
3. WHEN searching candidates THEN THE Candidate_Module SHALL support filtering by tags
4. WHEN viewing the candidate list THEN THE Candidate_Module SHALL display tags on candidate cards
5. WHEN removing a tag THEN THE Candidate_Module SHALL update the candidate record immediately

### Requirement 8: Notifications Engine

**User Story:** As a user, I want to receive notifications for important pipeline events, so that I stay informed and can take timely action.

#### Acceptance Criteria

1. WHEN a candidate's stage changes THEN THE Notification_Module SHALL create a notification for relevant users
2. WHEN viewing the application THEN THE Notification_Module SHALL display a notification bell icon with unread count
3. WHEN clicking the notification bell THEN THE Notification_Module SHALL display a dropdown with recent notifications
4. WHEN a notification is clicked THEN THE Notification_Module SHALL navigate to the relevant candidate or job
5. WHEN a notification is viewed THEN THE Notification_Module SHALL mark it as read and update the unread count

### Requirement 9: Pending Feedback Alerts

**User Story:** As a hiring manager, I want alerts for pending interview feedback, so that I can follow up with interviewers and keep the process moving.

#### Acceptance Criteria

1. WHEN an interview is completed without feedback THEN THE Alert_Module SHALL create a pending feedback alert after 24 hours
2. WHEN viewing the dashboard THEN THE Alert_Module SHALL display pending feedback alerts prominently
3. WHEN clicking a pending feedback alert THEN THE Alert_Module SHALL navigate to the candidate's interview details
4. WHEN feedback is submitted THEN THE Alert_Module SHALL dismiss the corresponding alert
5. WHEN viewing alerts THEN THE Alert_Module SHALL show the age of each pending feedback item

### Requirement 10: SLA Alerts

**User Story:** As a recruiter, I want alerts when candidates are stuck in a stage too long, so that I can take action to prevent pipeline stagnation.

#### Acceptance Criteria

1. WHEN a candidate exceeds the SLA threshold for a stage THEN THE Alert_Module SHALL create an SLA breach alert
2. WHEN viewing the pipeline THEN THE Alert_Module SHALL visually highlight candidates exceeding SLA
3. WHEN viewing alerts THEN THE Alert_Module SHALL display SLA breach alerts with candidate name, stage, and days overdue
4. WHEN a candidate is moved to a new stage THEN THE Alert_Module SHALL dismiss the SLA alert for the previous stage
5. WHEN configuring SLA thresholds THEN THE Alert_Module SHALL allow setting different thresholds per stage

### Requirement 11: Database Schema for Notifications

**User Story:** As a system administrator, I want the database to support notifications and alerts, so that data is properly stored and retrievable.

#### Acceptance Criteria

1. WHEN storing notification data THEN THE Database_Module SHALL support fields for type, message, recipient, read status, and related entity
2. WHEN storing stage history THEN THE Database_Module SHALL support entry timestamp, exit timestamp, and duration fields
3. WHEN serializing notification data for API responses THEN THE Database_Module SHALL encode all fields using JSON format
4. WHEN deserializing notification data from storage THEN THE Database_Module SHALL decode JSON fields and return equivalent notification objects
