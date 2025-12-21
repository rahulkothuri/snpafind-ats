# Design Document: Roles & Pipeline Page Improvements

## Overview

This design document outlines the implementation of improvements to the Roles & Pipelines page in the SnapFind ATS application. The key changes include:

1. A split-panel layout replacing the current scrolling design
2. Search functionality for roles and candidates
3. Open/Closed toggle filter for roles
4. Accurate application count display from database
5. Immediate logout redirect to login page

The design prioritizes a single-screen experience where users can view all relevant information without scrolling.

## Architecture

### Component Structure

```
RolesPage
├── Layout (existing wrapper)
├── RolesLeftPanel (new - 40% width)
│   ├── SearchInput (role search)
│   ├── StatusToggle (Open/Closed filter)
│   └── RolesListTable (compact role list)
└── JobDetailsRightPanel (new - 60% width)
    ├── JobHeader (title, department, actions)
    ├── KPICardsRow (4 metrics)
    ├── CandidateSearchInput (new)
    ├── StageSummaryStrip (existing)
    └── CandidateView (table or board)
```

### State Management

The page will manage the following state:
- `selectedRole`: Currently selected job role
- `roleSearchQuery`: Search text for filtering roles
- `statusFilter`: 'open' | 'closed' toggle state
- `candidateSearchQuery`: Search text for filtering candidates
- `viewMode`: 'table' | 'board' for candidate display
- `stageFilter`: Selected pipeline stage filter

## Components and Interfaces

### RolesLeftPanel Component

```typescript
interface RolesLeftPanelProps {
  roles: Role[];
  selectedRole: Role | null;
  onSelectRole: (role: Role) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'open' | 'closed';
  onStatusFilterChange: (status: 'open' | 'closed') => void;
}
```

### JobDetailsRightPanel Component

```typescript
interface JobDetailsRightPanelProps {
  role: Role | null;
  candidates: PipelineCandidate[];
  candidateSearchQuery: string;
  onCandidateSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  stageFilter: string | null;
  onStageFilterChange: (stage: string | null) => void;
  onCandidateClick: (candidate: PipelineCandidate) => void;
  isLoading: boolean;
}
```

### StatusToggle Component

```typescript
interface StatusToggleProps {
  value: 'open' | 'closed';
  onChange: (value: 'open' | 'closed') => void;
}
```

### SearchInput Component

```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}
```

### Logout Handler Update

The `useAuth` hook's logout function will be updated to include navigation:

```typescript
const logout = useCallback(() => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setUser(null);
  // Navigation will be handled by the component calling logout
}, []);
```

Components using logout will wrap it with navigation:

```typescript
const handleLogout = () => {
  logout();
  navigate('/login');
};
```

## Data Models

### Role Interface (updated)

```typescript
interface Role {
  id: string;
  title: string;
  department: string;
  location: string;
  openings: number;
  applicants: number;      // From job.candidateCount
  interviews: number;      // From job.interviewCount
  sla: 'On track' | 'At risk' | 'Breached';
  priority: 'High' | 'Medium' | 'Low';
  recruiter: string;
  status: 'active' | 'paused' | 'closed';  // Added for filtering
}
```

### Filter Functions

```typescript
// Role search filter
function filterRolesBySearch(roles: Role[], query: string): Role[] {
  if (!query.trim()) return roles;
  const lowerQuery = query.toLowerCase();
  return roles.filter(role => 
    role.title.toLowerCase().includes(lowerQuery)
  );
}

// Role status filter
function filterRolesByStatus(roles: Role[], status: 'open' | 'closed'): Role[] {
  if (status === 'open') {
    return roles.filter(role => role.status === 'active');
  }
  return roles.filter(role => role.status === 'closed' || role.status === 'paused');
}

// Candidate search filter
function filterCandidatesBySearch(candidates: PipelineCandidate[], query: string): PipelineCandidate[] {
  if (!query.trim()) return candidates;
  const lowerQuery = query.toLowerCase();
  return candidates.filter(candidate => 
    candidate.name.toLowerCase().includes(lowerQuery)
  );
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Role search filtering preserves matching roles

*For any* list of roles and any search query string, the filtered result should contain only roles whose title includes the search query (case-insensitive), and all such matching roles from the original list should be present in the result.

**Validates: Requirements 1.2**

### Property 2: Open status filter shows only active roles

*For any* list of roles with mixed statuses, when the status filter is set to 'open', the filtered result should contain only roles with status 'active', and all active roles from the original list should be present.

**Validates: Requirements 2.2**

### Property 3: Closed status filter shows only inactive roles

*For any* list of roles with mixed statuses, when the status filter is set to 'closed', the filtered result should contain only roles with status 'closed' or 'paused', and all such roles from the original list should be present.

**Validates: Requirements 2.3**

### Property 4: Candidate search filtering preserves matching candidates

*For any* list of candidates and any search query string, the filtered result should contain only candidates whose name includes the search query (case-insensitive), and all such matching candidates from the original list should be present in the result.

**Validates: Requirements 3.2**

### Property 5: Application count maps correctly from API data

*For any* job data from the API with a candidateCount field, the displayed applicants value in the role list should equal the candidateCount value from the API response.

**Validates: Requirements 4.1, 4.3**

### Property 6: Logout clears all authentication data

*For any* authenticated session, when logout is triggered, both the 'token' and 'user' keys should be removed from localStorage, and the user state should be set to null.

**Validates: Requirements 6.1, 6.2**

## Error Handling

### Search Input Errors
- Empty search results display a friendly message
- Search is debounced to prevent excessive filtering on rapid typing

### Data Loading Errors
- Loading states shown while fetching job/candidate data
- Error messages with retry option on API failures
- Graceful fallback to empty state if data unavailable

### Layout Errors
- Responsive breakpoint at 1024px for mobile layout
- Minimum widths prevent panel collapse
- Overflow handling for long role titles

## Testing Strategy

### Property-Based Testing

The implementation will use **fast-check** as the property-based testing library for TypeScript/React.

Each property test will:
- Run a minimum of 100 iterations
- Generate random inputs using fast-check arbitraries
- Be tagged with the corresponding correctness property reference

### Unit Tests

Unit tests will cover:
- Component rendering with various props
- User interaction handlers (click, input change)
- Edge cases (empty lists, long strings)
- Responsive layout breakpoints

### Integration Tests

Integration tests will verify:
- Role selection updates right panel
- Search + toggle filter combination
- Logout flow with navigation
- Data refresh after candidate application

### Test File Structure

```
frontend/src/__tests__/
├── properties/
│   └── roles-page.property.test.tsx  # Property-based tests
└── integration/
    └── roles-page.integration.test.tsx  # Integration tests
```
