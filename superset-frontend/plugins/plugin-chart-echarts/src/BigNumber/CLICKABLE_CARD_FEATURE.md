# Big Number Clickable Card Feature

## Overview
This feature allows Big Number charts to be clickable and redirect to a configurable URL. The feature supports both single-column (backward compatible) and two-column queries.

## Features
- **Configurable URL**: Users can specify which column contains the redirect URL
- **Backward Compatible**: Existing single-column queries continue to work without changes
- **Visual Feedback**: Hover effects and cursor changes indicate clickable cards
- **Accessibility**: Keyboard navigation support (Enter/Space keys)
- **All Chart Types**: Works with Big Number Total, Big Number with Trendline, and Period Over Period

## Usage

### Two-Column Query (New Feature)
```sql
SELECT 
  COUNT(*) as value,
  'https://example.com/dashboard' as redirect_url
FROM your_table
```

### Single-Column Query (Backward Compatible)
```sql
SELECT COUNT(*) as value
FROM your_table
```

## Configuration

### Control Panel Options
1. **Enable clickable card**: Checkbox to enable/disable the feature
2. **URL Column**: Dropdown to select which column contains the redirect URL
   - Only appears when "Enable clickable card" is checked
   - Dynamically populated with available columns from query results

### Example Configuration
- Enable clickable card: ✅
- URL Column: `redirect_url`
- Metric: `value`

## Implementation Details

### Data Flow
1. Query returns two columns: `value` and `redirect_url`
2. `transformProps` extracts the URL from the specified column
3. `BigNumberViz` component renders with click handlers
4. Click opens URL in new tab with security attributes

### Backward Compatibility
- Default values ensure existing charts work unchanged
- Feature only activates when explicitly enabled
- Single-column queries continue to work as before

### Security
- URLs open in new tab with `noopener,noreferrer` attributes
- Input validation ensures URL is a string before processing

## Testing

### Test Cases
1. **Single-column query**: Should work exactly as before
2. **Two-column query with clickable disabled**: Should work as before
3. **Two-column query with clickable enabled**: Should be clickable
4. **Invalid URL column**: Should not be clickable
5. **Empty URL**: Should not be clickable

### Example Test Data
```json
{
  "data": [
    {
      "value": 32,
      "redirect_url": "https://example.com/dashboard"
    }
  ],
  "colnames": ["value", "redirect_url"]
}
```

## CSS Classes
- `.clickable-card`: Applied when clickable feature is enabled
- Hover effects: Transform and shadow animations
- Focus states: Keyboard navigation outline
