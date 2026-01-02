# Design Document: Analytics Dashboard Complete

## Overview

This design document describes the implementation of a complete, production-ready Analytics Dashboard for the ATS. The dashboard displays 7 key analytics sections with real-time data from the database, matching the reference design. The implementation leverages the existing backend analytics service and frontend components, enhancing them to ensure all data is fetched from APIs with no hardcoded content.

## Architecture

The analytics dashboard follows a client-server architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ AnalyticsPage│  │ FilterBar   │  │ Chart Components        │  │
│  │             │──│             │──│ - KPICard               │  │
│  │             │  │             │  │ - FunnelChart           │  │
│  │             │  │             │  │ - RejectionPieChart     │  │
│  │             │  │             │  │ - HorizontalBarChart    │  │
│  │             │  │             │  │ - RecruiterTable        │  │
│  │             │  │             │  │ - PanelPerformanceCard  │  │
│  │             │  │             │  │ - StageRejectionChart   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │                │                      │                │
│         └────────────────┴──────────────────────┘                │
│                          │                                       │
│                   useAnalytics hooks                             │
│                          │                                       │
│                   analyticsService                               │
└──────────────────────────┼───────────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────┼───────────────────────────────────────┐
│                        Backend (Express)                         │
│                          │                                       │
│              ┌───────────┴───────────┐                          │
│              │  analytics.routes.ts   │                          │
│              └───────────┬───────────┘                          │
│                          │                                       │
│              ┌───────────┴───────────┐                          │
│              │ AnalyticsService       │                          │
│              │ - getKPIMetrics()      │                          │
│              │ - getFunnelAnalytics() │                          │
│              │ - getTimeToFill()      │                          │
│              │ - getTimeInStage()     │                          │
│              │ - getRecruiterProd()   │                          │
│              │ - getPanelPerformance()│                          │
│              │ - getDropOffAnalysis() │                          │
│              │ - getRejectionReasons()│                          │
│              │ - getSLAStatus()       │                          │
│              └───────────┬───────────┘                          │
│                          │                                       │
│              ┌───────────┴───────────┐                          │
│              │      Prisma ORM        │                          │
│              └───────────┬───────────┘                          │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  PostgreSQL  │
                    │   Database   │
                    └─────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. AnalyticsPage (Main Container)
- Orchestrates all analytics sections
- Manages filter state and passes to child components
- Handles loading, error, and empty states

#### 2. AnalyticsFilterBar
- Period filter: Last 30 days, Last 90 days, Last 6 months, Custom range
- Department filter: All departments from database
- Location filter: All locations from database
- Group by selector: Role-wise, Recruiter-wise, Panel-wise
- Clear filters button

#### 3. KPICard (6 instances)
```typescript
interface KPICardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon?: React.ComponentType;
  badge?: { value: number; color: string };
}
```

#### 4. FunnelChart
```typescript
interface FunnelChartProps {
  stages: FunnelStage[];
  showPercentages: boolean;
}

interface FunnelStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  conversionToNext: number;
}
```

#### 5. RejectionPieChart
```typescript
interface RejectionPieChartProps {
  data: RejectionReason[];
  topStage: string;
}

interface RejectionReason {
  reason: string;
  percentage: number;
  color: string;
}
```

#### 6. HorizontalBarChart
```typescript
interface HorizontalBarChartProps {
  title: string;
  data: BarData[];
  showValues: boolean;
  colorScheme: {
    normal: string;
    warning: string;
    threshold: string;
  };
}

interface BarData {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  isOverThreshold?: boolean;
}
```

#### 7. RecruiterProductivityTable
```typescript
interface RecruiterTableProps {
  data: RecruiterData[];
  limit?: number;
}

interface RecruiterData {
  id: string;
  name: string;
  activeRoles: number;
  cvsAdded: number;
  interviewsScheduled: number;
  offersMade: number;
  hires: number;
  avgTimeToFill: number;
}
```

