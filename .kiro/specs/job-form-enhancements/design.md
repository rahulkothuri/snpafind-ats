# Design Document: Job Form Enhancements

## Overview

This feature enhances the ATS job creation and application workflow with a comprehensive job posting form, static mandatory criteria, customizable pipeline stages, an improved two-column application page layout, and a read-only job description viewer. The implementation spans both frontend (React/TypeScript) and backend (Node.js/Prisma) components.

## Architecture

The feature follows the existing layered architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  JobCreationPage  │  ApplicationPage  │  RolesPage              │
│  (Enhanced Form)  │  (Two-Column)     │  (View JD Modal)        │
├─────────────────────────────────────────────────────────────────┤
│                    Services Layer (API calls)                    │
├─────────────────────────────────────────────────────────────────┤
│                        Backend (Express)                         │
├─────────────────────────────────────────────────────────────────┤
│  Job Routes  │  Pipeline Routes  │  Public Routes               │
├─────────────────────────────────────────────────────────────────┤
│                    Services Layer (Business Logic)               │
├─────────────────────────────────────────────────────────────────┤
│                    Prisma ORM (Database Access)                  │
├─────────────────────────────────────────────────────────────────┤
│                    PostgreSQL Database                           │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. JobCreationPage (Enhanced)
- **Location**: `frontend/src/pages/JobCreationPage.tsx`
- **Purpose**: Comprehensive job creation/editing form
- **New Fields**:
  - `experienceMin`, `experienceMax` (number inputs)
  - `salaryMin`, `salaryMax` (number inputs with currency)
  - `variables` (text input for incentives)
  - `educationQualification` (select dropdown)
  - `ageUpTo` (number input)
  - `skills` (multi-select with tags)
  - `preferredIndustry` (select dropdown)
  - `workMode` (select: Onsite, WFH, Hybrid, C2C, C2H)
  - `locations` (multi-select cities)
  - `priority` (select: Low, Medium, High)
  - `jobDomain` (select dropdown)
  - `assignedRecruiter` (select dropdown)
- **New Sections**:
  - MandatoryCriteriaSection (read-only static content)
  - PipelineStageConfigurator (stage management)

#### 2. MandatoryCriteriaSection
- **Location**: `frontend/src/components/MandatoryCriteriaSection.tsx`
- **Purpose**: Display static mandatory screening criteria
- **Props**: None (content is static)
- **Behavior**: Renders predefined criteria text in a styled read-only section

#### 3. PipelineStageConfigurator
- **Location**: `frontend/src/components/PipelineStageConfigurator.tsx`
- **Purpose**: Configure pipeline stages during job creation
- **Props**:
  ```typescript
  interface PipelineStageConfiguratorProps {
    stages: PipelineStageConfig[];
    onChange: (stages: PipelineStageConfig[]) => void;
  }
  ```
- **Behavior**: 
  - Shows mandatory stages (Screening, Shortlisted, Offer) as locked
  - Allows adding/removing optional stages
  - Supports sub-stages under Interview stage
  - Drag-and-drop reordering for non-mandatory stages

#### 4. ApplicationPage (Enhanced)
- **Location**: `frontend/src/pages/ApplicationPage.tsx`
- **Purpose**: Two-column layout for job application
- **Layout**:
  - Left column (40%): JobDetailsPanel
  - Right column (60%): ApplicationForm
- **Responsive**: Stacks vertically on mobile

#### 5. JobDetailsPanel
- **Location**: `frontend/src/components/JobDetailsPanel.tsx`
- **Purpose**: Display complete job information on application page
- **Props**:
  ```typescript
  interface JobDetailsPanelProps {
    job: JobDetails;
    company: CompanyInfo;
  }
  ```
- **Sections**: Company info, Job details, Description, Mandatory criteria

#### 6. JobDescriptionModal
- **Location**: `frontend/src/components/JobDescriptionModal.tsx`
- **Purpose**: Read-only job description viewer for Roles page
- **Props**:
  ```typescript
  interface JobDescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: Job | null;
  }
  ```

#### 7. JobShareModal
- **Location**: `frontend/src/components/JobShareModal.tsx`
- **Purpose**: Display sharing options after successful job creation
- **Props**:
  ```typescript
  interface JobShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
  }
  ```
- **Features**:
  - Copy Link button with clipboard API integration
  - Share to WhatsApp button (opens wa.me link with pre-filled message)
  - Success toast on copy
  - "Go to Roles" navigation button

### Backend Interfaces

