# Table Link as Chip Button Feature

This feature adds the ability to display table hyperlinks as clickable chip buttons with configurable styling.

## Features

### 1. Show as Button Option
- Toggle to convert traditional hyperlinks into chip-style buttons
- Maintains all existing hyperlink functionality (external links, click handling)

### 2. Configurable Chip Styling
- **Chip Color**: Custom color picker for chip background
- **Chip Label**: Optional custom label (falls back to column value if empty)
- **Icon Support**: Optional external link icon with left/right positioning
- **Hover Effects**: Smooth transitions and elevation on hover

### 3. Backward Compatibility
- Existing hyperlink configurations continue to work
- New styling options are optional and default to sensible values
- Migration handles existing configs gracefully

## Usage

### Configuration
1. In the table chart control panel, expand "Hyperlink Columns"
2. Add or edit a hyperlink configuration
3. In the "Styling Options" section, check "Show as Button (Chip)"
4. Configure:
   - **Chip Color**: Choose a background color for the chip
   - **Chip Label**: Enter custom text (optional - uses column value if empty)

### Example Configuration
```typescript
{
  displayColumn: "product_name",
  urlColumn: "product_url", 
  styles: {
    showAsButton: true,
    chipColor: "#1976d2",
    chipLabel: "View Product",
    redirectIcon: true,
    iconPosition: "right",
    // ... other existing style options
  }
}
```

## Technical Implementation

### Components
- **ChipButton**: Reusable chip button component with configurable styling
- **HyperlinkConfigControl**: Updated with new styling options
- **TableChart**: Enhanced rendering logic to use ChipButton when enabled

### Styling
- CSS classes for proper table cell integration
- Hover effects and transitions
- Responsive design considerations
- Theme integration

### Type Safety
- Updated TypeScript interfaces for new configuration options
- Proper migration handling for existing configurations
- Full type safety throughout the component tree

## Benefits

1. **Better Visual Distinction**: Chip buttons stand out more than traditional links
2. **Improved UX**: More obvious clickable elements
3. **Customizable**: Full control over appearance and behavior
4. **Accessible**: Maintains proper ARIA attributes and keyboard navigation
5. **Flexible**: Works with existing hyperlink features (icons, positioning, etc.)

## Migration

Existing hyperlink configurations are automatically migrated to include the new styling options with sensible defaults:
- `showAsButton`: false (maintains existing behavior)
- `chipColor`: "#1976d2" (primary blue)
- `chipLabel`: "" (uses column value)
