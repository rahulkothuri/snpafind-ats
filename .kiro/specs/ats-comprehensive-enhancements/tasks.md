# Implementation Plan: ATS Comprehensive Enhancements

## Overview

This implementation plan covers all enhancements in a logical order: database schema changes first, then backend services, followed by frontend components. Tasks are organized to build incrementally with testing integrated throughout.

## Tasks

- [x] 1. Database Schema Updates
  - [x] 1.1 Add score breakdown fields to Candidate model
    - Add domainScore, industryScore, keyResponsibilitiesScore columns
    - Create migration file
    - _Requirements: 8.1_

  - [x] 1.2 Add vendor role and job assignments
    - Add "vendor" to UserRole enum
    - Create VendorJobAssignment model with vendor-job relationship
    - Add relations to User and Job models
    - Create migration file
    - _Requirements: 10.1, 10.4_

  - [x] 1.3 Add auto-rejection rules to Job model
    - Add autoRejectionRules JSON field
    - Create migration file
    - _Requirements: 9.1_

  - [x] 1.4 Add interview round type to Interview model
    - Add roundType field to Interview model
    - Create migration file
    - _Requirements: 6.5_

  - [x] 1.5 Update default pipeline stages to include Selected
    - Update pipeline service to include Selected stage
    - Position: between Interview and Offer
    - _Requirements: 5.1_

- [x] 2. Checkpoint - Database migrations
  - Run all migrations and verify schema
  - Ensure all tests pass, ask the user if questions arise

- [x] 3. Backend Services - Score Breakdown
  - [x] 3.1 Update candidate service for score breakdown
    - Add score breakdown fields to candidate queries
    - Implement overall score calculation (average of non-null sub-scores)
    - Update candidate create/update endpoints
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [ ]* 3.2 Write property test for score average calculation
    - **Property 2: Score Average Calculation**
    - **Validates: Requirements 2.4, 2.7, 8.3**

  - [ ]* 3.3 Write property test for score breakdown round-trip
    - **Property 13: Score Breakdown API Round-Trip**
    - **Validates: Requirements 8.1, 8.2, 8.5**

- [x] 4. Backend Services - Flexible Auto-Rejection Rules
  - [x] 4.1 Update job service for flexible auto-rejection rules
    - Add autoRejectionRules to job create/update endpoints
    - Support new structure: array of rules with field, operator, value, logicConnector
    - Validate rules structure on save (valid fields, operators, values)
    - Return rules in job queries
    - _Requirements: 9.1, 9.7_

  - [x] 4.2 Implement flexible auto-rejection processing
    - Create auto-rejection evaluation function supporting multiple field types
    - Implement operator evaluation for numeric fields (less_than, greater_than, equals, not_equals, between)
    - Implement operator evaluation for text fields (equals, not_equals, contains, not_contains)
    - Implement operator evaluation for array fields (contains, not_contains, contains_all, contains_any)
    - Implement AND/OR logic between rules
    - Generate dynamic rejection reason based on triggered rule
    - Integrate with candidate application flow
    - Create activity log entry on rejection with specific rule details
    - Ensure non-retroactive behavior
    - _Requirements: 4.6, 4.7, 4.9, 4.10, 4.11, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 4.3 Write property test for flexible auto-rejection enforcement
    - **Property 4: Flexible Auto-Rejection Rule Enforcement**
    - **Validates: Requirements 4.6, 4.7, 4.9, 9.2, 9.3, 9.4, 9.5, 9.6**

  - [ ]* 4.4 Write property test for auto-rejection non-retroactivity
    - **Property 5: Auto-Rejection Non-Retroactivity**
    - **Validates: Requirements 4.11**

  - [ ]* 4.5 Write property test for flexible auto-rejection rules persistence
    - **Property 14: Flexible Auto-Rejection Rules Persistence**
    - **Validates: Requirements 9.1, 9.7**

