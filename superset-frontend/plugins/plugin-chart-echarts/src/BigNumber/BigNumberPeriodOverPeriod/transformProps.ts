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
import moment from 'moment';
import {
  ChartProps,
  getMetricLabel,
  getValueFormatter,
  getNumberFormatter,
  SimpleAdhocFilter,
  ensureIsArray,
  getTimeOffset,
  parseDttmToDate,
} from '@superset-ui/core';
import { isEmpty } from 'lodash';
import { getComparisonFontSize, getHeaderFontSize } from './utils';

export const parseMetricValue = (metricValue: number | string | null) => {
  if (typeof metricValue === 'string') {
    const dateObject = moment.utc(metricValue, moment.ISO_8601, true);
    if (dateObject.isValid()) {
      return dateObject.valueOf();
    }
    return 0;
  }
  return metricValue ?? 0;
};

export default function transformProps(chartProps: ChartProps) {
  /**
   * This function is called after a successful response has been
   * received from the chart data endpoint, and is used to transform
   * the incoming data prior to being sent to the Visualization.
   *
   * The transformProps function is also quite useful to return
   * additional/modified props to your data viz component. The formData
   * can also be accessed from your CustomViz.tsx file, but
   * doing supplying custom props here is often handy for integrating third
   * party libraries that rely on specific props.
   *
   * A description of properties in `chartProps`:
   * - `height`, `width`: the height/width of the DOM element in which
   *   the chart is located
   * - `formData`: the chart data request payload that was sent to the
   *   backend.
   * - `queriesData`: the chart data response payload that was received
   *   from the backend. Some notable properties of `queriesData`:
   *   - `data`: an array with data, each row with an object mapping
   *     the column/alias to its value. Example:
   *     `[{ col1: 'abc', metric1: 10 }, { col1: 'xyz', metric1: 20 }]`
   *   - `rowcount`: the number of rows in `data`
   *   - `query`: the query that was issued.
   *
   * Please note: the transformProps function gets cached when the
   * application loads. When making changes to the `transformProps`
   * function during development with hot reloading, changes won't
   * be seen until restarting the development server.
   */
  const {
    width,
    height,
    formData,
    queriesData,
    datasource: { currencyFormats = {}, columnFormats = {} },
  } = chartProps;
  const {
    boldText,
    headerFontSize,
    headerText,
    metric,
    yAxisFormat,
    currencyFormat,
    subheaderFontSize,
    comparisonColorScheme,
    comparisonColorEnabled,
    percentDifferenceFormat,
    enableDetailOnHover = true,
    enableClickableCard = false,
    urlColumn,
    clickableCardUrl,
    hoverBorderEnabled = false,
    hoverBorderThickness = 2,
    hoverBorderColor = '#1890ff',
  } = formData;
  const { data: dataA = [] } = queriesData[0];
  const data = dataA;
  const metricName = metric ? getMetricLabel(metric) : '';
  const timeComparison = ensureIsArray(chartProps.rawFormData?.time_compare)[0];
  const startDateOffset = chartProps.rawFormData?.start_date_offset;
  const currentTimeRangeFilter = chartProps.rawFormData?.adhoc_filters?.filter(
    (adhoc_filter: SimpleAdhocFilter) =>
      adhoc_filter.operator === 'TEMPORAL_RANGE',
  )?.[0];
  // In case the viz is using all version of controls, we try to load them
  const previousCustomTimeRangeFilters: any =
    chartProps.rawFormData?.adhoc_custom?.filter(
      (filter: SimpleAdhocFilter) => filter.operator === 'TEMPORAL_RANGE',
    ) || [];

  let previousCustomStartDate = '';
  if (
    !isEmpty(previousCustomTimeRangeFilters) &&
    previousCustomTimeRangeFilters[0]?.comparator !== 'No Filter'
  ) {
    previousCustomStartDate =
      previousCustomTimeRangeFilters[0]?.comparator.split(' : ')[0];
  }
  const isCustomOrInherit =
    timeComparison === 'custom' || timeComparison === 'inherit';
  let dataOffset: string[] = [];
  if (isCustomOrInherit) {
    dataOffset = getTimeOffset({
      timeRangeFilter: {
        ...currentTimeRangeFilter,
        comparator:
          formData?.extraFormData?.time_range ??
          (currentTimeRangeFilter as any)?.comparator,
      },
      shifts: ensureIsArray(timeComparison),
      startDate:
        previousCustomStartDate && !startDateOffset
          ? parseDttmToDate(previousCustomStartDate)?.toUTCString()
          : startDateOffset,
    });
  }

  const { value1, value2 } = data.reduce(
    (acc: { value1: number; value2: number }, curr: { [x: string]: any }) => {
      Object.keys(curr).forEach(key => {
        if (
          key.includes(
            `${metricName}__${
              !isCustomOrInherit ? timeComparison : dataOffset[0]
            }`,
          )
        ) {
          acc.value2 += curr[key];
        } else if (key.includes(metricName)) {
          acc.value1 += curr[key];
        }
      });
      return acc;
    },
    { value1: 0, value2: 0 },
  );

  let bigNumber: number | string =
    data.length === 0 ? 0 : parseMetricValue(value1);
  let prevNumber: number | string =
    data.length === 0 ? 0 : parseMetricValue(value2);

  const numberFormatter = getValueFormatter(
    metric,
    currencyFormats,
    columnFormats,
    yAxisFormat,
    currencyFormat,
  );

  const compTitles = {
    r: 'Range' as string,
    y: 'Year' as string,
    m: 'Month' as string,
    w: 'Week' as string,
  };

  const formatPercentChange = getNumberFormatter(percentDifferenceFormat);

  let valueDifference: number | string = bigNumber - prevNumber;

  let percentDifferenceNum;

  if (!bigNumber && !prevNumber) {
    percentDifferenceNum = 0;
  } else if (!bigNumber || !prevNumber) {
    percentDifferenceNum = bigNumber ? 1 : -1;
  } else {
    percentDifferenceNum = (bigNumber - prevNumber) / Math.abs(prevNumber);
  }

  const compType = compTitles[formData.timeComparison];
  const exactBigNumber = bigNumber; // Store exact value before formatting
  bigNumber = numberFormatter(bigNumber);
  prevNumber = numberFormatter(prevNumber);
  valueDifference = numberFormatter(valueDifference);
  const percentDifference: string = formatPercentChange(percentDifferenceNum);

  // Extract URL for clickable card feature - Dynamic URLs support
  let redirectUrl: string | undefined;
  
  console.group('🔧 BigNumber PeriodOverPeriod URL Extraction Debug (Dynamic URLs)');
  console.log('1. Configuration Check:');
  console.log('   - enableClickableCard:', enableClickableCard);
  console.log('   - urlColumn:', urlColumn);
  console.log('   - queriesData.length:', queriesData.length);
  console.log('   - clickableCardUrl (manual):', clickableCardUrl);
  
  if (enableClickableCard) {
    let urlValue: string | undefined;
    
    // Strategy 1: Use manual URL from formData (highest priority)
    if (clickableCardUrl) {
      console.log('2. Strategy 1: Using Manual URL from formData');
      urlValue = clickableCardUrl;
      console.log('   ✅ Using manual URL:', urlValue);
    }
    // Strategy 2: Try to get from second query (dynamic URL query)
    else if (urlColumn && queriesData.length > 1) {
      console.log('3. Strategy 2: Fetching from separate URL query (queriesData[1])');
      const urlQueryData = queriesData[1];
      console.log('   - URL query data:', urlQueryData);
      console.log('   - URL query data.data:', urlQueryData?.data);
      
      if (urlQueryData?.data && urlQueryData.data.length > 0) {
        const urlRow = urlQueryData.data[0];
        console.log('   - URL row:', urlRow);
        console.log('   - Available columns:', Object.keys(urlRow));
        
        // Try direct lookup
        urlValue = urlRow[urlColumn];
        console.log('   - Direct lookup urlRow["' + urlColumn + '"]:', urlValue);
        
        if (!urlValue) {
          // If not found by exact name, try first available column value
          const firstColumnValue = Object.values(urlRow)[0] as string;
          console.log('   - Trying first column value:', firstColumnValue);
          if (typeof firstColumnValue === 'string') {
            urlValue = firstColumnValue;
            console.log('   ✅ Using first column as URL:', urlValue);
          }
        }
      } else {
        console.warn('   ❌ No URL query data available (queriesData[1] is empty)');
      }
    }
    // Strategy 3: Try to get from first query (backward compatibility)
    else if (urlColumn && data.length > 0) {
      console.log('4. Strategy 3: Trying from main query data[0] (backward compat)');
      console.log('   - data[0]:', data[0]);
      console.log('   - Available columns:', Object.keys(data[0] || {}));
      
      // Try direct lookup
      urlValue = data[0][urlColumn];
      console.log('   - Direct lookup data[0]["' + urlColumn + '"]:', urlValue);
      
      // If not found, try with common aggregation prefixes
      if (!urlValue) {
        console.log('   - Trying aggregation variations...');
        const aggregations = ['MAX', 'MIN', 'ANY_VALUE', 'FIRST', 'LAST'];
        for (const agg of aggregations) {
          const aggColumnName = `${agg}(${urlColumn})`;
          console.log('     - Trying:', aggColumnName);
          if (data[0][aggColumnName]) {
            urlValue = data[0][aggColumnName];
            console.log('     ✅ Found at:', aggColumnName, '=', urlValue);
            break;
          }
        }
      }
    }
    
    console.log('5. Final URL value:', urlValue);
    console.log('   - Type:', typeof urlValue);
    console.log('   - Is string?:', typeof urlValue === 'string');
    
    if (urlValue && typeof urlValue === 'string') {
      redirectUrl = urlValue;
      console.log('✅ URL extracted successfully:', redirectUrl);
    } else {
      console.warn('❌ URL extraction failed - value is not a valid string');
      console.warn('   💡 Solution: Use "Manual URL" field or ensure URL column is in query results');
    }
  } else {
    console.log('❌ URL extraction skipped - enableClickableCard is false');
  }
  
  console.log('6. Final redirectUrl:', redirectUrl);
  console.groupEnd();

  return {
    width,
    height,
    data,
    metricName,
    bigNumber,
    exactBigNumber,
    prevNumber,
    valueDifference,
    percentDifferenceFormattedString: percentDifference,
    boldText,
    headerFontSize: getHeaderFontSize(headerFontSize),
    subheaderFontSize: getComparisonFontSize(subheaderFontSize),
    headerText,
    compType,
    comparisonColorEnabled,
    comparisonColorScheme,
    percentDifferenceNumber: percentDifferenceNum,
    currentTimeRangeFilter,
    startDateOffset,
    shift: timeComparison,
    dashboardTimeRange: formData?.extraFormData?.time_range,
    enableDetailOnHover,
    yAxisFormat,
    enableClickableCard,
    redirectUrl,
    hoverBorderEnabled,
    hoverBorderThickness: typeof hoverBorderThickness === 'string' 
      ? parseInt(hoverBorderThickness, 10) || 2 
      : hoverBorderThickness,
    hoverBorderColor,
  };
}