#### Job Service Extensions
```typescript
interface EnhancedJobData {
  // Basic info
  title: string;
  department: string;
  
  // Experience & Salary
  experienceMin: number;
  experienceMax: number;
  salaryMin: number;
  salaryMax: number;
  variables?: string;
  
  // Requirements
  educationQualification?: string;
  ageUpTo?: number;
  skills: string[];
  preferredIndustry?: string;
  
  // Work details
  workMode: 'Onsite' | 'WFH' | 'Hybrid' | 'C2C' | 'C2H';
  locations: string[];
  priority: 'Low' | 'Medium' | 'High';
  jobDomain?: string;
  
  // Assignment
  assignedRecruiterId?: string;
  
  // Content
  description?: string;
  
  // Pipeline
  pipelineStages: PipelineStageConfig[];
}

interface PipelineStageConfig {
  name: string;
  position: number;
  isMandatory: boolean;
  subStages?: SubStageConfig[];
}

interface SubStageConfig {
  name: string;
  position: number;
}
```

## Data Models

### Database Schema Updates (Prisma)

```prisma
model Job {
  id                     String    @id @default(uuid())
  companyId              String    @map("company_id")
  title                  String
  department             String
  
  // Experience range
  experienceMin          Float?    @map("experience_min")
  experienceMax          Float?    @map("experience_max")
  
  // Salary range
  salaryMin              Float?    @map("salary_min")
  salaryMax              Float?    @map("salary_max")
  variables              String?   // Incentives description
  
  // Requirements
  educationQualification String?   @map("education_qualification")
  ageUpTo                Int?      @map("age_up_to")
  skills                 Json      @default("[]")
  preferredIndustry      String?   @map("preferred_industry")
  
  // Work details
  workMode               String?   @map("work_mode")
  locations              Json      @default("[]")  // Array of cities
  priority               String?   @default("Medium")
  jobDomain              String?   @map("job_domain")
  
  // Assignment
  assignedRecruiterId    String?   @map("assigned_recruiter_id")
  
  // Content
  description            String?   @db.Text
  
  // Existing fields
  status                 JobStatus @default(active)
  openings               Int       @default(1)
  createdAt              DateTime  @default(now()) @map("created_at")
  updatedAt              DateTime  @updatedAt @map("updated_at")
  
  // Legacy fields (kept for compatibility)
  location               String?
  employmentType         String?   @map("employment_type")
  salaryRange            String?   @map("salary_range")

  company        Company         @relation(fields: [companyId], references: [id])
  pipelineStages PipelineStage[]
  jobCandidates  JobCandidate[]
  assignedRecruiter User?        @relation(fields: [assignedRecruiterId], references: [id])

  @@map("jobs")
}

model PipelineStage {
  id          String   @id @default(uuid())
  jobId       String   @map("job_id")
  name        String
  position    Int
  isDefault   Boolean  @default(false) @map("is_default")
  isMandatory Boolean  @default(false) @map("is_mandatory")
  parentId    String?  @map("parent_id")  // For sub-stages
  createdAt   DateTime @default(now()) @map("created_at")

  job           Job            @relation(fields: [jobId], references: [id], onDelete: Cascade)
  parent        PipelineStage? @relation("SubStages", fields: [parentId], references: [id])
  subStages     PipelineStage[] @relation("SubStages")
  jobCandidates JobCandidate[]

  @@unique([jobId, position])
  @@map("pipeline_stages")
}
```

### TypeScript Types (Frontend)

