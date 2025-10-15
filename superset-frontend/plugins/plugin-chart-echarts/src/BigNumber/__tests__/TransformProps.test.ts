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

import transformProps from '../BigNumberTotal/transformProps';
import transformPropsWithTrendline from '../BigNumberWithTrendline/transformProps';
import transformPropsPeriodOverPeriod from '../BigNumberPeriodOverPeriod/transformProps';

// Mock URL.createObjectURL
const mockCreateObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;

// Mock console.warn
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('TransformProps Icon Handling', () => {
  const baseChartProps = {
    width: 400,
    height: 200,
    queriesData: [{
      data: [{ value: 1234 }],
      colnames: ['value'],
      coltypes: ['INT'],
    }],
    formData: {
      metric: 'value',
      headerFontSize: 0.4,
      subheaderFontSize: 0.15,
      subheader: 'Test Metric',
    },
    rawFormData: {},
    hooks: {},
    datasource: {},
    theme: {},
  };

  beforeEach(() => {
    mockCreateObjectURL.mockClear();
    mockConsoleWarn.mockClear();
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
  });

  describe('BigNumberTotal TransformProps', () => {
    it('should handle icon properties with default values', () => {
      const result = transformProps(baseChartProps as any);
      
      expect(result.showIcon).toBe(false);
      expect(result.iconType).toBe('url');
      expect(result.iconUrl).toBe('');
      expect(result.iconSize).toBe('medium');
    });

    it('should handle showIcon true with URL', () => {
      const chartProps = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          showIcon: true,
          iconType: 'url',
          iconUrl: 'https://example.com/icon.png',
          iconSize: 'large',
        },
      };

      const result = transformProps(chartProps as any);
      
      expect(result.showIcon).toBe(true);
      expect(result.iconType).toBe('url');
      expect(result.iconUrl).toBe('https://example.com/icon.png');
      expect(result.iconSize).toBe('large');
    });

    it('should handle file upload and create object URL', () => {
      const mockFile = new File([''], 'test.png', { type: 'image/png', size: 50000 });
      const chartProps = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          showIcon: true,
          iconType: 'upload',
          iconUpload: mockFile,
          iconSize: 'small',
        },
      };

      mockCreateObjectURL.mockReturnValue('blob:mock-url');
      const result = transformProps(chartProps as any);
      
      expect(result.showIcon).toBe(true);
      expect(result.iconType).toBe('upload');
      expect(result.iconUrl).toBe('blob:mock-url');
      expect(result.iconSize).toBe('small');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile);
    });

    it('should validate file type and reject invalid files', () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain', size: 50000 });
      const chartProps = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          showIcon: true,
          iconType: 'upload',
          iconUpload: invalidFile,
        },
      };

      const result = transformProps(chartProps as any);
      
      expect(result.iconUrl).toBe('');
      expect(mockConsoleWarn).toHaveBeenCalledWith('Invalid file type for icon upload:', 'text/plain');
    });

    it('should validate file size and reject large files', () => {
      const largeFile = new File([''], 'test.png', { type: 'image/png', size: 3 * 1024 * 1024 });
      const chartProps = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          showIcon: true,
          iconType: 'upload',
          iconUpload: largeFile,
        },
      };

      const result = transformProps(chartProps as any);
      
      expect(result.iconUrl).toBe('');
      expect(mockConsoleWarn).toHaveBeenCalledWith('Icon file too large:', 3145728, 'bytes');
    });

    it('should validate file size and reject small files', () => {
      const smallFile = new File([''], 'test.png', { type: 'image/png', size: 500 });
      const chartProps = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          showIcon: true,
          iconType: 'upload',
          iconUpload: smallFile,
        },
      };

      const result = transformProps(chartProps as any);
      
      expect(result.iconUrl).toBe('');
      expect(mockConsoleWarn).toHaveBeenCalledWith('Icon file too small:', 500, 'bytes');
    });

    it('should validate URL format', () => {
      const chartProps = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          showIcon: true,
          iconType: 'url',
          iconUrl: 'invalid-url',
        },
      };

      const result = transformProps(chartProps as any);
      
      expect(result.iconUrl).toBe('');
      expect(mockConsoleWarn).toHaveBeenCalledWith('Invalid icon URL:', 'invalid-url');
    });

    it('should accept valid URL', () => {
      const chartProps = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          showIcon: true,
          iconType: 'url',
          iconUrl: 'https://example.com/icon.png',
        },
      };

      const result = transformProps(chartProps as any);
      
      expect(result.iconUrl).toBe('https://example.com/icon.png');
    });
  });

  describe('BigNumberWithTrendline TransformProps', () => {
    it('should handle icon properties with trendline', () => {
      const chartProps = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          showIcon: true,
          iconType: 'url',
          iconUrl: 'https://example.com/icon.png',
          iconSize: 'xlarge',
          colorPicker: { r: 255, g: 0, b: 0 },
        },
      };

      const result = transformPropsWithTrendline(chartProps as any);
      
      expect(result.showIcon).toBe(true);
      expect(result.iconType).toBe('url');
      expect(result.iconUrl).toBe('https://example.com/icon.png');
      expect(result.iconSize).toBe('xlarge');
    });

    it('should handle file upload with trendline', () => {
      const mockFile = new File([''], 'test.svg', { type: 'image/svg+xml', size: 100000 });
      const chartProps = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          showIcon: true,
          iconType: 'upload',
          iconUpload: mockFile,
          iconSize: 'medium',
          colorPicker: { r: 0, g: 255, b: 0 },
        },
      };

      mockCreateObjectURL.mockReturnValue('blob:trendline-url');
      const result = transformPropsWithTrendline(chartProps as any);
      
      expect(result.iconUrl).toBe('blob:trendline-url');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('BigNumberPeriodOverPeriod TransformProps', () => {
    it('should handle icon properties with period over period', () => {
      const chartProps = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          showIcon: true,
          iconType: 'url',
          iconUrl: 'https://example.com/icon.png',
          iconSize: 'small',
        },
        rawFormData: {
          time_compare: ['1 year'],
        },
      };

      const result = transformPropsPeriodOverPeriod(chartProps as any);
      
      expect(result.showIcon).toBe(true);
      expect(result.iconType).toBe('url');
      expect(result.iconUrl).toBe('https://example.com/icon.png');
      expect(result.iconSize).toBe('small');
    });

    it('should handle file upload with period over period', () => {
      const mockFile = new File([''], 'test.gif', { type: 'image/gif', size: 75000 });
      const chartProps = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          showIcon: true,
          iconType: 'upload',
          iconUpload: mockFile,
          iconSize: 'large',
        },
        rawFormData: {
          time_compare: ['1 month'],
        },
      };

      mockCreateObjectURL.mockReturnValue('blob:pop-url');
      const result = transformPropsPeriodOverPeriod(chartProps as any);
      
      expect(result.iconUrl).toBe('blob:pop-url');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('Backward Compatibility', () => {
    it('should work without icon properties (backward compatibility)', () => {
      const result = transformProps(baseChartProps as any);
      
      expect(result.showIcon).toBe(false);
      expect(result.iconType).toBe('url');
      expect(result.iconUrl).toBe('');
      expect(result.iconSize).toBe('medium');
    });

    it('should work with partial icon properties', () => {
      const chartProps = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          showIcon: true,
          // Missing other icon properties
        },
      };

      const result = transformProps(chartProps as any);
      
      expect(result.showIcon).toBe(true);
      expect(result.iconType).toBe('url');
      expect(result.iconUrl).toBe('');
      expect(result.iconSize).toBe('medium');
    });
  });
});
