# Requirements Document

## Introduction

This document defines the requirements for Phase 4 - Dashboard, Analytics & Company Reporting of the ATS (Applicant Tracking System). This phase focuses on building comprehensive analytics capabilities, an enhanced dashboard with real-time metrics, advanced search and filtering functionality, and detailed reporting modules. The goal is to provide hiring teams with actionable insights into their recruitment pipeline, enabling data-driven decision-making.

## Glossary

- **ATS_Dashboard**: The main client home page displaying key hiring metrics and KPIs
- **Analytics_Module**: The component responsible for calculating and displaying recruitment analytics
- **Search_Engine**: The system component handling advanced candidate and job searches
- **Filter_System**: The component managing filtering logic across the application
- **KPI_Card**: A visual component displaying a single key performance indicator
- **Funnel_Chart**: A visualization showing candidate progression through pipeline stages
- **Time_To_Fill**: The metric measuring days from job opening to candidate hire
- **Time_In_Stage**: The metric measuring average days candidates spend in each pipeline stage
- **Source_Analytics**: Analytics tracking candidate sources and their effectiveness
- **Recruiter_Productivity**: Metrics measuring individual recruiter performance
- **Panel_Performance**: Analytics tracking interview panel effectiveness
- **SLA_Status**: The status indicating whether a role is on track, at risk, or breached based on time thresholds
- **Boolean_Search**: Search functionality supporting AND, OR, NOT operators
- **Drop_Off_Rate**: The percentage of candidates who exit the pipeline at each stage

## Requirements

### Requirement 1: Dashboard KPI Cards

**User Story:** As a hiring manager, I want to see key hiring metrics at a glance on my dashboard, so that I can quickly assess the overall health of my recruitment pipeline.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE ATS_Dashboard SHALL display KPI cards for: active roles count, total active candidates, interviews scheduled today, interviews scheduled this week, offers pending, total hires (current period), average time to fill, and offer acceptance rate
2. WHEN a user has recruiter role, THE ATS_Dashboard SHALL filter KPI metrics to show only data for jobs assigned to that recruiter
3. WHEN a user has admin or hiring_manager role, THE ATS_Dashboard SHALL display company-wide KPI metrics
4. THE KPI_Card SHALL display the metric value, a descriptive label, and supporting context (e.g., "From open to accepted offer")
5. WHEN KPI data changes, THE ATS_Dashboard SHALL update the displayed values within 60 seconds without requiring page refresh
6. THE ATS_Dashboard SHALL display a loading state while fetching KPI data
7. IF the API request fails, THEN THE ATS_Dashboard SHALL display an error message and offer a retry option

### Requirement 2: Pipeline Breakdown Visualization

**User Story:** As a hiring manager, I want to see a visual breakdown of candidates across pipeline stages, so that I can identify bottlenecks and optimize the hiring process.

#### Acceptance Criteria

1. THE ATS_Dashboard SHALL display a hiring funnel chart showing candidate counts at each pipeline stage
2. WHEN displaying the funnel, THE Funnel_Chart SHALL show both absolute counts and percentage conversion rates for each stage
3. THE Funnel_Chart SHALL support filtering by department, location, and date range
4. WHEN a user clicks on a funnel stage, THE ATS_Dashboard SHALL navigate to a filtered view of candidates in that stage
5. THE Funnel_Chart SHALL visually indicate the conversion rate between consecutive stages using proportional bar widths
6. WHEN no candidates exist in a stage, THE Funnel_Chart SHALL display zero with appropriate visual indication

### Requirement 3: Role-wise Pipeline Table

**User Story:** As a recruiter, I want to see a table of all active roles with their pipeline status, so that I can prioritize my work on roles that need attention.

#### Acceptance Criteria

1. THE ATS_Dashboard SHALL display a sortable table showing all active roles with columns: role name, location, applicant count, interview count, offer count, age (days open), SLA status, and priority
2. WHEN displaying SLA status, THE ATS_Dashboard SHALL use color-coded badges: green for "On track", orange for "At risk", red for "Breached"
3. THE ATS_Dashboard SHALL allow sorting by any column in ascending or descending order
4. WHEN a user clicks on a role row, THE ATS_Dashboard SHALL navigate to the job details page
5. THE ATS_Dashboard SHALL limit the displayed roles to the top 7 most relevant based on priority and SLA status
6. THE ATS_Dashboard SHALL provide a "View All" link to see the complete roles list
7. WHEN a user has recruiter role, THE ATS_Dashboard SHALL only display roles assigned to that recruiter

