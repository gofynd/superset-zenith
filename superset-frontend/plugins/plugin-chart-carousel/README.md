# Carousel Chart Plugin for Apache Superset

A carousel/gallery chart type for Apache Superset 4.1.3 that displays images in a grid layout with the ability to view them in a full-screen modal carousel.

## Features

### 1. Gallery View
- Displays images in a responsive grid layout
- Configurable number of images to display (3, 6, 9, or 12)
- Each image is clickable to open the carousel modal
- "View All" button to open the full carousel with all images

### 2. Modal Carousel
- Full-screen modal overlay
- Image slider with navigation (prev/next arrows, dots/indicators)
- For each image slide, displays:
  - **Name** (required)
  - **Description** (optional)
  - **CTA Button** with configurable label and link
- Smooth transitions between slides
- Close button to return to gallery view

### 3. Configuration Options
- **View Mode**: Toggle between Table View and Carousel View
- **Gallery Size**: Number of images to display in gallery view
- **Column Mapping**:
  - Image URL column
  - Name column
  - Description column (optional)
  - CTA button label column
  - CTA button link column

## Data Requirements

The chart expects the following columns in your dataset:
- `image_url` - URL to the image (required)
- `name` - Image title/name (required)
- `description` - Optional description text
- `cta_label` - Button text (e.g., "View Details")
- `cta_link` - URL for the button action

## Usage

1. Create a new chart in Superset
2. Select "Carousel" as the chart type
3. Configure your data source and column mappings
4. Set the gallery size and other display options
5. Save and view your carousel chart

## Technical Details

- Built with React and TypeScript
- Uses Ant Design components for UI elements
- Responsive design that works on desktop and mobile
- Includes error handling for missing images
- Lazy loading support for better performance
- Follows Superset's design system and conventions

## Installation

The plugin is already integrated into the Superset build. No additional installation steps are required.

## Development

To modify the carousel plugin:

1. Edit files in `superset-frontend/plugins/plugin-chart-carousel/src/`
2. Run `npm run build` to rebuild the frontend
3. Restart the Superset server to see changes

## Files Structure

```
src/
├── CarouselChart.tsx      # Main carousel component
├── controlPanel.tsx       # Chart configuration controls
├── transformProps.ts      # Data transformation logic
├── types.ts              # TypeScript type definitions
├── index.ts              # Plugin entry point
└── images/               # Thumbnail and example images
```

## License

Licensed under the Apache License, Version 2.0.
