# Requirements Document

## Introduction

This document defines the requirements for Phase 1 of the ATS (Applicant Tracking System) Portal - Core Infrastructure & Foundation. This phase establishes the skeleton on which all subsequent phases depend, including user authentication, company setup, job requisition management, and the candidate database foundation. The system will be built using React for the frontend with a blue and white theme, PostgreSQL for the database, and JWT for authentication. The UI will feature a left sidebar navigation consistent with the sample pages provided.

### Pages to be Generated

The following pages will be created for Phase 1:

1. **Login Page** - User authentication with email/password
2. **Dashboard Page** - Overview with KPIs, role-wise pipeline, hiring funnel, upcoming interviews, tasks, alerts
3. **Roles & Pipelines Page** - Job requisition list with pipeline view (table and kanban board)
4. **Candidate Database Page** - Master candidate list with search, filters, and insights
5. **Candidate Profile Page** - Detailed candidate view with resume, skills, timeline, notes
6. **Settings Page** - Company profile, user management, role configuration
7. **Job Creation/Edit Page** - Form for creating and editing job requisitions

## Glossary

- **ATS**: Applicant Tracking System - software that manages the recruitment and hiring process
- **RBAC**: Role-Based Access Control - restricts system access based on user roles
- **JWT**: JSON Web Token - secure method for authentication and information exchange
- **Job Requisition**: A formal request to fill a job position with defined requirements
- **Pipeline Stage**: A step in the hiring process (Queue, Applied, Screening, Shortlisted, Interview, Selected, Offer, Hired)
- **Candidate**: An individual who has applied or been added to the system for a job position
- **Company**: The client organization using the ATS to manage their hiring
- **Admin**: System administrator with full access to all features
- **Hiring Manager**: User responsible for making hiring decisions for specific roles
- **Recruiter**: User responsible for sourcing and managing candidates through the pipeline
- **JD**: Job Description - detailed description of job responsibilities and requirements

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to securely log in to the ATS portal, so that I can access the system based on my assigned role.

#### Acceptance Criteria

1. WHEN a user submits valid credentials (email and password) THEN THE Authentication_System SHALL generate a JWT token and grant access to the portal
2. WHEN a user submits invalid credentials THEN THE Authentication_System SHALL display an error message and deny access without revealing which credential was incorrect
3. WHEN a JWT token expires THEN THE Authentication_System SHALL redirect the user to the login page and require re-authentication
4. WHEN a user clicks the logout button THEN THE Authentication_System SHALL invalidate the current session and redirect to the login page
5. WHILE a user session is active THEN THE Authentication_System SHALL include the JWT token in all API requests for authorization

### Requirement 2: Company Setup

**User Story:** As an admin, I want to create and configure company profiles, so that the ATS can be customized for each client organization.

#### Acceptance Criteria

1. WHEN an admin creates a new company THEN THE Company_Module SHALL store the company name, logo, and contact information in the database
2. WHEN an admin updates company profile settings THEN THE Company_Module SHALL persist the changes and reflect them across the portal
3. WHEN a company profile is created THEN THE Company_Module SHALL generate a unique company identifier for reference
4. WHEN viewing the company profile THEN THE Company_Module SHALL display all configured company information including name, logo, and settings

### Requirement 3: Role-Based Access Control (RBAC)

**User Story:** As an admin, I want to define user roles with specific permissions, so that users can only access features appropriate to their responsibilities.

#### Acceptance Criteria

1. WHEN an admin assigns a role to a user THEN THE RBAC_System SHALL restrict the user's access to features permitted for that role
2. WHEN a user with Admin role logs in THEN THE RBAC_System SHALL grant access to all system features including user management and company settings
3. WHEN a user with Hiring_Manager role logs in THEN THE RBAC_System SHALL grant access to job requisitions, candidate review, and interview feedback for assigned roles
4. WHEN a user with Recruiter role logs in THEN THE RBAC_System SHALL grant access to candidate management, pipeline operations, and interview scheduling
5. WHEN a user attempts to access a restricted feature THEN THE RBAC_System SHALL deny access and display an appropriate message

