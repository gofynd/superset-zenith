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
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@emotion/react';
import { BigNumberVizProps } from '../../src/BigNumber/types';
import BigNumberVis from '../../src/BigNumber/BigNumberViz';

// Mock theme for testing
const mockTheme = {
  typography: {
    families: {
      sansSerif: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    sizes: {
      s: 12,
      m: 14,
      l: 16,
    },
  },
  colors: {
    primary: {
      base: '#1fa8c9',
    },
    grayscale: {
      light5: '#f5f5f5',
    },
  },
  opacity: {
    mediumHeavy: 0.6,
  },
  gridUnit: 4,
  borderRadius: 4,
  transitionTiming: 0.2,
};

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('BigNumber Clickable Card Feature', () => {
  const defaultProps: BigNumberVizProps = {
    width: 400,
    height: 300,
    bigNumber: 12345,
    headerFormatter: (value: any) => value.toString(),
    headerFontSize: 0.4,
    subheaderFontSize: 0.15,
    subheader: 'Test Subheader',
    refs: {},
  };

  beforeEach(() => {
    mockWindowOpen.mockClear();
  });

  describe('Backward Compatibility - Single Column Queries', () => {
    it('should render normally when clickable card is disabled', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: false,
        redirectUrl: undefined,
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      expect(container).not.toHaveClass('clickable-card');
      expect(container).toHaveStyle({ cursor: 'default' });
    });

    it('should render normally when redirectUrl is not provided', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: true,
        redirectUrl: undefined,
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      expect(container).not.toHaveClass('clickable-card');
      expect(container).toHaveStyle({ cursor: 'default' });
    });

    it('should not be clickable when enableClickableCard is false', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: false,
        redirectUrl: 'https://example.com',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      expect(container).not.toHaveAttribute('role', 'button');
      expect(container).not.toHaveAttribute('tabindex');
    });
  });

  describe('Clickable Card Functionality', () => {
    it('should render as clickable when both enableClickableCard and redirectUrl are provided', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: true,
        redirectUrl: 'https://example.com',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      expect(container).toHaveClass('clickable-card');
      expect(container).toHaveStyle({ cursor: 'pointer' });
      expect(container).toHaveAttribute('role', 'button');
      expect(container).toHaveAttribute('tabindex', '0');
    });

    it('should open URL in new tab when clicked', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: true,
        redirectUrl: 'https://example.com/dashboard',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      fireEvent.click(container!);
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com/dashboard',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should handle keyboard navigation with Enter key', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: true,
        redirectUrl: 'https://example.com',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      fireEvent.keyDown(container!, { key: 'Enter' });
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should handle keyboard navigation with Space key', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: true,
        redirectUrl: 'https://example.com',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      fireEvent.keyDown(container!, { key: ' ' });
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should not open URL for other keys', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: true,
        redirectUrl: 'https://example.com',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      fireEvent.keyDown(container!, { key: 'Escape' });
      
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('should prevent default behavior for Enter and Space keys', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: true,
        redirectUrl: 'https://example.com',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      
      const preventDefaultSpy = jest.spyOn(enterEvent, 'preventDefault');
      const preventDefaultSpy2 = jest.spyOn(spaceEvent, 'preventDefault');
      
      fireEvent.keyDown(container!, enterEvent);
      fireEvent.keyDown(container!, spaceEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(preventDefaultSpy2).toHaveBeenCalled();
    });
  });

  describe('URL Validation', () => {
    it('should handle empty string URL gracefully', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: true,
        redirectUrl: '',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      expect(container).not.toHaveClass('clickable-card');
      expect(container).toHaveStyle({ cursor: 'default' });
    });

    it('should handle null URL gracefully', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: true,
        redirectUrl: null as any,
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      expect(container).not.toHaveClass('clickable-card');
      expect(container).toHaveStyle({ cursor: 'default' });
    });

    it('should handle various URL formats', () => {
      const testUrls = [
        'https://example.com',
        'http://example.com',
        'https://subdomain.example.com/path',
        'https://example.com:8080/path?query=value',
        'https://example.com/path#fragment',
      ];

      testUrls.forEach(url => {
        const props = {
          ...defaultProps,
          enableClickableCard: true,
          redirectUrl: url,
        };

        const { unmount } = render(
          <ThemeProvider theme={mockTheme}>
            <BigNumberVis {...props} />
          </ThemeProvider>
        );
        
        const container = screen.getByText('12345').closest('div');
        fireEvent.click(container!);
        
        expect(mockWindowOpen).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer');
        
        unmount();
        mockWindowOpen.mockClear();
      });
    });
  });

  describe('Visual States', () => {
    it('should apply correct CSS classes for clickable state', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: true,
        redirectUrl: 'https://example.com',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      expect(container).toHaveClass('clickable-card');
    });

    it('should not apply clickable classes when disabled', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: false,
        redirectUrl: 'https://example.com',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      expect(container).not.toHaveClass('clickable-card');
    });
  });

  describe('Integration with Different Chart Types', () => {
    it('should work with trendline charts', () => {
      const props = {
        ...defaultProps,
        showTrendLine: true,
        enableClickableCard: true,
        redirectUrl: 'https://example.com',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      expect(container).toHaveClass('clickable-card');
      expect(container).toHaveStyle({ cursor: 'pointer' });
    });

    it('should work with fallback values', () => {
      const props = {
        ...defaultProps,
        bigNumber: null,
        bigNumberFallback: [1234567890, 54321],
        enableClickableCard: true,
        redirectUrl: 'https://example.com',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      // The component shows "0" when using fallback values, so we check for that
      const container = screen.getByText('0').closest('div');
      expect(container).toHaveClass('clickable-card');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes when clickable', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: true,
        redirectUrl: 'https://example.com',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      expect(container).toHaveAttribute('role', 'button');
      expect(container).toHaveAttribute('tabindex', '0');
    });

    it('should not have ARIA attributes when not clickable', () => {
      const props = {
        ...defaultProps,
        enableClickableCard: false,
        redirectUrl: 'https://example.com',
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <BigNumberVis {...props} />
        </ThemeProvider>
      );
      
      const container = screen.getByText('12345').closest('div');
      expect(container).not.toHaveAttribute('role', 'button');
      expect(container).not.toHaveAttribute('tabindex');
    });
  });
});
