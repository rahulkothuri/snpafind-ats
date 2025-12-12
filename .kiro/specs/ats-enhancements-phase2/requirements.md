# Requirements Document

## Introduction

This document defines the requirements for Phase 2 enhancements of the ATS (Applicant Tracking System) Portal. This phase focuses on admin sign-up functionality, enhanced company profile setup, sidebar UI redesign with React Icons, job creation workflow improvements, and a public job application form for candidates. The system continues to use React for the frontend with a blue and white theme, PostgreSQL for the database, and JWT for authentication.

### Features to be Implemented

1. **Admin Sign-up Page** - Registration page for new admin users with database storage and authentication
2. **Enhanced Company Profile Setup** - Comprehensive company profile with industry-standard fields
3. **Sidebar UI Redesign** - React Icons, improved hover states, repositioned user profile and logout
4. **Job Creation Workflow** - Complete job creation with database integration
5. **Public Job Application Form** - Multi-step application form for candidates to apply and upload resumes

## Glossary

- **ATS**: Applicant Tracking System - software that manages the recruitment and hiring process
- **Admin**: System administrator with full access to all features including user registration
- **Company Profile**: Organization details including name, industry, size, branding, and contact information
- **Job Application Form**: Public-facing form where candidates submit their applications
- **React Icons**: Popular icon library for React applications providing consistent iconography
- **Sidebar**: Left navigation panel containing menu items, user info, and logout functionality
- **Multi-step Form**: Form divided into logical sections with progress indicator

## Requirements

### Requirement 1: Admin Sign-up Page

**User Story:** As a new admin, I want to register for an account, so that I can set up and manage my company's ATS portal.

#### Acceptance Criteria

1. WHEN a user navigates to the sign-up page THEN THE Registration_System SHALL display a form with fields for full name, email, password, confirm password, and company name
2. WHEN a user submits valid registration data THEN THE Registration_System SHALL create a new admin user account and associated company record
3. WHEN a user submits a password THEN THE Registration_System SHALL validate that the password is at least 8 characters and matches the confirm password field
4. WHEN a user submits an email that already exists THEN THE Registration_System SHALL display an error message indicating the email is already registered
5. WHEN registration is successful THEN THE Registration_System SHALL redirect the user to the login page with a success message
6. WHEN viewing the sign-up page THEN THE Registration_System SHALL display a link to the login page for existing users

### Requirement 2: Enhanced Company Profile Setup

**User Story:** As an admin, I want to configure comprehensive company profile details, so that the ATS reflects my organization's identity and requirements.

#### Acceptance Criteria

1. WHEN an admin views the company profile page THEN THE Company_Module SHALL display sections for Company Details, Branding, Contact & Location, and Social Media Links
2. WHEN editing company details THEN THE Company_Module SHALL provide fields for company name, website URL, company size dropdown, and industry dropdown
3. WHEN editing company details THEN THE Company_Module SHALL provide a text area for company description
4. WHEN editing branding THEN THE Company_Module SHALL provide logo upload functionality and primary brand color picker
5. WHEN editing contact & location THEN THE Company_Module SHALL provide fields for contact email, phone number, address, city, state, country, and postal code
6. WHEN editing social media links THEN THE Company_Module SHALL provide fields for LinkedIn, Twitter, Facebook, and company careers page URLs
7. WHEN an admin saves company profile changes THEN THE Company_Module SHALL persist all fields to the database and display a success confirmation
8. WHEN viewing the company profile THEN THE Company_Module SHALL display the company logo preview and all configured information

### Requirement 3: Sidebar UI Redesign

**User Story:** As a user, I want a modern sidebar with professional icons and intuitive layout, so that navigation is visually appealing and efficient.

#### Acceptance Criteria