### Requirement 4: User Management

**User Story:** As an admin, I want to create and manage user accounts, so that team members can access the ATS with appropriate permissions.

#### Acceptance Criteria

1. WHEN an admin creates a new user THEN THE User_Management_Module SHALL store the user's name, email, role, and encrypted password in the database
2. WHEN an admin updates a user's role THEN THE User_Management_Module SHALL immediately apply the new permissions to that user's session
3. WHEN an admin deactivates a user account THEN THE User_Management_Module SHALL prevent that user from logging in while preserving their historical data
4. WHEN viewing the user list THEN THE User_Management_Module SHALL display all users with their names, emails, roles, and status

### Requirement 5: Job Requisition Creation

**User Story:** As a recruiter or hiring manager, I want to create new job requisitions, so that I can define open positions and start the hiring process.

#### Acceptance Criteria

1. WHEN a user creates a new job requisition THEN THE Job_Module SHALL store the title, department, location, salary range, and job description
2. WHEN a job requisition is created THEN THE Job_Module SHALL assign a unique job identifier and set the initial status to active
3. WHEN a user saves a job requisition THEN THE Job_Module SHALL validate that all required fields (title, department, location) are provided
4. IF a required field is missing during job creation THEN THE Job_Module SHALL display a validation error and prevent submission

### Requirement 6: Pipeline Stage Configuration

**User Story:** As an admin or hiring manager, I want to define hiring pipeline stages for each job, so that candidates can be tracked through a structured process.

#### Acceptance Criteria

1. WHEN a job requisition is created THEN THE Pipeline_Module SHALL initialize default stages (Queue, Applied, Screening, Shortlisted, Interview, Selected, Offer, Hired)
2. WHEN a user adds a custom sub-stage THEN THE Pipeline_Module SHALL insert the sub-stage at the specified position within the pipeline
3. WHEN viewing a job's pipeline configuration THEN THE Pipeline_Module SHALL display all stages in their defined order with stage names and positions
4. WHEN a user reorders pipeline stages THEN THE Pipeline_Module SHALL update the stage positions and maintain data integrity for existing candidates

### Requirement 7: Job Status Dashboard

**User Story:** As a recruiter or hiring manager, I want to view a dashboard showing the status of each job requisition, so that I can monitor hiring progress at a glance.

#### Acceptance Criteria

1. WHEN a user views the job dashboard THEN THE Dashboard_Module SHALL display all active jobs with candidate counts per stage
2. WHEN a user filters jobs by department or location THEN THE Dashboard_Module SHALL display only jobs matching the selected criteria
3. WHEN a user clicks on a job card THEN THE Dashboard_Module SHALL navigate to the detailed pipeline view for that job
4. WHEN candidate counts change THEN THE Dashboard_Module SHALL reflect updated counts within the current view session

### Requirement 8: Candidate Database

**User Story:** As a recruiter, I want to maintain a unified candidate database, so that I can search and reuse candidate profiles across multiple job requisitions.

#### Acceptance Criteria

1. WHEN a recruiter adds a new candidate THEN THE Candidate_Module SHALL store the candidate's name, email, phone, and profile information in the database
2. WHEN a candidate is added THEN THE Candidate_Module SHALL generate a unique candidate identifier for tracking
3. WHEN viewing the candidate database THEN THE Candidate_Module SHALL display candidates in a searchable list with key profile information
4. WHEN a candidate already exists (matching email) THEN THE Candidate_Module SHALL prevent duplicate creation and display the existing profile

### Requirement 9: Candidate Profile Structure

**User Story:** As a recruiter, I want comprehensive candidate profiles, so that I can evaluate candidates effectively with all relevant information.

#### Acceptance Criteria

