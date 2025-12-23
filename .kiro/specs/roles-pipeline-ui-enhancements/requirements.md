# Requirements Document

## Introduction

This document specifies the requirements for UI enhancements to the Roles & Pipelines page in the SnapFind ATS application. The improvements focus on adding an "Edit JD" button alongside the existing "View JD" button, increasing the width of the candidate detail sidebar for better readability, and adding a "More Info" button that navigates to the full candidate profile page.

## Glossary

- **Roles_Page**: The page displaying all job roles and their associated pipeline data with a split-panel layout
- **Job_Details_Panel**: The right panel showing selected job details, KPIs, and candidate pipeline
- **Candidate_Detail_Sidebar**: The slide-out panel that appears when clicking on a candidate, showing their summary information (used in both Roles_Page and Candidate_Master_Page)
- **Candidate_Master_Page**: The page displaying all candidates with filtering and search capabilities at `/candidates`
- **Edit_JD_Button**: A button that navigates to the job editing page for modifying the job description
- **More_Info_Button**: A button in the candidate sidebar that navigates to the full candidate profile page
- **Candidate_Profile_Page**: The dedicated page showing complete candidate information at `/candidates/:id`
- **Kanban_Board**: The board view in the Roles & Pipelines page that displays candidates as cards organized by pipeline stage
- **Drag_Indicator**: Visual feedback shown when a candidate card is being dragged (opacity, shadow)
- **Drop_Indicator**: Visual feedback shown on a stage column when a card is dragged over it (highlighted border)

## Requirements

### Requirement 1

**User Story:** As a recruiter, I want to edit the job description directly from the roles page, so that I can quickly update job details without navigating away.

#### Acceptance Criteria

1. WHEN a role is selected in the Roles_Page THEN the Job_Details_Panel SHALL display an "Edit JD" button next to the existing "View JD" button
2. WHEN a user clicks the Edit_JD_Button THEN the Roles_Page SHALL navigate to the job editing page for the selected role
3. WHEN the Edit_JD_Button is displayed THEN the Edit_JD_Button SHALL have consistent styling with the View_JD_Button
4. WHEN the Edit_JD_Button is clicked THEN the navigation SHALL include the job ID in the URL path

### Requirement 2

**User Story:** As a recruiter, I want a wider candidate detail sidebar, so that I can view candidate information more comfortably without excessive scrolling.

#### Acceptance Criteria

1. WHEN a candidate is clicked in the Roles_Page pipeline view THEN the Candidate_Detail_Sidebar SHALL open with a width of 500px instead of the current 400px
2. WHEN a candidate card is clicked in the Candidate_Master_Page THEN the Candidate_Detail_Sidebar SHALL open with a width of 500px
3. WHEN the Candidate_Detail_Sidebar is open THEN the sidebar SHALL maintain proper spacing and layout for all content sections
4. WHEN the screen width is below 768px THEN the Candidate_Detail_Sidebar SHALL take full screen width for mobile responsiveness
5. WHEN the Candidate_Detail_Sidebar width is increased THEN the backdrop overlay SHALL continue to function correctly
6. WHEN the CSS variable --detail-panel-width is updated THEN all pages using the DetailPanel component SHALL reflect the new width

### Requirement 3

**User Story:** As a recruiter, I want to quickly access the full candidate profile from the sidebar, so that I can view comprehensive candidate details when needed.

#### Acceptance Criteria

1. WHEN the Candidate_Detail_Sidebar is open THEN the sidebar SHALL display a "More Info" button in the header area
2. WHEN a user clicks the More_Info_Button THEN the Roles_Page SHALL navigate to the Candidate_Profile_Page for that candidate
3. WHEN the More_Info_Button is clicked THEN the navigation URL SHALL be `/candidates/{candidateId}`
4. WHEN the More_Info_Button is displayed THEN the button SHALL be visually distinct and easily accessible in the sidebar header
5. WHEN the More_Info_Button is clicked THEN the Candidate_Detail_Sidebar SHALL close before navigation occurs

### Requirement 4

**User Story:** As a recruiter, I want to drag and drop candidate cards between pipeline stages in the board view, so that I can quickly move candidates through the hiring process.

#### Acceptance Criteria

1. WHEN the board view is active THEN the Kanban_Board SHALL enable drag-and-drop functionality for candidate cards
2. WHEN a user starts dragging a candidate card THEN the card SHALL display a visual drag indicator (opacity change, shadow)
3. WHEN a user drags a card over a different stage column THEN the target column SHALL display a visual drop indicator (highlight border)
4. WHEN a user drops a candidate card into a different stage THEN the Kanban_Board SHALL call the pipeline API to update the candidate's stage
5. WHEN the stage update API call succeeds THEN the Kanban_Board SHALL update the UI to reflect the new stage position
6. WHEN the stage update API call fails THEN the Kanban_Board SHALL revert the card to its original position and display an error message
7. WHEN a candidate card is being dragged THEN other cards in the board SHALL remain interactive and not be affected
8. WHEN a card is dropped in the same stage THEN the Kanban_Board SHALL not make any API calls

