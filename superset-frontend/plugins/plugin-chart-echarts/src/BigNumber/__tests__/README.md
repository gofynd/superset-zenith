# BigNumber Icon Feature Test Suite

This directory contains comprehensive test cases for the BigNumber icon feature implementation.

## Test Files Overview

### 1. `BigNumberIcon.test.tsx`
**Purpose**: Tests the core icon rendering functionality in the BigNumberViz component.

**Coverage**:
- Icon rendering with different configurations
- Icon sizing (small, medium, large, xlarge)
- Error handling for failed image loads
- Image dimension validation
- CSS styling and positioning
- Accessibility features

**Key Test Cases**:
- ✅ Icon renders when `showIcon=true` and `iconUrl` is provided
- ✅ Icon doesn't render when `showIcon=false`
- ✅ Icon doesn't render when `iconUrl` is empty
- ✅ Correct sizing based on `iconSize` prop
- ✅ Error state display for invalid images
- ✅ Dimension validation (too small/large images)
- ✅ Proper CSS classes and styles applied

### 2. `IconValidation.test.ts`
**Purpose**: Tests the validation logic for file uploads and URL inputs.

**Coverage**:
- File type validation (PNG, JPG, JPEG, SVG, GIF, WebP)
- File size validation (1KB - 2MB range)
- URL format validation
- URL protocol validation (HTTP/HTTPS only)
- Image extension validation

**Key Test Cases**:
- ✅ Valid file types are accepted
- ✅ Invalid file types are rejected with proper error messages
- ✅ Files within size limits are accepted
- ✅ Files outside size limits are rejected
- ✅ Valid URLs with image extensions are accepted
- ✅ Invalid URLs are rejected
- ✅ Non-HTTP/HTTPS URLs are rejected

### 3. `TransformProps.test.ts`
**Purpose**: Tests the data transformation logic in all BigNumber variants.

**Coverage**:
- BigNumberTotal transformProps
- BigNumberWithTrendline transformProps
- BigNumberPeriodOverPeriod transformProps
- File upload handling and URL creation
- Validation in transform layer
- Backward compatibility

**Key Test Cases**:
- ✅ Icon properties are correctly passed through
- ✅ File uploads are converted to blob URLs
- ✅ Invalid files are handled gracefully
- ✅ URL validation works in transform layer
- ✅ Backward compatibility maintained
- ✅ All BigNumber variants support icons

### 4. `IconIntegration.test.tsx`
**Purpose**: Tests the complete integration of the icon feature.

**Coverage**:
- End-to-end icon workflow
- Integration with other features (trendline, clickable cards)
- Performance considerations
- CSS integration
- Accessibility integration

**Key Test Cases**:
- ✅ Complete icon workflow with URL
- ✅ Icon works with trendline charts
- ✅ Icon works with clickable card feature
- ✅ Different icon sizes render correctly
- ✅ Error handling works end-to-end
- ✅ Performance optimizations work
- ✅ CSS styling is properly applied

### 5. `ControlPanel.test.ts`
**Purpose**: Tests the control panel integration and configuration.

**Coverage**:
- Control panel structure
- Control visibility logic
- Control dependencies
- Shared controls configuration
- All BigNumber variants

**Key Test Cases**:
- ✅ Icon controls are included in all control panels
- ✅ Control visibility logic works correctly
- ✅ Control dependencies are properly configured
- ✅ Shared controls have correct configuration
- ✅ Control order is logical and user-friendly

## Running Tests

### Run All Icon Tests
```bash
cd superset-frontend
npm test -- --testPathPattern="BigNumber/__tests__" --verbose
```

### Run Specific Test File
```bash
cd superset-frontend
npm test -- --testPathPattern="BigNumberIcon.test.tsx" --verbose
```

### Run with Coverage
```bash
cd superset-frontend
npm test -- --testPathPattern="BigNumber/__tests__" --coverage --collectCoverageFrom="src/BigNumber/**/*.{ts,tsx}"
```

### Run Test Suite Script
```bash
cd superset-frontend/plugins/plugin-chart-echarts/src/BigNumber/__tests__
node run-icon-tests.js
```

## Test Coverage

The test suite provides comprehensive coverage for:

### ✅ **Functionality Coverage**
- Icon rendering and display
- File upload handling
- URL validation
- Error handling and user feedback
- Size and dimension validation
- CSS styling and positioning

### ✅ **Integration Coverage**
- Control panel integration
- TransformProps integration
- Component integration
- Feature interaction (trendline, clickable cards)

### ✅ **Validation Coverage**
- File type validation
- File size validation
- URL format validation
- Image dimension validation
- Error state handling

### ✅ **Compatibility Coverage**
- Backward compatibility
- Cross-browser compatibility
- Accessibility compliance
- Performance optimization

### ✅ **Edge Cases Coverage**
- Invalid inputs
- Network errors
- File upload errors
- Missing properties
- Rapid prop changes

## Test Data

### Valid Test Files
- `test.png` (32x32, 50KB, image/png)
- `test.jpg` (64x64, 75KB, image/jpeg)
- `test.svg` (vector, 25KB, image/svg+xml)
- `test.gif` (48x48, 100KB, image/gif)

### Invalid Test Files
- `test.txt` (text/plain) - Wrong MIME type
- `huge.png` (1024x1024, 3MB) - Too large
- `tiny.png` (8x8, 500B) - Too small
- `corrupt.png` (32x32, 50KB) - Corrupted data

### Test URLs
- Valid: `https://example.com/icon.png`
- Invalid: `ftp://example.com/icon.png`
- Malformed: `not-a-url`
- Non-image: `https://example.com/page.html`

## Assertions

Each test file includes specific assertions for:

1. **Rendering**: Components render correctly
2. **Props**: Props are passed and used correctly
3. **Validation**: Validation logic works as expected
4. **Error Handling**: Errors are handled gracefully
5. **Styling**: CSS is applied correctly
6. **Accessibility**: Accessibility features work
7. **Performance**: Performance optimizations work

## Mocking

The tests use appropriate mocks for:
- `URL.createObjectURL` for file upload testing
- `console.warn` to avoid test noise
- File objects for upload testing
- Image loading events for error testing

## Continuous Integration

These tests are designed to run in CI/CD pipelines and provide:
- Fast execution (< 30 seconds total)
- Reliable results across environments
- Clear failure reporting
- Comprehensive coverage reporting

## Maintenance

To maintain the test suite:
1. Update tests when adding new features
2. Add new test cases for edge cases
3. Update mocks when dependencies change
4. Keep test data current and relevant
5. Monitor test performance and optimize as needed
