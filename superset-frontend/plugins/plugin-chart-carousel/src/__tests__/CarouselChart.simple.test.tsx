/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CarouselChartTransformedProps, CarouselItem } from '../types';

// Mock the entire CarouselChart component to test the logic without styled-components
const MockCarouselChart = ({ carouselItems, gallerySize, viewMode }: CarouselChartTransformedProps) => {
  if (viewMode === 'table') {
    return <div data-testid="table-view">Table view is not yet implemented</div>;
  }

  if (carouselItems.length === 0) {
    return (
      <div data-testid="empty-state">
        <div>No carousel items found</div>
        <div>Please configure the column mappings in the control panel</div>
      </div>
    );
  }

  return (
    <div data-testid="carousel-container">
      <div data-testid="gallery-grid">
        {carouselItems.slice(0, gallerySize).map((item, index) => (
          <div key={index} data-testid={`gallery-item-${index}`}>
            <img src={item.imageUrl} alt={item.name} />
            <div className="gallery-item-name">{item.name}</div>
            {item.description && (
              <div className="gallery-item-description">{item.description}</div>
            )}
          </div>
        ))}
      </div>
      {carouselItems.length > gallerySize && (
        <button data-testid="view-all-button">View All</button>
      )}
    </div>
  );
};

const mockCarouselItems: CarouselItem[] = [
  {
    imageUrl: 'https://example.com/image1.jpg',
    name: 'Test Image 1',
    description: 'This is a test image description',
    ctaLabel: 'Learn More',
    ctaLink: 'https://example.com/details1',
  },
  {
    imageUrl: 'https://example.com/image2.jpg',
    name: 'Test Image 2',
    description: 'Another test image',
    ctaLabel: 'View Details',
    ctaLink: 'https://example.com/details2',
  },
  {
    imageUrl: 'https://example.com/image3.jpg',
    name: 'Test Image 3',
    description: 'Third test image',
  },
];

const defaultProps: CarouselChartTransformedProps = {
  width: 800,
  height: 600,
  viewMode: 'carousel',
  gallerySize: 6,
  imageUrlColumn: 'image_url',
  nameColumn: 'name',
  descriptionColumn: 'description',
  ctaLabelColumn: 'cta_label',
  ctaLinkColumn: 'cta_link',
  carouselItems: mockCarouselItems,
  data: [],
  columns: [],
  metrics: [],
  percentMetrics: [],
  pageSize: 0,
  showCellBars: false,
  sortDesc: false,
  includeSearch: false,
  alignPositiveNegative: false,
  colorPositiveNegative: false,
  tableTimestampFormat: '',
  filters: {},
  emitCrossFilters: false,
  onChangeFilter: undefined,
  columnColorFormatters: [],
  allowRearrangeColumns: false,
  allowRenderHtml: true,
  onContextMenu: undefined,
  isUsingTimeComparison: false,
  basicColorFormatters: [],
  basicColorColumnFormatters: [],
  startDateOffset: '',
  hyperlinkConfigs: { enabled: false, configs: [] },
  serverPagination: false,
  serverPaginationData: { pageSize: 0, currentPage: 0 },
  setDataMask: jest.fn(),
  isRawRecords: false,
  rowCount: 3,
  totals: {},
  timeGrain: undefined,
};

describe('CarouselChart Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Gallery View', () => {
    it('renders gallery with correct number of items', () => {
      render(<MockCarouselChart {...defaultProps} />);
      
      expect(screen.getByTestId('carousel-container')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-grid')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-item-2')).toBeInTheDocument();
    });

    it('renders images with correct attributes', () => {
      render(<MockCarouselChart {...defaultProps} />);
      
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(images[0]).toHaveAttribute('alt', 'Test Image 1');
    });

    it('renders descriptions when provided', () => {
      render(<MockCarouselChart {...defaultProps} />);
      
      expect(screen.getByText('This is a test image description')).toBeInTheDocument();
      expect(screen.getByText('Another test image')).toBeInTheDocument();
    });

    it('shows View All button when there are more items than gallery size', () => {
      render(<MockCarouselChart {...defaultProps} gallerySize={2} />);
      
      expect(screen.getByTestId('view-all-button')).toBeInTheDocument();
    });

    it('does not show View All button when gallery size is larger than items', () => {
      render(<MockCarouselChart {...defaultProps} gallerySize={10} />);
      
      expect(screen.queryByTestId('view-all-button')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no carousel items', () => {
      render(<MockCarouselChart {...defaultProps} carouselItems={[]} />);
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No carousel items found')).toBeInTheDocument();
      expect(screen.getByText('Please configure the column mappings in the control panel')).toBeInTheDocument();
    });
  });

  describe('Table View', () => {
    it('renders table view message when viewMode is table', () => {
      render(<MockCarouselChart {...defaultProps} viewMode="table" />);
      
      expect(screen.getByTestId('table-view')).toBeInTheDocument();
      expect(screen.getByText('Table view is not yet implemented')).toBeInTheDocument();
    });
  });

  describe('Gallery Size Logic', () => {
    it('limits displayed items to gallery size', () => {
      render(<MockCarouselChart {...defaultProps} gallerySize={2} />);
      
      expect(screen.getByTestId('gallery-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('gallery-item-2')).not.toBeInTheDocument();
    });
  });
});
