# Requirements Document

## Introduction

This feature enhances the job creation and editing workflow in the ATS portal. It introduces a comprehensive job posting form with detailed fields, a static mandatory criteria section, customizable pipeline stages during job creation, an enhanced application page with a two-column layout showing job details alongside the application form, and a "View Job Description" option in the Roles & Pipeline page.

## Glossary

- **Job_Form_System**: The system component responsible for creating and editing job postings
- **Application_Page_System**: The public-facing page where candidates apply for jobs
- **Pipeline_Stage_System**: The system component managing recruitment pipeline stages for jobs
- **Roles_Page_System**: The internal page displaying roles and their candidate pipelines
- **Mandatory_Criteria**: A static set of screening requirements displayed on all job postings
- **Work_Mode**: The employment arrangement type (Onsite, WFH, Hybrid, C2C, C2H)
- **Job_Priority**: The urgency level of filling a position (Low, Medium, High)
- **Job_Domain**: The functional area or category of the job role
- **Sub_Stage**: A child stage within a parent pipeline stage (e.g., Technical Interview under Interview)

## Requirements

### Requirement 1

**User Story:** As a recruiter, I want to create job postings with comprehensive details, so that I can accurately describe the position and attract qualified candidates.

#### Acceptance Criteria

1. WHEN a user accesses the job creation form THEN the Job_Form_System SHALL display input fields for Role Name, Experience Range (Min to Max), Salary Range (Min to Max), Variables (Incentives), Education Qualification, Number of Vacancies, Age Up to, Skills selection, Preferred Industry, Work Mode, Job Locations (multi-select), Job Priority, Job Domain, and Assign Recruiter
2. WHEN a user enters experience range THEN the Job_Form_System SHALL accept minimum and maximum values in years
3. WHEN a user enters salary range THEN the Job_Form_System SHALL accept minimum and maximum values with currency formatting
4. WHEN a user selects job locations THEN the Job_Form_System SHALL allow multiple city selections
5. WHEN a user selects work mode THEN the Job_Form_System SHALL provide options for Onsite, WFH, Hybrid, C2C, and C2H
6. WHEN a user selects job priority THEN the Job_Form_System SHALL provide options for Low, Medium, and High
7. WHEN a user submits the job form with required fields empty THEN the Job_Form_System SHALL display validation errors and prevent submission

### Requirement 2

**User Story:** As a recruiter, I want to include a job description section, so that I can provide detailed information about the role responsibilities and requirements.

#### Acceptance Criteria

1. WHEN a user accesses the job creation form THEN the Job_Form_System SHALL display a rich text editor for the Job Description section
2. WHEN a user enters job description content THEN the Job_Form_System SHALL support basic text formatting including bold, italic, bullet points, and headings
3. WHEN a user saves the job THEN the Job_Form_System SHALL persist the formatted job description content

### Requirement 3

**User Story:** As a recruiter, I want a static mandatory criteria section on all job postings, so that candidates understand the non-negotiable screening requirements.

#### Acceptance Criteria

1. WHEN a user views the job creation form THEN the Job_Form_System SHALL display a read-only Mandatory Criteria section with the predefined screening requirements
2. WHEN a job is created THEN the Job_Form_System SHALL automatically include the static mandatory criteria content
3. WHEN the mandatory criteria is displayed THEN the Job_Form_System SHALL show the following content: "Mandatory Criteria (Can't be neglected during screening): Preferred candidates from good startups only. 1. CA Candidates are not applicable for this role. 2. Need candidate from Tier 1 and Tier 2 colleges only. 3. 2–3 years of hands-on experience in Financial Analysis / FP&A. 4. Strong proficiency in Financial Modelling, forecasting, budgeting, and variance analysis. 5. Experience preparing financial reports, presentations, and management dashboards with Advance Excel skills. 6. Strong attention to detail with high accuracy in analysis and reporting. 7. Strong problem-solving skills and ability to recommend practical solutions on different Scenarios. 8. Candidate should be good in Cost Management. NOTE - Looking for highly Intentful and Enthusiatic candidates"

### Requirement 4

**User Story:** As a recruiter, I want to configure pipeline stages while creating a job, so that I can customize the hiring workflow for each position.