1. WHEN viewing a candidate profile THEN THE Profile_Module SHALL display personal information, contact details, experience, skills, and current status
2. WHEN a recruiter updates candidate information THEN THE Profile_Module SHALL persist the changes and record the modification timestamp
3. WHEN a candidate is associated with multiple jobs THEN THE Profile_Module SHALL display all job associations and their respective pipeline stages
4. WHEN viewing candidate details THEN THE Profile_Module SHALL display the candidate's application history and timeline of activities

### Requirement 10: Resume Upload

**User Story:** As a recruiter, I want to upload candidate resumes, so that hiring teams can review candidate qualifications.

#### Acceptance Criteria

1. WHEN a recruiter uploads a resume file THEN THE Resume_Module SHALL store the file and associate it with the candidate profile
2. WHEN a resume is uploaded THEN THE Resume_Module SHALL validate the file format (PDF, DOC, DOCX) and size (maximum 10MB)
3. IF an invalid file format is uploaded THEN THE Resume_Module SHALL reject the upload and display a format error message
4. WHEN viewing a candidate profile THEN THE Resume_Module SHALL provide a link to view or download the attached resume

### Requirement 11: Basic Candidate Search

**User Story:** As a recruiter, I want to search for candidates by name, email, or phone, so that I can quickly find specific candidates in the database.

#### Acceptance Criteria

1. WHEN a user enters a search query THEN THE Search_Module SHALL return candidates matching the query against name, email, or phone fields
2. WHEN search results are displayed THEN THE Search_Module SHALL show candidate name, email, current status, and last activity date
3. WHEN no candidates match the search query THEN THE Search_Module SHALL display a message indicating no results found
4. WHEN a user clears the search field THEN THE Search_Module SHALL display the default candidate list view

### Requirement 12: Navigation Sidebar

**User Story:** As a user, I want a consistent left sidebar navigation, so that I can easily access different sections of the ATS portal.

#### Acceptance Criteria