### Requirement 4: Interviews Today/This Week Widget

**User Story:** As a hiring manager, I want to see upcoming interviews on my dashboard, so that I can prepare and ensure panel availability.

#### Acceptance Criteria

1. THE ATS_Dashboard SHALL display a list of interviews scheduled for today, sorted chronologically
2. WHEN displaying an interview, THE ATS_Dashboard SHALL show: time, candidate name, role, panel members, and meeting type (Google Meet/Zoom/In-person)
3. THE ATS_Dashboard SHALL provide quick action buttons for "Join" (if virtual) and "Reschedule"
4. THE ATS_Dashboard SHALL limit the displayed interviews to 5 and provide a "View All" link
5. WHEN no interviews are scheduled for today, THE ATS_Dashboard SHALL display an appropriate empty state message
6. THE ATS_Dashboard SHALL support toggling between "Today" and "This Week" views

### Requirement 5: Source Analytics Chart

**User Story:** As a hiring manager, I want to see which candidate sources are most effective, so that I can optimize recruitment spending and effort.

#### Acceptance Criteria

1. THE Analytics_Module SHALL display a horizontal bar chart showing candidate distribution by source
2. WHEN displaying source data, THE Analytics_Module SHALL show percentage contribution for each source
3. THE Analytics_Module SHALL support filtering by date range, department, and job
4. THE Analytics_Module SHALL rank sources by effectiveness (hire rate, not just volume)
5. WHEN a source has zero candidates, THE Analytics_Module SHALL exclude it from the chart
6. THE Analytics_Module SHALL display at least the top 5 sources

### Requirement 6: Time-to-Fill Analytics

**User Story:** As a hiring manager, I want to analyze time-to-fill metrics across roles and departments, so that I can identify process inefficiencies.

#### Acceptance Criteria

1. THE Analytics_Module SHALL calculate and display average time-to-fill in days for closed roles
2. THE Analytics_Module SHALL display time-to-fill broken down by department
3. THE Analytics_Module SHALL display time-to-fill broken down by individual role
4. WHEN displaying role-wise time-to-fill, THE Analytics_Module SHALL use a horizontal bar chart with color coding for roles exceeding target
5. THE Analytics_Module SHALL allow setting a target time-to-fill benchmark (default: 30 days)
6. THE Analytics_Module SHALL highlight roles that exceed the target benchmark in a warning color
7. IF no closed roles exist, THEN THE Analytics_Module SHALL display an appropriate message

### Requirement 7: Time-in-Stage Analytics

**User Story:** As a hiring manager, I want to see how long candidates spend in each pipeline stage, so that I can identify and address bottlenecks.

#### Acceptance Criteria

1. THE Analytics_Module SHALL calculate and display average time spent in each pipeline stage in days
2. THE Analytics_Module SHALL display time-in-stage as a horizontal bar chart
3. THE Analytics_Module SHALL identify and highlight the bottleneck stage (longest average time)
4. THE Analytics_Module SHALL provide actionable suggestions based on bottleneck analysis
5. WHEN a stage has no historical data, THE Analytics_Module SHALL display "N/A" for that stage
6. THE Analytics_Module SHALL support filtering by job, department, and date range

### Requirement 8: Offer Acceptance Rate Analytics

**User Story:** As a hiring manager, I want to track offer acceptance rates, so that I can improve our offer competitiveness.

#### Acceptance Criteria

1. THE Analytics_Module SHALL calculate and display the overall offer acceptance rate as a percentage
2. THE Analytics_Module SHALL display offer acceptance rate broken down by department
3. THE Analytics_Module SHALL display offer acceptance rate broken down by role
4. THE Analytics_Module SHALL show the total offers made and total offers accepted
5. WHEN offer acceptance rate is below 70%, THE Analytics_Module SHALL display a warning indicator
6. THE Analytics_Module SHALL support filtering by date range

### Requirement 9: Hiring Funnel Conversion Analytics

**User Story:** As a hiring manager, I want to analyze conversion rates between pipeline stages, so that I can optimize the hiring funnel.

