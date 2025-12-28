# Implementation Plan: Dashboard, Analytics & Company Reporting

## Overview

This implementation plan covers Phase 4 of the ATS system - Dashboard, Analytics & Company Reporting. The implementation follows a backend-first approach, building analytics services and API endpoints before creating the frontend components. Property-based tests are included to verify correctness of calculations and data transformations.

## Tasks

- [x] 1. Create Analytics Service Foundation
  - [x] 1.1 Create analytics service file with core interfaces and types
    - Create `backend/src/services/analytics.service.ts`
    - Define TypeScript interfaces for all analytics data types (KPIMetrics, FunnelData, TimeToFillData, etc.)
    - Implement base analytics filters interface
    - _Requirements: 1.1, 2.1, 6.1, 7.1, 8.1_

  - [ ]* 1.2 Write property test for KPI data completeness
    - **Property 2: KPI Data Completeness**
    - **Validates: Requirements 1.1, 1.4**

  - [x] 1.3 Implement KPI metrics calculation
    - Calculate active roles count from jobs table
    - Calculate active candidates count
    - Calculate interviews today/this week from interviews table
    - Calculate offers pending count
    - Calculate total hires for period
    - Calculate average time-to-fill
    - Calculate offer acceptance rate
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 1.4 Write property test for role-based data filtering
    - **Property 1: Role-based Data Filtering**
    - **Validates: Requirements 1.2, 1.3, 3.7, 11.5**

- [x] 2. Implement Funnel and Conversion Analytics
  - [x] 2.1 Implement funnel analytics calculation
    - Query candidates grouped by pipeline stage
    - Calculate counts and percentages for each stage
    - Calculate conversion rates between consecutive stages
    - Support filtering by department, location, date range
    - _Requirements: 2.1, 2.2, 2.3, 9.1, 9.2_

  - [ ]* 2.2 Write property test for funnel data correctness
    - **Property 3: Funnel Data Correctness**
    - **Validates: Requirements 2.1, 2.2, 2.5, 9.1, 9.2**

  - [x] 2.3 Implement drop-off analysis
    - Calculate drop-off counts per stage
    - Calculate drop-off percentages
    - Identify stage with highest drop-off
    - Group rejection reasons into categories
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

  - [ ]* 2.4 Write property test for drop-off analysis and rejection categorization
    - **Property 16: Drop-off Analysis Correctness**
    - **Property 17: Rejection Reason Categorization**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.5**

- [x] 3. Implement Time Analytics
  - [x] 3.1 Implement time-to-fill calculation
    - Calculate average time-to-fill for closed roles
    - Break down by department
    - Break down by individual role
    - Flag roles exceeding target threshold
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

  - [ ]* 3.2 Write property test for time-to-fill calculation
    - **Property 11: Time-to-Fill Calculation Correctness**
    - **Property 12: Time-to-Fill Target Highlighting**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.6**

  - [x] 3.3 Implement time-in-stage calculation
    - Calculate average time spent in each stage
    - Identify bottleneck stage (longest average)
    - Generate actionable suggestions
    - Support filtering by job, department, date range
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

  - [ ]* 3.4 Write property test for time-in-stage and bottleneck identification
    - **Property 13: Time-in-Stage Calculation and Bottleneck Identification**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 4. Implement Source and Offer Analytics
  - [x] 4.1 Implement source performance analytics
    - Calculate candidate distribution by source
    - Calculate hire rate per source
    - Rank sources by effectiveness (hire rate)
    - Exclude sources with zero candidates
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 4.2 Write property test for source analytics
    - **Property 9: Source Analytics Completeness**
    - **Property 10: Source Ranking by Effectiveness**
    - **Validates: Requirements 5.1, 5.2, 5.4, 5.5, 5.6**

  - [x] 4.3 Implement offer acceptance rate analytics
    - Calculate overall offer acceptance rate
    - Break down by department and role
    - Flag rates below 70% threshold
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 4.4 Write property test for offer acceptance rate
    - **Property 14: Offer Acceptance Rate Calculation**
    - **Property 15: Threshold-based Warning Indicators**
    - **Validates: Requirements 8.1, 8.4, 8.5**

