# Requirements Document

## Introduction

This document outlines the requirements for improving the dashboard page layout and functionality in the ATS system. The changes focus on reorganizing the dashboard layout, enhancing navigation to related pages, and improving the visual design of key components.

## Glossary

- **Dashboard**: The main landing page that displays key metrics and information for users
- **Open Tasks**: A section displaying pending tasks that require user attention
- **Alerts**: A section showing important notifications and system alerts
- **Source Performance**: A section displaying metrics about recruitment source effectiveness
- **Role-wise Pipeline**: A component showing pipeline stages organized by job roles
- **Upcoming Interviews**: A section displaying scheduled interviews
- **View All Button**: A navigation element that redirects users to detailed pages

## Requirements

### Requirement 1

**User Story:** As a user, I want the dashboard layout to be reorganized with open tasks and alerts prominently displayed, so that I can quickly see what requires my immediate attention.

#### Acceptance Criteria

1. WHEN a user loads the dashboard page, THE system SHALL display open tasks and alerts in the top right position
2. WHEN the dashboard renders, THE system SHALL move the source performance cards to the bottom section
3. WHEN the layout is reorganized, THE system SHALL maintain visual balance and readability
4. WHEN displaying the new layout, THE system SHALL ensure all components remain fully functional

### Requirement 2

**User Story:** As a user, I want to see a limited number of roles in the role-wise pipeline with a "View All" option, so that I can access detailed pipeline information when needed.

#### Acceptance Criteria

1. WHEN the role-wise pipeline section loads, THE system SHALL display a maximum of 6-7 roles
2. WHEN there are more than 7 roles available, THE system SHALL show a "View All" button
3. WHEN a user clicks the "View All" button in the role-wise pipeline, THE system SHALL redirect to the roles and pipelines page
4. WHEN displaying limited roles, THE system SHALL show the most relevant or recently active roles first

### Requirement 3

**User Story:** As a user, I want to see a limited number of upcoming interviews with a "View All" option, so that I can access the complete interviews list when needed.

#### Acceptance Criteria

1. WHEN the upcoming interviews section loads, THE system SHALL display a maximum of 5 interviews
2. WHEN there are more than 5 interviews scheduled, THE system SHALL show a "View All" button
3. WHEN a user clicks the "View All" button in upcoming interviews, THE system SHALL redirect to the interviews page
4. WHEN displaying limited interviews, THE system SHALL show the most chronologically relevant interviews first

### Requirement 4

**User Story:** As a user, I want the open tasks and alerts sections to have an improved visual design, so that the interface is more appealing and professional.

#### Acceptance Criteria

1. WHEN displaying open tasks, THE system SHALL use appropriate and professional emoji icons instead of hardcoded HTML entities
2. WHEN rendering alerts, THE system SHALL apply modern styling that enhances readability and visual appeal
3. WHEN showing task and alert items, THE system SHALL use consistent typography and spacing
4. WHEN the sections are displayed, THE system SHALL maintain accessibility standards for color contrast and text readability
5. WHEN users interact with tasks and alerts, THE system SHALL provide clear visual feedback and hover states