#### 8. PanelPerformanceCard
```typescript
interface PanelPerformanceProps {
  data: PanelData[];
}

interface PanelData {
  id: string;
  name: string;
  rounds: number;
  offerRate: number;
  topRejectionReason: string;
  avgFeedbackTime: number;
}
```

#### 9. StageRejectionChart
```typescript
interface StageRejectionProps {
  data: StageDropOff[];
  highestDropOffStage: string;
}

interface StageDropOff {
  stageName: string;
  dropOffCount: number;
  dropOffPercentage: number;
}
```

### Backend API Endpoints

All endpoints require authentication and support the following query parameters:
- `startDate`: ISO date string
- `endDate`: ISO date string
- `departmentId`: string
- `locationId`: string
- `jobId`: string
- `recruiterId`: string

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/kpis` | GET | KPI metrics for dashboard |
| `/api/analytics/funnel` | GET | Stage funnel conversion data |
| `/api/analytics/rejection-reasons` | GET | Rejection reasons breakdown |
| `/api/analytics/time-in-stage` | GET | Average time at each stage |
| `/api/analytics/recruiters` | GET | Recruiter productivity metrics |
| `/api/analytics/panels` | GET | Panel performance metrics |
| `/api/analytics/time-to-fill` | GET | Time-to-fill by role |
| `/api/analytics/drop-off` | GET | Stage-wise drop-off analysis |
| `/api/analytics/sla` | GET | SLA status summary |
| `/api/analytics/export` | GET | Export analytics report |

### Custom Hooks

```typescript
// useAnalytics.ts hooks
useKPIMetrics(filters: AnalyticsFilters): { data, isLoading, error }
useFunnelAnalyticsComplete(filters): { funnel: { data, isLoading, error } }
useTimeAnalytics(filters): { timeInStage, timeToFill }
useTeamPerformanceAnalytics(filters): { recruiters }
useSLAStatus(filters): { data }
useDropOffAnalysis(filters): { data }
useRejectionReasons(filters): { data }
usePanelPerformance(filters): { data }
```

## Data Models

### KPI Metrics Response
```typescript
interface KPIMetrics {
  activeRoles: number;
  activeCandidates: number;
  interviewsToday: number;
  interviewsThisWeek: number;
  offersPending: number;
  totalHires: number;
  avgTimeToFill: number;
  offerAcceptanceRate: number;
  rolesOnTrack: number;
  rolesAtRisk: number;
  rolesBreached: number;
}
```

### Funnel Data Response
```typescript
interface FunnelData {
  stages: FunnelStage[];
  totalApplicants: number;
  totalHired: number;
  overallConversionRate: number;
}
```

### Time Analytics Response
```typescript
interface TimeInStageData {
  stages: {
    stageName: string;
    avgDays: number;
    isBottleneck: boolean;
  }[];
  bottleneckStage: string;
  suggestion: string;
}

