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

// Mock console.warn
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('Icon Integration Tests', () => {
  const baseProps: BigNumberVizProps = {
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

  describe('Complete Icon Workflow', () => {
    it('should render complete icon workflow with URL', () => {
      render(
        <BigNumberVis
          {...baseProps}
          showIcon={true}
          iconType="url"
          iconUrl="https://example.com/icon.png"
          iconSize="medium"
        />
      );

      // Check that the icon container is rendered
      const iconContainer = screen.getByTestId('big-number-icon');
      expect(iconContainer).toBeInTheDocument();

      // Check that the image is rendered with correct attributes
      const img = screen.getByAltText('Metric Icon');
      expect(img).toHaveAttribute('src', 'https://example.com/icon.png');

      // Check styling
      expect(iconContainer).toHaveStyle({
        width: '32px',
        height: '32px',
        position: 'absolute',
        right: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
      });
    });

    it('should handle icon with trendline', () => {
      render(
        <BigNumberVis
          {...baseProps}
          showIcon={true}
          iconType="url"
          iconUrl="https://example.com/icon.png"
          iconSize="large"
          showTrendLine={true}
          trendLineData={[[1, 100], [2, 200], [3, 150]]}
        />
      );

      const iconContainer = screen.getByTestId('big-number-icon');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveStyle({
        width: '40px',
        height: '40px',
      });
    });

    it('should handle different icon sizes', () => {
      const sizes = [
        { size: 'small', expected: '24px' },
        { size: 'medium', expected: '32px' },
        { size: 'large', expected: '40px' },
        { size: 'xlarge', expected: '48px' },
      ];

      sizes.forEach(({ size, expected }) => {
        const { unmount } = render(
          <BigNumberVis
            {...baseProps}
            showIcon={true}
            iconType="url"
            iconUrl="https://example.com/icon.png"
            iconSize={size as any}
          />
        );

        const iconContainer = screen.getByTestId('big-number-icon');
        expect(iconContainer).toHaveStyle({
          width: expected,
          height: expected,
        });

        unmount();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle image load error gracefully', async () => {
      render(
        <BigNumberVis
          {...baseProps}
          showIcon={true}
          iconType="url"
          iconUrl="https://example.com/broken-image.png"
          iconSize="medium"
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

    it('should handle dimension validation errors', async () => {
      render(
        <BigNumberVis
          {...baseProps}
          showIcon={true}
          iconType="url"
          iconUrl="https://example.com/tiny-image.png"
          iconSize="medium"
        />
      );

      const img = screen.getByAltText('Metric Icon');
      Object.defineProperty(img, 'naturalWidth', { value: 8 });
      Object.defineProperty(img, 'naturalHeight', { value: 8 });
      
      fireEvent.load(img);

      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument();
        expect(screen.getByText('Too')).toBeInTheDocument();
        expect(screen.getByText('Small')).toBeInTheDocument();
      });
    });

    it('should handle oversized image errors', async () => {
      render(
        <BigNumberVis
          {...baseProps}
          showIcon={true}
          iconType="url"
          iconUrl="https://example.com/huge-image.png"
          iconSize="medium"
        />
      );

      const img = screen.getByAltText('Metric Icon');
      Object.defineProperty(img, 'naturalWidth', { value: 1024 });
      Object.defineProperty(img, 'naturalHeight', { value: 1024 });
      
      fireEvent.load(img);

      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument();
        expect(screen.getByText('Too')).toBeInTheDocument();
        expect(screen.getByText('Large')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility with icon', () => {
      render(
        <BigNumberVis
          {...baseProps}
          showIcon={true}
          iconType="url"
          iconUrl="https://example.com/icon.png"
          iconSize="medium"
        />
      );

      // Check that the main content is still accessible
      expect(screen.getByText('1234')).toBeInTheDocument();
      expect(screen.getByText('Test Metric')).toBeInTheDocument();

      // Check that the icon has proper alt text
      const img = screen.getByAltText('Metric Icon');
      expect(img).toBeInTheDocument();
    });

    it('should work with clickable card feature', () => {
      render(
        <BigNumberVis
          {...baseProps}
          showIcon={true}
          iconType="url"
          iconUrl="https://example.com/icon.png"
          iconSize="medium"
          enableClickableCard={true}
          redirectUrl="https://example.com/dashboard"
        />
      );

      const container = screen.getByRole('button');
      expect(container).toBeInTheDocument();
      
      // Icon should still be present
      const iconContainer = screen.getByTestId('big-number-icon');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    it('should not render icon when showIcon is false', () => {
      render(
        <BigNumberVis
          {...baseProps}
          showIcon={false}
          iconType="url"
          iconUrl="https://example.com/icon.png"
          iconSize="medium"
        />
      );

      expect(screen.queryByTestId('big-number-icon')).not.toBeInTheDocument();
    });

    it('should not render icon when iconUrl is empty', () => {
      render(
        <BigNumberVis
          {...baseProps}
          showIcon={true}
          iconType="url"
          iconUrl=""
          iconSize="medium"
        />
      );

      expect(screen.queryByTestId('big-number-icon')).not.toBeInTheDocument();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(
        <BigNumberVis
          {...baseProps}
          showIcon={false}
        />
      );

      expect(screen.queryByTestId('big-number-icon')).not.toBeInTheDocument();

      rerender(
        <BigNumberVis
          {...baseProps}
          showIcon={true}
          iconType="url"
          iconUrl="https://example.com/icon.png"
          iconSize="medium"
        />
      );

      expect(screen.getByTestId('big-number-icon')).toBeInTheDocument();

      rerender(
        <BigNumberVis
          {...baseProps}
          showIcon={false}
        />
      );

      expect(screen.queryByTestId('big-number-icon')).not.toBeInTheDocument();
    });
  });

  describe('CSS Integration', () => {
    it('should apply correct CSS classes and styles', () => {
      render(
        <BigNumberVis
          {...baseProps}
          showIcon={true}
          iconType="url"
          iconUrl="https://example.com/icon.png"
          iconSize="medium"
        />
      );

      const iconContainer = screen.getByTestId('big-number-icon');
      expect(iconContainer).toHaveClass('big-number-icon');
      expect(iconContainer).toHaveStyle({
        position: 'absolute',
        right: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        padding: '4px',
      });

      const img = screen.getByAltText('Metric Icon');
      expect(img).toHaveStyle({
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      });
    });
  });
});
