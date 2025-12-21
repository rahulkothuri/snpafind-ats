# Implementation Plan

- [x] 1. Backend Access Control Implementation
  - Implement job filtering middleware based on user roles and assignments
  - Add permission validation service for job operations
  - Create database indexes for efficient role-based queries
  - _Requirements: 1.1, 1.4, 4.1, 4.2_

- [ ]* 1.1 Write property test for access control enforcement
  - **Property 1: Access Control Enforcement**
  - **Validates: Requirements 1.1, 1.4**

- [x] 1.2 Update job service with role-based filtering
  - Modify getJobs method to filter by user role and assignments
  - Add validateJobAccess method for permission checking
  - Update job assignment logic with immediate permission updates
  - _Requirements: 1.1, 1.2, 1.3, 4.5_

- [ ]* 1.3 Write property test for role-based job visibility
  - **Property 2: Role-Based Job Visibility**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 1.4 Implement job access control middleware
  - Create middleware to automatically filter job responses
  - Add permission validation for job CRUD operations
  - Implement error handling for unauthorized access
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 1.5 Write property test for permission validation
  - **Property 5: Permission Validation**
  - **Validates: Requirements 4.2, 4.3, 4.4**

- [x] 2. Enhanced Pipeline Stage System
  - Create flexible pipeline stage configuration system
  - Implement support for multiple stages within each phase
  - Add stage validation and ordering logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.1 Write property test for pipeline stage uniqueness
  - **Property 4: Pipeline Stage Uniqueness**
  - **Validates: Requirements 2.4**

- [x] 2.2 Update PipelineStageConfigurator component
  - Add support for multiple stages per phase (shortlisting, screening, interview)
  - Implement dynamic stage addition and removal
  - Add stage reordering with drag-and-drop functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 2.3 Create stage template management system
  - Implement stage template storage and retrieval
  - Add template validation and versioning
  - Create API endpoints for template operations
  - _Requirements: 3.1, 3.2_

- [x] 3. Stage Import Feature Implementation
  - Create stage import modal and selection interface
  - Implement stage copying logic with validation
  - Add preview and modification capabilities for imported stages
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 3.1 Write property test for stage import consistency
  - **Property 3: Stage Import Consistency**
  - **Validates: Requirements 3.3, 3.4**

- [x] 3.2 Create StageImportModal component
  - Build modal interface for job selection and stage preview
  - Add search and filter functionality for available jobs
  - Implement stage selection and modification interface
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 3.3 Implement stage import backend logic
  - Create API endpoints for fetching available stage templates
  - Implement stage copying with proper validation
  - Add error handling for import failures
  - _Requirements: 3.3, 3.5_

- [x] 4. Frontend Role-Based UI Updates
  - Update job listing components to respect user roles
  - Implement role-based action button visibility
  - Add error handling for unauthorized access attempts
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4.1 Update DashboardPage with role-based filtering
  - Modify job data fetching to respect user role
  - Update job display logic for assigned recruiters
  - Add role-specific action buttons and navigation
  - _Requirements: 5.1, 5.2_

- [x] 4.2 Enhance JobCreationPage with import functionality
  - Add "Import Stages" button to pipeline configuration section
  - Integrate StageImportModal with job creation workflow
  - Update form validation to handle imported stages
  - _Requirements: 3.1, 3.4, 5.3_

- [x] 4.3 Update job routing with permission checks
  - Add route guards for job-specific pages
  - Implement redirect logic for unauthorized access
  - Add loading states for permission validation
  - _Requirements: 5.4, 5.5_

- [x] 5. Database Schema Updates
  - Add assignedRecruiterId column to jobs table
  - Create pipeline_stage_templates table
  - Add necessary indexes for performance
  - _Requirements: 1.1, 3.1_

- [x] 5.1 Create database migration for job assignments
  - Add assignedRecruiterId foreign key to jobs table
  - Create indexes for efficient role-based queries
  - Add default values for existing jobs
  - _Requirements: 1.1, 4.5_

- [x] 5.2 Create stage templates table and relationships
  - Design pipeline_stage_templates table schema
  - Add relationships between jobs and stage templates
  - Create indexes for template lookup performance
  - _Requirements: 3.1, 3.2_

- [x] 6. API Endpoint Enhancements
  - Update existing job endpoints with access control
  - Create new endpoints for stage template management
  - Add bulk operations for stage import
  - _Requirements: 4.1, 4.2, 3.3_

- [x] 6.1 Update job CRUD endpoints
  - Add role-based filtering to GET /jobs endpoint
  - Update job detail endpoints with permission validation
  - Modify job update endpoints to respect assignments
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6.2 Create stage template endpoints
  - Implement GET /stage-templates for available templates
  - Add POST /jobs/:id/import-stages for stage import
  - Create template management endpoints for admins
  - _Requirements: 3.1, 3.3_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integration Testing and Validation
  - Test end-to-end job access control workflow
  - Validate stage import functionality across different scenarios
  - Verify role-based UI behavior with different user types
  - _Requirements: All_

- [ ]* 8.1 Write integration tests for job access control
  - Test complete workflow from login to job management
  - Validate permission changes and real-time updates
  - Test error scenarios and unauthorized access attempts

- [ ]* 8.2 Write integration tests for stage import
  - Test stage import workflow with various job configurations
  - Validate imported stage independence and modification
  - Test error handling for import failures

- [x] 9. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.