#### Acceptance Criteria

1. THE Analytics_Module SHALL calculate and display conversion rates between each consecutive pipeline stage
2. THE Analytics_Module SHALL display a stage funnel visualization with volume and conversion percentage
3. THE Analytics_Module SHALL identify stages with the highest drop-off rates
4. THE Analytics_Module SHALL support comparison between different time periods
5. THE Analytics_Module SHALL support filtering by department, location, and job
6. WHEN conversion rate drops below 20% between stages, THE Analytics_Module SHALL highlight it as a concern

### Requirement 10: Drop-off Analysis

**User Story:** As a hiring manager, I want to understand where and why candidates drop off, so that I can improve candidate experience and reduce attrition.

#### Acceptance Criteria

1. THE Analytics_Module SHALL display drop-off counts and percentages by pipeline stage
2. THE Analytics_Module SHALL display rejection reasons distribution as a pie chart
3. THE Analytics_Module SHALL identify the stage with the highest rejection rate
4. THE Analytics_Module SHALL support filtering by date range, department, and job
5. WHEN displaying rejection reasons, THE Analytics_Module SHALL group them into categories: skill mismatch, compensation mismatch, culture fit, location/notice/other
6. THE Analytics_Module SHALL provide a downloadable detailed rejection log

### Requirement 11: Recruiter Productivity Analytics

**User Story:** As a hiring manager, I want to track recruiter productivity, so that I can balance workload and recognize top performers.

#### Acceptance Criteria

1. THE Analytics_Module SHALL display a table showing recruiter performance metrics
2. WHEN displaying recruiter metrics, THE Analytics_Module SHALL show: recruiter name, active roles count, CVs added, interviews scheduled, offers made, hires, and average time-to-fill
3. THE Analytics_Module SHALL rank recruiters by a composite productivity score
4. THE Analytics_Module SHALL support filtering by date range
5. WHEN a user has recruiter role, THE Analytics_Module SHALL only show their own metrics
6. THE Analytics_Module SHALL provide a link to view detailed recruiter-wise reports

### Requirement 12: Panel Performance Analytics

**User Story:** As a hiring manager, I want to analyze interview panel performance, so that I can optimize panel composition and improve hiring decisions.

#### Acceptance Criteria

1. THE Analytics_Module SHALL display a table showing panel/interviewer performance metrics
2. WHEN displaying panel metrics, THE Analytics_Module SHALL show: panel name, interview rounds conducted, offer percentage, top rejection reason, and average feedback submission time
3. THE Analytics_Module SHALL identify panels with the highest offer conversion rates
4. THE Analytics_Module SHALL identify panels with slow feedback submission times
5. THE Analytics_Module SHALL support filtering by department and date range
6. THE Analytics_Module SHALL provide actionable insights based on panel performance data

### Requirement 13: Advanced Candidate Search

**User Story:** As a recruiter, I want to search candidates using multiple criteria, so that I can quickly find suitable candidates for open positions.

#### Acceptance Criteria

1. THE Search_Engine SHALL support searching candidates by: name, email, phone, skills, experience years, location, current company, and tags
2. THE Search_Engine SHALL support Boolean operators (AND, OR, NOT) in search queries
3. WHEN a search is performed, THE Search_Engine SHALL return results within 2 seconds
4. THE Search_Engine SHALL highlight matching terms in search results
5. THE Search_Engine SHALL support partial matching for name and email fields
6. THE Search_Engine SHALL preserve search history for the current session
7. IF no results match the search, THEN THE Search_Engine SHALL suggest alternative search terms

### Requirement 14: Advanced Filtering System

**User Story:** As a recruiter, I want to filter candidates and jobs using multiple criteria, so that I can narrow down results efficiently.

#### Acceptance Criteria

1. THE Filter_System SHALL support filtering candidates by: pipeline stage, application date range, location, source, experience range, and skills
2. THE Filter_System SHALL support filtering jobs by: status, department, location, priority, and SLA status
3. THE Filter_System SHALL allow combining multiple filters with AND logic
4. WHEN filters are applied, THE Filter_System SHALL update results in real-time without page reload
5. THE Filter_System SHALL display the count of active filters
6. THE Filter_System SHALL provide a "Clear all filters" action
7. THE Filter_System SHALL persist filter selections during the user session

