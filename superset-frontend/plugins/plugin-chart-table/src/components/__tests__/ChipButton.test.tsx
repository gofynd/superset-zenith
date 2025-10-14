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
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@superset-ui/core';
import ChipButton from '../ChipButton';

const mockTheme = {
  colors: {
    primary: {
      base: '#1976d2',
      dark1: '#1565c0',
      light2: '#bbdefb',
    },
    grayscale: {
      light5: '#fafafa',
    },
  },
  typography: {
    sizes: {
      s: 12,
    },
    weights: {
      normal: 400,
    },
  },
  gridUnit: 4,
  borderRadius: 4,
  transitionTiming: 0.2,
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('ChipButton', () => {
  it('renders with correct href and label', () => {
    renderWithTheme(
      <ChipButton
        href="https://example.com"
        label="Test Button"
      />
    );

    const button = screen.getByRole('link');
    expect(button).toHaveAttribute('href', 'https://example.com');
    expect(button).toHaveTextContent('Test Button');
  });

  it('renders with custom color', () => {
    renderWithTheme(
      <ChipButton
        href="https://example.com"
        label="Test Button"
        color="#ff0000"
      />
    );

    const button = screen.getByRole('link');
    // Check that the color is applied (it might be in a different format)
    expect(button).toHaveStyle({ backgroundColor: expect.stringContaining('255, 0, 0') });
  });

  it('renders with icon when showIcon is true', () => {
    renderWithTheme(
      <ChipButton
        href="https://example.com"
        label="Test Button"
        showIcon={true}
      />
    );

    const icon = screen.getByRole('link').querySelector('.chip-icon');
    expect(icon).toBeInTheDocument();
  });

  it('renders icon on left when iconPosition is left', () => {
    renderWithTheme(
      <ChipButton
        href="https://example.com"
        label="Test Button"
        showIcon={true}
        iconPosition="left"
      />
    );

    const button = screen.getByRole('link');
    const icon = button.querySelector('.chip-icon');
    expect(icon).toBeInTheDocument();
    expect(button.firstChild).toBe(icon);
  });

  it('calls onClick handler when provided', () => {
    const handleClick = jest.fn();
    renderWithTheme(
      <ChipButton
        href="https://example.com"
        label="Test Button"
        onClick={handleClick}
      />
    );

    const button = screen.getByRole('link');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('opens link in new tab by default', () => {
    renderWithTheme(
      <ChipButton
        href="https://example.com"
        label="Test Button"
      />
    );

    const button = screen.getByRole('link');
    expect(button).toHaveAttribute('target', '_blank');
    expect(button).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
