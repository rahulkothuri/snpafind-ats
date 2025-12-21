# Design Document

## Overview

This design document outlines the UI improvements for the public job application page. The redesign focuses on a "view first, apply second" approach where candidates see complete job information before starting their application. The form is split into two manageable stages with full responsive support.

## Architecture

The apply page will follow a single-page architecture with conditional rendering:

### Page States
1. **Job Details View** (Initial State): Shows complete job info with Apply button
2. **Application Form View**: Two-stage form that appears after clicking Apply
3. **Success View**: Confirmation after successful submission
4. **Error View**: Error state for invalid/unavailable jobs

### Layout Structure
- Single column layout on mobile (< 768px)
- Two column layout on tablet/desktop (≥ 768px)
- Job details panel: sticky on desktop, scrollable content
- Form panel: scrollable with fixed navigation buttons

## Components and Interfaces

### Modified Components

#### 1. ApplicationPage Component
- **Location**: `frontend/src/pages/ApplicationPage.tsx`
- **Changes**: Add view state management, restructure layout
- **New State**: `showApplicationForm: boolean` to toggle between views


#### 2. JobDetailsPanel Component
- **Location**: `frontend/src/components/JobDetailsPanel.tsx`
- **Changes**: Enhanced to show full job description with better formatting
- **Props**: No changes needed, already supports all required fields

### New Interfaces

```typescript
interface ApplicationPageState {
  showApplicationForm: boolean;
  currentStep: 1 | 2;
  formData: ApplicationFormData;
  errors: FormErrors;
}

interface ResponsiveBreakpoints {
  mobile: '< 768px';
  tablet: '768px - 1024px';
  desktop: '> 1024px';
}
```

## Data Models

No changes to existing data models. The page uses existing Job and Application types.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property 1: Form data preservation across stages**
*For any* application form data entered in stage 1, when navigating to stage 2 and back, the data should remain unchanged
**Validates: Requirements 4.5**

**Property 2: Apply button visibility**
*For any* job details view state, the Apply button should be visible at the bottom of the content
**Validates: Requirements 3.2**

**Property 3: Form visibility toggle**
*For any* initial page load, the application form should be hidden until the Apply button is clicked
**Validates: Requirements 3.4**

## Error Handling

### View State Errors
- Invalid job ID: Show error view with appropriate message
- Network errors: Show retry option with error message
- Form validation: Inline error messages per field

### Responsive Layout Errors
- CSS fallbacks for unsupported features
- Graceful degradation on older browsers

## Testing Strategy

### Unit Testing
- Test form data preservation between stages
- Test Apply button click handler
- Test responsive breakpoint detection
- Test form validation logic

### Property-Based Testing
- Use fast-check for form data preservation tests
- Test with various form data combinations

**Testing Framework**: Vitest with React Testing Library
**Minimum Iterations**: 100 iterations per property-based test