#### Acceptance Criteria

1. WHEN a user creates a job THEN the Pipeline_Stage_System SHALL display a section for configuring pipeline stages
2. WHEN the pipeline configuration is displayed THEN the Pipeline_Stage_System SHALL show mandatory stages (Screening, Shortlisted, Offer) that cannot be removed
3. WHEN a user adds interview stages THEN the Pipeline_Stage_System SHALL allow adding sub-stages such as Technical Interview and HR Interview under the Interview parent stage
4. WHEN a user configures stages THEN the Pipeline_Stage_System SHALL allow reordering of non-mandatory stages
5. WHEN a job is saved THEN the Pipeline_Stage_System SHALL persist the configured pipeline stages with the job

### Requirement 5

**User Story:** As a candidate, I want to see complete job details on the application page, so that I can make an informed decision before applying.

#### Acceptance Criteria

1. WHEN a candidate accesses the application page THEN the Application_Page_System SHALL display a two-column layout with job details on the left and the application form on the right
2. WHEN the job details section is displayed THEN the Application_Page_System SHALL show company information including company name and logo
3. WHEN the job details section is displayed THEN the Application_Page_System SHALL show all job posting details including Role Name, Experience Range, Salary Range, Variables, Education Qualification, Number of Vacancies, Age Limit, Required Skills, Preferred Industry, Work Mode, Job Locations, and Job Priority
4. WHEN the job details section is displayed THEN the Application_Page_System SHALL show the complete Job Description content
5. WHEN the job details section is displayed THEN the Application_Page_System SHALL show the Mandatory Criteria section
6. WHEN the page is viewed on mobile devices THEN the Application_Page_System SHALL stack the job details above the application form

### Requirement 6

**User Story:** As a recruiter, I want to view the job description from the Roles & Pipeline page, so that I can quickly reference job details without editing.

#### Acceptance Criteria

1. WHEN a user clicks on a job in the Roles & Pipeline page THEN the Roles_Page_System SHALL display a "View Job Description" button instead of "Edit JD"
2. WHEN a user clicks "View Job Description" THEN the Roles_Page_System SHALL open a modal or panel displaying the complete job details in read-only mode
3. WHEN the job description view is displayed THEN the Roles_Page_System SHALL show all job fields including Role Name, Experience Range, Salary Range, Work Mode, Locations, Job Description, and Mandatory Criteria

### Requirement 7

**User Story:** As a recruiter, I want to share the job posting link after creating a job, so that I can quickly distribute the job opening to potential candidates.

#### Acceptance Criteria

1. WHEN a job is successfully created THEN the Job_Form_System SHALL display a success popup with sharing options
2. WHEN the sharing popup is displayed THEN the Job_Form_System SHALL show a "Copy Link" button that copies the job application URL to clipboard
3. WHEN the sharing popup is displayed THEN the Job_Form_System SHALL show a "Share to WhatsApp" button that opens WhatsApp with a pre-filled message containing the job link
4. WHEN the user clicks "Copy Link" THEN the Job_Form_System SHALL copy the application page URL to the clipboard and display a confirmation message
5. WHEN the user clicks "Share to WhatsApp" THEN the Job_Form_System SHALL open WhatsApp (web or app) with the job title and application link pre-filled
6. WHEN the sharing popup is displayed THEN the Job_Form_System SHALL show a "Close" or "Go to Roles" button to dismiss the popup and navigate away

### Requirement 8

**User Story:** As a recruiter, I want to edit existing job postings, so that I can update job details as requirements change.

#### Acceptance Criteria

1. WHEN a user accesses the job edit page THEN the Job_Form_System SHALL pre-populate all form fields with the existing job data
2. WHEN a user modifies job fields THEN the Job_Form_System SHALL validate the updated data before saving
3. WHEN a user saves the edited job THEN the Job_Form_System SHALL persist all changes including updated pipeline stages
4. WHEN serializing job data for storage THEN the Job_Form_System SHALL convert the job object to JSON format
5. WHEN deserializing job data for display THEN the Job_Form_System SHALL parse the JSON and reconstruct the job object with all fields intact
