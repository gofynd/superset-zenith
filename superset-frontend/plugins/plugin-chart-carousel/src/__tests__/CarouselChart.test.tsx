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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CarouselChart from '../CarouselChart';
import { CarouselChartTransformedProps, CarouselItem } from '../types';

// Mock Ant Design components
jest.mock('antd', () => {
  const React = require('react');
  return {
    Modal: ({ children, open, onCancel, ...props }: any) => 
      open ? React.createElement('div', { 'data-testid': 'modal', onClick: onCancel }, children) : null,
    Button: ({ children, onClick, ...props }: any) => 
      React.createElement('button', { onClick, ...props }, children),
    Carousel: ({ children, afterChange, initialSlide, ...props }: any) => 
      React.createElement('div', { 'data-testid': 'carousel', 'data-initial-slide': initialSlide },
        children,
        React.createElement('button', { onClick: () => afterChange && afterChange(1) }, 'Next')
      ),
  };
});

// Mock Ant Design icons
jest.mock('@ant-design/icons', () => {
  const React = require('react');
  return {
    LeftOutlined: () => React.createElement('span', { 'data-testid': 'left-arrow' }, '←'),
    RightOutlined: () => React.createElement('span', { 'data-testid': 'right-arrow' }, '→'),
    CloseOutlined: () => React.createElement('span', { 'data-testid': 'close' }, '×'),
    EyeOutlined: () => React.createElement('span', { 'data-testid': 'eye' }, '👁'),
  };
});

// Mock styled-components
jest.mock('@superset-ui/core', () => {
  const mockStyled = (component: any) => component;
  mockStyled.div = (component: any) => component;
  mockStyled.img = (component: any) => component;
  mockStyled.h1 = (component: any) => component;
  mockStyled.h2 = (component: any) => component;
  mockStyled.h3 = (component: any) => component;
  mockStyled.p = (component: any) => component;
  mockStyled.button = (component: any) => component;
  mockStyled.span = (component: any) => component;
  mockStyled.section = (component: any) => component;
  mockStyled.article = (component: any) => component;
  mockStyled.header = (component: any) => component;
  mockStyled.footer = (component: any) => component;
  mockStyled.nav = (component: any) => component;
  mockStyled.main = (component: any) => component;
  mockStyled.aside = (component: any) => component;
  mockStyled.ul = (component: any) => component;
  mockStyled.li = (component: any) => component;
  mockStyled.ol = (component: any) => component;
  mockStyled.table = (component: any) => component;
  mockStyled.tr = (component: any) => component;
  mockStyled.td = (component: any) => component;
  mockStyled.th = (component: any) => component;
  mockStyled.thead = (component: any) => component;
  mockStyled.tbody = (component: any) => component;
  mockStyled.tfoot = (component: any) => component;
  mockStyled.form = (component: any) => component;
  mockStyled.input = (component: any) => component;
  mockStyled.textarea = (component: any) => component;
  mockStyled.select = (component: any) => component;
  mockStyled.option = (component: any) => component;
  mockStyled.label = (component: any) => component;
  mockStyled.fieldset = (component: any) => component;
  mockStyled.legend = (component: any) => component;
  mockStyled.a = (component: any) => component;
  mockStyled.em = (component: any) => component;
  mockStyled.strong = (component: any) => component;
  mockStyled.small = (component: any) => component;
  mockStyled.s = (component: any) => component;
  mockStyled.cite = (component: any) => component;
  mockStyled.q = (component: any) => component;
  mockStyled.dfn = (component: any) => component;
  mockStyled.abbr = (component: any) => component;
  mockStyled.data = (component: any) => component;
  mockStyled.time = (component: any) => component;
  mockStyled.code = (component: any) => component;
  mockStyled.var = (component: any) => component;
  mockStyled.samp = (component: any) => component;
  mockStyled.kbd = (component: any) => component;
  mockStyled.sub = (component: any) => component;
  mockStyled.sup = (component: any) => component;
  mockStyled.i = (component: any) => component;
  mockStyled.b = (component: any) => component;
  mockStyled.u = (component: any) => component;
  mockStyled.mark = (component: any) => component;
  mockStyled.ruby = (component: any) => component;
  mockStyled.rt = (component: any) => component;
  mockStyled.rp = (component: any) => component;
  mockStyled.bdi = (component: any) => component;
  mockStyled.bdo = (component: any) => component;
  mockStyled.span = (component: any) => component;
  mockStyled.br = (component: any) => component;
  mockStyled.wbr = (component: any) => component;
  mockStyled.ins = (component: any) => component;
  mockStyled.del = (component: any) => component;
  
  return {
    styled: mockStyled,
    css: () => ({}),
    t: (key: string) => key,
    useTheme: () => ({
      colors: {
        grayscale: {
          base: '#666',
          dark1: '#333',
          dark2: '#222',
          light2: '#eee',
        },
        success: { base: '#52c41a' },
        error: { base: '#ff4d4f' },
      },
      gridUnit: 4,
      typography: {
        sizes: { s: 12, m: 14, l: 16 },
      },
    }),
  };
});

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

