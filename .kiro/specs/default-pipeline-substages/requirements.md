# Requirements Document

## Introduction

This feature updates the default pipeline stages configuration for job creation to include predefined sub-stages for each main stage. When a job is created, the system will automatically populate the pipeline with the following stages and their default sub-stages:

- Queue (no sub-stages)
- Applied (sub-stages can be added, none by default)
- Screening (default sub-stage: "HR Screening")
- Shortlist (default sub-stages: "CV Shortlist", "Panel Shortlist")
- Interview (default sub-stages: "Round 1", "Round 2")
- Selected (sub-stages can be added, none by default)
- Offered (default sub-stages: "Offer Sent", "Offer Accepted")
- Hired (no sub-stages)

All default sub-stages are deletable by the user. The main stages remain as the primary pipeline structure, with sub-stages providing more granular tracking within each stage.

## Glossary

- **Pipeline_Stage**: A main stage in the hiring pipeline (e.g., Queue, Applied, Screening)
- **Sub_Stage**: A child stage within a main Pipeline_Stage that provides more granular tracking
- **Job_Service**: The backend service responsible for job creation and management
- **Pipeline_Service**: The backend service responsible for pipeline stage operations
- **Stage_Configurator**: The frontend component for configuring pipeline stages during job creation

## Requirements

### Requirement 1: Default Pipeline Stages with Sub-Stages

**User Story:** As a recruiter, I want jobs to be created with predefined pipeline stages and sub-stages, so that I have a consistent and comprehensive hiring workflow from the start.

#### Acceptance Criteria

1. WHEN a new job is created without custom pipeline configuration, THE Job_Service SHALL create the following main stages in order: Queue, Applied, Screening, Shortlist, Interview, Selected, Offered, Hired, Rejected
2. WHEN the Screening stage is created, THE Job_Service SHALL create a default sub-stage named "HR Screening" under it
3. WHEN the Shortlist stage is created, THE Job_Service SHALL create default sub-stages named "CV Shortlist" and "Panel Shortlist" under it
4. WHEN the Interview stage is created, THE Job_Service SHALL create default sub-stages named "Round 1" and "Round 2" under it
5. WHEN the Offered stage is created, THE Job_Service SHALL create default sub-stages named "Offer Sent" and "Offer Accepted" under it
6. WHEN the Queue, Applied, Selected, or Hired stages are created, THE Job_Service SHALL NOT create any default sub-stages under them

### Requirement 2: Sub-Stage Deletion Capability

**User Story:** As a recruiter, I want to delete default sub-stages that don't fit my hiring process, so that I can customize the pipeline to my needs.

#### Acceptance Criteria

1. THE Pipeline_Service SHALL allow deletion of any default sub-stage
2. WHEN a sub-stage is deleted, THE Pipeline_Service SHALL remove it from the database and update the parent stage's sub-stage list
3. THE Pipeline_Service SHALL NOT allow deletion of main pipeline stages that are marked as mandatory

### Requirement 3: Sub-Stage Addition Capability

**User Story:** As a recruiter, I want to add custom sub-stages to any main stage, so that I can extend the pipeline to match my specific hiring workflow.

#### Acceptance Criteria

1. THE Pipeline_Service SHALL allow adding new sub-stages to any main pipeline stage
2. WHEN a new sub-stage is added, THE Pipeline_Service SHALL assign it a unique position within the parent stage
3. THE Pipeline_Service SHALL validate that sub-stage names are unique within the same parent stage

### Requirement 4: Backend Stage Configuration Update

**User Story:** As a system administrator, I want the backend to use the updated default stage configuration, so that all new jobs have the correct pipeline structure.

#### Acceptance Criteria

1. THE Job_Service SHALL define DEFAULT_STAGES constant with the updated stage names: Queue, Applied, Screening, Shortlist, Interview, Selected, Offered, Hired, Rejected
2. THE Job_Service SHALL define DEFAULT_SUB_STAGES configuration mapping each main stage to its default sub-stages
3. WHEN creating pipeline stages for a new job, THE Job_Service SHALL iterate through DEFAULT_STAGES and create corresponding sub-stages from DEFAULT_SUB_STAGES

### Requirement 5: Frontend Stage Configurator Update

**User Story:** As a recruiter using the job creation form, I want to see the updated default stages with their sub-stages, so that I can review and customize the pipeline before creating the job.

#### Acceptance Criteria

1. THE Stage_Configurator SHALL display the updated default pipeline stages with their sub-stages
2. THE Stage_Configurator SHALL allow users to expand/collapse main stages to view sub-stages
3. THE Stage_Configurator SHALL allow users to delete default sub-stages before job creation
4. THE Stage_Configurator SHALL allow users to add new sub-stages to any main stage before job creation

### Requirement 6: Pipeline Stage Constants Update

**User Story:** As a developer, I want the frontend pipeline stage constants to reflect the updated stage names, so that the UI displays consistent stage information.

#### Acceptance Criteria

1. THE DEFAULT_PIPELINE_STAGES constant SHALL include the stage name "Shortlist" (replacing "Shortlisted")
2. THE DEFAULT_PIPELINE_STAGES constant SHALL include the stage name "Offered" (replacing "Offer")
3. THE STAGE_COLORS configuration SHALL include color definitions for "Shortlist" and "Offered" stages

### Requirement 7: Data Model Consistency

**User Story:** As a developer, I want the sub-stage data model to properly link to parent stages, so that the hierarchical relationship is maintained.

#### Acceptance Criteria

1. WHEN a sub-stage is created, THE Pipeline_Service SHALL set the parentId field to reference the parent stage's ID
2. WHEN fetching stages for a job, THE Job_Service SHALL include sub-stages nested under their parent stages
3. THE PipelineStage model SHALL support the parentId field for establishing parent-child relationships
