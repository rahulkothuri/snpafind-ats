# Requirements Document

## Introduction

This feature implements a complete, production-ready Analytics Dashboard for the ATS (Applicant Tracking System). The dashboard displays 7 key analytics cards/sections with real-time data from the database, matching the reference design from atsreport.html. All data must be fetched from the backend API with no hardcoded content. The dashboard includes filters for period, department, and location, with a clean, professional UI.

## Glossary

- **Analytics_Dashboard**: The main page displaying hiring analytics and metrics
- **KPI_Card**: A summary card showing a key performance indicator
- **Funnel_Chart**: A visualization showing candidate progression through pipeline stages
- **Rejection_Pie_Chart**: A pie chart showing rejection reasons distribution
- **Time_Bar_Chart**: A horizontal bar chart showing time metrics
- **Recruiter_Table**: A table displaying recruiter productivity metrics
- **Panel_Table**: A table displaying interview panel performance metrics
- **Filter_Bar**: The UI component for filtering analytics data by period, department, and location
- **API_Service**: The backend service providing analytics data

## Requirements

### Requirement 1: KPI Summary Cards

**User Story:** As a hiring manager, I want to see key hiring metrics at a glance, so that I can quickly assess the overall health of our hiring pipeline.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display 6 KPI cards in a single row: Avg Time to Hire, Offer Acceptance Rate, Interview → Offer rate, Overall Rejection Rate, Roles on Track status, and Active Candidates count
2. WHEN the page loads, THE Analytics_Dashboard SHALL fetch KPI data from the backend API endpoint `/api/analytics/kpis`
3. WHEN filters are applied, THE Analytics_Dashboard SHALL refresh KPI data with the new filter parameters
4. THE KPI_Card for "Avg Time to Hire" SHALL display the average number of days from job opening to accepted offer
5. THE KPI_Card for "Offer Acceptance Rate" SHALL display the percentage of offers accepted and show the total offers vs accepted count
6. THE KPI_Card for "Interview → Offer" SHALL display the conversion rate from interview stage to offer stage
7. THE KPI_Card for "Overall Rejection Rate" SHALL display the percentage of candidates rejected across all stages
8. THE KPI_Card for "Roles on Track" SHALL display the count of roles on track, at risk, and breached based on SLA
9. THE KPI_Card for "Active Candidates" SHALL display the total active candidates and new candidates this month

### Requirement 2: Stage Funnel Conversion Chart

**User Story:** As a recruiter, I want to see how candidates progress through the hiring pipeline, so that I can identify conversion bottlenecks.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a Stage Funnel Conversion chart showing candidate counts at each pipeline stage
2. WHEN the page loads, THE Analytics_Dashboard SHALL fetch funnel data from the backend API endpoint `/api/analytics/funnel`
3. THE Funnel_Chart SHALL display stages in order: Applied, Screening, Shortlisted, Interview, Offer, Hired
4. THE Funnel_Chart SHALL show the candidate count and percentage for each stage
5. THE Funnel_Chart SHALL use progressively darker blue colors for each stage with green for the Hired stage
6. THE Funnel_Chart SHALL include a legend showing Volume and Conversion % indicators

### Requirement 3: Rejections by Reason Pie Chart

**User Story:** As a hiring manager, I want to understand why candidates are being rejected, so that I can improve our hiring process.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a Rejections – Reason Wise pie chart
2. WHEN the page loads, THE Analytics_Dashboard SHALL fetch rejection data from the backend API endpoint `/api/analytics/rejection-reasons`
3. THE Rejection_Pie_Chart SHALL display rejection reasons with their percentages: Skill mismatch, Compensation mismatch, Culture/attitude, Location/notice/other
4. THE Rejection_Pie_Chart SHALL use distinct colors for each rejection reason (red, orange, blue, green)
5. THE Rejection_Pie_Chart SHALL display the top stage where most rejections occur
6. THE Rejection_Pie_Chart SHALL include a legend with reason names and percentages

### Requirement 4: Average Time Spent at Each Stage

**User Story:** As a recruiter, I want to see how long candidates spend at each stage, so that I can identify process bottlenecks.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display an Average Time Spent at Each Stage horizontal bar chart
2. WHEN the page loads, THE Analytics_Dashboard SHALL fetch time-in-stage data from the backend API endpoint `/api/analytics/time-in-stage`
3. THE Time_Bar_Chart SHALL display stage transitions: Applied → Screening, Screening → Shortlist, Shortlist → Interview, Interview → Offer, Offer → Join
4. THE Time_Bar_Chart SHALL show the average days for each stage transition
5. THE Time_Bar_Chart SHALL identify and highlight bottleneck stages
6. THE Time_Bar_Chart SHALL display a suggestion for improving the bottleneck