interface TimeToFillData {
  overall: { average: number; median: number; target: number };
  byDepartment: { department: string; average: number; count: number }[];
  byRole: { roleId: string; roleName: string; average: number; isOverTarget: boolean }[];
}
```

### Rejection Data Response
```typescript
interface RejectionData {
  reasons: {
    reason: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  topStageForRejection: string;
}
```

### Drop-off Data Response
```typescript
interface DropOffData {
  byStage: {
    stageName: string;
    dropOffCount: number;
    dropOffPercentage: number;
  }[];
  highestDropOffStage: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Filter Changes Refresh All Data
*For any* filter change (period, department, location), all analytics components SHALL refresh their data by calling the respective API endpoints with the updated filter parameters.
**Validates: Requirements 1.3, 9.2**

### Property 2: Funnel Stages Display Completeness
*For any* funnel data returned from the API, the FunnelChart SHALL display all stages in the correct order (by position) with their candidate count and percentage visible.
**Validates: Requirements 2.3, 2.4**

### Property 3: Rejection Reasons Display Completeness
*For any* rejection data returned from the API, the RejectionPieChart SHALL display all rejection reasons with their percentages, and the legend SHALL contain all reason names.
**Validates: Requirements 3.3, 3.6**

### Property 4: Time-in-Stage Bottleneck Identification
*For any* time-in-stage data returned from the API, the stage with the highest avgDays SHALL be marked as isBottleneck=true, and the bottleneckStage field SHALL match this stage name.
**Validates: Requirements 4.3, 4.4**

### Property 5: Recruiter Table Column Completeness
*For any* recruiter data returned from the API, the RecruiterTable SHALL display all required columns: name, activeRoles, cvsAdded, interviewsScheduled, offersMade, hires, avgTimeToFill.
**Validates: Requirements 5.3**

### Property 6: Panel Performance Highlighting
*For any* panel data returned from the API, panels with offerRate > 40% SHALL be highlighted as high performers, and panels with avgFeedbackTime > 12 hours SHALL be flagged for slow feedback.
**Validates: Requirements 6.3, 6.4**

### Property 7: Time-to-Fill Threshold Highlighting
*For any* time-to-fill data returned from the API, roles with average > 30 days SHALL have isOverTarget=true and be displayed with warning color (orange).
**Validates: Requirements 7.3, 7.4**

### Property 8: Drop-off Stage Identification
*For any* drop-off data returned from the API, the stage with the highest dropOffPercentage SHALL be identified in the highestDropOffStage field.
**Validates: Requirements 8.3, 8.5**

### Property 9: Filter State Persistence
*For any* filter selection made by the user, the filter values SHALL persist in component state during the session until explicitly cleared or changed.
**Validates: Requirements 9.5**

### Property 10: Loading/Error/Empty State Handling
*For any* API call, the component SHALL display: loading state while isLoading=true, error state with retry option when error is present, empty state when data is empty/null.
**Validates: Requirements 10.2, 10.3, 10.4**

### Property 11: Backend Data Calculation from Database
*For any* analytics API call, the returned metrics SHALL be calculated from actual database records (Job, JobCandidate, Interview, StageHistory tables) with no hardcoded values.
**Validates: Requirements 10.5**

### Property 12: Export Data Completeness
*For any* export request, the exported report SHALL include all currently visible analytics data with the current filter parameters applied.
**Validates: Requirements 11.3**

## Error Handling

### Frontend Error Handling
- API errors display user-friendly error messages with retry buttons
- Network errors show offline indicator
- Empty data states show appropriate empty state UI with helpful messages
- Loading states use skeleton loaders for better UX

### Backend Error Handling
- Invalid filter parameters return 400 Bad Request with validation errors
- Authentication failures return 401 Unauthorized
- Authorization failures return 403 Forbidden
- Database errors return 500 Internal Server Error with generic message
- All errors are logged for debugging

## Testing Strategy

### Unit Tests
- Test individual chart components render correctly with mock data
- Test filter bar state management
- Test KPI card displays correct values
- Test empty/loading/error states render correctly

### Property-Based Tests
- Property 1: Filter refresh - generate random filter combinations, verify all API calls include filters
- Property 4: Bottleneck identification - generate random time-in-stage data, verify bottleneck is correctly identified
- Property 7: Threshold highlighting - generate random time-to-fill data, verify roles over 30 days are flagged
- Property 8: Drop-off identification - generate random drop-off data, verify highest is identified
- Property 10: State handling - generate random API responses (loading/error/empty), verify correct state displayed
- Property 11: Backend calculation - verify API responses match database queries

### Integration Tests
- Test full page load with real API calls
- Test filter changes trigger data refresh
- Test export functionality generates correct file

### Testing Framework
- Frontend: Vitest with React Testing Library
- Backend: Vitest with supertest for API testing
- Property-based testing: fast-check library
- Minimum 100 iterations per property test
