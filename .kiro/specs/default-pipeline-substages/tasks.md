# Implementation Plan: Default Pipeline Sub-Stages

## Overview

This implementation plan updates the default pipeline stages configuration to include predefined sub-stages when creating a job. The changes span backend services and frontend components, with updates to stage names and sub-stage configurations.

## Tasks

- [x] 1. Update Backend Job Service DEFAULT_STAGES Configuration
  - [x] 1.1 Update DEFAULT_STAGES constant with new stage names and sub-stages
    - Change "Shortlisted" to "Shortlist"
    - Change "Offer" to "Offered"
    - Add subStages arrays to each stage configuration
    - Add default sub-stages: Screening→"HR Screening", Shortlist→"CV Shortlist"/"Panel Shortlist", Interview→"Round 1"/"Round 2", Offered→"Offer Sent"/"Offer Accepted"
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2_
  - [x] 1.2 Update MANDATORY_STAGES constant with new stage names
    - Update to use "Shortlist" and "Offered" instead of "Shortlisted" and "Offer"
    - _Requirements: 2.3_

- [x] 2. Update Backend Job Service Stage Creation Logic
  - [x] 2.1 Verify sub-stage creation in job create method
    - Ensure the existing sub-stage creation loop handles the new default sub-stages
    - Verify parentId is correctly set for sub-stages
    - _Requirements: 4.3, 7.1_
  - [ ]* 2.2 Write property test for default stages creation order
    - **Property 1: Default Stages Creation Order**
    - **Validates: Requirements 1.1**
  - [ ]* 2.3 Write unit test for default sub-stages configuration
    - Test that each stage has correct default sub-stages
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

- [x] 3. Update Backend Pipeline Service for Sub-Stage Management
  - [x] 3.1 Add addSubStage method to pipeline service
    - Accept parentStageId, name, and optional position
    - Validate sub-stage name uniqueness within parent
    - Assign unique position if not provided
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 3.2 Add deleteSubStage method to pipeline service
    - Verify sub-stage exists and is not a main stage
    - Remove sub-stage from database
    - _Requirements: 2.1, 2.2_
  - [ ]* 3.3 Write property test for sub-stage deletion round-trip
    - **Property 3: Sub-Stage Deletion Round-Trip**
    - **Validates: Requirements 2.1, 2.2**
  - [ ]* 3.4 Write property test for sub-stage position uniqueness
    - **Property 5: Sub-Stage Addition with Unique Position**
    - **Validates: Requirements 3.1, 3.2**

- [x] 4. Checkpoint - Backend Tests
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 5. Update Frontend Pipeline Stage Constants
  - [x] 5.1 Update DEFAULT_PIPELINE_STAGES in pipelineStages.ts
    - Change "Shortlisted" to "Shortlist"
    - Change "Offer" to "Offered"
    - _Requirements: 6.1, 6.2_
  - [x] 5.2 Update STAGE_COLORS for renamed stages
    - Add/update color definitions for "Shortlist" and "Offered"
    - _Requirements: 6.3_

- [x] 6. Update Frontend PipelineStageConfigurator Component
  - [x] 6.1 Update DEFAULT_PIPELINE_STAGES with sub-stages
    - Add subStages arrays matching backend configuration
    - Update stage names to match backend
    - _Requirements: 5.1_
  - [x] 6.2 Update UI to display sub-stages under parent stages
    - Show sub-stages when parent stage is expanded
    - Allow expand/collapse of stages with sub-stages
    - _Requirements: 5.2_
  - [x] 6.3 Add sub-stage deletion functionality in UI
    - Add delete button for each sub-stage
    - Call backend API to delete sub-stage
    - Update local state after deletion
    - _Requirements: 5.3_
  - [x] 6.4 Add sub-stage addition functionality in UI
    - Add input field and button to add new sub-stage
    - Validate sub-stage name uniqueness
    - Call backend API to add sub-stage
    - _Requirements: 5.4_
  - [ ]* 6.5 Write unit tests for PipelineStageConfigurator
    - Test rendering of default stages with sub-stages
    - Test expand/collapse functionality
    - Test add/delete sub-stage interactions
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Update Frontend Types
  - [x] 7.1 Ensure SubStageConfig interface is properly exported
    - Verify types/index.ts has SubStageConfig interface
    - _Requirements: 7.3_

- [x] 8. Final Checkpoint - All Tests Pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The database schema already supports sub-stages via parentId field, so no migration is needed
