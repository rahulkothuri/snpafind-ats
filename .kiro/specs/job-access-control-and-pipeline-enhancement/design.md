# Job Access Control and Pipeline Enhancement Design

## Overview

This design implements role-based access control for job visibility and enhances the pipeline stage configuration system with import capabilities. The solution ensures that job assignments are properly enforced while providing flexible pipeline management tools.

## Architecture

### Access Control Layer
- **Role-based filtering**: Middleware to filter job data based on user roles
- **Permission validation**: Service layer to validate user permissions for job operations
- **Assignment tracking**: Database relationships to track recruiter assignments

### Pipeline Management System
- **Stage templates**: Reusable pipeline configurations
- **Import mechanism**: System to copy stages between jobs
- **Dynamic configuration**: Flexible stage creation and management

## Components and Interfaces

### Backend Components

#### JobAccessControlService
```typescript
interface JobAccessControlService {
  filterJobsByUserRole(jobs: Job[], user: User): Job[];
  validateJobAccess(jobId: string, userId: string): Promise<boolean>;
  getAccessibleJobs(userId: string): Promise<Job[]>;
}
```

#### PipelineStageService
```typescript
interface PipelineStageService {
  getJobStages(jobId: string): Promise<PipelineStage[]>;
  importStagesFromJob(sourceJobId: string, targetJobId: string): Promise<PipelineStage[]>;
  createCustomStage(jobId: string, stage: PipelineStageConfig): Promise<PipelineStage>;
  getAvailableStageTemplates(userId: string): Promise<StageTemplate[]>;
}
```

### Frontend Components

#### JobAccessProvider
```typescript
interface JobAccessProvider {
  userRole: UserRole;
  accessibleJobs: Job[];
  canAccessJob(jobId: string): boolean;
  canEditJob(jobId: string): boolean;
}
```

#### StageImportModal
```typescript
interface StageImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (stages: PipelineStageConfig[]) => void;
  availableJobs: Job[];
}
```

## Data Models

### Enhanced Job Model
```typescript
interface Job {
  id: string;
  title: string;
  assignedRecruiterId?: string;
  companyId: string;
  createdBy: string;
  pipelineStages: PipelineStageConfig[];
  accessLevel: 'public' | 'assigned' | 'restricted';
}
```

### Pipeline Stage Configuration
```typescript
interface PipelineStageConfig {
  id: string;
  name: string;
  type: 'shortlisting' | 'screening' | 'interview' | 'offer' | 'hired';
  order: number;
  isCustom: boolean;
  parentStageId?: string; // For sub-stages
  requirements?: string[];
  estimatedDuration?: number;
}
```

### Stage Template
```typescript
interface StageTemplate {
  id: string;
  name: string;
  description: string;
  stages: PipelineStageConfig[];
  createdBy: string;
  isPublic: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Access Control Enforcement
*For any* job and user combination, if the user is not the assigned recruiter, hiring manager, or company admin, then the job should not appear in their accessible jobs list
**Validates: Requirements 1.1, 1.4**

### Property 2: Role-Based Job Visibility
*For any* recruiter user, all jobs in their accessible list should either be assigned to them or they should have elevated permissions
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 3: Stage Import Consistency
*For any* job with imported stages, the imported stages should maintain their original configuration while being independent of the source job
**Validates: Requirements 3.3, 3.4**

### Property 4: Pipeline Stage Uniqueness
*For any* job, all pipeline stage names within that job should be unique
**Validates: Requirements 2.4**

### Property 5: Permission Validation
*For any* job operation (view, edit, delete), the system should verify user permissions before allowing the operation
**Validates: Requirements 4.2, 4.3, 4.4**

## Error Handling

### Access Denied Scenarios
- **Unauthorized job access**: Return 403 Forbidden with clear error message
- **Invalid recruiter assignment**: Return 400 Bad Request with validation details
- **Missing permissions**: Redirect to appropriate error page with explanation

### Stage Import Failures
- **Source job not found**: Display error message and fallback to default stages
- **Import permission denied**: Show access denied message and available alternatives
- **Stage validation errors**: Highlight invalid stages and allow correction

### Data Consistency
- **Concurrent access**: Implement optimistic locking for job updates
- **Assignment conflicts**: Validate recruiter availability before assignment
- **Stage ordering**: Ensure logical stage sequence is maintained

## Testing Strategy

### Unit Testing
- Test access control logic with various user role combinations
- Validate stage import functionality with different job configurations
- Test permission validation for all job operations
- Verify error handling for unauthorized access attempts

### Property-Based Testing
- Generate random user-job combinations to test access control
- Test stage import with various source and target job configurations
- Validate pipeline stage uniqueness across different job setups
- Test permission validation with random user roles and operations

### Integration Testing
- Test end-to-end job access flow from login to job management
- Validate stage import workflow across different user roles
- Test real-time permission updates when assignments change
- Verify database consistency after access control operations

## Implementation Notes

### Database Changes
- Add `assignedRecruiterId` foreign key to jobs table
- Create `pipeline_stage_templates` table for reusable configurations
- Add indexes for efficient job filtering by user role
- Implement soft deletes for audit trail

### API Modifications
- Add middleware for automatic job filtering based on user role
- Implement permission validation decorators for job endpoints
- Create new endpoints for stage template management
- Add bulk import endpoints for stage configurations

### Frontend Enhancements
- Implement role-based routing and component rendering
- Add stage import modal with job selection and preview
- Create dynamic pipeline stage builder with drag-and-drop
- Implement real-time updates for permission changes