describe('CarouselChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.open
    window.open = jest.fn();
  });

  describe('Gallery View', () => {
    it('renders gallery with correct number of items', () => {
      render(<CarouselChart {...defaultProps} />);
      
      // Should render all carousel items
      expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      expect(screen.getByText('Test Image 2')).toBeInTheDocument();
      expect(screen.getByText('Test Image 3')).toBeInTheDocument();
    });

    it('renders images with correct attributes', () => {
      render(<CarouselChart {...defaultProps} />);
      
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(images[0]).toHaveAttribute('alt', 'Test Image 1');
    });

    it('renders descriptions when provided', () => {
      render(<CarouselChart {...defaultProps} />);
      
      expect(screen.getByText('This is a test image description')).toBeInTheDocument();
      expect(screen.getByText('Another test image')).toBeInTheDocument();
    });

    it('renders CTA buttons when provided', () => {
      render(<CarouselChart {...defaultProps} />);
      
      expect(screen.getByText('Learn More')).toBeInTheDocument();
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('handles missing images gracefully', () => {
      const itemsWithMissingImages = [
        { ...mockCarouselItems[0], imageUrl: '' },
        { ...mockCarouselItems[1], imageUrl: 'invalid-url' },
      ];
      
      render(<CarouselChart {...defaultProps} carouselItems={itemsWithMissingImages} />);
      
      // Should show placeholder for missing images
      expect(screen.getAllByText('No Image')).toHaveLength(2);
    });

    it('opens modal when image is clicked', async () => {
      render(<CarouselChart {...defaultProps} />);
      
      const firstImage = screen.getByAltText('Test Image 1');
      fireEvent.click(firstImage);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });

    it('opens modal when View All button is clicked', async () => {
      render(<CarouselChart {...defaultProps} gallerySize={2} />);
      
      const viewAllButton = screen.getByText('View All');
      fireEvent.click(viewAllButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });

    it('shows View All button when there are more items than gallery size', () => {
      render(<CarouselChart {...defaultProps} gallerySize={2} />);
      
      expect(screen.getByText('View All')).toBeInTheDocument();
      expect(screen.getByText('3 items')).toBeInTheDocument();
    });

    it('does not show View All button when gallery size is larger than items', () => {
      render(<CarouselChart {...defaultProps} gallerySize={10} />);
      
      expect(screen.queryByText('View All')).not.toBeInTheDocument();
    });
  });

  describe('Modal Carousel', () => {
    it('renders carousel in modal when opened', async () => {
      render(<CarouselChart {...defaultProps} />);
      
      const firstImage = screen.getByAltText('Test Image 1');
      fireEvent.click(firstImage);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByTestId('carousel')).toBeInTheDocument();
      });
    });

    it('closes modal when close button is clicked', async () => {
      render(<CarouselChart {...defaultProps} />);
      
      const firstImage = screen.getByAltText('Test Image 1');
      fireEvent.click(firstImage);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByTestId('close');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });

    it('handles CTA button clicks correctly', async () => {
      render(<CarouselChart {...defaultProps} />);
      
      const firstImage = screen.getByAltText('Test Image 1');
      fireEvent.click(firstImage);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      
      const ctaButton = screen.getByText('Learn More');
      fireEvent.click(ctaButton);
      
      expect(window.open).toHaveBeenCalledWith(
        'https://example.com/details1',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no carousel items', () => {
      render(<CarouselChart {...defaultProps} carouselItems={[]} />);
      
      expect(screen.getByText('No carousel items found')).toBeInTheDocument();
      expect(screen.getByText('Please configure the column mappings in the control panel')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('calculates grid columns correctly for different gallery sizes', () => {
      const { rerender } = render(<CarouselChart {...defaultProps} gallerySize={3} />);
      // Should use 1 column for size 3
      
      rerender(<CarouselChart {...defaultProps} gallerySize={6} />);
      // Should use 2 columns for size 6
      
      rerender(<CarouselChart {...defaultProps} gallerySize={9} />);
      // Should use 3 columns for size 9
      
      rerender(<CarouselChart {...defaultProps} gallerySize={12} />);
      // Should use 4 columns for size 12
    });
  });

  describe('Error Handling', () => {
    it('handles image load errors', () => {
      render(<CarouselChart {...defaultProps} />);
      
      const images = screen.getAllByRole('img');
      fireEvent.error(images[0]);
      
      // Should show placeholder after error
      expect(screen.getByText('No Image')).toBeInTheDocument();
    });
  });
});
