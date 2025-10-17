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
import {
  extractTimegrain,
  getNumberFormatter,
  NumberFormats,
  GenericDataType,
  getMetricLabel,
  getXAxisLabel,
  Metric,
  getValueFormatter,
  t,
  tooltipHtml,
} from '@superset-ui/core';
import { EChartsCoreOption, graphic } from 'echarts/core';
import {
  BigNumberVizProps,
  BigNumberDatum,
  BigNumberWithTrendlineChartProps,
  TimeSeriesDatum,
} from '../types';
import { getDateFormatter, parseMetricValue } from '../utils';
import { getDefaultTooltip } from '../../utils/tooltip';
import { Refs } from '../../types';

const formatPercentChange = getNumberFormatter(
  NumberFormats.PERCENT_SIGNED_1_POINT,
);

export default function transformProps(
  chartProps: BigNumberWithTrendlineChartProps,
): BigNumberVizProps {
  const {
    width,
    height,
    queriesData,
    formData,
    rawFormData,
    theme,
    hooks,
    inContextMenu,
    datasource: { currencyFormats = {}, columnFormats = {} },
  } = chartProps;
  const {
    colorPicker,
    compareLag: compareLag_,
    compareSuffix = '',
    timeFormat,
    headerFontSize,
    metric = 'value',
    showTimestamp,
    showTrendLine,
    startYAxisAtZero,
    subheader = '',
    subheaderFontSize,
    forceTimestampFormatting,
    yAxisFormat,
    currencyFormat,
    timeRangeFixed,
    enableDetailOnHover = true,
    enableClickableCard = false,
    urlColumn,
    clickableCardUrl,
    hoverBorderEnabled = false,
    hoverBorderThickness = 2,
    hoverBorderColor = '#1890ff',
    showIcon = false,
    iconType = 'url',
    iconUrl = '',
    iconUpload = null,
    iconSize = 'medium',
  } = formData;
  const granularity = extractTimegrain(rawFormData);
  const {
    data = [],
    colnames = [],
    coltypes = [],
    from_dttm: fromDatetime,
    to_dttm: toDatetime,
  } = queriesData[0];
  const refs: Refs = {};
  const metricName = getMetricLabel(metric);
  const compareLag = Number(compareLag_) || 0;
  let formattedSubheader = subheader;

  const { r, g, b } = colorPicker;
  const mainColor = `rgb(${r}, ${g}, ${b})`;

  const xAxisLabel = getXAxisLabel(rawFormData) as string;
  let trendLineData: TimeSeriesDatum[] | undefined;
  let percentageChange: number | undefined;
  let bigNumber = data.length === 0 ? null : data[0][metricName];
  let timestamp = data.length === 0 ? null : data[0][xAxisLabel];
  let bigNumberFallback;

  // Extract URL for clickable card feature - Dynamic URLs support
  let redirectUrl: string | undefined;
  
  console.group('🔧 BigNumber WithTrendline URL Extraction Debug (Dynamic URLs)');
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

  // Process the main data first
  const metricColtypeIndex = colnames.findIndex(name => name === metricName);
  const metricColtype =
    metricColtypeIndex > -1 ? coltypes[metricColtypeIndex] : null;

  if (data.length > 0) {
    const sortedData = (data as BigNumberDatum[])
      .map(d => [d[xAxisLabel], parseMetricValue(d[metricName])])
      // sort in time descending order
      .sort((a, b) => (a[0] !== null && b[0] !== null ? b[0] - a[0] : 0));

    bigNumber = sortedData[0][1];
    timestamp = sortedData[0][0];

    if (bigNumber === null) {
      bigNumberFallback = sortedData.find(d => d[1] !== null);
      bigNumber = bigNumberFallback ? bigNumberFallback[1] : null;
      timestamp = bigNumberFallback ? bigNumberFallback[0] : null;
    }

    if (compareLag > 0) {
      const compareIndex = compareLag;
      if (compareIndex < sortedData.length) {
        const compareValue = sortedData[compareIndex][1];
        // compare values must both be non-nulls
        if (bigNumber !== null && compareValue !== null) {
          percentageChange = compareValue
            ? (bigNumber - compareValue) / Math.abs(compareValue)
            : 0;
          formattedSubheader = `${formatPercentChange(
            percentageChange,
          )} ${compareSuffix}`;
        }
      }
    }
    sortedData.reverse();
    // @ts-ignore
    trendLineData = showTrendLine ? sortedData : undefined;
  }

  // Handle comparison data if available and time comparison is enabled
  let previousPeriodValue: number | null = null;
  let comparisonIndicator: 'positive' | 'negative' | 'neutral' | undefined;

  // Handle time comparison - check all possible locations where time_compare might be stored
  let timeCompare =
    formData.time_compare ||
    (formData.extra_form_data?.custom_form_data as any)?.time_compare ||
    (formData.extra_form_data as any)?.time_compare;

  // If we have time-offset columns but no timeCompare detected, force it to 'inherit'
  // This handles cases where the UI selection isn't properly propagated to formData
  const hasTimeOffsetColumns = queriesData[0]?.colnames?.some(
    (col: string) => col.includes('__') && col !== metricName,
  );

  if (!timeCompare && hasTimeOffsetColumns) {
    timeCompare = 'inherit';
  }

  // Check for time-offset columns in the single query
  // const timeOffsetColumns =
  //   queriesData[0]?.colnames?.filter(
  //     (col: string) => col.includes('__') && col !== metricName,
  //   ) || [];

  if (queriesData.length > 0 && timeCompare && timeCompare !== 'NoComparison') {
    const queryData = queriesData[0].data;
    const queryColnames = queriesData[0].colnames || [];

    // Look for columns with time offset suffixes (e.g., "metric__1 day ago")
    const timeOffsetColumns = queryColnames.filter(
      (col: string) => col.includes('__') && col !== metricName,
    );

    if (timeOffsetColumns.length > 0 && queryData && queryData.length > 0) {
      // Find the first time offset column that contains data
      for (const offsetCol of timeOffsetColumns) {
        const rawValue = queryData[0][offsetCol];

        if (
          rawValue !== null &&
          rawValue !== undefined &&
          typeof rawValue === 'number'
        ) {
          previousPeriodValue = parseMetricValue(rawValue);

          if (bigNumber !== null && previousPeriodValue !== null) {
            const bigNumberValue = bigNumber as number;
            let calculatedPercentageChange: number;

            // Handle special cases
            if (previousPeriodValue === 0) {
              if (bigNumberValue === 0) {
                // Both values are 0 - no change
                calculatedPercentageChange = 0;
                comparisonIndicator = 'neutral';
              } else if (bigNumberValue > 0) {
                // Previous was 0, now positive - infinite growth, treat as positive
                calculatedPercentageChange = 1; // 100% change as maximum
                comparisonIndicator = 'positive';
              } else {
                // Previous was 0, now negative - treat as negative
                calculatedPercentageChange = -1; // -100% change as minimum
                comparisonIndicator = 'negative';
              }
            } else if (bigNumberValue === 0) {
              // Current is 0 but previous was not 0 - complete loss (-100%)
              calculatedPercentageChange = -1; // -100% change (complete loss)
              comparisonIndicator = 'negative';
            } else {
              // Normal calculation when both values are non-zero
              calculatedPercentageChange =
                (bigNumberValue - previousPeriodValue) /
                Math.abs(previousPeriodValue);

              if (calculatedPercentageChange > 0) {
                comparisonIndicator = 'positive';
              } else if (calculatedPercentageChange < 0) {
                comparisonIndicator = 'negative';
              } else {
                comparisonIndicator = 'neutral';
              }
            }

            percentageChange = calculatedPercentageChange;
            break; // Found valid comparison data, exit loop
          }
        }
      }
    }
  }

  let className = '';
  if (percentageChange && percentageChange > 0) {
    className = 'positive';
  } else if (percentageChange && percentageChange < 0) {
    className = 'negative';
  }

  let metricEntry: Metric | undefined;
  if (chartProps.datasource?.metrics) {
    metricEntry = chartProps.datasource.metrics.find(
      metricEntry => metricEntry.metric_name === metric,
    );
  }

  const formatTime = getDateFormatter(
    timeFormat,
    granularity,
    metricEntry?.d3format,
  );

  const numberFormatter = getValueFormatter(
    metric,
    currencyFormats,
    columnFormats,
    yAxisFormat,
    currencyFormat,
  );

  const headerFormatter =
    metricColtype === GenericDataType.Temporal ||
    metricColtype === GenericDataType.String ||
    forceTimestampFormatting
      ? formatTime
      : numberFormatter;

  if (trendLineData && timeRangeFixed && fromDatetime) {
    const toDatetimeOrToday = toDatetime ?? Date.now();
    if (!trendLineData[0][0] || trendLineData[0][0] > fromDatetime) {
      trendLineData.unshift([fromDatetime, null]);
    }
    if (
      !trendLineData[trendLineData.length - 1][0] ||
      trendLineData[trendLineData.length - 1][0]! < toDatetimeOrToday
    ) {
      trendLineData.push([toDatetimeOrToday, null]);
    }
  }

  const echartOptions: EChartsCoreOption = trendLineData
    ? {
        series: [
          {
            data: trendLineData,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 10,
            showSymbol: false,
            color: mainColor,
            areaStyle: {
              color: new graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: mainColor,
                },
                {
                  offset: 1,
                  color: theme.colors.grayscale.light5,
                },
              ]),
            },
          },
        ],
        xAxis: {
          min: trendLineData[0][0],
          max: trendLineData[trendLineData.length - 1][0],
          show: false,
          type: 'value',
        },
        yAxis: {
          scale: !startYAxisAtZero,
          show: false,
        },
        grid: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
        tooltip: {
          ...getDefaultTooltip(refs),
          show: !inContextMenu,
          trigger: 'axis',
          formatter: (params: { data: TimeSeriesDatum }[]) =>
            tooltipHtml(
              [
                [
                  metricName,
                  params[0].data[1] === null
                    ? t('N/A')
                    : headerFormatter.format(params[0].data[1]),
                ],
              ],
              formatTime(params[0].data[0]),
            ),
        },
        aria: {
          enabled: true,
          label: {
            description: `Big number visualization ${subheader}`,
          },
        },
      }
    : {};

  const { onContextMenu } = hooks;

  // Handle icon URL - use uploaded file if available, otherwise use provided URL
  let finalIconUrl = iconUrl;
  if (showIcon && iconType === 'upload' && iconUpload) {
    // Additional validation for uploaded files
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    const minSize = 1024; // 1KB
    
    if (!allowedTypes.includes(iconUpload.type)) {
      console.warn('Invalid file type for icon upload:', iconUpload.type);
      finalIconUrl = '';
    } else if (iconUpload.size > maxSize) {
      console.warn('Icon file too large:', iconUpload.size, 'bytes');
      finalIconUrl = '';
    } else if (iconUpload.size < minSize) {
      console.warn('Icon file too small:', iconUpload.size, 'bytes');
      finalIconUrl = '';
    } else {
      // Convert uploaded file to data URL
      finalIconUrl = URL.createObjectURL(iconUpload);
    }
  } else if (showIcon && iconType === 'url' && iconUrl) {
    // Validate URL format
    try {
      new URL(iconUrl);
      finalIconUrl = iconUrl;
    } catch {
      console.warn('Invalid icon URL:', iconUrl);
      finalIconUrl = '';
    }
  }

  return {
    width,
    height,
    bigNumber,
    // @ts-ignore
    bigNumberFallback,
    className,
    headerFormatter,
    formatTime,
    formData,
    headerFontSize,
    subheaderFontSize,
    mainColor,
    showTimestamp,
    showTrendLine,
    startYAxisAtZero,
    subheader: formattedSubheader,
    timestamp,
    trendLineData,
    echartOptions,
    onContextMenu,
    xValueFormatter: formatTime,
    refs,
    previousPeriodValue,
    percentageChange,
    comparisonIndicator,
    enableDetailOnHover,
    metric: getMetricLabel(metric),
    yAxisFormat,
    enableClickableCard,
    redirectUrl,
    hoverBorderEnabled,
    hoverBorderThickness: typeof hoverBorderThickness === 'string' 
      ? parseInt(hoverBorderThickness, 10) || 2 
      : hoverBorderThickness,
    hoverBorderColor,
    showIcon,
    iconType,
    iconUrl: finalIconUrl,
    iconSize,
  };
}
