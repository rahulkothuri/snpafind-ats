# Design Document: ATS Comprehensive Enhancements

## Overview

This design document outlines the technical implementation for comprehensive ATS enhancements including candidate contact display, detailed scoring, auto-rejection rules, pipeline stage updates, interview round selection, and vendor management. The implementation spans both frontend (React/TypeScript) and backend (Node.js/Express/Prisma) components.

## Architecture

The enhancements follow the existing ATS architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  RolesPage    │  JobCreationPage  │  SettingsPage  │  Modals    │
│  - CandidateRow  - AutoRejection   - VendorSection  - Interview │
│  - DetailSidebar - MandatoryCriteria                 Schedule   │
│  - ScoreBreakdown                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Express API)                        │
├─────────────────────────────────────────────────────────────────┤
│  Routes: /jobs, /candidates, /users, /interviews, /vendors      │
│  Services: JobService, CandidateService, VendorService          │
│  Middleware: Auth, RBAC, VendorAccessControl                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                         │
├─────────────────────────────────────────────────────────────────┤
│  Tables: candidates (score fields), jobs (auto_rejection_rules) │
│          users (vendor role), vendor_job_assignments            │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Candidate Contact Display Component

**File:** `frontend/src/components/JobDetailsRightPanel.tsx`

Updates to the `CandidateTableView` component to display phone and email:

```typescript
interface CandidateContactInfo {
  email: string;
  phone: string;
}

// Updated column definition for candidate table
const candidateColumns: Column<PipelineCandidate>[] = [
  // ... existing columns
  {
    key: 'contact',
    header: 'Contact',
    render: (row) => (
      <div className="text-xs">
        <div className="text-gray-600 truncate max-w-[150px]" title={row.email}>
          {row.email || '-'}
        </div>
        <div className="text-gray-500">{row.phone || '-'}</div>
      </div>
    ),
  },
];
```

### 2. Score Breakdown Component

**File:** `frontend/src/components/ScoreBreakdown.tsx` (new)

```typescript
interface ScoreBreakdownProps {
  domainScore: number | null;
  industryScore: number | null;
  keyResponsibilitiesScore: number | null;
  overallScore: number;
}

interface ScoreCategory {
  label: string;
  score: number | null;
  color: string;
}
```

**Integration in DetailPanel:**

```typescript
// In CandidateDetailContent component
<DetailSection title="Score Breakdown">
  <ScoreBreakdown
    domainScore={candidate.domainScore}
    industryScore={candidate.industryScore}
    keyResponsibilitiesScore={candidate.keyResponsibilitiesScore}
    overallScore={candidate.score}
  />
</DetailSection>
```

### 3. Auto-Rejection Rules Component

**File:** `frontend/src/components/AutoRejectionRulesSection.tsx` (update)

```typescript
// Supported candidate fields for auto-rejection
type RuleField = 'experience' | 'location' | 'skills' | 'education' | 'salary_expectation';

// Operators by field type
type NumericOperator = 'less_than' | 'greater_than' | 'equals' | 'not_equals' | 'between';
type TextOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains';
type ArrayOperator = 'contains' | 'not_contains' | 'contains_all' | 'contains_any';

type RuleOperator = NumericOperator | TextOperator | ArrayOperator;

// Logic connector for multiple rules
type LogicConnector = 'AND' | 'OR';

interface AutoRejectionRule {
  id: string;
  field: RuleField;
  operator: RuleOperator;
  value: number | string | string[];
  logicConnector?: LogicConnector; // How this rule connects to the next
}

interface AutoRejectionRules {
  enabled: boolean;
  rules: AutoRejectionRule[];
}

interface AutoRejectionRulesProps {
  value: AutoRejectionRules;
  onChange: (rules: AutoRejectionRules) => void;
  readOnly?: boolean;
}

// Field configuration for UI
const RULE_FIELDS = [
  { value: 'experience', label: 'Experience (Years)', type: 'numeric' },
  { value: 'location', label: 'Location', type: 'text' },
  { value: 'skills', label: 'Skills', type: 'array' },
  { value: 'education', label: 'Education', type: 'text' },
  { value: 'salary_expectation', label: 'Salary Expectation', type: 'numeric' },
] as const;

// Operators by field type
const OPERATORS_BY_TYPE = {
  numeric: [
    { value: 'less_than', label: 'Less than' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'between', label: 'Between' },
  ],
  text: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
  ],
  array: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'contains_all', label: 'Contains all of' },
    { value: 'contains_any', label: 'Contains any of' },
  ],
};
```