- [x] 5. Checkpoint - Backend Analytics Services
  - Ensure all analytics service tests pass
  - Ask the user if questions arise

- [ ] 6. Implement Team Performance Analytics
  - [ ] 6.1 Implement recruiter productivity analytics
    - Calculate metrics per recruiter: active roles, CVs added, interviews, offers, hires
    - Calculate average time-to-fill per recruiter
    - Calculate composite productivity score
    - Support role-based filtering (recruiters see only their own data)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 6.2 Write property test for recruiter productivity data
    - **Property 18: Recruiter Productivity Data Completeness**
    - **Validates: Requirements 11.1, 11.2**

  - [ ] 6.3 Implement panel performance analytics
    - Calculate metrics per panel: rounds conducted, offer percentage, feedback time
    - Identify top rejection reason per panel
    - Identify panels with highest offer conversion
    - Identify panels with slow feedback times
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [ ]* 6.4 Write property test for panel performance data
    - **Property 19: Panel Performance Data Completeness**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [ ] 7. Implement SLA Analytics
  - [ ] 7.1 Implement SLA status calculation
    - Calculate SLA status per role based on configured thresholds
    - Categorize roles as On track, At risk, or Breached
    - Identify candidates causing SLA breaches
    - Support company-specific SLA configuration
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

  - [ ]* 7.2 Write property test for SLA status calculation
    - **Property 25: SLA Status Calculation**
    - **Validates: Requirements 19.1, 19.2**

- [ ] 8. Implement Search Service
  - [ ] 8.1 Create search service with Boolean query parser
    - Create `backend/src/services/search.service.ts`
    - Implement Boolean query parser (AND, OR, NOT operators)
    - Support partial matching for name and email
    - _Requirements: 13.1, 13.2, 13.5_

  - [ ]* 8.2 Write property test for Boolean search parsing
    - **Property 20: Boolean Search Query Parsing**
    - **Property 21: Search Result Matching**
    - **Validates: Requirements 13.1, 13.2, 13.5**

  - [ ] 8.3 Implement candidate search
    - Search by name, email, phone, skills, experience, location, company, tags
    - Apply Boolean logic to search terms
    - Highlight matching terms in results
    - _Requirements: 13.1, 13.4_

  - [ ] 8.4 Implement advanced filtering
    - Filter candidates by stage, date range, location, source, experience, skills
    - Filter jobs by status, department, location, priority, SLA status
    - Combine multiple filters with AND logic
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ]* 8.5 Write property test for filter combination logic
    - **Property 22: Filter Combination Logic**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.5**

- [ ] 9. Checkpoint - Backend Services Complete
  - Ensure all backend service tests pass
  - Ask the user if questions arise

- [ ] 10. Create Analytics API Routes
  - [ ] 10.1 Create dashboard routes
    - Create `backend/src/routes/dashboard.routes.ts`
    - GET `/api/dashboard` - aggregated dashboard data
    - GET `/api/dashboard/kpis` - KPI metrics
    - GET `/api/dashboard/pipeline` - role pipeline data
    - GET `/api/dashboard/interviews` - upcoming interviews
    - GET `/api/dashboard/activity` - activity feed
    - _Requirements: 1.1, 3.1, 4.1, 20.1_

  - [ ] 10.2 Create analytics routes
    - Create `backend/src/routes/analytics.routes.ts`
    - GET `/api/analytics/funnel` - funnel analytics
    - GET `/api/analytics/time-to-fill` - time-to-fill metrics
    - GET `/api/analytics/time-in-stage` - time-in-stage metrics
    - GET `/api/analytics/sources` - source performance
    - GET `/api/analytics/recruiters` - recruiter productivity
    - GET `/api/analytics/panels` - panel performance
    - GET `/api/analytics/drop-off` - drop-off analysis
    - GET `/api/analytics/offer-rate` - offer acceptance rate
    - GET `/api/analytics/sla` - SLA status summary
    - _Requirements: 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1, 12.1, 19.1_

  - [ ] 10.3 Create search routes
    - Create `backend/src/routes/search.routes.ts`
    - GET `/api/search/candidates` - candidate search
    - GET `/api/search/jobs` - job search
    - _Requirements: 13.1, 14.1, 14.2_

  - [ ] 10.4 Implement analytics export endpoint
    - GET `/api/analytics/export` - export analytics report
    - Support PDF and Excel/CSV formats
    - Include date range and filters in export
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [ ]* 10.5 Write property test for export data consistency
    - **Property 24: Export Data Consistency**
    - **Validates: Requirements 16.3, 16.4**

  - [ ] 10.6 Register routes in main router
    - Update `backend/src/routes/index.ts` to include new routes
    - Apply authentication middleware
    - Apply role-based access control
    - _Requirements: 1.2, 1.3_

