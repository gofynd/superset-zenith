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
    showIcon = false,
    iconType = 'url',
    iconUrl = '',
    iconUpload = null,
    iconSize = 'medium',
    iconBackgroundColor: iconBackgroundColorRaw = '#e8eaf6',
    iconShape = 'circle',
    iconPosition = 'top-left',
    // Uptrend/Downtrend icon properties
    uptrendIconType = 'url',
    uptrendIconUrl = '',
    uptrendIconUpload = null,
    uptrendIconBackgroundColor: uptrendIconBackgroundColorRaw = '#e8eaf6',
    uptrendIconTextColor: uptrendIconTextColorRaw,
    uptrendIconShape = 'circle',
    downtrendIconType = 'url',
    downtrendIconUrl = '',
    downtrendIconUpload = null,
    downtrendIconBackgroundColor: downtrendIconBackgroundColorRaw = '#e8eaf6',
    downtrendIconTextColor: downtrendIconTextColorRaw,
    downtrendIconShape = 'circle',
    showNeutralTrendChip = true,
    neutralIconType = 'url',
    neutralIconUrl = '',
    neutralIconUpload = null,
    neutralIconBackgroundColor: neutralIconBackgroundColorRaw = '#FEF0E7',
    neutralIconTextColor: neutralIconTextColorRaw = '#F06D0F',
    neutralIconShape = 'circle',
    trendComparisonPosition = 'top',
    trendComparisonShape = 'pill',
    trendComparisonSize = 'large',
    // Also check snake_case keys (formData might use snake_case)
    show_icon,
    icon_url,
    icon_size,
    icon_background_color,
    icon_shape,
    icon_position,
    uptrend_icon_type,
    uptrend_icon_url,
    uptrend_icon_upload,
    uptrend_icon_background_color,
    uptrend_icon_text_color,
    uptrend_icon_shape,
    downtrend_icon_type,
    downtrend_icon_url,
    downtrend_icon_upload,
    downtrend_icon_background_color,
    downtrend_icon_text_color,
    downtrend_icon_shape,
    show_neutral_trend_chip,
    neutral_icon_type,
    neutral_icon_url,
    neutral_icon_upload,
    neutral_icon_background_color,
    neutral_icon_text_color,
    neutral_icon_shape,
    trend_comparison_position,
    trend_comparison_shape,
    trend_comparison_size,
  } = formData;
  
  // Handle both camelCase and snake_case keys
  const finalShowIcon = showIcon ?? show_icon ?? false;
  const finalIconUrl = iconUrl || icon_url || '';
  const finalIconSize = iconSize || icon_size || 'medium';
  const finalIconShape = iconShape || icon_shape || 'circle';
  const finalIconPosition = iconPosition || icon_position || 'top-left';
  
  // Handle iconBackgroundColor - check both camelCase and snake_case, and convert color object to string
  let finalIconBackgroundColor = iconBackgroundColorRaw || icon_background_color || '#e8eaf6';
  if (typeof finalIconBackgroundColor === 'object' && finalIconBackgroundColor !== null) {
    // Convert color object to CSS string (from ColorPickerControl)
    if ('r' in finalIconBackgroundColor && 'g' in finalIconBackgroundColor && 'b' in finalIconBackgroundColor) {
      const { r, g, b, a = 1 } = finalIconBackgroundColor as { r: number; g: number; b: number; a?: number };
      finalIconBackgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      finalIconBackgroundColor = '#e8eaf6'; // fallback
    }
  } else if (typeof finalIconBackgroundColor !== 'string') {
    finalIconBackgroundColor = '#e8eaf6'; // fallback
  }
  
  // Handle uptrend icon properties
  const finalUptrendIconType = uptrendIconType || uptrend_icon_type || 'url';
  let finalUptrendIconUrl = uptrendIconUrl || uptrend_icon_url || '';
  const finalUptrendIconShape = uptrendIconShape || uptrend_icon_shape || 'circle';
  let finalUptrendIconBackgroundColor = uptrendIconBackgroundColorRaw || uptrend_icon_background_color || '#e8eaf6';
  if (typeof finalUptrendIconBackgroundColor === 'object' && finalUptrendIconBackgroundColor !== null) {
    if ('r' in finalUptrendIconBackgroundColor && 'g' in finalUptrendIconBackgroundColor && 'b' in finalUptrendIconBackgroundColor) {
      const { r, g, b, a = 1 } = finalUptrendIconBackgroundColor as { r: number; g: number; b: number; a?: number };
      finalUptrendIconBackgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      finalUptrendIconBackgroundColor = '#e8eaf6';
    }
  } else if (typeof finalUptrendIconBackgroundColor !== 'string') {
    finalUptrendIconBackgroundColor = '#e8eaf6';
  }

  // Handle uptrend text color
  let finalUptrendIconTextColor = uptrendIconTextColorRaw || uptrend_icon_text_color;
  if (typeof finalUptrendIconTextColor === 'object' && finalUptrendIconTextColor !== null) {
    if ('r' in finalUptrendIconTextColor && 'g' in finalUptrendIconTextColor && 'b' in finalUptrendIconTextColor) {
      const { r, g, b, a = 1 } = finalUptrendIconTextColor as { r: number; g: number; b: number; a?: number };
      finalUptrendIconTextColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      finalUptrendIconTextColor = undefined;
    }
  } else if (typeof finalUptrendIconTextColor !== 'string' && finalUptrendIconTextColor !== undefined) {
    finalUptrendIconTextColor = undefined;
  }
  
  // Handle downtrend icon properties
  const finalDowntrendIconType = downtrendIconType || downtrend_icon_type || 'url';
  let finalDowntrendIconUrl = downtrendIconUrl || downtrend_icon_url || '';
  const finalDowntrendIconShape = downtrendIconShape || downtrend_icon_shape || 'circle';
  let finalDowntrendIconBackgroundColor = downtrendIconBackgroundColorRaw || downtrend_icon_background_color || '#e8eaf6';
  if (typeof finalDowntrendIconBackgroundColor === 'object' && finalDowntrendIconBackgroundColor !== null) {
    if ('r' in finalDowntrendIconBackgroundColor && 'g' in finalDowntrendIconBackgroundColor && 'b' in finalDowntrendIconBackgroundColor) {
      const { r, g, b, a = 1 } = finalDowntrendIconBackgroundColor as { r: number; g: number; b: number; a?: number };
      finalDowntrendIconBackgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      finalDowntrendIconBackgroundColor = '#e8eaf6';
    }
  } else if (typeof finalDowntrendIconBackgroundColor !== 'string') {
    finalDowntrendIconBackgroundColor = '#e8eaf6';
  }

  // Handle downtrend text color
  let finalDowntrendIconTextColor = downtrendIconTextColorRaw || downtrend_icon_text_color;
  if (typeof finalDowntrendIconTextColor === 'object' && finalDowntrendIconTextColor !== null) {
    if ('r' in finalDowntrendIconTextColor && 'g' in finalDowntrendIconTextColor && 'b' in finalDowntrendIconTextColor) {
      const { r, g, b, a = 1 } = finalDowntrendIconTextColor as { r: number; g: number; b: number; a?: number };
      finalDowntrendIconTextColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      finalDowntrendIconTextColor = undefined;
    }
  } else if (typeof finalDowntrendIconTextColor !== 'string' && finalDowntrendIconTextColor !== undefined) {
    finalDowntrendIconTextColor = undefined;
  }

  const finalShowNeutralTrendChip =
    showNeutralTrendChip ?? show_neutral_trend_chip ?? true;
  const finalNeutralIconType = neutralIconType || neutral_icon_type || 'url';
  let finalNeutralIconUrl = neutralIconUrl || neutral_icon_url || '';
  const finalNeutralIconShape = neutralIconShape || neutral_icon_shape || 'circle';
  let finalNeutralIconBackgroundColor = neutralIconBackgroundColorRaw || neutral_icon_background_color || '#e8eaf6';
  if (typeof finalNeutralIconBackgroundColor === 'object' && finalNeutralIconBackgroundColor !== null) {
    if ('r' in finalNeutralIconBackgroundColor && 'g' in finalNeutralIconBackgroundColor && 'b' in finalNeutralIconBackgroundColor) {
      const { r, g, b, a = 1 } = finalNeutralIconBackgroundColor as { r: number; g: number; b: number; a?: number };
      finalNeutralIconBackgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      finalNeutralIconBackgroundColor = '#e8eaf6';
    }
  } else if (typeof finalNeutralIconBackgroundColor !== 'string') {
    finalNeutralIconBackgroundColor = '#e8eaf6';
  }

  let finalNeutralIconTextColor = neutralIconTextColorRaw || neutral_icon_text_color;
  if (typeof finalNeutralIconTextColor === 'object' && finalNeutralIconTextColor !== null) {
    if ('r' in finalNeutralIconTextColor && 'g' in finalNeutralIconTextColor && 'b' in finalNeutralIconTextColor) {
      const { r, g, b, a = 1 } = finalNeutralIconTextColor as { r: number; g: number; b: number; a?: number };
      finalNeutralIconTextColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      finalNeutralIconTextColor = undefined;
    }
  } else if (typeof finalNeutralIconTextColor !== 'string' && finalNeutralIconTextColor !== undefined) {
    finalNeutralIconTextColor = undefined;
  }

  const finalTrendComparisonPosition =
    trendComparisonPosition || trend_comparison_position || 'top';
  const finalTrendComparisonShape =
    trendComparisonShape || trend_comparison_shape || 'pill';
  const finalTrendComparisonSize =
    trendComparisonSize || trend_comparison_size || 'large';
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
  
  if (enableClickableCard) {
    let urlValue: string | undefined;
    
    // Strategy 1: Use manual URL from formData (highest priority)
    if (clickableCardUrl) {
      urlValue = clickableCardUrl;
    }
    // Strategy 2: Try to get from second query (dynamic URL query)
    else if (urlColumn && queriesData.length > 1) {
      const urlQueryData = queriesData[1];
      
      if (urlQueryData?.data && urlQueryData.data.length > 0) {
        const urlRow = urlQueryData.data[0];
        
        // Try direct lookup
        urlValue = urlRow[urlColumn];
        
        if (!urlValue) {
          // If not found by exact name, try first available column value
          const firstColumnValue = Object.values(urlRow)[0] as string;
          if (typeof firstColumnValue === 'string') {
            urlValue = firstColumnValue;
          }
        }
      }
    }
    // Strategy 3: Try to get from first query (backward compatibility)
    else if (urlColumn && data.length > 0) {
      // Try direct lookup
      urlValue = data[0][urlColumn];
      
      // If not found, try with common aggregation prefixes
      if (!urlValue) {
        const aggregations = ['MAX', 'MIN', 'ANY_VALUE', 'FIRST', 'LAST'];
        for (const agg of aggregations) {
          const aggColumnName = `${agg}(${urlColumn})`;
          if (data[0][aggColumnName]) {
            urlValue = data[0][aggColumnName];
            break;
          }
        }
      }
    }
    
    if (urlValue && typeof urlValue === 'string') {
      redirectUrl = urlValue;
    }
  }

  // Handle icon URL - use uploaded file if available, otherwise use provided URL
  let processedIconUrl = finalIconUrl || '';
  if (finalShowIcon && iconType === 'upload' && iconUpload) {
    // Additional validation for uploaded files
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    const minSize = 1024; // 1KB
    
    if (!allowedTypes.includes(iconUpload.type)) {
      processedIconUrl = '';
    } else if (iconUpload.size > maxSize) {
      processedIconUrl = '';
    } else if (iconUpload.size < minSize) {
      processedIconUrl = '';
    } else {
      // Convert uploaded file to data URL
      processedIconUrl = URL.createObjectURL(iconUpload);
    }
  } else if (finalShowIcon && iconType === 'url' && finalIconUrl) {
    // Validate URL format
    try {
      new URL(finalIconUrl);
      processedIconUrl = finalIconUrl;
    } catch {
      processedIconUrl = '';
    }
  }
  
  // Handle uptrend icon URL
  let processedUptrendIconUrl = finalUptrendIconUrl || '';
  if (finalUptrendIconType === 'upload' && (uptrendIconUpload || uptrend_icon_upload)) {
    const uploadFile = uptrendIconUpload || uptrend_icon_upload;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif'];
    const maxSize = 2 * 1024 * 1024;
    const minSize = 1024;
    
    if (uploadFile && allowedTypes.includes(uploadFile.type) && uploadFile.size >= minSize && uploadFile.size <= maxSize) {
      processedUptrendIconUrl = URL.createObjectURL(uploadFile);
    }
  } else if (finalUptrendIconType === 'url' && finalUptrendIconUrl) {
    try {
      new URL(finalUptrendIconUrl);
      processedUptrendIconUrl = finalUptrendIconUrl;
    } catch {
      processedUptrendIconUrl = '';
    }
  }
  
  // Handle downtrend icon URL
  let processedDowntrendIconUrl = finalDowntrendIconUrl || '';
  if (finalDowntrendIconType === 'upload' && (downtrendIconUpload || downtrend_icon_upload)) {
    const uploadFile = downtrendIconUpload || downtrend_icon_upload;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif'];
    const maxSize = 2 * 1024 * 1024;
    const minSize = 1024;
    
    if (uploadFile && allowedTypes.includes(uploadFile.type) && uploadFile.size >= minSize && uploadFile.size <= maxSize) {
      processedDowntrendIconUrl = URL.createObjectURL(uploadFile);
    }
  } else if (finalDowntrendIconType === 'url' && finalDowntrendIconUrl) {
    try {
      new URL(finalDowntrendIconUrl);
      processedDowntrendIconUrl = finalDowntrendIconUrl;
    } catch {
      processedDowntrendIconUrl = '';
    }
  }

  let processedNeutralIconUrl = '';
  if (finalNeutralIconType === 'upload' && (neutralIconUpload || neutral_icon_upload)) {
    const uploadFile = neutralIconUpload || neutral_icon_upload;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif'];
    const maxSize = 2 * 1024 * 1024;
    const minSize = 1024;

    if (uploadFile && allowedTypes.includes(uploadFile.type) && uploadFile.size >= minSize && uploadFile.size <= maxSize) {
      processedNeutralIconUrl = URL.createObjectURL(uploadFile);
    }
  } else if (finalNeutralIconType === 'url' && finalNeutralIconUrl) {
    try {
      new URL(finalNeutralIconUrl);
      processedNeutralIconUrl = finalNeutralIconUrl;
    } catch {
      processedNeutralIconUrl = '';
    }
  }

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
    showIcon: finalShowIcon,
    iconType,
    iconUrl: processedIconUrl,
    iconSize: finalIconSize,
    iconBackgroundColor: finalIconBackgroundColor,
    iconShape: finalIconShape,
    iconPosition: finalIconPosition,
    // Uptrend/Downtrend icon properties
    uptrendIconType: finalUptrendIconType,
    uptrendIconUrl: processedUptrendIconUrl,
    uptrendIconBackgroundColor: finalUptrendIconBackgroundColor,
    uptrendIconTextColor: finalUptrendIconTextColor,
    uptrendIconShape: finalUptrendIconShape,
    downtrendIconType: finalDowntrendIconType,
    downtrendIconUrl: processedDowntrendIconUrl,
    downtrendIconBackgroundColor: finalDowntrendIconBackgroundColor,
    downtrendIconTextColor: finalDowntrendIconTextColor,
    downtrendIconShape: finalDowntrendIconShape,
    showNeutralTrendChip: finalShowNeutralTrendChip,
    neutralIconType: finalNeutralIconType,
    neutralIconUrl: processedNeutralIconUrl,
    neutralIconBackgroundColor: finalNeutralIconBackgroundColor,
    neutralIconTextColor: finalNeutralIconTextColor,
    neutralIconShape: finalNeutralIconShape,
    trendComparisonPosition: finalTrendComparisonPosition,
    trendComparisonShape: finalTrendComparisonShape,
    trendComparisonSize: finalTrendComparisonSize,
  };
}
