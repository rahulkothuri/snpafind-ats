# Design Document

## Overview

This design document outlines the improvements to the candidate master page UI. The redesign focuses on displaying comprehensive candidate information in enhanced card layouts, implementing pagination for better navigation, and reorganizing the page layout to prioritize candidate data over analytics.

## Architecture

The candidate master page will maintain its existing React component architecture while enhancing the candidate display and adding pagination:

### Page Layout Structure
1. **Search and Filters Section** (Top)
2. **KPI Cards Section** 
3. **Candidate List Section** (Enhanced cards with pagination)
4. **Database Insights Section** (Moved to bottom)
5. **Detail Panel** (Existing, unchanged)

### Data Flow
- Existing API integration remains unchanged
- Add pagination logic to slice candidate data
- Enhanced candidate card component with comprehensive fields

## Components and Interfaces

### Modified Components

#### 1. CandidateDatabasePage Component
- **Location**: `frontend/src/pages/CandidateDatabasePage.tsx`
- **Changes**: Reorganize layout order, add pagination state
- **New State**: `currentPage: number`, `itemsPerPage: number = 10`

#### 2. CandidateMasterTable Component
- **Changes**: Replace table with enhanced card layout
- **New Props**: `currentPage`, `itemsPerPage`, `onPageChange`

### New Components

#### 1. EnhancedCandidateCard Component
```typescript
interface EnhancedCandidateCardProps {
  candidate: DatabaseCandidate;
  onClick: (candidate: DatabaseCandidate) => void;
  isSelected: boolean;
}
```

#### 2. PaginationControls Component
```typescript
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}
```

### Enhanced Data Models

```typescript
interface EnhancedDatabaseCandidate extends DatabaseCandidate {
  // Additional fields for comprehensive display
  age?: number;
  industry?: string;
  jobDomain?: string;
  candidateSummary?: string;
  createdAt: string;
  salary?: {
    current: string;
    expected: string;
  };
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
```

## Data Models

### Candidate Card Layout Design

The enhanced candidate card will display information in a structured layout:

```
┌─────────────────────────────────────────────────────────────────┐
│ [Avatar] Name                                    Created: Date   │
│          Phone | Email                          Age: XX         │
│                                                                 │
│ Current Company: Company Name    │ Location: City               │
│ Experience: X yrs | NP: XX days  │ Industry: Industry Name     │
│ Salary: Current → Expected       │ Domain: Job Domain          │
│                                                                 │
│ Skills: [Skill1] [Skill2] [Skill3] [+X more]                  │
│                                                                 │
│ Summary: 5-6 line candidate summary describing background,      │
│ experience, key achievements, and career highlights...          │
│                                                                 │
│ [CV] [Add to Job] [Share] [More Actions]                       │
└─────────────────────────────────────────────────────────────────┘
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property 1: Pagination consistency**
*For any* candidate list with more than 10 items, the pagination should correctly calculate total pages and display appropriate page numbers
**Validates: Requirements 4.1, 4.2, 4.3**

**Property 2: Card information completeness**
*For any* candidate card, all available candidate information fields should be displayed when present
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

**Property 3: Layout organization**
*For any* page load, the sections should appear in the correct order: search/filters, KPIs, candidates, database insights
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Error Handling

### Pagination Errors
- Invalid page numbers: Default to page 1
- Empty result sets: Show appropriate empty state
- Navigation beyond bounds: Disable prev/next buttons appropriately

### Data Display Errors
- Missing candidate fields: Show placeholder or hide field gracefully
- Long text overflow: Truncate with ellipsis and expand on hover
- Image loading failures: Show initials avatar fallback

## Testing Strategy

### Unit Testing
- Test pagination calculations with various data sets
- Test candidate card rendering with complete and partial data
- Test layout reordering and section positioning

### Property-Based Testing
- Use fast-check for pagination logic with random data sizes
- Test card layout with various candidate data combinations

**Testing Framework**: Vitest with React Testing Library
**Minimum Iterations**: 100 iterations per property-based test