# Implementation Plan

- [x] 1. Create enhanced candidate card component
- [x] 1.1 Design comprehensive candidate card layout
  - Create EnhancedCandidateCard component with all required fields
  - Display name, phone, email in header section
  - Show current company, location, experience, notice period
  - Include salary information (current and expected)
  - Add age, industry, and job domain fields
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.2 Implement skills and summary display
  - Show skills as tags with overflow handling (+X more)
  - Display 5-6 line candidate summary with proper formatting
  - Ensure text is readable and well-spaced
  - _Requirements: 1.5, 2.3, 2.4_

- [x] 1.3 Add action buttons to candidate cards
  - Include CV, Add to Job, Share, and More Actions buttons
  - Maintain existing functionality from table actions
  - _Requirements: 5.4, 5.5_

- [x] 2. Implement pagination system
- [x] 2.1 Create PaginationControls component
  - Display page numbers (1, 2, 3, etc.)
  - Add previous and next navigation buttons
  - Highlight current page number
  - Show total items and current range
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 2.2 Add pagination logic to candidate list
  - Limit display to 10 candidates per page
  - Calculate total pages based on filtered candidates
  - Handle page navigation and state management
  - _Requirements: 4.1, 4.2_

- [x]* 2.3 Write property test for pagination logic
  - **Property 1: Pagination consistency**
  - **Validates: Requirements 4.1, 4.2**

- [x] 3. Reorganize page layout structure
- [x] 3.1 Reorder page sections
  - Keep search and filters at the top
  - Maintain KPI cards after search/filters
  - Position candidate list after KPI cards
  - Move database insights to bottom of page
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3.2 Replace table with card-based layout
  - Remove existing CandidateMasterTable component usage
  - Implement grid layout for enhanced candidate cards
  - Ensure responsive design for different screen sizes
  - _Requirements: 2.1, 5.1, 5.2_

- [x] 4. Enhance candidate data model
- [x] 4.1 Add missing candidate fields
  - Add age, industry, jobDomain fields to DatabaseCandidate interface
  - Include candidateSummary field for 5-6 line descriptions
  - Add createdAt field for creation date display
  - Update sample data with new fields
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 4.2 Update API integration for new fields
  - Modify candidate mapping from API to include new fields
  - Handle missing fields gracefully with defaults
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Checkpoint - Ensure all functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x]* 5.1 Write unit tests for enhanced components
  - Test EnhancedCandidateCard rendering with various data
  - Test PaginationControls with different page scenarios
  - Test layout reordering and section positioning
  - _Requirements: 2.1, 4.3, 3.1_