### 4. Pipeline Stage Constants

**File:** `frontend/src/constants/pipelineStages.ts` (new)

```typescript
export const DEFAULT_PIPELINE_STAGES = [
  'Queue',
  'Applied', 
  'Screening',
  'Shortlisted',
  'Interview',
  'Selected',  // NEW STAGE
  'Offer',
  'Hired',
  'Rejected'
] as const;

export const STAGE_COLORS: Record<string, { bg: string; text: string; indicator: string }> = {
  'Queue': { bg: 'bg-[#f1f5f9]', text: 'text-[#475569]', indicator: 'bg-[#94a3b8]' },
  'Applied': { bg: 'bg-[#e0f2fe]', text: 'text-[#0369a1]', indicator: 'bg-[#0ea5e9]' },
  'Screening': { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]', indicator: 'bg-[#f59e0b]' },
  'Shortlisted': { bg: 'bg-[#dcfce7]', text: 'text-[#166534]', indicator: 'bg-[#22c55e]' },
  'Interview': { bg: 'bg-[#e0e7ff]', text: 'text-[#4338ca]', indicator: 'bg-[#6366f1]' },
  'Selected': { bg: 'bg-[#fce7f3]', text: 'text-[#be185d]', indicator: 'bg-[#ec4899]' },  // NEW
  'Offer': { bg: 'bg-[#f5f3ff]', text: 'text-[#6d28d9]', indicator: 'bg-[#8b5cf6]' },
  'Hired': { bg: 'bg-[#d1fae5]', text: 'text-[#047857]', indicator: 'bg-[#10b981]' },
  'Rejected': { bg: 'bg-[#fee2e2]', text: 'text-[#b91c1c]', indicator: 'bg-[#ef4444]' },
};
```

### 5. Interview Round Selector

**File:** `frontend/src/components/InterviewScheduleModal.tsx` (update)

```typescript
interface InterviewRound {
  id: string;
  name: string;
  isCustom: boolean;
}

const DEFAULT_INTERVIEW_ROUNDS: InterviewRound[] = [
  { id: 'technical', name: 'Technical Round', isCustom: false },
  { id: 'hr', name: 'HR Round', isCustom: false },
  { id: 'managerial', name: 'Managerial Round', isCustom: false },
  { id: 'final', name: 'Final Round', isCustom: false },
];

// Add to form data
interface InterviewFormData {
  // ... existing fields
  interviewRound: string;
}
```

### 6. Vendor Management Components

**File:** `frontend/src/components/VendorManagementSection.tsx` (new)

```typescript
interface Vendor {
  id: string;
  name: string;
  email: string;
  assignedJobs: { id: string; title: string }[];
  isActive: boolean;
  createdAt: string;
}

interface VendorFormData {
  name: string;
  email: string;
  password: string;
  assignedJobIds: string[];
}

interface VendorManagementSectionProps {
  vendors: Vendor[];
  jobs: { id: string; title: string }[];
  onAddVendor: (data: VendorFormData) => Promise<void>;
  onUpdateVendor: (id: string, data: Partial<VendorFormData>) => Promise<void>;
  onToggleVendorStatus: (id: string) => Promise<void>;
  onRemoveVendor: (id: string) => Promise<void>;
}
```

## Data Models

### Database Schema Updates

```prisma
// Update to User model - add vendor role
enum UserRole {
  admin
  hiring_manager
  recruiter
  vendor  // NEW

  @@map("user_role")
}

// Update to Candidate model - add score breakdown fields
model Candidate {
  // ... existing fields
  
  // Score breakdown fields (NEW)
  domainScore            Int?    @map("domain_score")
  industryScore          Int?    @map("industry_score")
  keyResponsibilitiesScore Int? @map("key_responsibilities_score")
}

// Update to Job model - add auto-rejection rules
model Job {
  // ... existing fields
  
  // Auto-rejection rules (NEW)
  autoRejectionRules Json? @default("{}") @map("auto_rejection_rules")
}

// New model for vendor job assignments
model VendorJobAssignment {
  id        String   @id @default(uuid())
  vendorId  String   @map("vendor_id")
  jobId     String   @map("job_id")
  createdAt DateTime @default(now()) @map("created_at")

  vendor User @relation("VendorAssignments", fields: [vendorId], references: [id], onDelete: Cascade)
  job    Job  @relation("JobVendors", fields: [jobId], references: [id], onDelete: Cascade)

  @@unique([vendorId, jobId])
  @@map("vendor_job_assignments")
}

// Update to Interview model - add round type
model Interview {
  // ... existing fields
  
  // Interview round type (NEW)
  roundType String? @map("round_type")
}
```

