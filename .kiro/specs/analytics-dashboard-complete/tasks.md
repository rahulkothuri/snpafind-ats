# Implementation Plan: Analytics Dashboard Complete

## Overview

This implementation plan transforms the analytics dashboard to display real-time data from the database with all 7 analytics sections matching the reference design. The existing backend service and routes are already implemented, so the focus is on ensuring the frontend properly fetches and displays all data without hardcoded content.

## Tasks

- [x] 1. Verify and fix backend analytics endpoints
  - [x] 1.1 Test all analytics API endpoints return real data
    - Run manual tests against `/api/analytics/kpis`, `/api/analytics/funnel`, `/api/analytics/rejection-reasons`, `/api/analytics/time-in-stage`, `/api/analytics/recruiters`, `/api/analytics/panels`, `/api/analytics/time-to-fill`, `/api/analytics/drop-off`, `/api/analytics/sla`
    - Verify responses match expected data models
    - _Requirements: 10.5_
  - [x] 1.2 Fix any backend service methods that return empty or incorrect data
    - Ensure all calculations use actual database records
    - Fix any edge cases with empty data
    - _Requirements: 10.5_

- [x] 2. Update frontend analytics hooks to properly fetch data
  - [x] 2.1 Review and fix useAnalytics hooks
    - Ensure all hooks call correct API endpoints
    - Add proper error handling and loading states
    - Remove any mock/fallback data
    - _Requirements: 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 8.2_
  - [ ]* 2.2 Write property test for filter refresh behavior
    - **Property 1: Filter Changes Refresh All Data**
    - **Validates: Requirements 1.3, 9.2**

- [x] 3. Update KPI Summary Cards section
  - [x] 3.1 Update AnalyticsPage to display 6 KPI cards with real data
    - Avg Time to Hire from `kpis.avgTimeToFill`
    - Offer Acceptance Rate from `kpis.offerAcceptanceRate`
    - Interview → Offer rate calculated from funnel data
    - Overall Rejection Rate calculated from funnel data
    - Roles on Track from `slaData.summary`
    - Active Candidates from `kpis.activeCandidates`
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_
  - [x] 3.2 Add loading and empty states for KPI cards
    - Show skeleton loaders while loading
    - Show appropriate values when data is empty
    - _Requirements: 10.2, 10.4_

- [x] 4. Update Stage Funnel Conversion chart
  - [x] 4.1 Ensure FunnelChart displays real funnel data
    - Fetch from `/api/analytics/funnel`
    - Display all stages with counts and percentages
    - Use correct color scheme (blue gradient, green for hired)
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6_
  - [ ]* 4.2 Write property test for funnel stages display
    - **Property 2: Funnel Stages Display Completeness**
    - **Validates: Requirements 2.3, 2.4**

- [x] 5. Update Rejections by Reason pie chart
  - [x] 5.1 Ensure RejectionPieChart displays real rejection data
    - Fetch from `/api/analytics/rejection-reasons`
    - Display all reasons with percentages
    - Show top stage for rejections
    - Use correct colors (red, orange, blue, green)
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6_
  - [ ]* 5.2 Write property test for rejection reasons display
    - **Property 3: Rejection Reasons Display Completeness**
    - **Validates: Requirements 3.3, 3.6**

- [x] 6. Update Average Time Spent at Each Stage chart
  - [x] 6.1 Ensure HorizontalBarChart displays time-in-stage data
    - Fetch from `/api/analytics/time-in-stage`
    - Display stage transitions with average days
    - Highlight bottleneck stage
    - Show suggestion text
    - _Requirements: 4.1, 4.3, 4.4, 4.5_
  - [ ]* 6.2 Write property test for bottleneck identification
    - **Property 4: Time-in-Stage Bottleneck Identification**
    - **Validates: Requirements 4.3, 4.4**

- [x] 7. Update Recruiter Productivity table
  - [x] 7.1 Ensure recruiter table displays real data
    - Fetch from `/api/analytics/recruiters`
    - Display all columns: name, roles, CVs, interviews, offers, hires, TTF
    - Show top 3 recruiters by default
    - Add link to full report
    - _Requirements: 5.1, 5.3, 5.4, 5.5_
  - [ ]* 7.2 Write property test for recruiter table columns
    - **Property 5: Recruiter Table Column Completeness**
    - **Validates: Requirements 5.3**

