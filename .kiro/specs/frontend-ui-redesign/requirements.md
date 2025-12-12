# Requirements Document

## Introduction

This document specifies the requirements for redesigning the ATS Portal frontend UI to match a modern white and blue theme. The redesign focuses on visual styling changes only - all existing content, functionality, and data bindings must remain unchanged. The new design features a light-themed sidebar, clean white cards with subtle shadows, blue accent colors, and modern table/form layouts.

## Glossary

- **ATS Portal**: The Applicant Tracking System web application
- **Sidebar**: The left navigation panel containing menu items and user info
- **KPI Card**: Key Performance Indicator display cards showing metrics
- **Detail Panel**: The slide-out panel showing detailed information
- **Badge**: Small colored labels indicating status or category
- **Theme**: The visual styling including colors, shadows, and spacing

## Requirements

### Requirement 1

**User Story:** As a user, I want a light-themed sidebar with clean navigation, so that the interface feels modern and easy to navigate.

#### Acceptance Criteria

1. WHEN the sidebar is displayed THEN the system SHALL render it with a white/light gray background (#ffffff or #f8fafc) instead of dark background
2. WHEN navigation items are displayed THEN the system SHALL show them with dark text on light background with blue highlight for active state
3. WHEN the user info section is displayed THEN the system SHALL show user avatar, name, and email in the sidebar header area
4. WHEN a navigation item is active THEN the system SHALL highlight it with blue text color (#0b6cf0) and light blue background
5. WHEN the sidebar is collapsed THEN the system SHALL show only icons with the same light theme styling
6. WHEN the sidebar is displayed THEN the system SHALL show a Logout button at the bottom of the sidebar
7. WHEN the user clicks the Logout button THEN the system SHALL log the user out and redirect to the login page

### Requirement 2

**User Story:** As a user, I want a clean header with search functionality, so that I can quickly find what I need.

#### Acceptance Criteria

1. WHEN the header is displayed THEN the system SHALL render it with a white background and subtle bottom border
2. WHEN the search input is displayed THEN the system SHALL show it with a light gray background, rounded corners, and search icon
3. WHEN action buttons are displayed in the header THEN the system SHALL style primary buttons with blue background (#0b6cf0) and white text
4. WHEN user profile is displayed THEN the system SHALL show avatar and notification icons in the header right section

### Requirement 3

**User Story:** As a user, I want modern KPI cards with clean styling, so that I can quickly understand key metrics.

#### Acceptance Criteria

1. WHEN KPI cards are displayed THEN the system SHALL render them with white background, subtle shadow, and rounded corners
2. WHEN KPI values are displayed THEN the system SHALL show large bold numbers with smaller labels above
3. WHEN trend indicators are displayed THEN the system SHALL show them in green for positive, red for negative trends
4. WHEN multiple KPI cards are in a row THEN the system SHALL maintain consistent spacing and alignment

### Requirement 4

**User Story:** As a user, I want clean data tables with modern styling, so that I can easily scan and understand information.

#### Acceptance Criteria

1. WHEN tables are displayed THEN the system SHALL render them with white background, subtle borders, and clean row separation
2. WHEN table headers are displayed THEN the system SHALL show them with light gray background and uppercase text
3. WHEN status badges are displayed in tables THEN the system SHALL use colored pill-shaped badges (green for Active, orange for Pending, red for Inactive)
4. WHEN action buttons are displayed in table rows THEN the system SHALL show them as icon buttons or text links in blue
5. WHEN pagination is displayed THEN the system SHALL show numbered page buttons with blue highlight for current page

### Requirement 5

**User Story:** As a user, I want modern form layouts with clean inputs, so that data entry is intuitive and pleasant.

#### Acceptance Criteria

1. WHEN form inputs are displayed THEN the system SHALL render them with light gray borders, rounded corners, and adequate padding
2. WHEN form labels are displayed THEN the system SHALL show them above inputs with medium weight text
3. WHEN form sections are displayed THEN the system SHALL group related fields with section headers and subtle dividers
4. WHEN form buttons are displayed THEN the system SHALL show primary actions in blue and secondary actions in gray/outline style

### Requirement 6

**User Story:** As a user, I want consistent color theming across all pages, so that the application feels cohesive.

#### Acceptance Criteria

1. WHEN any page is displayed THEN the system SHALL use the primary blue color (#0b6cf0) for interactive elements and accents
2. WHEN backgrounds are displayed THEN the system SHALL use white (#ffffff) for cards and light gray (#f8fafc) for page backgrounds
3. WHEN text is displayed THEN the system SHALL use dark gray (#111827) for primary text and medium gray (#64748b) for secondary text
4. WHEN borders are displayed THEN the system SHALL use light gray (#e2e8f0) consistently across all components

### Requirement 7

**User Story:** As a user, I want the Dashboard page to display metrics and data in the new design style, so that it matches the overall theme.

#### Acceptance Criteria

1. WHEN the Dashboard page loads THEN the system SHALL display all existing KPI cards with the new white card styling
2. WHEN charts or graphs are displayed THEN the system SHALL render them with the blue color scheme and white backgrounds
3. WHEN the company table is displayed THEN the system SHALL show it with the new table styling including status badges
4. WHEN the donut/pie chart is displayed THEN the system SHALL use green and orange colors for Active/Suspended segments

### Requirement 8

**User Story:** As a user, I want the Settings page to display forms and user tables in the new design style, so that configuration is visually consistent.

#### Acceptance Criteria

1. WHEN the Settings page loads THEN the system SHALL display tab navigation with blue underline for active tab
2. WHEN the Company Profile form is displayed THEN the system SHALL show inputs with the new form styling
3. WHEN the User Management table is displayed THEN the system SHALL show it with avatar, role badges, and action links
4. WHEN the branding section is displayed THEN the system SHALL show logo upload area and color picker with clean styling

### Requirement 9

**User Story:** As a user, I want the Candidates page to display candidate data in the new design style, so that candidate management is visually appealing.

#### Acceptance Criteria

1. WHEN the Candidates page loads THEN the system SHALL display the candidate table with the new styling
2. WHEN candidate rows are displayed THEN the system SHALL show avatar, name/email, role badge, and status badge
3. WHEN filters are displayed THEN the system SHALL show dropdown selects with the new form input styling
4. WHEN the search bar is displayed THEN the system SHALL show it with rounded corners and search icon

### Requirement 10

**User Story:** As a user, I want the Roles page to display job pipelines in the new design style, so that recruitment tracking is visually clear.

#### Acceptance Criteria

1. WHEN the Roles page loads THEN the system SHALL display role cards and pipeline views with the new styling
2. WHEN pipeline stages are displayed THEN the system SHALL show them with clean card styling and stage indicators
3. WHEN candidate cards in pipeline are displayed THEN the system SHALL show them with avatar, name, and score badge

### Requirement 11

**User Story:** As a user, I want the Login page to have a clean, professional appearance, so that the first impression is positive.

#### Acceptance Criteria

1. WHEN the Login page loads THEN the system SHALL display a centered card with white background and subtle shadow
2. WHEN the login form is displayed THEN the system SHALL show inputs with the new form styling
3. WHEN the submit button is displayed THEN the system SHALL show it as a blue rounded button
4. WHEN the logo is displayed THEN the system SHALL show it centered above the form
