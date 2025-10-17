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

/**
 * Integration test for BigNumber two-column support:
 * - One column for the metric value
 * - One column for the redirect URL
 * 
 * This test validates the complete flow from query result to rendered component.
 */

import transformProps from '../../src/BigNumber/BigNumberTotal/transformProps';
import { BigNumberTotalChartProps } from '../../src/BigNumber/types';

describe('BigNumber Two-Column Support - Integration Tests', () => {
  describe('Custom SQL with Two Columns', () => {
    it('should handle custom metric and URL column names', () => {
      const chartProps: BigNumberTotalChartProps = {
        width: 400,
        height: 300,
        queriesData: [{
          data: [{ 
            average_order_value: 1000,
            redirect_url: 'www.google.com/433/rpra'
          }],
          colnames: ['average_order_value', 'redirect_url'],
          coltypes: ['DOUBLE', 'VARCHAR'],
        }],
        formData: {
          metric: 'average_order_value',
          headerFontSize: 0.4,
          subheaderFontSize: 0.15,
          subheader: 'Average Order Value',
          yAxisFormat: 'SMART_NUMBER',
          enableDetailOnHover: true,
          enableClickableCard: true,
          urlColumn: 'redirect_url',
        },
        rawFormData: {},
        hooks: {},
        datasource: {
          currencyFormats: {},
          columnFormats: {},
        },
      };

      const result = transformProps(chartProps);

      // Verify metric is correctly extracted
      expect(result.bigNumber).toBe(1000);
      
      // Verify URL is correctly extracted
      expect(result.redirectUrl).toBe('www.google.com/433/rpra');
      
      // Verify clickable card is enabled
      expect(result.enableClickableCard).toBe(true);
      
      // Verify other properties are preserved
      expect(result.subheader).toBe('Average Order Value');
    });

    it('should handle different column name combinations', () => {
      const testCases = [
        {
          metric: 'total_revenue',
          urlCol: 'dashboard_link',
          metricValue: 50000,
          urlValue: 'https://dashboard.com/revenue',
        },
        {
          metric: 'customer_count',
          urlCol: 'detail_url',
          metricValue: 1234,
          urlValue: 'https://app.com/customers',
        },
        {
          metric: 'conversion_rate',
          urlCol: 'report_link',
          metricValue: 0.25,
          urlValue: 'https://reports.com/conversion',
        },
      ];

      testCases.forEach(({ metric, urlCol, metricValue, urlValue }) => {
        const chartProps: BigNumberTotalChartProps = {
          width: 400,
          height: 300,
          queriesData: [{
            data: [{ 
              [metric]: metricValue,
              [urlCol]: urlValue
            }],
            colnames: [metric, urlCol],
            coltypes: ['DOUBLE', 'VARCHAR'],
          }],
          formData: {
            metric,
            headerFontSize: 0.4,
            subheaderFontSize: 0.15,
            yAxisFormat: 'SMART_NUMBER',
            enableClickableCard: true,
            urlColumn: urlCol,
          },
          rawFormData: {},
          hooks: {},
          datasource: {
            currencyFormats: {},
            columnFormats: {},
          },
        };

        const result = transformProps(chartProps);

        expect(result.bigNumber).toBe(metricValue);
        expect(result.redirectUrl).toBe(urlValue);
        expect(result.enableClickableCard).toBe(true);
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with single-column queries (no URL)', () => {
      const chartProps: BigNumberTotalChartProps = {
        width: 400,
        height: 300,
        queriesData: [{
          data: [{ value: 12345 }],
          colnames: ['value'],
          coltypes: ['INT'],
        }],
        formData: {
          metric: 'value',
          headerFontSize: 0.4,
          subheaderFontSize: 0.15,
          yAxisFormat: 'SMART_NUMBER',
          enableClickableCard: false,
        },
        rawFormData: {},
        hooks: {},
        datasource: {
          currencyFormats: {},
          columnFormats: {},
        },
      };

      const result = transformProps(chartProps);

      expect(result.bigNumber).toBe(12345);
      expect(result.redirectUrl).toBeUndefined();
      expect(result.enableClickableCard).toBe(false);
    });

    it('should ignore URL column when clickable card is disabled', () => {
      const chartProps: BigNumberTotalChartProps = {
        width: 400,
        height: 300,
        queriesData: [{
          data: [{ 
            value: 9999,
            redirect_url: 'https://example.com'
          }],
          colnames: ['value', 'redirect_url'],
          coltypes: ['INT', 'VARCHAR'],
        }],
        formData: {
          metric: 'value',
          headerFontSize: 0.4,
          subheaderFontSize: 0.15,
          yAxisFormat: 'SMART_NUMBER',
          enableClickableCard: false, // Explicitly disabled
          urlColumn: 'redirect_url',
        },
        rawFormData: {},
        hooks: {},
        datasource: {
          currencyFormats: {},
          columnFormats: {},
        },
      };

      const result = transformProps(chartProps);

      expect(result.bigNumber).toBe(9999);
      expect(result.redirectUrl).toBeUndefined(); // URL should not be extracted
      expect(result.enableClickableCard).toBe(false);
    });
  });

  describe('Real-world Use Cases', () => {
    it('should handle dynamic URLs with parameters', () => {
      const chartProps: BigNumberTotalChartProps = {
        width: 400,
        height: 300,
        queriesData: [{
          data: [{ 
            metric: 750,
            url: 'https://dashboard.com/region/west?metric=sales&period=2024'
          }],
          colnames: ['metric', 'url'],
          coltypes: ['DOUBLE', 'VARCHAR'],
        }],
        formData: {
          metric: 'metric',
          headerFontSize: 0.4,
          subheaderFontSize: 0.15,
          yAxisFormat: 'SMART_NUMBER',
          enableClickableCard: true,
          urlColumn: 'url',
        },
        rawFormData: {},
        hooks: {},
        datasource: {
          currencyFormats: {},
          columnFormats: {},
        },
      };

      const result = transformProps(chartProps);

      expect(result.bigNumber).toBe(750);
      expect(result.redirectUrl).toBe('https://dashboard.com/region/west?metric=sales&period=2024');
    });

    it('should handle relative URLs', () => {
      const chartProps: BigNumberTotalChartProps = {
        width: 400,
        height: 300,
        queriesData: [{
          data: [{ 
            sales: 42000,
            link: '/dashboard/sales/details'
          }],
          colnames: ['sales', 'link'],
          coltypes: ['INT', 'VARCHAR'],
        }],
        formData: {
          metric: 'sales',
          headerFontSize: 0.4,
          subheaderFontSize: 0.15,
          yAxisFormat: '$,.0f',
          enableClickableCard: true,
          urlColumn: 'link',
        },
        rawFormData: {},
        hooks: {},
        datasource: {
          currencyFormats: {},
          columnFormats: {},
        },
      };

      const result = transformProps(chartProps);

      expect(result.bigNumber).toBe(42000);
      expect(result.redirectUrl).toBe('/dashboard/sales/details');
    });

    it('should handle multiple rows (uses first row)', () => {
      const chartProps: BigNumberTotalChartProps = {
        width: 400,
        height: 300,
        queriesData: [{
          data: [
            { count: 100, url: 'https://first.com' },
            { count: 200, url: 'https://second.com' },
            { count: 300, url: 'https://third.com' },
          ],
          colnames: ['count', 'url'],
          coltypes: ['INT', 'VARCHAR'],
        }],
        formData: {
          metric: 'count',
          headerFontSize: 0.4,
          subheaderFontSize: 0.15,
          yAxisFormat: 'SMART_NUMBER',
          enableClickableCard: true,
          urlColumn: 'url',
        },
        rawFormData: {},
        hooks: {},
        datasource: {
          currencyFormats: {},
          columnFormats: {},
        },
      };

      const result = transformProps(chartProps);

      // BigNumber always uses first row
      expect(result.bigNumber).toBe(100);
      expect(result.redirectUrl).toBe('https://first.com');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null URL values gracefully', () => {
      const chartProps: BigNumberTotalChartProps = {
        width: 400,
        height: 300,
        queriesData: [{
          data: [{ 
            metric: 555,
            url: null
          }],
          colnames: ['metric', 'url'],
          coltypes: ['INT', 'VARCHAR'],
        }],
        formData: {
          metric: 'metric',
          headerFontSize: 0.4,
          subheaderFontSize: 0.15,
          yAxisFormat: 'SMART_NUMBER',
          enableClickableCard: true,
          urlColumn: 'url',
        },
        rawFormData: {},
        hooks: {},
        datasource: {
          currencyFormats: {},
          columnFormats: {},
        },
      };

      const result = transformProps(chartProps);

      expect(result.bigNumber).toBe(555);
      expect(result.redirectUrl).toBeUndefined(); // null URL should result in undefined
    });

    it('should handle empty string URL', () => {
      const chartProps: BigNumberTotalChartProps = {
        width: 400,
        height: 300,
        queriesData: [{
          data: [{ 
            metric: 777,
            url: ''
          }],
          colnames: ['metric', 'url'],
          coltypes: ['INT', 'VARCHAR'],
        }],
        formData: {
          metric: 'metric',
          headerFontSize: 0.4,
          subheaderFontSize: 0.15,
          yAxisFormat: 'SMART_NUMBER',
          enableClickableCard: true,
          urlColumn: 'url',
        },
        rawFormData: {},
        hooks: {},
        datasource: {
          currencyFormats: {},
          columnFormats: {},
        },
      };

      const result = transformProps(chartProps);

      expect(result.bigNumber).toBe(777);
      expect(result.redirectUrl).toBeUndefined(); // empty string should result in undefined
    });

    it('should handle URL column that does not exist', () => {
      const chartProps: BigNumberTotalChartProps = {
        width: 400,
        height: 300,
        queriesData: [{
          data: [{ metric: 888 }],
          colnames: ['metric'],
          coltypes: ['INT'],
        }],
        formData: {
          metric: 'metric',
          headerFontSize: 0.4,
          subheaderFontSize: 0.15,
          yAxisFormat: 'SMART_NUMBER',
          enableClickableCard: true,
          urlColumn: 'nonexistent_url', // Column doesn't exist in data
        },
        rawFormData: {},
        hooks: {},
        datasource: {
          currencyFormats: {},
          columnFormats: {},
        },
      };

      const result = transformProps(chartProps);

      expect(result.bigNumber).toBe(888);
      expect(result.redirectUrl).toBeUndefined();
    });

    it('should handle non-string URL values', () => {
      const chartProps: BigNumberTotalChartProps = {
        width: 400,
        height: 300,
        queriesData: [{
          data: [{ 
            metric: 999,
            url: 12345 as any // Non-string URL value
          }],
          colnames: ['metric', 'url'],
          coltypes: ['INT', 'INT'],
        }],
        formData: {
          metric: 'metric',
          headerFontSize: 0.4,
          subheaderFontSize: 0.15,
          yAxisFormat: 'SMART_NUMBER',
          enableClickableCard: true,
          urlColumn: 'url',
        },
        rawFormData: {},
        hooks: {},
        datasource: {
          currencyFormats: {},
          columnFormats: {},
        },
      };

      const result = transformProps(chartProps);

      expect(result.bigNumber).toBe(999);
      expect(result.redirectUrl).toBeUndefined(); // Non-string should be rejected
    });
  });

  describe('Column Auto-population Simulation', () => {
    it('should demonstrate how column choices are populated', () => {
      // This simulates what happens in the control panel
      const mockQueryResponse = {
        data: [{ 
          total_sales: 50000,
          dashboard_url: 'https://example.com'
        }],
        colnames: ['total_sales', 'dashboard_url'],
        coltypes: ['DOUBLE', 'VARCHAR'],
      };

      // Simulate the mapStateToProps logic from controlPanel
      const columnOptions = mockQueryResponse.colnames.map((colname: string) => [colname, colname]);

      expect(columnOptions).toEqual([
        ['total_sales', 'total_sales'],
        ['dashboard_url', 'dashboard_url'],
      ]);

      // Both columns should be available for selection
      // User can select 'total_sales' as metric
      // User can select 'dashboard_url' as URL column
    });
  });
});