```typescript
// frontend/src/types/index.ts

interface JobFormData {
  title: string;
  department: string;
  experienceMin: number;
  experienceMax: number;
  salaryMin: number;
  salaryMax: number;
  variables: string;
  educationQualification: string;
  openings: number;
  ageUpTo: number;
  skills: string[];
  preferredIndustry: string;
  workMode: WorkMode;
  locations: string[];
  priority: JobPriority;
  jobDomain: string;
  assignedRecruiterId: string;
  description: string;
  pipelineStages: PipelineStageConfig[];
}

type WorkMode = 'Onsite' | 'WFH' | 'Hybrid' | 'C2C' | 'C2H';
type JobPriority = 'Low' | 'Medium' | 'High';

interface PipelineStageConfig {
  id?: string;
  name: string;
  position: number;
  isMandatory: boolean;
  subStages: SubStageConfig[];
}

interface SubStageConfig {
  id?: string;
  name: string;
  position: number;
}

interface JobDetails extends JobFormData {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  status: 'active' | 'paused' | 'closed';
  createdAt: string;
  updatedAt: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: Experience Range Validation
*For any* experience range input where minimum and maximum values are provided, the Job_Form_System SHALL accept the input only when minimum is less than or equal to maximum, and reject it otherwise with an appropriate validation error.
**Validates: Requirements 1.2**

### Property 2: Salary Range Validation
*For any* salary range input where minimum and maximum values are provided, the Job_Form_System SHALL accept the input only when minimum is less than or equal to maximum, and reject it otherwise with an appropriate validation error.
**Validates: Requirements 1.3**

### Property 3: Multi-Select Locations Persistence
*For any* set of selected locations, when the job is saved and then retrieved, the retrieved locations array SHALL contain exactly the same cities that were selected, in any order.
**Validates: Requirements 1.4**

### Property 4: Required Field Validation
*For any* combination of empty required fields (title, department, experienceMin, experienceMax, workMode, at least one location), the Job_Form_System SHALL display a validation error for each empty required field and prevent form submission.
**Validates: Requirements 1.7**

### Property 5: Job Data Round-Trip Persistence
*For any* valid job form data, when the job is created/updated and then retrieved, all fields SHALL match the original input data (serialization followed by deserialization produces equivalent data).
**Validates: Requirements 2.3, 4.5, 7.3, 7.4, 7.5**

### Property 6: Mandatory Criteria Inclusion
*For any* job created through the system, the job details SHALL always include the static mandatory criteria content, regardless of other form inputs.
**Validates: Requirements 3.2**

### Property 7: Mandatory Pipeline Stages Preservation
*For any* pipeline configuration, the mandatory stages (Screening, Shortlisted, Offer) SHALL always be present and cannot be removed, regardless of user actions.
**Validates: Requirements 4.2**

### Property 8: Stage Reordering Consistency
*For any* valid reordering operation on non-mandatory stages, the resulting stage order SHALL reflect the requested change while maintaining mandatory stages in their required positions.
**Validates: Requirements 4.4**

### Property 9: Job Details Display Completeness
*For any* job with populated fields, when displayed on the application page, all non-null fields SHALL be visible in the job details panel, including company info, job details, description, and mandatory criteria.
**Validates: Requirements 5.2, 5.3, 5.4, 5.5, 6.3**

### Property 10: Edit Form Pre-Population
*For any* existing job, when the edit form is loaded, all form fields SHALL be pre-populated with values matching the stored job data.
**Validates: Requirements 8.1**

### Property 11: Job Share Link Generation
*For any* successfully created job, the generated application URL SHALL contain the correct job ID and be a valid URL that resolves to the application page.
**Validates: Requirements 7.2, 7.4**

## Error Handling

### Frontend Validation Errors
- Display inline error messages below each invalid field
- Highlight invalid fields with red border
- Prevent form submission until all validation errors are resolved
- Show toast notification for API errors

### Backend Validation
- Return 400 Bad Request with detailed error messages for invalid data
- Return 404 Not Found for non-existent jobs
- Return 403 Forbidden for unauthorized access attempts

### Error States
- Loading states with spinners during API calls
- Empty states when no data is available
- Error banners with retry options for failed API calls

## Testing Strategy

### Property-Based Testing Library
- **Library**: fast-check (already used in the project)
- **Configuration**: Minimum 100 iterations per property test

### Unit Tests
- Component rendering tests for new UI components
- Form validation logic tests
- API service function tests

### Property-Based Tests
Each correctness property will be implemented as a property-based test:

1. **Experience/Salary Range Validation**: Generate random min/max pairs, verify validation logic
2. **Multi-Select Persistence**: Generate random location subsets, verify round-trip
3. **Required Field Validation**: Generate combinations of empty fields, verify error display
4. **Job Data Round-Trip**: Generate random valid job data, verify serialization/deserialization
5. **Mandatory Criteria**: Generate random jobs, verify criteria always present
6. **Mandatory Stages**: Generate random stage configurations, verify mandatory stages preserved
7. **Stage Reordering**: Generate random reorder operations, verify consistency
8. **Display Completeness**: Generate jobs with various field combinations, verify display
9. **Edit Pre-Population**: Generate random jobs, verify form population

### Test Annotation Format
All property-based tests will be annotated with:
```typescript
/**
 * **Feature: job-form-enhancements, Property {number}: {property_text}**
 * **Validates: Requirements {X.Y}**
 */
```

### Integration Tests
- End-to-end job creation flow
- Application page rendering with job details
- Job description modal functionality