1. WHEN the sidebar is displayed THEN THE Navigation_Module SHALL use React Icons (react-icons library) instead of emoji characters for all navigation items
2. WHEN a navigation item is hovered THEN THE Navigation_Module SHALL apply a complete blue background (#0b6cf0) with white text instead of left border highlight
3. WHEN a navigation item is active THEN THE Navigation_Module SHALL display it with complete blue background (#0b6cf0) and white text
4. WHEN the sidebar is displayed THEN THE Navigation_Module SHALL show the user profile section at the bottom of the sidebar above the logout button
5. WHEN the sidebar is displayed THEN THE Navigation_Module SHALL show a logout button below the user profile section
6. WHEN the sidebar is displayed THEN THE Navigation_Module SHALL show a menu/hamburger icon at the top that toggles sidebar collapse/expand
7. WHEN the sidebar is displayed THEN THE Navigation_Module SHALL NOT display the collapse arrow at the bottom (removed)
8. WHEN the user clicks the menu icon THEN THE Navigation_Module SHALL toggle the sidebar between expanded (210px) and collapsed (60px) states

### Requirement 4: Job Creation Workflow

**User Story:** As a recruiter or hiring manager, I want to create job requisitions that are properly stored in the database, so that I can start receiving applications.

#### Acceptance Criteria

1. WHEN a user clicks "Create Job" in the sidebar or dashboard THEN THE Job_Module SHALL navigate to the job creation page
2. WHEN a user fills the job creation form THEN THE Job_Module SHALL validate required fields (title, department, location) before submission
3. WHEN a job is successfully created THEN THE Job_Module SHALL store the job in the database with all provided details and default pipeline stages
4. WHEN a job is created THEN THE Job_Module SHALL generate a unique public application URL for that job
5. WHEN viewing the jobs list THEN THE Job_Module SHALL display all created jobs with their status, applicant count, and creation date

### Requirement 5: Public Job Application Form

**User Story:** As a job applicant, I want to apply for positions through a professional application form, so that I can submit my candidacy with all required information.

#### Acceptance Criteria

1. WHEN an applicant accesses a job application URL THEN THE Application_Form SHALL display the job title, company name, location, and job type
2. WHEN an applicant views the application form THEN THE Application_Form SHALL display a multi-step progress indicator showing current step and total steps
3. WHEN filling personal information THEN THE Application_Form SHALL provide fields for full name, email, phone, and current location
4. WHEN filling personal information THEN THE Application_Form SHALL provide optional fields for LinkedIn profile URL and portfolio/website URL
5. WHEN uploading resume THEN THE Application_Form SHALL accept PDF, DOC, and DOCX files up to 5MB with drag-and-drop support
6. WHEN filling additional information THEN THE Application_Form SHALL provide an optional cover letter text area
7. WHEN filling additional information THEN THE Application_Form SHALL provide a field for desired salary (optional)
8. WHEN filling additional information THEN THE Application_Form SHALL provide a work authorization question with Yes/No options
9. WHEN submitting the application THEN THE Application_Form SHALL require agreement to privacy policy and terms of service
10. WHEN an application is submitted THEN THE Application_Form SHALL store the candidate data and resume in the database
11. WHEN an application is submitted THEN THE Application_Form SHALL display a confirmation message and the application should appear in the ATS portal
12. WHEN an applicant submits with an existing email THEN THE Application_Form SHALL update the existing candidate record and add the new job application

### Requirement 6: Application Data Integration

**User Story:** As a recruiter, I want submitted applications to appear in the ATS portal, so that I can review and process candidates.

#### Acceptance Criteria

1. WHEN a new application is submitted THEN THE Candidate_Module SHALL create or update the candidate record in the database
2. WHEN a new application is submitted THEN THE Candidate_Module SHALL associate the candidate with the job and set initial pipeline stage to "Applied"
3. WHEN viewing the candidate database THEN THE Candidate_Module SHALL display all candidates including those from public applications
4. WHEN viewing a job's pipeline THEN THE Pipeline_Module SHALL show candidates who applied through the public form

### Requirement 7: Database Schema Updates

**User Story:** As a system administrator, I want the database to support all new company profile fields, so that data is properly stored and retrievable.

#### Acceptance Criteria

1. WHEN storing company data THEN THE Database_Module SHALL support fields for website, company size, industry, description, phone, city, state, country, postal code, and social media URLs
2. WHEN storing company data THEN THE Database_Module SHALL support logo URL and brand color fields
3. WHEN serializing company data for API responses THEN THE Database_Module SHALL encode all fields using JSON format
4. WHEN deserializing company data from storage THEN THE Database_Module SHALL decode JSON fields and return equivalent company objects

