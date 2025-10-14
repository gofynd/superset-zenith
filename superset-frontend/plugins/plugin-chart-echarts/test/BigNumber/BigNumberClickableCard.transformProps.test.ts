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
import transformProps from '../../src/BigNumber/BigNumberTotal/transformProps';
import { BigNumberTotalChartProps } from '../../src/BigNumber/types';

describe('BigNumber Clickable Card - TransformProps', () => {
  const baseChartProps: BigNumberTotalChartProps = {
    width: 400,
    height: 300,
    queriesData: [{
      data: [{ value: 12345, redirect_url: 'https://example.com' }],
      colnames: ['value', 'redirect_url'],
      coltypes: ['INT', 'VARCHAR'],
    }],
    formData: {
      metric: 'value',
      headerFontSize: 0.4,
      subheaderFontSize: 0.15,
      subheader: 'Test',
      yAxisFormat: 'SMART_NUMBER',
      enableDetailOnHover: true,
    },
    rawFormData: {},
    hooks: {},
    datasource: { currencyFormats: {}, columnFormats: {} },
  };

  describe('Backward Compatibility - Single Column Queries', () => {
    it('should work with single column data (no URL)', () => {
      const props = {
        ...baseChartProps,
        queriesData: [{
          data: [{ value: 12345 }],
          colnames: ['value'],
          coltypes: ['INT'],
        }],
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: false,
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(false);
      expect(result.redirectUrl).toBeUndefined();
      expect(result.bigNumber).toBe(12345);
    });

    it('should work with single column data when clickable card is enabled but no URL column', () => {
      const props = {
        ...baseChartProps,
        queriesData: [{
          data: [{ value: 12345 }],
          colnames: ['value'],
          coltypes: ['INT'],
        }],
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: true,
          urlColumn: undefined,
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(true);
      expect(result.redirectUrl).toBeUndefined();
      expect(result.bigNumber).toBe(12345);
    });
  });

  describe('Two Column Queries - URL Extraction', () => {
    it('should extract URL from specified column', () => {
      const props = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: true,
          urlColumn: 'redirect_url',
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(true);
      expect(result.redirectUrl).toBe('https://example.com');
      expect(result.bigNumber).toBe(12345);
    });

    it('should handle different URL column names', () => {
      const testCases = [
        { urlColumn: 'url', expectedUrl: 'https://test1.com' },
        { urlColumn: 'link', expectedUrl: 'https://test2.com' },
        { urlColumn: 'redirect_link', expectedUrl: 'https://test3.com' },
      ];

      testCases.forEach(({ urlColumn, expectedUrl }) => {
        const props = {
          ...baseChartProps,
          queriesData: [{
            data: [{ value: 12345, [urlColumn]: expectedUrl }],
            colnames: ['value', urlColumn],
            coltypes: ['INT', 'VARCHAR'],
          }],
          formData: {
            ...baseChartProps.formData,
            enableClickableCard: true,
            urlColumn,
          },
        };

        const result = transformProps(props);
        
        expect(result.redirectUrl).toBe(expectedUrl);
      });
    });

    it('should handle empty data gracefully', () => {
      const props = {
        ...baseChartProps,
        queriesData: [{
          data: [],
          colnames: ['value', 'redirect_url'],
          coltypes: ['INT', 'VARCHAR'],
        }],
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: true,
          urlColumn: 'redirect_url',
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(true);
      expect(result.redirectUrl).toBeUndefined();
      expect(result.bigNumber).toBeNull();
    });

    it('should handle null URL values', () => {
      const props = {
        ...baseChartProps,
        queriesData: [{
          data: [{ value: 12345, redirect_url: null }],
          colnames: ['value', 'redirect_url'],
          coltypes: ['INT', 'VARCHAR'],
        }],
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: true,
          urlColumn: 'redirect_url',
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(true);
      expect(result.redirectUrl).toBeUndefined();
    });

    it('should handle undefined URL values', () => {
      const props = {
        ...baseChartProps,
        queriesData: [{
          data: [{ value: 12345, redirect_url: undefined }],
          colnames: ['value', 'redirect_url'],
          coltypes: ['INT', 'VARCHAR'],
        }],
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: true,
          urlColumn: 'redirect_url',
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(true);
      expect(result.redirectUrl).toBeUndefined();
    });

    it('should handle non-string URL values', () => {
      const props = {
        ...baseChartProps,
        queriesData: [{
          data: [{ value: 12345, redirect_url: 123456 }],
          colnames: ['value', 'redirect_url'],
          coltypes: ['INT', 'INT'],
        }],
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: true,
          urlColumn: 'redirect_url',
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(true);
      expect(result.redirectUrl).toBeUndefined();
    });

    it('should handle empty string URL values', () => {
      const props = {
        ...baseChartProps,
        queriesData: [{
          data: [{ value: 12345, redirect_url: '' }],
          colnames: ['value', 'redirect_url'],
          coltypes: ['INT', 'VARCHAR'],
        }],
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: true,
          urlColumn: 'redirect_url',
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(true);
      expect(result.redirectUrl).toBeUndefined();
    });
  });

  describe('Feature Toggle Behavior', () => {
    it('should not extract URL when enableClickableCard is false', () => {
      const props = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: false,
          urlColumn: 'redirect_url',
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(false);
      expect(result.redirectUrl).toBeUndefined();
    });

    it('should not extract URL when urlColumn is not specified', () => {
      const props = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: true,
          urlColumn: undefined,
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(true);
      expect(result.redirectUrl).toBeUndefined();
    });

    it('should not extract URL when urlColumn is empty string', () => {
      const props = {
        ...baseChartProps,
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: true,
          urlColumn: '',
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(true);
      expect(result.redirectUrl).toBeUndefined();
    });
  });

  describe('URL Column Validation', () => {
    it('should handle non-existent URL column', () => {
      const props = {
        ...baseChartProps,
        queriesData: [{
          data: [{ value: 12345 }],
          colnames: ['value'],
          coltypes: ['INT'],
        }],
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: true,
          urlColumn: 'non_existent_column',
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(true);
      expect(result.redirectUrl).toBeUndefined();
    });

    it('should handle case-sensitive column names', () => {
      const props = {
        ...baseChartProps,
        queriesData: [{
          data: [{ value: 12345, REDIRECT_URL: 'https://example.com' }],
          colnames: ['value', 'REDIRECT_URL'],
          coltypes: ['INT', 'VARCHAR'],
        }],
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: true,
          urlColumn: 'redirect_url', // lowercase
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(true);
      expect(result.redirectUrl).toBeUndefined(); // Should not match due to case sensitivity
    });
  });

  describe('Integration with Time Comparison', () => {
    it('should work with time comparison and URL extraction', () => {
      const props = {
        ...baseChartProps,
        queriesData: [{
          data: [{ 
            value: 12345, 
            redirect_url: 'https://example.com',
            'value__1 day ago': 10000
          }],
          colnames: ['value', 'redirect_url', 'value__1 day ago'],
          coltypes: ['INT', 'VARCHAR', 'INT'],
        }],
        formData: {
          ...baseChartProps.formData,
          enableClickableCard: true,
          urlColumn: 'redirect_url',
          time_compare: '1 day ago',
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(true);
      expect(result.redirectUrl).toBe('https://example.com');
      expect(result.bigNumber).toBe(12345);
      expect(result.previousPeriodValue).toBe(10000);
      expect(result.percentageChange).toBeCloseTo(0.2345, 4); // (12345 - 10000) / 10000
    });
  });

  describe('Default Values', () => {
    it('should use default values when not specified', () => {
      const props = {
        ...baseChartProps,
        formData: {
          metric: 'value',
          headerFontSize: 0.4,
          subheaderFontSize: 0.15,
          subheader: 'Test',
          yAxisFormat: 'SMART_NUMBER',
        },
      };

      const result = transformProps(props);
      
      expect(result.enableClickableCard).toBe(false);
      expect(result.redirectUrl).toBeUndefined();
    });
  });
});
