# Requirements Document

## Introduction

This document specifies the requirements for improving the Roles & Pipelines page in the SnapFind ATS application. The improvements focus on enhancing the user experience by implementing a split-panel layout (roles list on left, job details on right), adding search and filtering capabilities, fixing data accuracy issues with application counts, and resolving the logout redirect issue.

## Glossary

- **Roles_Page**: The page displaying all job roles and their associated pipeline data
- **Split_Panel_Layout**: A two-column layout where the left panel shows the roles list and the right panel shows selected job details
- **Open_Role**: A job role with status 'active' that is currently accepting applications
- **Closed_Role**: A job role with status 'closed' or 'paused' that is no longer accepting applications
- **Toggle_Filter**: An ON/OFF switch component that filters roles by their open/closed status
- **Application_Count**: The number of candidates who have applied to a specific job role
- **Candidate_Search**: A search functionality to filter candidates within a selected job role
- **Logout_Redirect**: The action of clearing authentication state and navigating to the login page

## Requirements

### Requirement 1

**User Story:** As a recruiter, I want to search for specific job roles by name, so that I can quickly find the role I need to manage.

#### Acceptance Criteria

1. WHEN the Roles_Page loads THEN the Roles_Page SHALL display a search input field above the roles list
2. WHEN a user types in the search input THEN the Roles_Page SHALL filter the roles list to show only roles whose title contains the search text (case-insensitive)
3. WHEN the search input is cleared THEN the Roles_Page SHALL display all roles matching the current toggle filter state
4. WHEN no roles match the search criteria THEN the Roles_Page SHALL display an empty state message indicating no matching roles

### Requirement 2

**User Story:** As a recruiter, I want to toggle between viewing open and closed roles, so that I can focus on active hiring or review completed positions.

#### Acceptance Criteria

1. WHEN the Roles_Page loads THEN the Roles_Page SHALL display a toggle switch with "Open" and "Closed" options
2. WHEN the toggle is set to "Open" THEN the Roles_Page SHALL display only roles with status 'active'
3. WHEN the toggle is set to "Closed" THEN the Roles_Page SHALL display only roles with status 'closed' or 'paused'
4. WHEN the toggle state changes THEN the Roles_Page SHALL immediately update the roles list without page reload
5. WHEN the toggle is set to "Open" THEN the toggle SHALL be the default state on page load

### Requirement 3

**User Story:** As a recruiter, I want to search for candidates within a selected job role, so that I can quickly find specific applicants.

#### Acceptance Criteria

1. WHEN a job role is selected THEN the Roles_Page SHALL display a candidate search input in the job details section
2. WHEN a user types in the candidate search input THEN the Roles_Page SHALL filter the candidates list to show only candidates whose name contains the search text (case-insensitive)
3. WHEN the candidate search input is cleared THEN the Roles_Page SHALL display all candidates for the selected role matching the current stage filter
4. WHEN no candidates match the search criteria THEN the Roles_Page SHALL display an empty state message indicating no matching candidates

### Requirement 4

**User Story:** As a recruiter, I want to see accurate application counts for each role, so that I can understand the true pipeline status.

#### Acceptance Criteria

1. WHEN the Roles_Page displays a role in the list THEN the Roles_Page SHALL show the actual candidate count from the database in the "Apps" column
2. WHEN a new candidate applies to a job THEN the Roles_Page SHALL reflect the updated count after data refresh
3. WHEN the Roles_Page fetches job data THEN the Roles_Page SHALL use the candidateCount field from the API response
4. WHEN a job has zero applications THEN the Roles_Page SHALL display "0" in the Apps column

### Requirement 5

**User Story:** As a recruiter, I want to view job details without scrolling, so that I can see all information in a single screen.

#### Acceptance Criteria

1. WHEN the Roles_Page loads THEN the Roles_Page SHALL display a split-panel layout with roles list on the left (40% width) and job details on the right (60% width)
2. WHEN a user clicks on a role in the left panel THEN the Roles_Page SHALL display that role's details in the right panel without page navigation
3. WHEN the right panel displays job details THEN the Roles_Page SHALL show KPI cards, pipeline stages, and candidate list within the visible viewport
4. WHEN the screen width is below 1024px THEN the Roles_Page SHALL stack the panels vertically with roles list on top
5. WHEN no role is selected THEN the right panel SHALL display a placeholder message prompting the user to select a role

### Requirement 6

**User Story:** As a user, I want the logout button to immediately redirect me to the login page, so that I can securely end my session.

#### Acceptance Criteria

1. WHEN a user clicks the logout button THEN the Sidebar SHALL clear the authentication token from local storage
2. WHEN a user clicks the logout button THEN the Sidebar SHALL clear the user data from local storage
3. WHEN a user clicks the logout button THEN the Sidebar SHALL navigate to the login page immediately
4. WHEN the logout action completes THEN the Login_Page SHALL be displayed without requiring a page refresh
