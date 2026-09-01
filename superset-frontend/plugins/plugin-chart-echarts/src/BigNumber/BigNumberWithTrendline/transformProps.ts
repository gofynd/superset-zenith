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
  
  // Get description from chartProps (passed from ChartRenderer)
  const description = (chartProps as any).description || formData?.description || '';
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
      finalUptrendIconTextColor = undefined;
    }
  } else if (typeof finalUptrendIconTextColor !== 'string' && finalUptrendIconTextColor !== undefined) {
    finalUptrendIconTextColor = undefined;
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
  let finalNeutralIconBackgroundColor = neutralIconBackgroundColorRaw || neutral_icon_background_color;
  if (typeof finalNeutralIconBackgroundColor === 'object' && finalNeutralIconBackgroundColor !== null) {
    if ('r' in finalNeutralIconBackgroundColor && 'g' in finalNeutralIconBackgroundColor && 'b' in finalNeutralIconBackgroundColor) {
      const { r, g, b, a = 0 } = finalNeutralIconBackgroundColor as { r: number; g: number; b: number; a?: number };
      finalNeutralIconBackgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      finalNeutralIconBackgroundColor = 'transparent';
    }
  } else if (typeof finalNeutralIconBackgroundColor !== 'string') {
    finalNeutralIconBackgroundColor = 'transparent';
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
