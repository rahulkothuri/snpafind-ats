# Requirements Document

## Introduction

This document specifies comprehensive enhancements to the ATS (Applicant Tracking System) including candidate display improvements, detailed scoring breakdown, auto-rejection rules, pipeline stage updates, interview round selection, and vendor management functionality.

## Glossary

- **ATS**: Applicant Tracking System - the software platform for managing recruitment
- **Pipeline_Stage**: A step in the hiring process (Queue, Applied, Screening, Shortlisted, Interview, Selected, Offer, Hired, Rejected)
- **Candidate_Row**: A row displaying candidate information in the roles/pipeline view
- **Detail_Sidebar**: The sliding panel that appears when clicking on a candidate
- **Score_Breakdown**: Detailed scoring showing Domain, Industry, and Key Responsibilities scores
- **Auto_Rejection_Rule**: Automated rule that moves candidates to rejection based on criteria
- **Interview_Round**: A specific type of interview (Technical Round, HR Round, etc.)
- **Vendor**: Third-party recruitment agency with limited access to assigned job roles
- **Mandatory_Criteria**: Screening criteria defined during job creation

## Requirements

### Requirement 1: Display Candidate Contact Information in Pipeline Rows

**User Story:** As a recruiter, I want to see candidate phone number and email in the pipeline candidate rows, so that I can quickly contact candidates without opening their profile.

#### Acceptance Criteria

1. WHEN displaying a candidate row in the roles/pipeline table view THEN THE Candidate_Row SHALL display the candidate's phone number
2. WHEN displaying a candidate row in the roles/pipeline table view THEN THE Candidate_Row SHALL display the candidate's email address
3. WHEN displaying contact information THEN THE Candidate_Row SHALL show phone and email in a compact format that does not disrupt the existing layout
4. WHEN displaying a candidate card in the kanban board view THEN THE Candidate_Card SHALL display the candidate's phone number and email
5. WHEN contact information is not available THEN THE Candidate_Row SHALL display a placeholder or empty state gracefully

### Requirement 2: Detailed Score Breakdown in Candidate Sidebar

**User Story:** As a hiring manager, I want to see a detailed breakdown of candidate scores by Domain, Industry, and Key Responsibilities, so that I can make informed decisions about candidate fit.

#### Acceptance Criteria

1. WHEN a user clicks on a candidate to open the detail sidebar THEN THE Detail_Sidebar SHALL display a Score Breakdown section
2. WHEN displaying the Score Breakdown section THEN THE Detail_Sidebar SHALL show three sub-scores: Domain Score, Industry Score, and Key Responsibilities Score
3. WHEN displaying sub-scores THEN THE Detail_Sidebar SHALL show each score as a percentage or numeric value with visual indicators
4. WHEN displaying the overall score in the candidate row THEN THE Candidate_Row SHALL show the average of the three sub-scores
5. WHEN any sub-score is not available THEN THE Detail_Sidebar SHALL display "N/A" or a placeholder for that category
6. WHEN displaying the Score Breakdown THEN THE Detail_Sidebar SHALL use visual styling consistent with the existing sidebar design
7. WHEN calculating the overall score THEN THE System SHALL compute it as the average of Domain, Industry, and Key Responsibilities scores

### Requirement 3: Move Mandatory Criteria Section in Job Creation

**User Story:** As a recruiter, I want the mandatory criteria section to appear after the job description section in job creation, so that the form flow is more logical.

#### Acceptance Criteria

1. WHEN creating or editing a job THEN THE Job_Creation_Form SHALL display the Mandatory Criteria section after the Job Description section
2. WHEN displaying the job creation form THEN THE Job_Creation_Form SHALL maintain all existing mandatory criteria functionality
3. WHEN saving a job THEN THE System SHALL persist mandatory criteria data correctly regardless of section position

### Requirement 4: Flexible Auto-Rejection Rules for Candidates

