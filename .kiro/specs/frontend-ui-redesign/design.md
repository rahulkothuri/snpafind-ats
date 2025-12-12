# Design Document: Frontend UI Redesign

## Overview

This design document outlines the approach for redesigning the ATS Portal frontend to match a modern white and blue theme. The redesign is purely visual - all existing content, functionality, data bindings, and business logic remain unchanged. The new design features:

- Light-themed sidebar (white/light gray background)
- Clean white cards with subtle shadows
- Blue accent color (#0b6cf0) for interactive elements
- Modern table designs with colored status badges
- Clean form layouts with consistent styling

## Architecture

The redesign follows a component-based approach, updating styles in existing React components without modifying their structure or functionality.

```
┌─────────────────────────────────────────────────────────────┐
│                        App Shell                             │
├──────────────┬──────────────────────────────────────────────┤
│              │                                               │
│   Sidebar    │              Main Content Area                │
│   (Light)    │  ┌─────────────────────────────────────────┐ │
│              │  │              Header (White)              │ │
│  - Logo      │  ├─────────────────────────────────────────┤ │
│  - User Info │  │                                         │ │
│  - Nav Items │  │           Page Content                  │ │
│  - Logout    │  │  - KPI Cards (White + Shadow)           │ │
│              │  │  - Tables (Clean borders)               │ │
│              │  │  - Forms (Light inputs)                 │ │
│              │  │  - Charts (Blue theme)                  │ │
│              │  │                                         │ │
│              │  └─────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Sidebar Component Updates

**Current:** Dark background (#020617) with light text
**New:** Light background (#ffffff) with dark text and blue accents

```typescript
// Updated color scheme
const sidebarStyles = {
  background: '#ffffff',
  borderRight: '1px solid #e2e8f0',
  textColor: '#374151',
  activeItemBg: '#eff6ff',
  activeItemText: '#0b6cf0',
  activeItemBorder: '#0b6cf0',
  hoverBg: '#f8fafc',
  userSectionBg: '#f8fafc',
};
```

### 2. Header Component Updates

**Current:** Dark background (#020617)
**New:** White background with bottom border

```typescript
const headerStyles = {
  background: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  textColor: '#111827',
  searchBg: '#f3f4f6',
  searchBorder: '#e2e8f0',
};
```

### 3. KPICard Component Updates

Minimal changes needed - already uses white background. Ensure consistent shadow and border styling.

```typescript
const kpiCardStyles = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  shadow: '0 1px 3px rgba(0,0,0,0.1)',
  labelColor: '#6b7280',
  valueColor: '#111827',
  trendGreen: '#16a34a',
  trendRed: '#dc2626',
};
```

### 4. Table Component Updates

Update header styling and row hover states.

```typescript
const tableStyles = {
  headerBg: '#f9fafb',
  headerText: '#6b7280',
  rowBorder: '#e2e8f0',
  rowHoverBg: '#f9fafb',
  selectedRowBg: '#eff6ff',
};
```

### 5. Badge Component Updates

Ensure consistent pill-shaped badges with appropriate colors.

```typescript
const badgeVariants = {
  green: { bg: '#dcfce7', text: '#166534' },  // Active
  orange: { bg: '#fef3c7', text: '#92400e' }, // Pending/Warning
  red: { bg: '#fee2e2', text: '#991b1b' },    // Inactive/Error
  blue: { bg: '#dbeafe', text: '#1e40af' },   // Info/Role
  gray: { bg: '#f3f4f6', text: '#374151' },   // Default
};
```

### 6. Button Component Updates

Ensure primary buttons use blue, secondary use gray/outline.

```typescript
const buttonVariants = {
  primary: {
    bg: '#0b6cf0',
    hoverBg: '#0958c7',
    text: '#ffffff',
    borderRadius: '9999px', // Pill shape
  },
  secondary: {
    bg: '#ffffff',
    border: '1px solid #e2e8f0',
    text: '#374151',
    hoverBg: '#f9fafb',
  },
  outline: {
    bg: 'transparent',
    border: '1px solid #0b6cf0',
    text: '#0b6cf0',
    hoverBg: '#eff6ff',
  },
};
```

### 7. Form Input Styling

```typescript
const inputStyles = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '10px 14px',
  focusBorder: '#0b6cf0',
  focusRing: 'rgba(11, 108, 240, 0.2)',
  labelColor: '#374151',
  placeholderColor: '#9ca3af',
};
```

## Data Models

No changes to data models - this is a visual-only redesign. All existing TypeScript interfaces, API calls, and state management remain unchanged.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Trend indicator color mapping
*For any* KPI card with a trend indicator, if the trend type is 'ok' or positive, the indicator SHALL be rendered with green color (#16a34a), and if the trend type is 'bad' or negative, the indicator SHALL be rendered with red color (#dc2626).
**Validates: Requirements 3.3**

### Property 2: Status badge color mapping
*For any* status badge displayed in a table, the badge color SHALL be determined by the status value: 'Active' maps to green, 'Pending' or 'At risk' maps to orange, 'Inactive' or 'Suspended' maps to red.
**Validates: Requirements 4.3**

## Error Handling

No changes to error handling - this is a visual-only redesign. Existing error states, loading states, and empty states will be styled consistently with the new theme.

## Testing Strategy

### Visual Testing Approach

Since this is a UI redesign, testing focuses on:

1. **Component Snapshot Tests**: Verify components render with correct CSS classes
2. **Visual Regression Tests**: Compare screenshots before/after changes
3. **Manual Testing**: Verify visual appearance matches design mockups

### Property-Based Testing

Using Vitest with fast-check for property-based tests:

```typescript
// Example: Badge color mapping property test
import { fc } from '@fast-check/vitest';

describe('Badge color mapping', () => {
  it('should map status to correct color variant', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Active', 'Pending', 'Inactive', 'Suspended', 'At risk'),
        (status) => {
          const variant = getStatusVariant(status);
          if (status === 'Active') return variant === 'green';
          if (status === 'Pending' || status === 'At risk') return variant === 'orange';
          if (status === 'Inactive' || status === 'Suspended') return variant === 'red';
          return true;
        }
      )
    );
  });
});
```

### Unit Tests

- Test that components render with correct CSS classes
- Test that color utility functions return expected values
- Test that theme variables are applied correctly

### Manual Testing Checklist

- [ ] Sidebar displays with light theme
- [ ] Header displays with white background
- [ ] KPI cards have consistent styling
- [ ] Tables display with clean borders and badges
- [ ] Forms have consistent input styling
- [ ] All pages maintain existing functionality
- [ ] Responsive behavior works correctly
