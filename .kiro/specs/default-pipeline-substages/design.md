# Design Document: Default Pipeline Sub-Stages

## Overview

This design document describes the implementation of default pipeline sub-stages for job creation. The feature updates the backend job service to create predefined sub-stages under specific main stages when a new job is created, and updates the frontend to display and manage these sub-stages.

The implementation follows the existing architecture patterns in the codebase, extending the `DEFAULT_STAGES` configuration in the job service and updating the `PipelineStageConfigurator` component in the frontend.

## Architecture

The feature touches the following layers:

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  PipelineStageConfigurator                          │    │
│  │  - Displays stages with sub-stages                  │    │
│  │  - Allows add/delete of sub-stages                  │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  pipelineStages.ts (constants)                      │    │
│  │  - Stage names and colors                           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  job.service.ts                                     │    │
│  │  - DEFAULT_STAGES with sub-stages config            │    │
│  │  - Creates stages and sub-stages on job creation    │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  pipeline.service.ts                                │    │
│  │  - Sub-stage CRUD operations                        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  PipelineStage table                                │    │
│  │  - parentId for sub-stage relationships             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. Job Service (`backend/src/services/job.service.ts`)

Update the `DEFAULT_STAGES` constant to include sub-stages configuration:

```typescript
// Default pipeline stages with sub-stages configuration
const DEFAULT_STAGES: PipelineStageConfig[] = [
  { name: 'Queue', position: 0, isMandatory: false, subStages: [] },
  { name: 'Applied', position: 1, isMandatory: false, subStages: [] },
  { 
    name: 'Screening', 
    position: 2, 
    isMandatory: true, 
    subStages: [{ name: 'HR Screening', position: 0 }] 
  },
  { 
    name: 'Shortlist', 
    position: 3, 
    isMandatory: true, 
    subStages: [
      { name: 'CV Shortlist', position: 0 },
      { name: 'Panel Shortlist', position: 1 }
    ] 
  },
  { name: 'Interview', position: 4, isMandatory: false, subStages: [
      { name: 'Round 1', position: 0 },
      { name: 'Round 2', position: 1 }
    ] 
  },
  { name: 'Selected', position: 5, isMandatory: false, subStages: [] },
  { 
    name: 'Offered', 
    position: 6, 
    isMandatory: true, 
    subStages: [
      { name: 'Offer Sent', position: 0 },
      { name: 'Offer Accepted', position: 1 }
    ] 
  },
  { name: 'Hired', position: 7, isMandatory: false, subStages: [] },
  { name: 'Rejected', position: 8, isMandatory: true, subStages: [] },
];

// Update MANDATORY_STAGES to use new names
const MANDATORY_STAGES = ['Screening', 'Shortlist', 'Offered', 'Rejected'];
```

#### 2. Pipeline Service (`backend/src/services/pipeline.service.ts`)

Add methods for sub-stage management:

```typescript
interface CreateSubStageData {
  parentStageId: string;
  name: string;
  position?: number;
}

// Add sub-stage to a parent stage
async addSubStage(data: CreateSubStageData): Promise<PipelineStage>

// Delete a sub-stage
async deleteSubStage(subStageId: string): Promise<void>
```

### Frontend Components

#### 1. Pipeline Stage Constants (`frontend/src/constants/pipelineStages.ts`)

Update stage names and add colors for renamed stages:

```typescript
export const DEFAULT_PIPELINE_STAGES = [
  'Queue',
  'Applied',
  'Screening',
  'Shortlist',    // Changed from 'Shortlisted'
  'Interview',
  'Selected',
  'Offered',      // Changed from 'Offer'
  'Hired',
  'Rejected'
] as const;

// Add/update STAGE_COLORS for Shortlist and Offered
```

#### 2. Pipeline Stage Configurator (`frontend/src/components/PipelineStageConfigurator.tsx`)

Update `DEFAULT_PIPELINE_STAGES` to include sub-stages:

```typescript
export const DEFAULT_PIPELINE_STAGES: EnhancedPipelineStageConfig[] = [
  { name: 'Queue', position: 0, isMandatory: false, subStages: [], type: 'shortlisting', isCustom: false },
  { name: 'Applied', position: 1, isMandatory: false, subStages: [], type: 'shortlisting', isCustom: false },
  { 
    name: 'Screening', 
    position: 2, 
    isMandatory: true, 
    subStages: [{ name: 'HR Screening', position: 0 }], 
    type: 'screening', 
    isCustom: false 
  },
  { 
    name: 'Shortlist', 
    position: 3, 
    isMandatory: true, 
    subStages: [
      { name: 'CV Shortlist', position: 0 },
      { name: 'Panel Shortlist', position: 1 }
    ], 
    type: 'shortlisting', 
    isCustom: false 
  },
  { 
    name: 'Interview', 
    position: 4, 
    isMandatory: false, 
    subStages: [
      { name: 'Round 1', position: 0 },
      { name: 'Round 2', position: 1 }
    ], 
    type: 'interview', 
    isCustom: false 
  },
  { name: 'Selected', position: 5, isMandatory: false, subStages: [], type: 'selected', isCustom: false },
  { 
    name: 'Offered', 
    position: 6, 
    isMandatory: true, 
    subStages: [
      { name: 'Offer Sent', position: 0 },
      { name: 'Offer Accepted', position: 1 }
    ], 
    type: 'offer', 
    isCustom: false 
  },
  { name: 'Hired', position: 7, isMandatory: false, subStages: [], type: 'hired', isCustom: false },
];
```

