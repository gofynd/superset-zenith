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
import BigNumberVis from '../BigNumberViz';
import { BigNumberVizProps } from '../types';

// Mock URL.createObjectURL
const mockCreateObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;

// Mock console.warn to avoid noise in tests
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('BigNumberVis Icon Feature', () => {
  const defaultProps: BigNumberVizProps = {
    width: 400,
    height: 200,
    bigNumber: 1234,
    headerFormatter: {
      id: 'test-formatter',
      label: 'Test Formatter',
      description: 'Test formatter for testing',
      formatFunc: (value: any) => value.toString(),
      useNumberFormat: false,
    },
    headerFontSize: 0.4,
    subheader: 'Test Metric',
    subheaderFontSize: 0.15,
    refs: {},
  };

  beforeEach(() => {
    mockCreateObjectURL.mockClear();
    mockConsoleWarn.mockClear();
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
  });

  describe('Icon Rendering', () => {
    it('should not render icon when showIcon is false', () => {
      render(<BigNumberVis {...defaultProps} showIcon={false} />);
      expect(screen.queryByTestId('big-number-icon')).not.toBeInTheDocument();
    });

    it('should not render icon when showIcon is true but iconUrl is empty', () => {
      render(<BigNumberVis {...defaultProps} showIcon={true} iconUrl="" />);
      expect(screen.queryByTestId('big-number-icon')).not.toBeInTheDocument();
    });

    it('should render icon when showIcon is true and iconUrl is provided', () => {
      render(
        <BigNumberVis
          {...defaultProps}
          showIcon={true}
          iconUrl="https://example.com/icon.png"
        />
      );
      const icon = screen.getByTestId('big-number-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveStyle({
        position: 'absolute',
        right: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
      });
    });

    it('should render icon with correct size', () => {
      const { rerender } = render(
        <BigNumberVis
          {...defaultProps}
          showIcon={true}
          iconUrl="https://example.com/icon.png"
          iconSize="small"
        />
      );
      
      let icon = screen.getByTestId('big-number-icon');
      expect(icon).toHaveStyle({ width: '24px', height: '24px' });

      rerender(
        <BigNumberVis
          {...defaultProps}
          showIcon={true}
          iconUrl="https://example.com/icon.png"
          iconSize="large"
        />
      );
      
      icon = screen.getByTestId('big-number-icon');
      expect(icon).toHaveStyle({ width: '40px', height: '40px' });
    });

    it('should render icon with default size when iconSize is not provided', () => {
      render(
        <BigNumberVis
          {...defaultProps}
          showIcon={true}
          iconUrl="https://example.com/icon.png"
        />
      );
      const icon = screen.getByTestId('big-number-icon');
      expect(icon).toHaveStyle({ width: '32px', height: '32px' });
    });
  });

  describe('Icon Error Handling', () => {
    it('should show error state when image fails to load', async () => {
      render(
        <BigNumberVis
          {...defaultProps}
          showIcon={true}
          iconUrl="https://example.com/invalid-image.png"
        />
      );
      
      const img = screen.getByAltText('Metric Icon');
      fireEvent.error(img);
      
      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument();
        expect(screen.getByText('Invalid')).toBeInTheDocument();
        expect(screen.getByText('Image')).toBeInTheDocument();
      });
    });

    it('should show "Too Small" warning for images smaller than 16x16', async () => {
      render(
        <BigNumberVis
          {...defaultProps}
          showIcon={true}
          iconUrl="https://example.com/tiny-image.png"
        />
      );
      
      const img = screen.getByAltText('Metric Icon');
      // Mock naturalWidth and naturalHeight
      Object.defineProperty(img, 'naturalWidth', { value: 8 });
      Object.defineProperty(img, 'naturalHeight', { value: 8 });
      
      fireEvent.load(img);
      
      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument();
        expect(screen.getByText('Too')).toBeInTheDocument();
        expect(screen.getByText('Small')).toBeInTheDocument();
      });
    });

    it('should show "Too Large" warning for images larger than 512x512', async () => {
      render(
        <BigNumberVis
          {...defaultProps}
          showIcon={true}
          iconUrl="https://example.com/huge-image.png"
        />
      );
      
      const img = screen.getByAltText('Metric Icon');
      // Mock naturalWidth and naturalHeight
      Object.defineProperty(img, 'naturalWidth', { value: 1024 });
      Object.defineProperty(img, 'naturalHeight', { value: 1024 });
      
      fireEvent.load(img);
      
      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument();
        expect(screen.getByText('Too')).toBeInTheDocument();
        expect(screen.getByText('Large')).toBeInTheDocument();
      });
    });

    it('should render normally for images within valid dimensions', async () => {
      render(
        <BigNumberVis
          {...defaultProps}
          showIcon={true}
          iconUrl="https://example.com/valid-image.png"
        />
      );
      
      const img = screen.getByAltText('Metric Icon');
      // Mock naturalWidth and naturalHeight
      Object.defineProperty(img, 'naturalWidth', { value: 32 });
      Object.defineProperty(img, 'naturalHeight', { value: 32 });
      
      fireEvent.load(img);
      
      await waitFor(() => {
        expect(screen.queryByText('⚠️')).not.toBeInTheDocument();
        expect(img).toBeInTheDocument();
      });
    });
  });

  describe('Icon with Trendline', () => {
    it('should render icon when showTrendLine is true', () => {
      render(
        <BigNumberVis
          {...defaultProps}
          showIcon={true}
          iconUrl="https://example.com/icon.png"
          showTrendLine={true}
          trendLineData={[[1, 100], [2, 200], [3, 150]]}
        />
      );
      
      const icon = screen.getByTestId('big-number-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Icon Styling', () => {
    it('should apply correct CSS classes and styles', () => {
      render(
        <BigNumberVis
          {...defaultProps}
          showIcon={true}
          iconUrl="https://example.com/icon.png"
        />
      );
      
      const icon = screen.getByTestId('big-number-icon');
      expect(icon).toHaveClass('big-number-icon');
      expect(icon).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        padding: '4px',
      });
    });

    it('should apply correct image styles', () => {
      render(
        <BigNumberVis
          {...defaultProps}
          showIcon={true}
          iconUrl="https://example.com/icon.png"
        />
      );
      
      const img = screen.getByAltText('Metric Icon');
      expect(img).toHaveStyle({
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for the icon image', () => {
      render(
        <BigNumberVis
          {...defaultProps}
          showIcon={true}
          iconUrl="https://example.com/icon.png"
        />
      );
      
      const img = screen.getByAltText('Metric Icon');
      expect(img).toBeInTheDocument();
    });
  });
});