### API Interfaces

```typescript
// Flexible auto-rejection rules structure
type RuleField = 'experience' | 'location' | 'skills' | 'education' | 'salary_expectation';
type NumericOperator = 'less_than' | 'greater_than' | 'equals' | 'not_equals' | 'between';
type TextOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains';
type ArrayOperator = 'contains' | 'not_contains' | 'contains_all' | 'contains_any';
type RuleOperator = NumericOperator | TextOperator | ArrayOperator;
type LogicConnector = 'AND' | 'OR';

interface AutoRejectionRule {
  id: string;
  field: RuleField;
  operator: RuleOperator;
  value: number | string | string[];
  logicConnector?: LogicConnector;
}

interface AutoRejectionRules {
  enabled: boolean;
  rules: AutoRejectionRule[];
}

// Score breakdown in candidate response
interface CandidateScoreBreakdown {
  domainScore: number | null;
  industryScore: number | null;
  keyResponsibilitiesScore: number | null;
  overallScore: number;
}

// Vendor API types
interface CreateVendorInput {
  name: string;
  email: string;
  password: string;
  assignedJobIds: string[];
}

interface UpdateVendorInput {
  name?: string;
  email?: string;
  assignedJobIds?: string[];
  isActive?: boolean;
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Contact Information Display

*For any* candidate with phone and/or email data, when rendered in a table row or kanban card, the rendered output SHALL contain the candidate's phone number and email address.

**Validates: Requirements 1.1, 1.2, 1.4**

### Property 2: Score Average Calculation

*For any* candidate with one or more sub-scores (Domain, Industry, Key Responsibilities), the overall score SHALL equal the arithmetic mean of all non-null sub-scores.

**Validates: Requirements 2.4, 2.7, 8.3**

### Property 3: Score Breakdown Display

*For any* candidate with score breakdown data, when the detail sidebar is rendered, it SHALL display all three score categories (Domain, Industry, Key Responsibilities) with their respective values or "N/A" for null values.

**Validates: Requirements 2.2, 2.3**

### Property 4: Flexible Auto-Rejection Rule Enforcement

*For any* job with auto-rejection rules enabled and one or more configured rules, when a candidate applies and matches any rule (based on field, operator, and value), the candidate SHALL be moved to the Rejected stage with an activity log entry containing a dynamic rejection reason specifying which rule triggered the rejection.

**Validates: Requirements 4.6, 4.7, 4.9, 9.2, 9.3, 9.4, 9.5, 9.6**

### Property 5: Auto-Rejection Non-Retroactivity

*For any* job where auto-rejection rules are modified after candidates have applied, existing candidates in non-rejected stages SHALL NOT be affected by the new rules.

**Validates: Requirements 4.11**

### Property 6: Pipeline Stage Ordering

*For any* newly created job, the pipeline SHALL contain exactly 9 stages in the order: Queue, Applied, Screening, Shortlisted, Interview, Selected, Offer, Hired, Rejected.

**Validates: Requirements 5.1, 5.2**

### Property 7: Selected Stage Movement

*For any* candidate in the pipeline, the system SHALL allow movement to and from the Selected stage, and the Selected stage SHALL appear in all stage-related UI components (filters, kanban board, summary strip).

**Validates: Requirements 5.4, 5.3, 5.6, 5.7**

### Property 8: Interview Round Storage

*For any* interview scheduled with a round type, the round type SHALL be persisted to the database and returned when retrieving interview data.

**Validates: Requirements 6.5, 6.6**

### Property 9: Interview Round Options from Sub-Stages

*For any* job with custom interview sub-stages defined, the interview scheduling modal SHALL display those sub-stages as round type options. For jobs without custom sub-stages, default options SHALL be displayed.

**Validates: Requirements 6.2, 6.3**

### Property 10: Vendor Access Control

*For any* vendor user, when accessing jobs, candidates, or related data, the system SHALL return only data associated with jobs explicitly assigned to that vendor.

**Validates: Requirements 7.4, 7.6, 7.9, 10.2, 10.3**

### Property 11: Vendor Role Creation

*For any* vendor created through the system, the user record SHALL have role type "vendor" and SHALL have associated job assignments stored in the vendor_job_assignments table.

**Validates: Requirements 7.3, 10.1, 10.4**

### Property 12: Vendor Deactivation

*For any* deactivated vendor, the vendor's data SHALL be preserved in the database, but the vendor SHALL NOT be able to authenticate or access any system resources.

**Validates: Requirements 7.8**

### Property 13: Score Breakdown API Round-Trip

*For any* valid candidate score breakdown data (domainScore, industryScore, keyResponsibilitiesScore), storing via the API and then retrieving SHALL return equivalent values.

**Validates: Requirements 8.1, 8.2, 8.5**

### Property 14: Flexible Auto-Rejection Rules Persistence

*For any* valid auto-rejection rules configuration (with multiple rules containing field, operator, value, and logic connector), storing with a job and then retrieving SHALL return equivalent rules.

**Validates: Requirements 9.1, 9.7**

### Property 15: Vendor Job Assignment Updates

*For any* vendor whose job assignments are modified, subsequent API requests from that vendor SHALL immediately reflect the updated access permissions.

**Validates: Requirements 10.5**

## Error Handling

### Frontend Error Handling

1. **Missing Contact Information**
   - Display "-" or empty placeholder when phone/email is null
   - Do not throw errors for missing optional fields

2. **Score Calculation Errors**
   - Handle division by zero when all sub-scores are null (display "N/A")
   - Validate score values are within 0-100 range

3. **Auto-Rejection Rule Validation**
   - Validate minimum experience is non-negative
   - Show validation errors inline in the form

4. **Vendor Management Errors**
   - Display error toast for failed vendor operations
   - Validate email uniqueness before submission

### Backend Error Handling

1. **Auto-Rejection Processing**
   - Log errors but don't block application submission
   - Queue failed auto-rejections for retry

2. **Vendor Access Control**
   - Return 403 Forbidden for unauthorized job access
   - Log access violations for security audit

3. **Score Update Validation**
   - Validate scores are integers between 0-100
   - Return 400 Bad Request for invalid values

4. **Database Constraints**
   - Handle unique constraint violations for vendor-job assignments
   - Return appropriate error messages for constraint failures

## Testing Strategy

### Unit Tests

Unit tests will cover specific examples and edge cases:

1. **Score Calculation**
   - Test average with all three scores present
   - Test average with one or two null scores
   - Test edge case with all null scores

2. **Auto-Rejection Logic**
   - Test rejection when numeric field < threshold (less_than operator)
   - Test rejection when numeric field > threshold (greater_than operator)
   - Test rejection when text field matches (equals operator)
   - Test rejection when text field contains value (contains operator)
   - Test rejection when array field contains value (contains operator)
   - Test no rejection when rules don't match
   - Test no rejection when rules disabled
   - Test AND logic between multiple rules
   - Test OR logic between multiple rules
   - Test dynamic rejection reason generation

3. **Stage Ordering**
   - Test default stage creation order
   - Test Selected stage position

4. **Vendor Access**
   - Test vendor can access assigned job
   - Test vendor cannot access unassigned job

### Property-Based Tests

Property-based tests will use fast-check library with minimum 100 iterations per test.

**Test Configuration:**
- Library: fast-check
- Minimum iterations: 100
- Tag format: **Feature: ats-comprehensive-enhancements, Property N: [property text]**

**Property Tests to Implement:**

1. **Property 2: Score Average Calculation**
   - Generate random sub-scores (0-100 or null)
   - Verify average calculation is correct

2. **Property 4: Flexible Auto-Rejection Rule Enforcement**
   - Generate random candidate data and rule configurations
   - Test various field types (numeric, text, array)
   - Test various operators per field type
   - Verify rejection occurs when rules match

3. **Property 6: Pipeline Stage Ordering**
   - Generate random job creation inputs
   - Verify stages are created in correct order

4. **Property 10: Vendor Access Control**
   - Generate random vendor-job assignments
   - Verify vendor can only access assigned jobs

5. **Property 13: Score Breakdown API Round-Trip**
   - Generate random score values
   - Verify store then retrieve returns equivalent data

6. **Property 14: Auto-Rejection Rules Persistence**
   - Generate random rule configurations
   - Verify store then retrieve returns equivalent rules

### Integration Tests

1. **End-to-End Auto-Rejection Flow**
   - Create job with auto-rejection rules
   - Submit candidate application
   - Verify candidate is in Rejected stage

2. **Vendor Workflow**
   - Create vendor with job assignments
   - Login as vendor
   - Verify data access restrictions

3. **Interview Scheduling with Round Type**
   - Schedule interview with round type
   - Verify round type is stored and displayed