## Data Models

### PipelineStage (existing model, no changes needed)

The existing `PipelineStage` model in `schema.prisma` already supports sub-stages through the `parentId` field:

```prisma
model PipelineStage {
  id          String   @id @default(uuid())
  jobId       String   @map("job_id")
  name        String
  position    Int
  isDefault   Boolean  @default(false) @map("is_default")
  isMandatory Boolean  @default(false) @map("is_mandatory")
  parentId    String?  @map("parent_id")  // For sub-stages
  
  parent      PipelineStage?  @relation("SubStages", fields: [parentId], references: [id])
  subStages   PipelineStage[] @relation("SubStages")
}
```

### SubStageConfig (TypeScript interface)

```typescript
export interface SubStageConfig {
  id?: string;
  name: string;
  position: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Default Stages Creation Order

*For any* newly created job without custom pipeline configuration, the main stages SHALL be created in the exact order: Queue, Applied, Screening, Shortlist, Interview, Selected, Offered, Hired, Rejected, with positions 0-8 respectively.

**Validates: Requirements 1.1**

### Property 2: Default Sub-Stages Configuration

*For any* newly created job, the following stages SHALL have their default sub-stages:
- Screening: ["HR Screening"]
- Shortlist: ["CV Shortlist", "Panel Shortlist"]
- Interview: ["Round 1", "Round 2"]
- Offered: ["Offer Sent", "Offer Accepted"]

And the following stages SHALL have no sub-stages: Queue, Applied, Selected, Hired.

**Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

### Property 3: Sub-Stage Deletion Round-Trip

*For any* sub-stage that is deleted, querying the parent stage's sub-stages SHALL NOT include the deleted sub-stage.

**Validates: Requirements 2.1, 2.2**

### Property 4: Mandatory Stage Protection

*For any* main pipeline stage marked as mandatory, attempting to delete it SHALL result in an error.

**Validates: Requirements 2.3**

### Property 5: Sub-Stage Addition with Unique Position

*For any* main pipeline stage, when a new sub-stage is added, it SHALL be assigned a position that is unique among all sub-stages of that parent stage.

**Validates: Requirements 3.1, 3.2**

### Property 6: Sub-Stage Name Uniqueness Within Parent

*For any* main pipeline stage, attempting to add a sub-stage with a name that already exists under that parent SHALL result in a validation error.

**Validates: Requirements 3.3**

### Property 7: Sub-Stage Parent Relationship Integrity

*For any* sub-stage created, its parentId SHALL reference a valid main stage ID, and when fetching the job's stages, the sub-stage SHALL appear nested under its parent stage.

**Validates: Requirements 7.1, 7.2**

## Error Handling

### Backend Errors

| Error Condition | Error Type | Message |
|----------------|------------|---------|
| Attempt to delete mandatory stage | ValidationError | "Cannot delete mandatory pipeline stages" |
| Duplicate sub-stage name within parent | ValidationError | "Sub-stage name already exists under this stage" |
| Parent stage not found | NotFoundError | "Pipeline stage not found" |
| Sub-stage not found | NotFoundError | "Sub-stage not found" |
| Invalid position value | ValidationError | "Position must be non-negative" |

### Frontend Validation

- Display error message when attempting to add duplicate sub-stage name
- Disable delete button for mandatory stages
- Show confirmation dialog before deleting sub-stages

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Job Creation Tests**
   - Test that creating a job without custom stages creates all default stages
   - Test that each stage has the correct default sub-stages
   - Test that stage positions are sequential

2. **Sub-Stage Management Tests**
   - Test adding a sub-stage to a stage with no existing sub-stages
   - Test adding a sub-stage to a stage with existing sub-stages
   - Test deleting a sub-stage
   - Test error when adding duplicate sub-stage name

3. **Frontend Component Tests**
   - Test that PipelineStageConfigurator renders default stages with sub-stages
   - Test expand/collapse functionality for viewing sub-stages
   - Test add sub-stage UI interaction
   - Test delete sub-stage UI interaction

### Property-Based Tests

Property-based tests will use **fast-check** library for TypeScript to verify universal properties across many generated inputs. Each test will run a minimum of 100 iterations.

1. **Property Test: Default Stages Order**
   - Generate random job data
   - Create job and verify stages are in correct order
   - Tag: **Feature: default-pipeline-substages, Property 1: Default Stages Creation Order**

2. **Property Test: Sub-Stage Deletion Round-Trip**
   - Generate random sub-stage selection
   - Delete sub-stage and verify it's removed from parent
   - Tag: **Feature: default-pipeline-substages, Property 3: Sub-Stage Deletion Round-Trip**

3. **Property Test: Sub-Stage Position Uniqueness**
   - Generate random sub-stage additions
   - Verify all positions are unique within parent
   - Tag: **Feature: default-pipeline-substages, Property 5: Sub-Stage Addition with Unique Position**

4. **Property Test: Sub-Stage Name Uniqueness**
   - Generate random sub-stage names
   - Verify duplicate names are rejected
   - Tag: **Feature: default-pipeline-substages, Property 6: Sub-Stage Name Uniqueness Within Parent**