1. WHEN a user is logged in THEN THE Navigation_Module SHALL display a left sidebar (210px width) with dark background (#020617) containing the logo and navigation items
2. WHEN viewing the sidebar THEN THE Navigation_Module SHALL display the logo section with a circular blue mark containing "SF" initials and "SnapFind ATS" text
3. WHEN viewing the sidebar THEN THE Navigation_Module SHALL display navigation sections with uppercase titles: "Main" section (Dashboard, Roles & Pipelines, Candidates, Interviews), "Insights" section (Analytics & Reports), "Setup" section (Settings)
4. WHEN viewing navigation items THEN THE Navigation_Module SHALL display each item with a circular icon badge and label text in light color (#cbd5f5)
5. WHEN a navigation item is active THEN THE Navigation_Module SHALL highlight it with a dark background, blue border (#0b6cf0), and brighter text (#f9fafb)
6. WHEN viewing the sidebar THEN THE Navigation_Module SHALL display a footer section showing "Logged in as: [username]" and "Role: [user role]" with a top border separator
7. WHEN a user clicks the collapse button THEN THE Navigation_Module SHALL animate the sidebar to 60px width showing only icons
8. WHEN the sidebar is collapsed THEN THE Navigation_Module SHALL hide the logo text, section titles, item labels, and footer text

### Requirement 13: Blue and White Theme

**User Story:** As a user, I want a clean blue and white themed interface, so that the portal has a professional and consistent appearance.

#### Acceptance Criteria

1. WHEN the portal loads THEN THE Theme_Module SHALL apply the primary blue color (#0b6cf0) for accent elements and white (#ffffff) for backgrounds
2. WHEN displaying interactive elements THEN THE Theme_Module SHALL use the blue accent color for buttons, links, and active states
3. WHEN displaying cards and panels THEN THE Theme_Module SHALL use white backgrounds with subtle borders and shadows
4. WHEN displaying the sidebar THEN THE Theme_Module SHALL use a dark background (#020617) with light text for contrast

### Requirement 14: Data Persistence

**User Story:** As a system administrator, I want all data to be persisted in PostgreSQL, so that information is reliably stored and retrievable.

#### Acceptance Criteria

1. WHEN any entity is created or updated THEN THE Database_Module SHALL persist the data to PostgreSQL with appropriate timestamps
2. WHEN data is retrieved THEN THE Database_Module SHALL return the most current version from the database
3. WHEN a database operation fails THEN THE Database_Module SHALL return an appropriate error message without exposing internal details
4. WHEN serializing data for storage THEN THE Database_Module SHALL encode entities using JSON format for complex fields
5. WHEN deserializing data from storage THEN THE Database_Module SHALL decode JSON fields and return equivalent entity objects

### Requirement 15: Dashboard Page

**User Story:** As a recruiter or hiring manager, I want a comprehensive dashboard, so that I can see an overview of all hiring activities at a glance.

#### Acceptance Criteria

1. WHEN a user views the dashboard THEN THE Dashboard_Page SHALL display KPI cards showing: Open Roles (with priority breakdown like "Priority: 3 High"), Active Candidates (with trend like "+18% vs last 30 days"), Interviews Today (with panel load info), and Offers Pending (with aging info like "3 offers > 5 days")
2. WHEN a user views the dashboard THEN THE Dashboard_Page SHALL display a role-wise pipeline table with columns: Role, Applicants, Interview, Offer, Age (days), SLA status (On track/At risk/Breached badges)
3. WHEN a user views the dashboard THEN THE Dashboard_Page SHALL display a hiring funnel visualization showing stages (Applied, Screened, Shortlisted, Interview, Offer, Hired) with candidate counts and bar widths proportional to volume
4. WHEN a user views the dashboard THEN THE Dashboard_Page SHALL display upcoming interviews list with: time, candidate name, role, panel members, meeting type (Google Meet/Zoom/In-office), and Join/Reschedule buttons
5. WHEN a user views the dashboard THEN THE Dashboard_Page SHALL display open tasks with: task type (Feedback/Approval/Reminder/Pipeline), description, age, severity badge (high=red, medium=orange), and Mark done button
6. WHEN a user views the dashboard THEN THE Dashboard_Page SHALL display alerts section with three levels: critical (red - SLA breaches), warning (orange - parsing failures), info (blue - new integrations) with action links
7. WHEN a user views the dashboard THEN THE Dashboard_Page SHALL display source performance horizontal bar chart showing: LinkedIn, Referrals, Job Board X, Career Page, Agencies with percentage bars
8. WHEN a user views the dashboard THEN THE Dashboard_Page SHALL display recruiter load list showing: recruiter name with specialty, active roles count, candidates count, and candidates per role ratio
9. WHEN a user views the dashboard THEN THE Dashboard_Page SHALL display an activity feed with timestamped entries showing recent actions like candidate movements, job postings, offer letters sent, and new candidates added
10. WHEN a user views the dashboard THEN THE Dashboard_Page SHALL display footer metrics showing Time-to-fill median and Offer acceptance rate

### Requirement 16: Roles & Pipelines Page

**User Story:** As a recruiter, I want to view and manage job pipelines, so that I can track candidates through the hiring process for each role.

#### Acceptance Criteria

1. WHEN a user views the roles page THEN THE Roles_Page SHALL display a roles table with columns: Role, Loc (location), Open (openings), Apps (applicants), Interv (interviews), SLA (status badge), Pri (priority pill)
2. WHEN a user selects a role THEN THE Roles_Page SHALL display the role name, meta info (department, location, recruiter), and action buttons (Edit JD, + Add candidate)
3. WHEN viewing a selected role THEN THE Roles_Page SHALL display KPI cards: Total candidates (with new this week), Interviews scheduled (with pending feedback), Offers made (with acceptance rate), Avg time in stage (with bottleneck indicator)
4. WHEN viewing a selected role THEN THE Roles_Page SHALL display a stage summary strip showing candidate count per stage as pills (Queue, Applied, Screening, Shortlisted, Interview, Offer, Hired, Rejected)
5. WHEN a user switches to table view THEN THE Roles_Page SHALL display candidates in a table with columns: Candidate (name + title), Stage (with colored pill), Score (high/med/low badge), Exp (years), Location, Source, Updated (date), Actions (Note/Move/Schedule/CV buttons)
6. WHEN a user switches to board view THEN THE Roles_Page SHALL display a kanban board with stage columns (Queue, Applied, Screening, Shortlisted, Interview, Offer, Hired) each showing candidate cards
7. WHEN viewing a candidate card in board view THEN THE Card SHALL display: candidate name, title, score badge, experience, location, skills tags, and action buttons (Note, Move, Schedule, CV)
8. WHEN a user clicks on a candidate THEN THE Roles_Page SHALL open a sliding detail panel from the right side with full candidate information
9. WHEN a user filters by department, location, or recruiter THEN THE Roles_Page SHALL filter the roles list accordingly
10. WHEN a user searches roles THEN THE Roles_Page SHALL filter roles matching the search query by title
11. WHEN viewing the page header THEN THE Roles_Page SHALL display: page title "Role-wise Pipeline", subtitle with counts (active roles, total openings, candidates in pipeline), client name pill, scope pill, and Export pipeline button

### Requirement 17: Candidate Database Page

**User Story:** As a recruiter, I want a master candidate database page, so that I can search and manage all candidates independent of their pipeline status.

#### Acceptance Criteria

1. WHEN a user views the candidate database THEN THE Candidate_Page SHALL display a master list table with columns: Name & contact (name, email, phone), Role & department, Experience (years), Current company / location, Source & availability, Skills snapshot & tags, Last updated, Actions
2. WHEN a user searches THEN THE Candidate_Page SHALL provide a search input with hint text showing examples like "Java Bangalore 5 yrs", "React remote immediate", "internal mobility"
3. WHEN a user applies filters THEN THE Candidate_Page SHALL provide dropdowns for: Department (Engineering/Product/Sales/HR), Location (Bangalore/Hyderabad/Chennai/Pune/Remote), Experience band (0-3/3-6/6-10/10+ yrs), Source (Job Board/Referral/Internal/LinkedIn/Headhunted), Availability (Immediate/15 days/30 days/60+ days), Tag, and Sort by (Recently updated/Name A-Z/Experience high-low)
4. WHEN a user views the candidate database THEN THE Candidate_Page SHALL display KPI cards: Total candidates (across all roles & years), Unique skills (distinct technical/functional skills), Locations covered (cities/remote options), Updated last 30 days (new or updated profiles)
5. WHEN a user views the candidate database THEN THE Candidate_Page SHALL display database insights section with four mini-cards: Top skills (skill tags), Top locations (location tags), Talent pool tags (category tags like Fintech, High priority), Sources (source tags)
6. WHEN a user clicks on a candidate row THEN THE Candidate_Page SHALL open a sliding detail panel showing: Profile summary, Primary department, Primary role, Total experience, Location preference, Current company, Current CTC / Expected CTC
7. WHEN viewing the detail panel THEN THE Candidate_Page SHALL display: Skills & keywords section with tag badges, ATS roles section showing roles applied with years, Contact & flags section (email, phone, source, internal mobility flag, availability)
8. WHEN viewing the detail panel THEN THE Candidate_Page SHALL display action buttons: View CV, Add to role, Share profile, Block candidate, and last updated timestamp
9. WHEN a user clicks "Save current view" THEN THE Candidate_Page SHALL allow saving the current filter configuration as a named view
10. WHEN viewing the page header THEN THE Candidate_Page SHALL display: page title "Master Candidate Database", subtitle describing offline master list, company pill, Saved views button, and Export candidates button
11. WHEN viewing the table footer THEN THE Candidate_Page SHALL display a tip about using filters and search for internal profiles

### Requirement 18: Candidate Profile Detail Panel

**User Story:** As a recruiter, I want a detailed candidate profile panel, so that I can view all candidate information and take actions without leaving the current page.

#### Acceptance Criteria

1. WHEN a user opens a candidate detail panel THEN THE Profile_Panel SHALL slide in from the right side with width of 300-320px and display candidate name and subtitle (Title · Location · Stage) in the header with a close button
2. WHEN viewing the profile panel THEN THE Profile_Panel SHALL display a Summary section with rows: Current company, Total experience, Current CTC, Expected CTC, Notice period - each as label-value pairs
3. WHEN viewing the profile panel THEN THE Profile_Panel SHALL display a CV section with a dashed border block showing CV filename and a "View CV" button
4. WHEN viewing the profile panel THEN THE Profile_Panel SHALL display a Skills & Tags section with skill badges in rounded pills with light background
5. WHEN viewing the profile panel THEN THE Profile_Panel SHALL display a Timeline section with a vertical line and timestamped entries showing stage changes and activities (e.g., "Applied via LinkedIn", "Moved to Screening", "Interview scheduled")
6. WHEN viewing the profile panel THEN THE Profile_Panel SHALL display a Notes section with a textarea placeholder "Add a note for this candidate..." and a "Save note" button
7. WHEN viewing the profile panel THEN THE Profile_Panel SHALL display an Actions section with buttons: Change Stage, Schedule Interview, Send Email, Reject - and a soft chip showing "Last updated: [date]"
8. WHEN a user saves a note THEN THE Profile_Panel SHALL persist the note and display a confirmation
9. WHEN a user clicks the close button (×) THEN THE Profile_Panel SHALL animate closed and return focus to the main content
10. WHEN the panel is open THEN THE Profile_Panel SHALL have a subtle shadow on the left edge to indicate overlay

### Requirement 19: Settings Page

**User Story:** As an admin, I want a settings page, so that I can configure company profile, manage users, and customize system settings.

#### Acceptance Criteria

1. WHEN an admin views the settings page THEN THE Settings_Page SHALL display tabs for Company Profile, User Management, and Role Configuration
2. WHEN viewing company profile settings THEN THE Settings_Page SHALL display editable fields for company name, logo, contact email, and address
3. WHEN viewing user management THEN THE Settings_Page SHALL display a table of all users with name, email, role, status, and action buttons
4. WHEN an admin clicks "Add User" THEN THE Settings_Page SHALL display a form for creating a new user with name, email, role selection, and temporary password
5. WHEN an admin edits a user THEN THE Settings_Page SHALL allow changing the user's role and active status
6. WHEN viewing role configuration THEN THE Settings_Page SHALL display the three roles (Admin, Hiring Manager, Recruiter) with their permission descriptions

### Requirement 20: Job Creation Page

**User Story:** As a recruiter or hiring manager, I want a job creation form, so that I can define new job requisitions with all required details.

#### Acceptance Criteria

1. WHEN a user opens the job creation page THEN THE Job_Form SHALL display input fields for job title, department, location, employment type, and salary range
2. WHEN a user fills the job form THEN THE Job_Form SHALL provide a rich text editor for entering the job description
3. WHEN a user submits the job form THEN THE Job_Form SHALL validate all required fields and display errors for missing information
4. WHEN a job is successfully created THEN THE Job_Form SHALL redirect to the roles page with the new job selected
5. WHEN editing an existing job THEN THE Job_Form SHALL pre-populate all fields with the current job data
6. WHEN a user cancels job creation THEN THE Job_Form SHALL discard changes and return to the previous page

### Requirement 21: Header Component

**User Story:** As a user, I want a consistent header across all pages, so that I can access global search, filters, and user profile options.

#### Acceptance Criteria

1. WHEN a user is logged in THEN THE Header_Component SHALL display a dark background (#020617) header with the page title and subtitle on the left side
2. WHEN viewing the header THEN THE Header_Component SHALL display a hamburger menu button (☰) to toggle the sidebar
3. WHEN viewing the header THEN THE Header_Component SHALL display a global search input with rounded pill style, placeholder "Search candidates, roles, tags...", and keyboard shortcut hint (Ctrl + K)
4. WHEN viewing the header THEN THE Header_Component SHALL display a time range filter dropdown (Last 7 days / Last 30 days / Last 90 days)
5. WHEN viewing the header THEN THE Header_Component SHALL display a user pill showing: circular avatar with initials, user name, role (e.g., "Client HR"), and company name
6. WHEN viewing the header THEN THE Header_Component SHALL display contextual pills showing current context (e.g., "Company: Acme Technologies", "Time zone: IST")
7. WHEN viewing the header THEN THE Header_Component SHALL display contextual action buttons with outline and primary styles (e.g., "Saved views", "Export", "+ New Role")

### Requirement 22: Responsive Layout

**User Story:** As a user, I want the portal to work on different screen sizes, so that I can access the ATS from various devices.

#### Acceptance Criteria

1. WHEN the viewport width is less than 900 pixels THEN THE Layout_Module SHALL hide the sidebar and display a hamburger menu
2. WHEN the viewport width is less than 1200 pixels THEN THE Layout_Module SHALL adjust grid layouts to fewer columns
3. WHEN the viewport width is less than 720 pixels THEN THE Layout_Module SHALL stack KPI cards vertically and adjust table layouts
4. WHEN a user clicks the hamburger menu on mobile THEN THE Layout_Module SHALL display the sidebar as an overlay

### Requirement 23: Loading and Error States

**User Story:** As a user, I want clear feedback during data loading and errors, so that I understand the system status at all times.

#### Acceptance Criteria

1. WHEN data is being fetched THEN THE UI_Module SHALL display a loading indicator in the relevant section
2. WHEN an API request fails THEN THE UI_Module SHALL display an error message with a retry option
3. WHEN a form submission fails THEN THE UI_Module SHALL display validation errors next to the relevant fields
4. WHEN no data is available THEN THE UI_Module SHALL display an empty state message with guidance on next steps

### Requirement 24: Candidate Stage Movement

**User Story:** As a recruiter, I want to move candidates between pipeline stages, so that I can track their progress through the hiring process.

#### Acceptance Criteria

1. WHEN a user changes a candidate's stage THEN THE Stage_Module SHALL update the candidate's current stage and record the timestamp
2. WHEN a stage change occurs THEN THE Stage_Module SHALL add an entry to the candidate's activity timeline
3. WHEN viewing stage options THEN THE Stage_Module SHALL display all available stages for the job's pipeline configuration
4. WHEN a candidate is moved to Rejected stage THEN THE Stage_Module SHALL prompt for a rejection reason before completing the action

### Requirement 25: Candidate Scoring

**User Story:** As a recruiter, I want to assign scores to candidates, so that I can quickly identify top candidates in the pipeline.

#### Acceptance Criteria

1. WHEN viewing a candidate card THEN THE Scoring_Module SHALL display the candidate's current score with color coding (green #dcfce7 for high 80-100, yellow #fef9c3 for medium 50-79, red #fee2e2 for low 0-49)
2. WHEN a user updates a candidate's score THEN THE Scoring_Module SHALL persist the score and update the display immediately
3. WHEN sorting candidates THEN THE Scoring_Module SHALL allow sorting by score in ascending or descending order
4. WHEN filtering candidates THEN THE Scoring_Module SHALL allow filtering by score range

### Requirement 26: Page Footer

**User Story:** As a user, I want a consistent footer across all pages, so that I can see contextual information and key metrics.

#### Acceptance Criteria

1. WHEN viewing any page THEN THE Footer_Component SHALL display a footer bar with muted text color (#64748b) and padding
2. WHEN viewing the footer THEN THE Footer_Component SHALL display contextual description text on the left side describing the current page purpose
3. WHEN viewing the footer THEN THE Footer_Component SHALL display key metrics on the right side (e.g., "Time-to-fill (median): 24 days · Offer acceptance: 78%")
4. WHEN viewing the dashboard footer THEN THE Footer_Component SHALL display "SnapFind Client ATS · Dashboard prototype for reference only"

### Requirement 27: Card and Badge Styling

**User Story:** As a user, I want consistent card and badge styling, so that information is presented clearly and uniformly.

#### Acceptance Criteria

1. WHEN displaying cards THEN THE Style_Module SHALL use white background (#ffffff), 12px border radius, 1px border (#e2e8f0), and subtle shadow
2. WHEN displaying status badges THEN THE Style_Module SHALL use rounded pills with: green (#dcfce7 bg, #166534 text) for positive/on-track, orange (#fef9c3 bg, #854d0e text) for warning/at-risk, red (#fee2e2 bg, #b91c1c text) for negative/breached, blue (#dbeafe bg, #1d4ed8 text) for info
3. WHEN displaying tags and chips THEN THE Style_Module SHALL use rounded pills with light background (#f8fafc), subtle border (#e2e8f0), and muted text (#4b5563)
4. WHEN displaying priority pills THEN THE Style_Module SHALL use warm colors (orange border #fed7aa, cream background #fffbeb, dark orange text #9a3412)

### Requirement 28: Button Styling

**User Story:** As a user, I want consistent button styling, so that interactive elements are clearly identifiable.

#### Acceptance Criteria

1. WHEN displaying primary buttons THEN THE Style_Module SHALL use blue background (#0b6cf0), white text, and rounded pill shape (999px radius)
2. WHEN displaying secondary buttons THEN THE Style_Module SHALL use light background (#f9fafb), dark text (#374151), and subtle border (#e2e8f0)
3. WHEN displaying outline buttons THEN THE Style_Module SHALL use transparent background, accent color text, and colored border
4. WHEN displaying mini action buttons THEN THE Style_Module SHALL use smaller padding (2px 6px), 9px font size, and contextual colors (note=gray, move=yellow, schedule=blue, cv=green)

### Requirement 29: Table Styling

**User Story:** As a user, I want consistent table styling, so that data is easy to read and interact with.

#### Acceptance Criteria

1. WHEN displaying tables THEN THE Style_Module SHALL use 10-12px font size, left-aligned text, and bottom borders (#e2e8f0) between rows
2. WHEN displaying table headers THEN THE Style_Module SHALL use muted color (#64748b), 500 font weight, and uppercase for section headers
3. WHEN hovering over table rows THEN THE Style_Module SHALL highlight the row with light blue background (#eff6ff)
4. WHEN a table row is selected THEN THE Style_Module SHALL highlight it with stronger blue background (#dbeafe)

### Requirement 30: Sample Data Content

**User Story:** As a developer, I want sample data matching the HTML pages, so that the application demonstrates realistic content.

#### Acceptance Criteria

1. WHEN displaying sample roles THEN THE Data_Module SHALL include: Senior Backend Engineer, Product Manager, Sales Lead (North), UX Designer, Data Analyst, Backend Engineer (L2), Backend Architect, SDE II (Platform)
2. WHEN displaying sample candidates THEN THE Data_Module SHALL include realistic names, companies (FinEdge Systems, CloudNova, NeoPay, CodeNest), locations (Bangalore, Hyderabad, Gurgaon, Chennai, Pune, Remote), and skills (Java, Spring Boot, Microservices, React, Node.js, PostgreSQL, Kafka)
3. WHEN displaying sample recruiters THEN THE Data_Module SHALL include: Aarti (Tech), Rahul (Product), Vikram (Sales), Sana (Design) with their role counts and candidate counts
4. WHEN displaying sample interview panels THEN THE Data_Module SHALL include: Panel A (Backend), Panel B (Architecture), Panel C (Hiring Mgr) with their performance metrics
5. WHEN displaying sample sources THEN THE Data_Module SHALL include: LinkedIn (44%), Referrals (19%), Job Board X (16%), Career Page (12%), Agencies (9%)
6. WHEN displaying sample metrics THEN THE Data_Module SHALL include: Time-to-fill median (24 days), Offer acceptance rate (78%), Interview-to-offer rate (22%), Overall rejection rate (64%)

