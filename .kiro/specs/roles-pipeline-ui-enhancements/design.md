# Design Document: Roles & Pipeline UI Enhancements

## Overview

This design document outlines the implementation of UI enhancements to the Roles & Pipelines page in the SnapFind ATS application. The key changes include:

1. Adding an "Edit JD" button next to the existing "View JD" button
2. Increasing the candidate detail sidebar width from 400px to 500px (globally)
3. Adding a "More Info" button in the sidebar header to navigate to the full candidate profile
4. Implementing drag-and-drop functionality for the Kanban board view to move candidates between stages

These enhancements improve recruiter workflow by providing quick access to job editing, comprehensive candidate information, and intuitive stage management.

## Architecture

### Component Changes

```
JobDetailsRightPanel (modified)
├── JobHeader
│   ├── View JD Button (existing)
│   ├── Edit JD Button (new)
│   └── Add Candidate Button (existing)
├── KanbanBoardView (modified)
│   ├── DragDropContext (new - @hello-pangea/dnd)
│   ├── Droppable Stage Columns (new)
│   └── Draggable KanbanCard (new)
└── ... (rest unchanged)

DetailPanel (modified)
├── Header
│   ├── Title & Subtitle (existing)
│   ├── More Info Button (new)
│   └── Close Button (existing)
└── Content (existing)

CSS Variables (modified)
└── --detail-panel-width: 400px → 500px
```

### State Management

For drag-and-drop functionality:
- `isDragging`: Boolean to track if a card is being dragged
- Optimistic UI updates with rollback on API failure

No new persistent state is required. The changes involve:
- Adding navigation handlers for Edit JD and More Info buttons
- Updating CSS variable for sidebar width
- Adding drag-and-drop event handlers for stage transitions

## Components and Interfaces

### JobDetailsRightPanel Updates

The component will receive a new optional prop for handling Edit JD navigation:

```typescript
interface JobDetailsRightPanelProps {
  // ... existing props
  onViewJobDescription?: () => void;
  onEditJobDescription?: () => void;  // NEW
  jobDescriptionLoading?: boolean;
  editJobDescriptionLoading?: boolean;  // NEW (optional)
}
```

### DetailPanel Updates

The DetailPanel component will receive new props for the More Info functionality:

```typescript
interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onMoreInfo?: () => void;  // NEW - callback for More Info button
  candidateId?: string;     // NEW - for navigation URL construction
}
```

### Navigation Handlers

```typescript
// In RolesPage.tsx
const handleEditJobDescription = () => {
  if (!selectedRole) return;
  navigate(`/jobs/${selectedRole.id}/edit`);
};

const handleMoreInfo = (candidateId: string) => {
  setSelectedCandidate(null); // Close sidebar first
  navigate(`/candidates/${candidateId}`);
};
```

### Drag-and-Drop Implementation

Using `@hello-pangea/dnd` (maintained fork of react-beautiful-dnd):

```typescript
// KanbanBoardView props update
interface KanbanBoardViewProps {
  candidates: PipelineCandidate[];
  stages: string[];
  onCandidateClick: (candidate: PipelineCandidate) => void;
  selectedCandidates: string[];
  onSelectionChange: (candidateIds: string[]) => void;
  onCandidateDrop: (candidateId: string, sourceStage: string, targetStage: string) => Promise<void>;  // NEW
}

// Drag-and-drop handler
const handleDragEnd = async (result: DropResult) => {
  const { draggableId, source, destination } = result;
  
  // No destination or same position - do nothing
  if (!destination || source.droppableId === destination.droppableId) {
    return;
  }
  
  const candidateId = draggableId;
  const sourceStage = source.droppableId;
  const targetStage = destination.droppableId;
  
  // Optimistic UI update
  updateCandidateStageLocally(candidateId, targetStage);
  
  try {
    await onCandidateDrop(candidateId, sourceStage, targetStage);
  } catch (error) {
    // Rollback on failure
    updateCandidateStageLocally(candidateId, sourceStage);
    showErrorToast('Failed to move candidate. Please try again.');
  }
};
```

### Visual Feedback Styles

```css
/* Dragging card styles */
.kanban-card-dragging {
  opacity: 0.8;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  transform: rotate(2deg);
}

/* Drop target highlight */
.stage-column-drag-over {
  border: 2px dashed #0b6cf0;
  background-color: rgba(11, 108, 240, 0.05);
}
```

## Data Models

No changes to data models are required. This is purely a UI enhancement.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Detail panel width consistency across pages

*For any* page that uses the DetailPanel component, when the panel is open, the panel width should equal the value of the CSS variable `--detail-panel-width` (500px).

