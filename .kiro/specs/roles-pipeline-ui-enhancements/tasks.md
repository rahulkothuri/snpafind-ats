# Implementation Plan: Roles & Pipeline UI Enhancements

## Overview

This implementation plan covers four UI enhancements: adding an Edit JD button, increasing the candidate sidebar width, adding a More Info button for navigation to the candidate profile page, and implementing drag-and-drop functionality for the Kanban board view.

## Tasks

- [x] 1. Update CSS variable for sidebar width
  - Modify `--detail-panel-width` from 400px to 500px in `frontend/src/index.css`
  - Add mobile responsive rule for full-width sidebar below 768px
  - _Requirements: 2.1, 2.2, 2.6_

- [x] 2. Add Edit JD button to JobDetailsRightPanel
  - [x] 2.1 Update JobDetailsRightPanelProps interface to include `onEditJobDescription` callback
    - Add optional `onEditJobDescription?: () => void` prop
    - _Requirements: 1.1_
  - [x] 2.2 Add Edit JD button next to View JD button in the job header
    - Use same `variant="outline"` styling as View JD button
    - Only render when `onEditJobDescription` prop is provided
    - _Requirements: 1.1, 1.3_

- [x] 3. Implement Edit JD navigation in RolesPage
  - [x] 3.1 Add `handleEditJobDescription` handler function
    - Navigate to `/jobs/${selectedRole.id}/edit` when clicked
    - _Requirements: 1.2, 1.4_
  - [x] 3.2 Pass `onEditJobDescription` prop to JobDetailsRightPanel
    - Wire up the handler to the component
    - _Requirements: 1.2_

- [x] 4. Add More Info button to DetailPanel component
  - [x] 4.1 Update DetailPanelProps interface
    - Add optional `onMoreInfo?: () => void` prop
    - _Requirements: 3.1_
  - [x] 4.2 Add More Info button in the header area
    - Position between title and close button
    - Style with white background and blue text for visibility
    - _Requirements: 3.1, 3.4_

- [x] 5. Implement More Info navigation in RolesPage
  - [x] 5.1 Add `handleMoreInfo` handler function
    - Close the sidebar first by setting `selectedCandidate` to null
    - Navigate to `/candidates/${candidateId}`
    - _Requirements: 3.2, 3.3, 3.5_
  - [x] 5.2 Pass `onMoreInfo` prop to DetailPanel
    - Wire up the handler with the selected candidate's ID
    - _Requirements: 3.2_

- [x] 6. Checkpoint - Verify all changes work correctly
  - Ensure Edit JD button appears and navigates correctly
  - Ensure sidebar width is 500px on desktop
  - Ensure More Info button navigates to candidate profile
  - Ensure mobile responsive behavior works below 768px
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- The CSS variable change will automatically apply to all pages using DetailPanel (Roles page and Candidates page)
- Navigation uses React Router's `useNavigate` hook which is already imported in RolesPage
- The Edit JD route `/jobs/:id/edit` should already exist or will need to be created separately

## Additional Tasks - Drag-and-Drop for Kanban Board

- [ ] 7. Install drag-and-drop library
  - Install `@hello-pangea/dnd` package (maintained fork of react-beautiful-dnd)
  - Run `npm install @hello-pangea/dnd` in frontend directory
  - _Requirements: 4.1_

- [ ] 8. Implement drag-and-drop in KanbanBoardView
  - [ ] 8.1 Wrap KanbanBoardView with DragDropContext
    - Import DragDropContext from @hello-pangea/dnd
    - Add onDragEnd handler
    - _Requirements: 4.1_
  - [ ] 8.2 Make stage columns Droppable
    - Wrap each stage column with Droppable component
    - Use stage name as droppableId
    - Add visual feedback for drag-over state (highlighted border)
    - _Requirements: 4.3_
  - [ ] 8.3 Make KanbanCard components Draggable
    - Wrap each KanbanCard with Draggable component
    - Use candidate ID as draggableId
    - Add visual feedback for dragging state (opacity, shadow)
    - _Requirements: 4.2, 4.7_
  - [ ] 8.4 Implement onDragEnd handler with optimistic updates
    - Check if destination exists and is different from source
    - Update local state immediately for responsive UI
    - Call API to persist the stage change
    - Revert on API failure with error toast
    - _Requirements: 4.4, 4.5, 4.6, 4.8_

- [ ] 9. Add onCandidateDrop prop to KanbanBoardView
  - [ ] 9.1 Update KanbanBoardViewProps interface
    - Add `onCandidateDrop: (candidateId: string, sourceStage: string, targetStage: string) => Promise<void>` prop
    - _Requirements: 4.4_
  - [ ] 9.2 Implement stage move handler in JobDetailsRightPanel
    - Call pipeline service to update candidate stage
    - Trigger candidates refresh on success
    - _Requirements: 4.4, 4.5_

- [ ] 10. Checkpoint - Verify drag-and-drop functionality
  - Ensure drag-and-drop moves candidates between stages
  - Ensure visual feedback appears during drag operations
  - Ensure failed drag-and-drop reverts card position
  - Ensure dropping in same stage does not trigger API call
  - Ensure all tests pass, ask the user if questions arise.