### Requirement 5: Recruiter Productivity Table

**User Story:** As a hiring manager, I want to see recruiter performance metrics, so that I can evaluate team productivity.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a Recruiter Productivity table showing top recruiters
2. WHEN the page loads, THE Analytics_Dashboard SHALL fetch recruiter data from the backend API endpoint `/api/analytics/recruiters`
3. THE Recruiter_Table SHALL display columns: Recruiter name, Roles, CVs added, Interviews, Offers, Hires, Avg TTF (Time to Fill)
4. THE Recruiter_Table SHALL show the top 3 recruiters by default
5. THE Recruiter_Table SHALL include a link to view the full recruiter report

### Requirement 6: Panel Performance Table

**User Story:** As a hiring manager, I want to see interview panel performance, so that I can optimize our interview process.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a Panel Performance table showing interviewer metrics
2. WHEN the page loads, THE Analytics_Dashboard SHALL fetch panel data from the backend API endpoint `/api/analytics/panels`
3. THE Panel_Table SHALL display columns: Panel/Interviewer name, Rounds, Offer%, Top rejection reason, Avg feedback time
4. THE Panel_Table SHALL highlight panels with high offer rates or slow feedback times
5. THE Panel_Table SHALL include actionable insights about panel performance

### Requirement 7: Role-wise Time to Fill Chart

**User Story:** As a hiring manager, I want to see time-to-fill metrics by role, so that I can identify which roles take longest to fill.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a Role-wise Time to Fill horizontal bar chart
2. WHEN the page loads, THE Analytics_Dashboard SHALL fetch time-to-fill data from the backend API endpoint `/api/analytics/time-to-fill`
3. THE Time_Bar_Chart SHALL display role names with their average time-to-fill in days
4. THE Time_Bar_Chart SHALL highlight roles that exceed the target threshold (30 days) in orange
5. THE Time_Bar_Chart SHALL display the benchmark target for time-to-fill
6. THE Time_Bar_Chart SHALL include a link to view per-role aging and SLA details

### Requirement 8: Rejections by Stage Chart

**User Story:** As a recruiter, I want to see at which stages we lose most candidates, so that I can focus improvement efforts.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a Rejections – Stage Wise horizontal bar chart
2. WHEN the page loads, THE Analytics_Dashboard SHALL fetch drop-off data from the backend API endpoint `/api/analytics/drop-off`
3. THE Time_Bar_Chart SHALL display stages: Queue/Applied, Screening, Interview, Offer with their rejection percentages
4. THE Time_Bar_Chart SHALL use a light red color for rejection bars
5. THE Time_Bar_Chart SHALL identify and display the stage with highest drop-off
6. THE Time_Bar_Chart SHALL include a suggestion for reducing drop-offs

### Requirement 9: Filter Bar

**User Story:** As a user, I want to filter analytics data by period, department, and location, so that I can focus on specific segments.

#### Acceptance Criteria

1. THE Filter_Bar SHALL display filter dropdowns for: Period (Last 30 days, Last 90 days, Last 6 months, Custom range), Department (All, Engineering, Product, Sales, etc.), Location (All, specific locations)
2. WHEN a filter is changed, THE Analytics_Dashboard SHALL refresh all charts and cards with filtered data
3. THE Filter_Bar SHALL display a "Clear filters" button to reset all filters
4. THE Filter_Bar SHALL display a "Group by" dropdown for view options (Role-wise, Recruiter-wise, Panel-wise)
5. THE Filter_Bar SHALL persist filter selections during the session

### Requirement 10: Real-time Data Integration

**User Story:** As a user, I want all analytics to show real data from the database, so that I can make informed decisions.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL NOT display any hardcoded or mock data
2. WHEN the backend returns empty data, THE Analytics_Dashboard SHALL display appropriate empty states
3. WHEN the backend returns an error, THE Analytics_Dashboard SHALL display an error message with retry option
4. THE Analytics_Dashboard SHALL show loading states while data is being fetched
5. THE API_Service SHALL calculate all metrics from actual database records (jobs, candidates, interviews, stage history)

### Requirement 11: Export Functionality

**User Story:** As a hiring manager, I want to export analytics reports, so that I can share them with stakeholders.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display export buttons for PDF and Excel formats
2. WHEN the export button is clicked, THE Analytics_Dashboard SHALL call the backend export endpoint
3. THE exported report SHALL include all visible analytics data with current filters applied