- [ ] 11. Checkpoint - Backend API Complete
  - Ensure all API routes work correctly
  - Test with sample data
  - Ask the user if questions arise

- [ ] 12. Create Frontend Analytics Service
  - [ ] 12.1 Create analytics service
    - Create `frontend/src/services/analytics.service.ts`
    - Define TypeScript interfaces matching backend responses
    - Implement API calls for all analytics endpoints
    - _Requirements: 1.1, 5.1, 6.1, 7.1, 8.1_

  - [ ] 12.2 Update dashboard service
    - Update `frontend/src/services/dashboard.service.ts`
    - Replace mock data with real API calls
    - Add role-based filtering support
    - _Requirements: 1.2, 1.3, 3.7_

  - [ ] 12.3 Create search service
    - Create `frontend/src/services/search.service.ts`
    - Implement candidate and job search API calls
    - Support Boolean query building
    - _Requirements: 13.1, 13.2_

- [ ] 13. Create Frontend Analytics Hooks
  - [ ] 13.1 Create useAnalytics hook
    - Create `frontend/src/hooks/useAnalytics.ts`
    - Implement React Query hooks for all analytics endpoints
    - Support date range and filter parameters
    - _Requirements: 15.1, 15.2, 15.3_

  - [ ]* 13.2 Write property test for date range filtering
    - **Property 23: Date Range Filtering**
    - **Validates: Requirements 15.1, 15.2, 15.3**

  - [ ] 13.3 Create useSearch hook
    - Create `frontend/src/hooks/useSearch.ts`
    - Implement search with debouncing
    - Support filter state management
    - _Requirements: 13.1, 14.1_

- [ ] 14. Create Analytics Chart Components
  - [ ] 14.1 Create FunnelChart component
    - Create `frontend/src/components/FunnelChart.tsx`
    - Display stages with proportional bar widths
    - Show counts and percentages
    - Support click handler for stage navigation
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [ ] 14.2 Create HorizontalBarChart component
    - Create `frontend/src/components/HorizontalBarChart.tsx`
    - Support color coding based on thresholds
    - Display labels and values
    - _Requirements: 5.1, 6.4, 7.2_

  - [ ] 14.3 Create PieChart component
    - Create `frontend/src/components/PieChart.tsx`
    - Display rejection reasons distribution
    - Show legend with percentages
    - _Requirements: 10.2_

  - [ ] 14.4 Create AnalyticsFilter component
    - Create `frontend/src/components/AnalyticsFilter.tsx`
    - Support date range selection (predefined and custom)
    - Support department, location, job filters
    - Display active filter count
    - Provide clear all filters action
    - _Requirements: 15.1, 15.2, 14.5, 14.6_

- [ ] 15. Checkpoint - Frontend Components
  - Ensure all chart components render correctly
  - Test with sample data
  - Ask the user if questions arise