- [x] 8. Update Panel Performance table
  - [x] 8.1 Ensure PanelPerformanceCard displays real data
    - Fetch from `/api/analytics/panels`
    - Display all columns: name, rounds, offer%, rejection reason, feedback time
    - Highlight high performers and slow feedback
    - Add actionable insights
    - _Requirements: 6.1, 6.3, 6.4, 6.5_
  - [ ]* 8.2 Write property test for panel highlighting
    - **Property 6: Panel Performance Highlighting**
    - **Validates: Requirements 6.3, 6.4**

- [x] 9. Update Role-wise Time to Fill chart
  - [x] 9.1 Ensure HorizontalBarChart displays time-to-fill by role
    - Fetch from `/api/analytics/time-to-fill`
    - Display role names with average days
    - Highlight roles over 30 days in orange
    - Show benchmark target
    - Add link to details
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.6_
  - [ ]* 9.2 Write property test for threshold highlighting
    - **Property 7: Time-to-Fill Threshold Highlighting**
    - **Validates: Requirements 7.3, 7.4**

- [x] 10. Update Rejections by Stage chart
  - [x] 10.1 Ensure StageRejectionChart displays real drop-off data
    - Fetch from `/api/analytics/drop-off`
    - Display stages with rejection percentages
    - Use light red color for bars
    - Identify highest drop-off stage
    - Show suggestion for improvement
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6_
  - [ ]* 10.2 Write property test for drop-off identification
    - **Property 8: Drop-off Stage Identification**
    - **Validates: Requirements 8.3, 8.5**

- [x] 11. Update Filter Bar functionality
  - [x] 11.1 Ensure filters fetch real options from database
    - Fetch departments from jobs
    - Fetch locations from jobs
    - Implement period presets
    - Add clear filters button
    - Add group by selector
    - _Requirements: 9.1, 9.3, 9.4_
  - [x] 11.2 Ensure filter changes refresh all data
    - Pass filter params to all API calls
    - Persist filter state during session
    - _Requirements: 9.2, 9.5_
  - [ ]* 11.3 Write property test for filter persistence
    - **Property 9: Filter State Persistence**
    - **Validates: Requirements 9.5**

- [x] 12. Implement loading, error, and empty states
  - [x] 12.1 Add consistent loading states across all sections
    - Use skeleton loaders for cards and charts
    - Show loading indicator in filter bar
    - _Requirements: 10.4_
  - [x] 12.2 Add error states with retry functionality
    - Display error message when API fails
    - Add retry button to refetch data
    - _Requirements: 10.3_
  - [x] 12.3 Add empty states for no data scenarios
    - Show helpful message when no data available
    - Suggest adjusting filters
    - _Requirements: 10.2_
  - [ ]* 12.4 Write property test for state handling
    - **Property 10: Loading/Error/Empty State Handling**
    - **Validates: Requirements 10.2, 10.3, 10.4**

- [x] 13. Verify export functionality
  - [x] 13.1 Ensure export buttons work with real data
    - PDF export includes all visible data
    - Excel export includes all visible data
    - Exports respect current filters
    - _Requirements: 11.1, 11.2, 11.3_
  - [ ]* 13.2 Write property test for export completeness
    - **Property 12: Export Data Completeness**
    - **Validates: Requirements 11.3**

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Remove all hardcoded/mock data
  - [x] 15.1 Audit AnalyticsPage for any remaining mock data
    - Remove mockFilterOptions
    - Remove any fallback hardcoded values
    - Ensure all data comes from API
    - _Requirements: 10.1_
  - [ ]* 15.2 Write property test for backend data calculation
    - **Property 11: Backend Data Calculation from Database**
    - **Validates: Requirements 10.5**

- [x] 16. Final integration testing
  - [x] 16.1 Test complete analytics page with real database data
    - Verify all 7 sections display correctly
    - Verify filters work across all sections
    - Verify export generates correct reports
    - _Requirements: All_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The existing backend analytics service is comprehensive; focus is on frontend integration
