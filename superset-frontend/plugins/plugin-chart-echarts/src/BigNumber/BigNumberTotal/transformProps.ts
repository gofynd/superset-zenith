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
    showIcon = false,
    iconType = 'url',
    iconUrl = '',
    iconUpload = null,
    iconSize = 'medium',
  } = formData;
  const refs: Refs = {};
  const { data = [], coltypes = [] } = queriesData[0];
  const granularity = extractTimegrain(rawFormData as QueryFormData);
  const metricName = getMetricLabel(metric);
  const formattedSubheader = subheader;
  const bigNumber =
    data.length === 0 ? null : parseMetricValue(data[0][metricName]);

  // Extract URL for clickable card feature
  let redirectUrl: string | undefined;
  if (enableClickableCard && urlColumn && data.length > 0) {
    const urlValue = data[0][urlColumn];
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
    showIcon,
    iconType,
    iconUrl: finalIconUrl,
    iconSize,
  };

  return returnProps;
}