- [ ] 16. Create Analytics Page
  - [ ] 16.1 Create AnalyticsPage component
    - Create `frontend/src/pages/AnalyticsPage.tsx`
    - Organize into sections: Overview KPIs, Funnel Analytics, Time Analytics, Source Analytics, Team Performance
    - Add section navigation
    - _Requirements: 17.1, 17.2, 17.5_

  - [ ] 16.2 Implement Overview KPIs section
    - Display KPI cards for key metrics
    - Show SLA status summary
    - _Requirements: 1.1, 19.1_

  - [ ] 16.3 Implement Funnel Analytics section
    - Display funnel chart with conversion rates
    - Display drop-off analysis
    - Display rejection reasons pie chart
    - _Requirements: 2.1, 9.1, 10.1, 10.2_

  - [ ] 16.4 Implement Time Analytics section
    - Display time-to-fill bar chart
    - Display time-in-stage bar chart with bottleneck highlighting
    - Show actionable suggestions
    - _Requirements: 6.1, 6.4, 7.1, 7.3, 7.4_

  - [ ] 16.5 Implement Source Analytics section
    - Display source performance bar chart
    - Rank by effectiveness
    - _Requirements: 5.1, 5.4_

  - [ ] 16.6 Implement Team Performance section
    - Display recruiter productivity table
    - Display panel performance table
    - _Requirements: 11.1, 12.1_

  - [ ] 16.7 Implement export functionality
    - Add export buttons for PDF and Excel
    - Show loading indicator during export
    - Handle export errors
    - _Requirements: 16.1, 16.2, 16.5, 16.6_

- [ ] 17. Enhance Dashboard Page
  - [ ] 17.1 Update DashboardPage with real data
    - Replace sample data with API calls
    - Implement role-based data filtering
    - _Requirements: 1.2, 1.3_

  - [ ] 17.2 Implement real-time updates
    - Add auto-refresh every 60 seconds
    - Display last updated timestamp
    - Add manual refresh button
    - _Requirements: 18.1, 18.2, 18.3_

  - [ ] 17.3 Enhance role pipeline table
    - Implement sorting functionality
    - Add SLA status color coding
    - Limit to top 7 roles with View All link
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

  - [ ]* 17.4 Write property test for role pipeline data and sorting
    - **Property 4: Role Pipeline Data Completeness**
    - **Property 5: Role Pipeline Limiting and Ranking**
    - **Property 6: Sorting Correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

  - [ ] 17.5 Enhance interviews widget
    - Display interviews with all required fields
    - Implement Today/This Week toggle
    - Limit to 5 with View All link
    - _Requirements: 4.1, 4.2, 4.4, 4.6_

  - [ ]* 17.6 Write property test for interview data
    - **Property 7: Interview Data Completeness and Limiting**
    - **Property 8: Interview Period Filtering**
    - **Validates: Requirements 4.2, 4.4, 4.6**

  - [ ] 17.7 Enhance activity feed
    - Display activities with timestamp, description, entity reference
    - Implement activity type filtering
    - Limit to 10 most recent
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [ ]* 17.8 Write property test for activity feed
    - **Property 26: Activity Feed Ordering and Limiting**
    - **Validates: Requirements 20.1, 20.2, 20.3, 20.4**

- [ ] 18. Implement Advanced Search UI
  - [ ] 18.1 Create SearchPage component
    - Create `frontend/src/pages/SearchPage.tsx` or enhance existing search
    - Implement search input with Boolean help
    - Display search results with highlighting
    - _Requirements: 13.1, 13.4_

  - [ ] 18.2 Implement advanced filters panel
    - Add filter controls for all supported filters
    - Display active filter count
    - Implement clear all filters
    - _Requirements: 14.1, 14.2, 14.5, 14.6_

- [ ] 19. Add Route Configuration
  - [ ] 19.1 Add analytics route to App.tsx
    - Add route for `/analytics` page
    - Apply authentication protection
    - _Requirements: 17.1_

- [ ] 20. Final Checkpoint - Complete Implementation
  - Ensure all tests pass
  - Verify all requirements are met
  - Test end-to-end functionality
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a backend-first approach to ensure data layer is solid before building UI