### Requirement 15: Analytics Date Range Selection

**User Story:** As a hiring manager, I want to select custom date ranges for analytics, so that I can analyze data for specific periods.

#### Acceptance Criteria

1. THE Analytics_Module SHALL provide predefined date range options: Last 7 days, Last 30 days, Last 90 days, Last 6 months, This year
2. THE Analytics_Module SHALL support custom date range selection with start and end dates
3. WHEN a date range is selected, THE Analytics_Module SHALL update all analytics visualizations
4. THE Analytics_Module SHALL display the currently selected date range prominently
5. THE Analytics_Module SHALL default to "Last 90 days" on initial load
6. IF the selected date range has no data, THEN THE Analytics_Module SHALL display an appropriate message

### Requirement 16: Analytics Export

**User Story:** As a hiring manager, I want to export analytics reports, so that I can share insights with stakeholders.

#### Acceptance Criteria

1. THE Analytics_Module SHALL support exporting reports in PDF format
2. THE Analytics_Module SHALL support exporting data in Excel/CSV format
3. WHEN exporting, THE Analytics_Module SHALL include all currently visible charts and tables
4. THE Analytics_Module SHALL include the selected date range and filters in the export
5. THE Analytics_Module SHALL display a loading indicator during export generation
6. IF export fails, THEN THE Analytics_Module SHALL display an error message with retry option

### Requirement 17: Analytics Dashboard Layout

**User Story:** As a hiring manager, I want a well-organized analytics dashboard, so that I can easily navigate and find the insights I need.

#### Acceptance Criteria

1. THE Analytics_Module SHALL organize analytics into logical sections: Overview KPIs, Funnel Analytics, Time Analytics, Source Analytics, Team Performance
2. THE Analytics_Module SHALL provide a navigation menu to jump between sections
3. THE Analytics_Module SHALL support responsive layout for different screen sizes
4. THE Analytics_Module SHALL maintain consistent styling with the rest of the application
5. WHEN the page loads, THE Analytics_Module SHALL display the Overview section first
6. THE Analytics_Module SHALL provide tooltips explaining each metric

### Requirement 18: Real-time Dashboard Updates

**User Story:** As a hiring manager, I want my dashboard to show current data, so that I can make decisions based on the latest information.

#### Acceptance Criteria

1. THE ATS_Dashboard SHALL refresh data automatically every 60 seconds
2. THE ATS_Dashboard SHALL display a "Last updated" timestamp
3. THE ATS_Dashboard SHALL provide a manual refresh button
4. WHEN new data is available, THE ATS_Dashboard SHALL update without disrupting user interactions
5. IF the connection is lost, THEN THE ATS_Dashboard SHALL display a connection status indicator
6. THE ATS_Dashboard SHALL use optimistic updates for user actions

### Requirement 19: Role SLA Tracking

**User Story:** As a hiring manager, I want to track SLA compliance for open roles, so that I can ensure timely hiring.

#### Acceptance Criteria

1. THE Analytics_Module SHALL display a summary of roles by SLA status: On track, At risk, Breached
2. THE Analytics_Module SHALL calculate SLA status based on configured thresholds per stage
3. WHEN a role is at risk (within 3 days of breach), THE Analytics_Module SHALL highlight it in orange
4. WHEN a role has breached SLA, THE Analytics_Module SHALL highlight it in red
5. THE Analytics_Module SHALL support configuring SLA thresholds per company
6. THE Analytics_Module SHALL provide drill-down to see which candidates are causing SLA breaches

### Requirement 20: Activity Feed

**User Story:** As a hiring manager, I want to see recent activity in my recruitment pipeline, so that I can stay informed of changes.

#### Acceptance Criteria

1. THE ATS_Dashboard SHALL display a chronological activity feed showing recent pipeline events
2. WHEN displaying activities, THE ATS_Dashboard SHALL show: timestamp, activity description, and related entity (candidate/job)
3. THE ATS_Dashboard SHALL limit the displayed activities to the 10 most recent
4. THE ATS_Dashboard SHALL support filtering activities by type: stage changes, interviews, offers, hires
5. WHEN a user clicks on an activity, THE ATS_Dashboard SHALL navigate to the related entity
6. THE ATS_Dashboard SHALL update the activity feed in real-time as new events occur