- [x] 5. Backend Services - Pipeline Stages
  - [x] 5.1 Update pipeline service with Selected stage
    - Add Selected to DEFAULT_PIPELINE_STAGES constant
    - Update stage color mappings
    - Ensure correct ordering (Interview → Selected → Offer)
    - _Requirements: 5.1, 5.2_

  - [ ]* 5.2 Write property test for pipeline stage ordering
    - **Property 6: Pipeline Stage Ordering**
    - **Validates: Requirements 5.1, 5.2**

- [x] 6. Backend Services - Vendor Management
  - [x] 6.1 Create vendor service
    - Implement createVendor, updateVendor, deleteVendor
    - Implement getVendors, getVendorById
    - Implement assignJobsToVendor, removeJobAssignment
    - _Requirements: 7.3, 10.1, 10.4_

  - [x] 6.2 Create vendor routes
    - POST /vendors - create vendor
    - GET /vendors - list vendors
    - PUT /vendors/:id - update vendor
    - DELETE /vendors/:id - delete vendor
    - POST /vendors/:id/jobs - assign jobs
    - _Requirements: 7.3, 7.7_

  - [x] 6.3 Implement vendor access control middleware
    - Create vendorAccessControl middleware
    - Filter job queries for vendor users
    - Filter candidate queries for vendor users
    - _Requirements: 7.4, 7.6, 7.9, 10.2, 10.3_

  - [ ]* 6.4 Write property test for vendor access control
    - **Property 10: Vendor Access Control**
    - **Validates: Requirements 7.4, 7.6, 7.9, 10.2, 10.3**

  - [ ]* 6.5 Write property test for vendor role creation
    - **Property 11: Vendor Role Creation**
    - **Validates: Requirements 7.3, 10.1, 10.4**

  - [ ]* 6.6 Write property test for vendor job assignment updates
    - **Property 15: Vendor Job Assignment Updates**
    - **Validates: Requirements 10.5**

- [x] 7. Backend Services - Interview Round Type
  - [x] 7.1 Update interview service for round type
    - Add roundType to interview create/update
    - Return roundType in interview queries
    - Add endpoint to get interview round options for a job
    - _Requirements: 6.5, 6.6_

  - [ ]* 7.2 Write property test for interview round storage
    - **Property 8: Interview Round Storage**
    - **Validates: Requirements 6.5, 6.6**

- [x] 8. Checkpoint - Backend services complete
  - Ensure all backend tests pass
  - Verify API endpoints work correctly
  - Ask the user if questions arise

- [x] 9. Frontend - Pipeline Stage Constants
  - [x] 9.1 Create pipeline stage constants file
    - Create frontend/src/constants/pipelineStages.ts
    - Define DEFAULT_PIPELINE_STAGES with Selected
    - Define STAGE_COLORS with Selected styling
    - _Requirements: 5.1, 5.2, 5.5_

  - [x] 9.2 Update JobDetailsRightPanel with Selected stage
    - Import stage constants
    - Update defaultStages array
    - Update stageColors mapping
    - _Requirements: 5.2, 5.6, 5.7_

  - [x] 9.3 Update PipelineStageConfigurator with Selected stage
    - Update DEFAULT_PIPELINE_STAGES
    - Ensure Selected appears in stage configurator
    - _Requirements: 5.1_

- [x] 10. Frontend - Candidate Contact Display
  - [x] 10.1 Update CandidateTableView to show contact info
    - Add contact column to table
    - Display email and phone in compact format
    - Handle missing data gracefully
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 10.2 Update KanbanCard to show contact info
    - Add email and phone display
    - Style consistently with existing card design
    - _Requirements: 1.4_

  - [ ]* 10.3 Write property test for contact info display
    - **Property 1: Contact Information Display**
    - **Validates: Requirements 1.1, 1.2, 1.4**