**Validates: Requirements 2.1, 2.2, 2.6**

### Property 2: Drag-and-drop stage transition preserves candidate data

*For any* candidate card dragged from one stage to another, the candidate's data (name, score, skills, etc.) should remain unchanged after the stage transition completes.

**Validates: Requirements 4.4, 4.5**

### Property 3: Failed stage transitions revert to original state

*For any* drag-and-drop operation that fails due to API error, the candidate card should return to its original stage position and the UI should match the server state.

**Validates: Requirements 4.6**

## Error Handling

### Navigation Errors
- If navigation to edit page fails, display an error toast
- If candidate ID is missing when More Info is clicked, log error and do nothing

### Drag-and-Drop Errors
- If API call to update stage fails, revert card to original position
- Display toast notification with error message
- Log error for debugging

### Loading States
- Edit JD button shows loading state while fetching job data (if needed)
- More Info button navigates immediately (no loading state needed)
- During drag-and-drop API call, show subtle loading indicator on the card

### Edge Cases
- If role is deselected while Edit JD is loading, cancel the operation
- If sidebar is closed programmatically, ensure navigation still completes
- If user drags card to same stage, no API call is made
- If user drops card outside any stage, card returns to original position

## Testing Strategy

### Property-Based Testing

The implementation will use **fast-check** as the property-based testing library for TypeScript/React.

Each property test will:
- Run a minimum of 100 iterations
- Generate random inputs using fast-check arbitraries
- Be tagged with the corresponding correctness property reference

### Unit Tests

Unit tests will cover:
- Edit JD button renders when role is selected
- Edit JD button click triggers navigation with correct job ID
- More Info button renders in DetailPanel header
- More Info button click closes sidebar and navigates
- Sidebar width is 500px (CSS variable check)
- Mobile responsive behavior at 768px breakpoint
- Drag start applies visual styles to card
- Drag over applies highlight to target column
- Drop in same stage does not trigger API call
- Drop in different stage triggers API call with correct parameters

### Integration Tests

Integration tests will verify:
- Full flow: Select role → Click Edit JD → Navigate to edit page
- Full flow: Click candidate → Sidebar opens → Click More Info → Navigate to profile
- Sidebar width consistent across Roles page and Candidates page
- Full flow: Drag candidate card → Drop in new stage → API called → UI updated
- Full flow: Drag candidate card → API fails → Card reverts to original stage

### Test File Structure

```
frontend/src/__tests__/
├── unit/
│   └── detail-panel.test.tsx
└── integration/
    └── roles-page-navigation.test.tsx
```

## Implementation Details

### CSS Variable Update

In `frontend/src/index.css`:

```css
:root {
  /* ... existing variables ... */
  --detail-panel-width: 500px;  /* Changed from 400px */
}
```

### Edit JD Button Implementation

In `JobDetailsRightPanel.tsx`, add the Edit JD button next to View JD:

```tsx
<div className="flex gap-2">
  {onViewJobDescription && (
    <Button 
      variant="outline" 
      onClick={onViewJobDescription}
      disabled={jobDescriptionLoading}
    >
      {jobDescriptionLoading ? 'Loading...' : 'View JD'}
    </Button>
  )}
  {onEditJobDescription && (
    <Button 
      variant="outline" 
      onClick={onEditJobDescription}
    >
      Edit JD
    </Button>
  )}
  <Button variant="primary">+ Add candidate</Button>
</div>
```

### More Info Button Implementation

In `DetailPanel.tsx`, add the More Info button in the header:

```tsx
<div className="flex items-start justify-between p-4 bg-gradient-to-r from-[#0b6cf0] to-[#3b82f6] text-white">
  <div className="min-w-0 flex-1">
    <h2 className="text-lg font-semibold text-white truncate">{title}</h2>
    {subtitle && (
      <p className="text-sm text-blue-100 truncate mt-0.5">{subtitle}</p>
    )}
  </div>
  <div className="flex items-center gap-2 ml-3">
    {onMoreInfo && (
      <button
        onClick={onMoreInfo}
        className="px-3 py-1.5 text-xs font-semibold text-[#0b6cf0] bg-white hover:bg-blue-50 rounded-lg transition-colors"
      >
        More Info
      </button>
    )}
    <button
      onClick={onClose}
      className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors"
      aria-label="Close panel"
    >
      {/* Close icon */}
    </button>
  </div>
</div>
```

### Mobile Responsive Sidebar

Add media query for full-width sidebar on mobile:

```css
@media (max-width: 767px) {
  :root {
    --detail-panel-width: 100vw;
  }
}
```