**User Story:** As a recruiter, I want to set flexible auto-rejection rules based on any candidate field when creating a job, so that candidates who don't meet custom criteria are automatically moved to the rejection stage.

#### Acceptance Criteria

1. WHEN creating or editing a job THEN THE Job_Creation_Form SHALL display an Auto-Rejection Rules section with ability to add multiple rules
2. WHEN configuring auto-rejection rules THEN THE System SHALL allow selecting from multiple candidate fields including: experience, location, skills, education, and other candidate attributes
3. WHEN configuring a rule THEN THE System SHALL allow selecting an operator appropriate to the field type:
   - Numeric fields (experience): less_than, greater_than, equals, not_equals, between
   - Text fields (location, education): equals, not_equals, contains, not_contains
   - Array fields (skills): contains, not_contains, contains_all, contains_any
4. WHEN configuring a rule THEN THE System SHALL allow entering a value or values appropriate to the selected field and operator
5. WHEN multiple rules are configured THEN THE System SHALL allow specifying AND/OR logic between rules
6. WHEN a candidate applies and matches any rejection rule THEN THE System SHALL automatically move the candidate to the Rejected stage
7. WHEN auto-rejecting a candidate THEN THE System SHALL record a dynamic rejection reason indicating which rule triggered the rejection (e.g., "Auto-rejected: Experience (2 years) is less than required (5 years)")
8. WHEN displaying auto-rejection rules THEN THE Job_Creation_Form SHALL show all configured rules clearly with field, operator, and value
9. WHEN auto-rejection is triggered THEN THE System SHALL create an activity log entry for the candidate with the specific rule that triggered rejection
10. WHEN no auto-rejection rules are configured THEN THE System SHALL process applications normally without automatic rejection
11. IF auto-rejection rules are modified after candidates have applied THEN THE System SHALL NOT retroactively apply new rules to existing candidates
12. WHEN adding a new rule THEN THE System SHALL provide an "Add Rule" button that creates a new rule row with field, operator, and value inputs
13. WHEN removing a rule THEN THE System SHALL allow deleting individual rules from the configuration

### Requirement 5: Add Selected Stage to Pipeline

**User Story:** As a recruiter, I want a "Selected" stage in the pipeline between Interview and Offer, so that I can track candidates who have been selected but not yet offered.

#### Acceptance Criteria

1. WHEN creating a new job THEN THE Pipeline_Module SHALL initialize default stages including: Queue, Applied, Screening, Shortlisted, Interview, Selected, Offer, Hired, and Rejected
2. WHEN displaying pipeline stages in the roles/pipeline view THEN THE System SHALL show the Selected stage between Interview and Offer
3. WHEN filtering candidates by stage THEN THE Filter_Component SHALL include the Selected stage option
4. WHEN moving candidates between stages THEN THE System SHALL allow movement to and from the Selected stage
5. WHEN displaying stage colors THEN THE Selected stage SHALL have a distinct visual style consistent with other stages
6. WHEN displaying the kanban board THEN THE Board_View SHALL include a Selected column
7. WHEN displaying stage summary strip THEN THE Summary_Strip SHALL include the Selected stage count

### Requirement 6: Interview Round Selection During Scheduling

**User Story:** As a recruiter, I want to select the interview round type when scheduling an interview, so that candidates and interviewers know what type of interview to expect.

#### Acceptance Criteria

1. WHEN scheduling an interview THEN THE Interview_Schedule_Modal SHALL display an Interview Round/Type selector
2. WHEN displaying interview round options THEN THE Modal SHALL show options based on the job's pipeline sub-stages (e.g., Technical Round, HR Round, Managerial Round)
3. WHEN a job has custom interview sub-stages defined THEN THE Modal SHALL display those custom sub-stages as options
4. WHEN no custom sub-stages are defined THEN THE Modal SHALL display default interview round options (Technical Round, HR Round, Final Round)
5. WHEN an interview is scheduled with a round type THEN THE System SHALL store the round type with the interview record
6. WHEN displaying scheduled interviews THEN THE System SHALL show the interview round type