- [x] 11. Frontend - Score Breakdown Component
  - [x] 11.1 Create ScoreBreakdown component
    - Create frontend/src/components/ScoreBreakdown.tsx
    - Display Domain, Industry, Key Responsibilities scores
    - Show visual indicators (progress bars or badges)
    - Handle null scores with "N/A"
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

  - [x] 11.2 Integrate ScoreBreakdown in DetailPanel
    - Add ScoreBreakdown section to CandidateDetailContent
    - Pass score breakdown props from candidate data
    - _Requirements: 2.1_

  - [x] 11.3 Update candidate row to show calculated average
    - Calculate average from sub-scores
    - Display in existing score column
    - _Requirements: 2.4_

  - [ ]* 11.4 Write property test for score breakdown display
    - **Property 3: Score Breakdown Display**
    - **Validates: Requirements 2.2, 2.3**

- [x] 12. Frontend - Flexible Auto-Rejection Rules
  - [x] 12.1 Update AutoRejectionRulesSection component for flexible rules
    - Update frontend/src/components/AutoRejectionRulesSection.tsx
    - Add field selector dropdown (experience, location, skills, education, salary_expectation)
    - Add operator selector that changes based on field type
    - Add value input that adapts to field type (number input, text input, multi-select for arrays)
    - Add "Add Rule" button to create new rule rows
    - Add delete button for each rule
    - Add AND/OR logic selector between rules
    - Display all configured rules clearly
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 4.12, 4.13_

  - [x] 12.2 Integrate AutoRejectionRulesSection in JobCreationPage
    - Add section to job creation form
    - Wire up form state and handlers
    - Include in job save payload
    - _Requirements: 4.1, 4.2_

  - [x] 12.3 Reorder Mandatory Criteria section
    - Move Mandatory Criteria after Job Description
    - Maintain existing functionality
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 13. Frontend - Interview Round Selection
  - [x] 13.1 Update InterviewScheduleModal with round selector
    - Add interview round dropdown
    - Fetch round options from job sub-stages
    - Fall back to default options
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 13.2 Update interview display to show round type
    - Show round type in interview cards
    - Show round type in interview dashboard
    - _Requirements: 6.6_

  - [ ]* 13.3 Write property test for interview round options
    - **Property 9: Interview Round Options from Sub-Stages**
    - **Validates: Requirements 6.2, 6.3**

- [x] 14. Frontend - Vendor Management
  - [x] 14.1 Create VendorManagementSection component
    - Create frontend/src/components/VendorManagementSection.tsx
    - Vendor table with Name, Email, Assigned Jobs, Status, Actions
    - Add vendor modal with form
    - Edit vendor modal
    - Job assignment multi-select
    - _Requirements: 7.1, 7.2, 7.5, 7.7_

  - [x] 14.2 Create vendor service
    - Create frontend/src/services/vendors.service.ts
    - Implement CRUD operations
    - Implement job assignment operations
    - _Requirements: 7.3_

  - [x] 14.3 Integrate VendorManagementSection in SettingsPage
    - Add Vendors section below Users section
    - Wire up vendor service calls
    - Handle loading and error states
    - _Requirements: 7.1_

  - [ ]* 14.4 Write property test for vendor table columns
    - **Property: Vendor table displays all required columns**
    - **Validates: Requirements 7.2**

- [x] 15. Checkpoint - Frontend components complete
  - Ensure all frontend tests pass
  - Verify UI components render correctly
  - Ask the user if questions arise

- [x] 16. Integration Testing
  - [x] 16.1 Write integration test for flexible auto-rejection flow
    - Create job with multiple auto-rejection rules (different fields and operators)
    - Submit candidate applications with various data
    - Verify candidates are rejected based on matching rules
    - Verify dynamic rejection reasons are correct
    - Test AND/OR logic between rules
    - _Requirements: 4.6, 4.7, 9.2, 9.3, 9.5, 9.6_

  - [x] 16.2 Write integration test for vendor workflow
    - Create vendor with job assignments
    - Verify vendor access restrictions
    - _Requirements: 7.4, 7.6, 10.2, 10.3_

  - [x] 16.3 Write integration test for interview scheduling with round
    - Schedule interview with round type
    - Verify round type is stored and displayed
    - _Requirements: 6.5, 6.6_

- [x] 17. Final Checkpoint
  - Run full test suite
  - Verify all features work end-to-end
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Database migrations should be run in order (1.1 → 1.5)
- Backend services should be completed before frontend integration

