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
  ColorFormatters,
  getColorFormatters,
  Metric,
} from '@superset-ui/chart-controls';
import {
  GenericDataType,
  getMetricLabel,
  extractTimegrain,
  QueryFormData,
  getValueFormatter,
} from '@superset-ui/core';
import { BigNumberTotalChartProps, BigNumberVizProps } from '../types';
import { getDateFormatter, parseMetricValue } from '../utils';
import { Refs } from '../../types';

export default function transformProps(
  chartProps: BigNumberTotalChartProps,
): BigNumberVizProps {
  const {
    width,
    height,
    queriesData,
    formData,
    rawFormData,
    hooks,
    datasource: { currencyFormats = {}, columnFormats = {} },
  } = chartProps;
  
  // Get description from chartProps (passed from ChartRenderer)
  const description = (chartProps as any).description || formData?.description || '';
  
  const {
    headerFontSize,
    metric = 'value',
    subheader = '',
    subheaderFontSize,
    forceTimestampFormatting,
    timeFormat,
    yAxisFormat,
    conditionalFormatting,
    currencyFormat,
    enableDetailOnHover = true,
    enableClickableCard = false,
    urlColumn,
    clickableCardUrl,
    hoverBorderEnabled = false,
    hoverBorderThickness = 2,
    hoverBorderColor = '#1890ff',
    infoIconUrl = '',
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
    uptrendIconBackgroundColor: uptrendIconBackgroundColorRaw,
    uptrendIconTextColor: uptrendIconTextColorRaw,
    uptrendIconShape = 'circle',
    downtrendIconType = 'url',
    downtrendIconUrl = '',
    downtrendIconUpload = null,
    downtrendIconBackgroundColor: downtrendIconBackgroundColorRaw,
    downtrendIconTextColor: downtrendIconTextColorRaw,
    downtrendIconShape = 'circle',
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
  let finalUptrendIconBackgroundColor = uptrendIconBackgroundColorRaw || uptrend_icon_background_color;
  if (typeof finalUptrendIconBackgroundColor === 'object' && finalUptrendIconBackgroundColor !== null) {
    if ('r' in finalUptrendIconBackgroundColor && 'g' in finalUptrendIconBackgroundColor && 'b' in finalUptrendIconBackgroundColor) {
      const { r, g, b, a = 0 } = finalUptrendIconBackgroundColor as { r: number; g: number; b: number; a?: number };
      finalUptrendIconBackgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      finalUptrendIconBackgroundColor = 'transparent';
    }
  } else if (typeof finalUptrendIconBackgroundColor !== 'string') {
    finalUptrendIconBackgroundColor = 'transparent';
  }
  
  // Handle uptrend text color
  let finalUptrendIconTextColor = uptrendIconTextColorRaw || uptrend_icon_text_color;
  if (typeof finalUptrendIconTextColor === 'object' && finalUptrendIconTextColor !== null) {
    if ('r' in finalUptrendIconTextColor && 'g' in finalUptrendIconTextColor && 'b' in finalUptrendIconTextColor) {
      const { r, g, b, a = 1 } = finalUptrendIconTextColor as { r: number; g: number; b: number; a?: number };
      finalUptrendIconTextColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      finalUptrendIconTextColor = undefined; // Use default
    }
  } else if (typeof finalUptrendIconTextColor !== 'string' && finalUptrendIconTextColor !== undefined) {
    finalUptrendIconTextColor = undefined; // Use default
  }
  
  // Handle downtrend icon properties
  const finalDowntrendIconType = downtrendIconType || downtrend_icon_type || 'url';
  let finalDowntrendIconUrl = downtrendIconUrl || downtrend_icon_url || '';
  const finalDowntrendIconShape = downtrendIconShape || downtrend_icon_shape || 'circle';
  let finalDowntrendIconBackgroundColor = downtrendIconBackgroundColorRaw || downtrend_icon_background_color;
  if (typeof finalDowntrendIconBackgroundColor === 'object' && finalDowntrendIconBackgroundColor !== null) {
    if ('r' in finalDowntrendIconBackgroundColor && 'g' in finalDowntrendIconBackgroundColor && 'b' in finalDowntrendIconBackgroundColor) {
      const { r, g, b, a = 0 } = finalDowntrendIconBackgroundColor as { r: number; g: number; b: number; a?: number };
      finalDowntrendIconBackgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      finalDowntrendIconBackgroundColor = 'transparent';
    }
  } else if (typeof finalDowntrendIconBackgroundColor !== 'string') {
    finalDowntrendIconBackgroundColor = 'transparent';
  }
  
  // Handle downtrend text color
  let finalDowntrendIconTextColor = downtrendIconTextColorRaw || downtrend_icon_text_color;
  if (typeof finalDowntrendIconTextColor === 'object' && finalDowntrendIconTextColor !== null) {
    if ('r' in finalDowntrendIconTextColor && 'g' in finalDowntrendIconTextColor && 'b' in finalDowntrendIconTextColor) {
      const { r, g, b, a = 1 } = finalDowntrendIconTextColor as { r: number; g: number; b: number; a?: number };
      finalDowntrendIconTextColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      finalDowntrendIconTextColor = undefined; // Use default
    }
  } else if (typeof finalDowntrendIconTextColor !== 'string' && finalDowntrendIconTextColor !== undefined) {
    finalDowntrendIconTextColor = undefined; // Use default
  }
  
  const finalTrendComparisonPosition =
    trendComparisonPosition || trend_comparison_position || 'top';
  const finalTrendComparisonShape =
    trendComparisonShape || trend_comparison_shape || 'pill';
  const finalTrendComparisonSize =
    trendComparisonSize || trend_comparison_size || 'large';

  const refs: Refs = {};
  const { data = [], coltypes = [] } = queriesData[0];
  const granularity = extractTimegrain(rawFormData as QueryFormData);
  const metricName = getMetricLabel(metric);
  const formattedSubheader = subheader;
  const bigNumber =
    data.length === 0 ? null : parseMetricValue(data[0][metricName]);

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
  

  // Handle comparison data if available and time comparison is enabled
  let previousPeriodValue: number | null = null;
  let percentageChange: number | undefined;
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

        if (rawValue !== null && rawValue !== undefined) {
          previousPeriodValue = parseMetricValue(rawValue);

          if (previousPeriodValue !== null) {
            // Handle special cases
            if (previousPeriodValue === 0) {
              if (bigNumber === null || bigNumber === 0) {
                // Both values are 0 or current is null - no change or neutral
                percentageChange = 0;
                comparisonIndicator = 'neutral';
              } else if (bigNumber > 0) {
                // Previous was 0, now positive - infinite growth, treat as positive
                percentageChange = 1; // 100% change as maximum
                comparisonIndicator = 'positive';
              } else {
                // Previous was 0, now negative - treat as negative
                percentageChange = -1; // -100% change as minimum
                comparisonIndicator = 'negative';
              }
            } else if (bigNumber === null || bigNumber === 0) {
              // Current value is null or 0 but previous had value - complete loss
              percentageChange = -1; // -100% change (complete loss)
              comparisonIndicator = 'negative';
            } else {
              // Normal calculation when both values are non-zero
              percentageChange =
                (bigNumber - previousPeriodValue) /
                Math.abs(previousPeriodValue);

              if (percentageChange > 0) {
                comparisonIndicator = 'positive';
              } else if (percentageChange < 0) {
                comparisonIndicator = 'negative';
              } else {
                comparisonIndicator = 'neutral';
              }
            }

            break; // Found valid comparison data, exit loop
          }
        }
      }
    }
  }

  let metricEntry: Metric | undefined;
  if (chartProps.datasource?.metrics) {
    metricEntry = chartProps.datasource.metrics.find(
      metricItem => metricItem.metric_name === metric,
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
    coltypes[0] === GenericDataType.Temporal ||
    coltypes[0] === GenericDataType.String ||
    forceTimestampFormatting
      ? formatTime
      : numberFormatter;

  const { onContextMenu } = hooks;

  const defaultColorFormatters = [] as ColorFormatters;

  const colorThresholdFormatters =
    getColorFormatters(conditionalFormatting, data, false) ??
    defaultColorFormatters;

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

  const returnProps = {
    width,
    height,
    bigNumber,
    headerFormatter,
    headerFontSize,
    subheaderFontSize,
    subheader: formattedSubheader,
    onContextMenu,
    refs,
    colorThresholdFormatters,
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
    infoIconUrl: infoIconUrl || '',
    description,
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
    trendComparisonPosition: finalTrendComparisonPosition,
    trendComparisonShape: finalTrendComparisonShape,
    trendComparisonSize: finalTrendComparisonSize,
  };

  return returnProps;
}