### Requirement 7: Vendor Management in User Settings

**User Story:** As an admin, I want to add and manage vendors (third-party recruitment agencies) in user management, so that I can give external recruiters limited access to specific job roles.

#### Acceptance Criteria

1. WHEN viewing the User Management settings tab THEN THE Settings_Page SHALL display a Vendors section below the Users section
2. WHEN displaying the Vendors section THEN THE Settings_Page SHALL show a table of vendors with columns: Name, Email, Assigned Jobs, Status, Actions
3. WHEN adding a new vendor THEN THE System SHALL create a vendor user with role type "vendor"
4. WHEN a vendor is created THEN THE Vendor SHALL have the same permissions as a recruiter but limited to assigned job roles only
5. WHEN assigning jobs to a vendor THEN THE System SHALL allow selecting multiple jobs for the vendor to access
6. WHEN a vendor logs in THEN THE System SHALL only show data for jobs they are assigned to
7. WHEN displaying vendor actions THEN THE Settings_Page SHALL show Edit, Deactivate, and Remove options
8. WHEN deactivating a vendor THEN THE System SHALL revoke their access while preserving their data
9. WHEN a vendor accesses the system THEN THE System SHALL enforce the same data isolation as recruiters with job-level access control

### Requirement 8: Backend Support for Score Breakdown

**User Story:** As a system, I want to store and retrieve detailed score breakdowns for candidates, so that the frontend can display comprehensive scoring information.

#### Acceptance Criteria

1. WHEN storing candidate scores THEN THE Database SHALL support storing Domain Score, Industry Score, and Key Responsibilities Score
2. WHEN retrieving candidate data THEN THE API SHALL return the score breakdown fields
3. WHEN calculating overall score THEN THE System SHALL compute it as the average of available sub-scores
4. WHEN a sub-score is null THEN THE System SHALL exclude it from the average calculation
5. WHEN updating candidate scores THEN THE API SHALL accept individual sub-score updates

### Requirement 9: Backend Support for Flexible Auto-Rejection Rules

**User Story:** As a system, I want to store and process flexible auto-rejection rules for jobs, so that candidates can be automatically filtered based on multiple configurable criteria.

#### Acceptance Criteria

1. WHEN storing job data THEN THE Database SHALL support storing auto-rejection rules as JSON with structure for multiple rules, each containing field, operator, value, and logic connector
2. WHEN a candidate applies to a job THEN THE System SHALL evaluate all auto-rejection rules in order
3. WHEN evaluating rules THEN THE System SHALL support the following operators:
   - Numeric: less_than, greater_than, equals, not_equals, between
   - Text: equals, not_equals, contains, not_contains
   - Array: contains, not_contains, contains_all, contains_any
4. WHEN multiple rules exist THEN THE System SHALL evaluate them using the specified AND/OR logic
5. WHEN any rule (or rule combination based on logic) matches THEN THE System SHALL move the candidate to the Rejected stage
6. WHEN auto-rejection occurs THEN THE System SHALL create an activity record with a dynamic rejection reason specifying which rule triggered the rejection
7. WHEN retrieving job data THEN THE API SHALL return the complete auto-rejection rules configuration

### Requirement 10: Backend Support for Vendor Role

**User Story:** As a system, I want to support a vendor user role with appropriate access controls, so that external recruiters can be managed separately.

#### Acceptance Criteria

1. WHEN creating a user THEN THE System SHALL support the "vendor" role type
2. WHEN a vendor accesses job data THEN THE System SHALL filter results to only assigned jobs
3. WHEN a vendor accesses candidate data THEN THE System SHALL filter results to candidates in assigned jobs only
4. WHEN assigning jobs to vendors THEN THE Database SHALL store the vendor-job assignments
5. WHEN a vendor's job assignment changes THEN THE System SHALL immediately update their access permissions

